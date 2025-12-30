
import { db, saveDatabase, importDatabase as dbImport } from './db';
import { 
  User, UserRole, UserStatus, 
  GSLAGroup, GroupStatus, 
  Member, MemberStatus, 
  Loan, LoanStatus, 
  Transaction, TransactionType, 
  Meeting, Attendance, AttendanceStatus,
  Fine, FineStatus, FineCategory,
  Notification,
  Cycle
} from '../types';

// Users
export const getUsers = () => db.users;
export const createUser = (userData: Partial<User>, creatorId: string) => {
  const newUser: User = {
    id: `u_${Date.now()}`,
    fullName: userData.fullName!,
    email: userData.email!,
    phone: userData.phone || '',
    passwordHash: userData.passwordHash || 'password',
    role: userData.role || UserRole.MEMBER_USER,
    status: UserStatus.ACTIVE,
    managedGroupId: userData.managedGroupId,
    createdAt: new Date().toISOString(),
    createdBy: creatorId,
    failedLoginAttempts: 0
  };
  db.users.push(newUser);
  saveDatabase();
  return newUser;
};

// Auth
export const login = (email: string, pass: string) => {
  const user = db.users.find((u: User) => u.email === email);
  if (!user) throw new Error("User not found");
  if (user.passwordHash !== pass) throw new Error("Invalid password"); // Simple mock
  if (user.status !== UserStatus.ACTIVE) throw new Error("Account is locked or disabled");
  
  // Update last login
  user.lastLogin = new Date().toISOString();
  saveDatabase();
  return user;
};

// Groups
export const getGroups = () => db.groups;
export const getGroup = (id: string) => db.groups.find((g: GSLAGroup) => g.id === id);
export const createGroup = (data: any) => {
  const newGroup: GSLAGroup = {
    id: `g_${Date.now()}`,
    ...data,
    status: GroupStatus.ACTIVE,
    createdAt: new Date().toISOString(),
    auditHistory: [],
    totalSavings: 0, 
    totalLoansOutstanding: 0, 
    totalSolidarity: 0
  };
  db.groups.push(newGroup);
  
  // Create initial cycle
  db.cycles.push({
    id: `c_${Date.now()}`,
    groupId: newGroup.id,
    startDate: new Date().toISOString().split('T')[0],
    status: 'OPEN',
    interestRate: 5
  });
  newGroup.currentCycleId = `c_${Date.now()}`;
  
  saveDatabase();
  return newGroup;
};
export const updateGroup = (id: string, data: Partial<GSLAGroup>, reason: string, editorId: string) => {
  const idx = db.groups.findIndex((g: GSLAGroup) => g.id === id);
  if (idx === -1) throw new Error("Group not found");
  const oldGroup = { ...db.groups[idx] };
  db.groups[idx] = { ...oldGroup, ...data };
  
  // Audit
  db.groups[idx].auditHistory.push({
    id: Date.now().toString(),
    date: new Date().toISOString(),
    editorId,
    reason,
    changes: Object.keys(data).map(k => ({ field: k, oldValue: (oldGroup as any)[k], newValue: (data as any)[k] }))
  });
  
  saveDatabase();
  return db.groups[idx];
};

// Members
export const getMembers = (groupId: string) => db.members.filter((m: Member) => m.groupId === groupId);
export const addMember = (groupId: string, data: any) => {
  const newMember: Member = {
    id: `m_${Date.now()}`,
    groupId,
    ...data,
    joinDate: new Date().toISOString().split('T')[0],
    totalShares: 0,
    totalLoans: 0
  };
  db.members.push(newMember);
  saveDatabase();
  return newMember;
};
export const updateMember = (memberId: string, data: Partial<Member>) => {
  const index = db.members.findIndex((m: Member) => m.id === memberId);
  if (index === -1) throw new Error("Member not found");
  db.members[index] = { ...db.members[index], ...data };
  saveDatabase();
  return db.members[index];
};
export const deleteMember = (memberId: string) => {
  const index = db.members.findIndex((m: Member) => m.id === memberId);
  if (index === -1) throw new Error("Member not found");
  
  // Check for history
  const hasHistory = db.transactions.some((t: Transaction) => t.memberId === memberId) || 
                     db.loans.some((l: Loan) => l.memberId === memberId);
                     
  if (hasHistory) {
    db.members[index].status = MemberStatus.EXITED;
    saveDatabase();
    return { mode: 'archived', member: db.members[index] };
  } else {
    db.members.splice(index, 1);
    saveDatabase();
    return { mode: 'deleted' };
  }
};
export const importMembers = (groupId: string, membersData: any[]) => {
  let count = 0;
  membersData.forEach(m => {
     // Simple duplication check
     const exists = db.members.find((ex: Member) => ex.groupId === groupId && (ex.nationalId === m.nationalId || ex.phone === m.phone));
     if (!exists) {
       addMember(groupId, m);
       count++;
     }
  });
  return { added: count };
};

// Loans
export const getLoans = (groupId: string) => db.loans.filter((l: Loan) => l.groupId === groupId);
export const applyForLoan = (groupId: string, data: any) => {
  const newLoan: Loan = {
    id: `l_${Date.now()}`,
    groupId,
    memberId: data.memberId,
    principal: data.amount,
    interestRate: data.interestRate,
    totalRepayable: data.amount + (data.amount * (data.interestRate/100) * data.duration),
    balance: data.amount + (data.amount * (data.interestRate/100) * data.duration),
    status: LoanStatus.PENDING,
    startDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(new Date().setMonth(new Date().getMonth() + data.duration)).toISOString().split('T')[0],
    purpose: data.purpose
  };
  db.loans.push(newLoan);
  
  // Update member metadata for loans
  const memIdx = db.members.findIndex((m: Member) => m.id === data.memberId);
  if (memIdx > -1) {
    db.members[memIdx].totalLoans += data.amount; // track principal exposure
  }
  
  saveDatabase();
  return newLoan;
};
export const updateLoanStatus = (loanId: string, status: LoanStatus) => {
  const loan = db.loans.find((l: Loan) => l.id === loanId);
  if (!loan) throw new Error("Loan not found");
  
  if (status === LoanStatus.ACTIVE && loan.status === LoanStatus.PENDING) {
     // Create disbursement transaction
     db.transactions.push({
       id: `t_disb_${Date.now()}`,
       groupId: loan.groupId,
       memberId: loan.memberId,
       cycleId: 'c1', // Should ideally fetch current cycle
       type: TransactionType.LOAN_DISBURSEMENT,
       amount: loan.principal,
       date: new Date().toISOString().split('T')[0]
     });
     
     // Update group totals
     const group = db.groups.find((g: GSLAGroup) => g.id === loan.groupId);
     if (group) group.totalLoansOutstanding += loan.balance;
  }
  
  loan.status = status;
  saveDatabase();
  return loan;
};
export const repayLoan = (loanId: string, amount: number) => {
  const loan = db.loans.find((l: Loan) => l.id === loanId);
  if (!loan) throw new Error("Loan not found");
  
  // Find group to get current cycle
  const group = db.groups.find((g: GSLAGroup) => g.id === loan.groupId);
  if (!group) throw new Error("Group not found for this loan");

  loan.balance -= amount;
  if (loan.balance <= 0) {
    loan.balance = 0;
    loan.status = LoanStatus.CLEARED;
    
    // Clear member loan exposure
    const memIdx = db.members.findIndex((m: Member) => m.id === loan.memberId);
    if (memIdx > -1) {
       // Ideally we track active principal separate from balance, simplified here
       db.members[memIdx].totalLoans = Math.max(0, db.members[memIdx].totalLoans - loan.principal); 
    }
  }
  
  // Record Transaction
  db.transactions.push({
    id: `t_repay_${Date.now()}`,
    groupId: loan.groupId,
    memberId: loan.memberId,
    cycleId: group.currentCycleId || 'unknown', 
    type: TransactionType.LOAN_REPAYMENT,
    amount: amount,
    date: new Date().toISOString().split('T')[0]
  });

  // Update group totals
  group.totalLoansOutstanding -= amount;

  saveDatabase();
  return loan;
};
export const applyLateFees = (groupId: string, config: { amount: number, isPercentage: boolean }) => {
  const overdueLoans = db.loans.filter((l: Loan) => l.groupId === groupId && l.status === LoanStatus.ACTIVE && new Date(l.dueDate) < new Date());
  let count = 0;
  overdueLoans.forEach((l: Loan) => {
     const fee = config.isPercentage ? (l.balance * (config.amount / 100)) : config.amount;
     l.balance += fee;
     l.status = LoanStatus.DEFAULTED;
     l.totalRepayable += fee;
     
     // Record penalty transaction (accrual)
     db.transactions.push({
       id: `t_pen_${Date.now()}_${l.id}`,
       groupId,
       memberId: l.memberId,
       cycleId: 'c1',
       type: TransactionType.LOAN_PENALTY,
       amount: fee,
       date: new Date().toISOString().split('T')[0]
     });
     count++;
  });
  saveDatabase();
  return { count };
};

// Transactions
export const getTransactions = (groupId: string) => db.transactions.filter((t: Transaction) => t.groupId === groupId);
export const getContributions = (groupId: string) => db.transactions.filter((t: Transaction) => t.groupId === groupId && t.type === TransactionType.SHARE_DEPOSIT);
export const getExpenses = (groupId: string) => db.transactions.filter((t: Transaction) => t.groupId === groupId && t.type === TransactionType.EXPENSE);

export const addContribution = (groupId: string, data: any) => {
  const group = db.groups.find((g: GSLAGroup) => g.id === groupId);
  if (!group) throw new Error("Group not found");
  
  const amount = (data.shareCount * group.shareValue);
  
  const tx: Transaction = {
    id: `t_${Date.now()}`,
    groupId,
    memberId: data.memberId,
    cycleId: group.currentCycleId,
    type: TransactionType.SHARE_DEPOSIT,
    amount,
    shareCount: data.shareCount,
    solidarityAmount: data.solidarityAmount,
    date: data.date,
    paymentMethod: data.paymentMethod,
    notes: data.notes,
    recordedBy: data.recordedBy
  };
  
  db.transactions.push(tx);
  
  // Update member totals
  const member = db.members.find((m: Member) => m.id === data.memberId);
  if (member) {
    member.totalShares += data.shareCount;
  }
  
  // Update group totals
  group.totalSavings += amount;
  group.totalSolidarity += (data.solidarityAmount || 0);
  
  saveDatabase();
  return tx;
};
export const updateContribution = (id: string, data: any, userId: string, reason: string) => {
  const tx = db.transactions.find((t: Transaction) => t.id === id);
  if (!tx) throw new Error("Transaction not found");
  
  const oldShareCount = tx.shareCount || 0;
  const oldSolidarity = tx.solidarityAmount || 0;
  
  // Record History
  if (!tx.editHistory) tx.editHistory = [];
  tx.editHistory.push({
    id: Date.now().toString(),
    date: new Date().toISOString(),
    editorId: userId,
    reason,
    changes: [
       { field: 'shareCount', oldValue: oldShareCount, newValue: data.shareCount },
       { field: 'solidarity', oldValue: oldSolidarity, newValue: data.solidarityAmount }
    ]
  });
  
  // Update values
  const group = db.groups.find((g: GSLAGroup) => g.id === tx.groupId);
  if (group) {
     // Revert old values
     group.totalSavings -= (oldShareCount * group.shareValue);
     group.totalSolidarity -= oldSolidarity;
     const member = db.members.find((m: Member) => m.id === tx.memberId);
     if (member) member.totalShares -= oldShareCount;

     // Apply new values
     tx.shareCount = data.shareCount;
     tx.amount = (data.shareCount * group.shareValue);
     tx.solidarityAmount = data.solidarityAmount;
     tx.notes = data.notes;

     group.totalSavings += tx.amount;
     group.totalSolidarity += (tx.solidarityAmount || 0);
     if (member) member.totalShares += tx.shareCount;
  }
  
  saveDatabase();
  return tx;
};
export const voidContribution = (id: string, reason: string, userId: string) => {
  const tx = db.transactions.find((t: Transaction) => t.id === id);
  if (!tx) throw new Error("Transaction not found");
  
  tx.isVoid = true;
  tx.voidReason = reason;
  
  // Reverse financial impact
  const group = db.groups.find((g: GSLAGroup) => g.id === tx.groupId);
  if (group) {
    group.totalSavings -= tx.amount;
    group.totalSolidarity -= (tx.solidarityAmount || 0);
    const member = db.members.find((m: Member) => m.id === tx.memberId);
    if (member && tx.shareCount) member.totalShares -= tx.shareCount;
  }
  
  saveDatabase();
  return tx;
};

// Meeting Mode Batch
export const submitMeeting = (groupId: string, date: string, entries: any[]) => {
  const group = db.groups.find((g: GSLAGroup) => g.id === groupId);
  if (!group) throw new Error("Group not found");

  const meetingId = `mtg_${Date.now()}`;
  db.meetings.push({
    id: meetingId,
    groupId,
    cycleId: group.currentCycleId,
    date,
    type: 'REGULAR',
    createdBy: 'system',
    createdAt: new Date().toISOString()
  });

  entries.forEach((entry: any) => {
    // Attendance
    db.attendance.push({
      id: `att_${Math.random()}`,
      meetingId,
      groupId,
      memberId: entry.memberId,
      date,
      status: entry.present ? AttendanceStatus.PRESENT : AttendanceStatus.ABSENT,
      recordedBy: 'system',
      auditHistory: []
    });

    // Shares
    if (entry.shares > 0) {
       addContribution(groupId, {
         memberId: entry.memberId,
         shareCount: entry.shares,
         solidarityAmount: 0,
         date,
         paymentMethod: 'CASH',
         notes: 'Meeting Mode',
         recordedBy: 'system'
       });
    }

    // Loans
    if (entry.loanRepayment > 0) {
       const loan = db.loans.find((l: Loan) => l.memberId === entry.memberId && (l.status === LoanStatus.ACTIVE || l.status === LoanStatus.DEFAULTED));
       if (loan) repayLoan(loan.id, entry.loanRepayment);
    }
    
    // Fines (Simple record)
    if (entry.fines > 0) {
       db.transactions.push({
         id: `t_fine_${Math.random()}`,
         groupId,
         memberId: entry.memberId,
         cycleId: group.currentCycleId,
         type: TransactionType.FINE_PAYMENT,
         amount: entry.fines,
         date
       });
    }
  });
  
  saveDatabase();
  return { success: true };
};

// Fines
export const getFines = (groupId: string) => db.fines.filter((f: Fine) => f.groupId === groupId);
export const getFineCategories = (groupId: string) => db.fineCategories.filter((c: FineCategory) => c.groupId === groupId);
export const createFine = (groupId: string, data: any) => {
  const group = db.groups.find((g: GSLAGroup) => g.id === groupId);
  db.fines.push({
    id: `f_${Date.now()}`,
    groupId,
    cycleId: group?.currentCycleId || '',
    ...data,
    paidAmount: 0,
    status: FineStatus.UNPAID,
    auditHistory: []
  });
  saveDatabase();
};
export const payFine = (fineId: string, amount: number) => {
  const fine = db.fines.find((f: Fine) => f.id === fineId);
  if (!fine) throw new Error("Fine not found");
  
  fine.paidAmount += amount;
  if (fine.paidAmount >= fine.amount) {
     fine.status = FineStatus.PAID;
  } else {
     fine.status = FineStatus.PARTIALLY_PAID;
  }
  
  // Record Transaction
  db.transactions.push({
    id: `t_fine_pay_${Date.now()}`,
    groupId: fine.groupId,
    memberId: fine.memberId,
    cycleId: fine.cycleId,
    type: TransactionType.FINE_PAYMENT,
    amount,
    date: new Date().toISOString().split('T')[0]
  });
  
  saveDatabase();
};
export const updateFine = (id: string, data: any, userId: string, reason: string) => {
  const fine = db.fines.find((f: Fine) => f.id === id);
  if (!fine) return;
  fine.amount = data.amount;
  fine.categoryId = data.categoryId;
  saveDatabase();
};
export const voidFine = (id: string, reason: string, userId: string) => {
  const fine = db.fines.find((f: Fine) => f.id === id);
  if (!fine) return;
  fine.status = FineStatus.VOID;
  fine.reason = reason;
  saveDatabase();
};
export const addFineCategory = (groupId: string, name: string, amount: number) => {
  db.fineCategories.push({
    id: `fc_${Date.now()}`,
    groupId,
    name,
    defaultAmount: amount,
    isSystem: false,
    active: true
  });
  saveDatabase();
};

// Attendance
export const getMeetings = (groupId: string) => db.meetings.filter((m: Meeting) => m.groupId === groupId);
export const createMeeting = (groupId: string, data: any) => {
  const group = db.groups.find((g: GSLAGroup) => g.id === groupId);
  const meeting = {
    id: `mtg_${Date.now()}`,
    groupId,
    cycleId: group?.currentCycleId || '',
    ...data,
    createdAt: new Date().toISOString()
  };
  db.meetings.push(meeting);
  saveDatabase();
  return meeting;
};
export const getAttendance = (groupId: string) => db.attendance.filter((a: Attendance) => a.groupId === groupId);
export const saveAttendanceBatch = (meetingId: string, records: any[], userId: string) => {
  const meeting = db.meetings.find((m: Meeting) => m.id === meetingId);
  if (!meeting) throw new Error("Meeting not found");
  
  // Remove existing for this meeting to avoid dupes (simple replace strategy)
  // In real app, we update individually or upsert
  const existingIndices = db.attendance.map((a: Attendance, i: number) => a.meetingId === meetingId ? i : -1).filter((i: number) => i !== -1).reverse();
  existingIndices.forEach((i: number) => db.attendance.splice(i, 1));
  
  records.forEach(r => {
    db.attendance.push({
      id: `att_${Date.now()}_${r.memberId}`,
      meetingId,
      groupId: meeting.groupId,
      memberId: r.memberId,
      date: meeting.date,
      status: r.status,
      notes: r.notes,
      recordedBy: userId,
      auditHistory: []
    });
  });
  saveDatabase();
};
export const updateAttendance = (id: string, data: any, userId: string, reason: string) => {
  const att = db.attendance.find((a: Attendance) => a.id === id);
  if (!att) return;
  
  if (!att.auditHistory) att.auditHistory = [];
  att.auditHistory.push({
    id: Date.now().toString(),
    date: new Date().toISOString(),
    editorId: userId,
    reason,
    changes: [{ field: 'status', oldValue: att.status, newValue: data.status }]
  });
  
  att.status = data.status;
  att.notes = data.notes;
  saveDatabase();
};

// System
export const getNotifications = () => Promise.resolve(db.notifications);
export const markNotificationRead = (id: string) => {
  const n = db.notifications.find((notif: Notification) => notif.id === id);
  if (n) n.read = true;
  saveDatabase();
  return Promise.resolve();
};
export const markAllNotificationsRead = () => {
  db.notifications.forEach((n: Notification) => n.read = true);
  saveDatabase();
  return Promise.resolve();
};
export const getCycle = (id: string) => db.cycles.find((c: Cycle) => c.id === id);

// Reports (Mock Logic)
export const generateReport = (groupId: string, type: string, filters: any) => {
  // Simple data returns based on type
  if (type === 'SAVINGS_SUMMARY') {
    return getMembers(groupId).map((m: Member) => ({
      name: m.fullName,
      shares: m.totalShares,
      loans: m.totalLoans
    }));
  }
  if (type === 'CASH_FLOW') {
     const txs = getTransactions(groupId);
     const inflows = {
        Shares: txs.filter((t: Transaction) => t.type === TransactionType.SHARE_DEPOSIT).reduce((s: number, t: Transaction) => s + t.amount, 0),
        Loan_Repayments: txs.filter((t: Transaction) => t.type === TransactionType.LOAN_REPAYMENT).reduce((s: number, t: Transaction) => s + t.amount, 0),
        Fines: txs.filter((t: Transaction) => t.type === TransactionType.FINE_PAYMENT).reduce((s: number, t: Transaction) => s + t.amount, 0)
     };
     const outflows = {
        Loan_Disbursements: txs.filter((t: Transaction) => t.type === TransactionType.LOAN_DISBURSEMENT).reduce((s: number, t: Transaction) => s + t.amount, 0),
        Expenses: txs.filter((t: Transaction) => t.type === TransactionType.EXPENSE).reduce((s: number, t: Transaction) => s + t.amount, 0)
     };
     return {
        inflows,
        outflows,
        netCash: Object.values(inflows).reduce((a:any,b:any)=>a+b,0) - Object.values(outflows).reduce((a:any,b:any)=>a+b,0)
     };
  }
  // Default fallbacks
  return [];
};

export const getFullDatabaseBackup = () => db;
export const importDatabase = (json: string) => dbImport(json);
