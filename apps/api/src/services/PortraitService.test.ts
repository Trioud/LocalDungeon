import { describe, it, expect, beforeEach } from 'vitest';
import { PortraitService } from './PortraitService.js';
import { InMemoryFileStorage } from '../adapters/InMemoryFileStorage.js';

const JPEG_MIME = 'image/jpeg';
const PNG_MIME = 'image/png';
const WEBP_MIME = 'image/webp';

function makeBuffer(sizeBytes: number): Buffer {
  return Buffer.alloc(sizeBytes, 'a');
}

function makeCharacter(overrides: Record<string, unknown> = {}) {
  return {
    id: 'char-1',
    userId: 'user-1',
    name: 'Aragorn',
    portraitUrl: null,
    ...overrides,
  };
}

function makePrismaStub(character: ReturnType<typeof makeCharacter> | null = makeCharacter()) {
  const store = character ? new Map([[character.id, { ...character }]]) : new Map();
  return {
    character: {
      findUnique: async ({ where }: { where: { id: string } }) => store.get(where.id) ?? null,
      update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const existing = store.get(where.id);
        if (!existing) throw new Error('Not found');
        Object.assign(existing, data);
        return existing;
      },
    },
  };
}

describe('PortraitService', () => {
  let fileStorage: InMemoryFileStorage;
  let service: PortraitService;
  let prisma: ReturnType<typeof makePrismaStub>;

  beforeEach(() => {
    fileStorage = new InMemoryFileStorage();
    prisma = makePrismaStub();
    service = new PortraitService({ prisma: prisma as any, fileStorage });
  });

  it('uploads a portrait and returns URL', async () => {
    const buffer = makeBuffer(1000);
    const url = await service.uploadPortrait('char-1', buffer, JPEG_MIME, 'user-1');
    expect(url).toBe('https://mock-storage/portraits/user-1/char-1.jpg');
    expect(fileStorage.getStore().has('portraits/user-1/char-1.jpg')).toBe(true);
  });

  it('stores correct URL for png', async () => {
    const buffer = makeBuffer(500);
    const url = await service.uploadPortrait('char-1', buffer, PNG_MIME, 'user-1');
    expect(url).toContain('char-1.png');
  });

  it('stores correct URL for webp', async () => {
    const buffer = makeBuffer(500);
    const url = await service.uploadPortrait('char-1', buffer, WEBP_MIME, 'user-1');
    expect(url).toContain('char-1.webp');
  });

  it('throws 400 for invalid mime type', async () => {
    const buffer = makeBuffer(100);
    await expect(service.uploadPortrait('char-1', buffer, 'image/gif', 'user-1')).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('throws 400 for buffer exceeding 5MB', async () => {
    const buffer = makeBuffer(6 * 1024 * 1024);
    await expect(service.uploadPortrait('char-1', buffer, JPEG_MIME, 'user-1')).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('throws 404 when character not found', async () => {
    prisma = makePrismaStub(null);
    service = new PortraitService({ prisma: prisma as any, fileStorage });
    await expect(service.uploadPortrait('nonexistent', makeBuffer(100), JPEG_MIME, 'user-1')).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('throws 403 when user does not own character', async () => {
    await expect(service.uploadPortrait('char-1', makeBuffer(100), JPEG_MIME, 'other-user')).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it('returns a presigned URL', async () => {
    const result = await service.getPresignedUrl('char-1', JPEG_MIME, 'user-1');
    expect(result.uploadUrl).toBe('https://mock-presigned/portraits/user-1/char-1.jpg');
    expect(result.key).toBe('portraits/user-1/char-1.jpg');
  });

  it('deletes portrait and clears portraitUrl', async () => {
    const character = makeCharacter({ portraitUrl: 'https://mock-storage/portraits/user-1/char-1.jpg' });
    prisma = makePrismaStub(character);
    service = new PortraitService({ prisma: prisma as any, fileStorage });
    await fileStorage.upload('portraits/user-1/char-1.jpg', makeBuffer(100), JPEG_MIME);

    await service.deletePortrait('char-1', 'user-1');

    expect(fileStorage.getStore().has('portraits/user-1/char-1.jpg')).toBe(false);
  });

  it('deletes old file when uploading new portrait', async () => {
    const character = makeCharacter({ portraitUrl: 'https://mock-storage/portraits/user-1/char-1.jpg' });
    prisma = makePrismaStub(character);
    service = new PortraitService({ prisma: prisma as any, fileStorage });
    await fileStorage.upload('portraits/user-1/char-1.jpg', makeBuffer(100), JPEG_MIME);

    await service.uploadPortrait('char-1', makeBuffer(200), PNG_MIME, 'user-1');

    expect(fileStorage.getStore().has('portraits/user-1/char-1.jpg')).toBe(false);
    expect(fileStorage.getStore().has('portraits/user-1/char-1.png')).toBe(true);
  });
});
