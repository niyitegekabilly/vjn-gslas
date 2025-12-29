export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  GROUP_ADMIN = 'GROUP_ADMIN', // President, Secretary, Accountant
  MEMBER = 'MEMBER'
}

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

export interface Branch {
  id: string;
  name: string;
  district: string;
}

export interface GSLAGroup {
  id: string;
  name: string;
  branchId: string;
  location: string;
  meetingDay: string; // e.g., "Tuesday"
  shareValue: number; // e.g., 500 RWF
  minShares: number;
  maxShares: number;
  currentCycleId: string;
  totalSavings: number;
  totalLoansOutstanding: number;
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
  role: UserRole;
  status: MemberStatus;
  joinDate: string;
  totalShares: number; // Cached total shares in current cycle
  totalLoans: number; // Current active loan principal
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

export interface Transaction {
  id: string;
  groupId: string;
  memberId?: string; // Null if group expense
  cycleId: string;
  type: TransactionType;
  amount: number;
  date: string;
  description?: string;
  shareCount?: number; // Only for deposits
}

export interface Attendance {
  id: string;
  groupId: string;
  date: string;
  memberId: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
}