CREATE TYPE "public"."platform" AS ENUM('instagram', 'youtube', 'tiktok', 'facebook', 'linkedin', 'x');--> statement-breakpoint
CREATE TABLE "platform_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"platform" "platform" NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"token_expires_at" timestamp with time zone,
	"platform_user_id" text NOT NULL,
	"platform_username" text NOT NULL,
	"connected_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "platform_connections" ADD CONSTRAINT "platform_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_platform_connections_user_platform" ON "platform_connections" USING btree ("user_id","platform");