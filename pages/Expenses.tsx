
import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../App';
import { api } from '../api/client';
import { LABELS } from '../constants';
import { Transaction, ExpenseCategory } from '../types';
import { Receipt, Plus, Search, Settings as SettingsIcon, Loader2, X, Trash2, Calendar, FileText } from 'lucide-react';
import { TableRowSkeleton } from '../components/Skeleton';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';

export default function Expenses() {
  const { activeGroupId, lang } = useContext(AppContext);
  const labels = LABELS[lang];

  const [expenses, setExpenses] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isVoidOpen, setIsVoidOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Forms
  const [formData, setFormData] = useState({
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    description: '',
    categoryId: ''
  });
  const [voidReason, setVoidReason] = useState('');
  const [newCatName, setNewCatName] = useState('');

  useEffect(() => {
    if (activeGroupId) fetchData();
  }, [activeGroupId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [exps, cats, bal] = await Promise.all([
        api.getExpenses(activeGroupId),
        api.getExpenseCategories(activeGroupId),
        api.getCashBalance(activeGroupId)
      ]);
      setExpenses(exps.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setCategories(cats);
      setBalance(bal);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = (id?: string) => categories.find(c => c.id === id)?.name || 'General';

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.amount > balance) {
        alert(labels.insufficientFunds);
        return;
    }
    setSubmitting(true);
    try {
      await api.createExpense(activeGroupId, { ...formData, recordedBy: 'Admin', approvedBy: 'Admin' });
      setIsCreateOpen(false);
      setFormData({ amount: 0, date: new Date().toISOString().split('T')[0], description: '', categoryId: '' });
      fetchData();
    } catch (e) {
      console.error(e);
      alert('Failed to record expense');
    } finally {
      setSubmitting(false);
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
    } catch (e) { console.error(e); }
  };

  const handleVoid = async () => {
    if (!selectedTx) return;
    setSubmitting(true);
    try {
      await api.voidExpense(selectedTx.id, voidReason, 'Admin');
      setIsVoidOpen(false);
      fetchData();
    } catch (e) { console.error(e); } finally { setSubmitting(false); }
  };

  const filtered = expenses.filter(e => e.description?.toLowerCase().includes(searchTerm.toLowerCase()));
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
            <SettingsIcon size={18} className="mr-2" /> {labels.categories}
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
            <p className="text-sm font-bold text-gray-500 uppercase">{labels.availableCash}</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{balance.toLocaleString()} {labels.currency}</p>
         </div>
         <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-sm font-bold text-gray-500 uppercase">{labels.totalExpenses}</p>
            <p className="text-3xl font-bold text-red-600 mt-2">{totalExpenses.toLocaleString()} {labels.currency}</p>
         </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
         <div className="p-4 border-b border-gray-100">
            <div className="relative max-w-md">
               <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
               <input 
                 type="text" 
                 placeholder={labels.search} 
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
                 className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
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
                        <th className="p-4">{labels.description}</th>
                        <th className="p-4">{labels.expenseCategory}</th>
                        <th className="p-4 text-right">{labels.amount}</th>
                        <th className="p-4 text-right">{labels.actions}</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                     {filtered.length === 0 ? (
                        <tr><td colSpan={5} className="p-8 text-center text-gray-500">{labels.noData}</td></tr>
                     ) : (
                        filtered.map(tx => (
                           <tr key={tx.id} className={`hover:bg-gray-50 ${tx.isVoid ? 'bg-red-50/50 opacity-60' : ''}`}>
                              <td className="p-4 text-gray-600">{tx.date}</td>
                              <td className="p-4 font-medium text-gray-900">{tx.description}</td>
                              <td className="p-4"><span className="bg-gray-100 px-2 py-1 rounded text-xs">{getCategoryName(tx.categoryId)}</span></td>
                              <td className="p-4 text-right font-mono font-bold">{tx.amount.toLocaleString()}</td>
                              <td className="p-4 text-right">
                                 {tx.isVoid ? (
                                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-bold">VOID</span>
                                 ) : (
                                    <button onClick={() => { setSelectedTx(tx); setIsVoidOpen(true); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
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

      {/* Create Modal */}
      {isCreateOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
               <h3 className="text-lg font-bold mb-4">{labels.addExpense}</h3>
               <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                     <label className="block text-sm font-medium mb-1">{labels.expenseCategory}</label>
                     <select 
                        required className="w-full p-2 border rounded-lg"
                        value={formData.categoryId}
                        onChange={e => setFormData({...formData, categoryId: e.target.value})}
                     >
                        <option value="">-- Select --</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                     </select>
                  </div>
                  <div>
                     <label className="block text-sm font-medium mb-1">{labels.description}</label>
                     <input required className="w-full p-2 border rounded-lg" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium mb-1">{labels.amount}</label>
                        <input type="number" required className="w-full p-2 border rounded-lg" value={formData.amount} onChange={e => setFormData({...formData, amount: parseInt(e.target.value) || 0})} />
                     </div>
                     <div>
                        <label className="block text-sm font-medium mb-1">{labels.date}</label>
                        <input type="date" required className="w-full p-2 border rounded-lg" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                     </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                     <button type="button" onClick={() => setIsCreateOpen(false)} className="flex-1 py-2 border rounded-lg">{labels.cancel}</button>
                     <button type="submit" disabled={submitting} className="flex-1 py-2 bg-slate-800 text-white rounded-lg font-bold">{submitting ? <Loader2 className="animate-spin inline"/> : labels.save}</button>
                  </div>
               </form>
            </div>
         </div>
      )}

      {/* Category Modal */}
      {isCategoryOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold">{labels.categories}</h3>
                  <button onClick={() => setIsCategoryOpen(false)}><X size={20}/></button>
               </div>
               <form onSubmit={handleAddCategory} className="flex gap-2 mb-4">
                  <input className="flex-1 p-2 border rounded-lg" placeholder="New Category" value={newCatName} onChange={e => setNewCatName(e.target.value)} required />
                  <button className="px-4 bg-slate-800 text-white rounded-lg font-bold">Add</button>
               </form>
               <div className="space-y-2 max-h-60 overflow-y-auto">
                  {categories.map(c => (
                     <div key={c.id} className="p-2 border rounded bg-gray-50 text-sm font-medium">{c.name}</div>
                  ))}
               </div>
            </div>
         </div>
      )}

      <DeleteConfirmDialog 
         isOpen={isVoidOpen} 
         title="Void Expense" 
         description={<textarea className="w-full p-2 border rounded" placeholder="Reason" value={voidReason} onChange={e => setVoidReason(e.target.value)} required />}
         onConfirm={handleVoid} 
         onCancel={() => setIsVoidOpen(false)} 
         isDeleting={submitting}
      />
    </div>
  );
}
