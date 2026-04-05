import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import { validateBody } from '../validate';
import type { FastifyRequest, FastifyReply } from 'fastify';

const TestSchema = z.object({
  name: z.string().min(1),
  count: z.number().int().min(0).default(0),
});

function makeReply() {
  const reply = {
    status: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  } as unknown as FastifyReply;
  return reply;
}

function makeRequest(body: unknown): FastifyRequest {
  return { body } as unknown as FastifyRequest;
}

describe('validateBody', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls next (does not send) when body is valid', async () => {
    const request = makeRequest({ name: 'hero', count: 5 });
    const reply = makeReply();
    const handler = validateBody(TestSchema);
    await handler(request, reply);
    expect(reply.status).not.toHaveBeenCalled();
    expect(reply.send).not.toHaveBeenCalled();
  });

  it('returns 400 when body is invalid', async () => {
    const request = makeRequest({ name: '', count: 5 });
    const reply = makeReply();
    const handler = validateBody(TestSchema);
    await handler(request, reply);
    expect(reply.status).toHaveBeenCalledWith(400);
    expect(reply.send).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Validation failed' }),
    );
  });

  it('includes flatten() details in 400 response', async () => {
    const request = makeRequest({ count: 5 });
    const reply = makeReply();
    await validateBody(TestSchema)(request, reply);
    const payload = (reply.send as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(payload.details).toBeDefined();
    expect(payload.details.fieldErrors).toBeDefined();
  });

  it('mutates request.body with parsed (coerced) data', async () => {
    const request = makeRequest({ name: 'warrior' });
    const reply = makeReply();
    await validateBody(TestSchema)(request, reply);
    expect((request as any).body.count).toBe(0); // default applied
  });

  it('returns 400 for non-object body', async () => {
    const request = makeRequest('not-an-object');
    const reply = makeReply();
    await validateBody(TestSchema)(request, reply);
    expect(reply.status).toHaveBeenCalledWith(400);
  });

  it('preserves valid field values after parsing', async () => {
    const request = makeRequest({ name: 'paladin', count: 3 });
    const reply = makeReply();
    await validateBody(TestSchema)(request, reply);
    expect((request as any).body.name).toBe('paladin');
    expect((request as any).body.count).toBe(3);
  });
});
