
import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../App';
import { LABELS } from '../constants';
import { api } from '../api/client';
import { LoanStatus } from '../types';
import { 
  Save, AlertCircle, CheckCircle, Loader2, 
  ChevronRight, ChevronLeft, Users, PiggyBank, 
  Banknote, ClipboardCheck, Calendar, MessageSquare
} from 'lucide-react';
import { TableRowSkeleton } from '../components/Skeleton';
import { SyncStatus } from '../components/SyncStatus';
import { useNavigate } from 'react-router-dom';

interface MeetingEntry {
  memberId: string;
  fullName: string;
  phone?: string;
  present: boolean;
  shares: number;
  loanRepayment: number;
  fines: number;
  expectedLoan: number; // Balance due
}

export default function MeetingMode() {
  const { lang, activeGroupId, groups, refreshApp, isOnline } = useContext(AppContext);
  const labels = LABELS[lang];
  const navigate = useNavigate();
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [entries, setEntries] = useState<MeetingEntry[]>([]);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sendingSMS, setSendingSMS] = useState(false);
  
  // Wizard State
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const currentGroup = groups.find(g => g.id === activeGroupId);

  const fetchMeetingData = () => {
    if (!activeGroupId) return;
    setLoading(true);
    setSaved(false);
    setSendingSMS(false);
    
    Promise.all([
      api.getMembers(activeGroupId),
      api.getLoans(activeGroupId)
    ]).then(([members, loans]) => {
      const initialEntries: MeetingEntry[] = members.map(m => {
        const activeLoan = loans.find(l => l.memberId === m.id && (l.status === LoanStatus.ACTIVE || l.status === LoanStatus.DEFAULTED));
        return {
          memberId: m.id,
          fullName: m.fullName,
          phone: m.phone,
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
  };

  // Initialize form with member list
  useEffect(() => {
    fetchMeetingData();
  }, [activeGroupId, currentGroup]);

  // Calculations
  const totals = entries.reduce((acc, curr) => ({
    shares: acc.shares + (curr.present ? (curr.shares * (currentGroup?.shareValue || 0)) : 0),
    repay: acc.repay + (curr.present ? curr.loanRepayment : 0),
    fines: acc.fines + (curr.present ? curr.fines : 0),
    presentCount: acc.presentCount + (curr.present ? 1 : 0)
  }), { shares: 0, repay: 0, fines: 0, presentCount: 0 });

  const totalCashIn = totals.shares + totals.repay + totals.fines;

  const handleEntryChange = (index: number, field: keyof MeetingEntry, value: any) => {
    const newEntries = [...entries];
    newEntries[index] = { ...newEntries[index], [field]: value };
    setEntries(newEntries);
  };

  const handleMarkAll = (present: boolean) => {
    const newEntries = entries.map(e => ({ ...e, present }));
    setEntries(newEntries);
  };

  const handleSubmit = () => {
    if (!isOnline) {
      alert("Cannot save meeting while offline. Please connect to the internet.");
      return;
    }
    setSubmitting(true);
    // Filter out transactions for absent members just in case, though UI hides them
    const finalEntries = entries.map(e => e.present ? e : { ...e, shares: 0, loanRepayment: 0, fines: 0 });
    
    api.submitMeeting(activeGroupId, date, finalEntries).then(() => {
      setSubmitting(false);
      setSaved(true);
      refreshApp(); // Update global context data
      // Redirect to reports page
      navigate('/reports', { 
        state: { 
          reportId: 'SAVINGS_SUMMARY', 
          successMessage: 'Meeting saved successfully. Review the report below.' 
        } 
      });
    });
  };

  const handleBulkSMS = async () => {
    if (!isOnline) {
      alert("Cannot send SMS while offline.");
      return;
    }
    setSendingSMS(true);
    const recipients = entries.filter(e => e.present && e.phone && (e.shares > 0 || e.loanRepayment > 0 || e.fines > 0));
    
    let sentCount = 0;
    for (const r of recipients) {
        if (!r.phone) continue;
        const shareAmount = r.shares * (currentGroup?.shareValue || 0);
        const total = shareAmount + r.loanRepayment + r.fines;
        const msg = `VJN Receipt: Paid ${total.toLocaleString()} RWF on ${date}. (Shares: ${shareAmount}, Loan: ${r.loanRepayment}, Fine: ${r.fines})`;
        try {
            await api.sendSMS(r.phone, msg);
            sentCount++;
        } catch (e) {
            console.error("SMS Failed", e);
        }
    }
    alert(`Sent ${sentCount} SMS receipts successfully.`);
    setSendingSMS(false);
  };

  const handleStartNew = () => {
    setStep(1);
    fetchMeetingData();
  };

  const nextStep = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setStep(Math.min(step + 1, totalSteps));
  };
  
  const prevStep = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setStep(Math.max(step - 1, 1));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-gray-200 rounded animate-pulse w-1/3 mb-6" />
        {[...Array(6)].map((_, i) => <TableRowSkeleton key={i} />)}
      </div>
    );
  }

  // Not rendering success view anymore as we redirect, 
  // but keeping it in code in case redirection is removed later or fails.
  if (saved) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-white rounded-xl shadow-sm animate-in fade-in zoom-in-95 duration-300">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
          <CheckCircle size={40} />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">{labels.meetingSaved}</h2>
        <p className="text-gray-500 mb-8 text-center max-w-md">{labels.meetingSavedDesc}</p>
        
        <div className="flex gap-4">
            <button 
            onClick={() => navigate('/reports')}
            className="px-8 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 font-medium transition-transform hover:scale-105"
            >
            View Reports
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            {labels.startMeeting}
            <SyncStatus isOnline={isOnline} isSyncing={submitting} />
          </h2>
          <div className="flex items-center text-gray-500 text-sm mt-1">
             <Calendar size={14} className="mr-1" />
             <span>{new Date(date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
        {step === 1 && (
          <input 
            type="date" 
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none w-full sm:w-auto"
          />
        )}
      </div>

      {/* Stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 -z-10 rounded-full"></div>
          <div 
            className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-green-500 transition-all duration-500 -z-10 rounded-full"
            style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}
          ></div>
          
          {[
            { id: 1, label: labels.stepAttendance, icon: Users },
            { id: 2, label: labels.stepSavings, icon: PiggyBank },
            { id: 3, label: labels.stepLoans, icon: Banknote },
            { id: 4, label: labels.stepSummary, icon: ClipboardCheck },
          ].map((s) => (
            <div key={s.id} className="flex flex-col items-center">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-4 ${
                  step >= s.id 
                    ? 'bg-green-600 border-green-100 text-white scale-110 shadow-md' 
                    : 'bg-white border-gray-100 text-gray-400'
                }`}
              >
                <s.icon size={18} />
              </div>
              <span className={`text-xs mt-2 font-medium transition-colors ${step >= s.id ? 'text-green-700' : 'text-gray-400'}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="animate-in fade-in slide-in-from-right-4 duration-300">
        
        {/* STEP 1: ATTENDANCE */}
        {step === 1 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
               <h3 className="font-bold text-gray-800 flex items-center">
                 <Users size={18} className="mr-2 text-blue-600" /> {labels.markAttendance}
               </h3>
               <div className="space-x-2">
                 <button onClick={() => handleMarkAll(true)} className="text-xs bg-white border border-gray-300 px-2 py-1 rounded hover:bg-gray-50">{labels.allPresent}</button>
                 <button onClick={() => handleMarkAll(false)} className="text-xs bg-white border border-gray-300 px-2 py-1 rounded hover:bg-gray-50">{labels.reset}</button>
               </div>
            </div>
            <div className="divide-y divide-gray-100">
              {entries.map((entry, idx) => (
                <div key={entry.memberId} className={`p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer ${!entry.present ? 'bg-red-50/30' : ''}`} onClick={() => handleEntryChange(idx, 'present', !entry.present)}>
                   <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${entry.present ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                         <span className="font-bold text-sm">{entry.fullName.charAt(0)}</span>
                      </div>
                      <div>
                         <p className={`font-medium ${entry.present ? 'text-gray-900' : 'text-gray-500'}`}>{entry.fullName}</p>
                         <p className="text-xs text-gray-400">ID: {entry.memberId.slice(0,6)}</p>
                      </div>
                   </div>
                   <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${entry.present ? 'bg-green-500 border-green-500' : 'border-gray-300 bg-white'}`}>
                      {entry.present && <CheckCircle size={16} className="text-white" />}
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: SAVINGS */}
        {step === 2 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
               <h3 className="font-bold text-gray-800 flex items-center">
                 <PiggyBank size={18} className="mr-2 text-green-600" /> {labels.collectSavings}
               </h3>
               <p className="text-xs text-gray-500 mt-1">{labels.onlyPresent}</p>
            </div>
            <div className="divide-y divide-gray-100">
              {entries.filter(e => e.present).map((entry) => {
                const idx = entries.findIndex(e => e.memberId === entry.memberId);
                return (
                  <div key={entry.memberId} className="p-4 flex items-center justify-between hover:bg-gray-50">
                     <div className="flex-1">
                        <p className="font-medium text-gray-900">{entry.fullName}</p>
                        <p className="text-xs text-green-600 font-medium">
                           Total: {(entry.shares * (currentGroup?.shareValue || 0)).toLocaleString()} {labels.currency}
                        </p>
                     </div>
                     <div className="flex items-center gap-3">
                        <label className="text-xs font-bold text-gray-400 uppercase hidden sm:block">{labels.shareCount}</label>
                        <input 
                          type="number"
                          min="0"
                          max={currentGroup?.maxShares}
                          value={entry.shares}
                          onChange={(e) => handleEntryChange(idx, 'shares', parseInt(e.target.value) || 0)}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center font-bold text-gray-900 focus:ring-2 focus:ring-green-500 outline-none"
                        />
                     </div>
                  </div>
                );
              })}
              {entries.filter(e => e.present).length === 0 && (
                <div className="p-8 text-center text-gray-500">{labels.noData}</div>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: LOANS & FINES */}
        {step === 3 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
               <h3 className="font-bold text-gray-800 flex items-center">
                 <Banknote size={18} className="mr-2 text-orange-600" /> {labels.loansFines}
               </h3>
            </div>
            <div className="divide-y divide-gray-100">
              {entries.filter(e => e.present).map((entry) => {
                const idx = entries.findIndex(e => e.memberId === entry.memberId);
                const hasLoan = entry.expectedLoan > 0;
                
                return (
                  <div key={entry.memberId} className={`p-4 hover:bg-gray-50 ${hasLoan ? 'bg-blue-50/20' : ''}`}>
                     <div className="mb-2">
                        <div className="flex justify-between items-center">
                           <p className="font-medium text-gray-900">{entry.fullName}</p>
                           {hasLoan && (
                             <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full font-bold flex items-center">
                                <AlertCircle size={10} className="mr-1" /> Due: {entry.expectedLoan.toLocaleString()}
                             </span>
                           )}
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className={`block text-xs font-bold mb-1 ${hasLoan ? 'text-blue-700' : 'text-gray-400'}`}>{labels.loanRepayments}</label>
                           <input 
                             type="number"
                             min="0"
                             disabled={!hasLoan}
                             placeholder={!hasLoan ? '-' : '0'}
                             value={entry.loanRepayment || ''}
                             onChange={(e) => handleEntryChange(idx, 'loanRepayment', parseInt(e.target.value) || 0)}
                             className={`w-full px-3 py-2 border rounded-lg text-sm ${hasLoan ? 'border-blue-300 focus:ring-blue-500' : 'bg-gray-50 border-gray-200 cursor-not-allowed'}`}
                           />
                        </div>
                        <div>
                           <label className="block text-xs font-bold text-gray-500 mb-1">{labels.fines}</label>
                           <input 
                             type="number"
                             min="0"
                             value={entry.fines || ''}
                             placeholder="0"
                             onChange={(e) => handleEntryChange(idx, 'fines', parseInt(e.target.value) || 0)}
                             className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-red-500 outline-none"
                           />
                        </div>
                     </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 4: SUMMARY */}
        {step === 4 && (
          <div className="space-y-6">
             <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-lg font-bold mb-6 text-center text-slate-200 uppercase tracking-widest">{labels.meetingSummary}</h3>
                <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                   <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
                      <p className="text-xs text-slate-400 uppercase font-bold mb-1">{labels.sharesCollected}</p>
                      <p className="text-2xl font-bold text-green-400">{totals.shares.toLocaleString()}</p>
                   </div>
                   <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
                      <p className="text-xs text-slate-400 uppercase font-bold mb-1">{labels.repayments}</p>
                      <p className="text-2xl font-bold text-blue-400">{totals.repay.toLocaleString()}</p>
                   </div>
                   <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
                      <p className="text-xs text-slate-400 uppercase font-bold mb-1">{labels.finesCollected}</p>
                      <p className="text-2xl font-bold text-red-400">{totals.fines.toLocaleString()}</p>
                   </div>
                   <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
                      <p className="text-xs text-slate-400 uppercase font-bold mb-1">{labels.attendance}</p>
                      <p className="text-2xl font-bold">{totals.presentCount} <span className="text-sm font-normal text-slate-400">/ {entries.length}</span></p>
                   </div>
                </div>
                <div className="mt-8 pt-6 border-t border-white/10 text-center">
                   <p className="text-sm text-slate-400 mb-2">{labels.totalCashIn}</p>
                   <p className="text-4xl font-black text-white">{totalCashIn.toLocaleString()} <span className="text-lg font-medium text-slate-500">{labels.currency}</span></p>
                </div>
             </div>

             <div className="bg-white p-4 rounded-xl border border-gray-200">
                <h4 className="font-bold text-gray-800 mb-2">{labels.reviewTx}</h4>
                <p className="text-sm text-gray-500">
                   {labels.saveDesc}
                </p>
                {!isOnline && (
                  <div className="mt-3 p-3 bg-red-50 text-red-700 text-sm font-bold rounded-lg flex items-center">
                    <AlertCircle size={16} className="mr-2" />
                    You are offline. Reconnect to save data.
                  </div>
                )}
             </div>
          </div>
        )}

      </div>

      {/* Sticky Footer Navigation */}
      <div className="fixed bottom-0 left-0 lg:left-64 right-0 p-4 pr-24 bg-white border-t border-gray-200 shadow-lg z-30 flex justify-between items-center print:hidden">
         <button 
           onClick={prevStep}
           disabled={step === 1 || submitting}
           className={`px-6 py-3 rounded-xl font-medium flex items-center transition-colors ${step === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
         >
           <ChevronLeft size={20} className="mr-1" /> {labels.back}
         </button>

         <div className="text-xs font-bold text-gray-400 uppercase tracking-widest hidden sm:block">
            {labels.step} {step} {labels.of} {totalSteps}
         </div>

         {step < totalSteps ? (
           <button 
             onClick={nextStep}
             className="px-8 py-3 bg-slate-800 text-white rounded-xl font-bold shadow-lg hover:bg-slate-900 flex items-center transition-transform active:scale-95"
           >
             {labels.next} <ChevronRight size={20} className="ml-1" />
           </button>
         ) : (
           <button 
             onClick={handleSubmit}
             disabled={submitting || !isOnline}
             className={`px-8 py-3 rounded-xl font-bold shadow-lg flex items-center transition-transform active:scale-95 ${
               isOnline 
                 ? 'bg-green-600 text-white hover:bg-green-700' 
                 : 'bg-gray-400 text-gray-100 cursor-not-allowed'
             }`}
           >
             {submitting ? <Loader2 className="animate-spin mr-2" size={20} /> : <Save size={20} className="mr-2" />}
             {labels.saveMeeting}
           </button>
         )}
      </div>
    </div>
  );
}
