// Shared domain types — used by API and Web

export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
