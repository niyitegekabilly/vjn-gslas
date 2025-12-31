
export const TABLE_SCHEMA_SQL = `
-- OPTIONAL: Run this if you haven't created tables yet.
-- If you used the Seeder, these might already exist.

CREATE TABLE IF NOT EXISTS "users" (
  "id" text PRIMARY KEY,
  "fullName" text,
  "email" text UNIQUE,
  "phone" text,
  "passwordHash" text,
  "role" text,
  "status" text,
  "branchId" text,
  "linkedMemberId" text,
  "managedGroupId" text,
  "lastLogin" text,
  "failedLoginAttempts" integer DEFAULT 0,
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
  "coordinates" jsonb,
  "presidentId" text,
  "secretaryId" text,
  "accountantId" text,
  "meetingDay" text,
  "meetingFrequency" text,
  "shareValue" integer,
  "minShares" integer,
  "maxShares" integer,
  "maxLoanMultiplier" numeric,
  "lateFeeAmount" numeric,
  "lateFeeType" text,
  "constitutionUrl" text,
  "currentCycleId" text,
  "status" text,
  "totalSavings" numeric DEFAULT 0,
  "totalLoansOutstanding" numeric DEFAULT 0,
  "totalSolidarity" numeric DEFAULT 0,
  "createdAt" text,
  "auditHistory" jsonb DEFAULT '[]'
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
  "photoUrl" text
);

CREATE TABLE IF NOT EXISTS "loans" (
  "id" text PRIMARY KEY,
  "memberId" text REFERENCES "members"("id"),
  "groupId" text REFERENCES "groups"("id"),
  "principal" numeric,
  "interestRate" numeric,
  "totalRepayable" numeric,
  "balance" numeric,
  "status" text,
  "startDate" text,
  "dueDate" text,
  "purpose" text
);

CREATE TABLE IF NOT EXISTS "transactions" (
  "id" text PRIMARY KEY,
  "groupId" text REFERENCES "groups"("id"),
  "memberId" text,
  "cycleId" text,
  "type" text,
  "amount" numeric,
  "date" text,
  "description" text,
  "categoryId" text,
  "shareCount" integer,
  "solidarityAmount" numeric,
  "paymentMethod" text,
  "isVoid" boolean DEFAULT false,
  "voidReason" text,
  "notes" text,
  "recordedBy" text,
  "editHistory" jsonb DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS "fines" (
  "id" text PRIMARY KEY,
  "groupId" text REFERENCES "groups"("id"),
  "memberId" text REFERENCES "members"("id"),
  "cycleId" text,
  "date" text,
  "categoryId" text,
  "amount" numeric,
  "paidAmount" numeric DEFAULT 0,
  "status" text,
  "reason" text,
  "recordedBy" text
);

CREATE TABLE IF NOT EXISTS "attendance" (
  "id" text PRIMARY KEY,
  "meetingId" text,
  "groupId" text REFERENCES "groups"("id"),
  "memberId" text REFERENCES "members"("id"),
  "date" text,
  "status" text,
  "notes" text,
  "recordedBy" text,
  "auditHistory" jsonb DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS "cycles" (
  "id" text PRIMARY KEY,
  "groupId" text,
  "startDate" text,
  "endDate" text,
  "status" text,
  "interestRate" numeric
);

CREATE TABLE IF NOT EXISTS "notifications" (
  "id" text PRIMARY KEY,
  "title" text,
  "message" text,
  "date" text,
  "read" boolean DEFAULT false,
  "type" text
);

CREATE TABLE IF NOT EXISTS "fine_categories" (
  "id" text PRIMARY KEY,
  "groupId" text,
  "name" text,
  "defaultAmount" numeric,
  "isSystem" boolean,
  "active" boolean
);

CREATE TABLE IF NOT EXISTS "expense_categories" (
  "id" text PRIMARY KEY,
  "groupId" text,
  "name" text,
  "active" boolean
);

CREATE TABLE IF NOT EXISTS "meetings" (
  "id" text PRIMARY KEY,
  "groupId" text,
  "date" text,
  "type" text,
  "notes" text,
  "createdBy" text,
  "createdAt" text
);
`;

export const RLS_POLICIES_SQL = `
-- =========================================================
-- VJN GSLA ROW LEVEL SECURITY POLICIES (OPEN ACCESS)
-- Run this in the Supabase SQL Editor to allow the application to function.
--
-- NOTE: Since this application uses a custom 'users' table and not Supabase Auth,
-- we must allow anonymous/public access to these tables for the API to work.
-- Security is handled at the application layer via login checks.
-- =========================================================

-- 1. Enable RLS on all tables (Standard Practice)
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "groups" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "loans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "fines" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "attendance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cycles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "fine_categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "expense_categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "meetings" ENABLE ROW LEVEL SECURITY;

-- 2. Create Permissive Policies (ALLOW ALL)
-- "WITH CHECK (true)" is CRITICAL for inserts to work for anon roles.

CREATE POLICY "Allow Public Access" ON "users" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow Public Access" ON "groups" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow Public Access" ON "members" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow Public Access" ON "loans" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow Public Access" ON "transactions" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow Public Access" ON "fines" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow Public Access" ON "attendance" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow Public Access" ON "cycles" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow Public Access" ON "notifications" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow Public Access" ON "fine_categories" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow Public Access" ON "expense_categories" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow Public Access" ON "meetings" FOR ALL USING (true) WITH CHECK (true);
`;
