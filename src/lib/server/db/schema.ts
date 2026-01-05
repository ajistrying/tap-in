import { pgTable, text, timestamp, uuid, vector, integer, index, boolean, date, jsonb } from 'drizzle-orm/pg-core';

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

// Document metadata for hybrid search
export const documents = pgTable(
	'documents',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		sourceFile: text('source_file').notNull().unique(),
		title: text('title'),
		docType: text('doc_type').notNull(),
		public: boolean('public').notNull().default(false),
		docDate: date('doc_date'),
		tags: text('tags').array().notNull().default([]),
		project: text('project'),
		status: text('status'),
		progress: integer('progress'),
		goalHorizon: text('goal_horizon'),
		periodStart: date('period_start'),
		periodEnd: date('period_end'),
		isTemplate: boolean('is_template').notNull().default(false),
		extra: jsonb('extra').notNull().default({}),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
	},
	(table) => [
		index('documents_doc_type_idx').on(table.docType),
		index('documents_doc_date_idx').on(table.docDate),
		index('documents_project_idx').on(table.project),
		index('documents_status_idx').on(table.status),
		index('documents_tags_gin_idx').using('gin', table.tags),
		index('documents_public_idx').on(table.public)
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
