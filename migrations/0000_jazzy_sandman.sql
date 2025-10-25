CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vault_id" uuid,
	"actor" varchar(42) NOT NULL,
	"action" varchar(100) NOT NULL,
	"resource" varchar(100) NOT NULL,
	"resource_id" varchar(66),
	"tx_hash" varchar(66),
	"user_op_hash" varchar(66),
	"data" jsonb,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "escrows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vault_id" uuid NOT NULL,
	"policy_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"token" varchar(42) NOT NULL,
	"total_amount" varchar(78) NOT NULL,
	"requester" varchar(42),
	"recipient" varchar(42),
	"target" varchar(42),
	"data" text,
	"reason" text,
	"collected_amount" varchar(78),
	"participants" jsonb,
	"status" varchar(50) DEFAULT 'draft',
	"deadline" timestamp,
	"scheduled_release_at" timestamp,
	"expires_at" timestamp,
	"escrow_id" varchar(66),
	"tx_hash" varchar(66),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb,
	CONSTRAINT "escrows_escrow_id_unique" UNIQUE("escrow_id")
);
--> statement-breakpoint
CREATE TABLE "invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vault_id" uuid NOT NULL,
	"token" varchar(255) NOT NULL,
	"role" varchar(50) NOT NULL,
	"weight" integer DEFAULT 1,
	"signature" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"used_by" varchar(42),
	"created_by" varchar(42) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb,
	CONSTRAINT "invites_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vault_id" uuid NOT NULL,
	"address" varchar(42) NOT NULL,
	"role" varchar(50) NOT NULL,
	"weight" integer DEFAULT 1,
	"added_at" timestamp DEFAULT now() NOT NULL,
	"added_by" varchar(42),
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(42) NOT NULL,
	"vault_id" uuid,
	"type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"read" boolean DEFAULT false,
	"data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"read_at" timestamp,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"policy_id" varchar(66) NOT NULL,
	"vault_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"threshold" integer,
	"timelock" integer,
	"roles_root" varchar(66),
	"owners_root" varchar(66),
	"max_amount" varchar(78),
	"collection_config" jsonb,
	"active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb,
	CONSTRAINT "policies_policy_id_unique" UNIQUE("policy_id")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_address" varchar(42) NOT NULL,
	"chain_id" integer NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_accessed_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"metadata" jsonb,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "shareable_key_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key_id" uuid NOT NULL,
	"user_address" varchar(42) NOT NULL,
	"action" varchar(100) NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"used_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "shareable_keys" (
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
--> statement-breakpoint
CREATE TABLE "timelines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"escrow_id" varchar(66) NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"actor" varchar(42) NOT NULL,
	"tx_hash" varchar(66),
	"user_op_hash" varchar(66),
	"data" jsonb,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "vaults" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"address" varchar(42) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"chain_id" integer NOT NULL,
	"caip10" varchar(100) NOT NULL,
	"uuid" uuid NOT NULL,
	"salt" varchar(66),
	"factory_address" varchar(42),
	"policy_id" varchar(66),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb,
	CONSTRAINT "vaults_address_unique" UNIQUE("address"),
	CONSTRAINT "vaults_caip10_unique" UNIQUE("caip10"),
	CONSTRAINT "vaults_uuid_unique" UNIQUE("uuid")
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_vault_id_vaults_id_fk" FOREIGN KEY ("vault_id") REFERENCES "public"."vaults"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escrows" ADD CONSTRAINT "escrows_vault_id_vaults_id_fk" FOREIGN KEY ("vault_id") REFERENCES "public"."vaults"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escrows" ADD CONSTRAINT "escrows_policy_id_policies_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."policies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_vault_id_vaults_id_fk" FOREIGN KEY ("vault_id") REFERENCES "public"."vaults"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_vault_id_vaults_id_fk" FOREIGN KEY ("vault_id") REFERENCES "public"."vaults"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_vault_id_vaults_id_fk" FOREIGN KEY ("vault_id") REFERENCES "public"."vaults"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policies" ADD CONSTRAINT "policies_vault_id_vaults_id_fk" FOREIGN KEY ("vault_id") REFERENCES "public"."vaults"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shareable_key_usage" ADD CONSTRAINT "shareable_key_usage_key_id_shareable_keys_id_fk" FOREIGN KEY ("key_id") REFERENCES "public"."shareable_keys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shareable_keys" ADD CONSTRAINT "shareable_keys_vault_id_vaults_id_fk" FOREIGN KEY ("vault_id") REFERENCES "public"."vaults"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_actor_idx" ON "audit_logs" USING btree ("actor");--> statement-breakpoint
CREATE INDEX "audit_action_idx" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_timestamp_idx" ON "audit_logs" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "escrow_escrow_id_idx" ON "escrows" USING btree ("escrow_id");--> statement-breakpoint
CREATE INDEX "escrow_vault_idx" ON "escrows" USING btree ("vault_id");--> statement-breakpoint
CREATE INDEX "escrow_policy_idx" ON "escrows" USING btree ("policy_id");--> statement-breakpoint
CREATE INDEX "escrow_status_idx" ON "escrows" USING btree ("status");--> statement-breakpoint
CREATE INDEX "escrow_type_idx" ON "escrows" USING btree ("type");--> statement-breakpoint
CREATE INDEX "escrow_vault_type_idx" ON "escrows" USING btree ("vault_id","type");--> statement-breakpoint
CREATE UNIQUE INDEX "invite_token_idx" ON "invites" USING btree ("token");--> statement-breakpoint
CREATE INDEX "invite_vault_idx" ON "invites" USING btree ("vault_id");--> statement-breakpoint
CREATE INDEX "invite_expires_idx" ON "invites" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "vault_member_idx" ON "members" USING btree ("vault_id","address");--> statement-breakpoint
CREATE INDEX "member_address_idx" ON "members" USING btree ("address");--> statement-breakpoint
CREATE INDEX "notification_user_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notification_read_idx" ON "notifications" USING btree ("read");--> statement-breakpoint
CREATE INDEX "notification_created_idx" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "policy_id_idx" ON "policies" USING btree ("policy_id");--> statement-breakpoint
CREATE INDEX "policy_vault_idx" ON "policies" USING btree ("vault_id");--> statement-breakpoint
CREATE INDEX "policy_type_idx" ON "policies" USING btree ("type");--> statement-breakpoint
CREATE INDEX "policy_vault_type_idx" ON "policies" USING btree ("vault_id","type");--> statement-breakpoint
CREATE UNIQUE INDEX "session_token_idx" ON "sessions" USING btree ("token");--> statement-breakpoint
CREATE INDEX "session_user_address_idx" ON "sessions" USING btree ("user_address");--> statement-breakpoint
CREATE INDEX "session_expires_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "session_chain_id_idx" ON "sessions" USING btree ("chain_id");--> statement-breakpoint
CREATE INDEX "key_usage_key_idx" ON "shareable_key_usage" USING btree ("key_id");--> statement-breakpoint
CREATE INDEX "key_usage_user_idx" ON "shareable_key_usage" USING btree ("user_address");--> statement-breakpoint
CREATE INDEX "key_usage_timestamp_idx" ON "shareable_key_usage" USING btree ("used_at");--> statement-breakpoint
CREATE UNIQUE INDEX "shareable_key_token_idx" ON "shareable_keys" USING btree ("token");--> statement-breakpoint
CREATE UNIQUE INDEX "shareable_key_url_idx" ON "shareable_keys" USING btree ("share_url");--> statement-breakpoint
CREATE INDEX "shareable_key_vault_idx" ON "shareable_keys" USING btree ("vault_id");--> statement-breakpoint
CREATE INDEX "shareable_key_creator_idx" ON "shareable_keys" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "shareable_key_status_idx" ON "shareable_keys" USING btree ("status");--> statement-breakpoint
CREATE INDEX "timeline_escrow_idx" ON "timelines" USING btree ("escrow_id");--> statement-breakpoint
CREATE INDEX "timeline_timestamp_idx" ON "timelines" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "timeline_event_type_idx" ON "timelines" USING btree ("event_type");--> statement-breakpoint
CREATE UNIQUE INDEX "vault_address_idx" ON "vaults" USING btree ("address");--> statement-breakpoint
CREATE UNIQUE INDEX "vault_caip10_idx" ON "vaults" USING btree ("caip10");--> statement-breakpoint
CREATE UNIQUE INDEX "vault_uuid_idx" ON "vaults" USING btree ("uuid");--> statement-breakpoint
CREATE INDEX "vault_chain_id_idx" ON "vaults" USING btree ("chain_id");