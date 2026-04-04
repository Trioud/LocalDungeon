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
  createSocketServer(app.server, {
    redis,
    diceService: container.cradle.diceService,
    gameLogService: container.cradle.gameLogService,
    combatService: container.cradle.combatService,
    spellcastingService: container.cradle.spellcastingService,
    restService: container.cradle.restService,
    classFeatureService: container.cradle.classFeatureService,
    inspirationService: container.cradle.inspirationService,
  });
  app.log.info(`🎲 LocalDungeon API running on port ${env.PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
