import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from './AuthService.js';
import type { IUserRepository, User } from '../ports/IUserRepository.js';
import type { ISessionStateStore } from '../ports/ISessionStateStore.js';
import type { Env } from '../env.js';

const testEnv: Env = {
  NODE_ENV: 'test',
  PORT: 3001,
  DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
  REDIS_URL: 'redis://localhost:6379',
  JWT_ACCESS_SECRET: 'test-access-secret-that-is-long-enough-32chars',
  JWT_REFRESH_SECRET: 'test-refresh-secret-that-is-long-enough-32chars',
  CORS_ORIGIN: 'http://localhost:3000',
  STORAGE_PROVIDER: 'memory',
  STT_PROVIDER: 'mock',
  OLLAMA_URL: 'http://localhost:11434',
  OLLAMA_MODEL: 'mistral',
};

const mockUser: User = {
  id: 'user-1',
  username: 'alice',
  email: 'alice@example.com',
  passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYpwBAM6aN6JGgy',
  createdAt: new Date(),
  updatedAt: new Date(),
};

function makeUserRepo(overrides: Partial<IUserRepository> = {}): IUserRepository {
  return {
    findByEmail: vi.fn().mockResolvedValue(null),
    findById: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue(mockUser),
    ...overrides,
  };
}

function makeSessionStore(overrides: Partial<ISessionStateStore> = {}): ISessionStateStore {
  return {
    setRefreshToken: vi.fn().mockResolvedValue(undefined),
    getRefreshToken: vi.fn().mockResolvedValue(null),
    deleteRefreshToken: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('AuthService', () => {
  describe('register', () => {
    it('creates a user and returns public user (no passwordHash)', async () => {
      const userRepo = makeUserRepo();
      const sessionStore = makeSessionStore();
      const service = new AuthService({ userRepository: userRepo, sessionStateStore: sessionStore, env: testEnv });

      const result = await service.register('alice', 'alice@example.com', 'password123');

      expect(userRepo.create).toHaveBeenCalledOnce();
      expect(result).not.toHaveProperty('passwordHash');
      expect(result.username).toBe('alice');
    });

    it('throws 409 when email already taken', async () => {
      const userRepo = makeUserRepo({ findByEmail: vi.fn().mockResolvedValue(mockUser) });
      const service = new AuthService({ userRepository: userRepo, sessionStateStore: makeSessionStore(), env: testEnv });

      await expect(service.register('alice', 'alice@example.com', 'password123')).rejects.toMatchObject({
        statusCode: 409,
        message: 'Email already taken',
      });
    });

    it('throws 400 for invalid input (short username)', async () => {
      const service = new AuthService({ userRepository: makeUserRepo(), sessionStateStore: makeSessionStore(), env: testEnv });
      await expect(service.register('ab', 'alice@example.com', 'password123')).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe('login', () => {
    it('returns token pair on valid credentials', async () => {
      const bcrypt = await import('bcrypt');
      const hash = await bcrypt.hash('password123', 12);
      const user = { ...mockUser, passwordHash: hash };
      const userRepo = makeUserRepo({ findByEmail: vi.fn().mockResolvedValue(user) });
      const sessionStore = makeSessionStore();
      const service = new AuthService({ userRepository: userRepo, sessionStateStore: sessionStore, env: testEnv });

      const result = await service.login('alice@example.com', 'password123');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(sessionStore.setRefreshToken).toHaveBeenCalledOnce();
    });

    it('throws 401 when user not found', async () => {
      const service = new AuthService({ userRepository: makeUserRepo(), sessionStateStore: makeSessionStore(), env: testEnv });
      await expect(service.login('notfound@example.com', 'password123')).rejects.toMatchObject({ statusCode: 401 });
    });

    it('throws 401 when password incorrect', async () => {
      const userRepo = makeUserRepo({ findByEmail: vi.fn().mockResolvedValue(mockUser) });
      const service = new AuthService({ userRepository: userRepo, sessionStateStore: makeSessionStore(), env: testEnv });
      await expect(service.login('alice@example.com', 'wrongpassword')).rejects.toMatchObject({ statusCode: 401 });
    });
  });

  describe('refresh', () => {
    it('rotates tokens and returns new access token', async () => {
      const { signRefreshToken } = await import('./jwtUtils.js');
      const refreshToken = signRefreshToken({ sub: mockUser.id }, testEnv.JWT_REFRESH_SECRET);

      const userRepo = makeUserRepo({ findById: vi.fn().mockResolvedValue(mockUser) });
      const sessionStore = makeSessionStore({ getRefreshToken: vi.fn().mockResolvedValue(refreshToken) });
      const service = new AuthService({ userRepository: userRepo, sessionStateStore: sessionStore, env: testEnv });

      const result = await service.refresh(refreshToken);
      expect(result).toHaveProperty('accessToken');
      expect(sessionStore.deleteRefreshToken).toHaveBeenCalledWith(mockUser.id);
      expect(sessionStore.setRefreshToken).toHaveBeenCalledOnce();
    });

    it('throws 401 when refresh token does not match stored', async () => {
      const { signRefreshToken } = await import('./jwtUtils.js');
      const refreshToken = signRefreshToken({ sub: mockUser.id }, testEnv.JWT_REFRESH_SECRET);

      const sessionStore = makeSessionStore({ getRefreshToken: vi.fn().mockResolvedValue('different-token') });
      const service = new AuthService({ userRepository: makeUserRepo(), sessionStateStore: sessionStore, env: testEnv });

      await expect(service.refresh(refreshToken)).rejects.toMatchObject({ statusCode: 401 });
    });

    it('throws 401 with invalid refresh token', async () => {
      const service = new AuthService({ userRepository: makeUserRepo(), sessionStateStore: makeSessionStore(), env: testEnv });
      await expect(service.refresh('totally-invalid-token')).rejects.toMatchObject({ statusCode: 401 });
    });
  });

  describe('logout', () => {
    it('calls deleteRefreshToken', async () => {
      const sessionStore = makeSessionStore();
      const service = new AuthService({ userRepository: makeUserRepo(), sessionStateStore: sessionStore, env: testEnv });
      await service.logout('user-1');
      expect(sessionStore.deleteRefreshToken).toHaveBeenCalledWith('user-1');
    });
  });
});
