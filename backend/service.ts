import { db, saveDatabase, importDatabase as dbImport } from './db';
import { 
  GSLAGroup, Member, Loan, Transaction, 
  UserRole, MemberStatus, LoanStatus, TransactionType, Attendance,
  GroupStatus, MeetingFrequency, Fine, FineCategory, FineStatus, Meeting, AttendanceStatus, Notification,
  User, UserStatus, AuditRecord, Cycle
} from '../types';

// Users
export const getUsers = () => db.users || [];

export const createUser = (userData: Partial<User>, creatorId: string) => {
    const newUser: User = {
        id: `u_${Date.now()}`,
        fullName: userData.fullName!,
        email: userData.email!,
        phone: userData.phone!,
        passwordHash: userData.passwordHash || 'password',
        role: userData.role || UserRole.MEMBER_USER,
        status: UserStatus.ACTIVE,
        failedLoginAttempts: 0,
        createdAt: new Date().toISOString(),
        createdBy: creatorId,
        managedGroupId: userData.managedGroupId,
        linkedMemberId: userData.linkedMemberId
    };
    if (!db.users) db.users = [];
    db.users.push(newUser);
    saveDatabase();
    return newUser;
};

export const login = (email: string, pass: string) => {
    const user = (db.users || []).find((u: User) => u.email === email);
    if (!user) throw new Error("User not found");
    if (user.passwordHash !== pass) throw new Error("Invalid password"); // Mock hash check
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
        ...data,
        id: `g_${Date.now()}`,
        createdAt: new Date().toISOString(),
        auditHistory: [],
        totalSavings: 0,
        totalLoansOutstanding: 0,
        totalSolidarity: 0,
        currentCycleId: '' // Needs manual cycle start usually
    };
    db.groups.push(newGroup);
    saveDatabase();
    return newGroup;
};

export const updateGroup = (id: string, changes: any, reason: string, editorId: string) => {
    const group = db.groups.find((g: GSLAGroup) => g.id === id);
    if (!group) throw new Error("Group not found");

    const auditEntry: AuditRecord = {
        id: `aud_${Date.now()}`,
        date: new Date().toISOString(),
        editorId,
        reason,
        changes: Object.keys(changes).map(key => ({
            field: key,
            // @ts-ignore
            oldValue: group[key],
            newValue: changes[key]
        }))
    };
    
    Object.assign(group, changes);
    group.auditHistory.push(auditEntry);
    saveDatabase();
    return group;
};

// Members
export const getMembers = (groupId: string) => db.members.filter((m: Member) => m.groupId === groupId);

export const addMember = (groupId: string, data: any) => {
    const newMember: Member = {
        ...data,
        id: `m_${Date.now()}`,
        groupId,
        joinDate: new Date().toISOString().split('T')[0],
        totalShares: 0,
        totalLoans: 0
    };
    db.members.push(newMember);
    saveDatabase();
    return newMember;
};

export const updateMember = (id: string, data: any) => {
    const member = db.members.find((m: Member) => m.id === id);
    if (!member) throw new Error("Member not found");
    Object.assign(member, data);
    saveDatabase();
    return member;
};

export const deleteMember = (id: string) => {
    const memberIndex = db.members.findIndex((m: Member) => m.id === id);
    if (memberIndex === -1) throw new Error("Member not found");
    
    // Soft delete if they have history
    const hasHistory = db.transactions.some((t: Transaction) => t.memberId === id);
    
    if (hasHistory) {
        db.members[memberIndex].status = MemberStatus.EXITED;
        saveDatabase();
        return { mode: 'archived' };
    } else {
        db.members.splice(memberIndex, 1);
        saveDatabase();
        return { mode: 'deleted' };
    }
};

export const importMembers = (groupId: string, membersData: any[]) => {
    let addedCount = 0;
    membersData.forEach(m => {
        // Simple duplicate check by phone or national ID
        const exists = db.members.find((ex: Member) => 
            ex.groupId === groupId && (ex.nationalId === m.nationalId || ex.phone === m.phone)
        );
        if (!exists) {
            addMember(groupId, { ...m, status: MemberStatus.ACTIVE });
            addedCount++;
        }
    });
    return { added: addedCount };
};

// Loans
export const getLoans = (groupId: string) => db.loans.filter((l: Loan) => l.groupId === groupId);

export const applyForLoan = (groupId: string, data: { memberId: string, amount: number, duration: number, purpose: string, interestRate: number }) => {
    const totalRepayable = data.amount + (data.amount * (data.interestRate / 100) * data.duration);
    
    const newLoan: Loan = {
        id: `l_${Date.now()}`,
        groupId,
        memberId: data.memberId,
        principal: data.amount,
        interestRate: data.interestRate,
        totalRepayable: totalRepayable,
        balance: totalRepayable,
        status: LoanStatus.PENDING, // Default to pending
        startDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + (data.duration * 30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0], // approx
        purpose: data.purpose
    };
    db.loans.push(newLoan);
    saveDatabase();
    return newLoan;
};

export const updateLoanStatus = (loanId: string, status: LoanStatus) => {
    const loan = db.loans.find((l: Loan) => l.id === loanId);
    if (!loan) throw new Error("Loan not found");
    
    loan.status = status;
    
    // Update group totals if active
    if (status === LoanStatus.ACTIVE) {
        const group = db.groups.find((g: GSLAGroup) => g.id === loan.groupId);
        if (group) {
             group.totalLoansOutstanding += loan.balance;
        }
        
        // Update member total loans
        const member = db.members.find((m: Member) => m.id === loan.memberId);
        if (member) {
            member.totalLoans += loan.balance;
        }
        
        // Record disbursement transaction
        db.transactions.push({
            id: `tx_disb_${Date.now()}`,
            groupId: loan.groupId,
            memberId: loan.memberId,
            cycleId: 'unknown', // Should ideally come from somewhere
            type: TransactionType.LOAN_DISBURSEMENT,
            amount: loan.principal,
            date: new Date().toISOString().split('T')[0],
            description: `Loan Disbursement for ${loan.purpose}`
        });
    }

    saveDatabase();
    return loan;
};

export const repayLoan = (loanId: string, amount: number) => {
    const loan = db.loans.find((l: Loan) => l.id === loanId);
    if (!loan) throw new Error("Loan not found");
    
    loan.balance = Math.max(0, loan.balance - amount);
    if (loan.balance === 0) {
        loan.status = LoanStatus.CLEARED;
    }
    
    // Update totals
    const group = db.groups.find((g: GSLAGroup) => g.id === loan.groupId);
    if (group) {
        group.totalLoansOutstanding = Math.max(0, group.totalLoansOutstanding - amount);
    }
    const member = db.members.find((m: Member) => m.id === loan.memberId);
    if (member) {
        member.totalLoans = Math.max(0, member.totalLoans - amount);
    }

    // Record Transaction
    db.transactions.push({
        id: `tx_repay_${Date.now()}`,
        groupId: loan.groupId,
        memberId: loan.memberId,
        cycleId: 'unknown',
        type: TransactionType.LOAN_REPAYMENT,
        amount: amount,
        date: new Date().toISOString().split('T')[0],
        description: `Loan Repayment`
    });

    saveDatabase();
    return loan;
};

export const applyLateFees = (groupId: string, config: { amount: number, isPercentage: boolean }) => {
  const group = db.groups.find((g: GSLAGroup) => g.id === groupId);
  const today = new Date().toISOString().split('T')[0];
  
  // Find loans that are ACTIVE and whose Due Date is strictly less than Today
  const overdueLoans = db.loans.filter((l: Loan) => 
    l.groupId === groupId && 
    l.status === LoanStatus.ACTIVE && 
    l.dueDate < today
  );
  
  let count = 0;
  overdueLoans.forEach((l: Loan) => {
     const fee = config.isPercentage ? (l.balance * (config.amount / 100)) : config.amount;
     
     // Update loan details
     l.balance += fee;
     l.status = LoanStatus.DEFAULTED;
     l.totalRepayable += fee;
     
     // Record penalty transaction (accrual)
     db.transactions.push({
       id: `t_pen_${Date.now()}_${l.id}`,
       groupId,
       memberId: l.memberId,
       cycleId: group?.currentCycleId || 'unknown',
       type: TransactionType.LOAN_PENALTY,
       amount: fee,
       date: today,
       description: `Late Fee: ${config.isPercentage ? config.amount + '%' : config.amount + ' RWF'} applied`,
       recordedBy: 'system'
     });
     count++;
  });
  
  saveDatabase();
  return { count };
};

// Transactions
export const getTransactions = (groupId: string) => db.transactions.filter((t: Transaction) => t.groupId === groupId);
export const getContributions = (groupId: string) => db.transactions.filter((t: Transaction) => t.groupId === groupId && t.type === TransactionType.SHARE_DEPOSIT);

export const addContribution = (groupId: string, data: any) => {
    const group = db.groups.find((g: GSLAGroup) => g.id === groupId);
    const amount = (data.shareCount || 0) * (group?.shareValue || 0);

    const newTx: Transaction = {
        id: `tx_${Date.now()}`,
        groupId,
        memberId: data.memberId,
        cycleId: group?.currentCycleId || 'unknown',
        type: TransactionType.SHARE_DEPOSIT,
        amount: amount,
        shareCount: data.shareCount,
        solidarityAmount: data.solidarityAmount,
        date: data.date,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        recordedBy: data.recordedBy
    };
    db.transactions.push(newTx);
    
    // Update group totals
    if (group) {
        group.totalSavings += amount;
        if (data.solidarityAmount) group.totalSolidarity += data.solidarityAmount;
    }
    
    // Update member totals
    const member = db.members.find((m: Member) => m.id === data.memberId);
    if (member) {
        member.totalShares += (data.shareCount || 0);
    }

    saveDatabase();
    return newTx;
};

export const updateContribution = (id: string, data: any, userId: string, reason: string) => {
    const tx = db.transactions.find((t: Transaction) => t.id === id);
    if (!tx) throw new Error("Transaction not found");
    
    // Revert old values from totals
    const group = db.groups.find((g: GSLAGroup) => g.id === tx.groupId);
    const member = db.members.find((m: Member) => m.id === tx.memberId);
    
    if (group) {
        group.totalSavings -= tx.amount;
        group.totalSolidarity -= (tx.solidarityAmount || 0);
    }
    if (member) {
        member.totalShares -= (tx.shareCount || 0);
    }

    // Apply new
    const newAmount = (data.shareCount || 0) * (group?.shareValue || 0);
    
    if (!tx.editHistory) tx.editHistory = [];
    tx.editHistory.push({
        id: `aud_${Date.now()}`,
        date: new Date().toISOString(),
        editorId: userId,
        reason,
        changes: [
            { field: 'shareCount', oldValue: tx.shareCount, newValue: data.shareCount },
            { field: 'solidarityAmount', oldValue: tx.solidarityAmount, newValue: data.solidarityAmount }
        ]
    });

    tx.shareCount = data.shareCount;
    tx.amount = newAmount;
    tx.solidarityAmount = data.solidarityAmount;
    tx.notes = data.notes;

    // Add new values to totals
    if (group) {
        group.totalSavings += newAmount;
        group.totalSolidarity += (data.solidarityAmount || 0);
    }
    if (member) {
        member.totalShares += (data.shareCount || 0);
    }

    saveDatabase();
    return tx;
};

export const voidContribution = (id: string, reason: string, userId: string) => {
    const tx = db.transactions.find((t: Transaction) => t.id === id);
    if (!tx) throw new Error("Transaction not found");

    tx.isVoid = true;
    tx.voidReason = reason;

    // Revert totals
    const group = db.groups.find((g: GSLAGroup) => g.id === tx.groupId);
    const member = db.members.find((m: Member) => m.id === tx.memberId);
    
    if (group) {
        group.totalSavings -= tx.amount;
        group.totalSolidarity -= (tx.solidarityAmount || 0);
    }
    if (member) {
        member.totalShares -= (tx.shareCount || 0);
    }

    saveDatabase();
    return tx;
};

export const getExpenses = (groupId: string) => db.transactions.filter((t: Transaction) => t.groupId === groupId && t.type === TransactionType.EXPENSE);

export const submitMeeting = (groupId: string, date: string, entries: any[]) => {
    const group = db.groups.find((g: GSLAGroup) => g.id === groupId);
    if (!group) throw new Error("Group not found");

    // 1. Create Meeting
    const meetingId = `mtg_${Date.now()}`;
    const meeting: Meeting = {
        id: meetingId,
        groupId,
        cycleId: group.currentCycleId,
        date,
        type: 'REGULAR',
        createdAt: new Date().toISOString(),
        createdBy: 'system'
    };
    db.meetings.push(meeting);

    entries.forEach(entry => {
        // 2. Attendance
        db.attendance.push({
            id: `att_${Date.now()}_${entry.memberId}`,
            meetingId,
            groupId,
            memberId: entry.memberId,
            date,
            status: entry.present ? AttendanceStatus.PRESENT : AttendanceStatus.ABSENT,
            recordedBy: 'system',
            auditHistory: []
        });

        // 3. Shares
        if (entry.shares > 0 && entry.present) {
            addContribution(groupId, {
                memberId: entry.memberId,
                shareCount: entry.shares,
                solidarityAmount: 0, // Simplified for bulk
                date,
                paymentMethod: 'CASH',
                notes: 'Meeting Entry',
                recordedBy: 'system'
            });
        }

        // 4. Loan Repayment
        if (entry.loanRepayment > 0 && entry.present) {
            // Find active loan
            const loan = db.loans.find((l: Loan) => l.memberId === entry.memberId && (l.status === LoanStatus.ACTIVE || l.status === LoanStatus.DEFAULTED));
            if (loan) {
                repayLoan(loan.id, entry.loanRepayment);
            }
        }

        // 5. Fines (Immediate Payment logic or Accrual?)
        // Assuming immediate payment for Meeting Mode
        if (entry.fines > 0 && entry.present) {
            db.transactions.push({
                id: `tx_fine_${Date.now()}_${entry.memberId}`,
                groupId,
                memberId: entry.memberId,
                cycleId: group.currentCycleId,
                type: TransactionType.FINE_PAYMENT,
                amount: entry.fines,
                date,
                description: 'Meeting Fine',
                recordedBy: 'system'
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
    const newFine: Fine = {
        id: `f_${Date.now()}`,
        groupId,
        memberId: data.memberId,
        cycleId: group?.currentCycleId || 'unknown',
        date: data.date,
        categoryId: data.categoryId,
        amount: data.amount,
        paidAmount: 0,
        status: FineStatus.UNPAID,
        reason: data.reason,
        recordedBy: data.recordedBy,
        auditHistory: []
    };
    db.fines.push(newFine);
    saveDatabase();
    return newFine;
};

export const payFine = (fineId: string, amount: number) => {
    const fine = db.fines.find((f: Fine) => f.id === fineId);
    if (!fine) throw new Error("Fine not found");

    fine.paidAmount += amount;
    if (fine.paidAmount >= fine.amount) {
        fine.paidAmount = fine.amount;
        fine.status = FineStatus.PAID;
    } else {
        fine.status = FineStatus.PARTIALLY_PAID;
    }

    // Record Transaction
    db.transactions.push({
        id: `tx_fp_${Date.now()}`,
        groupId: fine.groupId,
        memberId: fine.memberId,
        cycleId: fine.cycleId,
        type: TransactionType.FINE_PAYMENT,
        amount: amount,
        date: new Date().toISOString().split('T')[0],
        description: `Fine Payment`
    });

    saveDatabase();
    return fine;
};

export const updateFine = (id: string, data: any, userId: string, reason: string) => {
    const fine = db.fines.find((f: Fine) => f.id === id);
    if (!fine) throw new Error("Fine not found");
    
    // Audit
    fine.auditHistory.push({
        id: `aud_${Date.now()}`,
        date: new Date().toISOString(),
        editorId: userId,
        reason,
        changes: [{ field: 'amount', oldValue: fine.amount, newValue: data.amount }]
    });

    fine.amount = data.amount;
    fine.categoryId = data.categoryId;
    
    // Re-eval status
    if (fine.paidAmount >= fine.amount) fine.status = FineStatus.PAID;
    else if (fine.paidAmount > 0) fine.status = FineStatus.PARTIALLY_PAID;
    else fine.status = FineStatus.UNPAID;

    saveDatabase();
    return fine;
};

export const voidFine = (id: string, reason: string, userId: string) => {
    const fine = db.fines.find((f: Fine) => f.id === id);
    if (!fine) throw new Error("Fine not found");
    if (fine.paidAmount > 0) throw new Error("Cannot void fine with payments");

    fine.status = FineStatus.VOID;
    fine.auditHistory.push({
        id: `aud_${Date.now()}`,
        date: new Date().toISOString(),
        editorId: userId,
        reason: `VOIDED: ${reason}`,
        changes: []
    });

    saveDatabase();
    return fine;
};

export const addFineCategory = (groupId: string, name: string, amount: number) => {
    const newCat: FineCategory = {
        id: `fc_${Date.now()}`,
        groupId,
        name,
        defaultAmount: amount,
        isSystem: false,
        active: true
    };
    db.fineCategories.push(newCat);
    saveDatabase();
    return newCat;
};

// Attendance
export const getMeetings = (groupId: string) => db.meetings.filter((m: Meeting) => m.groupId === groupId);

export const createMeeting = (groupId: string, data: any) => {
    const newMeeting: Meeting = {
        id: `mtg_${Date.now()}`,
        groupId,
        cycleId: db.groups.find((g:GSLAGroup)=>g.id===groupId)?.currentCycleId || 'unknown',
        date: data.date,
        type: data.type,
        notes: data.notes,
        createdBy: data.createdBy,
        createdAt: new Date().toISOString()
    };
    db.meetings.push(newMeeting);
    saveDatabase();
    return newMeeting;
};

export const getAttendance = (groupId: string) => db.attendance.filter((a: Attendance) => a.groupId === groupId);

export const saveAttendanceBatch = (meetingId: string, records: any[], userId: string) => {
    const meeting = db.meetings.find((m: Meeting) => m.id === meetingId);
    if (!meeting) throw new Error("Meeting not found");

    records.forEach(rec => {
        const existing = db.attendance.find((a: Attendance) => a.meetingId === meetingId && a.memberId === rec.memberId);
        if (existing) {
            existing.status = rec.status;
            existing.notes = rec.notes;
        } else {
            db.attendance.push({
                id: `att_${Date.now()}_${rec.memberId}`,
                meetingId,
                groupId: meeting.groupId,
                memberId: rec.memberId,
                date: meeting.date,
                status: rec.status,
                notes: rec.notes,
                recordedBy: userId,
                auditHistory: []
            });
        }
    });
    saveDatabase();
    return { success: true };
};

export const updateAttendance = (id: string, data: any, userId: string, reason: string) => {
    const att = db.attendance.find((a: Attendance) => a.id === id);
    if (!att) throw new Error("Record not found");

    att.auditHistory.push({
        id: `aud_${Date.now()}`,
        date: new Date().toISOString(),
        editorId: userId,
        reason,
        changes: [{ field: 'status', oldValue: att.status, newValue: data.status }]
    });

    att.status = data.status;
    att.notes = data.notes;
    saveDatabase();
    return att;
};

// Notifications
export const getNotifications = () => db.notifications || [];
export const markNotificationRead = (id: string) => {
    const notif = db.notifications?.find((n: Notification) => n.id === id);
    if (notif) notif.read = true;
    saveDatabase();
};
export const markAllNotificationsRead = () => {
    db.notifications?.forEach((n: Notification) => n.read = true);
    saveDatabase();
};

// Cycles
export const getCycle = (id: string) => db.cycles.find((c: Cycle) => c.id === id);

// Reports
export const generateReport = (groupId: string, type: string, filters: any) => {
    // Basic Mock Implementation for data structure required by UI
    const groupTransactions = db.transactions.filter((t: Transaction) => t.groupId === groupId && !t.isVoid);
    const groupMembers = db.members.filter((m: Member) => m.groupId === groupId);

    switch(type) {
        case 'SAVINGS_SUMMARY':
            return groupMembers.map((m: Member) => ({
                id: m.id,
                name: m.fullName,
                totalShares: m.totalShares,
                savingsValue: m.totalShares * (db.groups.find((g:GSLAGroup)=>g.id===groupId)?.shareValue || 0)
            }));
        case 'LOAN_PORTFOLIO':
            return db.loans.filter((l: Loan) => l.groupId === groupId).map((l: Loan) => ({
                id: l.id,
                member: groupMembers.find((m: Member) => m.id === l.memberId)?.fullName,
                principal: l.principal,
                balance: l.balance,
                status: l.status,
                dueDate: l.dueDate
            }));
        case 'CASH_FLOW':
             const inflows: any = {};
             const outflows: any = {};
             let net = 0;
             groupTransactions.forEach((t: Transaction) => {
                 if ([TransactionType.SHARE_DEPOSIT, TransactionType.LOAN_REPAYMENT, TransactionType.FINE_PAYMENT].includes(t.type)) {
                     const val = t.amount + (t.solidarityAmount || 0);
                     inflows[t.type] = (inflows[t.type] || 0) + val;
                     net += val;
                 } else {
                     outflows[t.type] = (outflows[t.type] || 0) + t.amount;
                     net -= t.amount;
                 }
             });
             return { inflows, outflows, netCash: net };
        case 'SHARE_OUT':
             // Simulation
             const group = db.groups.find((g: GSLAGroup) => g.id === groupId);
             const shareValue = group?.shareValue || 0;
             const totalShares = groupMembers.reduce((acc: number, m: Member) => acc + m.totalShares, 0);
             // Profit simulation (e.g. 10% of savings)
             const estimatedProfit = (totalShares * shareValue) * 0.10;
             
             return {
                 summary: {
                     cashOnHand: group?.totalSavings || 0,
                     socialFund: group?.totalSolidarity || 0,
                     outstandingLoans: group?.totalLoansOutstanding || 0,
                     netWorth: (group?.totalSavings || 0) + estimatedProfit,
                     valuePerShare: shareValue + (estimatedProfit / (totalShares || 1))
                 },
                 members: groupMembers.map((m: Member) => ({
                     name: m.fullName,
                     shares: m.totalShares,
                     invested: m.totalShares * shareValue,
                     profit: (m.totalShares / (totalShares || 1)) * estimatedProfit,
                     currentValue: (m.totalShares * shareValue) + ((m.totalShares / (totalShares || 1)) * estimatedProfit)
                 }))
             };
        case 'FINE_REPORT':
            return db.fines.filter((f: Fine) => f.groupId === groupId).map((f: Fine) => ({
                id: f.id,
                member: groupMembers.find((m: Member) => m.id === f.memberId)?.fullName,
                amount: f.amount,
                paid: f.paidAmount,
                status: f.status,
                date: f.date
            }));
        case 'ATTENDANCE_REGISTER':
            // Simple dump for now
            const groupMeetings = db.meetings.filter((m:Meeting) => m.groupId === groupId);
            const attendanceRecs = db.attendance.filter((a:Attendance) => a.groupId === groupId);
            return groupMeetings.map((mtg: Meeting) => {
                const presence = attendanceRecs.filter((a:Attendance) => a.meetingId === mtg.id);
                return {
                    date: mtg.date,
                    type: mtg.type,
                    present: presence.filter((p:Attendance) => p.status === AttendanceStatus.PRESENT).length,
                    absent: presence.filter((p:Attendance) => p.status === AttendanceStatus.ABSENT).length
                };
            });
        case 'EXPENSE_REPORT':
            return db.transactions.filter((t:Transaction) => t.groupId === groupId && t.type === TransactionType.EXPENSE).map((t:Transaction) => ({
                date: t.date,
                description: t.description || 'Expense',
                amount: t.amount
            }));
        default:
            return [];
    }
};

// Backup
export const getFullDatabaseBackup = () => db;
export const importDatabase = (json: string) => dbImport(json);
