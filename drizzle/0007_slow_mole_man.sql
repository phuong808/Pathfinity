CREATE TABLE "campuses" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"inst_ipeds" text,
	"description" text,
	"aliases" jsonb,
	"type" text,
	"website" text,
	"contact" jsonb,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"campus_id" text NOT NULL,
	"course_prefix" text NOT NULL,
	"course_number" text NOT NULL,
	"course_title" text,
	"course_desc" text,
	"num_units" text,
	"dept_name" text
);
--> statement-breakpoint
CREATE TABLE "majors" (
	"id" serial PRIMARY KEY NOT NULL,
	"campus_id" text NOT NULL,
	"title" text NOT NULL,
	"department" text,
	"credits" integer,
	"duration" text
);
--> statement-breakpoint
ALTER TABLE "embeddings" ADD COLUMN "campus_id" text;--> statement-breakpoint
ALTER TABLE "embeddings" ADD COLUMN "course_id" integer;--> statement-breakpoint
ALTER TABLE "embeddings" ADD COLUMN "major_id" integer;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_campus_id_campuses_id_fk" FOREIGN KEY ("campus_id") REFERENCES "public"."campuses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "majors" ADD CONSTRAINT "majors_campus_id_campuses_id_fk" FOREIGN KEY ("campus_id") REFERENCES "public"."campuses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "embeddings" ADD CONSTRAINT "embeddings_campus_id_campuses_id_fk" FOREIGN KEY ("campus_id") REFERENCES "public"."campuses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "embeddings" ADD CONSTRAINT "embeddings_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "embeddings" ADD CONSTRAINT "embeddings_major_id_majors_id_fk" FOREIGN KEY ("major_id") REFERENCES "public"."majors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "embeddings" DROP COLUMN "campus";--> statement-breakpoint
ALTER TABLE "embeddings" DROP COLUMN "course_code";