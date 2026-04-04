import { loadEnv } from './env.js';
import { buildApp } from './app.js';
import { buildContainer } from './container.js';
import { createSocketServer } from './socket/socketServer.js';

const env = loadEnv();

const app = await buildApp(env);
const container = buildContainer(env);
const redis = container.cradle.redis;

try {
  await app.listen({ port: env.PORT, host: '0.0.0.0' });
  createSocketServer(app.server, { redis, diceService: container.cradle.diceService });
  app.log.info(`🎲 LocalDungeon API running on port ${env.PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
