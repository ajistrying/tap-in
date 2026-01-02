# Public PKM Interface

A public-facing AI chat interface where visitors can ask natural language questions about goals, progress, and projects. Powered by RAG using curated PKM content.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | SvelteKit 2.x, Svelte 5, Tailwind CSS 4, DaisyUI |
| Database | PostgreSQL (Neon serverless) with pgvector |
| ORM | Drizzle ORM with Neon HTTP driver |
| Embeddings | Workers AI (`@cf/baai/bge-base-en-v1.5`, 768 dims) |
| LLM | DeepSeek API |
| Hosting | Cloudflare Pages + Workers |
| CI/CD | GitHub Actions |

## Project Structure

```
├── src/
│   ├── routes/
│   │   ├── +page.svelte           # Chat UI
│   │   ├── +layout.svelte         # Root layout
│   │   └── api/
│   │       └── chat/+server.ts    # RAG endpoint
│   ├── lib/
│   │   ├── server/
│   │   │   ├── db/
│   │   │   │   ├── schema.ts      # Drizzle schema
│   │   │   │   └── index.ts       # DB client factory
│   │   │   ├── embeddings.ts      # Query embedding generation
│   │   │   └── rate-limit.ts      # Rate limiting utility
│   │   ├── components/            # Svelte components
│   │   └── utils/                 # Shared utilities
│   ├── app.css                    # Tailwind entry
│   ├── app.d.ts                   # TypeScript declarations
│   └── app.html                   # HTML template
├── drizzle/                       # Generated migrations
├── drizzle.config.ts              # Drizzle Kit config
├── wrangler.toml                  # Cloudflare bindings
├── svelte.config.js               # SvelteKit config
├── vite.config.ts                 # Vite config
└── package.json
```

Note: Content pipeline scripts (extract, chunk, embed, sync) live in the PKM system, not this app.

## Architecture

### Full System Flow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              PKM SYSTEM (Obsidian)                           │
│                                                                              │
│  ┌─────────────────┐                                                         │
│  │  Markdown Files │                                                         │
│  │  (public: true) │                                                         │
│  └────────┬────────┘                                                         │
│           │                                                                  │
│           ▼                                                                  │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐          │
│  │    Extract      │───▶│     Chunk       │───▶│    Embed        │          │
│  │  public content │    │  by H2/H3       │    │  (768 dims)     │          │
│  └─────────────────┘    │  ~500 tokens    │    └────────┬────────┘          │
│                         └─────────────────┘             │                   │
└─────────────────────────────────────────────────────────┼───────────────────┘
                                                          │
                                                          │ Sync (upsert)
                                                          ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                         NEON POSTGRESQL (pgvector)                           │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │                        content_chunks table                            │  │
│  ├──────────┬──────────────┬─────────────┬───────────┬───────────────────┤  │
│  │    id    │   content    │ source_file │  heading  │ embedding [768]   │  │
│  ├──────────┼──────────────┼─────────────┼───────────┼───────────────────┤  │
│  │  uuid    │ "Current..." │ "goals.md"  │ "Q1 2025" │ [0.12, -0.34, ...]│  │
│  │  uuid    │ "Working..." │ "projects"  │ "TapIn"   │ [0.08, 0.21, ...] │  │
│  └──────────┴──────────────┴─────────────┴───────────┴───────────────────┘  │
│                                                                              │
│  HNSW Index (vector_cosine_ops) for fast similarity search                   │
└──────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ Query
                                      ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                      THIS APP (Public Chat Interface)                        │
│                         Cloudflare Pages + Workers                           │
│                                                                              │
│  ┌─────────┐      ┌──────────────┐      ┌─────────────┐      ┌───────────┐  │
│  │  User   │─────▶│  Rate Limit  │─────▶│   Embed     │─────▶│  pgvector │  │
│  │  Query  │      │  Check (DB)  │      │   Query     │      │  Search   │  │
│  └─────────┘      └──────────────┘      │ Workers AI  │      │  Top 5    │  │
│                                         └─────────────┘      └─────┬─────┘  │
│                                                                    │        │
│                                                                    ▼        │
│  ┌─────────┐      ┌──────────────┐      ┌─────────────────────────────────┐ │
│  │ Stream  │◀─────│   DeepSeek   │◀─────│  Build RAG Prompt               │ │
│  │Response │      │   LLM API    │      │  System: "You are Wellington's  │ │
│  └─────────┘      └──────────────┘      │   public assistant..."          │ │
│                                         │  Context: [top 5 chunks]        │ │
│                                         │  User: {query}                  │ │
│                                         └─────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow Summary

| Step | System | Action |
|------|--------|--------|
| 1 | PKM | Extracts markdown files with `public: true` frontmatter |
| 2 | PKM | Chunks content by H2/H3 headers (~500 tokens each) |
| 3 | PKM | Generates 768-dim embeddings for each chunk |
| 4 | PKM | Upserts chunks + embeddings to Neon DB |
| 5 | App | Receives user query, checks rate limit |
| 6 | App | Generates embedding for user query (Workers AI) |
| 7 | App | Searches pgvector for top 5 similar chunks |
| 8 | App | Builds prompt with context, calls DeepSeek |
| 9 | App | Streams response back to user |

## Database Schema

**Tables:**
- `content_chunks` - RAG content with embeddings (768-dim vector)
- `rate_limits` - IP-based rate limiting
- `chat_sessions` - Conversation tracking (future)
- `chat_messages` - Message history (future)

## Environment Variables

```bash
# .env (local development)
DATABASE_URL=postgresql://user:pass@host.neon.tech/db?sslmode=require
DEEPSEEK_API_KEY=sk-...

# Cloudflare secrets (wrangler secret put)
# - DATABASE_URL
# - DEEPSEEK_API_KEY
```

## Key Commands

```bash
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm check            # TypeScript/Svelte validation
pnpm format           # Prettier formatting
pnpm lint             # ESLint

# Database
pnpm db:generate      # Generate migrations
pnpm db:migrate       # Run migrations
pnpm db:push          # Push schema directly (dev)
pnpm db:studio        # Drizzle Studio GUI

# Cloudflare
pnpm wrangler pages dev .svelte-kit/cloudflare   # Local CF preview
pnpm wrangler pages deploy .svelte-kit/cloudflare # Deploy
```

## Cloudflare Bindings

Configured in `wrangler.toml`:
- `RATE_LIMIT_KV` - KV namespace for rate limiting (optional, can use DB instead)

Platform types in `src/app.d.ts`.

## pgvector Setup

Enable the extension and create an HNSW index for fast similarity search:

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- After populating data, create HNSW index for cosine similarity
CREATE INDEX ON content_chunks USING hnsw (embedding vector_cosine_ops);
```

Similarity search query pattern:

```sql
-- Find top 5 most similar chunks using cosine distance
SELECT id, content, source_file, heading, 
       1 - (embedding <=> $query_embedding) AS similarity
FROM content_chunks
ORDER BY embedding <=> $query_embedding
LIMIT 5;
```

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| DB Client | Neon serverless | HTTP-based, works in CF Workers (no TCP) |
| Vector Store | pgvector (Neon) | Single DB for content + embeddings, no separate service |
| Chunking | H2/H3 header-based | Semantic coherence, ~500 tokens |
| Rate limit | 10 req/min/IP | Prevents abuse, low friction |
| Embeddings | Workers AI BGE | 768 dims, fast, CF-integrated |
| Vector Index | HNSW | Better query performance than IVFFlat |

## Privacy

- Only `public: true` frontmatter files are indexed
- Personal sections stripped during extraction
- Wiki-links to private notes sanitized
- System prompt prevents hallucination beyond context

---

## TODO: Path to Deployment

### Phase 1: Infrastructure Setup
- [x] Create Neon database project
  - [x] Sign up at neon.tech
  - [x] Create project and copy connection string
  - [x] Add to `.env` locally
  - [x] Run `pnpm db:push` to create tables
- [ ] Enable pgvector extension
  - [ ] Run `CREATE EXTENSION IF NOT EXISTS vector;` in Neon SQL Editor
- [ ] Create Cloudflare resources
  - [ ] KV namespace for rate limiting (optional)
  - [ ] Pages project
- [ ] Set Cloudflare secrets
  - [ ] `wrangler secret put DATABASE_URL`
  - [ ] `wrangler secret put DEEPSEEK_API_KEY`

### Phase 2: Chat API
- [ ] Create `/api/chat/+server.ts`
  - [ ] Parse user message from request
  - [ ] Implement rate limiting (DB or KV, 10 req/min/IP)
  - [ ] Generate query embedding (Workers AI)
  - [ ] Search pgvector for top 5 similar chunks (cosine distance)
  - [ ] Build prompt with RAG context
  - [ ] Call DeepSeek API
  - [ ] Return response
- [ ] Create rate limiting utility (`src/lib/server/rate-limit.ts`)
- [ ] Create embedding utility (`src/lib/server/embeddings.ts`)
- [ ] Add error handling and validation

### Phase 3: Chat UI
- [ ] Create `ChatMessage.svelte` component
  - [ ] User message styling
  - [ ] Assistant message styling with prose typography
  - [ ] Loading state
- [ ] Create `ChatInput.svelte` component
  - [ ] Text input with submit button
  - [ ] Disable while loading
  - [ ] Enter to submit
- [ ] Update `+page.svelte`
  - [ ] Message list state
  - [ ] Form submission handler
  - [ ] Scroll to bottom on new messages
  - [ ] Welcome message / empty state
- [ ] Add responsive layout
- [ ] Test on mobile

### Phase 4: CI/CD
- [ ] Create `.github/workflows/deploy.yml`
  - [ ] Trigger on push to main
  - [ ] Install dependencies
  - [ ] Build SvelteKit app
  - [ ] Deploy to Cloudflare Pages
- [ ] Add GitHub repository secrets
  - [ ] `CLOUDFLARE_API_TOKEN`
  - [ ] `CLOUDFLARE_ACCOUNT_ID`
- [ ] Test deployment workflow

### Phase 5: Testing
- [ ] Verify PKM has synced content to Neon DB
- [ ] End-to-end testing
  - [ ] Test chat flow locally
  - [ ] Test rate limiting
  - [ ] Test with production deployment
- [ ] Monitor and iterate
  - [ ] Check response quality
  - [ ] Tune system prompt

### Phase 6: Polish (Optional)
- [ ] Add streaming responses
- [ ] Add conversation persistence
- [ ] Add analytics/monitoring
- [ ] Custom domain setup
- [ ] SEO metadata

---

## Notes for Claude

When helping with this project:
- Use TypeScript throughout
- Follow Cloudflare Workers patterns for bindings
- Access platform bindings via `platform.env` in server routes
- Create DB client per-request: `createDb(platform.env.DATABASE_URL)`
- Prefer Svelte 5 runes (`$state`, `$derived`, `$props`)
- Use Tailwind utility classes, DaisyUI components where appropriate
