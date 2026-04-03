import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { signAccessToken, signRefreshToken, verifyToken } from './jwtUtils.js';

const SECRET = 'test-secret-that-is-long-enough-for-testing-purposes';

describe('jwtUtils', () => {
  describe('signAccessToken + verifyToken round-trip', () => {
    it('signs and verifies an access token', () => {
      const token = signAccessToken({ sub: 'user-1', username: 'alice' }, SECRET);
      const payload = verifyToken(token, SECRET);
      expect(payload.sub).toBe('user-1');
      expect(payload.username).toBe('alice');
    });
  });

  describe('signRefreshToken + verifyToken round-trip', () => {
    it('signs and verifies a refresh token', () => {
      const token = signRefreshToken({ sub: 'user-2' }, SECRET);
      const payload = verifyToken(token, SECRET);
      expect(payload.sub).toBe('user-2');
    });
  });

  describe('verifyToken', () => {
    it('throws on tampered token', () => {
      const token = signAccessToken({ sub: 'user-1', username: 'alice' }, SECRET);
      const tampered = token.slice(0, -5) + 'XXXXX';
      expect(() => verifyToken(tampered, SECRET)).toThrow();
    });

    it('throws on expired token', async () => {
      const jwt = await import('jsonwebtoken');
      const expiredToken = jwt.default.sign({ sub: 'user-1', username: 'alice' }, SECRET, { expiresIn: 0 });
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(() => verifyToken(expiredToken, SECRET)).toThrow();
    });

    it('throws on wrong secret', () => {
      const token = signAccessToken({ sub: 'user-1', username: 'alice' }, SECRET);
      expect(() => verifyToken(token, 'wrong-secret')).toThrow();
    });
  });
});
