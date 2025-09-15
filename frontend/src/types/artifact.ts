export interface Artifact {
  id: string;
  user_id: string;
  title: string;
  content: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface ArtifactCreate {
  title?: string;
  content: string;
  metadata?: Record<string, any>;
}

export interface ArtifactUpdate {
  title?: string;
  content?: string;
  metadata?: Record<string, any>;
}

export interface ArtifactList {
  items: Artifact[];
  total: number;
  page: number;
  page_size: number;
}

export interface ArtifactSearchResult {
  id: string;
  title: string;
  snippet: string;  // First 200 chars of content
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ArtifactVersion {
  version: number;
  title: string;
  content: string;
  metadata: Record<string, any>;
  updated_at: string;
  content_length: number;
  title_changed: boolean;
  content_changed: boolean;
}

export interface ArtifactVersionSummary {
  version: number;
  title: string;
  updated_at: string;
  content_length: number;
  changes: string[];  // ["title", "content"]
}

export interface ArtifactVersionsResponse {
  id: string;
  current_version: number;
  version_count: number;
  versions: ArtifactVersionSummary[];
}
