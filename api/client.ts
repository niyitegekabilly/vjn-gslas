
import * as service from '../backend/service';
import { seedDatabase } from '../backend/seeder';
import { resetDatabase } from '../backend/db';
import { GSLAGroup, Member, Loan, Transaction, Meeting, Attendance, Fine, FineCategory, Notification, ShareOutSnapshot, WorkflowScope, ApprovalWorkflow, SMSEventType, SystemSettings, UserRole } from '../types';

const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  // Users
  getUsers: async () => { await delay(); return service.getUsers(); },
  getUser: async (id: string) => { await delay(); return service.getUser(id); },
  createUser: async (user: any, creatorId: string) => { await delay(); return service.createUser(user, creatorId); },
  updateUser: async (id: string, updates: any) => { await delay(); return service.updateUser(id, updates); },
  importUsers: async (data: any[], creatorId: string) => { await delay(); return service.importUsers(data, creatorId); },
  
  // Auth
  login: async (email: string, pass: string) => { await delay(); return service.login(email, pass); },
  verifyTwoFactor: async (userId: string, code: string) => { await delay(); return service.verifyTwoFactor(userId, code); },
  requestPasswordReset: async (email: string) => { await delay(); return service.requestPasswordReset(email); },
  completePasswordReset: async (token: string, pass: string) => { await delay(); return service.completePasswordReset(token, pass); },
  
  // Groups
  getGroups: async () => { await delay(); return service.getGroups(); },
  getGroup: async (id: string) => { await delay(); return service.getGroup(id); },
  createGroup: async (group: any, creator: string) => { await delay(); return service.createGroup(group, creator); },
  updateGroup: async (id: string, updates: any, reason: string, editor: string) => { await delay(); return service.updateGroup(id, updates, reason, editor); },
  importGroups: async (data: any[]) => { await delay(); return service.importGroups(data); },

  // Members
  getMembers: async (groupId: string) => { await delay(); return service.getMembers(groupId); },
  addMember: async (groupId: string, member: any) => { await delay(); return service.addMember(groupId, member); },
  updateMember: async (id: string, updates: any) => { await delay(); return service.updateMember(id, updates); },
  deleteMember: async (id: string) => { await delay(); return service.deleteMember(id); },
  importMembers: async (groupId: string, data: any[]) => { await delay(); return service.importMembers(groupId, data); },

  // Loans
  getLoans: async (groupId: string) => { await delay(); return service.getLoans(groupId); },
  applyForLoan: async (groupId: string, loan: any) => { await delay(); return service.applyForLoan(groupId, loan); },
  updateLoanStatus: async (id: string, status: any, reason?: string) => { await delay(); return service.updateLoanStatus(id, status, reason); },
  repayLoan: async (id: string, amount: number) => { await delay(); return service.repayLoan(id, amount); },
  applyLateFees: async (groupId: string, config: any) => { await delay(); return service.applyLateFees(groupId, config); },
  importLoans: async (groupId: string, data: any[]) => { await delay(); return service.importLoans(groupId, data); },

  // Transactions
  getTransactions: async (groupId: string) => { await delay(); return service.getTransactions(groupId); },
  getContributions: async (groupId: string) => { await delay(); return service.getContributions(groupId); },
  addContribution: async (groupId: string, data: any) => { await delay(); return service.addContribution(groupId, data); },
  updateContribution: async (id: string, data: any, editor: string, reason: string) => { await delay(); return service.updateContribution(id, data, editor, reason); },
  voidContribution: async (id: string, reason: string, editor: string) => { await delay(); return service.voidContribution(id, reason, editor); },

  // Expenses
  getExpenses: async (groupId: string) => { await delay(); return service.getExpenses(groupId); },
  createExpense: async (groupId: string, data: any) => { await delay(); return service.createExpense(groupId, data); },
  updateExpense: async (id: string, data: any, editor: string, reason: string) => { await delay(); return service.updateExpense(id, data, editor, reason); },
  voidExpense: async (id: string, reason: string, editor: string) => { await delay(); return service.voidExpense(id, reason, editor); },
  getExpenseCategories: async (groupId: string) => { await delay(); return service.getExpenseCategories(groupId); },
  addExpenseCategory: async (groupId: string, name: string) => { await delay(); return service.addExpenseCategory(groupId, name); },
  getCashBalance: async (groupId: string) => { await delay(); return service.getCashBalance(groupId); },

  // Fines
  getFines: async (groupId: string) => { await delay(); return service.getFines(groupId); },
  createFine: async (groupId: string, data: any) => { await delay(); return service.createFine(groupId, data); },
  updateFine: async (id: string, data: any, editor: string, reason: string) => { await delay(); return service.updateFine(id, data, editor, reason); },
  voidFine: async (id: string, reason: string, editor: string) => { await delay(); return service.voidFine(id, reason, editor); },
  payFine: async (id: string, amount: number, method: string, recorder: string) => { await delay(); return service.payFine(id, amount, method, recorder); },
  getFineCategories: async (groupId: string) => { await delay(); return service.getFineCategories(groupId); },
  addFineCategory: async (groupId: string, name: string, amount: number) => { await delay(); return service.addFineCategory(groupId, name, amount); },

  // Attendance
  getMeetings: async (groupId: string) => { await delay(); return service.getMeetings(groupId); },
  createMeeting: async (groupId: string, data: any) => { await delay(); return service.createMeeting(groupId, data); },
  getAttendance: async (groupId: string) => { await delay(); return service.getAttendance(groupId); },
  saveAttendanceBatch: async (meetingId: string, records: any[], recorder: string) => { await delay(); return service.saveAttendanceBatch(meetingId, records, recorder); },
  updateAttendance: async (id: string, data: any, editor: string, reason: string) => { await delay(); return service.updateAttendance(id, data, editor, reason); },

  // Meeting Mode
  submitMeeting: async (groupId: string, date: string, entries: any[]) => { await delay(); return service.submitMeeting(groupId, date, entries); },

  // Cycles
  getCycle: async (id: string) => { await delay(); return service.getCycle(id); },
  closeCycle: async (id: string, snapshot: ShareOutSnapshot) => { await delay(); return service.closeCycle(id, snapshot); },

  // Notifications
  getNotifications: async () => { await delay(); return service.getNotifications(); },
  markNotificationRead: async (id: string) => { await delay(); return service.markNotificationRead(id); },
  markAllNotificationsRead: async () => { await delay(); return service.markAllNotificationsRead(); },
  createNotification: async (notif: any) => { await delay(); return service.createNotification(notif); },

  // Communication
  sendEmail: async (to: string[], subject: string, html: string) => { await delay(); return service.sendEmail(to, subject, html); },
  sendSMS: async (phone: string, msg: string) => { await delay(); return service.sendSMS(phone, msg); },
  checkReminders: async () => { await delay(); return service.checkReminders(); },

  // Settings
  getSystemSettings: async () => { await delay(); return service.getSystemSettings(); },
  updateSystemSettings: async (settings: Partial<SystemSettings>, userId: string) => { await delay(); return service.updateSystemSettings(settings, userId); },
  forceLogoutAllUsers: async (userId: string) => { await delay(); return service.forceLogoutAllUsers(userId); },
  getFullDatabaseBackup: async () => { await delay(); return service.getFullDatabaseBackup(); },
  importDatabase: async (json: string) => { await delay(); return service.importDatabase(json); },

  // Workflows & SMS Config
  getWorkflows: async (groupId: string) => { await delay(); return service.getWorkflows(groupId); },
  saveWorkflow: async (workflow: any) => { await delay(); return service.saveWorkflow(workflow); },
  getSMSTemplates: async () => { await delay(); return service.getSMSTemplates(); },
  updateSMSTemplate: async (type: string, text: string, enabled: boolean) => { await delay(); return service.updateSMSTemplate(type, text, enabled); },
  getSMSLogs: async () => { await delay(); return service.getSMSLogs(); },
  getSMSConfig: async () => { await delay(); return service.getSMSConfig(); },
  toggleSMSLiveMode: async (enabled: boolean) => { await delay(); return service.toggleSMSLiveMode(enabled); },

  // Reports
  generateReport: async (groupId: string, type: string, filters: any) => { await delay(); return service.generateReport(groupId, type, filters); },

  // Admin Tools
  seedSuperAdmin: async () => { return service.seedSuperAdmin(); },
  restoreDefaultAdmin: async () => { return service.restoreDefaultAdmin(); },
  seedDatabase: async () => { return seedDatabase(); },
};
