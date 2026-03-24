-- Enable the pgvector extension for future RAG
CREATE EXTENSION IF NOT EXISTS vector;

-- Tweets table
CREATE TABLE tweets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic TEXT NOT NULL,
  generated_text TEXT NOT NULL,
  tweet_id_x TEXT,
  media_instructions JSONB,
  status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'Approved', 'Posted')),
  posted_at TIMESTAMP WITH TIME ZONE,
  impressions INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  retweets INTEGER DEFAULT 0,
  replies INTEGER DEFAULT 0,
  engagement_score NUMERIC,
  embedding vector(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System logs table
CREATE TABLE system_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  details JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for status-based queries
CREATE INDEX idx_tweets_status ON tweets (status);

-- Index for engagement score sorting
CREATE INDEX idx_tweets_engagement ON tweets (engagement_score DESC NULLS LAST);

-- Index for X tweet ID lookups
CREATE INDEX idx_tweets_tweet_id_x ON tweets (tweet_id_x);
