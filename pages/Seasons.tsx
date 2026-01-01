
import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { api } from '../api/client';
import { LABELS } from '../constants';
<<<<<<< HEAD
import { Cycle, ShareOutSnapshot } from '../types';
import { Sprout, Lock, Play, Archive, FileText, Calculator, AlertTriangle, CheckCircle, Loader2, RefreshCw, ShieldOff } from 'lucide-react';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
import { generatePDFReport } from '../services/pdfGenerator';
import { useAuth } from '../contexts/AuthContext';

export default function Seasons() {
  const { activeGroupId, lang, groups, refreshApp } = useContext(AppContext);
  const { user } = useAuth();
  const labels = LABELS[lang];
  const navigate = useNavigate();
  const group = groups.find(g => g.id === activeGroupId);

  const [cycle, setCycle] = useState<Cycle | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcData, setCalcData] = useState<any>(null);
  const [calculating, setCalculating] = useState(false);
  
  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  useEffect(() => {
    if (group?.currentCycleId) {
      setLoading(true);
      api.getCycle(group.currentCycleId).then(c => {
          setCycle(c || null);
          setLoading(false);
      });
    } else {
        setCycle(null);
    }
  }, [group]);

  const handleSimulateShareOut = async () => {
    if (!group) return;
    setCalculating(true);
    setShowCalculator(true);
    try {
        const result = await api.generateReport(group.id, 'SHARE_OUT', {});
        setCalcData(result);
    } catch (e) {
        alert("Calculation failed");
    } finally {
        setCalculating(false);
    }
  };

  const handleFinalizeSeason = async () => {
    if (!cycle || !calcData) return;
    setFinalizing(true);
    
    const snapshot: ShareOutSnapshot = {
        date: new Date().toISOString(),
        totalShares: calcData.members.reduce((a:number, m:any) => a + m.shares, 0),
        netWorth: calcData.summary.netWorth,
        valuePerShare: calcData.summary.valuePerShare,
        totalDistributable: calcData.summary.totalDistributable,
        breakdown: calcData.summary.breakdown,
        members: calcData.members.map((m: any) => ({
            id: m.id,
            name: m.name,
            shares: m.shares,
            payout: m.payout
        }))
    };

    try {
        await api.closeCycle(cycle.id, snapshot);
        setShowFinalizeConfirm(false);
        refreshApp();
        setCycle(null);
        alert(labels.seasonClosedSuccess || "Season Closed Successfully.");
    } catch (e: any) {
        alert("Error closing season: " + e.message);
    } finally {
        setFinalizing(false);
    }
  };

  const handlePrintReport = () => {
      if (!calcData || !group) return;
      generatePDFReport({
          reportType: 'SHARE_OUT',
          reportTitle: 'End-of-Season Share-Out Report',
          group: group,
          user: user,
          cycle: cycle,
          data: calcData
      });
  };

  if (!group) return <div className="p-8 text-center">{labels.noData}</div>;

  return (
    <div className="space-y-6 pb-12">
=======
import { Cycle } from '../types';
import { Sprout, Lock, Play, Archive, FileText } from 'lucide-react';

export default function Seasons() {
  const { activeGroupId, lang, groups } = useContext(AppContext);
  const labels = LABELS[lang];
  const navigate = useNavigate();
  const [cycle, setCycle] = useState<Cycle | null>(null);
  const group = groups.find(g => g.id === activeGroupId);

  useEffect(() => {
    if (group?.currentCycleId) {
      api.getCycle(group.currentCycleId).then(c => setCycle(c || null));
    }
  }, [group]);

  return (
    <div className="space-y-6">
>>>>>>> 7c17f3ba72aad7656a6b64c3bf0bfbc90a688a2a
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">{labels.cycleManagement}</h2>
      </div>

      {cycle ? (
<<<<<<< HEAD
        <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
                    <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <div className="p-3 bg-white rounded-full shadow-sm text-green-600 mr-4">
                        <Sprout size={24} />
                        </div>
                        <div>
                        <h3 className="text-lg font-bold text-green-900">{labels.currentActive}</h3>
                        <p className="text-green-700 text-sm">{labels.startedOn} {cycle.startDate}</p>
                        </div>
                    </div>
                    <span className="px-3 py-1 bg-green-200 text-green-800 rounded-full text-xs font-bold uppercase tracking-wide">
                        {cycle.status}
                    </span>
                    </div>
                </div>
                
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-500">{labels.interestRate}</span>
                        <p className="text-xl font-bold text-gray-900">{cycle.interestRate}% <span className="text-sm font-normal text-gray-400">/ {labels.months}</span></p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-500">{labels.status}</span>
                        <p className="text-xl font-bold text-gray-900">{labels.openForTx}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg flex items-center justify-center">
                        {!showCalculator ? (
                            <button 
                                onClick={handleSimulateShareOut}
                                className="w-full py-2 bg-slate-900 text-white rounded-lg text-sm font-bold shadow-md hover:bg-slate-800 flex items-center justify-center transition-all"
                            >
                                <Calculator size={16} className="mr-2" /> {labels.shareOutReport}
                            </button>
                        ) : (
                            <button 
                                onClick={() => setShowCalculator(false)}
                                className="w-full py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-300"
                            >
                                {labels.hideCalc}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {showCalculator && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {calculating ? (
                        <div className="p-12 text-center bg-white rounded-xl border border-gray-200">
                            <Loader2 className="animate-spin mx-auto text-blue-600 mb-2" size={32} />
                            <p className="text-gray-500">{labels.calculating}</p>
                        </div>
                    ) : calcData ? (
                        <div className="bg-white rounded-xl shadow-lg border border-blue-200 overflow-hidden">
                            <div className="p-4 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
                                <h3 className="font-bold text-blue-900 flex items-center">
                                    <FileText size={20} className="mr-2" /> {labels.shareOutPreview}
                                </h3>
                                <div className="text-xs font-bold text-blue-600 uppercase tracking-wide">
                                    {labels.simulated}
                                </div>
                            </div>

                            {/* Summary Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 border-b border-gray-100">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold">{labels.totalPayout}</p>
                                    <p className="text-2xl font-bold text-gray-900">{calcData.summary.totalDistributable.toLocaleString()} {labels.currency}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold">{labels.shareCount}</p>
                                    <p className="text-xl font-bold text-gray-900">{calcData.members.reduce((a:any,b:any)=>a+b.shares,0)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold">{labels.valuePerShare}</p>
                                    <p className="text-xl font-bold text-green-600">{Math.round(calcData.summary.valuePerShare).toLocaleString()} {labels.currency}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold">{labels.totalCash}</p>
                                    <p className="text-xl font-bold text-blue-600">{calcData.summary.cashOnHand.toLocaleString()} {labels.currency}</p>
                                </div>
                            </div>

                            {/* Granular Financial Breakdown */}
                            <div className="p-6 bg-gray-50 border-b border-gray-100">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Share Eligible */}
                                    <div className="bg-white p-4 rounded-lg border border-green-100 shadow-sm">
                                        <h4 className="text-xs font-bold text-green-700 uppercase mb-3 flex items-center border-b border-green-100 pb-2">
                                            <CheckCircle size={14} className="mr-2" /> {labels.shareEligible}
                                        </h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">{labels.contributionsSeason}</span>
                                                <span className="font-mono">{calcData.summary.breakdown.contributions.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">{labels.interestRate}</span>
                                                <span className="font-mono text-green-600">+{calcData.summary.breakdown.interest.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">{labels.profit}</span>
                                                <span className="font-mono text-green-600">+{calcData.summary.breakdown.investmentProfits.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">{labels.fines}</span>
                                                <span className="font-mono text-green-600">+{calcData.summary.breakdown.shareEligibleFines.toLocaleString()}</span>
                                            </div>
                                            <div className="border-t border-gray-100 my-2"></div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">{labels.expenses}</span>
                                                <span className="font-mono text-red-600">-{calcData.summary.breakdown.expenses.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Losses</span>
                                                <span className="font-mono text-red-600">-{calcData.summary.breakdown.investmentLosses.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Excluded Funds */}
                                    <div className="bg-white p-4 rounded-lg border border-red-100 shadow-sm opacity-80">
                                        <h4 className="text-xs font-bold text-red-700 uppercase mb-3 flex items-center border-b border-red-100 pb-2">
                                            <ShieldOff size={14} className="mr-2" /> {labels.excludedFunds}
                                        </h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">{labels.socialFund}</span>
                                                <span className="font-mono font-bold text-gray-800">{calcData.summary.breakdown.socialContributions.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">{labels.fines} (Social)</span>
                                                <span className="font-mono font-bold text-gray-800">{calcData.summary.breakdown.socialFines.toLocaleString()}</span>
                                            </div>
                                            <div className="mt-4 p-2 bg-red-50 text-red-800 text-xs rounded">
                                                {labels.reservedFundsMsg}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Warning if Issues */}
                            {calcData.summary.outstandingLoans > 0 && (
                                <div className="p-4 bg-orange-50 border-l-4 border-orange-400 text-orange-800 text-sm flex items-start">
                                    <AlertTriangle size={18} className="mr-2 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <strong>{labels.outstandingWarning} ({calcData.summary.outstandingLoans.toLocaleString()}).</strong><br/>
                                        Interest has been calculated based on portfolio value. Ensure these loans are recoverable assets.
                                    </div>
                                </div>
                            )}

                            {/* Member Table */}
                            <div className="overflow-x-auto max-h-96">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-100 text-gray-500 font-bold uppercase text-xs sticky top-0">
                                        <tr>
                                            <th className="p-3">{labels.members}</th>
                                            <th className="p-3 text-right">{labels.shareCount}</th>
                                            <th className="p-3 text-right">{labels.invested}</th>
                                            <th className="p-3 text-right">{labels.totalPayout}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {calcData.members.map((m: any) => (
                                            <tr key={m.id} className="hover:bg-gray-50">
                                                <td className="p-3 font-medium">{m.name}</td>
                                                <td className="p-3 text-right">{m.shares}</td>
                                                <td className="p-3 text-right text-gray-500">{m.invested.toLocaleString()}</td>
                                                <td className="p-3 text-right font-bold text-blue-700">{Math.round(m.payout).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Footer Actions */}
                            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                                <button 
                                    onClick={handlePrintReport}
                                    className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                                >
                                    {labels.printPdf}
                                </button>
                                <button 
                                    onClick={() => setShowFinalizeConfirm(true)}
                                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold shadow-sm flex items-center"
                                >
                                    <Lock size={16} className="mr-2" /> {labels.finalizeSeason}
                                </button>
                            </div>
                        </div>
                    ) : null}
                </div>
            )}
        </>
=======
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
             <div className="flex items-center justify-between">
               <div className="flex items-center">
                 <div className="p-3 bg-white rounded-full shadow-sm text-green-600 mr-4">
                   <Sprout size={24} />
                 </div>
                 <div>
                   <h3 className="text-lg font-bold text-green-900">{labels.currentActive}</h3>
                   <p className="text-green-700 text-sm">{labels.startedOn} {cycle.startDate}</p>
                 </div>
               </div>
               <span className="px-3 py-1 bg-green-200 text-green-800 rounded-full text-xs font-bold uppercase tracking-wide">
                 {cycle.status}
               </span>
             </div>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="p-4 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-500">{labels.interestRate}</span>
                <p className="text-xl font-bold text-gray-900">{cycle.interestRate}% <span className="text-sm font-normal text-gray-400">/ month</span></p>
             </div>
             <div className="p-4 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-500">{labels.status}</span>
                <p className="text-xl font-bold text-gray-900">{labels.openForTx}</p>
             </div>
             <div className="p-4 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-500">{labels.actions}</span>
                <button className="block w-full text-center mt-1 py-1 px-3 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 font-medium">
                  <Lock size={14} className="inline mr-1" /> {labels.closeSeason}
                </button>
             </div>
          </div>
          
          <div className="p-6 border-t border-gray-100">
             <h4 className="font-semibold text-gray-800 mb-3">{labels.shareOutReport}</h4>
             <p className="text-sm text-gray-600 mb-4">
               {labels.shareOutDesc}
             </p>
             <div className="flex gap-4">
                <button 
                  onClick={() => navigate('/reports', { state: { reportId: 'SHARE_OUT' } })}
                  className="flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                >
                  <FileText size={16} className="mr-2" /> 
                  {cycle.status === 'CLOSED' ? labels.viewReport : labels.simulateShareOut}
                </button>
                <button className="flex items-center text-gray-500 text-sm font-medium hover:underline">
                  <Archive size={16} className="mr-2" /> {labels.viewPrevious}
                </button>
             </div>
          </div>
        </div>
>>>>>>> 7c17f3ba72aad7656a6b64c3bf0bfbc90a688a2a
      ) : (
        <div className="p-12 text-center bg-white rounded-xl border border-dashed border-gray-300">
           <p className="text-gray-500 mb-4">{labels.noActiveSeason}</p>
           <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center mx-auto">
             <Play size={18} className="mr-2" /> {labels.startNewSeason}
           </button>
        </div>
      )}
<<<<<<< HEAD

      <DeleteConfirmDialog 
        isOpen={showFinalizeConfirm}
        title={labels.confirmSeasonClose}
        description={
            <div className="text-left space-y-3">
                <p><strong>{labels.irreversibleAction}</strong></p>
                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                    <li>The current share value will be locked.</li>
                    <li>Social funds and share-eligible funds have been verified.</li>
                    <li>All financial records for this cycle will be archived.</li>
                    <li>No further transactions can be added to this season.</li>
                </ul>
            </div>
        }
        onConfirm={handleFinalizeSeason}
        onCancel={() => setShowFinalizeConfirm(false)}
        isDeleting={finalizing}
        confirmLabel={labels.closeSeason}
        variant="danger"
      />
=======
>>>>>>> 7c17f3ba72aad7656a6b64c3bf0bfbc90a688a2a
    </div>
  );
}
