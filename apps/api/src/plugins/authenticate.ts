import fp from 'fastify-plugin';
import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken } from '../services/jwtUtils.js';

export interface AuthenticateOptions {
  jwtSecret: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user: { sub: string; username: string };
  }
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

const authenticatePlugin: FastifyPluginAsync<AuthenticateOptions> = async (fastify, opts) => {
  fastify.decorate(
    'authenticate',
    async function authenticate(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw Object.assign(new Error('Missing Authorization header'), { statusCode: 401 });
      }
      const token = authHeader.slice(7);
      try {
        const payload = verifyToken(token, opts.jwtSecret);
        request.user = { sub: payload.sub, username: payload.username ?? '' };
      } catch {
        throw Object.assign(new Error('Invalid or expired token'), { statusCode: 401 });
      }
    }
  );
};

export default fp(authenticatePlugin, { name: 'authenticate' });
