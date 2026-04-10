CREATE TABLE "lesson_notes" (
	"session_slug" varchar(100) PRIMARY KEY NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
