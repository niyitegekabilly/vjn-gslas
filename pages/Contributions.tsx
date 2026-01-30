import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../App';
import { api } from '../api/client';
import { LABELS } from '../constants';
import { Transaction, Member, TransactionType } from '../types';
import { Wallet, Plus, Search, Edit, Ban, Filter, CheckCircle, X, Loader2, Calendar } from 'lucide-react';
import { TableRowSkeleton } from '../components/Skeleton';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';

export default function Contributions() {
  const { activeGroupId, lang, groups } = useContext(AppContext);
  const labels = LABELS[lang];
  const group = groups.find(g => g.id === activeGroupId);

  const [contributions, setContributions] = useState<Transaction[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isVoidOpen, setIsVoidOpen] = useState(false);
  
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Forms
  const [formData, setFormData] = useState({
    memberId: '',
    shareCount: 1,
    solidarityAmount: 0,
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [editData, setEditData] = useState({
    shareCount: 0,
    solidarityAmount: 0,
    reason: ''
  });

  const [voidReason, setVoidReason] = useState('');

  useEffect(() => {
    if (activeGroupId) fetchData();
  }, [activeGroupId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [txs, mems] = await Promise.all([
        api.getContributions(activeGroupId),
        api.getMembers(activeGroupId)
      ]);
      setContributions(txs.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setMembers(mems);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getMemberName = (id?: string) => members.find(m => m.id === id)?.fullName || 'Unknown';

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.addContribution(activeGroupId, { ...formData, recordedBy: 'Admin' }); // Mock user
      setIsAddOpen(false);
      setFormData({
        memberId: '',
        shareCount: 1,
        solidarityAmount: 0,
        date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      fetchData();
    } catch (e) {
      console.error(e);
      alert('Failed to save contribution');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (tx: Transaction) => {
    setSelectedTx(tx);
    setEditData({
      shareCount: tx.shareCount || 0,
      solidarityAmount: tx.solidarityAmount || 0,
      reason: ''
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTx) return;
    setSubmitting(true);
    try {
      await api.updateContribution(selectedTx.id, {
        shareCount: editData.shareCount,
        solidarityAmount: editData.solidarityAmount,
        notes: selectedTx.notes // Keep old notes or add field
      }, 'Admin', editData.reason);
      setIsEditOpen(false);
      fetchData();
    } catch (e) {
      console.error(e);
      alert('Failed to update');
    } finally {
      setSubmitting(false);
    }
  };

  const openVoid = (tx: Transaction) => {
    setSelectedTx(tx);
    setVoidReason('');
    setIsVoidOpen(true);
  };

  const handleVoidSubmit = async () => {
    if (!selectedTx) return;
    setSubmitting(true);
    try {
      await api.voidContribution(selectedTx.id, voidReason, 'Admin');
      setIsVoidOpen(false);
      fetchData();
    } catch (e) {
      console.error(e);
      alert('Failed to void');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = contributions.filter(tx => 
    getMemberName(tx.memberId).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalShares = filtered.reduce((a, b) => a + (b.isVoid ? 0 : (b.amount || 0)), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <Wallet className="mr-3 text-green-600" /> {labels.contributions}
        </h2>
        <button 
          onClick={() => setIsAddOpen(true)}
          className="flex items-center px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 shadow-sm transition-colors"
        >
          <Plus size={18} className="mr-2" /> {labels.newContribution}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-sm font-bold text-gray-500 uppercase">{labels.totalSavings}</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{totalShares.toLocaleString()} <span className="text-sm text-gray-400">{labels.currency}</span></p>
         </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
         <div className="p-4 border-b border-gray-100 flex justify-between items-center gap-4">
            <div className="relative flex-1 max-w-md">
               <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
               <input 
                 type="text" 
                 placeholder={labels.search} 
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
                 className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
               />
            </div>
         </div>

         {loading ? (
            <div className="p-4 space-y-4">
               {[...Array(5)].map((_, i) => <TableRowSkeleton key={i} />)}
            </div>
         ) : (
            <div className="overflow-x-auto">
               <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs border-b border-gray-200">
                     <tr>
                        <th className="p-4">{labels.date}</th>
                        <th className="p-4">{labels.members}</th>
                        <th className="p-4 text-center">{labels.shareCount}</th>
                        <th className="p-4 text-right">{labels.amount}</th>
                        <th className="p-4 text-right">{labels.solidarity}</th>
                        <th className="p-4">{labels.status}</th>
                        <th className="p-4 text-right">{labels.actions}</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                     {filtered.length === 0 ? (
                        <tr><td colSpan={7} className="p-8 text-center text-gray-500">{labels.noData}</td></tr>
                     ) : (
                        filtered.map(tx => (
                           <tr key={tx.id} className={`hover:bg-gray-50 ${tx.isVoid ? 'bg-red-50/50 opacity-60' : ''}`}>
                              <td className="p-4 text-gray-600 font-medium">{tx.date}</td>
                              <td className="p-4 font-bold text-gray-900">{getMemberName(tx.memberId)}</td>
                              <td className="p-4 text-center">
                                 <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-bold text-xs">{tx.shareCount}</span>
                              </td>
                              <td className="p-4 text-right font-mono font-medium">{tx.amount.toLocaleString()}</td>
                              <td className="p-4 text-right text-gray-500">{tx.solidarityAmount?.toLocaleString() || '-'}</td>
                              <td className="p-4">
                                 {tx.isVoid ? (
                                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-bold">VOID</span>
                                 ) : (
                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold flex items-center w-fit">
                                       <CheckCircle size={12} className="mr-1"/> OK
                                    </span>
                                 )}
                              </td>
                              <td className="p-4 text-right">
                                 {!tx.isVoid && (
                                    <div className="flex justify-end gap-2">
                                       <button onClick={() => openEdit(tx)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title={labels.edit}><Edit size={16}/></button>
                                       <button onClick={() => openVoid(tx)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title={labels.void}><Ban size={16}/></button>
                                    </div>
                                 )}
                              </td>
                           </tr>
                        ))
                     )}
                  </tbody>
               </table>
            </div>
         )}
      </div>

      {/* Add Modal */}
      {isAddOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
               <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                  <h3 className="text-lg font-bold text-gray-800">{labels.newContribution}</h3>
                  <button onClick={() => setIsAddOpen(false)}><X className="text-gray-400 hover:text-gray-600" /></button>
               </div>
               <form onSubmit={handleAddSubmit} className="space-y-4">
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">{labels.members}</label>
                     <select 
                        required
                        value={formData.memberId}
                        onChange={e => setFormData({...formData, memberId: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white"
                     >
                        <option value="">-- {labels.selectMember} --</option>
                        {members.filter(m => m.status === 'ACTIVE').map(m => (
                           <option key={m.id} value={m.id}>{m.fullName}</option>
                        ))}
                     </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{labels.shareCount}</label>
                        <input 
                           type="number"
                           min="1"
                           max={group?.maxShares}
                           required
                           value={formData.shareCount}
                           onChange={e => setFormData({...formData, shareCount: parseInt(e.target.value) || 0})}
                           className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white"
                        />
                        <p className="text-xs text-gray-500 mt-1">Value: {(formData.shareCount * (group?.shareValue || 0)).toLocaleString()} {labels.currency}</p>
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{labels.solidarity}</label>
                        <input 
                           type="number"
                           min="0"
                           value={formData.solidarityAmount}
                           onChange={e => setFormData({...formData, solidarityAmount: parseInt(e.target.value) || 0})}
                           className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white"
                        />
                     </div>
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">{labels.date}</label>
                     <input 
                        type="date"
                        required
                        value={formData.date}
                        onChange={e => setFormData({...formData, date: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white"
                     />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">{labels.notes}</label>
                     <textarea 
                        rows={2}
                        value={formData.notes}
                        onChange={e => setFormData({...formData, notes: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white"
                     />
                  </div>
                  <div className="pt-2">
                     <button type="submit" disabled={submitting} className="w-full py-3 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-900 flex justify-center items-center">
                        {submitting ? <Loader2 className="animate-spin" size={20}/> : labels.save}
                     </button>
                  </div>
               </form>
            </div>
         </div>
      )}

      {/* Edit Modal */}
      {isEditOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
               <h3 className="text-lg font-bold text-gray-800 mb-4">{labels.edit}</h3>
               <form onSubmit={handleEditSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{labels.shareCount}</label>
                        <input 
                           type="number" min="1"
                           value={editData.shareCount}
                           onChange={e => setEditData({...editData, shareCount: parseInt(e.target.value) || 0})}
                           className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{labels.solidarity}</label>
                        <input 
                           type="number" min="0"
                           value={editData.solidarityAmount}
                           onChange={e => setEditData({...editData, solidarityAmount: parseInt(e.target.value) || 0})}
                           className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                        />
                     </div>
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">{labels.reason} <span className="text-red-500">*</span></label>
                     <textarea 
                        required
                        value={editData.reason}
                        onChange={e => setEditData({...editData, reason: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                        placeholder="Audit reason..."
                     />
                  </div>
                  <div className="flex gap-2 pt-2">
                     <button type="button" onClick={() => setIsEditOpen(false)} className="flex-1 py-2 border rounded-lg hover:bg-gray-50">{labels.cancel}</button>
                     <button type="submit" disabled={submitting} className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold">{labels.save}</button>
                  </div>
               </form>
            </div>
         </div>
      )}

      <DeleteConfirmDialog 
         isOpen={isVoidOpen}
         title="Void Transaction"
         description={
            <div className="space-y-3">
               <p>{labels.voidConfirm}</p>
               <textarea 
                  required
                  value={voidReason}
                  onChange={e => setVoidReason(e.target.value)}
                  className="w-full p-2 border border-red-200 rounded bg-red-50 text-sm focus:outline-none focus:border-red-400"
                  placeholder="Reason for voiding..."
                  rows={2}
               />
            </div>
         }
         onConfirm={handleVoidSubmit}
         onCancel={() => setIsVoidOpen(false)}
         confirmLabel={labels.void}
         isDeleting={submitting}
         variant="danger"
      />
    </div>
  );
}
