
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN', // VJN HQ - Full Access
  ADMIN = 'ADMIN', // Branch/Program Manager
  GROUP_LEADER = 'GROUP_LEADER', // President, Secretary, Accountant
  MEMBER_USER = 'MEMBER_USER', // Read-only member access
  AUDITOR = 'AUDITOR' // Read-only system access
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
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
export enum MemberStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  EXITED = 'EXITED'
}

export enum LoanStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  ACTIVE = 'ACTIVE', // Money disbursed
  CLEARED = 'CLEARED',
  REJECTED = 'REJECTED',
  DEFAULTED = 'DEFAULTED'
}

export enum TransactionType {
  SHARE_DEPOSIT = 'SHARE_DEPOSIT',
  LOAN_REPAYMENT = 'LOAN_REPAYMENT',
  FINE_PAYMENT = 'FINE_PAYMENT',
  EXPENSE = 'EXPENSE',
  LOAN_DISBURSEMENT = 'LOAN_DISBURSEMENT',
  LOAN_PENALTY = 'LOAN_PENALTY'
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

export enum FineStatus {
  UNPAID = 'UNPAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  VOID = 'VOID'
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  EXCUSED = 'EXCUSED'
}

export interface Branch {
  id: string;
  name: string;
  district: string;
}

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

export interface GSLAGroup {
  id: string;
  name: string;
  branchId: string;
  
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
}

export interface Cycle {
  id: string;
  groupId: string;
  startDate: string;
  endDate?: string;
  status: 'OPEN' | 'CLOSED';
  interestRate: number; // Monthly interest rate (e.g., 5%)
}

export interface Member {
  id: string;
  groupId: string;
  fullName: string;
  nationalId: string;
  phone: string;
  role: string; // Legacy string role, mapped to UserRole logic in backend
  status: MemberStatus;
  joinDate: string;
  totalShares: number; // Cached total shares in current cycle
  totalLoans: number; // Current active loan principal
  photoUrl?: string; // Member photo for identification
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
}

export interface FineCategory {
  id: string;
  groupId: string;
  name: string;
  defaultAmount: number;
  isSystem: boolean; // e.g. Attendance automated
  active: boolean;
}

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
  
  // Specific Contribution Fields
  shareCount?: number; 
  solidarityAmount?: number; // Separate social fund
  paymentMethod?: 'CASH' | 'MOBILE_MONEY' | 'BANK_TRANSFER';
  
  // Audit & Status
  isVoid?: boolean;
  voidReason?: string;
  notes?: string;
  recordedBy?: string; // User ID
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

export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'INFO' | 'WARNING' | 'SUCCESS';
}
