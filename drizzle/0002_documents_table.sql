CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"source_file" text NOT NULL UNIQUE,
	"title" text,
	"doc_type" text NOT NULL,
	"public" boolean NOT NULL DEFAULT false,
	"doc_date" date,
	"tags" text[] NOT NULL DEFAULT '{}',
	"project" text,
	"status" text,
	"progress" integer,
	"goal_horizon" text,
	"period_start" date,
	"period_end" date,
	"is_template" boolean NOT NULL DEFAULT false,
	"extra" jsonb NOT NULL DEFAULT '{}'::jsonb,
	"created_at" timestamptz NOT NULL DEFAULT now(),
	"updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX "documents_doc_type_idx" ON "documents" ("doc_type");
CREATE INDEX "documents_doc_date_idx" ON "documents" ("doc_date");
CREATE INDEX "documents_project_idx" ON "documents" ("project");
CREATE INDEX "documents_status_idx" ON "documents" ("status");
CREATE INDEX "documents_tags_gin_idx" ON "documents" USING gin ("tags");
CREATE INDEX "documents_public_idx" ON "documents" ("public");
