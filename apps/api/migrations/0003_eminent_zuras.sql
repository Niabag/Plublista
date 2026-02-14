CREATE TYPE "public"."content_status" AS ENUM('draft', 'generating', 'scheduled', 'published', 'failed');--> statement-breakpoint
CREATE TYPE "public"."content_type" AS ENUM('reel', 'carousel', 'post');--> statement-breakpoint
CREATE TABLE "content_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "content_type" NOT NULL,
	"title" varchar(255),
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"style" varchar(50),
	"format" varchar(10),
	"duration" integer,
	"media_urls" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"generated_media_url" varchar(2048),
	"caption" text,
	"hashtags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"hook_text" text,
	"cta_text" text,
	"music_url" varchar(2048),
	"music_prompt" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quota_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"reels_used" integer DEFAULT 0 NOT NULL,
	"reels_limit" integer NOT NULL,
	"carousels_used" integer DEFAULT 0 NOT NULL,
	"carousels_limit" integer NOT NULL,
	"ai_images_used" integer DEFAULT 0 NOT NULL,
	"ai_images_limit" integer NOT NULL,
	"platforms_connected" integer DEFAULT 0 NOT NULL,
	"platforms_limit" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quota_usage" ADD CONSTRAINT "quota_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_content_items_user_id" ON "content_items" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_content_items_user_id_status" ON "content_items" USING btree ("user_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_quota_usage_user_period" ON "quota_usage" USING btree ("user_id","period_start");