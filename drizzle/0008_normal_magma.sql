CREATE TABLE "degrees" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text,
	"level" text,
	CONSTRAINT "degrees_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "major_degrees" (
	"id" serial PRIMARY KEY NOT NULL,
	"major_id" integer NOT NULL,
	"degree_id" integer NOT NULL,
	"required_credits" integer,
	"typical_duration" integer
);
--> statement-breakpoint
ALTER TABLE "majors" ALTER COLUMN "duration" SET DATA TYPE integer USING (
  CASE 
    WHEN duration IS NULL THEN NULL
    ELSE NULL
  END
);--> statement-breakpoint
ALTER TABLE "major_degrees" ADD CONSTRAINT "major_degrees_major_id_majors_id_fk" FOREIGN KEY ("major_id") REFERENCES "public"."majors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "major_degrees" ADD CONSTRAINT "major_degrees_degree_id_degrees_id_fk" FOREIGN KEY ("degree_id") REFERENCES "public"."degrees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campuses" DROP COLUMN "contact";