
export enum UserRole {
<<<<<<< HEAD
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  GROUP_LEADER = 'GROUP_LEADER',
  MEMBER_USER = 'MEMBER_USER',
  AUDITOR = 'AUDITOR'
=======
  SUPER_ADMIN = 'SUPER_ADMIN', // VJN HQ - Full Access
  ADMIN = 'ADMIN', // Branch/Program Manager
  GROUP_LEADER = 'GROUP_LEADER', // President, Secretary, Accountant
  MEMBER_USER = 'MEMBER_USER', // Read-only member access
  AUDITOR = 'AUDITOR' // Read-only system access
>>>>>>> 7c17f3ba72aad7656a6b64c3bf0bfbc90a688a2a
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
<<<<<<< HEAD
  DISABLED = 'DISABLED',
  LOCKED = 'LOCKED',
  PENDING_PASSWORD = 'PENDING_PASSWORD'
}

=======
  DISABLED = 'DISABLED', // Soft delete
  LOCKED = 'LOCKED', // Too many attempts
  PENDING_PASSWORD = 'PENDING_PASSWORD' // Needs password change
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  passwordHash: string; // Simulated hash
  role: UserRole;
  status: UserStatus;
  
  // Security
  twoFactorEnabled?: boolean;

  // Scoping
  branchId?: string; // If Admin
  linkedMemberId?: string; // If Group Leader or Member
  managedGroupId?: string; // Specifically for Group Leaders
  
  // Metadata
  lastLogin?: string;
  failedLoginAttempts: number;
  createdAt: string;
  createdBy: string;
}

// Existing types below...
>>>>>>> 7c17f3ba72aad7656a6b64c3bf0bfbc90a688a2a
export enum MemberStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  EXITED = 'EXITED'
}

export enum LoanStatus {
  PENDING = 'PENDING',
<<<<<<< HEAD
  ACTIVE = 'ACTIVE',
  REJECTED = 'REJECTED',
  CLEARED = 'CLEARED',
=======
  APPROVED = 'APPROVED',
  ACTIVE = 'ACTIVE', // Money disbursed
  CLEARED = 'CLEARED',
  REJECTED = 'REJECTED',
>>>>>>> 7c17f3ba72aad7656a6b64c3bf0bfbc90a688a2a
  DEFAULTED = 'DEFAULTED'
}

export enum TransactionType {
  SHARE_DEPOSIT = 'SHARE_DEPOSIT',
  LOAN_REPAYMENT = 'LOAN_REPAYMENT',
  FINE_PAYMENT = 'FINE_PAYMENT',
  EXPENSE = 'EXPENSE',
<<<<<<< HEAD
  LOAN_DISBURSEMENT = 'LOAN_DISBURSEMENT'
=======
  LOAN_DISBURSEMENT = 'LOAN_DISBURSEMENT',
  LOAN_PENALTY = 'LOAN_PENALTY'
>>>>>>> 7c17f3ba72aad7656a6b64c3bf0bfbc90a688a2a
}

export enum GroupStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  CLOSED = 'CLOSED'
}

export enum MeetingFrequency {
  WEEKLY = 'WEEKLY',
  BIWEEKLY = 'BIWEEKLY',
  MONTHLY = 'MONTHLY'
}

<<<<<<< HEAD
=======
export enum FineStatus {
  UNPAID = 'UNPAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  VOID = 'VOID'
}

>>>>>>> 7c17f3ba72aad7656a6b64c3bf0bfbc90a688a2a
export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  EXCUSED = 'EXCUSED'
}

<<<<<<< HEAD
export enum FineStatus {
  UNPAID = 'UNPAID',
  PAID = 'PAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  VOID = 'VOID'
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
  PASSWORD_RESET = 'PASSWORD_RESET'
}

export enum WorkflowScope {
  LOAN_APPROVAL = 'LOAN_APPROVAL',
  EXPENSE_APPROVAL = 'EXPENSE_APPROVAL'
}

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
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
  passwordHash?: string;
  twoFactorEnabled: boolean;
  linkedMemberId?: string;
  managedGroupIds?: string[];
  lastLogin?: string;
  failedLoginAttempts: number;
  createdAt: string;
  createdBy?: string;
}

=======
>>>>>>> 7c17f3ba72aad7656a6b64c3bf0bfbc90a688a2a
export interface Branch {
  id: string;
  name: string;
  district: string;
}

<<<<<<< HEAD
=======
export interface AuditRecord {
  id: string;
  date: string;
  editorId: string;
  reason: string;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}

>>>>>>> 7c17f3ba72aad7656a6b64c3bf0bfbc90a688a2a
export interface GSLAGroup {
  id: string;
  name: string;
  branchId: string;
<<<<<<< HEAD
  district: string;
  sector: string;
  cell?: string;
  village?: string;
  location: string;
  meetingDay: string;
  meetingFrequency: MeetingFrequency;
  shareValue: number;
  minShares: number;
  maxShares: number;
  maxLoanMultiplier: number;
  currentCycleId: string;
  status: GroupStatus;
  totalSavings: number;
  totalLoansOutstanding: number;
  totalSolidarity: number;
  createdAt: string;
  auditHistory: AuditRecord[];
  presidentId?: string;
  secretaryId?: string;
  accountantId?: string;
  coordinates?: { lat: number; lng: number };
  constitutionUrl?: string;
  lateFeeAmount?: number;
  lateFeeType?: 'PERCENTAGE' | 'FIXED';
=======
  
  // Location
  district: string;
  sector: string;
  cell: string;
  village: string;
  location: string; // Display string
  coordinates?: {
    lat: number;
    lng: number;
  };

  // Governance (Member IDs)
  presidentId?: string;
  accountantId?: string;
  secretaryId?: string;

  // Rules
  meetingDay: string; 
  meetingFrequency: MeetingFrequency;
  shareValue: number; 
  minShares: number;
  maxShares: number;
  maxLoanMultiplier: number; // Default 3
  lateFeeAmount?: number; // Configurable late fee
  lateFeeType?: 'PERCENTAGE' | 'FIXED'; // Configurable type
  
  // Documents
  constitutionUrl?: string; // Base64 or URL

  // State
  currentCycleId: string;
  status: GroupStatus;
  
  // Financial Cache
  totalSavings: number;
  totalLoansOutstanding: number;
  totalSolidarity: number;

  // Metadata
  createdAt: string;
  auditHistory: AuditRecord[];
  lastUpdatedAt?: string;
>>>>>>> 7c17f3ba72aad7656a6b64c3bf0bfbc90a688a2a
}

export interface Cycle {
  id: string;
  groupId: string;
  startDate: string;
  endDate?: string;
  status: 'OPEN' | 'CLOSED';
<<<<<<< HEAD
  interestRate: number;
=======
  interestRate: number; // Monthly interest rate (e.g., 5%)
>>>>>>> 7c17f3ba72aad7656a6b64c3bf0bfbc90a688a2a
}

export interface Member {
  id: string;
  groupId: string;
  fullName: string;
  nationalId: string;
  phone: string;
<<<<<<< HEAD
  role: UserRole;
  status: MemberStatus;
  joinDate: string;
  totalShares: number;
  totalLoans: number;
  email?: string;
  photoUrl?: string;
=======
  role: string; // Legacy string role, mapped to UserRole logic in backend
  status: MemberStatus;
  joinDate: string;
  totalShares: number; // Cached total shares in current cycle
  totalLoans: number; // Current active loan principal
  photoUrl?: string; // Member photo for identification
>>>>>>> 7c17f3ba72aad7656a6b64c3bf0bfbc90a688a2a
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
<<<<<<< HEAD
  memberRole?: UserRole;
}

export interface Transaction {
  id: string;
  groupId: string;
  memberId?: string;
  cycleId: string;
  type: TransactionType;
  amount: number;
  date: string;
  shareCount?: number;
  solidarityAmount?: number;
  description?: string;
  categoryId?: string;
  isVoid?: boolean;
  voidReason?: string;
  recordedBy?: string;
  approvedBy?: string;
  editHistory?: AuditRecord[];
  status?: string;
  approvalRequestId?: string;
  notes?: string;
  paymentMethod?: string;
}

export interface Attendance {
  id: string;
  meetingId: string;
  groupId: string;
  date: string;
  memberId: string;
  status: AttendanceStatus;
  notes?: string;
  recordedBy: string;
  auditHistory: AuditRecord[];
}

export interface Meeting {
  id: string;
  groupId: string;
  date: string;
  type: 'REGULAR' | 'SPECIAL' | 'EMERGENCY';
  notes?: string;
  createdBy: string;
  createdAt: string;
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
=======
  memberRole?: string;
>>>>>>> 7c17f3ba72aad7656a6b64c3bf0bfbc90a688a2a
}

export interface FineCategory {
  id: string;
  groupId: string;
  name: string;
  defaultAmount: number;
<<<<<<< HEAD
  isSystem: boolean;
=======
  isSystem: boolean; // e.g. Attendance automated
>>>>>>> 7c17f3ba72aad7656a6b64c3bf0bfbc90a688a2a
  active: boolean;
}

export interface ExpenseCategory {
  id: string;
  groupId: string;
  name: string;
  active: boolean;
}

<<<<<<< HEAD
=======
export interface Fine {
  id: string;
  groupId: string;
  memberId: string;
  cycleId: string;
  date: string;
  categoryId: string; // Refers to FineCategory
  amount: number; // Total Obligation
  paidAmount: number;
  status: FineStatus;
  reason?: string;
  recordedBy: string;
  auditHistory: AuditRecord[];
}

export interface Transaction {
  id: string;
  groupId: string;
  memberId?: string; // Null if group expense
  cycleId: string;
  type: TransactionType;
  amount: number; // Primary amount (e.g. Share Value * Count)
  date: string;
  description?: string;
  categoryId?: string; // For Expenses or Fines
  
  // Specific Contribution Fields
  shareCount?: number; 
  solidarityAmount?: number; // Separate social fund
  paymentMethod?: 'CASH' | 'MOBILE_MONEY' | 'BANK_TRANSFER';
  
  // Audit & Status
  isVoid?: boolean;
  voidReason?: string;
  notes?: string;
  recordedBy?: string; // User ID
  approvedBy?: string; // For Expenses
  editHistory?: AuditRecord[];
}

export interface Meeting {
  id: string;
  groupId: string;
  cycleId: string;
  date: string;
  type: 'REGULAR' | 'EMERGENCY' | 'SPECIAL';
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface Attendance {
  id: string;
  meetingId: string; // Links to Meeting
  groupId: string;
  memberId: string;
  date: string;
  status: AttendanceStatus;
  notes?: string;
  fineId?: string; // Linked system fine if applicable
  recordedBy: string;
  auditHistory: AuditRecord[];
}

>>>>>>> 7c17f3ba72aad7656a6b64c3bf0bfbc90a688a2a
export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
<<<<<<< HEAD
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
}

export interface AuditRecord {
  id: string;
  date: string;
  editorId: string;
  reason: string;
  changes: { field: string; oldValue: any; newValue: any }[];
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
=======
  type: 'INFO' | 'WARNING' | 'SUCCESS';
>>>>>>> 7c17f3ba72aad7656a6b64c3bf0bfbc90a688a2a
}
