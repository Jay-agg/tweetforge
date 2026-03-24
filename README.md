# TweetForge – Self-Improving Twitter Agent

A hybrid **Next.js** + **Python FastAPI** application that generates, posts, tracks, and autonomously improves Twitter/X content using LLM-driven generation and engagement-based feedback loops.

## Architecture

```
twitterbot/
├── project-context.md     # Immutable persona & generation rules
├── client/                # Next.js (TypeScript, Tailwind)
│   ├── src/
│   │   ├── app/           # App Router pages & API routes
│   │   ├── components/    # UI components
│   │   ├── lib/           # DB, Twitter, Context, Cron utilities
│   │   └── models/        # Mongoose schemas
│   └── .env.local         # Environment variables
└── engine/                # Python FastAPI
    ├── main.py            # FastAPI entry point
    ├── routers/           # API endpoints
    ├── services/          # LLM, Search, Evaluator
    ├── schemas.py         # Pydantic models
    └── correction_rules.json  # Self-improvement memory
```

## Quick Start

### 1. Set Environment Variables

**client/.env.local:**
```env
MONGODB_URI=mongodb://localhost:27017/tweetforge
ENGINE_URL=http://localhost:8000
TWITTER_API_KEY=your_key
TWITTER_API_SECRET=your_secret
TWITTER_ACCESS_TOKEN=your_token
TWITTER_ACCESS_SECRET=your_access_secret
```

**engine/.env:**
```env
OPENAI_API_KEY=your_openai_key
```

### 2. Start the Python Engine

```bash
cd engine
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

### 3. Start the Next.js Client

```bash
cd client
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Key Features

| Feature | Description |
|---------|-------------|
| **AI Generation** | LLM-powered tweet generation with persona context |
| **Trend Awareness** | DuckDuckGo search for recent headlines before generation |
| **Draft Queue** | Review, approve, or discard generated tweets |
| **Twitter Posting** | One-click posting via Twitter API v2 |
| **Auto-Post Cron** | Scheduled posting at 9 AM, 12 PM, 5 PM |
| **Metrics Gathering** | Automatic engagement metrics fetch after 48 hours |
| **Self-Improvement** | LLM evaluates performance and generates correction rules |
| **Feedback Loop** | Correction rules are injected into future generation prompts |
