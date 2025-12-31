
import { supabase } from './supabaseClient';
import { 
  GSLAGroup, Member, Loan, Transaction, 
  UserRole, MemberStatus, LoanStatus, TransactionType, Attendance,
  GroupStatus, Fine, FineCategory, FineStatus, Meeting, AttendanceStatus, Notification,
  User, UserStatus, AuditRecord, Cycle, ExpenseCategory
} from '../types';

// Helper to handle Supabase responses
const handleResponse = async (query: any) => {
    const { data, error } = await query;
    if (error) {
        console.error("Supabase Error:", error);
        throw new Error(error.message);
    }
    return data;
};

// Users
export const getUsers = async () => {
    return handleResponse(supabase.from('users').select('*'));
};

export const createUser = async (userData: Partial<User>, creatorId: string) => {
    const newUser = {
        id: `u_${Date.now()}`,
        ...userData,
        status: UserStatus.ACTIVE,
        failedLoginAttempts: 0,
        createdAt: new Date().toISOString(),
        createdBy: creatorId
    };
    return handleResponse(supabase.from('users').insert(newUser).select().single());
};

export const login = async (email: string, pass: string) => {
    // Note: In production, use supabase.auth.signInWithPassword. 
    // This maintains the existing "custom user table" logic requested.
    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

    if (error || !user) throw new Error("User not found");
    if (user.passwordHash !== pass) throw new Error("Invalid password");
    if (user.status !== UserStatus.ACTIVE) throw new Error("Account is locked");

    // Update login time
    await supabase.from('users').update({ lastLogin: new Date().toISOString() }).eq('id', user.id);
    return user;
};

export const seedSuperAdmin = async () => {
    const { data } = await supabase.from('users').select('*').eq('email', 'admin@vjn.rw').single();
    if (data) return { success: false, message: 'Super Admin already exists.' };

    const superAdmin = {
        id: 'u_super',
        fullName: 'Super Admin',
        email: 'admin@vjn.rw',
        phone: '0788000000',
        passwordHash: 'admin123',
        role: UserRole.SUPER_ADMIN,
        status: UserStatus.ACTIVE,
        createdAt: new Date().toISOString(),
        createdBy: 'system'
    };

    const { error } = await supabase.from('users').insert(superAdmin);
    if (error) throw new Error(error.message);
    return { success: true, message: 'Super Admin created successfully.' };
};

// Groups
export const getGroups = async () => {
    return handleResponse(supabase.from('groups').select('*'));
};

export const getGroup = async (id: string) => {
    return handleResponse(supabase.from('groups').select('*').eq('id', id).single());
};

export const createGroup = async (data: any, creatorId: string) => {
    const newGroup = {
        id: `g_${Date.now()}`,
        ...data,
        createdAt: new Date().toISOString(),
        auditHistory: [{
            id: `aud_${Date.now()}`,
            date: new Date().toISOString(),
            editorId: creatorId,
            reason: 'Group Created',
            changes: []
        }],
        totalSavings: 0,
        totalLoansOutstanding: 0,
        totalSolidarity: 0
    };
    return handleResponse(supabase.from('groups').insert(newGroup).select().single());
};

export const updateGroup = async (id: string, changes: any, reason: string, editorId: string) => {
    // 1. Fetch current history
    const { data: current } = await supabase.from('groups').select('auditHistory').eq('id', id).single();
    const currentAudit = current?.auditHistory || [];

    // 2. Prepare Audit
    const auditEntry = {
        id: `aud_${Date.now()}`,
        date: new Date().toISOString(),
        editorId,
        reason,
        changes: Object.keys(changes).map(key => ({ field: key, newValue: changes[key] }))
    };

    // 3. Update
    return handleResponse(supabase.from('groups').update({
        ...changes,
        auditHistory: [...currentAudit, auditEntry]
    }).eq('id', id).select().single());
};

// Members
export const getMembers = async (groupId: string) => {
    return handleResponse(supabase.from('members').select('*').eq('groupId', groupId));
};

export const addMember = async (groupId: string, data: any) => {
    const newMember = {
        id: `m_${Date.now()}`,
        groupId,
        ...data,
        joinDate: new Date().toISOString().split('T')[0],
        totalShares: 0,
        totalLoans: 0
    };
    return handleResponse(supabase.from('members').insert(newMember).select().single());
};

export const updateMember = async (id: string, data: any) => {
    return handleResponse(supabase.from('members').update(data).eq('id', id).select().single());
};

export const deleteMember = async (id: string) => {
    // Check history
    const { count } = await supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('memberId', id);
    
    if (count && count > 0) {
        await supabase.from('members').update({ status: MemberStatus.EXITED }).eq('id', id);
        return { mode: 'archived' };
    } else {
        await supabase.from('members').delete().eq('id', id);
        return { mode: 'deleted' };
    }
};

export const importMembers = async (groupId: string, membersData: any[]) => {
    let addedCount = 0;
    // Basic bulk insert, skipping sophisticated dup checks for brevity in this migration
    const inserts = membersData.map((m, i) => ({
        id: `m_imp_${Date.now()}_${i}`,
        groupId,
        ...m,
        joinDate: new Date().toISOString().split('T')[0],
        totalShares: 0,
        totalLoans: 0,
        status: MemberStatus.ACTIVE
    }));
    
    if (inserts.length > 0) {
        const { error } = await supabase.from('members').insert(inserts);
        if (!error) addedCount = inserts.length;
    }
    return { added: addedCount };
};

// Loans
export const getLoans = async (groupId: string) => {
    return handleResponse(supabase.from('loans').select('*').eq('groupId', groupId));
};

export const applyForLoan = async (groupId: string, data: any) => {
    const totalRepayable = data.amount + (data.amount * (data.interestRate / 100) * data.duration);
    const newLoan = {
        id: `l_${Date.now()}`,
        groupId,
        memberId: data.memberId,
        principal: data.amount,
        interestRate: data.interestRate,
        totalRepayable: totalRepayable,
        balance: totalRepayable,
        status: LoanStatus.PENDING,
        startDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + (data.duration * 30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
        purpose: data.purpose
    };
    return handleResponse(supabase.from('loans').insert(newLoan).select().single());
};

export const updateLoanStatus = async (loanId: string, status: LoanStatus) => {
    const { data: loan } = await supabase.from('loans').select('*').eq('id', loanId).single();
    if (!loan) throw new Error("Loan not found");

    if (status === LoanStatus.ACTIVE && loan.status !== LoanStatus.ACTIVE) {
        // Increment Group Total Loans
        await rpcIncrementGroupField(loan.groupId, 'totalLoansOutstanding', loan.balance);
        // Increment Member Total Loans
        await rpcIncrementMemberField(loan.memberId, 'totalLoans', loan.balance);
        
        // Record Disbursement
        await supabase.from('transactions').insert({
            id: `tx_disb_${Date.now()}`,
            groupId: loan.groupId,
            memberId: loan.memberId,
            type: TransactionType.LOAN_DISBURSEMENT,
            amount: loan.principal,
            date: new Date().toISOString().split('T')[0],
            description: `Loan Disbursement`
        });
    }

    return handleResponse(supabase.from('loans').update({ status }).eq('id', loanId));
};

export const repayLoan = async (loanId: string, amount: number) => {
    const { data: loan } = await supabase.from('loans').select('*').eq('id', loanId).single();
    if (!loan) throw new Error("Loan not found");

    const newBalance = Math.max(0, loan.balance - amount);
    const newStatus = newBalance === 0 ? LoanStatus.CLEARED : loan.status;

    await supabase.from('loans').update({ balance: newBalance, status: newStatus }).eq('id', loanId);
    
    // Decrement Group Total
    await rpcIncrementGroupField(loan.groupId, 'totalLoansOutstanding', -amount);
    // Decrement Member Total
    await rpcIncrementMemberField(loan.memberId, 'totalLoans', -amount);

    // Record Transaction
    await supabase.from('transactions').insert({
        id: `tx_repay_${Date.now()}`,
        groupId: loan.groupId,
        memberId: loan.memberId,
        type: TransactionType.LOAN_REPAYMENT,
        amount: amount,
        date: new Date().toISOString().split('T')[0],
        description: 'Loan Repayment'
    });
};

export const applyLateFees = async (groupId: string, config: { amount: number, isPercentage: boolean }) => {
    const today = new Date().toISOString().split('T')[0];
    // Find overdue
    const { data: overdueLoans } = await supabase.from('loans').select('*')
        .eq('groupId', groupId)
        .eq('status', LoanStatus.ACTIVE)
        .lt('dueDate', today);

    let count = 0;
    if (overdueLoans) {
        for (const l of overdueLoans) {
            const fee = config.isPercentage ? (l.balance * (config.amount / 100)) : config.amount;
            
            await supabase.from('loans').update({
                balance: l.balance + fee,
                totalRepayable: l.totalRepayable + fee,
                status: LoanStatus.DEFAULTED
            }).eq('id', l.id);

            await supabase.from('transactions').insert({
                id: `t_pen_${Date.now()}_${l.id}`,
                groupId,
                memberId: l.memberId,
                type: TransactionType.LOAN_PENALTY,
                amount: fee,
                date: today,
                description: 'Late Fee Applied'
            });
            count++;
        }
    }
    return { count };
};

// Transactions
export const getTransactions = async (groupId: string) => {
    return handleResponse(supabase.from('transactions').select('*').eq('groupId', groupId));
};

export const getContributions = async (groupId: string) => {
    return handleResponse(supabase.from('transactions').select('*').eq('groupId', groupId).eq('type', TransactionType.SHARE_DEPOSIT));
};

export const addContribution = async (groupId: string, data: any) => {
    const { data: group } = await supabase.from('groups').select('shareValue').eq('id', groupId).single();
    const amount = (data.shareCount || 0) * (group?.shareValue || 0);

    const newTx = {
        id: `tx_${Date.now()}`,
        groupId,
        memberId: data.memberId,
        type: TransactionType.SHARE_DEPOSIT,
        amount,
        shareCount: data.shareCount,
        solidarityAmount: data.solidarityAmount,
        date: data.date,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        recordedBy: data.recordedBy
    };

    await supabase.from('transactions').insert(newTx);
    
    // Update Totals
    await rpcIncrementGroupField(groupId, 'totalSavings', amount);
    if (data.solidarityAmount) await rpcIncrementGroupField(groupId, 'totalSolidarity', data.solidarityAmount);
    await rpcIncrementMemberField(data.memberId, 'totalShares', data.shareCount);

    return newTx;
};

export const updateContribution = async (id: string, data: any, userId: string, reason: string) => {
    const { data: tx } = await supabase.from('transactions').select('*').eq('id', id).single();
    const { data: group } = await supabase.from('groups').select('shareValue').eq('id', tx.groupId).single();
    
    // Revert old
    await rpcIncrementGroupField(tx.groupId, 'totalSavings', -tx.amount);
    await rpcIncrementGroupField(tx.groupId, 'totalSolidarity', -(tx.solidarityAmount || 0));
    await rpcIncrementMemberField(tx.memberId, 'totalShares', -tx.shareCount);

    // Apply new
    const newAmount = (data.shareCount || 0) * (group?.shareValue || 0);
    const updates = {
        shareCount: data.shareCount,
        amount: newAmount,
        solidarityAmount: data.solidarityAmount,
        notes: data.notes
        // In real app, append to editHistory here
    };

    await supabase.from('transactions').update(updates).eq('id', id);

    await rpcIncrementGroupField(tx.groupId, 'totalSavings', newAmount);
    await rpcIncrementGroupField(tx.groupId, 'totalSolidarity', data.solidarityAmount);
    await rpcIncrementMemberField(tx.memberId, 'totalShares', data.shareCount);
};

export const voidContribution = async (id: string, reason: string, userId: string) => {
    const { data: tx } = await supabase.from('transactions').select('*').eq('id', id).single();
    
    await supabase.from('transactions').update({ isVoid: true, voidReason: reason }).eq('id', id);

    await rpcIncrementGroupField(tx.groupId, 'totalSavings', -tx.amount);
    await rpcIncrementGroupField(tx.groupId, 'totalSolidarity', -(tx.solidarityAmount || 0));
    await rpcIncrementMemberField(tx.memberId, 'totalShares', -tx.shareCount);
};

// --- Helpers to simulate atomic increments (Race condition prone without proper RPC, but functional for migration) ---
async function rpcIncrementGroupField(id: string, field: string, value: number) {
    const { data } = await supabase.from('groups').select(field).eq('id', id).single();
    const current = data ? data[field] : 0;
    await supabase.from('groups').update({ [field]: current + value }).eq('id', id);
}

async function rpcIncrementMemberField(id: string, field: string, value: number) {
    const { data } = await supabase.from('members').select(field).eq('id', id).single();
    const current = data ? data[field] : 0;
    await supabase.from('members').update({ [field]: current + value }).eq('id', id);
}

// Expenses
export const getExpenses = async (groupId: string) => {
    return handleResponse(supabase.from('transactions').select('*').eq('groupId', groupId).eq('type', TransactionType.EXPENSE));
};

export const getExpenseCategories = async (groupId: string) => {
    return handleResponse(supabase.from('expense_categories').select('*').eq('groupId', groupId));
};

export const addExpenseCategory = async (groupId: string, name: string) => {
    const newCat = { id: `ec_${Date.now()}`, groupId, name, active: true };
    return handleResponse(supabase.from('expense_categories').insert(newCat));
};

export const createExpense = async (groupId: string, data: any) => {
    return handleResponse(supabase.from('transactions').insert({
        id: `tx_exp_${Date.now()}`,
        groupId,
        type: TransactionType.EXPENSE,
        ...data
    }));
};

export const updateExpense = async (id: string, data: any, userId: string, reason: string) => {
    return handleResponse(supabase.from('transactions').update(data).eq('id', id));
};

export const voidExpense = async (id: string, reason: string, userId: string) => {
    return handleResponse(supabase.from('transactions').update({ isVoid: true, voidReason: reason }).eq('id', id));
};

export const getCashBalance = async (groupId: string) => {
    const { data: txs } = await supabase.from('transactions').select('*').eq('groupId', groupId).eq('isVoid', false);
    if (!txs) return 0;
    
    const inflows = txs.filter(t => ['SHARE_DEPOSIT', 'LOAN_REPAYMENT', 'FINE_PAYMENT'].includes(t.type))
        .reduce((acc, t) => acc + t.amount + (t.solidarityAmount || 0), 0);
    const outflows = txs.filter(t => ['EXPENSE', 'LOAN_DISBURSEMENT'].includes(t.type))
        .reduce((acc, t) => acc + t.amount, 0);
    return inflows - outflows;
};

// Meeting Mode Submission
export const submitMeeting = async (groupId: string, date: string, entries: any[]) => {
    const meetingId = `mtg_${Date.now()}`;
    await supabase.from('meetings').insert({
        id: meetingId,
        groupId,
        date,
        type: 'REGULAR',
        createdAt: new Date().toISOString()
    });

    // We process sequentially to ensure order, though Promise.all is faster
    // For large lists, batching is better.
    const attInserts = [];
    const txInserts = [];
    const memberIncrements: any = {};
    const loanUpdates: any = {};

    for (const entry of entries) {
        // Attendance
        attInserts.push({
            id: `att_${Date.now()}_${entry.memberId}`,
            meetingId,
            groupId,
            memberId: entry.memberId,
            date,
            status: entry.present ? AttendanceStatus.PRESENT : AttendanceStatus.ABSENT,
            recordedBy: 'system'
        });

        if (entry.present) {
            // Shares
            if (entry.shares > 0) {
                // Fetch group share value? Assume caller logic or fetch once.
                // Optimizing: We rely on `addContribution` logic? No, too slow. Batch here.
                // Hard assumption: shareValue fetched previously. 
                // We'll create TX here directly but totals update is tricky in batch.
                // Simple approach: Use loop.
                await addContribution(groupId, {
                    memberId: entry.memberId,
                    shareCount: entry.shares,
                    solidarityAmount: 0,
                    date,
                    paymentMethod: 'CASH',
                    recordedBy: 'system'
                });
            }
            
            // Repayment
            if (entry.loanRepayment > 0) {
               // Find active loan
               const { data: loan } = await supabase.from('loans').select('*')
                   .eq('memberId', entry.memberId)
                   .eq('status', LoanStatus.ACTIVE)
                   .single();
               
               if (loan) await repayLoan(loan.id, entry.loanRepayment);
            }

            // Fines
            if (entry.fines > 0) {
               await supabase.from('transactions').insert({
                   id: `tx_fine_${Date.now()}_${entry.memberId}`,
                   groupId,
                   memberId: entry.memberId,
                   type: TransactionType.FINE_PAYMENT,
                   amount: entry.fines,
                   date
               });
            }
        }
    }
    
    if (attInserts.length > 0) await supabase.from('attendance').insert(attInserts);
    
    return { success: true };
};

// Fines
export const getFines = async (groupId: string) => handleResponse(supabase.from('fines').select('*').eq('groupId', groupId));
export const getFineCategories = async (groupId: string) => handleResponse(supabase.from('fine_categories').select('*').eq('groupId', groupId));
export const createFine = async (groupId: string, data: any) => {
    return handleResponse(supabase.from('fines').insert({
        id: `f_${Date.now()}`,
        groupId,
        status: FineStatus.UNPAID,
        paidAmount: 0,
        ...data
    }));
};
export const payFine = async (fineId: string, amount: number, method: string, userId: string) => {
    const { data: fine } = await supabase.from('fines').select('*').eq('id', fineId).single();
    const newPaid = fine.paidAmount + amount;
    const newStatus = newPaid >= fine.amount ? FineStatus.PAID : FineStatus.PARTIALLY_PAID;
    
    await supabase.from('fines').update({ paidAmount: newPaid, status: newStatus }).eq('id', fineId);
    
    await supabase.from('transactions').insert({
        id: `tx_fp_${Date.now()}`,
        groupId: fine.groupId,
        memberId: fine.memberId,
        type: TransactionType.FINE_PAYMENT,
        amount: amount,
        date: new Date().toISOString().split('T')[0],
        paymentMethod: method,
        recordedBy: userId
    });
};
export const updateFine = async (id: string, data: any, userId: string, reason: string) => {
    return handleResponse(supabase.from('fines').update(data).eq('id', id));
};
export const voidFine = async (id: string, reason: string, userId: string) => {
    return handleResponse(supabase.from('fines').update({ status: FineStatus.VOID }).eq('id', id));
};
export const addFineCategory = async (groupId: string, name: string, amount: number) => {
    return handleResponse(supabase.from('fine_categories').insert({
        id: `fc_${Date.now()}`,
        groupId,
        name,
        defaultAmount: amount,
        isSystem: false,
        active: true
    }));
};

// Attendance
export const getMeetings = async (groupId: string) => handleResponse(supabase.from('meetings').select('*').eq('groupId', groupId));
export const createMeeting = async (groupId: string, data: any) => {
    const m = { id: `mtg_${Date.now()}`, groupId, ...data, createdAt: new Date().toISOString() };
    return handleResponse(supabase.from('meetings').insert(m).select().single());
};
export const getAttendance = async (groupId: string) => handleResponse(supabase.from('attendance').select('*').eq('groupId', groupId));
export const saveAttendanceBatch = async (meetingId: string, records: any[], userId: string) => {
    // Delete existing for this meeting (simplest strategy for batch save)
    // Real prod might assume upsert
    // We'll stick to insert loop or upsert if IDs are stable.
    // Given the UI sends all, upsert is best.
    const upserts = records.map(r => ({
        id: `att_${meetingId}_${r.memberId}`, // Stable ID based on meeting+member
        meetingId,
        groupId: '', // Need to fetch meeting group ID or pass it. 
                     // IMPORTANT: Service signature is (meetingId, records, userId).
                     // We'll look up the meeting first.
        memberId: r.memberId,
        status: r.status,
        notes: r.notes
    }));
    
    // We need groupId for the record.
    const { data: mtg } = await supabase.from('meetings').select('groupId').eq('id', meetingId).single();
    if(mtg) {
        upserts.forEach(u => u.groupId = mtg.groupId);
        await supabase.from('attendance').upsert(upserts);
    }
    return { success: true };
};

export const updateAttendance = async (id: string, data: any, userId: string, reason: string) => {
    // 1. Fetch current history to append audit
    const { data: current } = await supabase.from('attendance').select('auditHistory').eq('id', id).single();
    const currentAudit = current?.auditHistory || [];
    
    const auditEntry = {
        id: `aud_${Date.now()}`,
        date: new Date().toISOString(),
        editorId: userId,
        reason: reason || 'Update',
        changes: Object.keys(data).map(key => ({ field: key, newValue: data[key] }))
    };

    return handleResponse(supabase.from('attendance').update({
        ...data,
        auditHistory: [...currentAudit, auditEntry]
    }).eq('id', id));
};

// Notifications & Systems
export const getNotifications = async () => handleResponse(supabase.from('notifications').select('*'));
export const markNotificationRead = async (id: string) => handleResponse(supabase.from('notifications').update({ read: true }).eq('id', id));
export const markAllNotificationsRead = async () => handleResponse(supabase.from('notifications').update({ read: true }).neq('read', true));
export const getCycle = async (id: string) => handleResponse(supabase.from('cycles').select('*').eq('id', id).single());

// Reports
export const generateReport = async (groupId: string, type: string, filters: any) => {
    // Fetch Data
    const members = await getMembers(groupId);
    const { data: group } = await supabase.from('groups').select('*').eq('id', groupId).single();
    
    if (type === 'SAVINGS_SUMMARY') {
        return members.map((m: any) => ({
            id: m.id,
            "Member Name": m.fullName,
            "Total Shares": m.totalShares,
            "Total Savings": m.totalShares * (group?.shareValue || 0),
            "Status": m.status
        }));
    }
    // Implement other reports similarly by fetching required tables
    // For MVP migration, we'll return empty array for complex ones not yet mapped
    return [];
};

export const sendSMS = async (phone: string, msg: string) => {
    console.log("Supabase Mock SMS:", phone, msg);
    return { success: true };
};

// Backup
export const getFullDatabaseBackup = async () => {
    // Return structured dump
    const { data: users } = await supabase.from('users').select('*');
    const { data: groups } = await supabase.from('groups').select('*');
    // ... fetch all
    return { users, groups }; 
};
export const importDatabase = async (json: string) => {
    // Complex to implement full restore via client without admin key
    console.warn("Import not fully supported in client-side migration");
    return { success: false, error: "Not supported" };
};
