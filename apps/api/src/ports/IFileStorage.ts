export interface IFileStorage {
  upload(key: string, buffer: Buffer, mimeType: string): Promise<string>;
  delete(key: string): Promise<void>;
  getPresignedUploadUrl(key: string, mimeType: string, expiresIn: number): Promise<string>;
}
