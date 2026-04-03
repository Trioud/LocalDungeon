import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createServer } from 'node:http';
import { Server as SocketIOServer } from 'socket.io';
import { io as ioc, type Socket as ClientSocket } from 'socket.io-client';
import { verifyToken } from '../services/jwtUtils.js';
import { signAccessToken } from '../services/jwtUtils.js';

const JWT_SECRET = 'test-access-secret-that-is-long-enough-32chars';

function createTestSocketServer(redisStub: Record<string, Set<string>>) {
  const httpServer = createServer();
  const io = new SocketIOServer(httpServer, { transports: ['websocket'] });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error('Authentication required'));
    try {
      const payload = verifyToken(token, JWT_SECRET);
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
      const key = `session:${data.sessionId}:players`;
      if (!redisStub[key]) redisStub[key] = new Set();
      redisStub[key].add(userId);
      const players = Array.from(redisStub[key]);
      io.to(roomName).emit('session:players_updated', { players });
    });

    socket.on('session:leave', async (data: { sessionId: string }) => {
      const roomName = `session:${data.sessionId}`;
      await socket.leave(roomName);
      const key = `session:${data.sessionId}:players`;
      if (redisStub[key]) redisStub[key].delete(userId);
      const players = redisStub[key] ? Array.from(redisStub[key]) : [];
      io.to(roomName).emit('session:players_updated', { players });
    });

    socket.on('game:ping', () => socket.emit('game:pong', { ts: Date.now() }));
  });

  return { httpServer, io };
}

function getPort(server: ReturnType<typeof createServer>): Promise<number> {
  return new Promise((resolve) => {
    server.listen(0, () => {
      const addr = server.address() as { port: number };
      resolve(addr.port);
    });
  });
}

describe('socketServer', () => {
  let httpServer: ReturnType<typeof createServer>;
  let io: SocketIOServer;
  let port: number;
  let redisStub: Record<string, Set<string>>;

  beforeEach(async () => {
    redisStub = {};
    const created = createTestSocketServer(redisStub);
    httpServer = created.httpServer;
    io = created.io;
    port = await getPort(httpServer);
  });

  afterEach(async () => {
    await io.close();
  });

  it('rejects connection without token', () =>
    new Promise<void>((resolve) => {
      const client = ioc(`http://localhost:${port}`, {
        transports: ['websocket'],
        auth: {},
      });
      client.on('connect_error', (err) => {
        expect(err.message).toContain('Authentication required');
        client.disconnect();
        resolve();
      });
    }));

  it('rejects connection with invalid token', () =>
    new Promise<void>((resolve) => {
      const client = ioc(`http://localhost:${port}`, {
        transports: ['websocket'],
        auth: { token: 'bad.token.value' },
      });
      client.on('connect_error', (err) => {
        expect(err.message).toContain('Invalid token');
        client.disconnect();
        resolve();
      });
    }));

  it('accepts connection with valid JWT', () =>
    new Promise<void>((resolve) => {
      const token = signAccessToken({ sub: 'user-1', username: 'alice' }, JWT_SECRET);
      const client = ioc(`http://localhost:${port}`, {
        transports: ['websocket'],
        auth: { token },
      });
      client.on('connect', () => {
        client.disconnect();
        resolve();
      });
      client.on('connect_error', (err) => {
        throw err;
      });
    }));

  it('game:ping responds with game:pong', () =>
    new Promise<void>((resolve) => {
      const token = signAccessToken({ sub: 'user-1', username: 'alice' }, JWT_SECRET);
      const client = ioc(`http://localhost:${port}`, {
        transports: ['websocket'],
        auth: { token },
      });
      client.on('connect', () => {
        client.emit('game:ping');
      });
      client.on('game:pong', (data: { ts: number }) => {
        expect(typeof data.ts).toBe('number');
        client.disconnect();
        resolve();
      });
    }));

  it('session:join causes socket to join room and receive players_updated', () =>
    new Promise<void>((resolve) => {
      const token = signAccessToken({ sub: 'user-1', username: 'alice' }, JWT_SECRET);
      const client = ioc(`http://localhost:${port}`, {
        transports: ['websocket'],
        auth: { token },
      });
      client.on('connect', () => {
        client.emit('session:join', { sessionId: 'sess-abc' });
      });
      client.on('session:players_updated', (data: { players: string[] }) => {
        expect(data.players).toContain('user-1');
        client.disconnect();
        resolve();
      });
    }));
});
