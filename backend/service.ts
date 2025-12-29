import { db, saveDatabase } from './db';
import { TransactionType, LoanStatus, Member, GSLAGroup } from '../types';

// --- Read Operations ---

export const getGroups = () => [...db.groups];
export const getGroup = (id: string) => db.groups.find((g: GSLAGroup) => g.id === id);

export const getMembers = (groupId: string) => db.members.filter((m: Member) => m.groupId === groupId);
export const getLoans = (groupId: string) => db.loans.filter((l: any) => l.groupId === groupId);
export const getTransactions = (groupId: string) => db.transactions.filter((t: any) => t.groupId === groupId);

// Specific Transaction Filters
export const getContributions = (groupId: string) => db.transactions.filter((t: any) => t.groupId === groupId && t.type === TransactionType.SHARE_DEPOSIT);
export const getFines = (groupId: string) => db.transactions.filter((t: any) => t.groupId === groupId && t.type === TransactionType.FINE_PAYMENT);
export const getExpenses = (groupId: string) => db.transactions.filter((t: any) => t.groupId === groupId && t.type === TransactionType.EXPENSE);

export const getAttendance = (groupId: string) => db.attendance.filter((a: any) => a.groupId === groupId);
export const getCycle = (cycleId: string) => db.cycles.find((c: any) => c.id === cycleId);

// --- Write Operations ---

export const applyOverdueFees = (groupId: string, feeSettings: { amount: number, isPercentage: boolean }) => {
  const today = new Date().toISOString().split('T')[0];
  const group = db.groups.find((g: any) => g.id === groupId);
  if (!group) throw new Error("Group not found");

  const activeLoans = db.loans.filter((l: any) => l.groupId === groupId && (l.status === LoanStatus.ACTIVE || l.status === LoanStatus.DEFAULTED));
  let appliedCount = 0;

  activeLoans.forEach((loan: any) => {
    // Check if overdue
    if (loan.dueDate < today && loan.balance > 0) {
      const fee = feeSettings.isPercentage 
        ? Math.round(loan.balance * (feeSettings.amount / 100))
        : feeSettings.amount;

      if (fee > 0) {
        // Update Loan
        loan.balance += fee;
        loan.totalRepayable += fee;
        loan.status = LoanStatus.DEFAULTED; // Mark as defaulted/overdue
        
        // Record Transaction
        db.transactions.push({
          id: Math.random().toString(36),
          groupId,
          memberId: loan.memberId,
          cycleId: group.currentCycleId,
          type: TransactionType.LOAN_PENALTY,
          amount: fee,
          date: today,
          description: `Late fee applied: ${feeSettings.isPercentage ? feeSettings.amount + '%' : 'Fixed amount'}`
        });

        // Update Group Totals
        group.totalLoansOutstanding += fee;
        
        appliedCount++;
      }
    }
  });

  if (appliedCount > 0) {
    saveDatabase();
  }

  return { success: true, count: appliedCount };
};

export const submitMeetingData = (
  groupId: string, 
  date: string, 
  entries: { memberId: string, shares: number, present: boolean, loanRepayment: number, fines: number }[]
) => {
  const group = db.groups.find((g: any) => g.id === groupId);
  if (!group) throw new Error("Group not found");

  entries.forEach(entry => {
    // 1. Attendance
    db.attendance.push({
      id: Math.random().toString(36),
      groupId,
      date,
      memberId: entry.memberId,
      status: entry.present ? 'PRESENT' : 'ABSENT'
    });

    // 2. Shares
    if (entry.shares > 0) {
      const amount = entry.shares * group.shareValue;
      db.transactions.push({
        id: Math.random().toString(36),
        groupId,
        memberId: entry.memberId,
        cycleId: group.currentCycleId,
        type: TransactionType.SHARE_DEPOSIT,
        amount,
        shareCount: entry.shares,
        date
      });
      // Update local member cache (DB update)
      const mem = db.members.find((m: any) => m.id === entry.memberId);
      if (mem) {
        mem.totalShares = (mem.totalShares || 0) + entry.shares;
        group.totalSavings += amount;
      }
    }

    // 3. Fines
    if (entry.fines > 0) {
       db.transactions.push({
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

    // 4. Loan Repayment
    if (entry.loanRepayment > 0) {
       db.transactions.push({
        id: Math.random().toString(36),
        groupId,
        memberId: entry.memberId,
        cycleId: group.currentCycleId,
        type: TransactionType.LOAN_REPAYMENT,
        amount: entry.loanRepayment,
        date
      });
      
      const loan = db.loans.find((l: any) => l.memberId === entry.memberId && l.status === LoanStatus.ACTIVE);
      if (loan) {
        loan.balance -= entry.loanRepayment;
        group.totalLoansOutstanding -= entry.loanRepayment;
        if (loan.balance <= 0) {
          loan.balance = 0;
          loan.status = LoanStatus.CLEARED;
        }
      }
    }
  });
  
  saveDatabase();
  return { success: true };
};
