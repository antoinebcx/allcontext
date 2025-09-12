export interface ApiKey {
  id: string;
  user_id: string;
  name: string;
  key_prefix: string;
  last_4: string;
  last_used_at: string | null;
  expires_at: string | null;
  scopes: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiKeyCreate {
  name: string;
  expires_at?: string;
  scopes?: string[];
}

export interface ApiKeyCreated extends ApiKey {
  api_key: string;
}

export interface ApiKeyUpdate {
  name?: string;
  scopes?: string[];
  is_active?: boolean;
}

export interface ApiKeyList {
  items: ApiKey[];
  total: number;
}