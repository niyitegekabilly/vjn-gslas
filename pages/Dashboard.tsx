
import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { useAuth } from '../contexts/AuthContext';
import { LABELS } from '../constants';
import { api } from '../api/client';
import { 
  Banknote, Users, TrendingUp, AlertTriangle, Loader2, 
  Calendar, ArrowRight, PlusCircle, CheckCircle, Wallet, 
  Sprout, Clock, ArrowUpRight, ArrowDownRight,
  ShieldAlert, Building, Sparkles, ChevronRight
} from 'lucide-react';
import { LoanStatus, Member, Loan, Transaction, Cycle, Attendance, Fine, UserRole } from '../types';

export default function Dashboard() {
  const { lang, activeGroupId, groups } = useContext(AppContext);
  const { user } = useAuth();
  const labels = LABELS[lang];
  const navigate = useNavigate();

  const group = groups.find(g => g.id === activeGroupId);
  
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
    Promise.all([
      api.getMembers(activeGroupId),
      api.getLoans(activeGroupId),
      api.getTransactions(activeGroupId),
      api.getAttendance(activeGroupId),
      api.getFines(activeGroupId),
      group?.currentCycleId ? api.getCycle(group.currentCycleId) : Promise.resolve(null)
    ]).then(([m, l, t, a, f, c]) => {
      setMembers(m);
      setLoans(l);
      setTransactions(t);
      setAttendance(a);
      setFines(f);
      setCycle(c || null);
      setLoading(false);
    });
  }, [activeGroupId, group]);

  if (loading || !group) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader2 className="animate-spin text-green-600 mb-4" size={48} />
        <p className="text-gray-500 font-medium animate-pulse">{labels.loading}</p>
      </div>
    );
  }

  // --- CALCULATIONS ---
  
  // 1. Members
  const totalMembers = members.length;

  // 2. Financials
  const totalSharesValue = members.reduce((acc, m) => acc + (m.totalShares * (group?.shareValue || 0)), 0);
  
  const activeLoanList = loans.filter(l => l.status === LoanStatus.ACTIVE || l.status === LoanStatus.DEFAULTED);
  const overdueLoanList = loans.filter(l => new Date(l.dueDate) < new Date() && l.balance > 0);
  
  const totalOutstandingLoans = activeLoanList.reduce((acc, l) => acc + l.balance, 0);
  const totalOverdueAmount = overdueLoanList.reduce((acc, l) => acc + l.balance, 0);
  
  // Cash Balance: (Shares + Repayments + Fines + Solidarity) - (Expenses + Disbursements)
  const validTx = transactions.filter(t => !t.isVoid);
  const inflows = validTx.filter(t => ['SHARE_DEPOSIT', 'LOAN_REPAYMENT', 'FINE_PAYMENT'].includes(t.type)).reduce((acc, t) => acc + t.amount + (t.solidarityAmount || 0), 0);
  const outflows = validTx.filter(t => ['EXPENSE', 'LOAN_DISBURSEMENT'].includes(t.type)).reduce((acc, t) => acc + t.amount, 0);
  const cashBalance = inflows - outflows;

  // Unpaid Fines
  const totalUnpaidFines = fines.filter(f => f.status !== 'VOID' && f.status !== 'PAID').reduce((acc, f) => acc + (f.amount - f.paidAmount), 0);

  // 3. Activity & Flow
  const currentSeasonTxs = validTx.filter(t => t.cycleId === group.currentCycleId);
  const contributionsSeason = currentSeasonTxs.filter(t => t.type === 'SHARE_DEPOSIT').reduce((acc, t) => acc + t.amount, 0);
  const expensesSeason = currentSeasonTxs.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + t.amount, 0);
  
  const currentMonthStr = new Date().toISOString().slice(0, 7); // YYYY-MM
  const contributionsMonth = validTx.filter(t => t.type === 'SHARE_DEPOSIT' && t.date.startsWith(currentMonthStr)).reduce((acc, t) => acc + t.amount, 0);

  // 4. Attendance
  const lastMeetingDate = attendance.length > 0 ? attendance[attendance.length - 1].date : null; // Assuming sorted or grab latest
  // Re-sort attendance to be safe for "Last Meeting" logic
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
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

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
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <p className="text-blue-200 text-sm font-medium uppercase tracking-wider mb-1">{greeting}</p>
              <h1 className="text-3xl font-bold">{myMember.fullName}</h1>
              <p className="text-blue-100 mt-2 flex items-center">
                <Building size={16} className="mr-2" /> {group.name}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm px-6 py-3 rounded-xl border border-white/20">
              <p className="text-xs text-blue-200 uppercase">My Shares</p>
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
                   {(myMember.totalShares * group.shareValue).toLocaleString()} <span className="text-sm font-medium text-gray-400">{labels.currency}</span>
                </p>
             </div>
             <p className="text-sm text-green-600 flex items-center">
                <CheckCircle size={14} className="mr-1" /> Secure & Growing
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
               <p className="text-sm text-gray-400">No active loans</p>
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
              {myFineTotal > 0 && <p className="text-xs text-red-600 mt-4">Please clear this with the treasurer.</p>}
           </div>

           <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start">
                 <div>
                    <p className="text-gray-500 font-medium text-sm uppercase">{labels.myAttendance}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{myAttRate}%</p>
                 </div>
                 <div className="w-12 h-12 rounded-full border-4 border-blue-50 flex items-center justify-center text-xs font-bold text-blue-600">
                    {myAttRate}
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
              Here's your group's financial health at a glance. 
              {overdueLoanList.length > 0 
                ? <span className="text-orange-300 font-semibold ml-1"><AlertTriangle size={14} className="inline mb-1"/> {overdueLoanList.length} loans require attention.</span> 
                : <span className="text-green-300 font-semibold ml-1"><CheckCircle size={14} className="inline mb-1"/> All loans are healthy.</span>
              }
            </p>
          </div>
          
          <div className="flex gap-3">
             <button 
               onClick={() => navigate('/meeting')}
               className="flex items-center px-5 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold shadow-lg transition-all transform hover:scale-105 active:scale-95"
             >
               <PlusCircle size={20} className="mr-2" /> {labels.startNewMeeting}
             </button>
          </div>
        </div>
      </div>

      {/* 2. Core "Trust" Numbers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title={labels.totalSavings}
          value={`${totalSharesValue.toLocaleString()}`}
          subValue={labels.currency}
          icon={<Wallet size={24} />}
          color="green"
          onClick={() => navigate('/contributions')}
        />
        <StatCard 
          title={labels.cashBalance}
          value={`${cashBalance.toLocaleString()}`}
          subValue="Available Cash"
          icon={<Banknote size={24} />}
          color="blue"
          onClick={() => navigate('/expenses')}
        />
        <StatCard 
          title={labels.members}
          value={totalMembers.toString()}
          subValue="Active Members"
          icon={<Users size={24} />}
          color="indigo"
          onClick={() => navigate('/members')}
        />
        {(user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ADMIN) ? (
           <StatCard 
             title={labels.totalGroups}
             value={groups.length.toString()}
             subValue="Active Groups"
             icon={<Building size={24} />}
             color="slate"
             onClick={() => navigate('/groups')}
           />
        ) : (
           <StatCard 
             title={labels.activeSeasons}
             value={cycle?.status || 'None'}
             subValue={cycle?.startDate || 'No Date'}
             icon={<Sprout size={24} />}
             color="teal"
             onClick={() => navigate('/seasons')}
           />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 3. Operational & Risk Center */}
        <div className="lg:col-span-2 space-y-6">
           <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800 flex items-center">
                <ShieldAlert size={20} className="mr-2 text-gray-400" /> Operational & Risk
              </h3>
              <div className="h-px bg-gray-200 flex-1 ml-4"></div>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Active Loans */}
              <div 
                onClick={() => navigate('/loans')}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-blue-200 transition-colors cursor-pointer group"
              >
                 <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                       <Banknote size={24} />
                    </div>
                    <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full">{activeLoanList.length} Active</span>
                 </div>
                 <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">{labels.outstandingLoans}</p>
                 <p className="text-2xl font-bold text-gray-900 mt-1">{totalOutstandingLoans.toLocaleString()} <span className="text-sm font-normal text-gray-400">RWF</span></p>
              </div>

              {/* Overdue Loans (Alert State) */}
              <div 
                onClick={() => navigate('/loans')}
                className={`p-6 rounded-2xl shadow-sm border cursor-pointer transition-colors group ${
                  overdueLoanList.length > 0 
                  ? 'bg-red-50 border-red-200 hover:border-red-300' 
                  : 'bg-white border-gray-100 hover:border-green-200'
                }`}
              >
                 <div className="flex justify-between items-start mb-4">
                    <div className={`p-2 rounded-lg transition-colors ${
                       overdueLoanList.length > 0 ? 'bg-red-100 text-red-600' : 'bg-green-50 text-green-600'
                    }`}>
                       <AlertTriangle size={24} />
                    </div>
                    {overdueLoanList.length > 0 && (
                       <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded-full animate-pulse">{overdueLoanList.length} Overdue</span>
                    )}
                 </div>
                 <p className={`text-xs font-bold uppercase tracking-wider ${overdueLoanList.length > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                    {labels.overdue}
                 </p>
                 <p className={`text-2xl font-bold mt-1 ${overdueLoanList.length > 0 ? 'text-red-700' : 'text-gray-900'}`}>
                    {totalOverdueAmount.toLocaleString()} <span className={`text-sm font-normal ${overdueLoanList.length > 0 ? 'text-red-400' : 'text-gray-400'}`}>RWF</span>
                 </p>
              </div>

              {/* Unpaid Fines */}
              <div 
                onClick={() => navigate('/fines')}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-orange-200 transition-colors cursor-pointer sm:col-span-2 flex items-center justify-between"
              >
                 <div>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">{labels.unpaidFinesTotal}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{totalUnpaidFines.toLocaleString()} <span className="text-sm font-normal text-gray-400">RWF</span></p>
                 </div>
                 <div className="flex items-center text-orange-500 bg-orange-50 px-4 py-2 rounded-lg">
                    <span className="text-sm font-bold mr-2">View List</span>
                    <ArrowRight size={16} />
                 </div>
              </div>
           </div>
        </div>

        {/* 4. Activity & Discipline Sidebar */}
        <div className="space-y-6">
           <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800 flex items-center">
                <TrendingUp size={20} className="mr-2 text-gray-400" /> Flow & Discipline
              </h3>
              <div className="h-px bg-gray-200 flex-1 ml-4"></div>
           </div>

           {/* Stats List */}
           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Contributions */}
              <div className="p-4 border-b border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors">
                 <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center mr-3">
                       <ArrowUpRight size={16} />
                    </div>
                    <div>
                       <p className="text-xs text-gray-500 font-bold uppercase">In (Month)</p>
                       <p className="text-sm font-bold text-gray-900">{contributionsMonth.toLocaleString()}</p>
                    </div>
                 </div>
              </div>
              
              {/* Expenses */}
              <div className="p-4 border-b border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors">
                 <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center mr-3">
                       <ArrowDownRight size={16} />
                    </div>
                    <div>
                       <p className="text-xs text-gray-500 font-bold uppercase">Out (Season)</p>
                       <p className="text-sm font-bold text-gray-900">{expensesSeason.toLocaleString()}</p>
                    </div>
                 </div>
              </div>

              {/* Attendance */}
              <div className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate('/attendance')}>
                 <div className="flex justify-between items-center mb-2">
                    <p className="text-xs text-gray-500 font-bold uppercase">{labels.lastAttendance}</p>
                    <span className="text-sm font-bold text-blue-600">{lastMeetingPercent}%</span>
                 </div>
                 <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${lastMeetingPercent}%` }}></div>
                 </div>
                 <p className="text-xs text-gray-400 mt-1 text-right">{latestDate ? new Date(latestDate).toLocaleDateString() : 'No Data'}</p>
              </div>

              {/* Warnings */}
              {repeatedAbsenceCount > 0 && (
                 <div className="p-4 bg-red-50 flex items-center justify-between cursor-pointer hover:bg-red-100 transition-colors" onClick={() => navigate('/attendance')}>
                    <div className="flex items-center text-red-700">
                       <AlertTriangle size={16} className="mr-2" />
                       <span className="text-sm font-bold">{repeatedAbsenceCount} Members</span>
                    </div>
                    <span className="text-xs text-red-600 font-medium">Chronic Absence</span>
                 </div>
              )}
           </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 pt-8 mt-4 flex flex-col md:flex-row justify-between items-center text-xs text-gray-400 font-medium">
        <p>VJN GSLA Management System v1.3.0</p>
        <div className="flex items-center mt-2 md:mt-0 gap-4">
           <span className="flex items-center"><Sparkles size={12} className="mr-1 text-yellow-500" /> Powered by Vision Jeunesse Nouvelle</span>
        </div>
      </div>
    </div>
  );
}

// --- SUB COMPONENTS ---

interface StatCardProps {
  title: string;
  value: string;
  subValue: string;
  icon: React.ReactNode;
  color: 'green' | 'blue' | 'indigo' | 'slate' | 'teal';
  onClick: () => void;
}

function StatCard({ title, value, subValue, icon, color, onClick }: StatCardProps) {
  const colorStyles = {
    green: 'bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white',
    blue: 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white',
    indigo: 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white',
    slate: 'bg-slate-100 text-slate-600 group-hover:bg-slate-700 group-hover:text-white',
    teal: 'bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white',
  };

  return (
    <div 
      onClick={onClick}
      className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 cursor-pointer transition-all hover:shadow-md hover:-translate-y-1 group"
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
          <h3 className="text-2xl font-extrabold text-gray-900">{value}</h3>
          <p className="text-xs text-gray-400 mt-1 font-medium">{subValue}</p>
        </div>
        <div className={`p-3 rounded-xl transition-colors duration-300 ${colorStyles[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
