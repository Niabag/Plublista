CREATE TYPE "public"."api_service" AS ENUM('fal', 'ayrshare', 'stripe', 'claude', 'instagram');--> statement-breakpoint
CREATE TYPE "public"."publish_status" AS ENUM('pending', 'publishing', 'published', 'failed', 'retrying');--> statement-breakpoint
CREATE TABLE "api_cost_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"service" "api_service" NOT NULL,
	"endpoint" varchar(255) NOT NULL,
	"cost_usd" numeric(10, 4) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "publish_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"content_item_id" uuid NOT NULL,
	"platform" "platform" NOT NULL,
	"status" "publish_status" DEFAULT 'pending' NOT NULL,
	"published_url" text,
	"error_message" text,
	"error_code" varchar(100),
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"scheduled_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "api_cost_logs" ADD CONSTRAINT "api_cost_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publish_jobs" ADD CONSTRAINT "publish_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publish_jobs" ADD CONSTRAINT "publish_jobs_content_item_id_content_items_id_fk" FOREIGN KEY ("content_item_id") REFERENCES "public"."content_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_api_cost_logs_user_id" ON "api_cost_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_api_cost_logs_user_id_created_at" ON "api_cost_logs" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_publish_jobs_user_id" ON "publish_jobs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_publish_jobs_content_item_id" ON "publish_jobs" USING btree ("content_item_id");--> statement-breakpoint
CREATE INDEX "idx_publish_jobs_user_id_status" ON "publish_jobs" USING btree ("user_id","status");