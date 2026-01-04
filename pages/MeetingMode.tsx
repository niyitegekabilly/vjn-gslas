
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
              <span className={`text-xs mt-2 font-medium transition-colors hidden sm:block ${step >= s.id ? 'text-green-700' : 'text-gray-400'}`}>
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
                 <button onClick={() => handleMarkAll(true)} className="text-xs bg-white border border-gray-300 px-3 py-1 rounded hover:bg-gray-50 font-medium">All Present</button>
                 <button onClick={() => handleMarkAll(false)} className="text-xs bg-white border border-gray-300 px-3 py-1 rounded hover:bg-gray-50 font-medium">Reset</button>
               </div>
            </div>
            
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
               <table className="w-full text-left text-sm">
                  <thead className="bg-white text-gray-500 font-bold uppercase text-xs border-b">
                     <tr>
                        <th className="p-4">{labels.fullName}</th>
                        <th className="p-4 text-center">Status</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                     {entries.map((entry, index) => (
                        <tr key={entry.memberId} className={entry.present ? 'bg-blue-50/30' : ''}>
                           <td className="p-4 font-medium">{entry.fullName}</td>
                           <td className="p-4 text-center">
                              <button 
                                onClick={() => handleEntryChange(index, 'present', !entry.present)}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${entry.present ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                              >
                                 {entry.present ? labels.present : labels.absent}
                              </button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>

            {/* Mobile List */}
            <div className="md:hidden divide-y divide-gray-100">
               {entries.map((entry, index) => (
                  <div key={entry.memberId} className="p-4 flex items-center justify-between">
                     <span className="font-medium text-gray-900">{entry.fullName}</span>
                     <button 
                       onClick={() => handleEntryChange(index, 'present', !entry.present)}
                       className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${entry.present ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                     >
                        {entry.present ? labels.present : labels.absent}
                     </button>
                  </div>
               ))}
            </div>
          </div>
        )}

        {/* STEPS 2 & 3: FINANCIALS */}
        {(step === 2 || step === 3) && (
           <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-2">
                 <h3 className="font-bold text-gray-800 flex items-center">
                    {step === 2 ? <PiggyBank size={18} className="mr-2 text-green-600" /> : <Banknote size={18} className="mr-2 text-blue-600" />}
                    {step === 2 ? labels.collectSavings : labels.loansFines}
                 </h3>
                 <span className="text-xs text-gray-500 italic bg-white px-2 py-1 rounded border border-gray-200">{labels.onlyPresent}</span>
              </div>
              
              <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm">
                    <thead className="bg-white text-gray-500 font-bold uppercase text-xs border-b">
                       <tr>
                          <th className="p-4 w-1/3">{labels.fullName}</th>
                          {step === 2 ? (
                             <th className="p-4">{labels.shareCount}</th>
                          ) : (
                             <>
                                <th className="p-4">{labels.loanRepayments}</th>
                                <th className="p-4">{labels.finesCollected}</th>
                             </>
                          )}
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                       {entries.filter(e => e.present).map((entry) => {
                          const originalIndex = entries.findIndex(e => e.memberId === entry.memberId);
                          return (
                             <tr key={entry.memberId} className="hover:bg-gray-50">
                                <td className="p-4 font-medium text-gray-900">
                                   {entry.fullName}
                                   {step === 3 && entry.expectedLoan > 0 && (
                                      <div className="text-xs text-red-500 font-normal mt-1">Due: {entry.expectedLoan.toLocaleString()}</div>
                                   )}
                                </td>
                                {step === 2 ? (
                                   <td className="p-4">
                                      <div className="flex items-center">
                                         <button 
                                            onClick={() => handleEntryChange(originalIndex, 'shares', Math.max(0, entry.shares - 1))}
                                            className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-l-lg font-bold text-gray-600"
                                         >-</button>
                                         <input 
                                            type="number" 
                                            className="w-16 h-8 text-center border-y border-gray-200 outline-none font-bold"
                                            value={entry.shares}
                                            onChange={(e) => handleEntryChange(originalIndex, 'shares', parseInt(e.target.value) || 0)}
                                         />
                                         <button 
                                            onClick={() => handleEntryChange(originalIndex, 'shares', entry.shares + 1)}
                                            className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-r-lg font-bold text-gray-600"
                                         >+</button>
                                         <span className="ml-3 text-gray-500 text-xs hidden sm:inline">
                                            = {(entry.shares * (currentGroup?.shareValue || 0)).toLocaleString()} {labels.currency}
                                         </span>
                                      </div>
                                   </td>
                                ) : (
                                   <>
                                      <td className="p-4">
                                         <input 
                                            type="number"
                                            className="w-24 px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="0"
                                            value={entry.loanRepayment || ''}
                                            onChange={(e) => handleEntryChange(originalIndex, 'loanRepayment', parseInt(e.target.value) || 0)}
                                         />
                                      </td>
                                      <td className="p-4">
                                         <input 
                                            type="number"
                                            className="w-24 px-2 py-1 border rounded focus:ring-2 focus:ring-orange-500 outline-none"
                                            placeholder="0"
                                            value={entry.fines || ''}
                                            onChange={(e) => handleEntryChange(originalIndex, 'fines', parseInt(e.target.value) || 0)}
                                         />
                                      </td>
                                   </>
                                )}
                             </tr>
                          );
                       })}
                    </tbody>
                 </table>
              </div>
           </div>
        )}

        {/* STEP 4: SUMMARY */}
        {step === 4 && (
           <div className="space-y-6">
              <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg">
                 <h3 className="text-lg font-bold mb-4 flex items-center">
                    <ClipboardCheck className="mr-2" /> {labels.meetingSummary}
                 </h3>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                       <p className="text-slate-400 text-xs uppercase font-bold">{labels.attendance}</p>
                       <p className="text-2xl font-bold">{totals.presentCount} <span className="text-sm font-normal text-slate-400">/ {entries.length}</span></p>
                    </div>
                    <div>
                       <p className="text-slate-400 text-xs uppercase font-bold">{labels.sharesCollected}</p>
                       <p className="text-2xl font-bold text-green-400">{totals.shares.toLocaleString()}</p>
                    </div>
                    <div>
                       <p className="text-slate-400 text-xs uppercase font-bold">{labels.repayments}</p>
                       <p className="text-2xl font-bold text-blue-400">{totals.repay.toLocaleString()}</p>
                    </div>
                    <div>
                       <p className="text-slate-400 text-xs uppercase font-bold">{labels.totalCashIn}</p>
                       <p className="text-3xl font-bold text-white border-t border-slate-700 pt-1 mt-1">{totalCashIn.toLocaleString()} <span className="text-sm">RWF</span></p>
                    </div>
                 </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200">
                 <h4 className="font-bold text-gray-800 mb-2">{labels.reviewTx}</h4>
                 <p className="text-sm text-gray-500 mb-4">{labels.saveDesc}</p>
                 <div className="flex items-start bg-orange-50 p-3 rounded-lg border border-orange-100 text-orange-800 text-sm">
                    <AlertCircle size={18} className="mr-2 mt-0.5 flex-shrink-0" />
                    Ensure all cash collected matches the <strong>Total Cash In</strong> before saving.
                 </div>
              </div>
           </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40 lg:pl-64 transition-all duration-300">
         <div className="max-w-5xl mx-auto flex justify-between items-center">
            <button 
               onClick={prevStep}
               disabled={step === 1}
               className="px-6 py-2 rounded-lg font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-30 flex items-center"
            >
               <ChevronLeft size={20} className="mr-1" /> {labels.back}
            </button>
            
            {step < totalSteps ? (
               <button 
                  onClick={nextStep}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 flex items-center shadow-md"
               >
                  {labels.next} <ChevronRight size={20} className="ml-1" />
               </button>
            ) : (
               <div className="flex gap-2">
                  <button 
                     onClick={handleBulkSMS}
                     disabled={sendingSMS}
                     className="hidden sm:flex px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50 items-center"
                  >
                     {sendingSMS ? <Loader2 className="animate-spin mr-2" size={18}/> : <MessageSquare className="mr-2" size={18} />}
                     Send SMS
                  </button>
                  <button 
                     onClick={handleSubmit}
                     disabled={submitting}
                     className="px-8 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 flex items-center shadow-lg"
                  >
                     {submitting ? <Loader2 className="animate-spin mr-2" size={20} /> : <Save className="mr-2" size={20} />}
                     {labels.saveMeeting}
                  </button>
               </div>
            )}
         </div>
      </div>
    </div>
  );
}
