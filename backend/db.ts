import { 
  Branch, GSLAGroup, Cycle, Member, Loan, Transaction, 
  UserRole, MemberStatus, LoanStatus, TransactionType, Attendance 
} from '../types';

const DB_KEY = 'VJN_GSLA_DB_V1';

// --- Initial Seed Data ---
const SEED_DATA = {
  branches: [
    { id: 'b1', name: 'Musanze HQ', district: 'Musanze' },
    { id: 'b2', name: 'Kigali Branch', district: 'Kigali' },
  ] as Branch[],

  groups: [
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
  ] as GSLAGroup[],

  cycles: [
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
  ] as Cycle[],

  members: [
    { id: 'm1', groupId: 'g1', fullName: 'Jean Pierre N.', nationalId: '11990800...', phone: '0788123456', role: UserRole.GROUP_ADMIN, status: MemberStatus.ACTIVE, joinDate: '2023-01-01', totalShares: 100, totalLoans: 0 },
    { id: 'm2', groupId: 'g1', fullName: 'Marie Claire M.', nationalId: '11992700...', phone: '0788654321', role: UserRole.MEMBER, status: MemberStatus.ACTIVE, joinDate: '2023-01-01', totalShares: 80, totalLoans: 50000 },
    { id: 'm3', groupId: 'g1', fullName: 'Emmanuel K.', nationalId: '11985600...', phone: '0722123123', role: UserRole.MEMBER, status: MemberStatus.ACTIVE, joinDate: '2023-02-10', totalShares: 60, totalLoans: 0 },
    { id: 'm4', groupId: 'g1', fullName: 'Grace U.', nationalId: '11995400...', phone: '0733456456', role: UserRole.MEMBER, status: MemberStatus.SUSPENDED, joinDate: '2023-03-05', totalShares: 20, totalLoans: 0 },
  ] as Member[],

  loans: [
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
  ] as Loan[],

  transactions: [
    { id: 't1', groupId: 'g1', memberId: 'm1', cycleId: 'c1', type: TransactionType.SHARE_DEPOSIT, amount: 5000, shareCount: 10, date: '2024-03-05' },
    { id: 't2', groupId: 'g1', memberId: 'm2', cycleId: 'c1', type: TransactionType.SHARE_DEPOSIT, amount: 2500, shareCount: 5, date: '2024-03-05' },
  ] as Transaction[],

  attendance: [] as Attendance[]
};

// --- Persistence Layer ---

const loadDatabase = () => {
  try {
    const stored = localStorage.getItem(DB_KEY);
    if (stored) {
      console.log('Database loaded from storage');
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load database:', error);
  }
  return JSON.parse(JSON.stringify(SEED_DATA)); // Deep copy to avoid reference issues
};

export const db = loadDatabase();

export const saveDatabase = () => {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
    console.log('Database saved');
  } catch (error) {
    console.error('Failed to save database:', error);
  }
};

export const resetDatabase = () => {
  try {
    localStorage.removeItem(DB_KEY);
    window.location.reload();
  } catch (error) {
    console.error('Failed to reset database:', error);
  }
};
