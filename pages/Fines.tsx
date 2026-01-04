
import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../App';
import { api } from '../api/client';
import { LABELS } from '../constants';
import { Fine, FineCategory, Member, FineStatus } from '../types';
import { Gavel, Plus, Search, Edit, Trash2, CheckCircle, Ban, Filter, AlertTriangle, Loader2, X, Settings as SettingsIcon } from 'lucide-react';
import { TableRowSkeleton } from '../components/Skeleton';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';

export default function Fines() {
  const { activeGroupId, lang } = useContext(AppContext);
  const labels = LABELS[lang];

  const [fines, setFines] = useState<Fine[]>([]);
  const [categories, setCategories] = useState<FineCategory[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNPAID' | 'PAID'>('ALL');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isVoidOpen, setIsVoidOpen] = useState(false);
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
  const [newCatAmount, setNewCatAmount] = useState<number | ''>(500);

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
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
      const amount = newCatAmount === '' ? 0 : newCatAmount;
      await api.addFineCategory(activeGroupId, newCatName, amount);
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
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
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
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={() => setIsCategoryOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 shadow-sm whitespace-nowrap"
          >
            <SettingsIcon size={18} className="mr-2" /> {labels.manageCategories}
          </button>
          <button 
            onClick={() => setIsCreateOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 shadow-sm whitespace-nowrap"
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
         <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4">
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
               className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm outline-none w-full sm:w-auto"
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
            <>
              {/* Desktop View */}
              <div className="hidden md:block overflow-x-auto">
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

              {/* Mobile View */}
              <div className="md:hidden divide-y divide-gray-100">
                 {filteredFines.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">{labels.noData}</div>
                 ) : (
                    filteredFines.map(fine => (
                       <div key={fine.id} className={`p-4 ${fine.status === 'VOID' ? 'bg-red-50/50 opacity-60' : ''}`}>
                          <div className="flex justify-between items-start mb-2">
                             <div>
                                <p className="font-bold text-gray-900">{getMemberName(fine.memberId)}</p>
                                <p className="text-xs text-gray-500 mt-1">{fine.date}</p>
                             </div>
                             <div className="text-right">
                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                   fine.status === 'PAID' ? 'bg-green-100 text-green-700' : 
                                   fine.status === 'VOID' ? 'bg-gray-200 text-gray-700' :
                                   'bg-red-100 text-red-700'
                                }`}>
                                   {fine.status}
                                </span>
                             </div>
                          </div>
                          
                          <div className="flex justify-between items-center my-3 bg-gray-50 p-2 rounded border border-gray-100">
                             <div className="text-xs text-gray-500 font-bold uppercase">{getCategoryName(fine.categoryId)}</div>
                             <div className="font-mono font-bold text-gray-800">{fine.amount.toLocaleString()} RWF</div>
                          </div>

                          {fine.paidAmount > 0 && (
                             <div className="text-xs text-green-600 font-bold mb-3">Paid: {fine.paidAmount.toLocaleString()}</div>
                          )}

                          {fine.status !== 'VOID' && fine.status !== 'PAID' && (
                             <div className="flex gap-2">
                                <button onClick={() => openPay(fine)} className="flex-1 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-bold">Pay Now</button>
                                <button onClick={() => openEdit(fine)} className="p-2 text-blue-600 bg-blue-50 rounded-lg"><Edit size={18}/></button>
                                <button onClick={() => openVoid(fine)} className="p-2 text-red-600 bg-red-50 rounded-lg"><Ban size={18}/></button>
                             </div>
                          )}
                       </div>
                    ))
                 )}
              </div>
            </>
         )}
      </div>

      {/* Category Manager Modal */}
      {isCategoryOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[80vh] flex flex-col overflow-hidden">
               <div className="flex justify-between items-center p-4 border-b border-gray-100 flex-none bg-white">
                  <h3 className="font-bold text-lg">{labels.manageCategories}</h3>
                  <button onClick={() => setIsCategoryOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
               </div>
               
               <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                   {/* Improved Form */}
                   <div className="mb-6 bg-gray-50 p-3 rounded-lg border border-gray-200">
                       <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Add New Category</h4>
                       <form onSubmit={handleAddCategory} className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">{labels.categoryName}</label>
                            <input 
                               className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500" 
                               placeholder="e.g. No Uniform"
                               value={newCatName}
                               onChange={e => setNewCatName(e.target.value)}
                               required
                            />
                          </div>
                          <div className="flex gap-3">
                            <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-700 mb-1">Default Amount ({labels.currency})</label>
                                <input 
                                   type="number"
                                   className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500" 
                                   placeholder="500"
                                   value={newCatAmount}
                                   onChange={e => setNewCatAmount(e.target.value ? parseInt(e.target.value) : '')}
                                   required
                                />
                            </div>
                            <div className="flex items-end">
                                <button className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-slate-900 transition-colors h-[38px]">
                                    Add
                                </button>
                            </div>
                          </div>
                          <p className="text-[10px] text-gray-500 italic">
                            * The amount is a default suggestion and can be changed when recording the fine.
                          </p>
                       </form>
                   </div>

                   <div className="space-y-2">
                      <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Existing Categories</h4>
                      {categories.map(c => (
                         <div key={c.id} className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                            <span className="font-medium text-gray-800">{c.name}</span>
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-mono text-gray-600 bg-gray-50 px-2 py-1 rounded">{c.defaultAmount.toLocaleString()} RWF</span>
                                {c.active && <CheckCircle size={16} className="text-green-500" />}
                            </div>
                         </div>
                      ))}
                      {categories.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No categories defined.</p>}
                   </div>
               </div>
            </div>
         </div>
      )}

      {/* Create Modal */}
      {isCreateOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden">
               <div className="flex justify-between items-center p-6 border-b border-gray-100 flex-none bg-white">
                  <h3 className="font-bold text-lg">{labels.recordFine}</h3>
                  <button onClick={() => setIsCreateOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
               </div>
               
               <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                  <form id="create-fine-form" onSubmit={handleCreate} className="space-y-4">
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
                  </form>
               </div>

               <div className="p-4 border-t border-gray-100 bg-gray-50 flex-none flex gap-3">
                  <button type="button" onClick={() => setIsCreateOpen(false)} className="flex-1 py-2 border rounded-lg font-medium text-gray-700">{labels.cancel}</button>
                  <button type="submit" form="create-fine-form" disabled={submitting} className="flex-1 py-2 bg-slate-800 text-white rounded-lg font-bold flex justify-center items-center shadow-sm">
                     {submitting ? <Loader2 className="animate-spin" size={18}/> : labels.save}
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* Pay Modal */}
      {isPayOpen && selectedFine && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-white rounded-xl shadow-xl max-w-sm w-full max-h-[80vh] flex flex-col overflow-hidden">
               <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white flex-none">
                  <h3 className="font-bold text-lg">{labels.payFine}</h3>
                  <button onClick={() => setIsPayOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
               </div>
               
               <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
                   <p className="text-sm text-gray-600 mb-4">Member: <span className="font-bold">{getMemberName(selectedFine.memberId)}</span></p>
                   <form id="pay-fine-form" onSubmit={handlePay} className="space-y-4">
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
                   </form>
               </div>

               <div className="p-4 border-t border-gray-100 bg-gray-50 flex-none flex gap-3">
                  <button type="button" onClick={() => setIsPayOpen(false)} className="flex-1 py-2 border rounded-lg font-medium text-gray-700">{labels.cancel}</button>
                  <button type="submit" form="pay-fine-form" disabled={submitting} className="flex-1 py-2 bg-green-600 text-white rounded-lg font-bold flex justify-center items-center shadow-sm">
                     {submitting ? <Loader2 className="animate-spin" size={18}/> : 'Confirm Payment'}
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* Edit Modal */}
      {isEditOpen && selectedFine && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden">
               <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white flex-none">
                  <h3 className="font-bold text-lg">{labels.edit}</h3>
                  <button onClick={() => setIsEditOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
               </div>
               
               <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                  <form id="edit-fine-form" onSubmit={handleEdit} className="space-y-4">
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
                            rows={3}
                         />
                      </div>
                  </form>
               </div>

               <div className="p-4 border-t border-gray-100 bg-gray-50 flex-none flex gap-3">
                  <button type="button" onClick={() => setIsEditOpen(false)} className="flex-1 py-2 border rounded-lg font-medium text-gray-700">{labels.cancel}</button>
                  <button type="submit" form="edit-fine-form" disabled={submitting} className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold flex justify-center items-center shadow-sm">
                     {submitting ? <Loader2 className="animate-spin" size={18}/> : labels.save}
                  </button>
               </div>
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
