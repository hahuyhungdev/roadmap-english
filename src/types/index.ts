export interface SessionMeta {
  sessionNumber: number;
  title: string;
  topic: string;
  phrase?: string;
  date?: string;
  level?: string;
  description?: string;
  tags?: string[];
  relatedSessions?: Array<{ id: string; note?: string }>;
}

export interface Session {
  id: string;
  meta: SessionMeta;
  content: string;
}
