export interface Tweet {
  id: string;
  topic: string;
  generated_text: string;
  tweet_id_x: string | null;
  media_instructions: {
    required: boolean;
    description: string;
    search_terms: string[];
  } | null;
  status: "Draft" | "Approved" | "Posted";
  posted_at: string | null;
  impressions: number;
  likes: number;
  retweets: number;
  replies: number;
  engagement_score: number | null;
  embedding: number[] | null;
  created_at: string;
}

export interface TweetInsert {
  topic: string;
  generated_text: string;
  tweet_id_x?: string | null;
  media_instructions?: {
    required: boolean;
    description: string;
    search_terms: string[];
  } | null;
  status?: "Draft" | "Approved" | "Posted";
  posted_at?: string | null;
  impressions?: number;
  likes?: number;
  retweets?: number;
  replies?: number;
  engagement_score?: number | null;
  embedding?: number[] | null;
}

export interface TweetUpdate {
  topic?: string;
  generated_text?: string;
  tweet_id_x?: string | null;
  media_instructions?: {
    required: boolean;
    description: string;
    search_terms: string[];
  } | null;
  status?: "Draft" | "Approved" | "Posted";
  posted_at?: string | null;
  impressions?: number;
  likes?: number;
  retweets?: number;
  replies?: number;
  engagement_score?: number | null;
  embedding?: number[] | null;
}

export interface SystemLog {
  id: string;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
}

export interface SystemLogInsert {
  action: string;
  details: Record<string, unknown>;
}

export interface Database {
  public: {
    Tables: {
      tweets: {
        Row: Tweet;
        Insert: TweetInsert;
        Update: TweetUpdate;
        Relationships: [];
      };
      system_logs: {
        Row: SystemLog;
        Insert: SystemLogInsert;
        Update: Partial<SystemLogInsert>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
