import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../App';
import { api } from '../api/client';
import { LABELS } from '../constants';
import { Transaction, Member } from '../types';
import { PiggyBank, Search, Loader2 } from 'lucide-react';

export default function Contributions() {
  const { activeGroupId, lang } = useContext(AppContext);
  const labels = LABELS[lang];
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
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
  }, [activeGroupId]);

  const getMemberName = (id?: string) => members.find(m => m.id === id)?.fullName || 'Group';

  const filtered = transactions.filter(t => 
    getMemberName(t.memberId).toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.date.includes(searchTerm)
  );

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-gray-400" /></div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">{labels.shares} / {labels.financials}</h2>
      
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
         <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by member or date..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
         </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="p-4">{labels.date}</th>
              <th className="p-4">Member</th>
              <th className="p-4">Share Count</th>
              <th className="p-4 text-right">{labels.amount} (RWF)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
               <tr><td colSpan={4} className="p-8 text-center text-gray-500">{labels.noData}</td></tr>
            ) : (
              filtered.map(t => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="p-4 text-gray-500">{t.date}</td>
                  <td className="p-4 font-medium text-gray-900">{getMemberName(t.memberId)}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                       <PiggyBank size={12} className="mr-1" /> {t.shareCount}
                    </span>
                  </td>
                  <td className="p-4 text-right font-mono font-medium text-green-600">
                    +{t.amount.toLocaleString()}
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