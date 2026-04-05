import { loadEnv } from './env.js';
import { buildApp } from './app.js';
import { buildContainer } from './container.js';
import { createSocketServer } from './socket/socketServer.js';
import { registerGracefulShutdown } from './shutdown.js';

const env = loadEnv();

const app = await buildApp(env);
const container = buildContainer(env);
const redis = container.cradle.redis;

try {
  await app.listen({ port: env.PORT, host: '0.0.0.0' });
  const io = createSocketServer(app.server, {
    redis,
    diceService: container.cradle.diceService,
    gameLogService: container.cradle.gameLogService,
    combatService: container.cradle.combatService,
    spellcastingService: container.cradle.spellcastingService,
    restService: container.cradle.restService,
    classFeatureService: container.cradle.classFeatureService,
    inspirationService: container.cradle.inspirationService,
    sttService: container.cradle.sttService,
    weaponMasteryService: container.cradle.weaponMasteryService,
    consensusService: container.cradle.consensusService,
    readyActionService: container.cradle.readyActionService,
  });
  registerGracefulShutdown(app, io);
  app.log.info(`🎲 LocalDungeon API running on port ${env.PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
