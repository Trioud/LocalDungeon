import type { PrismaClient } from '@prisma/client';
import type { IFileStorage } from '../ports/IFileStorage.js';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

const EXT_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

interface PortraitServiceDeps {
  prisma: PrismaClient;
  fileStorage: IFileStorage;
}

export class PortraitService {
  private prisma: PrismaClient;
  private fileStorage: IFileStorage;

  constructor({ prisma, fileStorage }: PortraitServiceDeps) {
    this.prisma = prisma;
    this.fileStorage = fileStorage;
  }

  private buildKey(userId: string, characterId: string, mimeType: string): string {
    const ext = EXT_MAP[mimeType] ?? 'jpg';
    return `portraits/${userId}/${characterId}.${ext}`;
  }

  async uploadPortrait(
    characterId: string,
    buffer: Buffer,
    mimeType: string,
    userId: string
  ): Promise<string> {
    if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType)) {
      throw Object.assign(new Error('Invalid image type. Allowed: jpeg, png, webp'), {
        statusCode: 400,
      });
    }
    if (buffer.length > MAX_SIZE_BYTES) {
      throw Object.assign(new Error('Image too large. Maximum size is 5MB'), { statusCode: 400 });
    }

    const character = await this.prisma.character.findUnique({ where: { id: characterId } });
    if (!character) {
      throw Object.assign(new Error('Character not found'), { statusCode: 404 });
    }
    if (character.userId !== userId) {
      throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
    }

    const oldUrl = character.portraitUrl;

    const key = this.buildKey(userId, characterId, mimeType);
    const newUrl = await this.fileStorage.upload(key, buffer, mimeType);

    await this.prisma.character.update({
      where: { id: characterId },
      data: { portraitUrl: newUrl },
    });

    if (oldUrl) {
      const oldKey = this.extractKey(oldUrl);
      if (oldKey && oldKey !== key) {
        await this.fileStorage.delete(oldKey).catch(() => {});
      }
    }

    return newUrl;
  }

  async getPresignedUrl(
    characterId: string,
    mimeType: string,
    userId: string
  ): Promise<{ uploadUrl: string; key: string }> {
    if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType)) {
      throw Object.assign(new Error('Invalid image type. Allowed: jpeg, png, webp'), {
        statusCode: 400,
      });
    }

    const character = await this.prisma.character.findUnique({ where: { id: characterId } });
    if (!character) {
      throw Object.assign(new Error('Character not found'), { statusCode: 404 });
    }
    if (character.userId !== userId) {
      throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
    }

    const key = this.buildKey(userId, characterId, mimeType);
    const uploadUrl = await this.fileStorage.getPresignedUploadUrl(key, mimeType, 300);
    return { uploadUrl, key };
  }

  async deletePortrait(characterId: string, userId: string): Promise<void> {
    const character = await this.prisma.character.findUnique({ where: { id: characterId } });
    if (!character) {
      throw Object.assign(new Error('Character not found'), { statusCode: 404 });
    }
    if (character.userId !== userId) {
      throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
    }

    if (character.portraitUrl) {
      const key = this.extractKey(character.portraitUrl);
      if (key) {
        await this.fileStorage.delete(key).catch(() => {});
      }
    }

    await this.prisma.character.update({
      where: { id: characterId },
      data: { portraitUrl: null },
    });
  }

  private extractKey(url: string): string | null {
    const match = url.match(/portraits\/.+/);
    return match ? match[0] : null;
  }
}
