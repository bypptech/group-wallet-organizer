-- Add paymaster_settings table
CREATE TABLE IF NOT EXISTS "paymaster_settings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "vault_id" uuid NOT NULL UNIQUE REFERENCES "vaults"("id") ON DELETE CASCADE,

  -- Paymaster Configuration
  "enabled" boolean DEFAULT false NOT NULL,
  "token" varchar(10) DEFAULT 'USDC' NOT NULL,

  -- Balance & Limits
  "balance" varchar(78) DEFAULT '0' NOT NULL,
  "daily_usage" varchar(78) DEFAULT '0' NOT NULL,
  "monthly_limit" varchar(78) DEFAULT '0' NOT NULL,
  "daily_limit" varchar(78) DEFAULT '0' NOT NULL,

  -- Auto-refill Settings
  "auto_refill_enabled" boolean DEFAULT false NOT NULL,
  "refill_threshold" varchar(78) DEFAULT '0' NOT NULL,
  "refill_amount" varchar(78) DEFAULT '0' NOT NULL,

  -- Fallback Settings
  "fallback_enabled" boolean DEFAULT true NOT NULL,

  -- Status
  "health_status" varchar(20) DEFAULT 'healthy' NOT NULL,
  "last_top_up_at" timestamp,
  "last_reset_at" timestamp DEFAULT NOW() NOT NULL,

  -- Timestamps
  "created_at" timestamp DEFAULT NOW() NOT NULL,
  "updated_at" timestamp DEFAULT NOW() NOT NULL,

  -- Additional metadata
  "metadata" jsonb
);

-- Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS "paymaster_vault_idx" ON "paymaster_settings" ("vault_id");
CREATE INDEX IF NOT EXISTS "paymaster_enabled_idx" ON "paymaster_settings" ("enabled");
CREATE INDEX IF NOT EXISTS "paymaster_health_idx" ON "paymaster_settings" ("health_status");
