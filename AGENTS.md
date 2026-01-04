# AGENTS.md

## Overview
Public PKM chat interface powered by SvelteKit and Cloudflare Pages/Workers. The app answers questions about public notes and projects using RAG (retrieve from pgvector in Neon, then generate a response).

## Stack
- SvelteKit 2 + Svelte 5
- Tailwind CSS 4 + DaisyUI
- Cloudflare Pages/Workers (adapter)
- Neon Postgres + pgvector
- Drizzle ORM
- OpenRouter SDK (embeddings + chat)

## Key Paths
- `src/routes/+page.svelte` – chat UI
- `src/lib/client/pipeline.ts` – client-side streaming pipeline
- `src/routes/api/chat/+server.ts` – RAG endpoint (embeddings → retrieval → streamed response)
- `src/lib/server/embeddings.ts` – OpenRouter embeddings (768 dims)
- `src/lib/server/rag.ts` – pgvector similarity search
- `src/lib/server/db/` – Drizzle schema + Neon client

## Data Flow
1) User submits a question from the UI
2) Client calls `/api/chat` and reads a text stream
3) Server embeds query via OpenRouter
4) Server finds top chunks in `content_chunks` using cosine distance
5) Server builds a system prompt from those chunks
6) Server streams OpenRouter chat deltas as plain text

## Database
Tables (Drizzle schema):
- `content_chunks` (markdown chunks + 768-dim embedding)
- `rate_limits`
- `chat_sessions`
- `chat_messages`
- `sync_manifest` (PKM sync state)

pgvector is required:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE INDEX ON content_chunks USING hnsw (embedding vector_cosine_ops);
```

## Environment Variables
- `DATABASE_URL` (Neon connection string)
- `OPENROUTER_API_KEY`
- `OPENROUTER_EMBEDDING_MODEL` (optional, defaults to `qwen/qwen3-embedding-8b`)
- `OPENROUTER_CHAT_MODEL` (optional, defaults to `openai/gpt-4o-mini`)

## Scripts
- `pnpm dev` – local dev server
- `pnpm build` – production build
- `pnpm db:generate` – generate migrations
- `pnpm db:migrate` – apply migrations
- `pnpm db:push` – push schema (dev)
- `pnpm db:studio` – Drizzle Studio GUI

## Notes
- Embedding dimension is enforced as 768; changing models may require a schema migration.
- `/api/chat` currently expects a single user message (`message`) but can accept a `messages` array.
