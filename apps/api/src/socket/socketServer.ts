import { Server as SocketIOServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import { verifyToken } from '../services/jwtUtils.js';
import type { DiceService } from '../services/DiceService.js';
import type { DiceRollMode } from '@local-dungeon/shared';

interface SocketServerDeps {
  redis: Redis;
  diceService: DiceService;
}

export function createSocketServer(httpServer: unknown, { redis, diceService }: SocketServerDeps) {
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

    socket.on('session:join', async (data: { sessionId: string }) => {
      const roomName = `session:${data.sessionId}`;
      await socket.join(roomName);
      const players = await redis.smembers(`session:${data.sessionId}:players`);
      io.to(roomName).emit('session:players_updated', { players });
    });

    socket.on('session:leave', async (data: { sessionId: string }) => {
      const roomName = `session:${data.sessionId}`;
      await socket.leave(roomName);
      await redis.srem(`session:${data.sessionId}:players`, userId);
      const players = await redis.smembers(`session:${data.sessionId}:players`);
      io.to(roomName).emit('session:players_updated', { players });
    });

    socket.on('game:ping', () => socket.emit('game:pong', { ts: Date.now() }));

    socket.on('game:roll_dice', (data: {
      notationStr: string;
      mode: DiceRollMode;
      isPrivate: boolean;
      characterName?: string;
      sessionId: string;
    }) => {
      try {
        const result = diceService.rollByString(data.notationStr, data.mode);
        const payload = {
          result,
          rolledBy: userId,
          characterName: data.characterName,
          isPrivate: data.isPrivate,
          timestamp: new Date().toISOString(),
        };
        if (data.isPrivate) {
          socket.emit('game:dice_result', payload);
        } else {
          io.to(`session:${data.sessionId}`).emit('game:dice_result', payload);
        }
      } catch {
        socket.emit('game:error', { message: 'Invalid dice notation' });
      }
    });

    socket.on('disconnect', async () => {
      // Don't remove from Redis immediately — Phase 8 handles reconnect grace period
    });
  });

  return io;
}
