import { createContainer, asValue, asClass, InjectionMode } from 'awilix';
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { PrismaUserRepository } from './repositories/PrismaUserRepository.js';
import { PrismaGameDataRepository } from './repositories/PrismaGameDataRepository.js';
import { PrismaCharacterRepository } from './repositories/PrismaCharacterRepository.js';
import { RedisSessionStateStore } from './repositories/RedisSessionStateStore.js';
import { PrismaSessionRepository } from './repositories/PrismaSessionRepository.js';
import { PrismaGameEventRepository } from './repositories/PrismaGameEventRepository.js';
import { RedisSessionStore } from './repositories/RedisSessionStore.js';
import { AuthService } from './services/AuthService.js';
import { GameDataService } from './services/GameDataService.js';
import { CharacterService } from './services/CharacterService.js';
import { SessionService } from './services/SessionService.js';
import { DiceService } from './services/DiceService.js';
import { GameLogService } from './services/GameLogService.js';
import { CombatService } from './services/CombatService.js';
import { SpellcastingService } from './services/SpellcastingService.js';
import { RestService } from './services/RestService.js';
import { LevelUpService } from './services/LevelUpService.js';
import type { Env } from './env.js';

export function buildContainer(env: Env) {
  const container = createContainer({
    injectionMode: InjectionMode.PROXY,
  });

  const prisma = new PrismaClient({ datasources: { db: { url: env.DATABASE_URL } } });
  const redis = new Redis(env.REDIS_URL, { lazyConnect: true });
  redis.on('error', () => {});

  container.register({
    env: asValue(env),
    prisma: asValue(prisma),
    redis: asValue(redis),
    userRepository: asClass(PrismaUserRepository).scoped(),
    sessionStateStore: asClass(RedisSessionStateStore).scoped(),
    authService: asClass(AuthService).scoped(),
    gameDataRepository: asClass(PrismaGameDataRepository).scoped(),
    gameDataService: asClass(GameDataService).scoped(),
    characterRepository: asClass(PrismaCharacterRepository).scoped(),
    characterService: asClass(CharacterService).scoped(),
    sessionRepository: asClass(PrismaSessionRepository).scoped(),
    gameEventRepository: asClass(PrismaGameEventRepository).scoped(),
    redisSessionStore: asClass(RedisSessionStore).scoped(),
    sessionService: asClass(SessionService).scoped(),
    diceService: asClass(DiceService).scoped(),
    gameLogService: asClass(GameLogService).scoped(),
    combatService: asClass(CombatService).scoped(),
    spellcastingService: asClass(SpellcastingService).scoped(),
    restService: asClass(RestService).scoped(),
    levelUpService: asClass(LevelUpService).scoped(),
  });

  return container;
}

export type AppContainer = ReturnType<typeof buildContainer>;
