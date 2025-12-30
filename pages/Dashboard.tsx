
import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { LABELS } from '../constants';
import { api } from '../api/client';
import { 
  Banknote, Users, TrendingUp, AlertTriangle, Loader2, 
  Calendar, ArrowRight, PlusCircle, CheckCircle, Wallet, 
  Sprout, FileText, AlertOctagon, Clock, ArrowUpRight, ArrowDownRight,
  Activity, PieChart as PieIcon, BarChart3
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';
import { LoanStatus, Member, Loan, Transaction, Cycle, Attendance } from '../types';

export default function Dashboard() {
  const { lang, activeGroupId, groups } = useContext(AppContext);
  const labels = LABELS[lang];
  const navigate = useNavigate();

  const group = groups.find(g => g.id === activeGroupId);
  
  const [members, setMembers] = useState<Member[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
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
      group?.currentCycleId ? api.getCycle(group.currentCycleId) : Promise.resolve(null)
    ]).then(([m, l, t, a, c]) => {
      setMembers(m);
      setLoans(l);
      setTransactions(t);
      setAttendance(a);
      setCycle(c || null);
      setLoading(false);
    });
  }, [activeGroupId, group]);

  // --- Calculations for "Truth" ---
  
  // 1. Members
  const totalMembers = members.length;

  // 2. Financials
  const totalSharesValue = members.reduce((acc, m) => acc + (m.totalShares * (group?.shareValue || 0)), 0);
  
  const activeLoanList = loans.filter(l => l.status === LoanStatus.ACTIVE || l.status === LoanStatus.DEFAULTED);
  const overdueLoanList = loans.filter(l => new Date(l.dueDate) < new Date() && l.balance > 0);
  
  const totalOutstandingLoans = activeLoanList.reduce((acc, l) => acc + l.balance, 0);
  const totalOverdueAmount = overdueLoanList.reduce((acc, l) => acc + l.balance, 0);
  const totalPrincipalDisbursed = activeLoanList.reduce((acc, l) => acc + l.principal, 0);

  // Cash Balance Calculation (Approximate)
  const allInflows = transactions.filter(t => !t.isVoid && ['SHARE_DEPOSIT', 'LOAN_REPAYMENT', 'FINE_PAYMENT'].includes(t.type)).reduce((acc, t) => acc + t.amount + (t.solidarityAmount || 0), 0);
  const allOutflows = transactions.filter(t => !t.isVoid && ['EXPENSE', 'LOAN_DISBURSEMENT'].includes(t.type)).reduce((acc, t) => acc + t.amount, 0);
  const cashBalance = allInflows - allOutflows;

  // 3. Attendance Stats
  const lastMeetingDate = attendance.length > 0 ? attendance[0].date : null;
  const lastMeetingAttendance = lastMeetingDate ? attendance.filter(a => a.date === lastMeetingDate) : [];
  
  const totalAttendanceRecords = attendance.length;
  const presentCountTotal = attendance.filter(a => a.status === 'PRESENT').length;
  const attendanceRate = totalAttendanceRecords > 0 ? Math.round((presentCountTotal / totalAttendanceRecords) * 100) : 0;

  // 4. Loan Health
  const totalRepayableAll = loans.reduce((acc, l) => acc + l.totalRepayable, 0);
  const totalBalanceAll = loans.reduce((acc, l) => acc + l.balance, 0);
  const repaymentRate = totalRepayableAll > 0 ? Math.round(((totalRepayableAll - totalBalanceAll) / totalRepayableAll) * 100) : 100;

  // 5. Charts Data
  const chartData = [
    { name: 'Savings', value: totalSharesValue, color: '#10b981' },
    { name: 'Loans Out', value: totalOutstandingLoans, color: '#3b82f6' },
    { name: 'Cash', value: cashBalance > 0 ? cashBalance : 0, color: '#6366f1' },
  ];

  // 6. Trend Data (Last 6 Months)
  const getLast6Months = () => {
    const months = [];
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push(d.toISOString().slice(0, 7)); // YYYY-MM
    }
    return months;
  };

  const trendMonths = getLast6Months();
  const trendData = trendMonths.map(month => {
    const monthlyTx = transactions.filter(t => t.date.startsWith(month) && !t.isVoid);
    return {
      name: new Date(month + '-01').toLocaleDateString(lang === 'rw' ? 'fr-RW' : 'en-US', { month: 'short' }),
      Savings: monthlyTx.filter(t => t.type === 'SHARE_DEPOSIT').reduce((acc, t) => acc + t.amount, 0),
      Loans: monthlyTx.filter(t => t.type === 'LOAN_DISBURSEMENT').reduce((acc, t) => acc + t.amount, 0),
      Repayments: monthlyTx.filter(t => t.type === 'LOAN_REPAYMENT').reduce((acc, t) => acc + t.amount, 0),
    };
  });

  // 7. Upcoming Deadlines
  const loansDueSoon = activeLoanList
    .filter(l => l.balance > 0)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3);

  const getNextMeetingDate = () => {
    if (!group) return new Date().toDateString();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const targetDay = days.indexOf(group.meetingDay);
    const today = new Date().getDay();
    let diff = targetDay - today;
    if (diff <= 0) diff += 7; // Next occurrence
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + diff);
    return nextDate.toLocaleDateString(lang === 'rw' ? 'fr-RW' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  if (loading || !group) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader2 className="animate-spin text-green-600 mb-4" size={48} />
        <p className="text-gray-500 font-medium">{labels.loading}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      
      {/* 2. HERO SUMMARY CARDS (Row 1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Members */}
        <div onClick={() => navigate('/members')} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{labels.members}</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{totalMembers}</h3>
            </div>
            <div className="p-2 bg-gray-50 rounded-lg text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
              <Users size={20} />
            </div>
          </div>
        </div>

        {/* Card 2: Savings */}
        <div onClick={() => navigate('/contributions')} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{labels.totalSavings}</p>
              <h3 className="text-2xl font-bold text-green-600 mt-1">{totalSharesValue.toLocaleString()}</h3>
              <p className="text-xs text-green-600 font-medium mt-1 flex items-center">
                <ArrowUpRight size={12} className="mr-0.5" /> {labels.currency}
              </p>
            </div>
            <div className="p-2 bg-gray-50 rounded-lg text-gray-400 group-hover:bg-green-50 group-hover:text-green-600 transition-colors">
              <Banknote size={20} />
            </div>
          </div>
        </div>

        {/* Card 3: Active Loans */}
        <div onClick={() => navigate('/loans')} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{labels.loansActive}</p>
              <h3 className="text-2xl font-bold text-blue-600 mt-1">{totalOutstandingLoans.toLocaleString()}</h3>
              <p className="text-xs text-blue-600 font-medium mt-1 flex items-center">
                 {activeLoanList.length} {labels.status.split(' ')[0]}
              </p>
            </div>
            <div className="p-2 bg-gray-50 rounded-lg text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
              <TrendingUp size={20} />
            </div>
          </div>
        </div>

        {/* Card 4: Overdue Loans */}
        <div onClick={() => navigate('/loans')} className={`p-5 rounded-xl shadow-sm border hover:shadow-md transition-shadow cursor-pointer group ${overdueLoanList.length > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'}`}>
          <div className="flex justify-between items-start">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wide ${overdueLoanList.length > 0 ? 'text-red-600' : 'text-gray-400'}`}>{labels.overdue}</p>
              <h3 className={`text-2xl font-bold mt-1 ${overdueLoanList.length > 0 ? 'text-red-700' : 'text-gray-900'}`}>
                {totalOverdueAmount.toLocaleString()}
              </h3>
              <p className={`text-xs font-medium mt-1 flex items-center ${overdueLoanList.length > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                 {overdueLoanList.length} {labels.lateLoans}
              </p>
            </div>
            <div className={`p-2 rounded-lg transition-colors ${overdueLoanList.length > 0 ? 'bg-white text-red-500' : 'bg-gray-50 text-gray-400'}`}>
              <AlertOctagon size={20} />
            </div>
          </div>
        </div>

        {/* Card 5: Cash Balance */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{labels.cashBalance}</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{cashBalance.toLocaleString()}</h3>
              <p className="text-xs text-gray-500 font-medium mt-1">
                 {labels.currency}
              </p>
            </div>
            <div className="p-2 bg-gray-50 rounded-lg text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
              <Wallet size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* 3. CURRENT SEASON SNAPSHOT */}
      <div className="bg-slate-900 rounded-2xl shadow-lg text-white p-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
          <Sprout size={240} />
        </div>
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                  cycle?.status === 'CLOSED' 
                  ? 'bg-red-500/20 text-red-300 border-red-500/30' 
                  : 'bg-green-500/20 text-green-300 border-green-500/30'
                }`}>
                  {cycle?.status || labels.activeSeasons}
                </span>
                <span className="text-slate-400 text-sm font-medium">{cycle?.startDate} — {cycle?.endDate || 'Present'}</span>
              </div>
              <h2 className="text-3xl font-bold text-white tracking-tight">{labels.activeSeasons}: {new Date().getFullYear()}</h2>
            </div>
            
            {cycle?.status === 'CLOSED' && (
               <button className="mt-4 md:mt-0 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-lg transition-colors flex items-center">
                 <FileText size={18} className="mr-2" /> Report
               </button>
            )}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 border-t border-slate-800 pt-8">
             <div>
               <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">{labels.shareValue}</p>
               <p className="text-2xl font-bold text-white">{group.shareValue} {labels.currency}</p>
             </div>
             <div>
               <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">{labels.sharesCollected}</p>
               <p className="text-2xl font-bold text-white">{totalSharesValue.toLocaleString()} {labels.currency}</p>
             </div>
             <div>
               <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">{labels.loansActive}</p>
               <p className="text-2xl font-bold text-white">{totalPrincipalDisbursed.toLocaleString()} {labels.currency}</p>
             </div>
             <div>
               <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Est. Value</p>
               <p className="text-2xl font-bold text-yellow-400">
                  {(totalSharesValue + (totalPrincipalDisbursed * 0.05)).toLocaleString()} {labels.currency}
               </p>
             </div>
          </div>
        </div>
      </div>

      {/* 5. QUICK ACTIONS */}
      <div>
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center">
           {labels.quickActions}
           <div className="h-px bg-gray-200 flex-1 ml-4"></div>
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <button onClick={() => navigate('/meeting')} className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-green-400 hover:shadow-md hover:-translate-y-1 transition-all group">
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-3 group-hover:bg-green-100 transition-colors">
              <PlusCircle size={24} />
            </div>
            <span className="text-sm font-bold text-gray-700 text-center">{labels.recordContribution}</span>
          </button>

          <button onClick={() => navigate('/loans')} className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-blue-400 hover:shadow-md hover:-translate-y-1 transition-all group">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
              <Banknote size={24} />
            </div>
            <span className="text-sm font-bold text-gray-700 text-center">{labels.recordRepayment}</span>
          </button>

          <button onClick={() => navigate('/fines')} className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-red-400 hover:shadow-md hover:-translate-y-1 transition-all group">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-3 group-hover:bg-red-100 transition-colors">
              <AlertTriangle size={24} />
            </div>
            <span className="text-sm font-bold text-gray-700 text-center">{labels.recordNewFine}</span>
          </button>

          <button onClick={() => navigate('/attendance')} className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-purple-400 hover:shadow-md hover:-translate-y-1 transition-all group">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-3 group-hover:bg-purple-100 transition-colors">
              <CheckCircle size={24} />
            </div>
            <span className="text-sm font-bold text-gray-700 text-center">{labels.attendance}</span>
          </button>

          <button onClick={() => navigate('/expenses')} className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-orange-400 hover:shadow-md hover:-translate-y-1 transition-all group">
            <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mb-3 group-hover:bg-orange-100 transition-colors">
              <Wallet size={24} />
            </div>
            <span className="text-sm font-bold text-gray-700 text-center">{labels.expenses}</span>
          </button>
        </div>
      </div>

      {/* 4. ACTIVITY & CHARTS SECTION */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left: Financial Trends Chart */}
        <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-800 flex items-center">
              <BarChart3 className="mr-2 text-gray-500" size={20} /> {labels.financialTrends}
            </h3>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} tickFormatter={(value) => `${value / 1000}k`} />
                <Tooltip 
                  cursor={{ fill: '#f9fafb' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value: number) => [`${value.toLocaleString()} ${labels.currency}`, '']}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="Savings" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} stackId="a" />
                <Bar dataKey="Repayments" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} stackId="a" />
                <Bar dataKey="Loans" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Health Metrics & Deadlines */}
        <div className="space-y-6">
           
           {/* KPI Cards */}
           <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">{labels.healthIndicators}</h3>
              <div className="space-y-6">
                 {/* Repayment Rate */}
                 <div>
                    <div className="flex justify-between text-sm mb-1">
                       <span className="text-gray-600 font-medium">{labels.repaymentRate}</span>
                       <span className={`font-bold ${repaymentRate < 90 ? 'text-orange-600' : 'text-green-600'}`}>{repaymentRate}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                       <div className={`h-2 rounded-full ${repaymentRate < 90 ? 'bg-orange-500' : 'bg-green-500'}`} style={{ width: `${repaymentRate}%` }}></div>
                    </div>
                 </div>

                 {/* Attendance Rate */}
                 <div>
                    <div className="flex justify-between text-sm mb-1">
                       <span className="text-gray-600 font-medium">{labels.attendanceRate}</span>
                       <span className={`font-bold ${attendanceRate < 80 ? 'text-red-600' : 'text-blue-600'}`}>{attendanceRate}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                       <div className={`h-2 rounded-full ${attendanceRate < 80 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${attendanceRate}%` }}></div>
                    </div>
                 </div>
              </div>
           </div>

           {/* Upcoming Events / Deadlines */}
           <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">{labels.upcomingSchedule}</h3>
              
              <div className="flex items-center p-3 bg-blue-50 rounded-lg border border-blue-100 mb-4">
                 <div className="p-2 bg-white rounded-md text-blue-600 mr-3 shadow-sm">
                    <Calendar size={18} />
                 </div>
                 <div>
                    <p className="text-xs text-blue-600 font-bold uppercase">{labels.nextMeeting}</p>
                    <p className="text-sm font-bold text-blue-900">{getNextMeetingDate()}</p>
                 </div>
              </div>

              {loansDueSoon.length > 0 ? (
                 <div>
                    <p className="text-xs font-bold text-gray-400 uppercase mb-2">{labels.loansDueSoon}</p>
                    <div className="space-y-2">
                       {loansDueSoon.map(loan => (
                          <div key={loan.id} className="flex justify-between items-center text-sm p-2 hover:bg-gray-50 rounded border border-transparent hover:border-gray-100 transition-colors">
                             <div className="flex items-center">
                                <Clock size={14} className="text-orange-500 mr-2" />
                                <span className="font-medium text-gray-700">{members.find(m => m.id === loan.memberId)?.fullName.split(' ')[0]}</span>
                             </div>
                             <div className="text-right">
                                <p className="font-bold text-gray-900">{loan.balance.toLocaleString()}</p>
                                <p className="text-xs text-gray-500">{loan.dueDate}</p>
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>
              ) : (
                 <p className="text-sm text-gray-400 italic text-center py-2">{labels.noData}</p>
              )}
           </div>

           {/* Asset Allocation Mini-Chart */}
           <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">{labels.assetAllocation}</h3>
              <div className="h-32 flex items-center">
                 <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={50}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => `${value.toLocaleString()} RWF`}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="ml-4 space-y-2 text-xs">
                   <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></div>Savings</div>
                   <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>Loans</div>
                   <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-indigo-500 mr-2"></div>Cash</div>
                </div>
              </div>
           </div>

        </div>
      </div>

      {/* 8. FOOTER */}
      <div className="border-t border-gray-200 pt-8 mt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-400 font-medium">
        <p>VJN GSLA Management System v1.2.0</p>
        <div className="flex items-center mt-2 md:mt-0 gap-4">
           <span>Support Contact: 0788-000-000</span>
           <span className="flex items-center"><Clock size={12} className="mr-1" /> {new Date().toLocaleString()}</span>
           <span>Powered by Vision Jeunesse Nouvelle</span>
        </div>
      </div>
    </div>
  );
}
