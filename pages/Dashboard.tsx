import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { LABELS } from '../constants';
import { api } from '../api/client';
import { 
  Banknote, Users, TrendingUp, AlertTriangle, Loader2, 
  Calendar, ArrowRight, PlusCircle, CheckCircle, Wallet, 
  Sprout, FileText, AlertOctagon, Clock, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie 
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
  const totalFines = transactions.filter(t => t.type === 'FINE_PAYMENT').reduce((acc, t) => acc + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + t.amount, 0);
  // Cash in Box = (Shares + Fines) - Expenses - PrincipalOut
  const cashBalance = (totalSharesValue + totalFines - totalExpenses) - totalPrincipalDisbursed;

  // 3. Attendance
  const lastMeetingDate = attendance.length > 0 ? attendance[0].date : null;
  const lastMeetingAttendance = lastMeetingDate ? attendance.filter(a => a.date === lastMeetingDate) : [];
  const absentCount = lastMeetingAttendance.filter(a => a.status === 'ABSENT').length;

  // 4. Charts Data
  const chartData = [
    { name: 'Savings', value: totalSharesValue, color: '#10b981' },
    { name: 'Loans Out', value: totalOutstandingLoans, color: '#3b82f6' },
    { name: 'Cash', value: cashBalance > 0 ? cashBalance : 0, color: '#6366f1' },
  ];

  if (loading || !group) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader2 className="animate-spin text-green-600 mb-4" size={48} />
        <p className="text-gray-500 font-medium">Loading Dashboard...</p>
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
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Members</p>
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
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total Savings</p>
              <h3 className="text-2xl font-bold text-green-600 mt-1">{totalSharesValue.toLocaleString()}</h3>
              <p className="text-xs text-green-600 font-medium mt-1 flex items-center">
                <ArrowUpRight size={12} className="mr-0.5" /> RWF
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
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Active Loans</p>
              <h3 className="text-2xl font-bold text-blue-600 mt-1">{totalOutstandingLoans.toLocaleString()}</h3>
              <p className="text-xs text-blue-600 font-medium mt-1 flex items-center">
                 {activeLoanList.length} Active
              </p>
            </div>
            <div className="p-2 bg-gray-50 rounded-lg text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
              <TrendingUp size={20} />
            </div>
          </div>
        </div>

        {/* Card 4: Overdue Loans (Alert Color) */}
        <div onClick={() => navigate('/loans')} className={`p-5 rounded-xl shadow-sm border hover:shadow-md transition-shadow cursor-pointer group ${overdueLoanList.length > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'}`}>
          <div className="flex justify-between items-start">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wide ${overdueLoanList.length > 0 ? 'text-red-600' : 'text-gray-400'}`}>Overdue</p>
              <h3 className={`text-2xl font-bold mt-1 ${overdueLoanList.length > 0 ? 'text-red-700' : 'text-gray-900'}`}>
                {totalOverdueAmount.toLocaleString()}
              </h3>
              <p className={`text-xs font-medium mt-1 flex items-center ${overdueLoanList.length > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                 {overdueLoanList.length} Late Loans
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
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Cash Balance</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{cashBalance.toLocaleString()}</h3>
              <p className="text-xs text-gray-500 font-medium mt-1">
                 In Box/Bank
              </p>
            </div>
            <div className="p-2 bg-gray-50 rounded-lg text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
              <Wallet size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* 3. CURRENT SEASON SNAPSHOT (Center Focus) */}
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
                  {cycle?.status || 'Active Season'}
                </span>
                <span className="text-slate-400 text-sm font-medium">{cycle?.startDate} — {cycle?.endDate || 'Present'}</span>
              </div>
              <h2 className="text-3xl font-bold text-white tracking-tight">Current Season: 2024 Cycle A</h2>
            </div>
            
            {cycle?.status === 'CLOSED' && (
               <button className="mt-4 md:mt-0 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-lg transition-colors flex items-center">
                 <FileText size={18} className="mr-2" /> View Share-out Report
               </button>
            )}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 border-t border-slate-800 pt-8">
             <div>
               <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Share Value</p>
               <p className="text-2xl font-bold text-white">{group.shareValue} RWF</p>
             </div>
             <div>
               <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Total Contributions</p>
               <p className="text-2xl font-bold text-white">{totalSharesValue.toLocaleString()} RWF</p>
             </div>
             <div>
               <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Loans Issued</p>
               <p className="text-2xl font-bold text-white">{totalPrincipalDisbursed.toLocaleString()} RWF</p>
             </div>
             <div>
               <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Est. Share-out</p>
               <p className="text-2xl font-bold text-yellow-400">
                  {/* Mock: Total + 5% profit */}
                  {(totalSharesValue + (totalPrincipalDisbursed * 0.05)).toLocaleString()} RWF
               </p>
             </div>
          </div>
        </div>
      </div>

      {/* 5. QUICK ACTIONS (Behavior Shaping) */}
      <div>
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center">
           Quick Actions
           <div className="h-px bg-gray-200 flex-1 ml-4"></div>
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <button onClick={() => navigate('/meeting')} className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-green-400 hover:shadow-md hover:-translate-y-1 transition-all group">
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-3 group-hover:bg-green-100 transition-colors">
              <PlusCircle size={24} />
            </div>
            <span className="text-sm font-bold text-gray-700">Record Contribution</span>
          </button>

          <button onClick={() => navigate('/loans')} className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-blue-400 hover:shadow-md hover:-translate-y-1 transition-all group">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
              <Banknote size={24} />
            </div>
            <span className="text-sm font-bold text-gray-700">Loan Payment</span>
          </button>

          <button onClick={() => navigate('/fines')} className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-red-400 hover:shadow-md hover:-translate-y-1 transition-all group">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-3 group-hover:bg-red-100 transition-colors">
              <AlertTriangle size={24} />
            </div>
            <span className="text-sm font-bold text-gray-700">Add Fine</span>
          </button>

          <button onClick={() => navigate('/attendance')} className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-purple-400 hover:shadow-md hover:-translate-y-1 transition-all group">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-3 group-hover:bg-purple-100 transition-colors">
              <CheckCircle size={24} />
            </div>
            <span className="text-sm font-bold text-gray-700">Record Attendance</span>
          </button>

          <button onClick={() => navigate('/expenses')} className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-orange-400 hover:shadow-md hover:-translate-y-1 transition-all group">
            <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mb-3 group-hover:bg-orange-100 transition-colors">
              <Wallet size={24} />
            </div>
            <span className="text-sm font-bold text-gray-700">Add Expense</span>
          </button>
        </div>
      </div>

      {/* 4. ACTIVITY OVERVIEW (Two-Column Section) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Financial Activity Feed (2/3) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-800">Financial Activity</h3>
            <button onClick={() => navigate('/reports')} className="text-sm font-medium text-blue-600 hover:underline">View Full History</button>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {transactions.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <FileText size={48} className="mx-auto mb-4 opacity-20" />
                <p>No transactions recorded yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {transactions.slice().reverse().slice(0, 7).map((t) => (
                  <div key={t.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                     <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          t.type.includes('DEPOSIT') ? 'bg-green-100 text-green-600' :
                          t.type.includes('LOAN') ? 'bg-blue-100 text-blue-600' :
                          t.type.includes('FINE') || t.type.includes('PENALTY') ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                        }`}>
                           {t.type.includes('DEPOSIT') && <ArrowDownRight size={18} />}
                           {t.type.includes('LOAN') && <Banknote size={18} />}
                           {(t.type.includes('FINE') || t.type.includes('PENALTY')) && <AlertTriangle size={18} />}
                           {t.type === 'EXPENSE' && <ArrowUpRight size={18} />}
                        </div>
                        <div>
                           <p className="text-sm font-bold text-gray-900">
                             {t.memberId ? members.find(m => m.id === t.memberId)?.fullName : 'Group Expense'}
                           </p>
                           <p className="text-xs text-gray-500">
                             {t.type === 'SHARE_DEPOSIT' ? 'Contribution' : t.type.replace('_', ' ').toLowerCase()} • <span className="font-medium text-gray-400">{t.date}</span>
                           </p>
                        </div>
                     </div>
                     <span className={`font-mono font-bold text-sm ${
                       t.type.includes('DEPOSIT') || t.type === 'LOAN_REPAYMENT' || t.type === 'FINE_PAYMENT' ? 'text-green-600' : 'text-gray-800'
                     }`}>
                        {t.type.includes('DEPOSIT') || t.type === 'LOAN_REPAYMENT' || t.type === 'FINE_PAYMENT' ? '+' : '-'} {t.amount.toLocaleString()}
                     </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Visual Summary & Alerts (1/3) */}
        <div className="space-y-8">
           {/* Visual Summary */}
           <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-6">Savings Distribution</h3>
              <div className="h-64 relative">
                 <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
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
                {/* Center text overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                   <span className="text-xs text-gray-400 font-medium">Total</span>
                   <span className="text-lg font-bold text-gray-800">{(totalSharesValue + totalOutstandingLoans + cashBalance).toLocaleString()}</span>
                </div>
              </div>
              
              <div className="mt-6 space-y-3">
                 <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></div>Savings</div>
                    <span className="font-bold text-gray-700">{totalSharesValue.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>Loans Out</div>
                    <span className="font-bold text-gray-700">{totalOutstandingLoans.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-indigo-500 mr-2"></div>Cash</div>
                    <span className="font-bold text-gray-700">{cashBalance.toLocaleString()}</span>
                 </div>
              </div>
           </div>

           {/* 6. ALERTS & WARNINGS (Silent Guardian) */}
           {(overdueLoanList.length > 0 || absentCount > 2) && (
              <div className="space-y-4">
                 <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Attention Needed</h3>
                 
                 {overdueLoanList.length > 0 && (
                   <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex gap-3">
                     <AlertOctagon className="text-red-600 flex-shrink-0" size={20} />
                     <div>
                       <p className="text-sm font-bold text-red-800">{overdueLoanList.length} Overdue Loans</p>
                       <p className="text-xs text-red-600 mt-1">Total: {totalOverdueAmount.toLocaleString()} RWF</p>
                       <button onClick={() => navigate('/loans')} className="text-xs font-bold text-red-800 mt-2 underline">Review Loans</button>
                     </div>
                   </div>
                 )}

                 {absentCount > 2 && (
                   <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3">
                     <Clock className="text-amber-600 flex-shrink-0" size={20} />
                     <div>
                       <p className="text-sm font-bold text-amber-800">Low Attendance</p>
                       <p className="text-xs text-amber-700 mt-1">{absentCount} members absent last meeting.</p>
                       <button onClick={() => navigate('/attendance')} className="text-xs font-bold text-amber-800 mt-2 underline">Check Log</button>
                     </div>
                   </div>
                 )}
              </div>
           )}
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