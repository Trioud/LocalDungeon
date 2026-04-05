import type { FastifyInstance } from 'fastify';
import { Server as SocketServer } from 'socket.io';

export function registerGracefulShutdown(
  app: FastifyInstance,
  io: SocketServer,
  onShutdown?: () => Promise<void>,
): void {
  const shutdown = async (signal: string) => {
    app.log.info(`Received ${signal}, shutting down gracefully...`);
    io.close();
    // Force exit after 10s if graceful shutdown hangs
    setTimeout(() => process.exit(1), 10_000).unref();
    await app.close();
    if (onShutdown) await onShutdown();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}
