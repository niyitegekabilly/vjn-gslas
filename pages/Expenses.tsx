
import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../App';
import { api } from '../api/client';
import { LABELS } from '../constants';
import { Transaction, ExpenseCategory } from '../types';
import { Receipt, Plus, Search, Edit, Ban, Settings as SettingsIcon, Loader2, AlertTriangle, X, CheckCircle, Calendar } from 'lucide-react';
import { TableRowSkeleton } from '../components/Skeleton';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';

export default function Expenses() {
  const { activeGroupId, lang } = useContext(AppContext);
  const labels = LABELS[lang];

  const [expenses, setExpenses] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [cashBalance, setCashBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isVoidOpen, setIsVoidOpen] = useState(false);

  const [selectedExp, setSelectedExp] = useState<Transaction | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Forms
  const [formData, setFormData] = useState({
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    categoryId: '',
    description: '',
    approvedBy: 'Admin', // Mock
    recordedBy: 'Admin'
  });

  const [editData, setEditData] = useState({
    amount: 0,
    categoryId: '',
    description: '',
    reason: ''
  });

  const [newCatName, setNewCatName] = useState('');
  const [voidReason, setVoidReason] = useState('');

  useEffect(() => {
    if (activeGroupId) fetchData();
  }, [activeGroupId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [exp, cats, bal] = await Promise.all([
        api.getExpenses(activeGroupId),
        api.getExpenseCategories(activeGroupId),
        api.getCashBalance(activeGroupId)
      ]);
      setExpenses(exp.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setCategories(cats);
      setCashBalance(bal);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;
    try {
      await api.addExpenseCategory(activeGroupId, newCatName);
      setNewCatName('');
      const c = await api.getExpenseCategories(activeGroupId);
      setCategories(c);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createExpense(activeGroupId, formData);
      setIsCreateOpen(false);
      setFormData({
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        categoryId: '',
        description: '',
        approvedBy: 'Admin',
        recordedBy: 'Admin'
      });
      fetchData();
    } catch (e) {
      console.error(e);
      alert("Failed to save expense");
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (exp: Transaction) => {
    setSelectedExp(exp);
    setEditData({
      amount: exp.amount,
      categoryId: exp.categoryId || '',
      description: exp.description || '',
      reason: ''
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExp) return;
    setSubmitting(true);
    try {
      await api.updateExpense(selectedExp.id, {
        amount: editData.amount,
        categoryId: editData.categoryId,
        description: editData.description
      }, 'Admin', editData.reason);
      setIsEditOpen(false);
      fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const openVoid = (exp: Transaction) => {
    setSelectedExp(exp);
    setVoidReason('');
    setIsVoidOpen(true);
  };

  const handleVoidSubmit = async () => {
    if (!selectedExp) return;
    setSubmitting(true);
    try {
      await api.voidExpense(selectedExp.id, voidReason, 'Admin');
      setIsVoidOpen(false);
      fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryName = (id?: string) => categories.find(c => c.id === id)?.name || 'General';

  const filtered = expenses.filter(e => 
    (e.description || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    getCategoryName(e.categoryId).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalExpenses = filtered.filter(e => !e.isVoid).reduce((a,b) => a + b.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <Receipt className="mr-3 text-red-600" /> {labels.expenseManagement}
        </h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={() => setIsCategoryOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 shadow-sm whitespace-nowrap"
          >
            <SettingsIcon size={18} className="mr-2" /> Categories
          </button>
          <button 
            onClick={() => setIsCreateOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 shadow-sm whitespace-nowrap"
          >
            <Plus size={18} className="mr-2" /> {labels.addExpense}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-sm font-bold text-gray-500 uppercase">{labels.totalExpenses}</p>
            <p className="text-3xl font-bold text-red-600 mt-2">{totalExpenses.toLocaleString()} {labels.currency}</p>
         </div>
         <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-sm font-bold text-gray-500 uppercase">{labels.availableCash}</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{cashBalance.toLocaleString()} {labels.currency}</p>
         </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
         <div className="p-4 border-b border-gray-100 relative">
            <Search className="absolute left-7 top-6.5 text-gray-400" size={18} />
            <input 
               type="text" 
               placeholder={labels.search} 
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
               className="w-full max-w-md pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
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
                          <th className="p-4">{labels.description}</th>
                          <th className="p-4">{labels.expenseCategory}</th>
                          <th className="p-4 text-right">{labels.amount}</th>
                          <th className="p-4">{labels.recordedBy}</th>
                          <th className="p-4 text-right">{labels.actions}</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                       {filtered.length === 0 ? (
                          <tr><td colSpan={6} className="p-8 text-center text-gray-500">{labels.noData}</td></tr>
                       ) : (
                          filtered.map(exp => (
                             <tr key={exp.id} className={`hover:bg-gray-50 ${exp.isVoid ? 'bg-red-50/50 opacity-60' : ''}`}>
                                <td className="p-4 text-gray-600">{exp.date}</td>
                                <td className="p-4 text-gray-900 font-medium">{exp.description}</td>
                                <td className="p-4">
                                   <span className="bg-gray-100 px-2 py-1 rounded text-xs font-medium text-gray-700">{getCategoryName(exp.categoryId)}</span>
                                </td>
                                <td className="p-4 text-right font-mono font-bold text-red-600">-{exp.amount.toLocaleString()}</td>
                                <td className="p-4 text-gray-500 text-xs">{exp.recordedBy || '-'}</td>
                                <td className="p-4 text-right">
                                   {!exp.isVoid && (
                                      <div className="flex justify-end gap-2">
                                         <button onClick={() => openEdit(exp)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit size={16}/></button>
                                         <button onClick={() => openVoid(exp)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Ban size={16}/></button>
                                      </div>
                                   )}
                                   {exp.isVoid && <span className="text-xs font-bold text-red-700 bg-red-100 px-2 py-1 rounded">VOID</span>}
                                </td>
                             </tr>
                          ))
                       )}
                    </tbody>
                 </table>
              </div>

              {/* Mobile View */}
              <div className="md:hidden divide-y divide-gray-100">
                 {filtered.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">{labels.noData}</div>
                 ) : (
                    filtered.map(exp => (
                       <div key={exp.id} className={`p-4 ${exp.isVoid ? 'bg-red-50/50 opacity-60' : ''}`}>
                          <div className="flex justify-between items-start mb-2">
                             <div>
                                <p className="font-bold text-gray-900">{exp.description}</p>
                                <p className="text-xs text-gray-500 flex items-center mt-1">
                                   <Calendar size={12} className="mr-1" /> {exp.date}
                                </p>
                             </div>
                             <div className="text-right">
                                <p className="font-mono font-bold text-red-600">-{exp.amount.toLocaleString()}</p>
                                {exp.isVoid && <span className="text-xs bg-red-100 text-red-800 px-1 py-0.5 rounded font-bold">VOID</span>}
                             </div>
                          </div>
                          
                          <div className="flex justify-between items-center mt-3">
                             <span className="bg-gray-100 px-2 py-1 rounded text-xs font-medium text-gray-700">{getCategoryName(exp.categoryId)}</span>
                             {!exp.isVoid && (
                                <div className="flex gap-1">
                                   <button onClick={() => openEdit(exp)} className="p-2 text-blue-600 bg-blue-50 rounded-lg"><Edit size={16}/></button>
                                   <button onClick={() => openVoid(exp)} className="p-2 text-red-600 bg-red-50 rounded-lg"><Ban size={16}/></button>
                                </div>
                             )}
                          </div>
                       </div>
                    ))
                 )}
              </div>
            </>
         )}
      </div>

      {/* Category Modal */}
      {isCategoryOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[80vh] flex flex-col overflow-hidden">
               <div className="flex justify-between items-center p-4 border-b border-gray-100 flex-none bg-white">
                  <h3 className="font-bold text-lg">Expense Categories</h3>
                  <button onClick={() => setIsCategoryOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
               </div>
               
               <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                   <form onSubmit={handleAddCategory} className="flex gap-2 mb-4 sticky top-0 bg-white z-10 pb-2">
                      <input 
                         className="flex-1 p-2 border rounded-lg bg-white" 
                         placeholder="New Category Name"
                         value={newCatName}
                         onChange={e => setNewCatName(e.target.value)}
                         required
                      />
                      <button className="px-4 bg-slate-800 text-white rounded-lg font-bold text-sm">Add</button>
                   </form>
                   <div className="space-y-2">
                      {categories.map(c => (
                         <div key={c.id} className="p-2 bg-gray-50 border border-gray-100 rounded flex justify-between">
                            <span>{c.name}</span>
                            {c.active && <CheckCircle size={16} className="text-green-500" />}
                         </div>
                      ))}
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
                  <h3 className="font-bold text-lg">{labels.addExpense}</h3>
                  <button onClick={() => setIsCreateOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
               </div>
               
               <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                  <form id="create-expense-form" onSubmit={handleCreate} className="space-y-4">
                      <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">{labels.expenseCategory}</label>
                         <select 
                            required
                            className="w-full p-2 border rounded-lg bg-white"
                            value={formData.categoryId}
                            onChange={e => setFormData({...formData, categoryId: e.target.value})}
                         >
                            <option value="">-- Select --</option>
                            {categories.filter(c => c.active).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                         </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{labels.amount}</label>
                            <input 
                               type="number"
                               required
                               className="w-full p-2 border rounded-lg bg-white"
                               min="1"
                               max={cashBalance}
                               value={formData.amount}
                               onChange={e => setFormData({...formData, amount: parseInt(e.target.value) || 0})}
                            />
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{labels.date}</label>
                            <input 
                               type="date"
                               required
                               className="w-full p-2 border rounded-lg bg-white"
                               value={formData.date}
                               onChange={e => setFormData({...formData, date: e.target.value})}
                            />
                         </div>
                      </div>
                      <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">{labels.description}</label>
                         <textarea 
                            required
                            className="w-full p-2 border rounded-lg bg-white"
                            rows={2}
                            value={formData.description}
                            onChange={e => setFormData({...formData, description: e.target.value})}
                         />
                      </div>
                      
                      {formData.amount > cashBalance && (
                         <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100 flex items-center">
                            <AlertTriangle size={12} className="mr-1" /> {labels.insufficientFunds} (Bal: {cashBalance})
                         </div>
                      )}
                  </form>
               </div>

               <div className="p-4 border-t border-gray-100 bg-gray-50 flex-none flex gap-3">
                  <button type="button" onClick={() => setIsCreateOpen(false)} className="flex-1 py-2 border rounded-lg font-medium text-gray-700">{labels.cancel}</button>
                  <button 
                     type="submit" 
                     form="create-expense-form"
                     disabled={submitting || formData.amount > cashBalance} 
                     className="flex-1 py-2 bg-slate-800 text-white rounded-lg font-bold flex justify-center items-center shadow-sm disabled:opacity-50"
                  >
                     {submitting ? <Loader2 className="animate-spin" size={18}/> : labels.save}
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* Edit Modal */}
      {isEditOpen && selectedExp && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden">
               <div className="flex justify-between items-center p-6 border-b border-gray-100 flex-none bg-white">
                  <h3 className="font-bold text-lg">{labels.edit}</h3>
                  <button onClick={() => setIsEditOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
               </div>
               
               <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                  <form id="edit-expense-form" onSubmit={handleEditSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{labels.amount}</label>
                            <input 
                               type="number"
                               className="w-full p-2 border rounded-lg bg-white"
                               value={editData.amount}
                               onChange={e => setEditData({...editData, amount: parseInt(e.target.value) || 0})}
                            />
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{labels.expenseCategory}</label>
                            <select 
                               className="w-full p-2 border rounded-lg bg-white"
                               value={editData.categoryId}
                               onChange={e => setEditData({...editData, categoryId: e.target.value})}
                            >
                               {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                         </div>
                      </div>
                      <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">{labels.description}</label>
                         <input 
                            className="w-full p-2 border rounded-lg bg-white"
                            value={editData.description}
                            onChange={e => setEditData({...editData, description: e.target.value})}
                         />
                      </div>
                      <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">{labels.reason} <span className="text-red-500">*</span></label>
                         <textarea 
                            required
                            className="w-full p-2 border rounded-lg bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                            value={editData.reason}
                            onChange={e => setEditData({...editData, reason: e.target.value})}
                            placeholder={labels.whyChange}
                         />
                      </div>
                  </form>
               </div>

               <div className="p-4 border-t border-gray-100 bg-gray-50 flex-none flex gap-3">
                  <button type="button" onClick={() => setIsEditOpen(false)} className="flex-1 py-2 border rounded-lg font-medium text-gray-700">{labels.cancel}</button>
                  <button type="submit" form="edit-expense-form" disabled={submitting} className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold flex justify-center items-center shadow-sm">
                     {submitting ? <Loader2 className="animate-spin" size={18}/> : labels.save}
                  </button>
               </div>
            </div>
         </div>
      )}

      <DeleteConfirmDialog 
         isOpen={isVoidOpen}
         title="Void Expense"
         description={
            <div className="space-y-3">
               <p>Voiding this expense will return funds to the cash balance. This action is audited.</p>
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
