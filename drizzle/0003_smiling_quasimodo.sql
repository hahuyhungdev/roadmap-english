ALTER TABLE "youtube_transcripts" ALTER COLUMN "sentences" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "youtube_transcripts" ADD COLUMN "raw_segments" jsonb;--> statement-breakpoint
ALTER TABLE "youtube_transcripts" ALTER COLUMN "source" SET DEFAULT 'supadata';