<<<<<<< HEAD
=======

>>>>>>> 7c17f3ba72aad7656a6b64c3bf0bfbc90a688a2a
import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../App';
import { api } from '../api/client';
import { LABELS } from '../constants';
<<<<<<< HEAD
import { Fine, FineCategory, Member, FineStatus } from '../types';
import { Gavel, Plus, Search, Edit, Trash2, CheckCircle, Ban, Filter, AlertTriangle, Loader2, X, Settings as SettingsIcon } from 'lucide-react';
import { TableRowSkeleton } from '../components/Skeleton';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';

export default function Fines() {
  const { activeGroupId, lang } = useContext(AppContext);
  const labels = LABELS[lang];
=======
import { Fine, FineCategory, Member, FineStatus, UserRole } from '../types';
import { Gavel, Search, Plus, Loader2, CheckCircle, AlertTriangle, X, DollarSign, Edit, Archive, History, Shield, Tag, Download } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Skeleton, TableRowSkeleton } from '../components/Skeleton';

export default function Fines() {
  const { activeGroupId, lang, groups } = useContext(AppContext);
  const labels = LABELS[lang];
  const { user } = useAuth();
  const group = groups.find(g => g.id === activeGroupId);
>>>>>>> 7c17f3ba72aad7656a6b64c3bf0bfbc90a688a2a

  const [fines, setFines] = useState<Fine[]>([]);
  const [categories, setCategories] = useState<FineCategory[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
<<<<<<< HEAD
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNPAID' | 'PAID'>('ALL');
=======
  
  // View State
  const [view, setView] = useState<'LIST' | 'CATEGORIES'>('LIST');
  const [filter, setFilter] = useState<'ALL' | 'UNPAID' | 'PAID' | 'VOID'>('UNPAID');
  const [searchTerm, setSearchTerm] = useState('');
>>>>>>> 7c17f3ba72aad7656a6b64c3bf0bfbc90a688a2a

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isVoidOpen, setIsVoidOpen] = useState(false);
<<<<<<< HEAD
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  const [selectedFine, setSelectedFine] = useState<Fine | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Forms
  const [createData, setCreateData] = useState({
    memberId: '',
    categoryId: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    reason: ''
  });

  const [editData, setEditData] = useState({
    amount: 0,
    categoryId: '',
    reason: '' // audit
  });

  const [payAmount, setPayAmount] = useState(0);
  const [newCatName, setNewCatName] = useState('');
  const [newCatAmount, setNewCatAmount] = useState(500);

  useEffect(() => {
    if (activeGroupId) fetchData();
  }, [activeGroupId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [f, c, m] = await Promise.all([
        api.getFines(activeGroupId),
        api.getFineCategories(activeGroupId),
        api.getMembers(activeGroupId)
      ]);
      setFines(f.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setCategories(c);
      setMembers(m);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getMemberName = (id: string) => members.find(m => m.id === id)?.fullName || 'Unknown';
  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || 'Custom';

=======
  
  const [selectedFine, setSelectedFine] = useState<Fine | null>(null);
  
  // Create Form
  const [createData, setCreateData] = useState({ memberId: '', categoryId: '', amount: 0, date: new Date().toISOString().split('T')[0], reason: '' });
  
  // Pay Form
  const [payAmount, setPayAmount] = useState<number>(0);
  
  // Edit Form
  const [editData, setEditData] = useState({ amount: 0, categoryId: '', reason: '' });

  // Category Form
  const [newCatName, setNewCatName] = useState('');
  const [newCatAmount, setNewCatAmount] = useState(0);

  const [submitting, setSubmitting] = useState(false);

  const canEdit = user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ADMIN || user?.role === UserRole.GROUP_LEADER;

  const fetchData = () => {
    if (!activeGroupId) return;
    setLoading(true);
    Promise.all([
      api.getFines(activeGroupId),
      api.getMembers(activeGroupId),
      api.getFineCategories(activeGroupId)
    ]).then(([f, m, c]) => {
      setFines(f.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setMembers(m);
      setCategories(c);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchData();
  }, [activeGroupId]);

  // Actions
>>>>>>> 7c17f3ba72aad7656a6b64c3bf0bfbc90a688a2a
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
<<<<<<< HEAD
      await api.createFine(activeGroupId, { ...createData, recordedBy: 'Admin' });
      setIsCreateOpen(false);
      setCreateData({
        memberId: '',
        categoryId: '',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        reason: ''
      });
      fetchData();
    } catch (e) {
      console.error(e);
      alert("Failed to create fine");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;
    try {
      await api.addFineCategory(activeGroupId, newCatName, newCatAmount);
      setNewCatName('');
      setNewCatAmount(500);
      const c = await api.getFineCategories(activeGroupId);
      setCategories(c);
    } catch (e) {
      console.error(e);
    }
  };

  const openPay = (fine: Fine) => {
    setSelectedFine(fine);
    setPayAmount(fine.amount - fine.paidAmount);
    setIsPayOpen(true);
=======
       await api.createFine(activeGroupId, { ...createData, recordedBy: 'CURRENT_USER' });
       setIsCreateOpen(false);
       setCreateData({ memberId: '', categoryId: '', amount: 0, date: new Date().toISOString().split('T')[0], reason: '' });
       fetchData();
    } catch (e: any) { alert(e.message); }
    setSubmitting(false);
>>>>>>> 7c17f3ba72aad7656a6b64c3bf0bfbc90a688a2a
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
<<<<<<< HEAD
    if (!selectedFine) return;
    setSubmitting(true);
    try {
      await api.payFine(selectedFine.id, payAmount, 'CASH', 'Admin');
      setIsPayOpen(false);
      fetchData();
    } catch (e) {
      console.error(e);
      alert("Payment failed");
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (fine: Fine) => {
    setSelectedFine(fine);
    setEditData({
      amount: fine.amount,
      categoryId: fine.categoryId,
      reason: ''
    });
    setIsEditOpen(true);
=======
    if(!selectedFine) return;
    setSubmitting(true);
    try {
      await api.payFine(selectedFine.id, payAmount, 'CASH', 'CURRENT_USER');
      setIsPayOpen(false);
      fetchData();
    } catch (e: any) { alert(e.message); }
    setSubmitting(false);
>>>>>>> 7c17f3ba72aad7656a6b64c3bf0bfbc90a688a2a
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
<<<<<<< HEAD
    if (!selectedFine) return;
    setSubmitting(true);
    try {
      await api.updateFine(selectedFine.id, {
        amount: editData.amount,
        categoryId: editData.categoryId
      }, 'Admin', editData.reason);
      setIsEditOpen(false);
      fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const openVoid = (fine: Fine) => {
    setSelectedFine(fine);
    setEditData({ ...editData, reason: '' }); // Reuse reason field
    setIsVoidOpen(true);
  };

  const handleVoid = async () => {
    if (!selectedFine) return;
    setSubmitting(true);
    try {
      await api.voidFine(selectedFine.id, editData.reason, 'Admin');
      setIsVoidOpen(false);
      fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredFines = fines.filter(f => {
    const matchesSearch = getMemberName(f.memberId).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || (statusFilter === 'UNPAID' ? f.status === 'UNPAID' || f.status === 'PARTIALLY_PAID' : f.status === 'PAID');
    return matchesSearch && matchesStatus;
  });

  const totalUnpaid = filteredFines.filter(f => f.status !== 'VOID').reduce((acc, f) => acc + (f.amount - f.paidAmount), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <Gavel className="mr-3 text-orange-600" /> {labels.fines}
        </h2>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsCategoryOpen(true)}
            className="flex items-center px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 shadow-sm"
          >
            <SettingsIcon size={18} className="mr-2" /> {labels.manageCategories}
          </button>
          <button 
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 shadow-sm"
          >
            <Plus size={18} className="mr-2" /> {labels.recordFine}
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
         <div>
            <p className="text-sm font-bold text-gray-500 uppercase">{labels.outstandingFines}</p>
            <p className="text-3xl font-bold text-red-600 mt-2">{totalUnpaid.toLocaleString()} {labels.currency}</p>
         </div>
         <div className="p-3 bg-red-50 rounded-full text-red-600">
            <AlertTriangle size={24} />
         </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
         <div className="p-4 border-b border-gray-100 flex gap-4">
            <div className="relative flex-1">
               <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
               <input 
                 type="text" 
                 placeholder={labels.search} 
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
                 className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
               />
            </div>
            <select 
               value={statusFilter}
               onChange={e => setStatusFilter(e.target.value as any)}
               className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm outline-none"
            >
               <option value="ALL">{labels.all}</option>
               <option value="UNPAID">{labels.outstandingFines}</option>
               <option value="PAID">{labels.collectedSeason}</option>
            </select>
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
                        <th className="p-4">{labels.type}</th>
                        <th className="p-4 text-right">{labels.amount}</th>
                        <th className="p-4 text-right">Paid</th>
                        <th className="p-4">{labels.status}</th>
                        <th className="p-4 text-right">{labels.actions}</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                     {filteredFines.length === 0 ? (
                        <tr><td colSpan={7} className="p-8 text-center text-gray-500">{labels.noData}</td></tr>
                     ) : (
                        filteredFines.map(fine => (
                           <tr key={fine.id} className={`hover:bg-gray-50 ${fine.status === 'VOID' ? 'bg-red-50/50 opacity-60' : ''}`}>
                              <td className="p-4 text-gray-600">{fine.date}</td>
                              <td className="p-4 font-bold text-gray-900">{getMemberName(fine.memberId)}</td>
                              <td className="p-4">
                                 <span className="bg-gray-100 px-2 py-1 rounded text-xs font-medium text-gray-700">{getCategoryName(fine.categoryId)}</span>
                              </td>
                              <td className="p-4 text-right font-mono">{fine.amount.toLocaleString()}</td>
                              <td className="p-4 text-right text-green-600 font-medium">{fine.paidAmount.toLocaleString()}</td>
                              <td className="p-4">
                                 <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                    fine.status === 'PAID' ? 'bg-green-100 text-green-700' : 
                                    fine.status === 'VOID' ? 'bg-gray-200 text-gray-700' :
                                    'bg-red-100 text-red-700'
                                 }`}>
                                    {fine.status}
                                 </span>
                              </td>
                              <td className="p-4 text-right">
                                 {fine.status !== 'VOID' && fine.status !== 'PAID' && (
                                    <div className="flex justify-end gap-2">
                                       <button onClick={() => openPay(fine)} className="p-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded font-bold text-xs">Pay</button>
                                       <button onClick={() => openEdit(fine)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit size={16}/></button>
                                       <button onClick={() => openVoid(fine)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Ban size={16}/></button>
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

      {/* Category Manager Modal */}
      {isCategoryOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in zoom-in-95">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
               <div className="flex justify-between mb-4">
                  <h3 className="font-bold text-lg">{labels.manageCategories}</h3>
                  <button onClick={() => setIsCategoryOpen(false)}><X className="text-gray-400" /></button>
               </div>
               <form onSubmit={handleAddCategory} className="flex gap-2 mb-4">
                  <input 
                     className="flex-1 p-2 border rounded-lg bg-white" 
                     placeholder={labels.categoryName}
                     value={newCatName}
                     onChange={e => setNewCatName(e.target.value)}
                     required
                  />
                  <input 
                     type="number"
                     className="w-24 p-2 border rounded-lg bg-white" 
                     placeholder="Amt"
                     value={newCatAmount}
                     onChange={e => setNewCatAmount(parseInt(e.target.value))}
                     required
                  />
                  <button className="px-3 bg-slate-800 text-white rounded-lg text-sm font-bold">Add</button>
               </form>
               <div className="space-y-2 max-h-60 overflow-y-auto">
                  {categories.map(c => (
                     <div key={c.id} className="flex justify-between items-center p-2 bg-gray-50 rounded border border-gray-100">
                        <span className="font-medium">{c.name}</span>
                        <span className="text-sm text-gray-500">{c.defaultAmount.toLocaleString()} RWF</span>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      )}

      {/* Create Modal */}
      {isCreateOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in zoom-in-95">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
               <h3 className="font-bold text-lg mb-4">{labels.recordFine}</h3>
               <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">{labels.members}</label>
                     <select 
                        required
                        className="w-full p-2 border rounded-lg bg-white"
                        value={createData.memberId}
                        onChange={e => setCreateData({...createData, memberId: e.target.value})}
                     >
                        <option value="">-- Select --</option>
                        {members.filter(m => m.status === 'ACTIVE').map(m => (
                           <option key={m.id} value={m.id}>{m.fullName}</option>
                        ))}
                     </select>
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">{labels.type}</label>
                     <select 
                        required
                        className="w-full p-2 border rounded-lg bg-white"
                        value={createData.categoryId}
                        onChange={e => {
                           const c = categories.find(cat => cat.id === e.target.value);
                           setCreateData({...createData, categoryId: e.target.value, amount: c ? c.defaultAmount : 0});
                        }}
                     >
                        <option value="">-- Select --</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name} ({c.defaultAmount})</option>)}
                     </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{labels.amount}</label>
                        <input 
                           type="number"
                           className="w-full p-2 border rounded-lg bg-white"
                           value={createData.amount}
                           onChange={e => setCreateData({...createData, amount: parseInt(e.target.value) || 0})}
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{labels.date}</label>
                        <input 
                           type="date"
                           className="w-full p-2 border rounded-lg bg-white"
                           value={createData.date}
                           onChange={e => setCreateData({...createData, date: e.target.value})}
                        />
                     </div>
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">{labels.reason} / Details</label>
                     <input 
                        className="w-full p-2 border rounded-lg bg-white"
                        value={createData.reason}
                        onChange={e => setCreateData({...createData, reason: e.target.value})}
                     />
                  </div>
                  <div className="flex gap-3 pt-2">
                     <button type="button" onClick={() => setIsCreateOpen(false)} className="flex-1 py-2 border rounded-lg">{labels.cancel}</button>
                     <button type="submit" disabled={submitting} className="flex-1 py-2 bg-slate-800 text-white rounded-lg font-bold flex justify-center items-center">
                        {submitting ? <Loader2 className="animate-spin" size={18}/> : labels.save}
                     </button>
                  </div>
               </form>
            </div>
         </div>
      )}

      {/* Pay Modal */}
      {isPayOpen && selectedFine && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in zoom-in-95">
            <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
               <h3 className="font-bold text-lg mb-4">{labels.payFine}</h3>
               <p className="text-sm text-gray-600 mb-4">Member: <span className="font-bold">{getMemberName(selectedFine.memberId)}</span></p>
               <form onSubmit={handlePay} className="space-y-4">
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">{labels.amount} (Due: {(selectedFine.amount - selectedFine.paidAmount).toLocaleString()})</label>
                     <input 
                        type="number"
                        className="w-full p-3 border rounded-lg bg-white text-lg font-bold"
                        max={selectedFine.amount - selectedFine.paidAmount}
                        value={payAmount}
                        onChange={e => setPayAmount(parseInt(e.target.value) || 0)}
                        autoFocus
                     />
                  </div>
                  <div className="flex gap-3 pt-2">
                     <button type="button" onClick={() => setIsPayOpen(false)} className="flex-1 py-2 border rounded-lg">{labels.cancel}</button>
                     <button type="submit" disabled={submitting} className="flex-1 py-2 bg-green-600 text-white rounded-lg font-bold flex justify-center items-center">
                        {submitting ? <Loader2 className="animate-spin" size={18}/> : 'Confirm Payment'}
                     </button>
                  </div>
               </form>
            </div>
         </div>
      )}

      {/* Edit Modal */}
      {isEditOpen && selectedFine && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in zoom-in-95">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
               <h3 className="font-bold text-lg mb-4">{labels.edit}</h3>
               <form onSubmit={handleEdit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{labels.type}</label>
                        <select 
                           className="w-full p-2 border rounded-lg bg-white"
                           value={editData.categoryId}
                           onChange={e => setEditData({...editData, categoryId: e.target.value})}
                        >
                           {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{labels.amount}</label>
                        <input 
                           type="number"
                           className="w-full p-2 border rounded-lg bg-white"
                           value={editData.amount}
                           onChange={e => setEditData({...editData, amount: parseInt(e.target.value) || 0})}
                        />
                     </div>
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">{labels.reason} <span className="text-red-500">*</span></label>
                     <textarea 
                        required
                        className="w-full p-2 border rounded-lg bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                        value={editData.reason}
                        onChange={e => setEditData({...editData, reason: e.target.value})}
                        placeholder="Audit reason..."
                     />
                  </div>
                  <div className="flex gap-3 pt-2">
                     <button type="button" onClick={() => setIsEditOpen(false)} className="flex-1 py-2 border rounded-lg">{labels.cancel}</button>
                     <button type="submit" disabled={submitting} className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold flex justify-center items-center">
                        {submitting ? <Loader2 className="animate-spin" size={18}/> : labels.save}
                     </button>
                  </div>
               </form>
            </div>
         </div>
      )}

      <DeleteConfirmDialog 
         isOpen={isVoidOpen}
         title="Void Fine"
         description={
            <div className="space-y-3">
               <p>Are you sure you want to void this fine? This action cannot be undone.</p>
               <textarea 
                  required
                  value={editData.reason}
                  onChange={e => setEditData({...editData, reason: e.target.value})}
                  className="w-full p-2 border border-red-200 rounded bg-red-50 text-sm focus:outline-none focus:border-red-400"
                  placeholder="Reason for voiding..."
                  rows={2}
               />
            </div>
         }
         onConfirm={handleVoid}
         onCancel={() => setIsVoidOpen(false)}
         confirmLabel={labels.void}
         isDeleting={submitting}
         variant="danger"
      />
    </div>
  );
}
=======
    if(!selectedFine) return;
    setSubmitting(true);
    try {
      await api.updateFine(selectedFine.id, { amount: editData.amount, categoryId: editData.categoryId }, 'CURRENT_USER', editData.reason);
      setIsEditOpen(false);
      fetchData();
    } catch (e: any) { alert(e.message); }
    setSubmitting(false);
  };

  const handleVoid = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!selectedFine) return;
    setSubmitting(true);
    try {
      await api.voidFine(selectedFine.id, editData.reason, 'CURRENT_USER');
      setIsVoidOpen(false);
      fetchData();
    } catch (e: any) { alert(e.message); }
    setSubmitting(false);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!newCatName) return;
    await api.addFineCategory(activeGroupId, newCatName, newCatAmount);
    setNewCatName('');
    setNewCatAmount(0);
    fetchData();
  };

  const getMemberName = (id: string) => members.find(m => m.id === id)?.fullName || 'Unknown';
  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || 'General';

  const filtered = fines.filter(f => {
    if (filter === 'UNPAID' && (f.status === 'PAID' || f.status === 'VOID')) return false;
    if (filter === 'PAID' && f.status !== 'PAID') return false;
    if (filter === 'VOID' && f.status !== 'VOID') return false;
    return getMemberName(f.memberId).toLowerCase().includes(searchTerm.toLowerCase());
  });

  const exportCSV = () => {
    if (filtered.length === 0) return;

    const headers = ['Date', 'Member Name', 'Category', 'Amount', 'Paid Amount', 'Balance', 'Status'];
    const rows = filtered.map(f => [
      f.date,
      `"${getMemberName(f.memberId)}"`,
      `"${getCategoryName(f.categoryId)}"`,
      f.amount,
      f.paidAmount,
      f.amount - f.paidAmount,
      f.status
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `fines_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const totalUnpaid = fines.filter(f => f.status !== 'VOID').reduce((acc, f) => acc + (f.amount - f.paidAmount), 0);
  const totalCollected = fines.reduce((acc, f) => acc + f.paidAmount, 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {[...Array(3)].map((_, i) => (
             <div key={i} className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                <div className="space-y-2">
                   <Skeleton className="h-4 w-24" />
                   <Skeleton className="h-8 w-32" />
                </div>
                <Skeleton className="h-12 w-12 rounded-lg" />
             </div>
           ))}
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
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="p-6 bg-red-50 rounded-xl border border-red-100 flex items-center justify-between">
           <div>
             <p className="text-sm font-medium text-red-600 uppercase">{labels.outstandingFines}</p>
             <p className="text-2xl font-bold text-red-900 mt-1">{totalUnpaid.toLocaleString()} {labels.currency}</p>
           </div>
           <div className="p-3 bg-red-100 text-red-600 rounded-lg"><AlertTriangle size={24} /></div>
         </div>
         <div className="p-6 bg-green-50 rounded-xl border border-green-100 flex items-center justify-between">
           <div>
             <p className="text-sm font-medium text-green-600 uppercase">{labels.collectedSeason}</p>
             <p className="text-2xl font-bold text-green-900 mt-1">{totalCollected.toLocaleString()} {labels.currency}</p>
           </div>
           <div className="p-3 bg-green-100 text-green-600 rounded-lg"><CheckCircle size={24} /></div>
         </div>
         <div className="p-6 bg-white rounded-xl border border-gray-200 flex flex-col justify-center gap-3">
             {canEdit && (
                <button 
                  onClick={() => setIsCreateOpen(true)}
                  className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium shadow-sm"
                >
                  <Plus size={18} className="mr-2" /> {labels.recordNewFine}
                </button>
             )}
             {canEdit && (
                <button 
                  onClick={() => setView(view === 'LIST' ? 'CATEGORIES' : 'LIST')}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
                >
                  <Tag size={16} className="mr-2" /> {view === 'LIST' ? labels.manageCategories : labels.backToList}
                </button>
             )}
         </div>
      </div>

      {view === 'LIST' ? (
        <>
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
             <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder={labels.search}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                />
             </div>
             <div className="flex gap-2 items-center">
                <button 
                  onClick={exportCSV}
                  disabled={filtered.length === 0}
                  className="flex items-center justify-center px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
                  title="Export to CSV"
                >
                  <Download size={18} />
                </button>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    {(['ALL', 'UNPAID', 'PAID', 'VOID'] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => setFilter(t)}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filter === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        {t.charAt(0) + t.slice(1).toLowerCase()}
                      </button>
                    ))}
                </div>
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
                     <th className="p-4">{labels.type}</th>
                     <th className="p-4">{labels.status}</th>
                     <th className="p-4">{labels.amount}</th>
                     <th className="p-4">Paid</th>
                     <th className="p-4">Balance</th>
                     <th className="p-4 text-right">{labels.actions}</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                   {filtered.length === 0 ? (
                     <tr><td colSpan={8} className="p-8 text-center text-gray-500">{labels.noData}</td></tr>
                   ) : (
                     filtered.map(f => (
                       <tr key={f.id} className={`hover:bg-gray-50 ${f.status === 'VOID' ? 'bg-gray-50 opacity-60' : ''}`}>
                         <td className="p-4 text-gray-500 text-sm whitespace-nowrap">{f.date}</td>
                         <td className="p-4 font-medium text-gray-900">{getMemberName(f.memberId)}</td>
                         <td className="p-4 text-sm text-gray-600">
                           {getCategoryName(f.categoryId)}
                           {f.reason && <div className="text-xs text-gray-400 italic truncate max-w-[150px]">{f.reason}</div>}
                         </td>
                         <td className="p-4">
                           <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                             f.status === 'PAID' ? 'bg-green-100 text-green-800' :
                             f.status === 'UNPAID' ? 'bg-red-100 text-red-800' :
                             f.status === 'PARTIALLY_PAID' ? 'bg-yellow-100 text-yellow-800' :
                             'bg-gray-200 text-gray-600'
                           }`}>
                             {f.status.replace('_', ' ')}
                           </span>
                         </td>
                         <td className="p-4 text-sm font-medium">{f.amount.toLocaleString()}</td>
                         <td className="p-4 text-sm text-green-600">{f.paidAmount.toLocaleString()}</td>
                         <td className="p-4 text-sm font-bold text-red-600">{(f.amount - f.paidAmount).toLocaleString()}</td>
                         <td className="p-4 text-right">
                           {canEdit && f.status !== 'VOID' && f.status !== 'PAID' && (
                              <button 
                                onClick={() => { setSelectedFine(f); setPayAmount(f.amount - f.paidAmount); setIsPayOpen(true); }}
                                className="p-1.5 bg-green-50 text-green-600 rounded hover:bg-green-100 mr-2"
                                title={labels.payFine}
                              >
                                <DollarSign size={16} />
                              </button>
                           )}
                           {canEdit && f.status !== 'VOID' && (
                             <>
                              <button 
                                onClick={() => { setSelectedFine(f); setEditData({ amount: f.amount, categoryId: f.categoryId, reason: '' }); setIsEditOpen(true); }}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded mr-1"
                              >
                                <Edit size={16} />
                              </button>
                              <button 
                                onClick={() => { setSelectedFine(f); setEditData({ ...editData, reason: '' }); setIsVoidOpen(true); }}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                              >
                                <Archive size={16} />
                              </button>
                             </>
                           )}
                         </td>
                       </tr>
                     ))
                   )}
                 </tbody>
               </table>
             </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-3xl mx-auto">
           <h3 className="text-lg font-bold text-gray-800 mb-4">{labels.manageCategories}</h3>
           
           <div className="space-y-4 mb-8">
             {categories.map(c => (
               <div key={c.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                 <div>
                   <p className="font-bold text-gray-900">{c.name}</p>
                   {c.isSystem && <span className="text-xs text-blue-600 font-medium">Automated System Category</span>}
                 </div>
                 <p className="font-mono font-medium text-gray-700">{c.defaultAmount.toLocaleString()} {labels.currency}</p>
               </div>
             ))}
           </div>

           <div className="border-t border-gray-200 pt-6">
             <h4 className="font-medium text-gray-700 mb-3">{labels.addNewCategory}</h4>
             <form onSubmit={handleAddCategory} className="flex gap-4">
               <input 
                 className="flex-1 p-2 border rounded-lg" 
                 placeholder={labels.categoryName}
                 value={newCatName}
                 onChange={e => setNewCatName(e.target.value)}
                 required
               />
               <input 
                 type="number"
                 className="w-32 p-2 border rounded-lg" 
                 placeholder={labels.amount}
                 value={newCatAmount}
                 onChange={e => setNewCatAmount(parseInt(e.target.value))}
                 required
               />
               <button className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900">{labels.save}</button>
             </form>
           </div>
        </div>
      )}

      {/* CREATE MODAL */}
      {isCreateOpen && canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-800">{labels.recordNewFine}</h3>
                <button onClick={() => setIsCreateOpen(false)}><X className="text-gray-400" /></button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">{labels.members}</label>
                   <select 
                     className="w-full p-2 border rounded-lg" 
                     value={createData.memberId} 
                     onChange={e => setCreateData({...createData, memberId: e.target.value})}
                     required
                   >
                     <option value="">-- Select --</option>
                     {members.filter(m => m.status === 'ACTIVE').map(m => <option key={m.id} value={m.id}>{m.fullName}</option>)}
                   </select>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">{labels.type}</label>
                   <select 
                     className="w-full p-2 border rounded-lg" 
                     value={createData.categoryId} 
                     onChange={e => {
                        const cat = categories.find(c => c.id === e.target.value);
                        setCreateData({
                          ...createData, 
                          categoryId: e.target.value,
                          amount: cat ? cat.defaultAmount : 0
                        });
                     }}
                     required
                   >
                     <option value="">-- Select --</option>
                     {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                   </select>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{labels.amount} ({labels.currency})</label>
                      <input 
                        type="number" className="w-full p-2 border rounded-lg"
                        value={createData.amount}
                        onChange={e => setCreateData({...createData, amount: parseInt(e.target.value)})} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{labels.date}</label>
                      <input 
                        type="date" className="w-full p-2 border rounded-lg"
                        value={createData.date}
                        onChange={e => setCreateData({...createData, date: e.target.value})} 
                      />
                    </div>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">{labels.reason}</label>
                   <input 
                     className="w-full p-2 border rounded-lg"
                     value={createData.reason}
                     onChange={e => setCreateData({...createData, reason: e.target.value})} 
                   />
                 </div>
                 <button disabled={submitting} className="w-full py-2 bg-red-600 text-white rounded-lg font-medium mt-2">
                   {submitting ? labels.processing : labels.recordFine}
                 </button>
              </form>
           </div>
        </div>
      )}

      {/* PAY MODAL */}
      {isPayOpen && selectedFine && canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">{labels.payFine}</h3>
              <p className="text-sm text-gray-600 mb-4">
                Paying fine for <strong>{getMemberName(selectedFine.memberId)}</strong>.<br/>
                Balance Due: <span className="font-bold text-red-600">{(selectedFine.amount - selectedFine.paidAmount).toLocaleString()} {labels.currency}</span>
              </p>
              <form onSubmit={handlePay} className="space-y-4">
                <input 
                  type="number" className="w-full p-2 border rounded-lg text-lg font-bold"
                  max={selectedFine.amount - selectedFine.paidAmount}
                  value={payAmount}
                  onChange={e => setPayAmount(parseInt(e.target.value))}
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                   <button type="button" onClick={() => setIsPayOpen(false)} className="px-4 py-2 text-gray-600">{labels.cancel}</button>
                   <button className="px-6 py-2 bg-green-600 text-white rounded-lg">{labels.confirm}</button>
                </div>
              </form>
           </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditOpen && selectedFine && canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border-t-4 border-amber-500">
              <h3 className="text-lg font-bold text-gray-800 mb-6">{labels.edit}</h3>
              <form onSubmit={handleEdit} className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-700">{labels.amount}</label>
                     <input 
                       type="number" className="w-full p-2 border rounded-lg"
                       min={selectedFine.paidAmount}
                       value={editData.amount}
                       onChange={e => setEditData({...editData, amount: parseInt(e.target.value)})}
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700">{labels.type}</label>
                     <select 
                       className="w-full p-2 border rounded-lg"
                       value={editData.categoryId}
                       onChange={e => setEditData({...editData, categoryId: e.target.value})}
                     >
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                     </select>
                   </div>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">{labels.auditWarning} <span className="text-red-500">*</span></label>
                    <textarea 
                      required className="w-full p-2 border rounded-lg"
                      value={editData.reason}
                      onChange={e => setEditData({...editData, reason: e.target.value})}
                    />
                 </div>
                 <div className="flex gap-2 justify-end">
                   <button type="button" onClick={() => setIsEditOpen(false)} className="px-4 py-2 text-gray-600">{labels.cancel}</button>
                   <button className="px-6 py-2 bg-amber-600 text-white rounded-lg">{labels.save}</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* VOID MODAL */}
      {isVoidOpen && selectedFine && canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border-t-4 border-gray-500">
              <h3 className="text-lg font-bold text-gray-800 mb-2">{labels.void}</h3>
              <p className="text-sm text-gray-600 mb-6">
                {labels.voidConfirm}
              </p>
              
              {selectedFine.paidAmount > 0 ? (
                 <div className="p-4 bg-red-50 text-red-700 rounded-lg mb-4 text-sm font-bold">
                    {labels.error}: This fine has collected payments. You cannot void it directly.
                 </div>
              ) : (
                <form onSubmit={handleVoid} className="space-y-4">
                   <div>
                      <label className="block text-sm font-medium text-gray-700">{labels.reason} <span className="text-red-500">*</span></label>
                      <textarea 
                        required className="w-full p-2 border rounded-lg"
                        value={editData.reason}
                        onChange={e => setEditData({...editData, reason: e.target.value})}
                      />
                   </div>
                   <div className="flex gap-2 justify-end">
                     <button type="button" onClick={() => setIsVoidOpen(false)} className="px-4 py-2 text-gray-600">{labels.cancel}</button>
                     <button className="px-6 py-2 bg-gray-600 text-white rounded-lg">{labels.confirm}</button>
                   </div>
                </form>
              )}
              {selectedFine.paidAmount > 0 && (
                <div className="flex justify-end">
                   <button onClick={() => setIsVoidOpen(false)} className="px-4 py-2 bg-gray-200 rounded-lg">{labels.close}</button>
                </div>
              )}
           </div>
        </div>
      )}

    </div>
  );
}
>>>>>>> 7c17f3ba72aad7656a6b64c3bf0bfbc90a688a2a
