import * as service from '../backend/service';
import { GSLAGroup, Member, Loan, Transaction, Attendance, Cycle } from '../types';

// Simulate network latency (300-600ms)
const delay = (ms: number = 400) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  getGroups: async (): Promise<GSLAGroup[]> => {
    await delay();
    return service.getGroups();
  },

  getGroup: async (id: string): Promise<GSLAGroup | undefined> => {
    await delay();
    return service.getGroup(id);
  },

  getMembers: async (groupId: string): Promise<Member[]> => {
    await delay();
    return service.getMembers(groupId);
  },

  getLoans: async (groupId: string): Promise<Loan[]> => {
    await delay();
    return service.getLoans(groupId);
  },

  getTransactions: async (groupId: string): Promise<Transaction[]> => {
    await delay();
    return service.getTransactions(groupId);
  },

  getContributions: async (groupId: string): Promise<Transaction[]> => {
    await delay();
    return service.getContributions(groupId);
  },

  getFines: async (groupId: string): Promise<Transaction[]> => {
    await delay();
    return service.getFines(groupId);
  },

  getExpenses: async (groupId: string): Promise<Transaction[]> => {
    await delay();
    return service.getExpenses(groupId);
  },

  getAttendance: async (groupId: string): Promise<Attendance[]> => {
    await delay();
    return service.getAttendance(groupId);
  },

  getCycle: async (cycleId: string): Promise<Cycle | undefined> => {
    await delay();
    return service.getCycle(cycleId);
  },

  applyLateFees: async (groupId: string, settings: { amount: number, isPercentage: boolean }) => {
    await delay();
    return service.applyOverdueFees(groupId, settings);
  },

  submitMeeting: async (
    groupId: string, 
    date: string, 
    entries: any[]
  ): Promise<{ success: boolean }> => {
    await delay(800); // Slower write
    return service.submitMeetingData(groupId, date, entries);
  }
};