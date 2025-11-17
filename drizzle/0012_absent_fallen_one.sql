CREATE TABLE "pathways" (
	"id" text PRIMARY KEY NOT NULL,
	"program_name" text NOT NULL,
	"institution" text,
	"total_credits" text,
	"pathway_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "pathway_program_idx" ON "pathways" USING btree ("program_name");--> statement-breakpoint
CREATE INDEX "embedding_content_hash_idx" ON "embeddings" USING btree ("content_hash");--> statement-breakpoint
CREATE INDEX "embedding_source_ref_idx" ON "embeddings" USING btree ("source_id","ref_id");--> statement-breakpoint
CREATE INDEX "embedding_course_idx" ON "embeddings" USING btree ("course_id");