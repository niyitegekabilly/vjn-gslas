
import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../App';
import { LABELS } from '../constants';
import { api } from '../api/client';
import { Member, LoanStatus, Loan } from '../types';
import { Save, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface MeetingEntry {
  memberId: string;
  fullName: string;
  present: boolean;
  shares: number;
  loanRepayment: number;
  fines: number;
  expectedLoan: number; // Balance due
}

export default function MeetingMode() {
  const { lang, activeGroupId, groups } = useContext(AppContext);
  const labels = LABELS[lang];
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [entries, setEntries] = useState<MeetingEntry[]>([]);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [summary, setSummary] = useState({ shares: 0, repay: 0, fines: 0 });

  const currentGroup = groups.find(g => g.id === activeGroupId);

  // Initialize form with member list
  useEffect(() => {
    if (!activeGroupId) return;
    setLoading(true);
    setSaved(false);
    
    Promise.all([
      api.getMembers(activeGroupId),
      api.getLoans(activeGroupId)
    ]).then(([members, loans]) => {
      const initialEntries: MeetingEntry[] = members.map(m => {
        const activeLoan = loans.find(l => l.memberId === m.id && l.status === LoanStatus.ACTIVE);
        return {
          memberId: m.id,
          fullName: m.fullName,
          present: true,
          shares: currentGroup?.minShares || 1, 
          loanRepayment: 0,
          fines: 0,
          expectedLoan: activeLoan ? activeLoan.balance : 0
        };
      });
      setEntries(initialEntries);
      setLoading(false);
    });
  }, [activeGroupId, currentGroup]);

  // Recalculate summary totals
  useEffect(() => {
    const newSum = entries.reduce((acc, curr) => ({
      shares: acc.shares + (curr.shares * (currentGroup?.shareValue || 0)),
      repay: acc.repay + curr.loanRepayment,
      fines: acc.fines + curr.fines
    }), { shares: 0, repay: 0, fines: 0 });
    setSummary(newSum);
  }, [entries, currentGroup]);

  const handleEntryChange = (index: number, field: keyof MeetingEntry, value: any) => {
    const newEntries = [...entries];
    newEntries[index] = { ...newEntries[index], [field]: value };
    setEntries(newEntries);
  };

  const handleSubmit = () => {
    setSubmitting(true);
    api.submitMeeting(activeGroupId, date, entries).then(() => {
      setSubmitting(false);
      setSaved(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  if (loading) {
    return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-gray-400" /></div>;
  }

  if (saved) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-white rounded-xl shadow-sm">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
          <CheckCircle size={32} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{labels.meetingSaved}</h2>
        <p className="text-gray-500 mb-6">{labels.meetingSavedDesc}</p>
        <button 
          onClick={() => { setSaved(false); window.location.reload(); /* Simple reload to reset state properly */ }}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {labels.startNewMeeting}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{labels.startMeeting}</h2>
          <p className="text-gray-500 text-sm mt-1">{labels.meetingDesc}</p>
        </div>
        <div className="mt-4 md:mt-0">
          <input 
            type="date" 
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
          />
        </div>
      </div>

      {/* Summary Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
          <p className="text-sm text-green-600 font-medium">{labels.sharesCollected}</p>
          <p className="text-2xl font-bold text-green-700">{summary.shares.toLocaleString()} {labels.currency}</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <p className="text-sm text-blue-600 font-medium">{labels.loanRepayments}</p>
          <p className="text-2xl font-bold text-blue-700">{summary.repay.toLocaleString()} {labels.currency}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-100">
          <p className="text-sm text-red-600 font-medium">{labels.finesCollected}</p>
          <p className="text-2xl font-bold text-red-700">{summary.fines.toLocaleString()} {labels.currency}</p>
        </div>
      </div>

      {/* Main Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold">
                <th className="p-4 w-12">#</th>
                <th className="p-4 min-w-[150px]">Member</th>
                <th className="p-4 text-center">Att.</th>
                <th className="p-4 min-w-[120px]">{labels.shareCount} (@{currentGroup?.shareValue})</th>
                <th className="p-4 min-w-[140px]">{labels.loanRepayments}</th>
                <th className="p-4 min-w-[100px]">{labels.fines}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {entries.map((entry, idx) => (
                <tr key={entry.memberId} className={`hover:bg-gray-50 ${!entry.present ? 'bg-red-50' : ''}`}>
                  <td className="p-4 text-gray-500">{idx + 1}</td>
                  <td className="p-4">
                    <div className="font-medium text-gray-900">{entry.fullName}</div>
                    {entry.expectedLoan > 0 && (
                      <div className="text-xs text-orange-600 flex items-center mt-1">
                        <AlertCircle size={10} className="mr-1" />
                        Due: {entry.expectedLoan.toLocaleString()}
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <input 
                      type="checkbox"
                      checked={entry.present}
                      onChange={(e) => handleEntryChange(idx, 'present', e.target.checked)}
                      className="w-5 h-5 text-green-600 rounded focus:ring-green-500 cursor-pointer"
                    />
                  </td>
                  <td className="p-4">
                    <input 
                      type="number"
                      min="0"
                      max={currentGroup?.maxShares}
                      value={entry.shares}
                      onChange={(e) => handleEntryChange(idx, 'shares', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                    />
                    <div className="text-xs text-gray-400 mt-1 text-right">
                      {((entry.shares || 0) * (currentGroup?.shareValue || 0)).toLocaleString()} {labels.currency}
                    </div>
                  </td>
                  <td className="p-4">
                     <input 
                      type="number"
                      min="0"
                      value={entry.loanRepayment}
                      disabled={entry.expectedLoan === 0}
                      onChange={(e) => handleEntryChange(idx, 'loanRepayment', parseInt(e.target.value) || 0)}
                      className={`w-full px-3 py-2 border rounded focus:ring-blue-500 ${entry.expectedLoan > 0 ? 'border-gray-300' : 'bg-gray-100 text-gray-400'}`}
                    />
                  </td>
                  <td className="p-4">
                    <input 
                      type="number"
                      min="0"
                      value={entry.fines}
                      onChange={(e) => handleEntryChange(idx, 'fines', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-red-500 focus:border-red-500"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={`flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-sm transition-all ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {submitting ? <Loader2 className="animate-spin mr-2" size={20} /> : <Save size={20} className="mr-2" />}
            {submitting ? labels.processing : labels.saveMeeting}
          </button>
        </div>
      </div>
    </div>
  );
}
