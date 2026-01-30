
import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { api } from '../api/client';
import { LABELS } from '../constants';
import { Cycle, ShareOutSnapshot, UserRole } from '../types';
import { Sprout, Lock, Play, Archive, FileText, Calculator, AlertTriangle, CheckCircle, Loader2, RefreshCw, ShieldOff, Edit, X, Calendar, Percent, History } from 'lucide-react';
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
  const [previousCycles, setPreviousCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcData, setCalcData] = useState<any>(null);
  const [calculating, setCalculating] = useState(false);
  
  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  // Create Season Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newSeasonForm, setNewSeasonForm] = useState({
    interestRate: 5,
    startDate: new Date().toISOString().split('T')[0]
  });

  // Edit Cycle Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    interestRate: 5
  });

  // History View
  const [showHistory, setShowHistory] = useState(false);

  const isAdmin = user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ADMIN;

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

  const fetchHistory = async () => {
    if (!activeGroupId) return;
    setLoadingHistory(true);
    try {
      const cycles = await api.getCycles(activeGroupId);
      setPreviousCycles(cycles.filter(c => c.status === 'CLOSED'));
    } catch (e) {
      console.error('Failed to load history:', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (showHistory && activeGroupId) {
      fetchHistory();
    }
  }, [showHistory, activeGroupId]);

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

  const handleCreateSeason = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGroupId) return;
    setCreating(true);
    try {
      const newCycle = await api.createCycle(activeGroupId, newSeasonForm.interestRate, newSeasonForm.startDate);
      setCycle(newCycle);
      setShowCreateModal(false);
      setNewSeasonForm({ interestRate: 5, startDate: new Date().toISOString().split('T')[0] });
      refreshApp();
      alert('Season created successfully!');
    } catch (e: any) {
      alert('Failed to create season: ' + (e.message || 'Unknown error'));
    } finally {
      setCreating(false);
    }
  };

  const handleEditCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cycle) return;
    setEditing(true);
    try {
      const updated = await api.updateCycle(cycle.id, { interestRate: editForm.interestRate });
      setCycle(updated);
      setShowEditModal(false);
      alert('Cycle updated successfully!');
    } catch (e: any) {
      alert('Failed to update cycle: ' + (e.message || 'Unknown error'));
    } finally {
      setEditing(false);
    }
  };

  const openEditModal = () => {
    if (cycle) {
      setEditForm({ interestRate: cycle.interestRate });
      setShowEditModal(true);
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
        setShowCalculator(false);
        setCalcData(null);
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Sprout className="text-green-600" size={24} />
          {labels.cycleManagement}
        </h2>
        <div className="flex gap-2">
          {isAdmin && (
            <>
              {cycle && (
                <button
                  onClick={openEditModal}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm"
                >
                  <Edit size={16} />
                  Edit Season
                </button>
              )}
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium shadow-sm"
              >
                <History size={16} />
                {showHistory ? 'Hide' : 'View'} History
              </button>
            </>
          )}
        </div>
      </div>

      {/* Previous Seasons History */}
      {showHistory && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-top-4">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Archive size={18} />
              Previous Seasons
            </h3>
            <button
              onClick={() => setShowHistory(false)}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
          </div>
          {loadingHistory ? (
            <div className="p-8 text-center">
              <Loader2 className="animate-spin mx-auto text-blue-600 mb-2" size={24} />
              <p className="text-gray-500 text-sm">Loading history...</p>
            </div>
          ) : previousCycles.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Archive size={48} className="mx-auto mb-2 text-gray-300" />
              <p>No previous seasons found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 text-gray-600 font-bold uppercase text-xs border-b border-gray-200">
                  <tr>
                    <th className="p-4 text-left">Start Date</th>
                    <th className="p-4 text-left">End Date</th>
                    <th className="p-4 text-right">Interest Rate</th>
                    <th className="p-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {previousCycles.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="p-4 font-medium text-gray-900">{c.startDate}</td>
                      <td className="p-4 text-gray-600">{c.endDate || 'N/A'}</td>
                      <td className="p-4 text-right font-mono">{c.interestRate}%</td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          c.status === 'CLOSED' ? 'bg-gray-100 text-gray-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center bg-white rounded-xl border border-gray-200">
          <Loader2 className="animate-spin mx-auto text-blue-600 mb-2" size={32} />
          <p className="text-gray-500">Loading season...</p>
        </div>
      ) : cycle ? (
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
                        <p className="text-green-700 text-sm flex items-center gap-1">
                          <Calendar size={14} />
                          {labels.startedOn} {cycle.startDate}
                        </p>
                        </div>
                    </div>
                    <span className="px-3 py-1 bg-green-200 text-green-800 rounded-full text-xs font-bold uppercase tracking-wide">
                        {cycle.status}
                    </span>
                    </div>
                </div>
                
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-500 flex items-center gap-1 mb-1">
                          <Percent size={14} />
                          {labels.interestRate}
                        </span>
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
                                onClick={() => {
                                  setShowCalculator(false);
                                  setCalcData(null);
                                }}
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
                                {isAdmin && (
                                  <button 
                                      onClick={() => setShowFinalizeConfirm(true)}
                                      className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold shadow-sm flex items-center"
                                  >
                                      <Lock size={16} className="mr-2" /> {labels.finalizeSeason}
                                  </button>
                                )}
                            </div>
                        </div>
                    ) : null}
                </div>
            )}
        </>
      ) : (
        <div className="p-12 text-center bg-white rounded-xl border border-dashed border-gray-300">
           <p className="text-gray-500 mb-4">{labels.noActiveSeason}</p>
           {isAdmin && (
             <button 
               onClick={() => setShowCreateModal(true)}
               className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center mx-auto font-medium shadow-sm"
             >
               <Play size={18} className="mr-2" /> {labels.startNewSeason}
             </button>
           )}
        </div>
      )}

      {/* Create Season Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in zoom-in-95">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Play size={20} className="text-green-600" />
                Start New Season
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateSeason} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={newSeasonForm.startDate}
                  onChange={(e) => setNewSeasonForm({ ...newSeasonForm, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Percent size={14} />
                  Interest Rate (%) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  step="0.1"
                  value={newSeasonForm.interestRate}
                  onChange={(e) => setNewSeasonForm({ ...newSeasonForm, interestRate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="5.0"
                />
                <p className="text-xs text-gray-500 mt-1">Monthly interest rate for this season</p>
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center justify-center disabled:opacity-50"
                >
                  {creating ? (
                    <>
                      <Loader2 className="animate-spin mr-2" size={18} />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Play size={16} className="mr-2" />
                      Create Season
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Cycle Modal */}
      {showEditModal && cycle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in zoom-in-95">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Edit size={20} className="text-blue-600" />
                Edit Season
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditCycle} className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Start Date</p>
                <p className="font-medium text-gray-900">{cycle.startDate}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Percent size={14} />
                  Interest Rate (%) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  step="0.1"
                  value={editForm.interestRate}
                  onChange={(e) => setEditForm({ interestRate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Monthly interest rate for this season</p>
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editing}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center disabled:opacity-50"
                >
                  {editing ? (
                    <>
                      <Loader2 className="animate-spin mr-2" size={18} />
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} className="mr-2" />
                      Update Season
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
    </div>
  );
}
