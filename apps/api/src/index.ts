import { loadEnv } from './env.js';
import { buildApp } from './app.js';

const env = loadEnv();

const app = await buildApp(env);

try {
  await app.listen({ port: env.PORT, host: '0.0.0.0' });
  app.log.info(`🎲 LocalDungeon API running on port ${env.PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
