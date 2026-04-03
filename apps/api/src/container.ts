import { createContainer, asValue, asClass, InjectionMode } from 'awilix';
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { PrismaUserRepository } from './repositories/PrismaUserRepository.js';
import { PrismaGameDataRepository } from './repositories/PrismaGameDataRepository.js';
import { PrismaCharacterRepository } from './repositories/PrismaCharacterRepository.js';
import { RedisSessionStateStore } from './repositories/RedisSessionStateStore.js';
import { AuthService } from './services/AuthService.js';
import { GameDataService } from './services/GameDataService.js';
import { CharacterService } from './services/CharacterService.js';
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
  });

  return container;
}

export type AppContainer = ReturnType<typeof buildContainer>;
