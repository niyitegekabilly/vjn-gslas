
import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../App';
import { api } from '../api/client';
import { LABELS } from '../constants';
import { Transaction, UserRole, ExpenseCategory, AuditRecord } from '../types';
import { Receipt, Plus, Loader2, Search, Wallet, AlertTriangle, Edit, Ban, CheckCircle, Tag, History, X, Save } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Skeleton, TableRowSkeleton } from '../components/Skeleton';

export default function Expenses() {
  const { activeGroupId, lang } = useContext(AppContext);
  const labels = LABELS[lang];
  const { user } = useAuth();
  
  const [expenses, setExpenses] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [cashBalance, setCashBalance] = useState(0);
  
  // View State
  const [view, setView] = useState<'LIST' | 'CATEGORIES'>('LIST');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'VOID'>('ALL');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  
  const [selectedExpense, setSelectedExpense] = useState<Transaction | null>(null);

  // Forms
  const [formData, setFormData] = useState({
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    description: '',
    categoryId: '',
    approvedBy: user?.fullName || ''
  });

  const [editData, setEditData] = useState({
    amount: 0,
    description: '',
    categoryId: '',
    reason: ''
  });

  const [voidReason, setVoidReason] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canEdit = user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ADMIN || user?.role === UserRole.GROUP_LEADER;

  useEffect(() => {
    if (activeGroupId) fetchData();
  }, [activeGroupId]);

  const fetchData = async () => {
    setLoading(true);
    const [e, c, b] = await Promise.all([
      api.getExpenses(activeGroupId),
      api.getExpenseCategories(activeGroupId),
      api.getCashBalance(activeGroupId)
    ]);
    setExpenses(e.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setCategories(c);
    setCashBalance(b);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.amount > cashBalance) {
        alert(labels.insufficientFunds);
        return;
    }
    setSubmitting(true);
    try {
        await api.createExpense(activeGroupId, {
            ...formData,
            recordedBy: user?.fullName
        });
        setIsAddModalOpen(false);
        resetForm();
        fetchData();
    } catch (err: any) {
        alert(err.message);
    } finally {
        setSubmitting(false);
    }
  };

  const handleEditInit = (t: Transaction) => {
      setSelectedExpense(t);
      setEditData({
          amount: t.amount,
          description: t.description || '',
          categoryId: t.categoryId || '',
          reason: ''
      });
      setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedExpense) return;
      setSubmitting(true);
      try {
          await api.updateExpense(selectedExpense.id, editData, user?.fullName || 'Admin', editData.reason);
          setIsEditModalOpen(false);
          fetchData();
      } catch (err: any) {
          alert(err.message);
      } finally {
          setSubmitting(false);
      }
  };

  const handleVoidSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedExpense) return;
      setSubmitting(true);
      try {
          await api.voidExpense(selectedExpense.id, voidReason, user?.fullName || 'Admin');
          setIsVoidModalOpen(false);
          fetchData();
      } catch (err: any) {
          alert(err.message);
      } finally {
          setSubmitting(false);
      }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newCatName) return;
      await api.addExpenseCategory(activeGroupId, newCatName);
      setNewCatName('');
      fetchData();
  };

  const resetForm = () => {
      setFormData({
          amount: 0,
          date: new Date().toISOString().split('T')[0],
          description: '',
          categoryId: '',
          approvedBy: user?.fullName || ''
      });
  };

  const getCategoryName = (id?: string) => categories.find(c => c.id === id)?.name || 'Uncategorized';

  const filteredExpenses = expenses.filter(t => {
    const matchSearch = (t.description || '').toLowerCase().includes(searchTerm.toLowerCase()) || t.date.includes(searchTerm);
    if (!matchSearch) return false;
    if (filterType === 'VOID' && !t.isVoid) return false;
    if (filterType === 'ALL' && t.isVoid) return false; // Show active by default or separate tab? Let's hide void in ALL
    return true;
  });

  const displayedExpenses = filterType === 'VOID' ? expenses.filter(t => t.isVoid) : expenses.filter(t => !t.isVoid);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {[...Array(5)].map((_, i) => <TableRowSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">{labels.expenseManagement}</h2>
            <p className="text-sm text-gray-500">Track and audit group expenditures</p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
             <button 
                onClick={() => setView(view === 'LIST' ? 'CATEGORIES' : 'LIST')}
                className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
             >
               <Tag size={16} className="mr-2" /> {view === 'LIST' ? labels.manageCategories : labels.backToList}
             </button>
             <button 
               onClick={() => { resetForm(); setIsAddModalOpen(true); }}
               className="flex items-center px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900"
             >
               <Plus size={18} className="mr-2" />
               {labels.addExpense}
             </button>
          </div>
        )}
      </div>

      {view === 'LIST' ? (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{labels.availableCash}</p>
                        <p className={`text-3xl font-bold mt-1 ${cashBalance < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                            {cashBalance.toLocaleString()} <span className="text-sm text-gray-400">{labels.currency}</span>
                        </p>
                    </div>
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
                        <Wallet size={24} />
                    </div>
                </div>
                <div className="bg-red-50 p-6 rounded-xl border border-red-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-red-600 uppercase tracking-wider">{labels.totalExpenses}</p>
                        <p className="text-3xl font-bold text-red-900 mt-1">
                            {expenses.filter(t => !t.isVoid).reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()} {labels.currency}
                        </p>
                    </div>
                    <div className="p-3 bg-red-100 text-red-600 rounded-full">
                        <Receipt size={24} />
                    </div>
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
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                        />
                    </div>
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button 
                            onClick={() => setFilterType('ALL')} 
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${filterType === 'ALL' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
                        >
                            Active
                        </button>
                        <button 
                            onClick={() => setFilterType('VOID')} 
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${filterType === 'VOID' ? 'bg-white shadow-sm text-red-600' : 'text-gray-500'}`}
                        >
                            Voided
                        </button>
                    </div>
                </div>
                
                <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                    <th className="p-4">{labels.date}</th>
                    <th className="p-4">{labels.expenseCategory}</th>
                    <th className="p-4">{labels.description}</th>
                    <th className="p-4">{labels.approvedBy}</th>
                    <th className="p-4 text-right">{labels.amount}</th>
                    <th className="p-4 text-right">{labels.actions}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {displayedExpenses.length === 0 ? (
                        <tr><td colSpan={6} className="p-8 text-center text-gray-500">{labels.noData}</td></tr>
                    ) : (
                        displayedExpenses.map(t => (
                            <tr key={t.id} className={`hover:bg-gray-50 ${t.isVoid ? 'bg-gray-50 opacity-60' : ''}`}>
                            <td className="p-4 text-gray-500 whitespace-nowrap">{t.date}</td>
                            <td className="p-4">
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                    {getCategoryName(t.categoryId)}
                                </span>
                            </td>
                            <td className="p-4 text-gray-900 font-medium">{t.description}</td>
                            <td className="p-4 text-gray-500 text-xs">
                                <div className="flex flex-col">
                                    <span>{t.approvedBy || 'System'}</span>
                                    {t.recordedBy && <span className="text-gray-400">Rec: {t.recordedBy}</span>}
                                </div>
                            </td>
                            <td className="p-4 text-right font-mono font-bold text-gray-800">
                                {t.isVoid ? <span className="line-through text-gray-400">{t.amount.toLocaleString()}</span> : t.amount.toLocaleString()}
                            </td>
                            <td className="p-4 text-right">
                                {!t.isVoid && canEdit && (
                                    <div className="flex justify-end gap-1">
                                        <button 
                                            onClick={() => handleEditInit(t)}
                                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                            title={labels.edit}
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button 
                                            onClick={() => { setSelectedExpense(t); setIsVoidModalOpen(true); }}
                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                            title={labels.void}
                                        >
                                            <Ban size={16} />
                                        </button>
                                    </div>
                                )}
                                {(t.isVoid || (t.editHistory && t.editHistory.length > 0)) && (
                                    <button 
                                        onClick={() => { setSelectedExpense(t); setIsHistoryModalOpen(true); }}
                                        className="text-xs text-blue-600 hover:underline mt-1 block w-full text-right"
                                    >
                                        {labels.history}
                                    </button>
                                )}
                            </td>
                            </tr>
                        ))
                    )}
                </tbody>
                </table>
            </div>
        </>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-3xl mx-auto animate-in fade-in slide-in-from-right-4 duration-300">
           <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-800">{labels.manageCategories}</h3>
                <button onClick={() => setView('LIST')} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
           </div>
           
           <div className="space-y-3 mb-8">
             {categories.map(c => (
               <div key={c.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl bg-gray-50">
                 <p className="font-bold text-gray-900">{c.name}</p>
                 <span className={`px-2 py-1 rounded text-xs font-bold ${c.active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                    {c.active ? 'Active' : 'Inactive'}
                 </span>
               </div>
             ))}
           </div>

           <div className="border-t border-gray-200 pt-6">
             <h4 className="font-medium text-gray-700 mb-3">{labels.addNewCategory}</h4>
             <form onSubmit={handleAddCategory} className="flex gap-4">
               <input 
                 className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                 placeholder="e.g., Transport, Logistics..."
                 value={newCatName}
                 onChange={e => setNewCatName(e.target.value)}
                 required
               />
               <button className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 font-medium">
                   {labels.save}
               </button>
             </form>
           </div>
        </div>
      )}

      {/* CREATE MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <h3 className="text-lg font-bold text-gray-800">{labels.addExpense}</h3>
                <button onClick={() => setIsAddModalOpen(false)}><X className="text-gray-400" /></button>
              </div>
              
              <div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-100 flex justify-between items-center">
                  <span className="text-sm text-blue-800 font-medium">{labels.availableCash}:</span>
                  <span className="font-bold text-blue-900">{cashBalance.toLocaleString()} {labels.currency}</span>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">{labels.expenseCategory}</label>
                   <select 
                     className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white" 
                     value={formData.categoryId} 
                     onChange={e => setFormData({...formData, categoryId: e.target.value})}
                     required
                   >
                     <option value="">-- Select --</option>
                     {categories.filter(c => c.active).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                   </select>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{labels.amount}</label>
                        <input 
                            type="number" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            min="1"
                            max={cashBalance}
                            value={formData.amount}
                            onChange={e => setFormData({...formData, amount: parseInt(e.target.value) || 0})}
                            required 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{labels.date}</label>
                        <input 
                            type="date" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.date}
                            onChange={e => setFormData({...formData, date: e.target.value})}
                            required 
                        />
                    </div>
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">{labels.description}</label>
                   <textarea 
                     className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                     rows={2}
                     value={formData.description}
                     onChange={e => setFormData({...formData, description: e.target.value})}
                     required
                   />
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">{labels.approvedBy}</label>
                   <input 
                     className="w-full p-2 border rounded-lg bg-gray-50"
                     value={formData.approvedBy}
                     readOnly
                   />
                 </div>

                 <button 
                    type="submit"
                    disabled={submitting || formData.amount > cashBalance} 
                    className="w-full py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                 >
                   {submitting ? <Loader2 className="animate-spin" size={20} /> : labels.save}
                 </button>
              </form>
           </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditModalOpen && selectedExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border-t-4 border-amber-500">
              <h3 className="text-lg font-bold text-gray-800 mb-6">{labels.edit}</h3>
              
              <div className="mb-4 text-sm bg-amber-50 text-amber-900 p-3 rounded border border-amber-100">
                  <AlertTriangle size={16} className="inline mr-2" />
                  Warning: Changing expense details will affect the cash balance audit.
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-700">{labels.amount}</label>
                     <input 
                       type="number" className="w-full p-2 border rounded-lg"
                       value={editData.amount}
                       onChange={e => setEditData({...editData, amount: parseInt(e.target.value) || 0})}
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700">{labels.expenseCategory}</label>
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
                    <label className="block text-sm font-medium text-gray-700">{labels.description}</label>
                    <input 
                       className="w-full p-2 border rounded-lg"
                       value={editData.description}
                       onChange={e => setEditData({...editData, description: e.target.value})}
                    />
                 </div>

                 <div>
                    <label className="block text-sm font-medium text-gray-700">{labels.reason} <span className="text-red-500">*</span></label>
                    <textarea 
                      required className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                      placeholder="Why is this being changed?"
                      value={editData.reason}
                      onChange={e => setEditData({...editData, reason: e.target.value})}
                    />
                 </div>
                 <div className="flex gap-2 justify-end pt-2">
                   <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-50 border rounded-lg">{labels.cancel}</button>
                   <button className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700">{labels.save}</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* VOID MODAL */}
      {isVoidModalOpen && selectedExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border-t-4 border-red-500">
              <h3 className="text-lg font-bold text-gray-800 mb-2">{labels.void}</h3>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to void this expense of <strong>{selectedExpense.amount.toLocaleString()} RWF</strong>? 
                This will return the funds to the cash balance.
              </p>
              
              <form onSubmit={handleVoidSubmit} className="space-y-4">
                   <div>
                      <label className="block text-sm font-medium text-gray-700">{labels.reason} <span className="text-red-500">*</span></label>
                      <textarea 
                        required className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                        value={voidReason}
                        onChange={e => setVoidReason(e.target.value)}
                      />
                   </div>
                   <div className="flex gap-2 justify-end">
                     <button type="button" onClick={() => setIsVoidModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-50 border rounded-lg">{labels.cancel}</button>
                     <button className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">{labels.confirm}</button>
                   </div>
              </form>
           </div>
        </div>
      )}

      {/* HISTORY MODAL */}
      {isHistoryModalOpen && selectedExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                 <h3 className="font-bold text-gray-800 flex items-center">
                    <History size={20} className="mr-2 text-blue-600" /> {labels.auditLogs}
                 </h3>
                 <button onClick={() => setIsHistoryModalOpen(false)}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
              </div>
              <div className="p-0 max-h-96 overflow-y-auto bg-gray-50">
                {selectedExpense.isVoid && (
                   <div className="p-4 bg-red-50 border-b border-red-100">
                      <p className="text-xs font-bold text-red-800 uppercase mb-1">{labels.status}: VOID</p>
                      <p className="text-sm text-red-900 font-medium">{labels.reason}: {selectedExpense.voidReason}</p>
                   </div>
                )}
                
                {(!selectedExpense.editHistory || selectedExpense.editHistory.length === 0) ? (
                   <div className="p-8 text-center text-gray-400">{labels.noData}</div>
                ) : (
                   <ul className="divide-y divide-gray-200">
                      {[...selectedExpense.editHistory].reverse().map((audit: AuditRecord) => (
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
