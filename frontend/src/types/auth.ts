export interface User {
  id: string;
  email: string;
  created_at?: string;
}

export interface AuthRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface EmailCheckRequest {
  email: string;
}

export interface EmailCheckResponse {
  exists: boolean;
}