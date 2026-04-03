import jwt from 'jsonwebtoken';

export interface JwtPayload {
  sub: string;
  username?: string;
  iat?: number;
  exp?: number;
}

export function signAccessToken(
  payload: { sub: string; username: string },
  secret: string
): string {
  return jwt.sign(payload, secret, { expiresIn: '15m' });
}

export function signRefreshToken(payload: { sub: string }, secret: string): string {
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

export function verifyToken(token: string, secret: string): JwtPayload {
  return jwt.verify(token, secret) as JwtPayload;
}
