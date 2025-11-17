ALTER TABLE "embeddings" DROP CONSTRAINT "embeddings_major_id_majors_id_fk";
--> statement-breakpoint
ALTER TABLE "campuses" DROP COLUMN "description";--> statement-breakpoint
ALTER TABLE "campuses" DROP COLUMN "website";--> statement-breakpoint
ALTER TABLE "campuses" DROP COLUMN "metadata";--> statement-breakpoint
ALTER TABLE "embeddings" DROP COLUMN "major_id";