
import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../App';
import { api } from '../api/client';
import { LABELS } from '../constants';
import { Transaction, UserRole } from '../types';
import { Receipt, Plus, Loader2, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Expenses() {
  const { activeGroupId, lang } = useContext(AppContext);
  const labels = LABELS[lang];
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const canEdit = user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ADMIN || user?.role === UserRole.GROUP_LEADER;

  useEffect(() => {
    if (!activeGroupId) return;
    setLoading(true);
    api.getExpenses(activeGroupId).then(e => {
      setExpenses(e);
      setLoading(false);
    });
  }, [activeGroupId]);

  const filteredExpenses = expenses.filter(t => 
    (t.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.date.includes(searchTerm)
  );

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-gray-400" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">{labels.expenses}</h2>
        {canEdit && (
          <button className="flex items-center px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900">
            <Plus size={18} className="mr-2" />
            {labels.addExpense}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-red-50 p-6 rounded-xl border border-red-100">
           <h3 className="text-sm font-medium text-red-700 uppercase mb-2">{labels.totalExpenses}</h3>
           <p className="text-3xl font-bold text-red-900">
             {expenses.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()} {labels.currency}
           </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
           <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder={labels.search} 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
           </div>
        </div>
        
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="p-4">{labels.date}</th>
              <th className="p-4">{labels.description}</th>
              <th className="p-4 text-right">{labels.amount} ({labels.currency})</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredExpenses.length === 0 ? (
               <tr><td colSpan={3} className="p-8 text-center text-gray-500">{labels.noData}</td></tr>
            ) : (
              filteredExpenses.map(t => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="p-4 text-gray-500">{t.date}</td>
                  <td className="p-4 text-gray-900">{t.description || 'Operational Expense'}</td>
                  <td className="p-4 text-right font-mono font-medium text-gray-800">
                    -{t.amount.toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
