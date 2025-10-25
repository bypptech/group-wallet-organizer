CREATE TABLE IF NOT EXISTS "shareable_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vault_id" uuid,
	"name" varchar(255) NOT NULL,
	"description" text,
	"key_type" varchar(50) NOT NULL,
	"permissions" jsonb NOT NULL,
	"share_url" text NOT NULL,
	"token" varchar(255) NOT NULL,
	"max_uses" integer,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"revoked_at" timestamp,
	"revoked_by" varchar(42),
	"created_by" varchar(42) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb,
	CONSTRAINT "shareable_keys_share_url_unique" UNIQUE("share_url"),
	CONSTRAINT "shareable_keys_token_unique" UNIQUE("token")
);

CREATE TABLE IF NOT EXISTS "shareable_key_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key_id" uuid NOT NULL,
	"user_address" varchar(42) NOT NULL,
	"action" varchar(100) NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"used_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb
);

-- Foreign keys
DO $$ BEGIN
 ALTER TABLE "shareable_key_usage" ADD CONSTRAINT "shareable_key_usage_key_id_shareable_keys_id_fk" FOREIGN KEY ("key_id") REFERENCES "public"."shareable_keys"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "shareable_keys" ADD CONSTRAINT "shareable_keys_vault_id_vaults_id_fk" FOREIGN KEY ("vault_id") REFERENCES "public"."vaults"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS "key_usage_key_idx" ON "shareable_key_usage" USING btree ("key_id");
CREATE INDEX IF NOT EXISTS "key_usage_user_idx" ON "shareable_key_usage" USING btree ("user_address");
CREATE INDEX IF NOT EXISTS "key_usage_timestamp_idx" ON "shareable_key_usage" USING btree ("used_at");
CREATE UNIQUE INDEX IF NOT EXISTS "shareable_key_token_idx" ON "shareable_keys" USING btree ("token");
CREATE UNIQUE INDEX IF NOT EXISTS "shareable_key_url_idx" ON "shareable_keys" USING btree ("share_url");
CREATE INDEX IF NOT EXISTS "shareable_key_vault_idx" ON "shareable_keys" USING btree ("vault_id");
CREATE INDEX IF NOT EXISTS "shareable_key_creator_idx" ON "shareable_keys" USING btree ("created_by");
CREATE INDEX IF NOT EXISTS "shareable_key_status_idx" ON "shareable_keys" USING btree ("status");
