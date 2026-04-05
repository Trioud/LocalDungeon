import bcrypt from 'bcrypt';
import { z } from 'zod';
import type { IUserRepository, User } from '../ports/IUserRepository.js';
import type { ISessionStateStore } from '../ports/ISessionStateStore.js';
import type { Env } from '../env.js';
import { signAccessToken, signRefreshToken, verifyToken } from './jwtUtils.js';

const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60;

function createHttpError(statusCode: number, message: string): Error & { statusCode: number } {
  const err = new Error(message) as Error & { statusCode: number };
  err.statusCode = statusCode;
  return err;
}

const registerSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8),
});

interface AuthServiceDeps {
  userRepository: IUserRepository;
  sessionStateStore: ISessionStateStore;
  env: Env;
}

export type PublicUser = Omit<User, 'passwordHash'>;

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  private userRepository: IUserRepository;
  private sessionStateStore: ISessionStateStore;
  private env: Env;

  constructor({ userRepository, sessionStateStore, env }: AuthServiceDeps) {
    this.userRepository = userRepository;
    this.sessionStateStore = sessionStateStore;
    this.env = env;
  }

  async register(username: string, email: string, password: string): Promise<PublicUser> {
    const result = registerSchema.safeParse({ username, email, password });
    if (!result.success) {
      throw createHttpError(400, result.error.issues[0].message);
    }
    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw createHttpError(409, 'Email already taken');
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await this.userRepository.create({ username, email, passwordHash });
    const { passwordHash: _passwordHash, ...publicUser } = user;
    return publicUser;
  }

  async login(email: string, password: string): Promise<TokenPair> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw createHttpError(401, 'Invalid credentials');
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw createHttpError(401, 'Invalid credentials');
    }
    const accessToken = signAccessToken(
      { sub: user.id, username: user.username },
      this.env.JWT_ACCESS_SECRET
    );
    const refreshToken = signRefreshToken({ sub: user.id }, this.env.JWT_REFRESH_SECRET);
    await this.sessionStateStore.setRefreshToken(user.id, refreshToken, REFRESH_TOKEN_TTL);
    return { accessToken, refreshToken };
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string; user: { id: string; username: string; email: string } }> {
    let payload: { sub: string };
    try {
      payload = verifyToken(refreshToken, this.env.JWT_REFRESH_SECRET);
    } catch {
      throw createHttpError(401, 'Invalid refresh token');
    }
    const stored = await this.sessionStateStore.getRefreshToken(payload.sub);
    if (!stored || stored !== refreshToken) {
      throw createHttpError(401, 'Invalid refresh token');
    }
    const user = await this.userRepository.findById(payload.sub);
    if (!user) {
      throw createHttpError(401, 'Invalid refresh token');
    }
    const newRefreshToken = signRefreshToken({ sub: user.id }, this.env.JWT_REFRESH_SECRET);
    const accessToken = signAccessToken(
      { sub: user.id, username: user.username },
      this.env.JWT_ACCESS_SECRET
    );
    await this.sessionStateStore.deleteRefreshToken(user.id);
    await this.sessionStateStore.setRefreshToken(user.id, newRefreshToken, REFRESH_TOKEN_TTL);
    return {
      accessToken,
      refreshToken: newRefreshToken,
      user: { id: user.id, username: user.username, email: user.email },
    };
  }

  async logout(userId: string): Promise<void> {
    await this.sessionStateStore.deleteRefreshToken(userId);
  }
}
