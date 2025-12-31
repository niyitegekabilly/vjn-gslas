
import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../App';
import { api } from '../api/client';
import { LABELS } from '../constants';
import { Transaction, Member, MemberStatus, AuditRecord, UserRole } from '../types';
import { PiggyBank, Search, Loader2, Plus, Filter, MoreVertical, AlertTriangle, History, XCircle, Edit, Save, X, Ban, TrendingUp, ShieldCheck, MessageSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Skeleton, TableRowSkeleton } from '../components/Skeleton';

export default function Contributions() {
  const { activeGroupId, lang, groups } = useContext(AppContext);
  const labels = LABELS[lang];
  const { user } = useAuth();
  const group = groups.find(g => g.id === activeGroupId);
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  
  // View State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'VOID' | 'EDITED'>('ALL');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);

  // Active Item State
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [sendingSmsId, setSendingSmsId] = useState<string | null>(null);

  // Forms Data
  const [formData, setFormData] = useState({
    memberId: '',
    shareCount: 1,
    solidarityAmount: 0,
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'CASH',
    notes: ''
  });

  const [editData, setEditData] = useState({
    shareCount: 0,
    solidarityAmount: 0,
    notes: '',
    reason: ''
  });
  
  const [voidReason, setVoidReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canEdit = user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ADMIN || user?.role === UserRole.GROUP_LEADER;

  // --- Initial Data Load ---
  const fetchData = () => {
    if (!activeGroupId) return;
    setLoading(true);
    Promise.all([
      api.getContributions(activeGroupId),
      api.getMembers(activeGroupId)
    ]).then(([t, m]) => {
      setTransactions(t.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setMembers(m);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchData();
  }, [activeGroupId]);

  // --- Handlers ---

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.addContribution(activeGroupId, {
        ...formData,
        recordedBy: 'CURRENT_USER' // In real app, get from auth context
      });
      setIsAddModalOpen(false);
      resetForms();
      fetchData();
    } catch (error: any) {
      alert(error.message || 'Error creating contribution');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditInit = (tx: Transaction) => {
    setSelectedTx(tx);
    setEditData({
      shareCount: tx.shareCount || 0,
      solidarityAmount: tx.solidarityAmount || 0,
      notes: tx.notes || '',
      reason: ''
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTx) return;
    setSubmitting(true);
    try {
      await api.updateContribution(
        selectedTx.id, 
        {
          shareCount: Number(editData.shareCount),
          solidarityAmount: Number(editData.solidarityAmount),
          notes: editData.notes
        },
        'CURRENT_USER',
        editData.reason
      );
      setIsEditModalOpen(false);
      fetchData();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVoidInit = (tx: Transaction) => {
    setSelectedTx(tx);
    setVoidReason('');
    setIsVoidModalOpen(true);
  };

  const handleVoidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTx) return;
    setSubmitting(true);
    try {
      await api.voidContribution(selectedTx.id, voidReason, 'CURRENT_USER');
      setIsVoidModalOpen(false);
      fetchData();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendSMS = async (tx: Transaction) => {
    if (sendingSmsId) return;
    const member = members.find(m => m.id === tx.memberId);
    if (!member || !member.phone) {
        alert("Member phone number not available.");
        return;
    }
    
    setSendingSmsId(tx.id);
    const amount = (tx.amount || 0) + (tx.solidarityAmount || 0);
    const message = `VJN Receipt: Received ${amount.toLocaleString()} RWF on ${tx.date} for Savings. Balance: ${(member.totalShares * (group?.shareValue || 0)).toLocaleString()} RWF. Thank you!`;
    
    try {
        await api.sendSMS(member.phone, message);
        alert(`Receipt sent to ${member.phone}`);
    } catch (e) {
        alert("Failed to send SMS.");
    } finally {
        setSendingSmsId(null);
    }
  };

  const resetForms = () => {
    setFormData({
      memberId: '',
      shareCount: group?.minShares || 1,
      solidarityAmount: 0,
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'CASH',
      notes: ''
    });
    setEditData({ shareCount: 0, solidarityAmount: 0, notes: '', reason: '' });
    setVoidReason('');
  };

  const getMemberName = (id?: string) => members.find(m => m.id === id)?.fullName || 'Unknown Member';

  // Filtering
  const filtered = transactions.filter(t => {
    const matchesSearch = getMemberName(t.memberId).toLowerCase().includes(searchTerm.toLowerCase()) || t.date.includes(searchTerm);
    if (!matchesSearch) return false;
    
    if (filterType === 'VOID') return t.isVoid;
    if (filterType === 'EDITED') return t.editHistory && t.editHistory.length > 0;
    return true;
  });

  const activeMembers = members.filter(m => m.status === MemberStatus.ACTIVE);

  // Pot Calculations (Non-voided only)
  const validTransactions = transactions.filter(t => !t.isVoid);
  const totalShareCapital = validTransactions.reduce((acc, t) => acc + (t.amount || 0), 0);
  const totalSocialFund = validTransactions.reduce((acc, t) => acc + (t.solidarityAmount || 0), 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-10 w-40 rounded-lg" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-emerald-100 flex items-center justify-between">
             <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-3 w-24" />
             </div>
             <Skeleton className="h-12 w-12 rounded-full" />
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-orange-100 flex items-center justify-between">
             <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-3 w-24" />
             </div>
             <Skeleton className="h-12 w-12 rounded-full" />
          </div>
        </div>

        <Skeleton className="h-16 w-full rounded-xl" />

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {[...Array(5)].map((_, i) => <TableRowSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{labels.sharesLedger}</h2>
          <p className="text-sm text-gray-500">{labels.strictRecording}</p>
        </div>
        {canEdit && (
          <button 
            onClick={() => { resetForms(); setIsAddModalOpen(true); }}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-sm transition"
          >
            <Plus size={18} className="mr-2" />
            {labels.newContribution}
          </button>
        )}
      </div>

      {/* Pots Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-emerald-100 flex items-center justify-between">
           <div>
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Share Capital (Investment)</p>
              <h3 className="text-2xl font-bold text-gray-900">{totalShareCapital.toLocaleString()} {labels.currency}</h3>
              <p className="text-xs text-gray-400 mt-1">Refundable at cycle end</p>
           </div>
           <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full">
              <TrendingUp size={24} />
           </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-orange-100 flex items-center justify-between">
           <div>
              <p className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-1">Social Fund (Insurance)</p>
              <h3 className="text-2xl font-bold text-gray-900">{totalSocialFund.toLocaleString()} {labels.currency}</h3>
              <p className="text-xs text-gray-400 mt-1">Non-refundable pot</p>
           </div>
           <div className="p-3 bg-orange-50 text-orange-600 rounded-full">
              <ShieldCheck size={24} />
           </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
         <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder={labels.search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
         </div>
         <div className="flex gap-2">
            <button 
              onClick={() => setFilterType('ALL')}
              className={`px-4 py-2 rounded-lg text-sm font-medium border ${filterType === 'ALL' ? 'bg-gray-100 border-gray-300 text-gray-900' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
            >
              All
            </button>
            <button 
              onClick={() => setFilterType('EDITED')}
              className={`px-4 py-2 rounded-lg text-sm font-medium border ${filterType === 'EDITED' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
            >
              Edited
            </button>
            <button 
              onClick={() => setFilterType('VOID')}
              className={`px-4 py-2 rounded-lg text-sm font-medium border ${filterType === 'VOID' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
            >
              Voided
            </button>
         </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b border-gray-200">
              <tr>
                <th className="p-4">{labels.date}</th>
                <th className="p-4">{labels.members}</th>
                <th className="p-4 text-center">{labels.shareCount}</th>
                <th className="p-4 text-right">Share Capital</th>
                <th className="p-4 text-right">Social Fund</th>
                <th className="p-4 text-right">Total In</th>
                <th className="p-4">{labels.status}</th>
                <th className="p-4 text-right">{labels.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                 <tr><td colSpan={8} className="p-8 text-center text-gray-500">{labels.noData}</td></tr>
              ) : (
                filtered.map(t => (
                  <tr key={t.id} className={`hover:bg-gray-50 ${t.isVoid ? 'bg-red-50/50' : ''}`}>
                    <td className="p-4 text-gray-500 text-sm whitespace-nowrap">{t.date}</td>
                    <td className="p-4 font-medium text-gray-900">{getMemberName(t.memberId)}</td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-100">
                         {t.shareCount}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600 text-sm text-right">{(t.amount).toLocaleString()}</td>
                    <td className="p-4 text-gray-600 text-sm text-right">{(t.solidarityAmount || 0).toLocaleString()}</td>
                    <td className="p-4 font-mono font-bold text-gray-800 text-right">
                      {(t.amount + (t.solidarityAmount || 0)).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        {t.isVoid && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800">
                            VOID
                          </span>
                        )}
                        {t.editHistory && t.editHistory.length > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800">
                            EDITED
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      {!t.isVoid && canEdit && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleSendSMS(t)}
                            disabled={sendingSmsId === t.id}
                            className="p-1.5 text-gray-400 hover:text-green-600 rounded-md hover:bg-green-50"
                            title="Send SMS Receipt"
                          >
                            {sendingSmsId === t.id ? <Loader2 size={16} className="animate-spin" /> : <MessageSquare size={16} />}
                          </button>
                          <button 
                            onClick={() => handleEditInit(t)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50"
                            title={labels.edit}
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => handleVoidInit(t)}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50"
                            title={labels.void}
                          >
                            <Ban size={16} />
                          </button>
                        </div>
                      )}
                      {(t.isVoid || (t.editHistory && t.editHistory.length > 0)) && (
                         <button 
                           onClick={() => { setSelectedTx(t); setIsHistoryModalOpen(true); }}
                           className="text-xs text-blue-600 hover:underline mt-1 block w-full text-right"
                         >
                           {labels.viewHistory}
                         </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
             <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
               <h3 className="font-bold text-gray-800 flex items-center">
                 <Plus size={20} className="mr-2 text-green-600" /> {labels.newContribution}
               </h3>
               <button onClick={() => setIsAddModalOpen(false)}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
             </div>
             
             <form onSubmit={handleCreate} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{labels.members}</label>
                  <select 
                    required
                    value={formData.memberId}
                    onChange={e => setFormData({...formData, memberId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  >
                    <option value="">-- Select --</option>
                    {activeMembers.map(m => (
                      <option key={m.id} value={m.id}>{m.fullName}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {/* Pot 1: Shares */}
                   <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                     <h4 className="text-sm font-bold text-emerald-800 mb-3 flex items-center"><TrendingUp size={16} className="mr-2"/> Share Capital</h4>
                     <label className="block text-xs font-medium text-gray-600 mb-1">{labels.shareCount}</label>
                     <input 
                       type="number"
                       min="0"
                       max={group?.maxShares}
                       value={formData.shareCount}
                       onChange={e => setFormData({...formData, shareCount: parseInt(e.target.value) || 0})}
                       className="w-full px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                     />
                     <p className="text-xs text-emerald-600 mt-2 font-bold text-right">
                       = {(formData.shareCount * (group?.shareValue || 0)).toLocaleString()} {labels.currency}
                     </p>
                   </div>
                   
                   {/* Pot 2: Social Fund */}
                   <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                     <h4 className="text-sm font-bold text-orange-800 mb-3 flex items-center"><ShieldCheck size={16} className="mr-2"/> Social Fund</h4>
                     <label className="block text-xs font-medium text-gray-600 mb-1">{labels.amount} ({labels.currency})</label>
                     <input 
                       type="number"
                       min="0"
                       value={formData.solidarityAmount}
                       onChange={e => setFormData({...formData, solidarityAmount: parseInt(e.target.value) || 0})}
                       className="w-full px-3 py-2 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                     />
                     <p className="text-xs text-orange-600 mt-2 text-right">Insurance Contribution</p>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{labels.date}</label>
                      <input 
                        type="date"
                        value={formData.date}
                        onChange={e => setFormData({...formData, date: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
                      <select 
                        value={formData.paymentMethod}
                        onChange={e => setFormData({...formData, paymentMethod: e.target.value as any})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="CASH">Cash</option>
                        <option value="MOBILE_MONEY">Mobile Money</option>
                      </select>
                   </div>
                </div>

                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">{labels.notes}</label>
                   <input 
                     type="text"
                     value={formData.notes}
                     onChange={e => setFormData({...formData, notes: e.target.value})}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                   />
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end">
                   <button 
                     type="submit" 
                     disabled={submitting || (formData.shareCount === 0 && formData.solidarityAmount === 0)}
                     className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center disabled:opacity-50"
                   >
                     {submitting ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save className="mr-2" size={18} />}
                     {labels.save}
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditModalOpen && selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 border-t-4 border-amber-500">
             <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-amber-50">
               <h3 className="font-bold text-amber-900 flex items-center">
                 <Edit size={20} className="mr-2" /> {labels.edit}
               </h3>
               <button onClick={() => setIsEditModalOpen(false)}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
             </div>
             
             <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                <div className="bg-amber-50 p-3 rounded-lg text-xs text-amber-800 border border-amber-100 mb-4">
                   <strong>{labels.warning}:</strong> {labels.auditWarning}
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Share Capital</label>
                     <input 
                       type="number"
                       min="0"
                       max={group?.maxShares}
                       value={editData.shareCount}
                       onChange={e => setEditData({...editData, shareCount: parseInt(e.target.value) || 0})}
                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Social Fund</label>
                     <input 
                       type="number"
                       min="0"
                       value={editData.solidarityAmount}
                       onChange={e => setEditData({...editData, solidarityAmount: parseInt(e.target.value) || 0})}
                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                     />
                   </div>
                </div>

                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">{labels.reason} <span className="text-red-500">*</span></label>
                   <textarea 
                     required
                     value={editData.reason}
                     onChange={e => setEditData({...editData, reason: e.target.value})}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                     rows={2}
                   />
                </div>

                <div className="pt-4 flex justify-end">
                   <button 
                     type="submit" 
                     disabled={submitting || !editData.reason}
                     className="px-6 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 flex items-center disabled:opacity-50"
                   >
                     {submitting ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save className="mr-2" size={18} />}
                     {labels.save}
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* VOID MODAL */}
      {isVoidModalOpen && selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 border-t-4 border-red-500">
             <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-red-50">
               <h3 className="font-bold text-red-900 flex items-center">
                 <Ban size={20} className="mr-2" /> {labels.void}
               </h3>
               <button onClick={() => setIsVoidModalOpen(false)}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
             </div>
             
             <form onSubmit={handleVoidSubmit} className="p-6 space-y-4">
                <p className="text-sm text-gray-600">
                  {labels.voidConfirm} <strong>{(selectedTx.amount + (selectedTx.solidarityAmount || 0)).toLocaleString()} {labels.currency}</strong>?
                </p>

                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">{labels.reason} <span className="text-red-500">*</span></label>
                   <textarea 
                     required
                     value={voidReason}
                     onChange={e => setVoidReason(e.target.value)}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                     rows={3}
                   />
                </div>

                <div className="pt-2 flex justify-end">
                   <button 
                     type="submit" 
                     disabled={submitting || !voidReason}
                     className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 flex items-center disabled:opacity-50"
                   >
                     {submitting ? <Loader2 className="animate-spin mr-2" size={18} /> : <XCircle className="mr-2" size={18} />}
                     {labels.confirm}
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* HISTORY MODAL */}
      {isHistoryModalOpen && selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                 <h3 className="font-bold text-gray-800 flex items-center">
                    <History size={20} className="mr-2 text-blue-600" /> {labels.auditLogs}
                 </h3>
                 <button onClick={() => setIsHistoryModalOpen(false)}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
              </div>
              <div className="p-0 max-h-96 overflow-y-auto bg-gray-50">
                {selectedTx.isVoid && (
                   <div className="p-4 bg-red-50 border-b border-red-100">
                      <p className="text-xs font-bold text-red-800 uppercase mb-1">{labels.status}: VOID</p>
                      <p className="text-sm text-red-900 font-medium">{labels.reason}: {selectedTx.voidReason}</p>
                   </div>
                )}
                
                {(!selectedTx.editHistory || selectedTx.editHistory.length === 0) ? (
                   <div className="p-8 text-center text-gray-400">{labels.noData}</div>
                ) : (
                   <ul className="divide-y divide-gray-200">
                      {[...selectedTx.editHistory].reverse().map((audit: AuditRecord) => (
                         <li key={audit.id} className="p-4 bg-white">
                            <div className="flex justify-between items-start mb-2">
                               <span className="text-xs font-bold text-gray-500">{new Date(audit.date).toLocaleString()}</span>
                               <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{audit.editorId}</span>
                            </div>
                            <p className="text-sm font-semibold text-gray-800 mb-2">"{audit.reason}"</p>
                            <div className="space-y-1">
                               {audit.changes.map((change, idx) => (
                                  <div key={idx} className="text-xs grid grid-cols-3 gap-2 border-l-2 border-blue-200 pl-2">
                                     <span className="text-gray-500 uppercase font-medium">{change.field}</span>
                                     <span className="text-red-500 line-through text-right">{String(change.oldValue)}</span>
                                     <span className="text-green-600 font-bold text-right">{String(change.newValue)}</span>
                                  </div>
                               ))}
                            </div>
                         </li>
                      ))}
                   </ul>
                )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
