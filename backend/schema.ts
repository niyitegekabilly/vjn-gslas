
export const TABLE_SCHEMA_SQL = `
-- EXISTING TABLES (Core)
CREATE TABLE IF NOT EXISTS "users" (
  "id" text PRIMARY KEY,
  "fullName" text,
  "email" text,
  "phone" text,
  "role" text,
  "status" text,
  "passwordHash" text,
  "twoFactorEnabled" boolean DEFAULT false,
  "linkedMemberId" text,
  "managedGroupIds" text[],
  "failedLoginAttempts" integer DEFAULT 0,
  "lastLogin" text,
  "createdAt" text,
  "createdBy" text
);

CREATE TABLE IF NOT EXISTS "groups" (
  "id" text PRIMARY KEY,
  "name" text,
  "branchId" text,
  "district" text,
  "sector" text,
  "cell" text,
  "village" text,
  "location" text,
  "meetingDay" text,
  "meetingFrequency" text,
  "shareValue" integer,
  "minShares" integer,
  "maxShares" integer,
  "maxLoanMultiplier" numeric,
  "currentCycleId" text,
  "status" text,
  "totalSavings" numeric DEFAULT 0,
  "totalLoansOutstanding" numeric DEFAULT 0,
  "totalSolidarity" numeric DEFAULT 0,
  "lateFeeAmount" numeric,
  "lateFeeType" text,
  "createdAt" text,
  "auditHistory" jsonb DEFAULT '[]',
  "presidentId" text,
  "coordinates" jsonb,
  "constitutionUrl" text
);

CREATE TABLE IF NOT EXISTS "members" (
  "id" text PRIMARY KEY,
  "groupId" text REFERENCES "groups"("id"),
  "fullName" text,
  "nationalId" text,
  "phone" text,
  "role" text,
  "status" text,
  "joinDate" text,
  "totalShares" integer DEFAULT 0,
  "totalLoans" numeric DEFAULT 0,
  "email" text
);

-- CONFIG TABLES
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

-- WORKFLOW TABLES
CREATE TABLE IF NOT EXISTS "approval_workflows" (
  "id" text PRIMARY KEY,
  "groupId" text,
  "scope" text,
  "steps" jsonb,
  "isSequential" boolean DEFAULT true,
  "isEnabled" boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS "approval_requests" (
  "id" text PRIMARY KEY,
  "workflowId" text,
  "entityId" text,
  "entityType" text,
  "requesterId" text,
  "currentStepIndex" integer DEFAULT 0,
  "status" text,
  "logs" jsonb DEFAULT '[]',
  "createdAt" text
);

-- FINANCIAL TABLES
CREATE TABLE IF NOT EXISTS "cycles" (
  "id" text PRIMARY KEY,
  "groupId" text,
  "startDate" text,
  "endDate" text,
  "status" text,
  "interestRate" numeric
);

CREATE TABLE IF NOT EXISTS "loans" (
  "id" text PRIMARY KEY,
  "memberId" text,
  "groupId" text,
  "principal" numeric,
  "interestRate" numeric,
  "totalRepayable" numeric,
  "balance" numeric,
  "status" text,
  "startDate" text,
  "dueDate" text,
  "purpose" text,
  "memberRole" text
);

CREATE TABLE IF NOT EXISTS "transactions" (
  "id" text PRIMARY KEY,
  "groupId" text,
  "memberId" text,
  "cycleId" text,
  "type" text,
  "amount" numeric,
  "date" text,
  "shareCount" integer,
  "solidarityAmount" numeric,
  "description" text,
  "categoryId" text,
  "isVoid" boolean DEFAULT false,
  "voidReason" text,
  "recordedBy" text,
  "approvedBy" text,
  "approvalRequestId" text,
  "status" text,
  "notes" text,
  "editHistory" jsonb DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS "fines" (
  "id" text PRIMARY KEY,
  "groupId" text,
  "memberId" text,
  "cycleId" text,
  "date" text,
  "categoryId" text,
  "amount" numeric,
  "paidAmount" numeric DEFAULT 0,
  "status" text,
  "reason" text,
  "recordedBy" text,
  "auditHistory" jsonb DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS "fine_categories" (
  "id" text PRIMARY KEY,
  "groupId" text,
  "name" text,
  "defaultAmount" numeric,
  "isSystem" boolean DEFAULT false,
  "active" boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS "expense_categories" (
  "id" text PRIMARY KEY,
  "groupId" text,
  "name" text,
  "active" boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS "attendance" (
  "id" text PRIMARY KEY,
  "meetingId" text,
  "groupId" text,
  "date" text,
  "memberId" text,
  "status" text,
  "notes" text,
  "recordedBy" text,
  "auditHistory" jsonb DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS "notifications" (
  "id" text PRIMARY KEY,
  "title" text,
  "message" text,
  "date" text,
  "read" boolean DEFAULT false,
  "type" text
);
`;

export const RLS_POLICIES_SQL = `
-- Generic public access policies for prototype/demo purposes
-- In production, these should be restricted based on "auth.uid()" and "role"

CREATE POLICY "Allow Public Access" ON "users" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow Public Access" ON "groups" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow Public Access" ON "members" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow Public Access" ON "meetings" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow Public Access" ON "loans" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow Public Access" ON "transactions" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow Public Access" ON "fines" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow Public Access" ON "fine_categories" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow Public Access" ON "expense_categories" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow Public Access" ON "attendance" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow Public Access" ON "notifications" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow Public Access" ON "cycles" FOR ALL USING (true) WITH CHECK (true);

-- New Tables
CREATE POLICY "Allow Public Access" ON "approval_workflows" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow Public Access" ON "approval_requests" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow Public Access" ON "sms_templates" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow Public Access" ON "sms_logs" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow Public Access" ON "sms_config" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow Public Access" ON "system_settings" FOR ALL USING (true) WITH CHECK (true);
`;
