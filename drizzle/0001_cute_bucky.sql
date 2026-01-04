CREATE TABLE "sync_manifest" (
	"file_path" text PRIMARY KEY NOT NULL,
	"content_hash" text NOT NULL,
	"last_synced" timestamp with time zone DEFAULT now()
);
