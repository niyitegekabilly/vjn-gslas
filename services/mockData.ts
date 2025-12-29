import { 
  Branch, GSLAGroup, Cycle, Member, Loan, Transaction, 
  UserRole, MemberStatus, LoanStatus, TransactionType, Attendance 
} from '../types';

// --- Constants ---
const INITIAL_DATE = new Date().toISOString().split('T')[0];

// --- Mock Data Store ---

export const branches: Branch[] = [
  { id: 'b1', name: 'Musanze HQ', district: 'Musanze' },
  { id: 'b2', name: 'Kigali Branch', district: 'Kigali' },
];

export const groups: GSLAGroup[] = [
  {
    id: 'g1',
    name: 'Abakorerabushake',
    branchId: 'b1',
    location: 'Muhoza, Musanze',
    meetingDay: 'Tuesday',
    shareValue: 500,
    minShares: 1,
    maxShares: 5,
    currentCycleId: 'c1',
    totalSavings: 450000,
    totalLoansOutstanding: 150000,
  },
  {
    id: 'g2',
    name: 'Tuzamurane',
    branchId: 'b1',
    location: 'Kinigi, Musanze',
    meetingDay: 'Friday',
    shareValue: 200,
    minShares: 1,
    maxShares: 10,
    currentCycleId: 'c2',
    totalSavings: 120000,
    totalLoansOutstanding: 0,
  }
];

export const cycles: Cycle[] = [
  {
    id: 'c1',
    groupId: 'g1',
    startDate: '2024-01-01',
    status: 'OPEN',
    interestRate: 5,
  },
  {
    id: 'c2',
    groupId: 'g2',
    startDate: '2024-02-15',
    status: 'OPEN',
    interestRate: 3,
  }
];

export const members: Member[] = [
  { id: 'm1', groupId: 'g1', fullName: 'Jean Pierre N.', nationalId: '11990800...', phone: '0788123456', role: UserRole.GROUP_ADMIN, status: MemberStatus.ACTIVE, joinDate: '2023-01-01', totalShares: 100, totalLoans: 0 },
  { id: 'm2', groupId: 'g1', fullName: 'Marie Claire M.', nationalId: '11992700...', phone: '0788654321', role: UserRole.MEMBER, status: MemberStatus.ACTIVE, joinDate: '2023-01-01', totalShares: 80, totalLoans: 50000 },
  { id: 'm3', groupId: 'g1', fullName: 'Emmanuel K.', nationalId: '11985600...', phone: '0722123123', role: UserRole.MEMBER, status: MemberStatus.ACTIVE, joinDate: '2023-02-10', totalShares: 60, totalLoans: 0 },
  { id: 'm4', groupId: 'g1', fullName: 'Grace U.', nationalId: '11995400...', phone: '0733456456', role: UserRole.MEMBER, status: MemberStatus.SUSPENDED, joinDate: '2023-03-05', totalShares: 20, totalLoans: 0 },
];

export const loans: Loan[] = [
  {
    id: 'l1',
    memberId: 'm2',
    groupId: 'g1',
    principal: 50000,
    interestRate: 5,
    totalRepayable: 52500,
    balance: 52500,
    status: LoanStatus.ACTIVE,
    startDate: '2024-03-01',
    dueDate: '2024-04-01',
    purpose: 'School fees'
  },
  {
    id: 'l2',
    memberId: 'm3',
    groupId: 'g1',
    principal: 20000,
    interestRate: 5,
    totalRepayable: 21000,
    balance: 0,
    status: LoanStatus.CLEARED,
    startDate: '2024-01-15',
    dueDate: '2024-02-15',
    purpose: 'Agriculture'
  }
];

// Initial mock transactions
export const transactions: Transaction[] = [
  { id: 't1', groupId: 'g1', memberId: 'm1', cycleId: 'c1', type: TransactionType.SHARE_DEPOSIT, amount: 5000, shareCount: 10, date: '2024-03-05' },
  { id: 't2', groupId: 'g1', memberId: 'm2', cycleId: 'c1', type: TransactionType.SHARE_DEPOSIT, amount: 2500, shareCount: 5, date: '2024-03-05' },
];

export const attendanceLog: Attendance[] = [];

// --- Service Helpers (Simulating API) ---

export const getGroupMembers = (groupId: string) => members.filter(m => m.groupId === groupId);
export const getGroupLoans = (groupId: string) => loans.filter(l => l.groupId === groupId);
export const getGroupTransactions = (groupId: string) => transactions.filter(t => t.groupId === groupId);

export const calculateMaxLoan = (member: Member): number => {
  // GSLA Rule: Max loan is usually 3x savings
  const shareValue = groups.find(g => g.id === member.groupId)?.shareValue || 0;
  const savings = member.totalShares * shareValue;
  return savings * 3;
};

// Simulate adding a bulk transaction (Meeting Mode)
export const submitMeetingData = (
  groupId: string, 
  date: string, 
  entries: { memberId: string, shares: number, present: boolean, loanRepayment: number, fines: number }[]
) => {
  const group = groups.find(g => g.id === groupId);
  if (!group) return;

  entries.forEach(entry => {
    // 1. Attendance
    attendanceLog.push({
      id: Math.random().toString(36),
      groupId,
      date,
      memberId: entry.memberId,
      status: entry.present ? 'PRESENT' : 'ABSENT'
    });

    // 2. Shares
    if (entry.shares > 0) {
      const amount = entry.shares * group.shareValue;
      transactions.push({
        id: Math.random().toString(36),
        groupId,
        memberId: entry.memberId,
        cycleId: group.currentCycleId,
        type: TransactionType.SHARE_DEPOSIT,
        amount,
        shareCount: entry.shares,
        date
      });
      // Update local member cache
      const mem = members.find(m => m.id === entry.memberId);
      if (mem) mem.totalShares += entry.shares;
    }

    // 3. Fines
    if (entry.fines > 0) {
       transactions.push({
        id: Math.random().toString(36),
        groupId,
        memberId: entry.memberId,
        cycleId: group.currentCycleId,
        type: TransactionType.FINE_PAYMENT,
        amount: entry.fines,
        date,
        description: 'Meeting Fine'
      });
    }

    // 4. Loan Repayment (Simplified logic)
    if (entry.loanRepayment > 0) {
       transactions.push({
        id: Math.random().toString(36),
        groupId,
        memberId: entry.memberId,
        cycleId: group.currentCycleId,
        type: TransactionType.LOAN_REPAYMENT,
        amount: entry.loanRepayment,
        date
      });
      // Update loan balance
      const loan = loans.find(l => l.memberId === entry.memberId && l.status === LoanStatus.ACTIVE);
      if (loan) {
        loan.balance -= entry.loanRepayment;
        if (loan.balance <= 0) {
          loan.balance = 0;
          loan.status = LoanStatus.CLEARED;
        }
      }
    }
  });
};
