export interface ISessionStateStore {
  setRefreshToken(userId: string, token: string, ttlSeconds: number): Promise<void>;
  getRefreshToken(userId: string): Promise<string | null>;
  deleteRefreshToken(userId: string): Promise<void>;
}
