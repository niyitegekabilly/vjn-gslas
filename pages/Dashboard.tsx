<<<<<<< HEAD

=======
>>>>>>> 7c17f3ba72aad7656a6b64c3bf0bfbc90a688a2a
import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { useAuth } from '../contexts/AuthContext';
import { LABELS } from '../constants';
import { api } from '../api/client';
import { 
  Banknote, Users, TrendingUp, AlertTriangle, 
  Calendar, PlusCircle, CheckCircle, Wallet, 
  Sprout, ShieldAlert, Building, AlertCircle,
  PiggyBank, Receipt, UserX, Activity, Gavel, BarChart2, Clock
} from 'lucide-react';
import { LoanStatus, Member, Loan, Transaction, Cycle, Attendance, Fine, UserRole, GSLAGroup } from '../types';
import { DashboardSkeleton } from '../components/Skeleton';
import StatsCard from '../components/StatsCard';
import { SyncStatus } from '../components/SyncStatus';

export default function Dashboard() {
  const { lang, activeGroupId, groups, isOnline } = useContext(AppContext);
  const { user } = useAuth();
  const labels = LABELS[lang];
  const navigate = useNavigate();

  const isAllGroups = activeGroupId === 'ALL';
  const selectedGroup = groups.find(g => g.id === activeGroupId);
  
  // Create a display group object. For ALL, we use dummy defaults for the UI.
  const group = isAllGroups ? {
      id: 'ALL',
      name: 'All Groups Overview',
      shareValue: 0, 
      currentCycleId: '',
      status: 'ACTIVE'
  } as unknown as GSLAGroup : selectedGroup;
  
  const [members, setMembers] = useState<Member[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fines, setFines] = useState<Fine[]>([]);
  const [cycle, setCycle] = useState<Cycle | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeGroupId) return;
    setLoading(true);

    const loadData = async () => {
        // Determine which groups to fetch data for
        const targetGroups = isAllGroups ? groups : (selectedGroup ? [selectedGroup] : []);
        
        if (targetGroups.length === 0) {
            setLoading(false);
            return;
        }

        try {
            // Fetch data for all target groups in parallel
            const promises = targetGroups.map(g => Promise.all([
                api.getMembers(g.id),
                api.getLoans(g.id),
                api.getTransactions(g.id),
                api.getAttendance(g.id),
                api.getFines(g.id)
            ]));

            const results = await Promise.all(promises);

            // Flatten the results into single arrays
            const allMembers = results.flatMap(r => r[0]);
            const allLoans = results.flatMap(r => r[1]);
            const allTxs = results.flatMap(r => r[2]);
            const allAtt = results.flatMap(r => r[3]);
            const allFines = results.flatMap(r => r[4]);

            setMembers(allMembers);
            setLoans(allLoans);
            setTransactions(allTxs);
            setAttendance(allAtt);
            setFines(allFines);

            // Handle Cycle Display
            if (!isAllGroups && selectedGroup?.currentCycleId) {
                const c = await api.getCycle(selectedGroup.currentCycleId);
                setCycle(c);
            } else {
                setCycle(null);
            }
        } catch (e) {
            console.error("Dashboard data load error:", e);
        } finally {
            setLoading(false);
        }
    };

    loadData();
  }, [activeGroupId, groups, selectedGroup, isAllGroups]);

  if (loading || !group) {
    return <DashboardSkeleton />;
  }

  // --- CALCULATIONS ---
  
  // 1. Members
  const totalMembers = members.length;

  // 2. Financials
  // Correctly calculate total shares value by looking up each member's group share value
  const totalSharesValue = members.reduce((acc, m) => {
      const mGroup = groups.find(g => g.id === m.groupId);
      return acc + (m.totalShares * (mGroup?.shareValue || 0));
  }, 0);
  
  const activeLoanList = loans.filter(l => l.status === LoanStatus.ACTIVE || l.status === LoanStatus.DEFAULTED);
  const overdueLoanList = loans.filter(l => new Date(l.dueDate) < new Date() && l.balance > 0);
  
  const totalOutstandingLoans = activeLoanList.reduce((acc, l) => acc + l.balance, 0);
  const totalOverdueAmount = overdueLoanList.reduce((acc, l) => acc + l.balance, 0);
  const overdueLoanCount = overdueLoanList.length;
  
  // Cash Balance: (Shares + Repayments + Fines + Solidarity) - (Expenses + Disbursements)
  const validTx = transactions.filter(t => !t.isVoid);
  const inflows = validTx.filter(t => ['SHARE_DEPOSIT', 'LOAN_REPAYMENT', 'FINE_PAYMENT'].includes(t.type)).reduce((acc, t) => acc + t.amount + (t.solidarityAmount || 0), 0);
  const outflows = validTx.filter(t => ['EXPENSE', 'LOAN_DISBURSEMENT'].includes(t.type)).reduce((acc, t) => acc + t.amount, 0);
  const cashBalance = inflows - outflows;

  // Revenue (Fines + Projected Interest of Active Loans)
  const totalLoanInterest = loans.filter(l => l.status !== 'REJECTED' && l.status !== 'PENDING').reduce((acc, l) => acc + (l.totalRepayable - l.principal), 0);
  const totalFinesCollected = fines.reduce((acc, f) => acc + f.paidAmount, 0);
  const totalRevenue = totalLoanInterest + totalFinesCollected;

  // Unpaid Fines
  const unpaidFinesList = fines.filter(f => f.status !== 'VOID' && f.status !== 'PAID');
  const totalUnpaidFines = unpaidFinesList.reduce((acc, f) => acc + (f.amount - f.paidAmount), 0);
  const unpaidFineCount = unpaidFinesList.length;

  // --- SHARE VALUE TRACKING ---
  const totalSharesCount = members.reduce((acc, m) => acc + m.totalShares, 0);
  // Social Fund (Liability/Separate Pot)
  const totalSocialFund = transactions.filter(t => !t.isVoid).reduce((acc, t) => acc + (t.solidarityAmount || 0), 0);
  // Net Assets = Cash + Outstanding Loans - Social Fund Liability
  const netWorth = cashBalance + totalOutstandingLoans - totalSocialFund;
  
  // For 'All Groups', this represents the system-wide average unit value
  const currentShareValue = totalSharesCount > 0 ? (netWorth / totalSharesCount) : (group.shareValue || 0);
  
  // For 'All Groups', we calculate a weighted average of initial values to show meaningful growth stats
  const initialShareValue = isAllGroups 
    ? (totalSharesCount > 0 ? members.reduce((acc, m) => {
        const mGroup = groups.find(g => g.id === m.groupId);
        return acc + (m.totalShares * (mGroup?.shareValue || 0));
      }, 0) / totalSharesCount : 0)
    : (group.shareValue || 0);

  const shareGrowth = currentShareValue - initialShareValue;
  const shareGrowthPct = initialShareValue > 0 ? (shareGrowth / initialShareValue) * 100 : 0;

  // 3. Activity & Flow
  // For All Groups, we consider all transactions valid for the period, assuming they fall into active cycles essentially
  const currentSeasonTxs = isAllGroups 
    ? validTx 
    : validTx.filter(t => t.cycleId === group.currentCycleId);

  const contributionsSeason = currentSeasonTxs.filter(t => t.type === 'SHARE_DEPOSIT').reduce((acc, t) => acc + t.amount, 0);
  const expensesSeason = currentSeasonTxs.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + t.amount, 0);
  
  const currentMonthStr = new Date().toISOString().slice(0, 7); // YYYY-MM
  const contributionsMonth = validTx.filter(t => t.type === 'SHARE_DEPOSIT' && t.date.startsWith(currentMonthStr)).reduce((acc, t) => acc + t.amount, 0);

  // 4. Attendance
  const sortedAttendance = [...attendance].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const latestDate = sortedAttendance.length > 0 ? sortedAttendance[0].date : null;
  const lastMeetingRecords = latestDate ? sortedAttendance.filter(a => a.date === latestDate) : [];
  
  const lastMeetingPresent = lastMeetingRecords.filter(a => a.status === 'PRESENT').length;
  const lastMeetingTotal = lastMeetingRecords.length;
  const lastMeetingPercent = lastMeetingTotal > 0 ? Math.round((lastMeetingPresent / lastMeetingTotal) * 100) : 0;

  // Repeated Absences (more than 2)
  const absenceCounts: Record<string, number> = {};
  attendance.filter(a => a.status === 'ABSENT').forEach(a => {
    absenceCounts[a.memberId] = (absenceCounts[a.memberId] || 0) + 1;
  });
  const repeatedAbsenceCount = Object.values(absenceCounts).filter(count => count > 2).length;

  // --- TIME GREETING ---
  const hour = new Date().getHours();
  const greeting = hour < 12 ? labels.goodMorning : hour < 18 ? labels.goodAfternoon : labels.goodEvening;

  // --- MEMBER VIEW RENDER ---
  if (user?.role === UserRole.MEMBER_USER) {
    const myMember = members.find(m => m.id === user.linkedMemberId);
    if (!myMember) return <div className="p-8 text-center text-gray-500">Member record not linked. Please contact admin.</div>;

    const myActiveLoan = loans.find(l => l.memberId === myMember.id && (l.status === 'ACTIVE' || l.status === 'DEFAULTED'));
    const myFines = fines.filter(f => f.memberId === myMember.id && f.status !== 'PAID' && f.status !== 'VOID');
    const myFineTotal = myFines.reduce((acc, f) => acc + (f.amount - f.paidAmount), 0);
    const myAtt = attendance.filter(a => a.memberId === myMember.id);
    const myAttRate = myAtt.length > 0 ? Math.round((myAtt.filter(a => a.status === 'PRESENT').length / myAtt.length) * 100) : 100;

    return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-12">
        {/* Member Welcome Hero */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-4 right-4">
             <SyncStatus isOnline={isOnline} />
          </div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
            <div>
              <p className="text-blue-200 text-sm font-medium uppercase tracking-wider mb-1">{greeting}</p>
              <h1 className="text-3xl font-bold">{myMember.fullName}</h1>
              <p className="text-blue-100 mt-2 flex items-center">
                <Building size={16} className="mr-2" /> {group.name}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm px-6 py-3 rounded-xl border border-white/20">
<<<<<<< HEAD
              <p className="text-xs text-blue-200 uppercase">{labels.shareCount}</p>
=======
              <p className="text-xs text-blue-200 uppercase">My Shares</p>
>>>>>>> 7c17f3ba72aad7656a6b64c3bf0bfbc90a688a2a
              <p className="text-2xl font-bold">{myMember.totalShares}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-48">
             <div>
                <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600 mb-4">
                   <Wallet size={20} />
                </div>
                <p className="text-gray-500 font-medium text-sm uppercase">{labels.mySavings}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                   {(myMember.totalShares * currentShareValue).toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-sm font-medium text-gray-400">{labels.currency}</span>
                </p>
             </div>
             <p className="text-sm text-green-600 flex items-center">
<<<<<<< HEAD
                <TrendingUp size={14} className="mr-1" /> {labels.valuePerShare}: {Math.round(currentShareValue)} {labels.currency}
=======
                <TrendingUp size={14} className="mr-1" /> Value: {Math.round(currentShareValue)} {labels.currency} / share
>>>>>>> 7c17f3ba72aad7656a6b64c3bf0bfbc90a688a2a
             </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-48">
             <div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-4 ${myActiveLoan ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400'}`}>
                   <Banknote size={20} />
                </div>
                <p className="text-gray-500 font-medium text-sm uppercase">{labels.myLoans}</p>
                <p className={`text-3xl font-bold mt-2 ${myActiveLoan ? 'text-blue-600' : 'text-gray-400'}`}>
                   {myActiveLoan ? myActiveLoan.balance.toLocaleString() : '0'} <span className="text-sm font-medium text-gray-400">{labels.currency}</span>
                </p>
             </div>
             {myActiveLoan ? (
               <p className="text-sm text-orange-600 flex items-center">
                  <Clock size={14} className="mr-1" /> Due: {new Date(myActiveLoan.dueDate).toLocaleDateString()}
               </p>
             ) : (
<<<<<<< HEAD
               <p className="text-sm text-gray-400">{labels.noData}</p>
=======
               <p className="text-sm text-gray-400">No active loans</p>
>>>>>>> 7c17f3ba72aad7656a6b64c3bf0bfbc90a688a2a
             )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className={`p-6 rounded-2xl shadow-sm border ${myFineTotal > 0 ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100'}`}>
              <div className="flex justify-between items-start">
                 <div>
                    <p className={`font-medium text-sm uppercase ${myFineTotal > 0 ? 'text-red-600' : 'text-gray-500'}`}>{labels.unpaidFinesTotal}</p>
                    <p className={`text-2xl font-bold mt-2 ${myFineTotal > 0 ? 'text-red-700' : 'text-gray-900'}`}>
                       {myFineTotal.toLocaleString()} {labels.currency}
                    </p>
                 </div>
                 <AlertTriangle className={`${myFineTotal > 0 ? 'text-red-500' : 'text-gray-300'}`} size={24} />
              </div>
<<<<<<< HEAD
=======
              {myFineTotal > 0 && <p className="text-xs text-red-600 mt-4">Please clear this with the treasurer.</p>}
>>>>>>> 7c17f3ba72aad7656a6b64c3bf0bfbc90a688a2a
           </div>

           <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start">
                 <div>
                    <p className="text-gray-500 font-medium text-sm uppercase">{labels.myAttendance}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{myAttRate}%</p>
                 </div>
                 <div className="w-12 h-12 rounded-full border-4 border-blue-50 flex items-center justify-center text-xs font-bold text-blue-600">
                    {myAttRate}%
                 </div>
              </div>
           </div>
        </div>
      </div>
    );
  }

  // --- LEADER / ADMIN VIEW RENDER ---

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      
      {/* 1. Welcome Hero Section */}
      <div className="relative overflow-hidden bg-slate-900 text-white rounded-3xl p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-green-500 rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-blue-500 rounded-full opacity-10 blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <div className="flex items-center space-x-2 text-slate-400 mb-2 text-sm font-medium">
              <Calendar size={16} />
              <span>{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              {greeting}, <span className="text-green-400">{user?.fullName.split(' ')[0]}</span>
            </h1>
            <p className="mt-2 text-slate-300 max-w-xl text-sm leading-relaxed">
              {isAllGroups ? (
<<<<<<< HEAD
                  <>{labels.aggregatePortfolio} ({groups.length}).</>
              ) : (
                  <>{labels.systemStatus}: <span className="text-green-400 font-medium">{labels.active}</span>.</>
              )}
              {overdueLoanList.length > 0 
                ? <span className="text-orange-300 font-semibold ml-1">{labels.overdue}: {overdueLoanList.length}</span> 
                : <span className="text-green-300 font-semibold ml-1"> {labels.financialHealthGood}</span>
=======
                  <>You are viewing the <strong>Aggregate Portfolio</strong> for all {groups.length} groups.</>
              ) : (
                  <>System Status: <span className="text-green-400 font-medium">{labels.active}</span>.</>
              )}
              {overdueLoanList.length > 0 
                ? <span className="text-orange-300 font-semibold ml-1">{labels.overdue}: {overdueLoanList.length}</span> 
                : <span className="text-green-300 font-semibold ml-1"> Financial health is good.</span>
>>>>>>> 7c17f3ba72aad7656a6b64c3bf0bfbc90a688a2a
              }
            </p>
          </div>
          
          <div className="flex gap-3 items-center">
             <SyncStatus isOnline={isOnline} />
             <button 
               onClick={() => isOnline && navigate('/meeting')}
               disabled={!isOnline || isAllGroups}
               className={`flex items-center px-5 py-3 rounded-xl font-bold shadow-lg transition-all transform hover:scale-105 active:scale-95 ${
                 isOnline && !isAllGroups ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-gray-50 text-gray-300 cursor-not-allowed'
               }`}
               title={isAllGroups ? "Select a specific group to start meeting" : "Start Meeting"}
             >
               <PlusCircle size={20} className="mr-2" /> {labels.startNewMeeting}
             </button>
          </div>
        </div>
      </div>

      {/* 2. Financial Overview */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 flex items-center mb-4">
          <Banknote size={20} className="mr-2 text-gray-400" /> {labels.healthIndicators}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard 
            title={labels.currentShareValue}
            value={`${Math.round(currentShareValue).toLocaleString()}`}
            // @ts-ignore
<<<<<<< HEAD
            subValue={isAllGroups ? labels.avgUnitValue : `${labels.initialValue}: ${initialShareValue}`}
=======
            subValue={isAllGroups ? "Avg. Unit Value" : `${labels.initialValue}: ${initialShareValue}`}
>>>>>>> 7c17f3ba72aad7656a6b64c3bf0bfbc90a688a2a
            icon={<TrendingUp size={24} />}
            color="green"
            trend={!isAllGroups || initialShareValue > 0 ? `+${Math.round(shareGrowthPct)}%` : undefined}
            trendUp={true}
            // @ts-ignore
            onClick={() => navigate('/reports')}
          />
          <StatsCard 
            title={labels.totalSavings}
            value={`${totalSharesValue.toLocaleString()}`}
            // @ts-ignore
            subValue={labels.currency}
            icon={<Wallet size={24} />}
            color="blue"
            // @ts-ignore
            onClick={() => navigate('/contributions')}
          />
          <StatsCard 
            title={labels.cashBalance}
            value={`${cashBalance.toLocaleString()}`}
            subValue="Available"
            icon={<Banknote size={24} />}
            color="teal"
            // @ts-ignore
            onClick={() => navigate('/expenses')}
          />
          <StatsCard 
            title={labels.expensesSeason}
            value={`${expensesSeason.toLocaleString()}`}
            // @ts-ignore
            subValue={labels.currency}
            icon={<Receipt size={24} />}
            color="orange"
            // @ts-ignore
            onClick={() => navigate('/expenses')}
          />
        </div>
      </div>

      {/* 3. Operational Overview */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 flex items-center mb-4">
          <Activity size={20} className="mr-2 text-gray-400" /> {labels.healthIndicators}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {(user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ADMIN) ? (
             <StatsCard 
               title={labels.totalGroups}
               value={groups.length.toString()}
<<<<<<< HEAD
               subValue="Active"
=======
               subValue="Active Groups"
>>>>>>> 7c17f3ba72aad7656a6b64c3bf0bfbc90a688a2a
               icon={<Building size={24} />}
               color="purple"
               // @ts-ignore
               onClick={() => navigate('/groups')}
             />
          ) : (
             <StatsCard 
               title={labels.activeSeasons}
               value={cycle?.status || 'None'}
               subValue={cycle?.startDate || 'No Date'}
               icon={<Sprout size={24} />}
               color="purple"
               // @ts-ignore
               onClick={() => navigate('/seasons')}
             />
          )}
          <StatsCard 
            title={labels.members}
            value={totalMembers.toString()}
<<<<<<< HEAD
            subValue="Active"
=======
            subValue="Active Members"
>>>>>>> 7c17f3ba72aad7656a6b64c3bf0bfbc90a688a2a
            icon={<Users size={24} />}
            color="indigo"
            // @ts-ignore
            onClick={() => navigate('/members')}
          />
          <StatsCard 
            title={labels.contributionsSeason}
            value={contributionsSeason.toLocaleString()}
            // @ts-ignore
            subValue={labels.currency}
            icon={<PiggyBank size={24} />}
            color="green"
            // @ts-ignore
            onClick={() => navigate('/contributions')}
          />
          <StatsCard 
            title={labels.contributionsMonth}
            value={contributionsMonth.toLocaleString()}
            // @ts-ignore
<<<<<<< HEAD
            subValue={labels.thisMonth}
=======
            subValue="This Month"
>>>>>>> 7c17f3ba72aad7656a6b64c3bf0bfbc90a688a2a
            icon={<Calendar size={24} />}
            color="blue"
            // @ts-ignore
            onClick={() => navigate('/contributions')}
          />
        </div>
      </div>

      {/* 4. Risk & Health Monitoring */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 flex items-center mb-4">
          <ShieldAlert size={20} className="mr-2 text-gray-400" /> {labels.healthIndicators}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard 
            title={labels.overdue}
            value={overdueLoanCount.toString()}
            subValue={`${totalOverdueAmount.toLocaleString()} ${labels.currency}`}
            icon={<AlertTriangle size={24} />}
            color={overdueLoanCount > 0 ? "red" : "green"}
            onClick={() => navigate('/loans')}
          />
          <StatsCard 
            title={labels.unpaidFinesTotal}
            value={unpaidFineCount.toString()}
            // @ts-ignore
            subValue={`${totalUnpaidFines.toLocaleString()} ${labels.currency}`}
            icon={<AlertCircle size={24} />}
            color={unpaidFineCount > 0 ? "orange" : "green"}
            // @ts-ignore
            onClick={() => navigate('/fines')}
          />
          <StatsCard 
            title={labels.lastAttendance}
            value={`${lastMeetingPercent}%`}
<<<<<<< HEAD
            subValue={labels.presence}
=======
            subValue="Presence"
>>>>>>> 7c17f3ba72aad7656a6b64c3bf0bfbc90a688a2a
            icon={<CheckCircle size={24} />}
            color={lastMeetingPercent < 75 ? "orange" : "blue"}
            // @ts-ignore
            onClick={() => navigate('/attendance')}
          />
          <StatsCard 
            title={labels.repeatedAbsence}
            value={repeatedAbsenceCount.toString()}
<<<<<<< HEAD
            subValue={labels.members}
=======
            subValue="Members"
>>>>>>> 7c17f3ba72aad7656a6b64c3bf0bfbc90a688a2a
            icon={<UserX size={24} />}
            color={repeatedAbsenceCount > 0 ? "red" : "indigo"}
            // @ts-ignore
            onClick={() => navigate('/attendance')}
          />
        </div>
      </div>

      {/* 5. Quick Actions & Schedules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Quick Actions Panel */}
           <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">{labels.quickActions}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <button 
                    onClick={() => isOnline && navigate('/contributions')}
                    disabled={!isOnline || isAllGroups} 
                    className={`p-4 rounded-xl flex flex-col items-center justify-center transition-colors border group ${
                      isOnline && !isAllGroups
                        ? 'bg-gray-50 hover:bg-green-50 text-gray-700 hover:text-green-700 border-gray-100 hover:border-green-200' 
                        : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                 >
                    <Wallet size={24} className={`mb-2 ${isOnline && !isAllGroups ? 'text-gray-400 group-hover:text-green-600' : 'text-gray-400'}`} />
                    <span className="text-xs font-medium text-center">{labels.recordContribution}</span>
                 </button>
                 <button 
                    onClick={() => isOnline && navigate('/loans')}
                    disabled={!isOnline || isAllGroups}
                    className={`p-4 rounded-xl flex flex-col items-center justify-center transition-colors border group ${
                      isOnline && !isAllGroups
                        ? 'bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700 border-gray-100 hover:border-blue-200'
                        : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                 >
                    <Banknote size={24} className={`mb-2 ${isOnline && !isAllGroups ? 'text-gray-400 group-hover:text-blue-600' : 'text-gray-400'}`} />
                    <span className="text-xs font-medium text-center">{labels.recordRepayment}</span>
                 </button>
                 <button 
                    onClick={() => isOnline && navigate('/fines')}
                    disabled={!isOnline || isAllGroups}
                    className={`p-4 rounded-xl flex flex-col items-center justify-center transition-colors border group ${
                      isOnline && !isAllGroups
                        ? 'bg-gray-50 hover:bg-orange-50 text-gray-700 hover:text-orange-700 border-gray-100 hover:border-orange-200'
                        : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                 >
                    <Gavel size={24} className={`mb-2 ${isOnline && !isAllGroups ? 'text-gray-400 group-hover:text-orange-600' : 'text-gray-400'}`} />
                    <span className="text-xs font-medium text-center">{labels.recordNewFine}</span>
                 </button>
                 <button onClick={() => navigate('/reports')} className="p-4 bg-gray-50 hover:bg-purple-50 text-gray-700 hover:text-purple-700 rounded-xl flex flex-col items-center justify-center transition-colors border border-gray-100 hover:border-purple-200 group">
                    <BarChart2 size={24} className="mb-2 text-gray-400 group-hover:text-purple-600" />
                    {/* @ts-ignore */}
                    <span className="text-xs font-medium text-center">{labels.reports}</span>
                 </button>
              </div>
           </div>

           {/* Schedule Sidebar */}
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h3 className="font-bold text-gray-800 mb-4">{labels.upcomingSchedule}</h3>
              <div className="space-y-4">
                 <div className="flex items-start">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg mr-3 shrink-0">
                       <Calendar size={20} />
                    </div>
                    <div>
                       <p className="font-medium text-sm text-gray-900">{labels.nextMeeting}</p>
                       <p className="text-xs text-gray-500 mt-0.5">Friday, {new Date().toLocaleDateString()}</p>
                    </div>
                 </div>
                 {overdueLoanList.length > 0 && (
                    <div className="flex items-start">
                        <div className="p-2 bg-red-50 text-red-600 rounded-lg mr-3 shrink-0">
                           <AlertCircle size={20} />
                        </div>
                        <div>
                           <p className="font-medium text-sm text-gray-900">{labels.loansDueSoon}</p>
                           <p className="text-xs text-gray-500 mt-0.5">{overdueLoanList.length} loans overdue</p>
                        </div>
                    </div>
                 )}
              </div>
           </div>
      </div>
    </div>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> 7c17f3ba72aad7656a6b64c3bf0bfbc90a688a2a
