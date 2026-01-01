
<<<<<<< HEAD
=======
import { supabase } from './supabaseClient';
>>>>>>> 7c17f3ba72aad7656a6b64c3bf0bfbc90a688a2a
import { 
  GSLAGroup, Member, Loan, Transaction, 
  UserRole, MemberStatus, LoanStatus, TransactionType, Attendance,
  GroupStatus, Fine, FineCategory, FineStatus, Meeting, AttendanceStatus, Notification,
<<<<<<< HEAD
  User, UserStatus, AuditRecord, Cycle, ExpenseCategory, ShareOutSnapshot, MeetingFrequency,
  ApprovalWorkflow, ApprovalRequest, WorkflowScope, ApprovalStatus, SMSTemplate, SMSEventType, SMSLog, SMSConfig,
  SystemSettings
} from '../types';
import { supabase } from './supabaseClient';
import { SEED_DATA } from './db';

// Mock implementation helper
const handleResponse = async (promise: Promise<any>) => {
  const { data, error } = await promise;
  if (error) {
    console.error("Supabase Error:", error);
    // Normalize error to standard Error object to prevent [object Object] alerts
    const errorMessage = error.message || error.details || error.hint || JSON.stringify(error);
    throw new Error(errorMessage);
  }
  return data;
};

// --- CENTRAL SMS SERVICE ---

const normalizePhoneNumber = (phone: string): string | null => {
  // Regex for Rwanda format (allows 07... or 2507...)
  const clean = phone.replace(/\D/g, ''); // Remove non-digits
  if (/^2507[2389]\d{7}$/.test(clean)) return clean;
  if (/^07[2389]\d{7}$/.test(clean)) return '250' + clean.substring(1);
  if (/^7[2389]\d{7}$/.test(clean)) return '250' + clean;
  return null;
};

export const triggerSMSEvent = async (
  eventType: SMSEventType,
  variables: Record<string, any>,
  recipientId: string, // Member ID
  groupId: string,
  triggerUserId: string
) => {
  try {
    // 1. Fetch Config - Fallback to Seed if DB fails
    let smsConfig = SEED_DATA.smsConfig[0];
    try {
        const { data: config, error } = await supabase.from('sms_config').select('*').single();
        if (!error && config) smsConfig = config;
    } catch (e) { /* ignore, use default */ }

    // 2. Check Cap
    if (smsConfig.currentUsage >= smsConfig.monthlyCap) {
        console.warn('SMS Monthly Cap Reached. Skipping.');
        await logSMS(recipientId, '', 'FAILED', groupId, triggerUserId, 'Monthly Cap Reached');
        return;
    }

    // 3. Fetch Template - Fallback to Seed if DB fails
    let template = SEED_DATA.smsTemplates.find(t => t.eventType === eventType);
    try {
        const { data: tmpl, error } = await supabase.from('sms_templates').select('*').eq('eventType', eventType).single();
        if (!error && tmpl) template = tmpl;
    } catch (e) { /* ignore */ }

    if (!template || !template.isEnabled) {
        // console.log(`SMS Template for ${eventType} disabled or missing.`);
        return;
    }

    // 4. Fetch Recipient
    const { data: member } = await supabase.from('members').select('phone, fullName').eq('id', recipientId).single();
    if (!member || !member.phone) {
        await logSMS('Unknown', template.template, 'FAILED', groupId, triggerUserId, 'Recipient has no phone');
        return;
    }

    const recipientPhone = normalizePhoneNumber(member.phone);
    if (!recipientPhone) {
        await logSMS(member.phone, template.template, 'FAILED', groupId, triggerUserId, 'Invalid Phone Format');
        return;
    }

    // 5. Compile Message
    let message = template.template;
    // Default variables
    const vars: Record<string, any> = { 
        ...variables, 
        member_name: member.fullName, 
        date: new Date().toLocaleDateString()
    };
    
    // Group Name Lookup if not provided
    if (!vars.group_name && groupId) {
        const { data: g } = await supabase.from('groups').select('name').eq('id', groupId).single();
        if (g) vars.group_name = g.name;
    }

    Object.keys(vars).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        message = message.replace(regex, vars[key]);
    });

    // 6. Send
    let status: 'SENT' | 'FAILED' = 'SENT';
    let providerResponse = null;
    let errorMsg = undefined;

    if (smsConfig.isLiveMode) {
        try {
            // Call Edge Function
            const { data: res, error } = await supabase.functions.invoke('send-sms-mtn', {
                body: { recipient: recipientPhone, message }
            });
            
            if (error) throw error;
            providerResponse = res;
            
            // Increment Usage
            await supabase.from('sms_config').update({ currentUsage: smsConfig.currentUsage + 1 }).neq('id', '');
        } catch (e: any) {
            status = 'FAILED';
            errorMsg = e.message;
            console.error("SMS Send Failed:", e);
        }
    } else {
        // Sandbox Mode
        console.log(`[SMS SANDBOX] To: ${recipientPhone} | Msg: ${message}`);
        // Simulate Usage - Try update, ignore if fails (missing table)
        try {
            await supabase.from('sms_config').update({ currentUsage: smsConfig.currentUsage + 1 }).neq('id', '');
        } catch (e) { /* ignore */ }
    }

    // 7. Log
    await logSMS(recipientPhone, message, status, groupId, triggerUserId, errorMsg, providerResponse);

  } catch (err) {
    console.error("Error in triggerSMSEvent:", err);
  }
};

const logSMS = async (
    phone: string, 
    msg: string, 
    status: 'SENT'|'FAILED'|'PENDING', 
    groupId: string, 
    userId: string, 
    error?: string, 
    response?: any
) => {
    try {
        await supabase.from('sms_logs').insert({
            id: `sms_${Date.now()}_${Math.random().toString(36).substr(2,5)}`,
            recipient: phone,
            message: msg,
            status,
            sentAt: new Date().toISOString(),
            triggerBy: userId,
            groupId,
            error,
            providerResponse: response
        });
    } catch (e) {
        // Suppress logging error if table doesn't exist
    }
};

// --- Users ---
export const getUsers = async (): Promise<User[]> => {
  return handleResponse(supabase.from('users').select('*'));
};

export const getUser = async (id: string): Promise<User | null> => {
  const { data } = await supabase.from('users').select('*').eq('id', id).single();
  return data;
};

export const createUser = async (user: Partial<User>, creatorId: string): Promise<User> => {
  const newUser = {
    ...user,
    id: `u_${Date.now()}`,
    createdAt: new Date().toISOString(),
    createdBy: creatorId,
    status: UserStatus.ACTIVE,
    failedLoginAttempts: 0,
    twoFactorEnabled: false
  };
  const created = await handleResponse(supabase.from('users').insert(newUser).select().single());
  
  // Trigger SMS if phone exists
  if (created.phone) {
      // We don't have a direct member ID link usually for admins, but if user has phone, treat as recipient
      // For simplicity in this mock, we might skip or need a dummy member ID logic.
      // But typically we trigger based on MEMBER events.
  }
  return created;
};

export const updateUser = async (id: string, updates: Partial<User>): Promise<User> => {
  return handleResponse(supabase.from('users').update(updates).eq('id', id).select().single());
};

export const importUsers = async (users: any[], creatorId: string) => {
  const newUsers = users.map((u, i) => ({
    id: `u_imp_${Date.now()}_${i}`,
    fullName: u.FullName,
    email: u.Email,
    phone: u.Phone,
    role: u.Role || UserRole.MEMBER_USER,
    status: UserStatus.ACTIVE,
    createdAt: new Date().toISOString(),
    createdBy: creatorId,
    passwordHash: 'ChangeMe123!'
  }));
  await handleResponse(supabase.from('users').insert(newUsers));
  return { added: newUsers.length };
};

// --- Auth ---
export const login = async (email: string, pass: string) => {
  const { data: user } = await supabase.from('users').select('*').eq('email', email).single();
  if (!user) throw new Error("User not found");
  if (user.passwordHash !== pass) throw new Error("Invalid password");
  
  if (user.twoFactorEnabled || user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN) {
    return { status: '2FA_REQUIRED', userId: user.id, email: user.email };
  }
  
  await supabase.from('users').update({ lastLogin: new Date().toISOString() }).eq('id', user.id);
  return { status: 'SUCCESS', user };
};

export const verifyTwoFactor = async (userId: string, code: string) => {
  if (code === '123456') { // Mock check
    const { data: user } = await supabase.from('users').select('*').eq('id', userId).single();
    await supabase.from('users').update({ lastLogin: new Date().toISOString() }).eq('id', userId);
    return { status: 'SUCCESS', user };
  }
  throw new Error("Invalid OTP code");
};

export const requestPasswordReset = async (email: string) => {
  return { success: true }; // Mock
};

export const completePasswordReset = async (token: string, pass: string) => {
  return { success: true }; // Mock
};

// --- System Settings ---
export const getSystemSettings = async (): Promise<SystemSettings> => {
    try {
        const { data, error } = await supabase.from('system_settings').select('*').eq('id', 'default').single();
        
        // Handle Missing Table or No Data by returning default structure
        if (error) {
            console.warn("System Settings table access failed (using default):", error.message);
             return {
                id: 'default',
                sessionTimeoutMinutes: 60,
                passwordMinLength: 8,
                passwordRequireSpecial: false,
                passwordRequireNumber: true,
                passwordRequireUppercase: false,
                enforce2FA: false,
                updatedAt: new Date().toISOString(),
                updatedBy: 'system'
            };
        }
        return data;
    } catch (e) {
        return {
            id: 'default',
            sessionTimeoutMinutes: 60,
            passwordMinLength: 8,
            passwordRequireSpecial: false,
            passwordRequireNumber: true,
            passwordRequireUppercase: false,
            enforce2FA: false,
            updatedAt: new Date().toISOString(),
            updatedBy: 'system'
        };
    }
};

export const updateSystemSettings = async (settings: Partial<SystemSettings>, userId: string) => {
    const payload = {
        ...settings,
        updatedAt: new Date().toISOString(),
        updatedBy: userId
    };
    return handleResponse(supabase.from('system_settings').upsert({ id: 'default', ...payload }).select().single());
};

export const forceLogoutAllUsers = async (userId: string) => {
    const payload = {
        lastForceLogoutAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updatedBy: userId
    };
    return handleResponse(supabase.from('system_settings').upsert({ id: 'default', ...payload }).select().single());
};

// --- Groups ---
export const getGroups = async (): Promise<GSLAGroup[]> => {
  return handleResponse(supabase.from('groups').select('*'));
};

export const getGroup = async (id: string): Promise<GSLAGroup | null> => {
  const { data } = await supabase.from('groups').select('*').eq('id', id).single();
  return data;
};

export const createGroup = async (group: Partial<GSLAGroup>, creatorName: string): Promise<GSLAGroup> => {
  const newGroup = {
    ...group,
    id: `g_${Date.now()}`,
    createdAt: new Date().toISOString(),
    totalSavings: 0,
    totalLoansOutstanding: 0,
    totalSolidarity: 0,
    auditHistory: [{ id: `aud_${Date.now()}`, date: new Date().toISOString(), editorId: creatorName, reason: 'Initial Creation', changes: [] }]
  };
  return handleResponse(supabase.from('groups').insert(newGroup).select().single());
};

export const updateGroup = async (id: string, updates: Partial<GSLAGroup>, reason: string, editorName: string): Promise<GSLAGroup> => {
  const { data: current } = await supabase.from('groups').select('*').eq('id', id).single();
  
  const changes = Object.keys(updates).map(key => ({
    field: key,
    oldValue: current[key as keyof GSLAGroup],
    newValue: updates[key as keyof GSLAGroup]
  }));

  const auditEntry: AuditRecord = {
    id: `aud_${Date.now()}`,
    date: new Date().toISOString(),
    editorId: editorName,
    reason,
    changes
  };

  const currentHistory = current.auditHistory || [];
  
  return handleResponse(supabase.from('groups').update({
    ...updates,
    auditHistory: [...currentHistory, auditEntry]
  }).eq('id', id).select().single());
};

export const importGroups = async (groupsData: any[]) => {
  const newGroups = groupsData.map((g, i) => ({
    id: `g_imp_${Date.now()}_${i}`,
    name: g.Name,
    district: g.District,
    sector: g.Sector || '',
    branchId: 'b1', // Default
    location: `${g.Sector || ''}, ${g.District}`,
    status: GroupStatus.ACTIVE,
    createdAt: new Date().toISOString(),
    meetingFrequency: MeetingFrequency.WEEKLY,
    shareValue: parseInt(g.ShareValue) || 100,
    minShares: 1,
    maxShares: 5,
    maxLoanMultiplier: 3
  }));
  await handleResponse(supabase.from('groups').insert(newGroups));
  return { added: newGroups.length };
};

// --- Members ---
export const getMembers = async (groupId: string): Promise<Member[]> => {
  return handleResponse(supabase.from('members').select('*').eq('groupId', groupId));
};

export const addMember = async (groupId: string, member: Partial<Member>) => {
  const newMember = {
    ...member,
    id: `m_${Date.now()}`,
    groupId,
    joinDate: new Date().toISOString().split('T')[0],
    totalShares: 0,
    totalLoans: 0
  };
  return handleResponse(supabase.from('members').insert(newMember));
};

export const updateMember = async (id: string, updates: Partial<Member>) => {
  return handleResponse(supabase.from('members').update(updates).eq('id', id));
};

export const deleteMember = async (id: string) => {
  // Check for history
  const { data: txs } = await supabase.from('transactions').select('id').eq('memberId', id);
  if (txs && txs.length > 0) {
    await supabase.from('members').update({ status: MemberStatus.EXITED }).eq('id', id);
    return { mode: 'archived' };
  }
  await supabase.from('members').delete().eq('id', id);
  return { mode: 'deleted' };
};

export const importMembers = async (groupId: string, membersData: any[]) => {
  const newMembers = membersData.map((m, i) => ({
    id: `m_imp_${Date.now()}_${i}`,
    groupId,
    fullName: m.FullName,
    nationalId: m.NationalID,
    phone: m.Phone,
    role: m.Role || UserRole.MEMBER_USER,
    status: MemberStatus.ACTIVE,
    joinDate: m.JoinDate || new Date().toISOString().split('T')[0],
    totalShares: 0,
    totalLoans: 0
  }));
  await handleResponse(supabase.from('members').insert(newMembers));
  return { added: newMembers.length };
};

// --- Loans ---
export const getLoans = async (groupId: string): Promise<Loan[]> => {
  return handleResponse(supabase.from('loans').select('*').eq('groupId', groupId));
};

export const applyForLoan = async (groupId: string, loan: any) => {
  const { data: member } = await supabase.from('members').select('*').eq('id', loan.memberId).single();
  const principal = loan.amount;
  const interest = principal * (loan.interestRate / 100) * loan.duration;
  
  const newLoan = {
    id: `l_${Date.now()}`,
    groupId,
    memberId: loan.memberId,
    principal,
    interestRate: loan.interestRate,
    totalRepayable: principal + interest,
    balance: principal + interest,
    status: LoanStatus.PENDING,
    startDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + loan.duration * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    purpose: loan.purpose,
    memberRole: member.role
  };
  return handleResponse(supabase.from('loans').insert(newLoan));
};

export const updateLoanStatus = async (id: string, status: LoanStatus, reason?: string) => {
  const { data: loan } = await supabase.from('loans').select('*').eq('id', id).single();
  
  if (status === LoanStatus.ACTIVE) {
    // 1. Check Cash Balance
    const balance = await getCashBalance(loan.groupId);
    if (balance < loan.principal) {
      throw new Error(`Insufficient group funds. Available: ${balance.toLocaleString()}`);
    }

    // 2. Create Disbursement Transaction
    await supabase.from('transactions').insert({
      id: `t_disb_${Date.now()}`,
      groupId: loan.groupId,
      memberId: loan.memberId,
      cycleId: 'current',
      type: TransactionType.LOAN_DISBURSEMENT,
      amount: loan.principal,
      date: new Date().toISOString().split('T')[0],
      description: `Loan Disbursement: ${loan.purpose}`
    });

    // 3. Create Notification
    await createNotification({
      title: 'Loan Approved',
      message: `Your loan of ${loan.principal.toLocaleString()} RWF has been approved and disbursed.`,
      type: 'SUCCESS'
    });

    // 4. Trigger SMS
    await triggerSMSEvent(
        SMSEventType.LOAN_APPROVED, 
        { amount: loan.principal.toLocaleString(), due_date: loan.dueDate }, 
        loan.memberId, 
        loan.groupId, 
        'system'
    );

  } else if (status === LoanStatus.REJECTED) {
    // Rejection Notification
    await createNotification({
      title: 'Loan Rejected',
      message: `Your loan application was rejected. Reason: ${reason || 'Not specified'}.`,
      type: 'WARNING'
    });
  }

  return handleResponse(supabase.from('loans').update({ status }).eq('id', id));
};

export const repayLoan = async (id: string, amount: number) => {
  const { data: loan } = await supabase.from('loans').select('*').eq('id', id).single();
  const newBalance = Math.max(0, loan.balance - amount);
  const status = newBalance === 0 ? LoanStatus.CLEARED : loan.status;
  
  await handleResponse(supabase.from('loans').update({ balance: newBalance, status }).eq('id', id));
  
  // Record Transaction
  await handleResponse(supabase.from('transactions').insert({
    id: `t_repay_${Date.now()}`,
    groupId: loan.groupId,
    memberId: loan.memberId,
    cycleId: 'current', // Simplified
    type: TransactionType.LOAN_REPAYMENT,
    amount,
    date: new Date().toISOString().split('T')[0]
  }));

  // Trigger SMS
  await triggerSMSEvent(
    SMSEventType.LOAN_REPAYMENT,
    { amount: amount.toLocaleString(), balance: newBalance.toLocaleString() },
    loan.memberId,
    loan.groupId,
    'system'
  );
};

export const applyLateFees = async (groupId: string, config: { amount: number, isPercentage: boolean }) => {
  const { data: loans } = await supabase.from('loans').select('*').eq('groupId', groupId).eq('status', LoanStatus.ACTIVE);
  const today = new Date().toISOString().split('T')[0];
  let count = 0;
  
  for (const loan of (loans || [])) {
    if (loan.dueDate < today) {
      const fee = config.isPercentage ? (loan.balance * config.amount / 100) : config.amount;
      await supabase.from('loans').update({ 
        balance: loan.balance + fee,
        status: LoanStatus.DEFAULTED 
      }).eq('id', loan.id);
      count++;
    }
  }
  return { count };
};

export const importLoans = async (groupId: string, loansData: any[]) => {
  // Simplified import logic
  const errors: any[] = [];
  const added: any[] = [];
  
  for (const l of loansData) {
    const { data: member } = await supabase.from('members').select('id').eq('nationalId', l.NationalID).single();
    if (!member) {
      errors.push(`Member not found for ID ${l.NationalID}`);
      continue;
    }
    
    const principal = parseInt(l.Amount);
    const rate = parseFloat(l.InterestRate);
    const duration = parseInt(l.DurationMonths);
    const interest = principal * (rate / 100) * duration;
    
    const newLoan = {
      id: `l_imp_${Date.now()}_${added.length}`,
      groupId,
      memberId: member.id,
      principal,
      interestRate: rate,
      totalRepayable: principal + interest,
      balance: principal + interest, // Assuming import is new loan
      status: LoanStatus.ACTIVE,
      startDate: l.StartDate || new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + duration * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      purpose: l.Purpose || 'Imported'
    };
    
    await supabase.from('loans').insert(newLoan);
    added.push(newLoan);
  }
  return { added: added.length, errors };
};

// --- Transactions & Contributions ---
export const getTransactions = async (groupId: string): Promise<Transaction[]> => {
  return handleResponse(supabase.from('transactions').select('*').eq('groupId', groupId));
};

export const getContributions = async (groupId: string) => {
  return handleResponse(supabase.from('transactions').select('*').eq('groupId', groupId).eq('type', TransactionType.SHARE_DEPOSIT));
};

export const addContribution = async (groupId: string, data: any) => {
  const { data: group } = await supabase.from('groups').select('shareValue, currentCycleId').eq('id', groupId).single();
  const amount = data.shareCount * group.shareValue;
  
  const tx = {
    id: `t_share_${Date.now()}`,
    groupId,
    memberId: data.memberId,
    cycleId: group.currentCycleId,
    type: TransactionType.SHARE_DEPOSIT,
    amount,
    shareCount: data.shareCount,
    solidarityAmount: data.solidarityAmount,
    date: data.date,
    notes: data.notes,
    recordedBy: data.recordedBy
  };
  
  await handleResponse(supabase.from('transactions').insert(tx));
  
  // Update member totals
  const { data: member } = await supabase.from('members').select('totalShares').eq('id', data.memberId).single();
  await supabase.from('members').update({ totalShares: member.totalShares + data.shareCount }).eq('id', data.memberId);

  // Trigger SMS
  await triggerSMSEvent(
    SMSEventType.CONTRIBUTION_RECEIVED,
    { 
        amount: amount.toLocaleString(), 
        total_savings: ((member.totalShares + data.shareCount) * group.shareValue).toLocaleString() 
    },
    data.memberId,
    groupId,
    data.recordedBy || 'system'
  );
};

export const updateContribution = async (id: string, data: any, editorId: string, reason: string) => {
  // Fetch old to audit
  const { data: old } = await supabase.from('transactions').select('*').eq('id', id).single();
  
  const changes = [];
  if (old.shareCount !== data.shareCount) changes.push({ field: 'shareCount', oldValue: old.shareCount, newValue: data.shareCount });
  
  const audit: AuditRecord = {
    id: `aud_tx_${Date.now()}`,
    date: new Date().toISOString(),
    editorId,
    reason,
    changes
  };
  
  // Recalculate amount if shares changed
  let amount = old.amount;
  if (old.shareCount !== data.shareCount) {
     const { data: group } = await supabase.from('groups').select('shareValue').eq('id', old.groupId).single();
     amount = data.shareCount * group.shareValue;
  }

  return handleResponse(supabase.from('transactions').update({
    shareCount: data.shareCount,
    solidarityAmount: data.solidarityAmount,
    amount,
    notes: data.notes,
    editHistory: [...(old.editHistory || []), audit]
  }).eq('id', id));
};

export const voidContribution = async (id: string, reason: string, editorId: string) => {
  const { data: old } = await supabase.from('transactions').select('*').eq('id', id).single();
  const audit: AuditRecord = {
    id: `aud_tx_void_${Date.now()}`,
    date: new Date().toISOString(),
    editorId,
    reason: `VOID: ${reason}`,
    changes: [{ field: 'isVoid', oldValue: false, newValue: true }]
  };
  
  // Revert member shares
  const { data: member } = await supabase.from('members').select('totalShares').eq('id', old.memberId).single();
  await supabase.from('members').update({ totalShares: Math.max(0, member.totalShares - old.shareCount) }).eq('id', old.memberId);

  return handleResponse(supabase.from('transactions').update({
    isVoid: true,
    voidReason: reason,
    editHistory: [...(old.editHistory || []), audit]
  }).eq('id', id));
};

// --- Expenses ---
export const getExpenses = async (groupId: string): Promise<Transaction[]> => {
  return handleResponse(supabase.from('transactions').select('*').eq('groupId', groupId).eq('type', TransactionType.EXPENSE));
};

export const createExpense = async (groupId: string, data: any) => {
  const tx = {
    id: `t_exp_${Date.now()}`,
    groupId,
    cycleId: 'current',
    type: TransactionType.EXPENSE,
    amount: data.amount,
    date: data.date,
    description: data.description,
    categoryId: data.categoryId,
    approvedBy: data.approvedBy,
    recordedBy: data.recordedBy
  };
  return handleResponse(supabase.from('transactions').insert(tx));
};

export const updateExpense = async (id: string, data: any, editorId: string, reason: string) => {
  // Similar audit logic as contribution
  return handleResponse(supabase.from('transactions').update({ ...data }).eq('id', id));
};

export const voidExpense = async (id: string, reason: string, editorId: string) => {
  return handleResponse(supabase.from('transactions').update({ isVoid: true, voidReason: reason }).eq('id', id));
};

export const getExpenseCategories = async (groupId: string): Promise<ExpenseCategory[]> => {
  return handleResponse(supabase.from('expense_categories').select('*').eq('groupId', groupId));
};

export const addExpenseCategory = async (groupId: string, name: string) => {
  return handleResponse(supabase.from('expense_categories').insert({
    id: `ec_${Date.now()}`,
    groupId,
    name,
    active: true
  }));
};

export const getCashBalance = async (groupId: string) => {
  const { data: txs } = await supabase.from('transactions').select('*').eq('groupId', groupId).eq('isVoid', false);
  if (!txs) return 0;
  
  let balance = 0;
  txs.forEach((t: Transaction) => {
    if ([TransactionType.SHARE_DEPOSIT, TransactionType.LOAN_REPAYMENT, TransactionType.FINE_PAYMENT].includes(t.type)) {
      balance += t.amount + (t.solidarityAmount || 0);
    } else if ([TransactionType.EXPENSE, TransactionType.LOAN_DISBURSEMENT].includes(t.type)) {
      balance -= t.amount;
    }
  });
  return balance;
};

// --- Fines ---
export const getFines = async (groupId: string): Promise<Fine[]> => {
  return handleResponse(supabase.from('fines').select('*').eq('groupId', groupId));
};

export const createFine = async (groupId: string, data: any) => {
  const result = await handleResponse(supabase.from('fines').insert({
    id: `f_${Date.now()}`,
    groupId,
    memberId: data.memberId,
    categoryId: data.categoryId,
    amount: data.amount,
    date: data.date,
    reason: data.reason,
    status: FineStatus.UNPAID,
    paidAmount: 0,
    recordedBy: data.recordedBy,
    cycleId: 'current'
  }));

  // Trigger SMS
  await triggerSMSEvent(
    SMSEventType.FINE_ISSUED,
    { amount: data.amount.toLocaleString(), reason: data.reason || 'General Violation' },
    data.memberId,
    groupId,
    data.recordedBy
  );

  return result;
};

export const updateFine = async (id: string, data: any, editorId: string, reason: string) => {
  return handleResponse(supabase.from('fines').update(data).eq('id', id));
};

export const voidFine = async (id: string, reason: string, editorId: string) => {
  return handleResponse(supabase.from('fines').update({ status: FineStatus.VOID, reason }).eq('id', id));
};

export const payFine = async (id: string, amount: number, method: string, recorder: string) => {
  const { data: fine } = await supabase.from('fines').select('*').eq('id', id).single();
  const newPaid = fine.paidAmount + amount;
  const status = newPaid >= fine.amount ? FineStatus.PAID : FineStatus.PARTIALLY_PAID;
  
  await supabase.from('fines').update({ paidAmount: newPaid, status }).eq('id', id);
  
  // Create transaction
  await supabase.from('transactions').insert({
    id: `t_finepay_${Date.now()}`,
    groupId: fine.groupId,
    memberId: fine.memberId,
    cycleId: fine.cycleId,
    type: TransactionType.FINE_PAYMENT,
    amount,
    date: new Date().toISOString().split('T')[0],
    recordedBy: recorder
  });
};

export const getFineCategories = async (groupId: string): Promise<FineCategory[]> => {
  return handleResponse(supabase.from('fine_categories').select('*').eq('groupId', groupId));
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

// --- Attendance & Meetings ---
export const getMeetings = async (groupId: string): Promise<Meeting[]> => {
  return handleResponse(supabase.from('meetings').select('*').eq('groupId', groupId));
};

export const createMeeting = async (groupId: string, data: any) => {
  return handleResponse(supabase.from('meetings').insert({
    id: `mtg_${Date.now()}`,
    groupId,
    ...data,
    createdAt: new Date().toISOString()
  }).select().single());
};

export const getAttendance = async (groupId: string): Promise<Attendance[]> => {
  return handleResponse(supabase.from('attendance').select('*').eq('groupId', groupId));
};

export const saveAttendanceBatch = async (meetingId: string, records: any[], recorder: string) => {
  const { data: meeting } = await supabase.from('meetings').select('groupId, date').eq('id', meetingId).single();
  const rows = records.map(r => ({
    id: `att_${meetingId}_${r.memberId}`,
    meetingId,
    groupId: meeting.groupId,
    date: meeting.date,
    memberId: r.memberId,
    status: r.status,
    notes: r.notes,
    recordedBy: recorder
  }));
  return handleResponse(supabase.from('attendance').upsert(rows));
};

export const updateAttendance = async (id: string, data: any, editor: string, reason: string) => {
  // Logic with audit history update
  return handleResponse(supabase.from('attendance').update(data).eq('id', id));
};

// --- Cycles ---
export const getCycle = async (id: string): Promise<Cycle | null> => {
  const { data } = await supabase.from('cycles').select('*').eq('id', id).single();
  return data;
};

export const closeCycle = async (id: string, snapshot: ShareOutSnapshot) => {
  const { data: cycle } = await supabase.from('cycles').select('groupId').eq('id', id).single();
  
  // Archive data and set status
  await supabase.from('cycles').update({ status: 'CLOSED', endDate: snapshot.date }).eq('id', id);
  
  // Create New Cycle
  const newCycle = {
      id: `c_${Date.now()}`,
      groupId: cycle.groupId,
      startDate: new Date().toISOString().split('T')[0],
      status: 'OPEN',
      interestRate: 5
  };
  await supabase.from('cycles').insert(newCycle);
  await supabase.from('groups').update({ currentCycleId: newCycle.id }).eq('id', cycle.groupId);

  // Notify & SMS
  const { data: members } = await supabase.from('members').select('id, fullName').eq('groupId', cycle.groupId);
  
  // Could be high volume, consider batching or selective
  // For demo, trigger single SMS for system log mostly or president
  await logSMS('SYSTEM', `Cycle ${id} Closed. Shareout: ${snapshot.totalDistributable}`, 'SENT', cycle.groupId, 'system');

  return { success: true };
};

// --- Meeting Mode ---
export const submitMeeting = async (groupId: string, date: string, entries: any[]) => {
  // Complex batch operation: Create meeting -> Attendance -> Transactions
  const meeting = await createMeeting(groupId, { date, type: 'REGULAR', notes: 'Meeting Mode' });
  
  // Attendance
  const att = entries.map(e => ({ memberId: e.memberId, status: e.present ? AttendanceStatus.PRESENT : AttendanceStatus.ABSENT }));
  await saveAttendanceBatch(meeting.id, att, 'Meeting Mode');
  
  // Transactions
  for (const e of entries) {
    if (e.shares > 0) await addContribution(groupId, { memberId: e.memberId, shareCount: e.shares, date, recordedBy: 'Meeting Mode' });
    if (e.loanRepayment > 0) {
       const { data: loans } = await supabase.from('loans').select('*').eq('memberId', e.memberId).eq('status', LoanStatus.ACTIVE);
       if (loans && loans[0]) await repayLoan(loans[0].id, e.loanRepayment);
    }
    // Fines payments would need logic to pay existing fines or create new ones
  }
};

// --- Notifications ---
export const getNotifications = async (): Promise<Notification[]> => {
  return handleResponse(supabase.from('notifications').select('*'));
};

export const markNotificationRead = async (id: string) => {
  return handleResponse(supabase.from('notifications').update({ read: true }).eq('id', id));
};

export const markAllNotificationsRead = async () => {
  return handleResponse(supabase.from('notifications').update({ read: true }).neq('read', true));
};

export const createNotification = async (notif: Partial<Notification>) => {
  return handleResponse(supabase.from('notifications').insert({
    id: `n_${Date.now()}`,
    date: new Date().toISOString(),
    read: false,
    ...notif
  }));
};

// --- Communication ---
export const sendEmail = async (to: string[], subject: string, html: string) => {
  // In production, call Edge Function
  // await supabase.functions.invoke('send-email', { body: { to, subject, html } });
  console.log('Sending Email:', subject);
  return { success: true };
};

export const sendSMS = async (phone: string, msg: string) => {
  // Helper for direct SMS, e.g. broadcast
  // We use triggerSMSEvent usually, but for custom broadcast we go direct?
  // Let's reuse the logic but with no template
  // Or just call the edge function if user has permission
  await supabase.functions.invoke('send-sms-mtn', { body: { recipient: phone, message: msg } });
  console.log('Sending SMS to', phone, ':', msg);
  return { success: true };
};

export const checkReminders = async () => {
  // await supabase.functions.invoke('check-reminders');
  return { success: true, sent: 5 };
};

// --- Workflows ---
export const getWorkflows = async (groupId: string): Promise<ApprovalWorkflow[]> => {
  return handleResponse(supabase.from('approval_workflows').select('*').eq('groupId', groupId));
};

export const saveWorkflow = async (workflow: Partial<ApprovalWorkflow>) => {
  return handleResponse(supabase.from('approval_workflows').upsert(workflow));
};

// --- SMS Config ---
export const getSMSTemplates = async (): Promise<SMSTemplate[]> => {
    try {
        const { data, error } = await supabase.from('sms_templates').select('*');
        if (error || !data || data.length === 0) throw new Error("Templates not found");
        return data;
    } catch (e) {
        // console.warn("SMS Templates fetch failed, using defaults:", e);
        return SEED_DATA.smsTemplates;
    }
};

export const updateSMSTemplate = async (type: string, text: string, enabled: boolean) => {
    // Upsert is safer in case row missing
    return handleResponse(supabase.from('sms_templates').upsert({ eventType: type, template: text, isEnabled: enabled }).select().single());
};

export const getSMSLogs = async (): Promise<SMSLog[]> => {
    try {
        const { data, error } = await supabase.from('sms_logs').select('*');
        if (error) throw error;
        return data;
    } catch (e) {
        return [];
    }
};

export const getSMSConfig = async (): Promise<SMSConfig | null> => {
  try {
    const { data, error } = await supabase.from('sms_config').select('*').single();
    // 406 Not Acceptable or 404 or just error means we fallback
    if (error || !data) throw new Error("Config not found");
    return data;
  } catch (e) {
      // console.warn("SMS Config fetch failed, using defaults:", e);
      return SEED_DATA.smsConfig[0];
  }
};

export const toggleSMSLiveMode = async (enabled: boolean) => {
  // Upsert pattern
  const { data } = await supabase.from('sms_config').select('id').single();
  if (data) {
      return handleResponse(supabase.from('sms_config').update({ isLiveMode: enabled }).eq('id', data.id));
  } else {
      return handleResponse(supabase.from('sms_config').insert({ id: 'default', isLiveMode: enabled, monthlyCap: 1000, currentUsage: 0 }));
  }
};

export const updateSMSCap = async (cap: number) => {
    const { data } = await supabase.from('sms_config').select('id').single();
    if (data) {
        return handleResponse(supabase.from('sms_config').update({ monthlyCap: cap }).eq('id', data.id));
    }
};

// --- Reports ---
export const generateReport = async (groupId: string, type: string, filters: any) => {
  // Mock logic based on type to return data structures expected by UI
  if (type === 'SAVINGS_SUMMARY') {
    const { data: members } = await supabase.from('members').select('*').eq('groupId', groupId);
    const { data: group } = await supabase.from('groups').select('shareValue').eq('id', groupId).single();
    return members.map((m: any) => ({
      "Member Name": m.fullName,
      "Total Shares": m.totalShares,
      "Total Savings": m.totalShares * group.shareValue
    }));
  }
  // Implement other report types similarly...
  return [];
};

// --- Admin Utils ---
export const getFullDatabaseBackup = async () => {
  return SEED_DATA; // Return full object
};

export const importDatabase = async (json: string) => {
  try {
    const data = JSON.parse(json);
    // Logic to upsert all tables
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};

// --- Seeds ---
export const seedSuperAdmin = async () => {};
export const restoreDefaultAdmin = async () => {};
=======
  User, UserStatus, AuditRecord, Cycle, ExpenseCategory
} from '../types';

// Helper to handle Supabase responses
const handleResponse = async (query: any) => {
    const { data, error } = await query;
    if (error) {
        console.error("Supabase Error:", error);
        // Safely extract error message or stringify the object
        const msg = error.message || error.details || error.hint || (typeof error === 'object' ? JSON.stringify(error) : String(error));
        throw new Error(msg);
    }
    return data;
};

// Users
export const getUsers = async () => {
    return handleResponse(supabase.from('users').select('*'));
};

export const getUser = async (id: string) => {
    return handleResponse(supabase.from('users').select('*').eq('id', id).single());
};

export const createUser = async (userData: Partial<User>, creatorId: string) => {
    const newUser = {
        id: `u_${Date.now()}`,
        ...userData,
        status: UserStatus.ACTIVE,
        twoFactorEnabled: false,
        failedLoginAttempts: 0,
        createdAt: new Date().toISOString(),
        createdBy: creatorId
    };
    return handleResponse(supabase.from('users').insert(newUser).select().single());
};

export const updateUser = async (id: string, updates: Partial<User>) => {
    return handleResponse(supabase.from('users').update(updates).eq('id', id).select().single());
};

export const login = async (email: string, pass: string) => {
    // Note: In production, use supabase.auth.signInWithPassword. 
    // This maintains the existing "custom user table" logic requested.
    
    // Use maybeSingle() instead of single() to avoid 406/JSON errors if no user exists
    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle();

    if (error) {
        console.error("Login DB Error:", error);
        throw new Error(`Database connection error: ${error.message || JSON.stringify(error)}`);
    }

    if (!user) {
        throw new Error("User not found. Please click 'Initialize Database' or 'Restore Admin' below.");
    }

    // In a real app, use bcrypt.compare here
    if (user.passwordHash !== pass) {
        throw new Error("Invalid password");
    }
    
    if (user.status !== UserStatus.ACTIVE) {
        throw new Error("Account is locked or disabled");
    }

    // 2FA Check
    if (user.twoFactorEnabled) {
        // In a real app, we would send the email/SMS here.
        // For simulation, we assume a static code '123456'.
        // We return a specific status that the frontend can interpret.
        return { 
            status: '2FA_REQUIRED', 
            userId: user.id,
            email: user.email 
        };
    }

    // Update login time
    await supabase.from('users').update({ lastLogin: new Date().toISOString() }).eq('id', user.id);
    return { status: 'SUCCESS', user };
};

export const verifyTwoFactor = async (userId: string, code: string) => {
    // Mock Verification Logic
    // In production, verify against TOTP secret or DB stored otp with expiry
    if (code === '123456') {
        const { data: user } = await supabase.from('users').select('*').eq('id', userId).single();
        if (!user) throw new Error("User context lost");
        
        await supabase.from('users').update({ lastLogin: new Date().toISOString() }).eq('id', user.id);
        return { status: 'SUCCESS', user };
    } else {
        throw new Error("Invalid verification code");
    }
};

export const seedSuperAdmin = async () => {
    const { data } = await supabase.from('users').select('*').eq('email', 'admin@vjn.rw').maybeSingle();
    if (data) return { success: false, message: 'Super Admin already exists.' };

    return restoreDefaultAdmin();
};

export const restoreDefaultAdmin = async () => {
    const superAdmin = {
        id: 'u_super',
        fullName: 'Super Admin',
        email: 'admin@vjn.rw',
        phone: '0788000000',
        passwordHash: 'admin123',
        role: UserRole.SUPER_ADMIN,
        status: UserStatus.ACTIVE,
        twoFactorEnabled: false,
        createdAt: new Date().toISOString(),
        createdBy: 'system'
    };

    // Use upsert to overwrite if exists but broken
    const { error } = await supabase.from('users').upsert(superAdmin);
    
    if (error) {
        if (error.code === '42501') throw new Error("Permission Denied: Please run the RLS SQL in Settings.");
        throw new Error(error.message || JSON.stringify(error));
    }
    return { success: true, message: 'Super Admin (admin@vjn.rw) restored successfully.' };
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
    // Fetch member to get role
    const { data: member } = await supabase.from('members').select('role').eq('id', data.memberId).single();

    const totalRepayable = data.amount + (data.amount * (data.interestRate / 100) * data.duration);
    const newLoan = {
        id: `l_${Date.now()}`,
        groupId,
        memberId: data.memberId,
        memberRole: member?.role,
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

    const result = await handleResponse(supabase.from('loans').update({ status }).eq('id', loanId));

    // --- SYSTEM NOTIFICATION LOGIC ---
    if (status === LoanStatus.APPROVED || status === LoanStatus.ACTIVE || status === LoanStatus.REJECTED) {
        // Fetch Member details for the message
        const { data: member } = await supabase.from('members').select('fullName').eq('id', loan.memberId).single();
        const memberName = member?.fullName || 'Unknown Member';
        
        const isApproved = status === LoanStatus.APPROVED || status === LoanStatus.ACTIVE;
        const type = isApproved ? 'SUCCESS' : 'WARNING';
        
        await supabase.from('notifications').insert({
            id: `n_${Date.now()}`,
            title: isApproved ? 'Loan Approved' : 'Loan Rejected',
            message: `Loan application for ${memberName} (${Number(loan.principal).toLocaleString()} RWF) has been ${isApproved ? 'approved' : 'rejected'}.`,
            date: new Date().toISOString(),
            read: false,
            type: type
        });
    }

    return result;
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
    const upserts = records.map(r => ({
        id: `att_${meetingId}_${r.memberId}`,
        meetingId,
        groupId: '', 
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
export const createNotification = async (notification: Partial<Notification>) => {
    return handleResponse(supabase.from('notifications').insert({
        id: `n_${Date.now()}`,
        date: new Date().toISOString(),
        read: false,
        ...notification
    }));
};

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
    return [];
};

export const sendSMS = async (phone: string, msg: string) => {
    console.log("Supabase Mock SMS:", phone, msg);
    return { success: true };
};

// Backup & Restore
export const getFullDatabaseBackup = async () => {
    const tables = [
        'users', 'groups', 'members', 'cycles', 
        'fine_categories', 'expense_categories', 
        'meetings', 'loans', 'fines', 'transactions', 'attendance', 'notifications'
    ];
    
    const backup: any = {};
    
    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*');
        if (!error && data) {
            backup[table] = data;
        }
    }
    
    return backup;
};

export const importDatabase = async (json: string) => {
    let data;
    try {
        data = JSON.parse(json);
    } catch (e) {
        return { success: false, error: "Invalid JSON format" };
    }

    // Order matters for FK constraints
    const tableOrder = [
        'users', 'groups', 'members', 'cycles', 
        'fine_categories', 'expense_categories', 
        'meetings', 'loans', 'fines', 'transactions', 'attendance', 'notifications'
    ];

    try {
        for (const table of tableOrder) {
            if (data[table] && Array.isArray(data[table])) {
                const records = data[table];
                if (records.length === 0) continue;
                
                // Chunking to avoid payload limits
                const chunkSize = 100;
                for (let i = 0; i < records.length; i += chunkSize) {
                    const chunk = records.slice(i, i + chunkSize);
                    const { error } = await supabase.from(table).upsert(chunk);
                    
                    if (error) {
                        if (error.code === '42501') throw new Error(`PERMISSION DENIED importing ${table}. Check RLS.`);
                        // Fix
                        throw new Error(`Error importing ${table}: ${error.message || JSON.stringify(error)}`);
                    }
                }
            }
        }
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

export const wipeRemoteDatabase = async () => {
    // Delete in reverse order of dependencies
    const tableOrder = [
        'notifications', 'attendance', 'transactions', 'fines', 'loans', 'meetings',
        'expense_categories', 'fine_categories', 'cycles', 'members', 'groups',
        // 'users' -- Keep users for login unless specific requirement
    ];

    try {
        for (const table of tableOrder) {
            // Delete all records (needs a condition in Supabase)
            const { error } = await supabase.from(table).delete().neq('id', '000000'); 
            if (error) throw new Error(error.message || JSON.stringify(error));
        }
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};
>>>>>>> 7c17f3ba72aad7656a6b64c3bf0bfbc90a688a2a
