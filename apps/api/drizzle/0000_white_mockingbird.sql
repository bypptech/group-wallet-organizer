CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vault_id" varchar(42),
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
CREATE TABLE "escrow_drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vault_id" varchar(42) NOT NULL,
	"escrow_id" varchar(66),
	"requester" varchar(42) NOT NULL,
	"recipient" varchar(42) NOT NULL,
	"token" varchar(42) NOT NULL,
	"amount" varchar(78) NOT NULL,
	"target" varchar(42),
	"data" text,
	"reason" text,
	"scheduled_release_at" timestamp,
	"expires_at" timestamp,
	"status" varchar(50) DEFAULT 'draft',
	"tx_hash" varchar(66),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb,
	CONSTRAINT "escrow_drafts_escrow_id_unique" UNIQUE("escrow_id")
);
--> statement-breakpoint
CREATE TABLE "invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vault_id" varchar(42) NOT NULL,
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
	"vault_id" varchar(42) NOT NULL,
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
	"vault_id" varchar(42),
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
	"vault_id" varchar(42) NOT NULL,
	"threshold" integer NOT NULL,
	"timelock" integer NOT NULL,
	"roles_root" varchar(66) NOT NULL,
	"owners_root" varchar(66) NOT NULL,
	"max_amount" varchar(78),
	"active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb,
	CONSTRAINT "policies_policy_id_unique" UNIQUE("policy_id")
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
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"vault_id" varchar(66) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"vault_address" varchar(42) PRIMARY KEY NOT NULL,
	"policy_id" varchar(66),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb,
	CONSTRAINT "vaults_vault_id_unique" UNIQUE("vault_id")
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_vault_id_vaults_vault_address_fk" FOREIGN KEY ("vault_id") REFERENCES "public"."vaults"("vault_address") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escrow_drafts" ADD CONSTRAINT "escrow_drafts_vault_id_vaults_vault_address_fk" FOREIGN KEY ("vault_id") REFERENCES "public"."vaults"("vault_address") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_vault_id_vaults_vault_address_fk" FOREIGN KEY ("vault_id") REFERENCES "public"."vaults"("vault_address") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_vault_id_vaults_vault_address_fk" FOREIGN KEY ("vault_id") REFERENCES "public"."vaults"("vault_address") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_vault_id_vaults_vault_address_fk" FOREIGN KEY ("vault_id") REFERENCES "public"."vaults"("vault_address") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policies" ADD CONSTRAINT "policies_vault_id_vaults_vault_address_fk" FOREIGN KEY ("vault_id") REFERENCES "public"."vaults"("vault_address") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_actor_idx" ON "audit_logs" USING btree ("actor");--> statement-breakpoint
CREATE INDEX "audit_action_idx" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_timestamp_idx" ON "audit_logs" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "draft_escrow_id_idx" ON "escrow_drafts" USING btree ("escrow_id");--> statement-breakpoint
CREATE INDEX "draft_vault_idx" ON "escrow_drafts" USING btree ("vault_id");--> statement-breakpoint
CREATE INDEX "draft_status_idx" ON "escrow_drafts" USING btree ("status");--> statement-breakpoint
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
CREATE INDEX "timeline_escrow_idx" ON "timelines" USING btree ("escrow_id");--> statement-breakpoint
CREATE INDEX "timeline_timestamp_idx" ON "timelines" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "timeline_event_type_idx" ON "timelines" USING btree ("event_type");--> statement-breakpoint
CREATE UNIQUE INDEX "vault_id_idx" ON "vaults" USING btree ("vault_id");