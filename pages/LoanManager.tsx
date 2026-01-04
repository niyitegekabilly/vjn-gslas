
import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../App';
import { api } from '../api/client';
import { LABELS } from '../constants';
import { Loan, Member, LoanStatus, UserRole } from '../types';
import { 
  Banknote, Plus, Search, Filter, CheckCircle, XCircle, 
  Clock, AlertTriangle, Calculator, ChevronDown, ChevronUp, Loader2
} from 'lucide-react';
import { TableRowSkeleton } from '../components/Skeleton';

export default function LoanManager() {
  const { activeGroupId, lang, groups } = useContext(AppContext);
  const labels = LABELS[lang];
  const group = groups.find(g => g.id === activeGroupId);

  const [loans, setLoans] = useState<Loan[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | LoanStatus>('ALL');
  
  // Sort State
  const [sortField, setSortField] = useState<keyof Loan | 'memberName'>('dueDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Modal State
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [isRepayOpen, setIsRepayOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [repayAmount, setRepayAmount] = useState(0);
  
  // Apply Form
  const [applyData, setApplyData] = useState({
    memberId: '',
    amount: 0,
    duration: 1, // Months
    purpose: ''
  });
  
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (activeGroupId) fetchData();
  }, [activeGroupId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [l, m] = await Promise.all([
        api.getLoans(activeGroupId),
        api.getMembers(activeGroupId)
      ]);
      setLoans(l);
      setMembers(m);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getMemberName = (id: string) => members.find(m => m.id === id)?.fullName || 'Unknown';

  const handleSort = (field: keyof Loan | 'memberName') => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: keyof Loan | 'memberName' }) => {
    if (sortField !== field) return <ChevronDown size={14} className="text-gray-300 ml-1 opacity-0 group-hover:opacity-100" />;
    return sortDirection === 'asc' ? <ChevronUp size={14} className="text-blue-600 ml-1" /> : <ChevronDown size={14} className="text-blue-600 ml-1" />;
  };

  const filteredLoans = loans.filter(l => {
    const matchesSearch = getMemberName(l.memberId).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    let valA: any = a[sortField as keyof Loan];
    let valB: any = b[sortField as keyof Loan];
    
    if (sortField === 'memberName') {
      valA = getMemberName(a.memberId);
      valB = getMemberName(b.memberId);
    }

    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Mock interest rate based on group config or default
      const interestRate = 5; 
      await api.applyForLoan(activeGroupId, { ...applyData, interestRate });
      setIsApplyOpen(false);
      setApplyData({ memberId: '', amount: 0, duration: 1, purpose: '' });
      fetchData();
    } catch (e) {
      console.error(e);
      alert('Application failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (loan: Loan, status: LoanStatus) => {
    if (!window.confirm(`Are you sure you want to ${status} this loan?`)) return;
    try {
      await api.updateLoanStatus(loan.id, status);
      fetchData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleRepay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan) return;
    setSubmitting(true);
    try {
      await api.repayLoan(selectedLoan.id, repayAmount);
      setIsRepayOpen(false);
      fetchData();
    } catch (e) {
      console.error(e);
      alert('Repayment failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <Banknote className="mr-3 text-blue-600" /> {labels.loanManagement}
        </h2>
        <button 
          onClick={() => setIsApplyOpen(true)}
          className="flex items-center px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 shadow-sm transition-colors w-full sm:w-auto justify-center"
        >
          <Plus size={18} className="mr-2" /> {labels.applyLoan}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-sm font-bold text-gray-500 uppercase">{labels.loansActive}</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
               {loans.filter(l => l.status === 'ACTIVE').length}
            </p>
         </div>
         <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-sm font-bold text-gray-500 uppercase">{labels.outstandingLoans}</p>
            <p className="text-3xl font-bold text-slate-800 mt-2">
               {loans.filter(l => l.status === 'ACTIVE').reduce((a,b) => a + b.balance, 0).toLocaleString()} <span className="text-sm text-gray-400">{labels.currency}</span>
            </p>
         </div>
         <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-sm font-bold text-gray-500 uppercase">{labels.pendingApproval}</p>
            <p className="text-3xl font-bold text-orange-500 mt-2">
               {loans.filter(l => l.status === 'PENDING').length}
            </p>
         </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
         <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
               <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
               <input 
                 type="text" 
                 placeholder={labels.search} 
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
                 className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
               />
            </div>
            <div className="flex items-center gap-2">
               <Filter size={18} className="text-gray-400" />
               <select 
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as any)}
                  className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm outline-none"
               >
                  <option value="ALL">{labels.allStatus}</option>
                  <option value={LoanStatus.ACTIVE}>{labels.active}</option>
                  <option value={LoanStatus.PENDING}>{labels.pendingApproval}</option>
                  <option value={LoanStatus.CLEARED}>Cleared</option>
                  <option value={LoanStatus.REJECTED}>{labels.reject}</option>
               </select>
            </div>
         </div>

         {loading ? (
            <div className="p-4 space-y-4">
               {[...Array(5)].map((_, i) => <TableRowSkeleton key={i} />)}
            </div>
         ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                 <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs border-b border-gray-200">
                       <tr>
                          <th className="p-4 cursor-pointer hover:bg-gray-100 group" onClick={() => handleSort('memberName')}>
                             <div className="flex items-center">{labels.members} <SortIcon field="memberName" /></div>
                          </th>
                          <th className="p-4 cursor-pointer hover:bg-gray-100 group" onClick={() => handleSort('startDate')}>
                             <div className="flex items-center">{labels.startDate} <SortIcon field="startDate" /></div>
                          </th>
                          <th className="p-4 cursor-pointer hover:bg-gray-100 group" onClick={() => handleSort('principal')}>
                             <div className="flex items-center">{labels.principal} <SortIcon field="principal" /></div>
                          </th>
                          <th className="p-4">{labels.balance}</th>
                          <th className="p-4 text-center">{labels.status}</th>
                          <th className="p-4">{labels.progress}</th>
                          <th className="p-4 text-right">{labels.actions}</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                       {filteredLoans.length === 0 ? (
                          <tr><td colSpan={7} className="p-8 text-center text-gray-500">{labels.noData}</td></tr>
                       ) : (
                          filteredLoans.map(loan => (
                             <tr key={loan.id} className="hover:bg-gray-50">
                                <td className="p-4 font-bold text-gray-900">{getMemberName(loan.memberId)}</td>
                                <td className="p-4 text-gray-600">{loan.startDate}</td>
                                <td className="p-4 font-mono">{loan.principal.toLocaleString()}</td>
                                <td className="p-4 font-mono font-bold text-blue-600">{loan.balance.toLocaleString()}</td>
                                <td className="p-4 text-center">
                                   <span className={`px-2 py-1 rounded text-xs font-bold ${
                                      loan.status === 'ACTIVE' ? 'bg-blue-100 text-blue-700' :
                                      loan.status === 'PENDING' ? 'bg-orange-100 text-orange-700' :
                                      loan.status === 'CLEARED' ? 'bg-green-100 text-green-700' :
                                      'bg-red-100 text-red-700'
                                   }`}>
                                      {loan.status}
                                   </span>
                                </td>
                                <td className="p-4 w-32">
                                   <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div 
                                        className="bg-green-500 h-2 rounded-full" 
                                        style={{ width: `${Math.min(100, ((loan.totalRepayable - loan.balance) / loan.totalRepayable) * 100)}%` }}
                                      ></div>
                                   </div>
                                </td>
                                <td className="p-4 text-right">
                                   {loan.status === 'PENDING' && (
                                      <div className="flex justify-end gap-2">
                                         <button onClick={() => handleStatusChange(loan, LoanStatus.ACTIVE)} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title={labels.approve}><CheckCircle size={18}/></button>
                                         <button onClick={() => handleStatusChange(loan, LoanStatus.REJECTED)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title={labels.reject}><XCircle size={18}/></button>
                                      </div>
                                   )}
                                   {loan.status === 'ACTIVE' && (
                                      <button 
                                        onClick={() => { setSelectedLoan(loan); setRepayAmount(loan.balance); setIsRepayOpen(true); }}
                                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-bold"
                                      >
                                         Repay
                                      </button>
                                   )}
                                </td>
                             </tr>
                          ))
                       )}
                    </tbody>
                 </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-gray-100">
                 {filteredLoans.map(loan => (
                    <div key={loan.id} className="p-4">
                       <div className="flex justify-between items-start mb-2">
                          <div>
                             <p className="font-bold text-gray-900">{getMemberName(loan.memberId)}</p>
                             <p className="text-xs text-gray-500">{loan.startDate}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                             loan.status === 'ACTIVE' ? 'bg-blue-100 text-blue-700' :
                             loan.status === 'PENDING' ? 'bg-orange-100 text-orange-700' :
                             loan.status === 'CLEARED' ? 'bg-green-100 text-green-700' :
                             'bg-red-100 text-red-700'
                          }`}>
                             {loan.status}
                          </span>
                       </div>
                       <div className="flex justify-between items-center my-3 bg-gray-50 p-2 rounded border border-gray-100">
                          <div>
                             <p className="text-xs text-gray-500 uppercase">{labels.principal}</p>
                             <p className="font-mono font-bold text-gray-800">{loan.principal.toLocaleString()}</p>
                          </div>
                          <div className="text-right">
                             <p className="text-xs text-gray-500 uppercase">{labels.balance}</p>
                             <p className="font-mono font-bold text-blue-600">{loan.balance.toLocaleString()}</p>
                          </div>
                       </div>
                       {loan.status === 'PENDING' && (
                          <div className="flex gap-2">
                             <button onClick={() => handleStatusChange(loan, LoanStatus.ACTIVE)} className="flex-1 py-2 bg-green-50 text-green-700 rounded font-bold text-sm">Approve</button>
                             <button onClick={() => handleStatusChange(loan, LoanStatus.REJECTED)} className="flex-1 py-2 bg-red-50 text-red-700 rounded font-bold text-sm">Reject</button>
                          </div>
                       )}
                       {loan.status === 'ACTIVE' && (
                          <button 
                            onClick={() => { setSelectedLoan(loan); setRepayAmount(loan.balance); setIsRepayOpen(true); }}
                            className="w-full py-2 bg-slate-100 text-slate-700 rounded font-bold text-sm"
                          >
                             Record Repayment
                          </button>
                       )}
                    </div>
                 ))}
              </div>
            </>
         )}
      </div>

      {/* Apply Modal */}
      {isApplyOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
               <h3 className="text-lg font-bold mb-4">{labels.newLoanApp}</h3>
               <form onSubmit={handleApply} className="space-y-4">
                  <div>
                     <label className="block text-sm font-medium mb-1">{labels.members}</label>
                     <select 
                        required
                        className="w-full p-2 border rounded-lg"
                        value={applyData.memberId}
                        onChange={e => setApplyData({...applyData, memberId: e.target.value})}
                     >
                        <option value="">-- Select --</option>
                        {members.filter(m => m.status === 'ACTIVE').map(m => (
                           <option key={m.id} value={m.id}>{m.fullName}</option>
                        ))}
                     </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium mb-1">{labels.amount}</label>
                        <input 
                           type="number" required min="100"
                           className="w-full p-2 border rounded-lg"
                           value={applyData.amount}
                           onChange={e => setApplyData({...applyData, amount: parseInt(e.target.value) || 0})}
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-medium mb-1">{labels.durationMonths}</label>
                        <input 
                           type="number" required min="1" max="12"
                           className="w-full p-2 border rounded-lg"
                           value={applyData.duration}
                           onChange={e => setApplyData({...applyData, duration: parseInt(e.target.value) || 1})}
                        />
                     </div>
                  </div>
                  <div>
                     <label className="block text-sm font-medium mb-1">{labels.purpose}</label>
                     <input 
                        type="text" required
                        className="w-full p-2 border rounded-lg"
                        value={applyData.purpose}
                        onChange={e => setApplyData({...applyData, purpose: e.target.value})}
                     />
                  </div>
                  <div className="flex gap-3 pt-4">
                     <button type="button" onClick={() => setIsApplyOpen(false)} className="flex-1 py-2 border rounded-lg">{labels.cancel}</button>
                     <button type="submit" disabled={submitting} className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold">
                        {submitting ? <Loader2 className="animate-spin inline mr-2"/> : null}
                        {labels.save}
                     </button>
                  </div>
               </form>
            </div>
         </div>
      )}

      {/* Repay Modal */}
      {isRepayOpen && selectedLoan && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
               <h3 className="text-lg font-bold mb-4">{labels.recordRepayment}</h3>
               <p className="text-sm text-gray-500 mb-4">Balance: {selectedLoan.balance.toLocaleString()} RWF</p>
               <form onSubmit={handleRepay} className="space-y-4">
                  <div>
                     <label className="block text-sm font-medium mb-1">{labels.amount}</label>
                     <input 
                        type="number" required min="1" max={selectedLoan.balance}
                        className="w-full p-3 border rounded-lg font-bold text-lg"
                        value={repayAmount}
                        onChange={e => setRepayAmount(parseInt(e.target.value) || 0)}
                        autoFocus
                     />
                  </div>
                  <div className="flex gap-3 pt-2">
                     <button type="button" onClick={() => setIsRepayOpen(false)} className="flex-1 py-2 border rounded-lg">{labels.cancel}</button>
                     <button type="submit" disabled={submitting} className="flex-1 py-2 bg-green-600 text-white rounded-lg font-bold">
                        {submitting ? <Loader2 className="animate-spin inline mr-2"/> : null}
                        {labels.save}
                     </button>
                  </div>
               </form>
            </div>
         </div>
      )}
    </div>
  );
}
