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
- `src/lib/server/queryPlanner.ts` – LLM planner (JSON plan, follow-ups)
- `src/lib/server/queryBuilder.ts` – document filters + metadata context
- `src/lib/server/db/` – Drizzle schema + Neon client

## Data Flow
1) User submits a question from the UI
2) Client calls `/api/chat` and reads a text stream (or JSON follow-up)
3) Server asks planner for a structured query plan
4) Server filters `documents` metadata per plan
5) If needed, server embeds query and vector-searches `content_chunks` (optionally constrained to filtered docs)
6) Server builds a system prompt from metadata + chunks
7) Server streams OpenRouter chat deltas as plain text

## Follow-up Flow (Clarifications)
When the planner needs missing info (ex: time range), the API returns a structured follow-up response instead of streaming text.

### Visual Map
```
User UI
  |
  | POST /api/chat  { message, followup? }
  v
API: /api/chat
  |
  |--> Planner (OpenRouter) -> QueryPlan JSON
  |        |
  |        |-- if followup_question -> return JSON followup
  |
  |--> Document filter (Drizzle) -> documents
  |--> Vector search (pgvector) -> content_chunks
  |--> Build context (docs + chunks)
  |--> Chat stream (OpenRouter) -> text stream
  v
UI stream to user
```

### Follow-up Behavior
1) Planner returns `followup_question` instead of a full plan.
2) API responds with JSON:
   ```json
   { "type": "followup", "followupQuestion": "...", "originalQuestion": "..." }
   ```
3) UI stores the original question and displays the follow-up prompt.
4) Next user message is sent with:
   ```json
   { "message": "answer", "followup": { "originalQuestion": "..." } }
   ```
5) Server composes the original + follow-up into a single question for planning and retrieval, then streams the answer.

### Planner Schema (High-Level)
The planner returns JSON (no SQL). Key fields:
- `intent`: `accomplishments`, `in_flight`, `recap`, `lookup`
- `time_range`: `{ start, end, timezone }` in `YYYY-MM-DD`, or `null`
- `doc_types`: subset of `daily-note`, `project`, `project-note`, `goal`, `idea-captures`
- `project`, `statuses`, `tags`: optional metadata filters
- `answer_mode`: `sql_only`, `hybrid`, `vector_only`
- `limit`: max documents to consider
- `followup_question`: clarification prompt (if needed)

### Request/Response Shapes
- Request: `{ message, timezone?, followup? }` or `{ messages, timezone?, followup? }`
- Response: `text/plain` stream **or** JSON follow-up payload

### Hybrid Retrieval Notes
- Metadata filters are applied to `documents` first (`public = true`, `is_template = false`).
- Vector search is run against `content_chunks`, optionally constrained to filtered `documents.source_file`.
- Context includes metadata summaries + chunk excerpts, with inline citations.

## Database
Tables (Drizzle schema):
- `content_chunks` (markdown chunks + 768-dim embedding)
- `documents` (metadata for hybrid search)
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
- `OPENROUTER_PLANNER_MODEL` (optional, defaults to chat model)

## Scripts
- `pnpm dev` – local dev server
- `pnpm build` – production build
- `pnpm db:generate` – generate migrations
- `pnpm db:migrate` – apply migrations
- `pnpm db:push` – push schema (dev)
- `pnpm db:studio` – Drizzle Studio GUI

## Notes
- Embedding dimension is enforced as 768; changing models may require a schema migration.
- `/api/chat` accepts `message` (or `messages`) and optional `followup` payload; it can return either a text stream or JSON follow-up.
