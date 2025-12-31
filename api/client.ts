
import * as service from '../backend/service';
import { seedDatabase } from '../backend/seeder';
import { resetDatabase } from '../backend/db';
import { GSLAGroup, Member, Loan, Transaction, Meeting, Attendance, Fine, FineCategory, User, Notification, UserRole } from '../types';

const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

// --- Security Middleware ---
// Enforces that GROUP_LEADER users can only access the group they are assigned to.
const checkAccess = (groupId?: string) => {
  const session = localStorage.getItem('vjn_session');
  if (!session) return;
  
  try {
    const user = JSON.parse(session) as User;
    
    // Rule: GROUP_LEADER can only access their managed group
    if (user.role === UserRole.GROUP_LEADER) {
      if (!groupId) return; // Some calls might not have groupId, skip check (or handle differently)
      
      if (user.managedGroupId !== groupId) {
         console.error(`Security Block: User ${user.id} (Role: ${user.role}) attempted to access restricted Group ${groupId}`);
         throw new Error("403 Forbidden: You do not have permission to access this group's data.");
      }
    }
  } catch (e: any) {
    if (e.message.includes('403')) throw e;
    // Silently ignore parsing errors
  }
};

export const api = {
  // Users
  getUsers: async () => { await delay(); return service.getUsers(); },
  createUser: async (user: Partial<User>, creatorId: string) => { await delay(); return service.createUser(user, creatorId); },
  updateUser: async (id: string, data: Partial<User>) => { await delay(); return service.updateUser(id, data); },
  login: async (email: string, pass: string) => { await delay(); return service.login(email, pass); },
  verifyTwoFactor: async (userId: string, code: string) => { await delay(); return service.verifyTwoFactor(userId, code); },
  seedSuperAdmin: async () => { return service.seedSuperAdmin(); },
  restoreDefaultAdmin: async () => { return service.restoreDefaultAdmin(); },
  seedDatabase: async () => { return seedDatabase(); },

  // Groups
  getGroups: async () => { 
    await delay(); 
    const groups = await service.getGroups();
    
    // API-Level Filtering: Never return groups outside of scope
    const session = localStorage.getItem('vjn_session');
    if (session) {
        try {
            const user = JSON.parse(session) as User;
            if (user.role === UserRole.GROUP_LEADER && user.managedGroupId) {
                return groups.filter((g: any) => g.id === user.managedGroupId);
            }
        } catch (e) { console.error(e); }
    }
    return groups;
  },
  getGroup: async (id: string) => { 
    checkAccess(id); 
    await delay(); 
    return service.getGroup(id); 
  },
  createGroup: async (data: any, creatorId: string) => { await delay(); return service.createGroup(data, creatorId); },
  updateGroup: async (id: string, data: any, reason: string, editorId: string) => { 
    checkAccess(id);
    await delay(); 
    return service.updateGroup(id, data, reason, editorId); 
  },

  // Members
  getMembers: async (groupId: string) => { checkAccess(groupId); await delay(); return service.getMembers(groupId); },
  addMember: async (groupId: string, data: any) => { checkAccess(groupId); await delay(); return service.addMember(groupId, data); },
  updateMember: async (id: string, data: any) => { await delay(); return service.updateMember(id, data); },
  deleteMember: async (id: string) => { await delay(); return service.deleteMember(id); },
  importMembers: async (groupId: string, members: any[]) => { checkAccess(groupId); await delay(1000); return service.importMembers(groupId, members); },

  // Loans
  getLoans: async (groupId: string) => { checkAccess(groupId); await delay(); return service.getLoans(groupId); },
  applyForLoan: async (groupId: string, data: any) => { checkAccess(groupId); await delay(); return service.applyForLoan(groupId, data); },
  updateLoanStatus: async (loanId: string, status: any) => { await delay(); return service.updateLoanStatus(loanId, status); },
  repayLoan: async (loanId: string, amount: number) => { await delay(); return service.repayLoan(loanId, amount); },
  applyLateFees: async (groupId: string, config: any) => { checkAccess(groupId); await delay(); return service.applyLateFees(groupId, config); },

  // Transactions
  getTransactions: async (groupId: string) => { checkAccess(groupId); await delay(); return service.getTransactions(groupId); },
  getContributions: async (groupId: string) => { checkAccess(groupId); await delay(); return service.getContributions(groupId); },
  addContribution: async (groupId: string, data: any) => { checkAccess(groupId); await delay(); return service.addContribution(groupId, data); },
  updateContribution: async (id: string, data: any, userId: string, reason: string) => { await delay(); return service.updateContribution(id, data, userId, reason); },
  voidContribution: async (id: string, reason: string, userId: string) => { await delay(); return service.voidContribution(id, reason, userId); },
  submitMeeting: async (groupId: string, date: string, entries: any[]) => { checkAccess(groupId); await delay(1500); return service.submitMeeting(groupId, date, entries); },

  // Expenses
  getExpenses: async (groupId: string) => { checkAccess(groupId); await delay(); return service.getExpenses(groupId); },
  createExpense: async (groupId: string, data: any) => { checkAccess(groupId); await delay(); return service.createExpense(groupId, data); },
  updateExpense: async (id: string, data: any, userId: string, reason: string) => { await delay(); return service.updateExpense(id, data, userId, reason); },
  voidExpense: async (id: string, reason: string, userId: string) => { await delay(); return service.voidExpense(id, reason, userId); },
  getExpenseCategories: async (groupId: string) => { checkAccess(groupId); await delay(); return service.getExpenseCategories(groupId); },
  addExpenseCategory: async (groupId: string, name: string) => { checkAccess(groupId); await delay(); return service.addExpenseCategory(groupId, name); },
  getCashBalance: async (groupId: string) => { checkAccess(groupId); await delay(); return service.getCashBalance(groupId); },

  // Fines
  getFines: async (groupId: string) => { checkAccess(groupId); await delay(); return service.getFines(groupId); },
  getFineCategories: async (groupId: string) => { checkAccess(groupId); await delay(); return service.getFineCategories(groupId); },
  createFine: async (groupId: string, data: any) => { checkAccess(groupId); await delay(); return service.createFine(groupId, data); },
  payFine: async (fineId: string, amount: number, method: string, userId: string) => { await delay(); return service.payFine(fineId, amount, method, userId); },
  updateFine: async (id: string, data: any, userId: string, reason: string) => { await delay(); return service.updateFine(id, data, userId, reason); },
  voidFine: async (id: string, reason: string, userId: string) => { await delay(); return service.voidFine(id, reason, userId); },
  addFineCategory: async (groupId: string, name: string, amount: number) => { checkAccess(groupId); await delay(); return service.addFineCategory(groupId, name, amount); },

  // Attendance
  getMeetings: async (groupId: string) => { checkAccess(groupId); await delay(); return service.getMeetings(groupId); },
  createMeeting: async (groupId: string, data: any) => { checkAccess(groupId); await delay(); return service.createMeeting(groupId, data); },
  getAttendance: async (groupId: string) => { checkAccess(groupId); await delay(); return service.getAttendance(groupId); },
  saveAttendanceBatch: async (meetingId: string, records: any[], userId: string) => { await delay(); return service.saveAttendanceBatch(meetingId, records, userId); },
  updateAttendance: async (id: string, data: any, userId: string, reason: string) => { await delay(); return service.updateAttendance(id, data, userId, reason); },

  // System
  getNotifications: async () => { await delay(); return service.getNotifications(); },
  createNotification: async (n: Partial<Notification>) => { await delay(); return service.createNotification(n); },
  markNotificationRead: async (id: string) => { await delay(); return service.markNotificationRead(id); },
  markAllNotificationsRead: async () => { await delay(); return service.markAllNotificationsRead(); },
  getCycle: async (id: string) => { await delay(); return service.getCycle(id); },
  generateReport: async (groupId: string, type: string, filters: any) => { checkAccess(groupId); await delay(1000); return service.generateReport(groupId, type, filters); },
  
  // Communication
  sendSMS: async (phoneNumber: string, message: string) => { await delay(800); return service.sendSMS(phoneNumber, message); },

  // Backup/Restore
  getFullDatabaseBackup: async () => { return service.getFullDatabaseBackup(); },
  importDatabase: async (json: string) => { return service.importDatabase(json); },
  wipeRemoteDatabase: async () => { return service.wipeRemoteDatabase(); },
  resetDatabase: async () => { resetDatabase(); }
};
