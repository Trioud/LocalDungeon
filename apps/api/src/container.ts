import { createContainer, asValue, asClass, InjectionMode } from 'awilix';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { PrismaUserRepository } from './repositories/PrismaUserRepository.js';
import { RedisSessionStateStore } from './repositories/RedisSessionStateStore.js';
import { AuthService } from './services/AuthService.js';
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
  });

  return container;
}

export type AppContainer = ReturnType<typeof buildContainer>;
