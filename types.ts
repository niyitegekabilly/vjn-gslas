export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  GROUP_LEADER = 'GROUP_LEADER',
  MEMBER_USER = 'MEMBER_USER',
  AUDITOR = 'AUDITOR',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  DISABLED = 'DISABLED',
  LOCKED = 'LOCKED',
  PENDING_PASSWORD = 'PENDING_PASSWORD',
}

export enum MemberStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  EXITED = 'EXITED',
}

export enum LoanStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  ACTIVE = 'ACTIVE',
  CLEARED = 'CLEARED',
  REJECTED = 'REJECTED',
  DEFAULTED = 'DEFAULTED',
}

export enum TransactionType {
  SHARE_DEPOSIT = 'SHARE_DEPOSIT',
  LOAN_REPAYMENT = 'LOAN_REPAYMENT',
  FINE_PAYMENT = 'FINE_PAYMENT',
  EXPENSE = 'EXPENSE',
  LOAN_DISBURSEMENT = 'LOAN_DISBURSEMENT',
  LOAN_PENALTY = 'LOAN_PENALTY',
}

export enum GroupStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  CLOSED = 'CLOSED',
}

export enum MeetingFrequency {
  WEEKLY = 'WEEKLY',
  BIWEEKLY = 'BIWEEKLY',
  MONTHLY = 'MONTHLY',
}

export enum FineStatus {
  UNPAID = 'UNPAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  VOID = 'VOID',
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  EXCUSED = 'EXCUSED',
}

export enum SMSEventType {
  CONTRIBUTION_RECEIVED = 'CONTRIBUTION_RECEIVED',
  LOAN_APPROVED = 'LOAN_APPROVED',
  LOAN_REPAYMENT = 'LOAN_REPAYMENT',
  FINE_ISSUED = 'FINE_ISSUED',
  EXPENSE_APPROVED = 'EXPENSE_APPROVED',
  SEASON_OPENED = 'SEASON_OPENED',
  SEASON_CLOSED = 'SEASON_CLOSED',
  SHARE_OUT_FINALIZED = 'SHARE_OUT_FINALIZED',
  USER_CREATED = 'USER_CREATED',
  PASSWORD_RESET = 'PASSWORD_RESET',
}

export enum WorkflowScope {
  LOAN_APPROVAL = 'LOAN_APPROVAL',
  EXPENSE_APPROVAL = 'EXPENSE_APPROVAL',
}

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface AuditRecord {
  id: string;
  date: string;
  editorId: string;
  reason: string;
  changes: { field: string; oldValue: any; newValue: any }[];
}

export interface SystemSettings {
  id: string;
  sessionTimeoutMinutes: number;
  passwordMinLength: number;
  passwordRequireSpecial: boolean;
  passwordRequireNumber: boolean;
  passwordRequireUppercase: boolean;
  enforce2FA: boolean;
  lastForceLogoutAt?: string;
  updatedAt: string;
  updatedBy: string;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;

  // auth/security
  passwordHash?: string;
  twoFactorEnabled?: boolean;

  // scoping
  branchId?: string;
  linkedMemberId?: string;
  managedGroupId?: string; // legacy single group
  managedGroupIds?: string[]; // newer multi-group

  // metadata
  lastLogin?: string;
  failedLoginAttempts: number;
  createdAt: string;
  createdBy?: string;
}

export interface Branch {
  id: string;
  name: string;
  district: string;
}

export interface GSLAGroup {
  id: string;
  name: string;
  branchId: string;

  // location
  district: string;
  sector: string;
  cell?: string;
  village?: string;
  location: string;
  coordinates?: { lat: number; lng: number };

  // governance (member ids)
  presidentId?: string;
  secretaryId?: string;
  accountantId?: string;

  // rules
  meetingDay: string;
  meetingFrequency: MeetingFrequency;
  shareValue: number;
  minShares: number;
  maxShares: number;
  maxLoanMultiplier: number;
  lateFeeAmount?: number;
  lateFeeType?: 'PERCENTAGE' | 'FIXED';

  // documents
  constitutionUrl?: string;

  // state
  currentCycleId: string;
  status: GroupStatus;

  // financial cache
  totalSavings: number;
  totalLoansOutstanding: number;
  totalSolidarity: number;

  // metadata
  createdAt: string;
  lastUpdatedAt?: string;
  auditHistory: AuditRecord[];
}

export interface Cycle {
  id: string;
  groupId: string;
  startDate: string;
  endDate?: string;
  status: 'OPEN' | 'CLOSED';
  interestRate: number;
}

export interface Member {
  id: string;
  groupId: string;
  fullName: string;
  nationalId: string;
  phone: string;
  email?: string;
  role: UserRole | string;
  status: MemberStatus;
  joinDate: string;
  totalShares: number;
  totalLoans: number;
  photoUrl?: string;
}

export interface Loan {
  id: string;
  memberId: string;
  groupId: string;
  principal: number;
  interestRate: number;
  totalRepayable: number;
  balance: number;
  status: LoanStatus;
  startDate: string;
  dueDate: string;
  purpose: string;
  memberRole?: UserRole | string;
}

export interface Transaction {
  id: string;
  groupId: string;
  memberId?: string;
  cycleId: string;
  type: TransactionType;
  amount: number;
  date: string;
  description?: string;
  categoryId?: string;

  // contribution fields
  shareCount?: number;
  solidarityAmount?: number;
  paymentMethod?: 'CASH' | 'MOBILE_MONEY' | 'BANK_TRANSFER' | string;

  // audit/status
  isVoid?: boolean;
  voidReason?: string;
  notes?: string;
  recordedBy?: string;
  approvedBy?: string;
  editHistory?: AuditRecord[];
  status?: string;
  approvalRequestId?: string;
}

export interface Meeting {
  id: string;
  groupId: string;
  cycleId?: string;
  date: string;
  type: 'REGULAR' | 'SPECIAL' | 'EMERGENCY';
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface Attendance {
  id: string;
  meetingId: string;
  groupId: string;
  date: string;
  memberId: string;
  status: AttendanceStatus;
  notes?: string;
  fineId?: string;
  recordedBy: string;
  auditHistory: AuditRecord[];
}

export interface FineCategory {
  id: string;
  groupId: string;
  name: string;
  defaultAmount: number;
  isSystem: boolean;
  active: boolean;
}

export interface ExpenseCategory {
  id: string;
  groupId: string;
  name: string;
  active: boolean;
}

export interface Fine {
  id: string;
  groupId: string;
  memberId: string;
  cycleId: string;
  date: string;
  categoryId: string;
  amount: number;
  paidAmount: number;
  status: FineStatus;
  reason?: string;
  recordedBy: string;
  auditHistory: AuditRecord[];
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
}

export interface ShareOutSnapshot {
  date: string;
  totalShares: number;
  netWorth: number;
  valuePerShare: number;
  totalDistributable: number;
  breakdown: any;
  members: { id: string; name: string; shares: number; payout: number }[];
}

export interface ApprovalWorkflow {
  id: string;
  groupId: string;
  scope: WorkflowScope;
  steps: { role: UserRole }[];
  isSequential: boolean;
  isEnabled: boolean;
}

export interface ApprovalRequest {
  id: string;
  workflowId: string;
  entityId: string;
  entityType: 'LOAN' | 'EXPENSE';
  requesterId: string;
  currentStepIndex: number;
  status: ApprovalStatus;
  logs: { stepIndex: number; approverId: string; action: 'APPROVE' | 'REJECT'; date: string; comment?: string }[];
  createdAt: string;
}

export interface SMSTemplate {
  eventType: SMSEventType;
  template: string;
  isEnabled: boolean;
  description: string;
  variables: string[];
}

export interface SMSLog {
  id: string;
  recipient: string;
  message: string;
  status: 'SENT' | 'FAILED' | 'PENDING';
  sentAt: string;
  triggerBy?: string;
  groupId?: string;
  error?: string;
  providerResponse?: any;
}

export interface SMSConfig {
  id?: string;
  isLiveMode: boolean;
  monthlyCap: number;
  currentUsage: number;
  lowBalanceThreshold?: number;
  updatedAt?: string;
  updatedBy?: string;
}

