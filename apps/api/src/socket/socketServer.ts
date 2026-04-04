import { Server as SocketIOServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import { verifyToken } from '../services/jwtUtils.js';
import type { DiceService } from '../services/DiceService.js';
import type { GameLogService } from '../services/GameLogService.js';
import type { CombatService } from '../services/CombatService.js';
import type { SpellcastingService } from '../services/SpellcastingService.js';
import type { RestService } from '../services/RestService.js';
import type { ClassFeatureService } from '../services/ClassFeatureService.js';
import type { InspirationService } from '../services/InspirationService.js';
import type { STTService } from '../services/STTService.js';
import type { DiceRollMode, ConditionName, CastSpellParams, RestType, DiceResult } from '@local-dungeon/shared';
import { parseVoiceCommand } from '@local-dungeon/shared';

interface SocketServerDeps {
  redis: Redis;
  diceService: DiceService;
  gameLogService: GameLogService;
  combatService: CombatService;
  spellcastingService: SpellcastingService;
  restService: RestService;
  classFeatureService: ClassFeatureService;
  inspirationService: InspirationService;
  sttService: STTService;
}

export function createSocketServer(
  httpServer: unknown,
  { redis, diceService, gameLogService, combatService, spellcastingService, restService, classFeatureService, inspirationService, sttService }: SocketServerDeps,
) {
  const io = new SocketIOServer(httpServer as any, {
    cors: { origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000', credentials: true },
    transports: ['websocket', 'polling'],
  });

  const pubClient = redis.duplicate();
  const subClient = redis.duplicate();
  io.adapter(createAdapter(pubClient, subClient));

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error('Authentication required'));
    try {
      const payload = verifyToken(token, process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret');
      (socket as any).userId = payload.sub;
      (socket as any).username = payload.username;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = (socket as any).userId as string;
    const username = (socket as any).username as string;
    let currentSessionId: string | null = null;

    socket.on('session:join', async (data: { sessionId: string }) => {
      currentSessionId = data.sessionId;
      const roomName = `session:${data.sessionId}`;
      await socket.join(roomName);
      await redis.sadd(`session:${data.sessionId}:players`, userId);
      const players = await redis.smembers(`session:${data.sessionId}:players`);
      io.to(roomName).emit('session:players_updated', { players });

      try {
        const entry = await gameLogService.logEvent({
          sessionId: data.sessionId,
          type: 'session_join',
          actorId: userId,
          actorName: username,
          payload: {},
          isPrivate: false,
        });
        io.to(roomName).emit('game:log_entry', entry);
      } catch {
        // non-critical
      }
    });

    socket.on('session:leave', async (data: { sessionId: string }) => {
      const roomName = `session:${data.sessionId}`;
      await socket.leave(roomName);
      await redis.srem(`session:${data.sessionId}:players`, userId);
      const players = await redis.smembers(`session:${data.sessionId}:players`);
      io.to(roomName).emit('session:players_updated', { players });

      try {
        const entry = await gameLogService.logEvent({
          sessionId: data.sessionId,
          type: 'session_leave',
          actorId: userId,
          actorName: username,
          payload: {},
          isPrivate: false,
        });
        io.to(roomName).emit('game:log_entry', entry);
      } catch {
        // non-critical
      }
    });

    socket.on('game:ping', () => socket.emit('game:pong', { ts: Date.now() }));

    socket.on(
      'game:roll_dice',
      async (data: {
        notationStr: string;
        mode: DiceRollMode;
        isPrivate: boolean;
        characterName?: string;
        sessionId: string;
      }) => {
        try {
          const result = diceService.rollByString(data.notationStr, data.mode);
          const dicePayload = {
            result,
            rolledBy: userId,
            characterName: data.characterName,
            isPrivate: data.isPrivate,
            timestamp: new Date().toISOString(),
          };

          if (data.isPrivate) {
            socket.emit('game:dice_result', dicePayload);
          } else {
            io.to(`session:${data.sessionId}`).emit('game:dice_result', dicePayload);
          }

          const entry = await gameLogService.logEvent({
            sessionId: data.sessionId,
            type: 'dice_roll',
            actorId: userId,
            actorName: data.characterName ?? username,
            payload: {
              notation: data.notationStr,
              rolls: result.rolls,
              total: result.total,
              mode: data.mode,
            },
            isPrivate: data.isPrivate,
          });

          if (data.isPrivate) {
            socket.emit('game:log_entry', entry);
          } else {
            io.to(`session:${data.sessionId}`).emit('game:log_entry', entry);
          }
        } catch {
          socket.emit('game:error', { message: 'Invalid dice notation' });
        }
      },
    );

    socket.on(
      'game:chat',
      async (data: { message: string; sessionId: string; characterName?: string }) => {
        if (typeof data.message !== 'string' || data.message.trim().length === 0) {
          return socket.emit('game:error', { message: 'Message cannot be empty' });
        }
        if (data.message.length > 500) {
          return socket.emit('game:error', { message: 'Message too long (max 500 chars)' });
        }

        try {
          const entry = await gameLogService.logEvent({
            sessionId: data.sessionId,
            type: 'chat',
            actorId: userId,
            actorName: data.characterName ?? username,
            payload: { message: data.message.trim() },
            isPrivate: false,
          });
          io.to(`session:${data.sessionId}`).emit('game:log_entry', entry);
        } catch {
          socket.emit('game:error', { message: 'Failed to send message' });
        }
      },
    );

    socket.on('disconnect', async () => {
      // Don't remove from Redis immediately — Phase 8 handles reconnect grace period
      if (sttService.isListening(socket.id)) {
        await sttService.stopListening(socket.id).catch(() => {});
      }
    });

    // ─── Voice Events ─────────────────────────────────────────────────────────

    socket.on('voice:start', async () => {
      if (!currentSessionId) return socket.emit('game:error', { message: 'Not in a session' });
      try {
        const emitToSocket = (event: string, data: unknown) => {
          socket.emit(event as any, data);
          if (
            event === 'voice:transcript' &&
            typeof data === 'object' && data !== null &&
            (data as any).isFinal === true
          ) {
            const text: string = (data as any).text ?? '';
            const command = parseVoiceCommand(text, { knownSpells: [], sessionPlayerNames: [] });
            if (command.confidence >= 0.3 && command.intent !== 'chat') {
              socket.emit('command:parsed', { command });
            }
          }
        };
        await sttService.startListening(
          socket.id,
          currentSessionId,
          emitToSocket,
          (event, data) => io.to(`session:${currentSessionId}`).emit(event as any, data),
        );
        socket.emit('voice:started', {});
      } catch {
        socket.emit('game:error', { message: 'Failed to start voice recognition' });
      }
    });

    socket.on('voice:audio_chunk', async (data: { audio: number[]; sampleRate: number }) => {
      try {
        await sttService.sendAudioChunk(socket.id, Buffer.from(data.audio), data.sampleRate);
      } catch {
        socket.emit('game:error', { message: 'Failed to process audio chunk' });
      }
    });

    socket.on('voice:stop', async () => {
      try {
        await sttService.stopListening(socket.id);
        socket.emit('voice:stopped', {});
      } catch {
        socket.emit('game:error', { message: 'Failed to stop voice recognition' });
      }
    });

    // ─── Combat Events ───────────────────────────────────────────────────────

    socket.on('combat:init', async (data: { sessionId: string; combatants: any[] }) => {
      try {
        const state = await combatService.initCombat(data.sessionId, data.combatants);
        io.to(`session:${data.sessionId}`).emit('combat:state', state);
      } catch {
        socket.emit('game:error', { message: 'Failed to initialize combat' });
      }
    });

    socket.on('combat:start', async (data: { sessionId: string }) => {
      try {
        const state = await combatService.startCombat(data.sessionId);
        io.to(`session:${data.sessionId}`).emit('combat:state', state);
      } catch {
        socket.emit('game:error', { message: 'Failed to start combat' });
      }
    });

    socket.on('combat:end', async (data: { sessionId: string }) => {
      try {
        const state = await combatService.endCombat(data.sessionId);
        io.to(`session:${data.sessionId}`).emit('combat:state', state);
      } catch {
        socket.emit('game:error', { message: 'Failed to end combat' });
      }
    });

    socket.on('combat:damage', async (data: { sessionId: string; combatantId: string; damage: number }) => {
      try {
        const state = await combatService.applyDamage(data.sessionId, data.combatantId, data.damage, userId);
        io.to(`session:${data.sessionId}`).emit('combat:state', state);
      } catch {
        socket.emit('game:error', { message: 'Failed to apply damage' });
      }
    });

    socket.on('combat:heal', async (data: { sessionId: string; combatantId: string; amount: number }) => {
      try {
        const state = await combatService.applyHealing(data.sessionId, data.combatantId, data.amount, userId);
        io.to(`session:${data.sessionId}`).emit('combat:state', state);
      } catch {
        socket.emit('game:error', { message: 'Failed to apply healing' });
      }
    });

    socket.on('combat:condition_add', async (data: { sessionId: string; combatantId: string; condition: ConditionName }) => {
      try {
        const state = await combatService.addCondition(data.sessionId, data.combatantId, data.condition, userId);
        io.to(`session:${data.sessionId}`).emit('combat:state', state);
      } catch {
        socket.emit('game:error', { message: 'Failed to add condition' });
      }
    });

    socket.on('combat:condition_remove', async (data: { sessionId: string; combatantId: string; condition: ConditionName }) => {
      try {
        const state = await combatService.removeCondition(data.sessionId, data.combatantId, data.condition, userId);
        io.to(`session:${data.sessionId}`).emit('combat:state', state);
      } catch {
        socket.emit('game:error', { message: 'Failed to remove condition' });
      }
    });

    socket.on('combat:next_turn', async (data: { sessionId: string }) => {
      try {
        const state = await combatService.advanceTurn(data.sessionId, userId);
        io.to(`session:${data.sessionId}`).emit('combat:state', state);
      } catch {
        socket.emit('game:error', { message: 'Failed to advance turn' });
      }
    });

    socket.on('combat:death_save', async (data: { sessionId: string; combatantId: string; success: boolean }) => {
      try {
        const state = await combatService.recordDeathSave(data.sessionId, data.combatantId, data.success, userId);
        io.to(`session:${data.sessionId}`).emit('combat:state', state);
      } catch {
        socket.emit('game:error', { message: 'Failed to record death save' });
      }
    });

    socket.on('combat:get_state', async (data: { sessionId: string }) => {
      try {
        const state = await combatService.getState(data.sessionId);
        socket.emit('combat:state', state ?? { isActive: false });
      } catch {
        socket.emit('game:error', { message: 'Failed to get combat state' });
      }
    });

    socket.on(
      'combat:record_death_save',
      async (data: { sessionId: string; combatantId: string; roll: number }) => {
        try {
          const result = await combatService.recordDeathSaveRoll(
            data.sessionId,
            data.combatantId,
            data.roll,
            userId,
          );
          socket.emit('combat:death_save_result', {
            combatantId: data.combatantId,
            roll: result.roll,
            successes: result.successes,
            failures: result.failures,
            outcome: result.outcome,
          });
          io.to(`session:${data.sessionId}`).emit('combat:state', result.state);
          if (result.outcome !== 'none') {
            io.to(`session:${data.sessionId}`).emit('combat:death_save_outcome', {
              combatantId: data.combatantId,
              outcome: result.outcome,
            });
          }
        } catch {
          socket.emit('game:error', { message: 'Failed to record death save' });
        }
      },
    );

    socket.on('combat:stabilize', async (data: { sessionId: string; combatantId: string }) => {
      try {
        const state = await combatService.stabilize(data.sessionId, data.combatantId, userId);
        io.to(`session:${data.sessionId}`).emit('combat:state', state);
        io.to(`session:${data.sessionId}`).emit('combat:death_save_outcome', {
          combatantId: data.combatantId,
          outcome: 'stable',
        });
      } catch {
        socket.emit('game:error', { message: 'Failed to stabilize combatant' });
      }
    });

    // ─── Spellcasting Events ─────────────────────────────────────────────────

    socket.on('spell:cast', async (data: { sessionId: string; combatantId: string; params: CastSpellParams }) => {
      try {
        const combatant = await spellcastingService.castSpell(data.sessionId, data.combatantId, data.params);
        io.to(`session:${data.sessionId}`).emit('spell:cast_result', { combatant });
        await gameLogService.logEvent({
          sessionId: data.sessionId,
          type: 'system',
          actorId: userId,
          actorName: username,
          payload: { message: `${combatant.name} cast ${data.params.spellName}` },
        });
      } catch (err: any) {
        socket.emit('game:error', { message: err?.message ?? 'Failed to cast spell' });
      }
    });

    socket.on('spell:end_concentration', async (data: { sessionId: string; combatantId: string }) => {
      try {
        const combatant = await spellcastingService.endConcentration(data.sessionId, data.combatantId);
        io.to(`session:${data.sessionId}`).emit('spell:concentration_ended', { combatant });
      } catch {
        socket.emit('game:error', { message: 'Failed to end concentration' });
      }
    });

    socket.on('spell:concentration_save', async (data: { sessionId: string; combatantId: string; roll: number; damage: number }) => {
      try {
        const result = await spellcastingService.concentrationSave(data.sessionId, data.combatantId, data.roll, data.damage);
        socket.emit('spell:concentration_save_result', result);
      } catch {
        socket.emit('game:error', { message: 'Failed to process concentration save' });
      }
    });

    // ─── Rest Events ──────────────────────────────────────────────────────────

    socket.on('rest:propose', async (data: { sessionId: string; restType: RestType; requiredCount?: number }) => {
      try {
        const players = await redis.smembers(`session:${data.sessionId}:players`);
        const requiredCount = data.requiredCount ?? Math.max(1, players.length);
        const proposal = await restService.proposeRest(
          data.sessionId,
          userId,
          data.restType,
          requiredCount,
        );
        io.to(`session:${data.sessionId}`).emit('rest:proposed', { proposal });
      } catch {
        socket.emit('game:error', { message: 'Failed to propose rest' });
      }
    });

    socket.on('rest:confirm', async (data: { sessionId: string }) => {
      try {
        const { proposal, executed } = await restService.confirmRest(data.sessionId, userId);
        if (executed) {
          io.to(`session:${data.sessionId}`).emit('rest:executed', { proposal });
        } else {
          io.to(`session:${data.sessionId}`).emit('rest:confirmation_update', { proposal });
        }
      } catch (err: any) {
        socket.emit('game:error', { message: err?.message ?? 'Failed to confirm rest' });
      }
    });

    socket.on('rest:cancel', async (data: { sessionId: string }) => {
      try {
        await restService.cancelRest(data.sessionId);
        io.to(`session:${data.sessionId}`).emit('rest:cancelled', { sessionId: data.sessionId });
      } catch {
        socket.emit('game:error', { message: 'Failed to cancel rest' });
      }
    });

    socket.on('rest:spend_hit_dice', async (data: { sessionId: string; combatantId: string; diceCount: number }) => {
      try {
        const result = await restService.spendHitDice(data.sessionId, data.combatantId, data.diceCount);
        socket.emit('rest:hit_dice_result', { combatantId: data.combatantId, ...result });
      } catch (err: any) {
        socket.emit('game:error', { message: err?.message ?? 'Failed to spend hit dice' });
      }
    });

    // ─── Class Feature Events ─────────────────────────────────────────────────

    socket.on(
      'feature:use_resource',
      async (data: { sessionId: string; combatantId: string; resourceId: string; amount?: number }) => {
        try {
          const resources = await classFeatureService.useResource(
            data.sessionId,
            data.combatantId,
            data.resourceId,
            data.amount,
          );
          io.to(`session:${data.sessionId}`).emit('feature:resource_used', {
            combatantId: data.combatantId,
            resourceId: data.resourceId,
            resources,
          });
        } catch (err: any) {
          socket.emit('game:error', { message: err?.message ?? 'Failed to use resource' });
        }
      },
    );

    socket.on(
      'feature:init_resources',
      async (data: { sessionId: string; combatantId: string; classLevels: Record<string, number>; profBonus: number }) => {
        try {
          const resources = await classFeatureService.initResources(
            data.sessionId,
            data.combatantId,
            data.classLevels,
            data.profBonus,
          );
          socket.emit('feature:resources_initialized', { combatantId: data.combatantId, resources });
        } catch {
          socket.emit('game:error', { message: 'Failed to initialize resources' });
        }
      },
    );

    // ─── Inspiration Events ──────────────────────────────────────────────────

    socket.on(
      'inspiration:use',
      async (data: { sessionId: string; combatantId: string; originalRoll: DiceResult; dieIndex: number }) => {
        try {
          const newResult = await diceService.rerollWithInspiration(
            data.combatantId,
            data.originalRoll,
            data.dieIndex,
          );
          socket.emit('inspiration:reroll_result', { combatantId: data.combatantId, result: newResult });
          io.to(`session:${data.sessionId}`).emit('inspiration:used', { combatantId: data.combatantId });
        } catch (err: any) {
          socket.emit('game:error', { message: err?.message ?? 'Failed to use inspiration' });
        }
      },
    );

    socket.on(
      'inspiration:gift',
      async (data: { sessionId: string; fromCombatantId: string; toCombatantId: string }) => {
        try {
          await inspirationService.giftInspiration(data.fromCombatantId, data.toCombatantId);
          io.to(`session:${data.sessionId}`).emit('inspiration:gifted', {
            fromCombatantId: data.fromCombatantId,
            toCombatantId: data.toCombatantId,
          });
        } catch (err: any) {
          socket.emit('game:error', { message: err?.message ?? 'Failed to gift inspiration' });
        }
      },
    );
  });

  return io;
}

