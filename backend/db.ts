
import { 
  Branch, GSLAGroup, Cycle, Member, Loan, Transaction, 
  UserRole, MemberStatus, LoanStatus, TransactionType, Attendance,
  GroupStatus, MeetingFrequency, Fine, FineCategory, FineStatus, Meeting, AttendanceStatus, Notification,
  User, UserStatus
} from '../types';

const DB_KEY = 'VJN_GSLA_DB_V1';

// --- Static Data Definitions ---

const STATIC_BRANCHES: Branch[] = [
  { id: 'b1', name: 'Musanze HQ', district: 'Musanze' },
  { id: 'b2', name: 'Kigali Branch', district: 'Kigali' },
  { id: 'b_nyabihu', name: 'Nyabihu Branch', district: 'Nyabihu' },
  { id: 'b_nyamagabe', name: 'Nyamagabe Branch', district: 'Nyamagabe' },
  { id: 'b_burera', name: 'Burera Branch', district: 'Burera' },
  { id: 'b_ngoma', name: 'Ngoma Branch', district: 'Ngoma' },
  { id: 'b_nyagatare', name: 'Nyagatare Branch', district: 'Nyagatare' },
  { id: 'b_rubavu', name: 'Rubavu Branch', district: 'Rubavu' },
];

const STATIC_GROUPS: GSLAGroup[] = [
    {
      id: 'g1',
      name: 'Abakorerabushake',
      branchId: 'b1',
      district: 'Musanze',
      sector: 'Muhoza',
      cell: 'Ruhengeri',
      village: 'Kivumu',
      location: 'Muhoza, Musanze',
      meetingDay: 'Tuesday',
      meetingFrequency: MeetingFrequency.WEEKLY,
      shareValue: 500,
      minShares: 1,
      maxShares: 5,
      maxLoanMultiplier: 3,
      currentCycleId: 'c1',
      status: GroupStatus.ACTIVE,
      totalSavings: 450000,
      totalLoansOutstanding: 150000,
      totalSolidarity: 50000,
      createdAt: '2023-01-01',
      auditHistory: [],
      presidentId: 'm1'
    },
    {
      id: 'g2',
      name: 'Tuzamurane',
      branchId: 'b1',
      district: 'Musanze',
      sector: 'Kinigi',
      cell: 'Bisoke',
      village: 'Nyange',
      location: 'Kinigi, Musanze',
      meetingDay: 'Friday',
      meetingFrequency: MeetingFrequency.BIWEEKLY,
      shareValue: 200,
      minShares: 1,
      maxShares: 10,
      maxLoanMultiplier: 3,
      currentCycleId: 'c2',
      status: GroupStatus.ACTIVE,
      totalSavings: 120000,
      totalLoansOutstanding: 0,
      totalSolidarity: 20000,
      createdAt: '2023-06-15',
      auditHistory: []
    },
    // --- Nyabihu District Groups ---
    { id: 'g_n1', name: 'Tuzamurane-Twitezimbere (Youth)', branchId: 'b_nyabihu', district: 'Nyabihu', sector: 'Shyira', cell: 'Kanyamitana', village: '', location: 'Shyira, Nyabihu', meetingDay: 'Friday', meetingFrequency: MeetingFrequency.WEEKLY, shareValue: 300, minShares: 1, maxShares: 5, maxLoanMultiplier: 3, currentCycleId: '', status: GroupStatus.ACTIVE, totalSavings: 0, totalLoansOutstanding: 0, totalSolidarity: 0, createdAt: '2024-01-01', auditHistory: [], presidentId: 'm_n1' },
];

const STATIC_MEMBERS: Member[] = [
  { id: 'm1', groupId: 'g1', fullName: 'Jean Pierre N.', nationalId: '11990800...', phone: '0788123456', role: 'GROUP_ADMIN', status: MemberStatus.ACTIVE, joinDate: '2023-01-01', totalShares: 100, totalLoans: 0 },
  { id: 'm2', groupId: 'g1', fullName: 'Marie Claire M.', nationalId: '11992700...', phone: '0788654321', role: 'MEMBER', status: MemberStatus.ACTIVE, joinDate: '2023-01-01', totalShares: 80, totalLoans: 50000 },
  { id: 'm3', groupId: 'g1', fullName: 'Emmanuel K.', nationalId: '11985600...', phone: '0722123123', role: 'MEMBER', status: MemberStatus.ACTIVE, joinDate: '2023-02-10', totalShares: 60, totalLoans: 0 },
  { id: 'm4', groupId: 'g1', fullName: 'Grace U.', nationalId: '11995400...', phone: '0733456456', role: 'MEMBER', status: MemberStatus.SUSPENDED, joinDate: '2023-03-05', totalShares: 20, totalLoans: 0 },
];

const STATIC_USERS: User[] = [
  {
    id: 'u_super',
    fullName: 'System Super Admin',
    email: 'admin@vjn.rw',
    phone: '0788000000',
    passwordHash: 'admin123', // In real app, this is bcrypt hash
    role: UserRole.SUPER_ADMIN,
    status: UserStatus.ACTIVE,
    failedLoginAttempts: 0,
    createdAt: '2023-01-01',
    createdBy: 'system'
  },
  {
    id: 'u_g1_pres',
    fullName: 'Jean Pierre N.',
    email: 'jean.p@vjn.rw',
    phone: '0788123456',
    passwordHash: 'password',
    role: UserRole.GROUP_LEADER,
    status: UserStatus.ACTIVE,
    linkedMemberId: 'm1',
    managedGroupId: 'g1',
    failedLoginAttempts: 0,
    createdAt: '2023-01-05',
    createdBy: 'u_super'
  }
];

// --- Generation Logic ---

const generateMockMembers = (groups: GSLAGroup[]) => {
  const firstNames = ["Jean", "Marie", "Emmanuel", "Claudine", "Patrick", "Alice", "Eric", "Grace", "David", "Sarah", "Paul", "Esther", "Frank", "Olive", "Peter", "Diane", "Claude", "Divine", "Felix", "Gloria", "Belyse", "Chantal", "Innocent", "Joseph", "Lydie", "Moses"];
  const lastNames = ["Mugisha", "Uwase", "Nizigiyimana", "Bizimana", "Ndayisaba", "Iradukunda", "Uwamahoro", "Nshimiyimana", "Mutoni", "Hakizimana", "Karekezi", "Umutesi", "Habimana", "Uwimana", "Akimana", "Umurerwa", "Nkurunziza", "Ishimwe", "Ingabire", "Irakoze", "Manzi", "Keza", "Gwiza"];

  const members: Member[] = [];
  
  groups.forEach(g => {
    // Generate 15 members per group
    for (let i = 0; i < 15; i++) {
      const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
      const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
      
      members.push({
        id: `gen_${g.id}_${i}`,
        groupId: g.id,
        fullName: `${fn} ${ln}`,
        nationalId: `1${1950 + Math.floor(Math.random() * 50)}${Math.floor(Math.random() * 10000000000)}`,
        phone: `07${8 + Math.floor(Math.random() * 2)}${Math.floor(Math.random() * 10000000)}`,
        role: 'MEMBER',
        status: MemberStatus.ACTIVE,
        joinDate: '2024-01-15',
        totalShares: Math.floor(Math.random() * 50),
        totalLoans: 0
      });
    }
  });
  return members;
};

// Generate the dynamic members
const DYNAMIC_MEMBERS = generateMockMembers(STATIC_GROUPS);

// --- Final Seed Data Assembly ---

const SEED_DATA = {
  users: STATIC_USERS,
  branches: STATIC_BRANCHES,
  groups: STATIC_GROUPS,
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

  members: [...STATIC_MEMBERS, ...DYNAMIC_MEMBERS],

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

  fineCategories: [
    { id: 'fc1', groupId: 'g1', name: 'Late Arrival', defaultAmount: 200, isSystem: true, active: true },
    { id: 'fc2', groupId: 'g1', name: 'Absent', defaultAmount: 500, isSystem: true, active: true },
    { id: 'fc3', groupId: 'g1', name: 'Disturbance', defaultAmount: 1000, isSystem: false, active: true },
    { id: 'fc4', groupId: 'g1', name: 'Lost Book', defaultAmount: 2000, isSystem: false, active: true },
  ] as FineCategory[],

  fines: [
    { 
      id: 'f1', groupId: 'g1', memberId: 'm2', cycleId: 'c1', date: '2024-03-01', categoryId: 'fc1', 
      amount: 200, paidAmount: 0, status: FineStatus.UNPAID, recordedBy: 'm1', auditHistory: []
    }
  ] as Fine[],

  transactions: [
    { id: 't1', groupId: 'g1', memberId: 'm1', cycleId: 'c1', type: TransactionType.SHARE_DEPOSIT, amount: 5000, shareCount: 10, date: '2024-03-05' },
    { id: 't2', groupId: 'g1', memberId: 'm2', cycleId: 'c1', type: TransactionType.SHARE_DEPOSIT, amount: 2500, shareCount: 5, date: '2024-03-05' },
  ] as Transaction[],

  meetings: [] as Meeting[],
  attendance: [] as Attendance[],
  
  notifications: [
    { id: 'n1', title: 'Season Started', message: 'The 2024 Cycle has officially begun.', date: '2024-01-01', read: false, type: 'INFO' },
    { id: 'n2', title: 'Meeting Reminder', message: 'Weekly meeting scheduled for Friday.', date: '2024-03-10', read: false, type: 'WARNING' },
    { id: 'n3', title: 'Loan Approved', message: 'Your loan application was approved.', date: '2024-03-08', read: true, type: 'SUCCESS' },
  ] as Notification[],
};

// --- Persistence Layer ---

const loadDatabase = () => {
  try {
    const stored = localStorage.getItem(DB_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // SCHEMA MIGRATION: Ensure users collection exists for legacy data
      if (!parsed.users) {
        console.log('Migrating database: Adding users collection');
        parsed.users = JSON.parse(JSON.stringify(STATIC_USERS));
      }
      return parsed;
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
    localStorage.removeItem('vjn_session'); // Also clear session
    window.location.reload();
  } catch (error) {
    console.error('Failed to reset database:', error);
  }
};

export const importDatabase = (jsonData: string) => {
  try {
    const parsed = JSON.parse(jsonData);
    // Basic validation
    if (!parsed.groups || !parsed.members) throw new Error("Invalid backup file format: Missing core collections");
    
    // Ensure migrated fields exist on import too
    if (!parsed.users) parsed.users = STATIC_USERS;

    localStorage.setItem(DB_KEY, JSON.stringify(parsed));
    // Update memory
    Object.assign(db, parsed); 
    window.location.reload();
    return { success: true };
  } catch (error: any) {
    console.error('Failed to import database:', error);
    return { success: false, error: error.message };
  }
};
