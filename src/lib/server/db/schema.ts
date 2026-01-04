import { pgTable, text, timestamp, uuid, vector, integer, index } from 'drizzle-orm/pg-core';

// Content chunks for RAG - stores markdown sections with embeddings
export const contentChunks = pgTable(
	'content_chunks',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		content: text('content').notNull(),
		sourceFile: text('source_file').notNull(),
		heading: text('heading'),
		// 768 dimensions for OpenRouter embeddings (nomic-embed-text-v1.5)
		embedding: vector('embedding', { dimensions: 768 }),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull()
	},
	(table) => [
		// HNSW index for fast cosine similarity search
		// Note: Run this after initial data load for better performance
		index('content_chunks_embedding_idx').using('hnsw', table.embedding.op('vector_cosine_ops'))
	]
);

// Rate limiting tracking
export const rateLimits = pgTable('rate_limits', {
	id: uuid('id').primaryKey().defaultRandom(),
	ipAddress: text('ip_address').notNull(),
	requestCount: integer('request_count').notNull().default(0),
	windowStart: timestamp('window_start').defaultNow().notNull()
});

// Chat sessions for conversation tracking (future)
export const chatSessions = pgTable('chat_sessions', {
	id: uuid('id').primaryKey().defaultRandom(),
	ipAddress: text('ip_address'),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

// Chat messages history (future)
export const chatMessages = pgTable('chat_messages', {
	id: uuid('id').primaryKey().defaultRandom(),
	sessionId: uuid('session_id').references(() => chatSessions.id),
	role: text('role').notNull(), // 'user' | 'assistant'
	content: text('content').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

// Sync state for PKM ingestion
export const syncManifest = pgTable('sync_manifest', {
	filePath: text('file_path').primaryKey(),
	contentHash: text('content_hash').notNull(),
	lastSynced: timestamp('last_synced', { withTimezone: true }).defaultNow()
});
