import { describe, it, expect } from 'vitest';
import { envSchema } from '../../env';

const base = {
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/mydb',
  REDIS_URL: 'redis://localhost:6379',
  JWT_ACCESS_SECRET: 'a'.repeat(32),
  JWT_REFRESH_SECRET: 'b'.repeat(32),
};

describe('envSchema', () => {
  it('accepts valid environment variables', () => {
    const result = envSchema.safeParse(base);
    expect(result.success).toBe(true);
  });

  it('applies default NODE_ENV = development', () => {
    const result = envSchema.safeParse(base);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.NODE_ENV).toBe('development');
  });

  it('applies default PORT = 3001', () => {
    const result = envSchema.safeParse(base);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.PORT).toBe(3001);
  });

  it('fails when DATABASE_URL is missing', () => {
    const { DATABASE_URL: _, ...rest } = base;
    const result = envSchema.safeParse(rest);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.DATABASE_URL).toBeDefined();
    }
  });

  it('fails when DATABASE_URL is not a valid URL', () => {
    const result = envSchema.safeParse({ ...base, DATABASE_URL: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('fails when JWT_ACCESS_SECRET is shorter than 32 chars', () => {
    const result = envSchema.safeParse({ ...base, JWT_ACCESS_SECRET: 'short' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.JWT_ACCESS_SECRET).toBeDefined();
    }
  });

  it('fails when JWT_REFRESH_SECRET is shorter than 32 chars', () => {
    const result = envSchema.safeParse({ ...base, JWT_REFRESH_SECRET: 'short' });
    expect(result.success).toBe(false);
  });

  it('fails when NODE_ENV is an invalid enum value', () => {
    const result = envSchema.safeParse({ ...base, NODE_ENV: 'staging' });
    expect(result.success).toBe(false);
  });

  it('coerces PORT string to number', () => {
    const result = envSchema.safeParse({ ...base, PORT: '4000' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.PORT).toBe(4000);
  });

  it('accepts optional S3 and deepgram fields when missing', () => {
    const result = envSchema.safeParse(base);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.S3_BUCKET).toBeUndefined();
      expect(result.data.DEEPGRAM_API_KEY).toBeUndefined();
    }
  });
});
