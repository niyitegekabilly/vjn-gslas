
export const TABLE_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS "meetings" (
  "id" text PRIMARY KEY,
  "groupId" text,
  "date" text,
  "type" text,
  "notes" text,
  "createdBy" text,
  "createdAt" text
);

CREATE TABLE IF NOT EXISTS "system_settings" (
  "id" text PRIMARY KEY,
  "sessionTimeoutMinutes" integer DEFAULT 60,
  "passwordMinLength" integer DEFAULT 8,
  "passwordRequireSpecial" boolean DEFAULT false,
  "passwordRequireNumber" boolean DEFAULT true,
  "passwordRequireUppercase" boolean DEFAULT false,
  "enforce2FA" boolean DEFAULT false,
  "lastForceLogoutAt" text,
  "updatedAt" text,
  "updatedBy" text
);

CREATE TABLE IF NOT EXISTS "sms_templates" (
  "eventType" text PRIMARY KEY,
  "template" text,
  "isEnabled" boolean DEFAULT true,
  "description" text,
  "variables" text[]
);

CREATE TABLE IF NOT EXISTS "sms_config" (
  "id" text PRIMARY KEY,
  "isLiveMode" boolean DEFAULT false,
  "monthlyCap" integer DEFAULT 1000,
  "currentUsage" integer DEFAULT 0,
  "lowBalanceThreshold" integer DEFAULT 100,
  "updatedAt" text,
  "updatedBy" text
);

CREATE TABLE IF NOT EXISTS "sms_logs" (
  "id" text PRIMARY KEY,
  "recipient" text,
  "message" text,
  "status" text,
  "sentAt" text,
  "triggerBy" text,
  "groupId" text,
  "error" text,
  "providerResponse" jsonb
);

-- =========================================================
-- MIGRATIONS (Run these if you encounter missing column errors)
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "approvalRequestId" text;
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "status" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "managedGroupIds" text[];
`;

export const RLS_POLICIES_SQL = `
CREATE POLICY "Allow Public Access" ON "approval_requests" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow Public Access" ON "sms_templates" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow Public Access" ON "sms_logs" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow Public Access" ON "sms_config" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow Public Access" ON "system_settings" FOR ALL USING (true) WITH CHECK (true);
`;
