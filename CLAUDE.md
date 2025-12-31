# Public PKM Interface

A public-facing AI chat interface where visitors can ask natural language questions about goals, progress, and projects. Powered by RAG using curated PKM content.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | SvelteKit 2.x, Svelte 5, Tailwind CSS 4, DaisyUI |
| Database | PostgreSQL (Neon serverless) |
| ORM | Drizzle ORM with Neon HTTP driver |
| Vector DB | Cloudflare Vectorize |
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
│   │   │   └── db/
│   │   │       ├── schema.ts      # Drizzle schema
│   │   │       └── index.ts       # DB client factory
│   │   ├── components/            # Svelte components
│   │   └── utils/                 # Shared utilities
│   ├── app.css                    # Tailwind entry
│   ├── app.d.ts                   # TypeScript declarations
│   └── app.html                   # HTML template
├── scripts/                       # Content pipeline scripts
│   ├── extract-public.ts          # Find public: true files
│   ├── chunk-markdown.ts          # Semantic chunking
│   └── sync-vectorize.ts          # Embeddings + Vectorize sync
├── drizzle/                       # Generated migrations
├── drizzle.config.ts              # Drizzle Kit config
├── wrangler.toml                  # Cloudflare bindings
├── svelte.config.js               # SvelteKit config
├── vite.config.ts                 # Vite config
└── package.json
```

## Architecture

```
Content Source (markdown with `public: true`)
        │
        ▼
Content Pipeline (scripts/)
  1. Extract public content
  2. Chunk by H2/H3 sections (~500 tokens)
  3. Generate embeddings (Workers AI)
  4. Upsert to Vectorize
        │
        ▼
Cloudflare (Pages + Workers + Vectorize)
        │
        ▼
User Query → Embed → Vectorize Search → DeepSeek + Context → Response
```

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
- `VECTORIZE` - Vectorize index binding
- `RATE_LIMIT_KV` - KV namespace for rate limiting

Platform types in `src/app.d.ts`.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| DB Client | Neon serverless | HTTP-based, works in CF Workers (no TCP) |
| Chunking | H2/H3 header-based | Semantic coherence, ~500 tokens |
| Rate limit | 10 req/min/IP | Prevents abuse, low friction |
| Embeddings | Workers AI BGE | 768 dims, fast, CF-integrated |

## Privacy

- Only `public: true` frontmatter files are indexed
- Personal sections stripped during extraction
- Wiki-links to private notes sanitized
- System prompt prevents hallucination beyond context

---

## TODO: Path to Deployment

### Phase 1: Infrastructure Setup
- [ ] Create Neon database project
  - [ ] Sign up at neon.tech
  - [ ] Create project and copy connection string
  - [ ] Add to `.env` locally
  - [ ] Run `pnpm db:push` to create tables
- [ ] Create Cloudflare resources
  - [ ] Vectorize index: `pkm-public-index` (768 dims, cosine)
  - [ ] KV namespace for rate limiting
  - [ ] Pages project
  - [ ] Update `wrangler.toml` with KV namespace ID
- [ ] Set Cloudflare secrets
  - [ ] `wrangler secret put DATABASE_URL`
  - [ ] `wrangler secret put DEEPSEEK_API_KEY`

### Phase 2: Content Pipeline
- [ ] Create `scripts/extract-public.ts`
  - [ ] Scan source directory for markdown files
  - [ ] Parse YAML frontmatter, filter `public: true`
  - [ ] Strip private sections (Gratitude, personal meetings)
  - [ ] Sanitize wiki-links to private notes
- [ ] Create `scripts/chunk-markdown.ts`
  - [ ] Split content by H2/H3 headers
  - [ ] Target ~500 tokens per chunk
  - [ ] Preserve metadata (source file, heading)
- [ ] Create `scripts/sync-vectorize.ts`
  - [ ] Generate embeddings via Workers AI API
  - [ ] Upsert vectors to Cloudflare Vectorize
  - [ ] Store chunks in Neon DB with embeddings
- [ ] Test pipeline locally with sample files

### Phase 3: Chat API
- [ ] Create `/api/chat/+server.ts`
  - [ ] Parse user message from request
  - [ ] Implement rate limiting (check KV, 10 req/min/IP)
  - [ ] Generate query embedding (Workers AI)
  - [ ] Search Vectorize for top 5 similar chunks
  - [ ] Build prompt with RAG context
  - [ ] Call DeepSeek API
  - [ ] Return response
- [ ] Create rate limiting utility (`src/lib/server/rate-limit.ts`)
- [ ] Create embedding utility (`src/lib/server/embeddings.ts`)
- [ ] Add error handling and validation

### Phase 4: Chat UI
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

### Phase 5: CI/CD
- [ ] Create `.github/workflows/deploy.yml`
  - [ ] Trigger on push to main
  - [ ] Install dependencies
  - [ ] Run content pipeline scripts
  - [ ] Build SvelteKit app
  - [ ] Deploy to Cloudflare Pages
- [ ] Add GitHub repository secrets
  - [ ] `CLOUDFLARE_API_TOKEN`
  - [ ] `CLOUDFLARE_ACCOUNT_ID`
  - [ ] `DATABASE_URL`
  - [ ] `DEEPSEEK_API_KEY`
- [ ] Test deployment workflow

### Phase 6: Content & Testing
- [ ] Prepare initial public content
  - [ ] Create sample markdown files with `public: true`
  - [ ] Run content pipeline
  - [ ] Verify vectors in Vectorize
- [ ] End-to-end testing
  - [ ] Test chat flow locally
  - [ ] Test rate limiting
  - [ ] Test with production deployment
- [ ] Monitor and iterate
  - [ ] Check response quality
  - [ ] Adjust chunking if needed
  - [ ] Tune system prompt

### Phase 7: Polish (Optional)
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
