import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../App';
import { api } from '../api/client';
import { LABELS } from '../constants';
import { Transaction, Member } from '../types';
import { Gavel, Search, Plus, Loader2 } from 'lucide-react';

export default function Fines() {
  const { activeGroupId, lang } = useContext(AppContext);
  const labels = LABELS[lang];
  const [fines, setFines] = useState<Transaction[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeGroupId) return;
    setLoading(true);
    Promise.all([
      api.getFines(activeGroupId),
      api.getMembers(activeGroupId)
    ]).then(([f, m]) => {
      setFines(f);
      setMembers(m);
      setLoading(false);
    });
  }, [activeGroupId]);

  const getMemberName = (id?: string) => members.find(m => m.id === id)?.fullName || 'Unknown';

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-gray-400" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">{labels.fines}</h2>
        <button className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
          <Plus size={18} className="mr-2" />
          Record Fine
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="p-4">{labels.date}</th>
              <th className="p-4">Member</th>
              <th className="p-4">{labels.description}</th>
              <th className="p-4 text-right">{labels.amount} (RWF)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {fines.length === 0 ? (
               <tr><td colSpan={4} className="p-8 text-center text-gray-500">{labels.noData}</td></tr>
            ) : (
              fines.map(t => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="p-4 text-gray-500">{t.date}</td>
                  <td className="p-4 font-medium text-gray-900">{getMemberName(t.memberId)}</td>
                  <td className="p-4 text-gray-600">{t.description || 'General Fine'}</td>
                  <td className="p-4 text-right font-mono font-medium text-red-600">
                    {t.amount.toLocaleString()}
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