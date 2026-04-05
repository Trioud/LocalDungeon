import type { ZodSchema } from 'zod';
import type { FastifyRequest, FastifyReply } from 'fastify';

export function validateBody<T>(schema: ZodSchema<T>) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const result = schema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({ error: 'Validation failed', details: result.error.flatten() });
    }
    request.body = result.data as any;
  };
}
