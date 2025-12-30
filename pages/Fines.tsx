
import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../App';
import { api } from '../api/client';
import { LABELS } from '../constants';
import { Fine, FineCategory, Member, FineStatus } from '../types';
import { Gavel, Search, Plus, Loader2, CheckCircle, AlertTriangle, X, DollarSign, Edit, Archive, History, Shield, Tag } from 'lucide-react';

export default function Fines() {
  const { activeGroupId, lang, groups } = useContext(AppContext);
  const labels = LABELS[lang];
  const group = groups.find(g => g.id === activeGroupId);

  const [fines, setFines] = useState<Fine[]>([]);
  const [categories, setCategories] = useState<FineCategory[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  
  // View State
  const [view, setView] = useState<'LIST' | 'CATEGORIES'>('LIST');
  const [filter, setFilter] = useState<'ALL' | 'UNPAID' | 'PAID' | 'VOID'>('UNPAID');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isVoidOpen, setIsVoidOpen] = useState(false);
  
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
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
       await api.createFine(activeGroupId, { ...createData, recordedBy: 'CURRENT_USER' });
       setIsCreateOpen(false);
       setCreateData({ memberId: '', categoryId: '', amount: 0, date: new Date().toISOString().split('T')[0], reason: '' });
       fetchData();
    } catch (e: any) { alert(e.message); }
    setSubmitting(false);
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!selectedFine) return;
    setSubmitting(true);
    try {
      await api.payFine(selectedFine.id, payAmount, 'CASH', 'CURRENT_USER');
      setIsPayOpen(false);
      fetchData();
    } catch (e: any) { alert(e.message); }
    setSubmitting(false);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
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

  const totalUnpaid = fines.filter(f => f.status !== 'VOID').reduce((acc, f) => acc + (f.amount - f.paidAmount), 0);
  const totalCollected = fines.reduce((acc, f) => acc + f.paidAmount, 0);

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-gray-400" /></div>;

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
             <button 
               onClick={() => setIsCreateOpen(true)}
               className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium shadow-sm"
             >
               <Plus size={18} className="mr-2" /> {labels.recordNewFine}
             </button>
             <button 
               onClick={() => setView(view === 'LIST' ? 'CATEGORIES' : 'LIST')}
               className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
             >
               <Tag size={16} className="mr-2" /> {view === 'LIST' ? labels.manageCategories : labels.backToList}
             </button>
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
                           {f.status !== 'VOID' && f.status !== 'PAID' && (
                              <button 
                                onClick={() => { setSelectedFine(f); setPayAmount(f.amount - f.paidAmount); setIsPayOpen(true); }}
                                className="p-1.5 bg-green-50 text-green-600 rounded hover:bg-green-100 mr-2"
                                title={labels.payFine}
                              >
                                <DollarSign size={16} />
                              </button>
                           )}
                           {f.status !== 'VOID' && (
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
      {isCreateOpen && (
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
      {isPayOpen && selectedFine && (
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
      {isEditOpen && selectedFine && (
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
      {isVoidOpen && selectedFine && (
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
