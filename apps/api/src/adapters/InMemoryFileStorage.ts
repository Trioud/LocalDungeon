import type { IFileStorage } from '../ports/IFileStorage.js';

interface StoredFile {
  buffer: Buffer;
  mimeType: string;
  url: string;
}

export class InMemoryFileStorage implements IFileStorage {
  private store = new Map<string, StoredFile>();

  async upload(key: string, buffer: Buffer, mimeType: string): Promise<string> {
    const url = `https://mock-storage/${key}`;
    this.store.set(key, { buffer, mimeType, url });
    return url;
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async getPresignedUploadUrl(key: string, _mimeType: string, _expiresIn: number): Promise<string> {
    return `https://mock-presigned/${key}`;
  }

  getStore(): ReadonlyMap<string, StoredFile> {
    return this.store;
  }
}
