
import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { api } from '../api/client';
import { LABELS } from '../constants';
import { Cycle, ShareOutSnapshot } from '../types';
import { Sprout, Lock, Play, Archive, FileText, Calculator, AlertTriangle, CheckCircle, Loader2, RefreshCw, ShieldOff, X, Calendar, Settings, DollarSign, Briefcase, ChevronRight, ChevronLeft, Printer, AlertCircle, Check } from 'lucide-react';
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
  
  // Calculation Data
  const [calcData, setCalcData] = useState<any>(null);
  const [calculating, setCalculating] = useState(false);
  
  // Close Wizard State
  const [showCloseWizard, setShowCloseWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [finalizing, setFinalizing] = useState(false);
  const [acknowledgeRisk, setAcknowledgeRisk] = useState(false);

  // Start Season State
  const [showStartModal, setShowStartModal] = useState(false);
  const [startStep, setStartStep] = useState(1);
  const [isStarting, setIsStarting] = useState(false);
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [formData, setFormData] = useState({
      seasonName: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      shareValue: 100,
      minShares: 1,
      maxShares: 5,
      interestRate: 5,
      maxLoanMultiplier: 3,
      lateFeeAmount: 0,
      socialFundFee: 0,
      includeInterest: true,
      includeProfits: true,
      lateFeeType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED'
  });

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

  // Load defaults for Start Modal
  useEffect(() => {
      if (showStartModal && group) {
          setStartStep(1);
          setConfirmChecked(false);
          setFormData(prev => ({
              ...prev,
              shareValue: group.shareValue || 100,
              minShares: group.minShares || 1,
              maxShares: group.maxShares || 5,
              maxLoanMultiplier: group.maxLoanMultiplier || 3,
              lateFeeAmount: group.lateFeeAmount || 5,
              seasonName: `Season ${new Date().getFullYear()}`,
              lateFeeType: group.lateFeeType || 'PERCENTAGE'
          }));
      }
  }, [showStartModal, group]);

  const initiateCloseWizard = async () => {
    if (!group) return;
    setCalculating(true);
    setShowCloseWizard(true);
    setWizardStep(1);
    setAcknowledgeRisk(false);
    try {
        const result = await api.generateReport(group.id, 'SHARE_OUT', {});
        if (result && result.summary) {
            setCalcData(result);
        } else {
            alert("Insufficient data to generate report.");
            setShowCloseWizard(false);
        }
    } catch (e) {
        alert("Calculation failed. Please try again.");
        setShowCloseWizard(false);
    } finally {
        setCalculating(false);
    }
  };

  const handleFinalizeSeason = async () => {
    if (!cycle || !calcData || !calcData.summary) return;
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
        setShowCloseWizard(false);
        refreshApp();
        setCycle(null);
        alert(labels.seasonClosedSuccess || "Season Closed Successfully.");
    } catch (e: any) {
        alert("Error closing season: " + e.message);
    } finally {
        setFinalizing(false);
    }
  };

  const handleStartSeason = async () => {
    if (!group) return;
    setIsStarting(true);
    try {
        await api.startCycle(group.id, formData);
        refreshApp();
        window.location.reload();
    } catch (e) {
        console.error(e);
        alert("Failed to start season");
    } finally {
        setIsStarting(false);
        setShowStartModal(false);
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

  const steps = [
      { id: 1, label: 'Timeline', icon: Calendar },
      { id: 2, label: 'Savings', icon: DollarSign },
      { id: 3, label: 'Loans', icon: Briefcase },
      { id: 4, label: 'Confirm', icon: CheckCircle }
  ];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">{labels.cycleManagement}</h2>
      </div>

      {cycle ? (
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
                    <button 
                        onClick={initiateCloseWizard}
                        className="w-full py-2 bg-red-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-red-700 flex items-center justify-center transition-all"
                    >
                        <Lock size={16} className="mr-2" /> End Current Season
                    </button>
                </div>
            </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-xl border border-dashed border-gray-300">
           <p className="text-gray-500 mb-4">{labels.noActiveSeason}</p>
           <button 
             onClick={() => setShowStartModal(true)} 
             className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center mx-auto"
           >
             <Play size={18} className="mr-2" /> {labels.startNewSeason}
           </button>
        </div>
      )}

      {/* Close Season Wizard Modal */}
      {showCloseWizard && calcData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full flex flex-col max-h-[90vh]">
                  
                  {/* Header with Visual Stepper */}
                  <div className="p-6 border-b border-gray-100 bg-gray-50 rounded-t-xl flex-none">
                      <div className="flex justify-between items-start mb-6">
                          <div>
                              <h3 className="text-xl font-bold text-gray-800">Close Season Wizard</h3>
                              <p className="text-sm text-gray-500 mt-1">Calculating final positions for {group.name}</p>
                          </div>
                          <button onClick={() => setShowCloseWizard(false)}><X className="text-gray-400 hover:text-gray-600" /></button>
                      </div>

                      {/* Progress Indicators */}
                      <div className="flex items-center w-full px-4">
                          {[
                              { step: 1, label: 'Health Check' },
                              { step: 2, label: 'Financials' },
                              { step: 3, label: 'Payouts' },
                              { step: 4, label: 'Confirm' }
                          ].map((s, idx) => (
                              <React.Fragment key={s.step}>
                                  <div className="flex flex-col items-center relative z-10">
                                      <div 
                                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                                              wizardStep === s.step 
                                                  ? 'bg-blue-600 text-white ring-4 ring-blue-100 scale-110' 
                                                  : wizardStep > s.step 
                                                      ? 'bg-green-500 text-white' 
                                                      : 'bg-gray-200 text-gray-500'
                                          }`}
                                      >
                                          {wizardStep > s.step ? <CheckCircle size={16}/> : s.step}
                                      </div>
                                      <span className={`text-xs mt-2 font-medium transition-colors ${
                                          wizardStep === s.step ? 'text-blue-700' : wizardStep > s.step ? 'text-green-600' : 'text-gray-400'
                                      }`}>
                                          {s.label}
                                      </span>
                                  </div>
                                  {idx < 3 && (
                                      <div className="flex-1 h-1 mx-2 -mt-6 bg-gray-200 rounded">
                                          <div 
                                              className="h-full bg-green-500 rounded transition-all duration-500" 
                                              style={{ width: wizardStep > s.step ? '100%' : '0%' }} 
                                          />
                                      </div>
                                  )}
                              </React.Fragment>
                          ))}
                      </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50 custom-scrollbar">
                      
                      {/* Step 1: Health Check */}
                      {wizardStep === 1 && (
                          <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
                              <h4 className="text-lg font-bold text-gray-800 flex items-center">
                                  <ActivityIndicator isValid={calcData.summary.outstandingLoans === 0} />
                                  Outstanding Loans Check
                              </h4>
                              {calcData.summary.outstandingLoans > 0 ? (
                                  <div className="bg-red-50 border border-red-200 p-4 rounded-lg flex items-start">
                                      <AlertTriangle className="text-red-600 mr-3 mt-1 flex-shrink-0" />
                                      <div>
                                          <p className="font-bold text-red-800">Warning: Unpaid Loans Detected</p>
                                          <p className="text-sm text-red-700 mt-1">
                                              There is <strong>{calcData.summary.outstandingLoans.toLocaleString()} RWF</strong> in outstanding loans. 
                                              Closing the season now means this amount is counted as an asset (Net Worth) but you do not have the cash to pay it out.
                                          </p>
                                          <p className="text-sm font-bold mt-2">Recommendation: Recover all loans before closing.</p>
                                      </div>
                                  </div>
                              ) : (
                                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg flex items-center">
                                      <CheckCircle className="text-green-600 mr-3" />
                                      <span className="text-green-800 font-medium">All loans cleared. Good to go!</span>
                                  </div>
                              )}

                              <h4 className="text-lg font-bold text-gray-800 flex items-center mt-6">
                                  <ActivityIndicator isValid={true} />
                                  Fines Reconciliation
                              </h4>
                              <p className="text-sm text-gray-600 ml-8">Ensure all fines are collected or written off.</p>
                          </div>
                      )}

                      {/* Step 2: Financial Summary */}
                      {wizardStep === 2 && (
                          <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
                              <div className="grid grid-cols-2 gap-4">
                                  <SummaryCard label="Total Share Contributions" value={calcData.summary.breakdown.contributions} color="blue" />
                                  <SummaryCard label="Total Profits (Interest + Fines)" value={calcData.summary.breakdown.interest + calcData.summary.breakdown.investmentProfits + calcData.summary.breakdown.shareEligibleFines} color="green" />
                                  <SummaryCard label="Expenses & Losses" value={calcData.summary.breakdown.expenses + calcData.summary.breakdown.investmentLosses} color="red" isNegative />
                                  <SummaryCard label="Net Distributable" value={calcData.summary.totalDistributable} color="indigo" size="lg" />
                              </div>
                              
                              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mt-4">
                                  <div className="flex justify-between items-center">
                                      <div>
                                          <p className="text-sm text-gray-500 uppercase font-bold">Final Share Value</p>
                                          <p className="text-3xl font-bold text-gray-900">{Math.round(calcData.summary.valuePerShare).toLocaleString()} RWF</p>
                                      </div>
                                      <div className="text-right">
                                          <p className="text-sm text-gray-500">Initial Value: {group.shareValue} RWF</p>
                                          <p className="text-green-600 font-bold">
                                              +{((calcData.summary.valuePerShare - group.shareValue) / group.shareValue * 100).toFixed(1)}% Growth
                                          </p>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      )}

                      {/* Step 3: Payout Review */}
                      {wizardStep === 3 && (
                          <div className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-300">
                              <div className="flex justify-between items-center">
                                  <h4 className="font-bold text-gray-800">Member Payout Schedule</h4>
                                  <button onClick={handlePrintReport} className="flex items-center text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg text-gray-700 transition-colors">
                                      <Printer size={16} className="mr-2"/> Print Report
                                  </button>
                              </div>
                              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden max-h-96 overflow-y-auto shadow-sm">
                                  <table className="w-full text-sm text-left">
                                      <thead className="bg-gray-100 text-gray-600 font-bold sticky top-0">
                                          <tr>
                                              <th className="p-3">Member</th>
                                              <th className="p-3 text-right">Shares</th>
                                              <th className="p-3 text-right">Saved</th>
                                              <th className="p-3 text-right">Profit</th>
                                              <th className="p-3 text-right bg-blue-50 text-blue-900">Total Payout</th>
                                          </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-100">
                                          {calcData.members.map((m: any) => (
                                              <tr key={m.id} className="hover:bg-gray-50">
                                                  <td className="p-3 font-medium">{m.name}</td>
                                                  <td className="p-3 text-right">{m.shares}</td>
                                                  <td className="p-3 text-right">{m.invested.toLocaleString()}</td>
                                                  <td className="p-3 text-right text-green-600">+{Math.round(m.profit).toLocaleString()}</td>
                                                  <td className="p-3 text-right font-bold text-blue-700 bg-blue-50/30">{Math.round(m.payout).toLocaleString()}</td>
                                              </tr>
                                          ))}
                                      </tbody>
                                  </table>
                              </div>
                          </div>
                      )}

                      {/* Step 4: Final Confirmation */}
                      {wizardStep === 4 && (
                          <div className="space-y-6 flex flex-col items-center justify-center h-full text-center animate-in fade-in slide-in-from-right-8 duration-300">
                              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-2 animate-bounce">
                                  <AlertCircle size={40} />
                              </div>
                              <h3 className="text-2xl font-bold text-gray-900">Are you absolutely sure?</h3>
                              <p className="text-gray-600 max-w-md">
                                  This action will <strong>archive the current season</strong> and lock all financial records. 
                                  Make sure all cash has been distributed to members according to the Payout Schedule.
                              </p>
                              
                              <div className="bg-gray-100 p-4 rounded-lg text-left w-full max-w-md mt-4">
                                  <ul className="space-y-2 text-sm text-gray-700">
                                      <li className="flex items-center"><CheckCircle size={16} className="text-green-600 mr-2"/> Share Value finalized at {Math.round(calcData.summary.valuePerShare)} RWF</li>
                                      <li className="flex items-center"><CheckCircle size={16} className="text-green-600 mr-2"/> {calcData.members.length} members calculated</li>
                                      <li className="flex items-center"><CheckCircle size={16} className="text-green-600 mr-2"/> Cycle history preserved</li>
                                  </ul>
                              </div>

                              <div className="mt-4">
                                  <label className="flex items-center cursor-pointer p-2 hover:bg-red-50 rounded-lg transition-colors">
                                      <input 
                                          type="checkbox" 
                                          className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                                          checked={acknowledgeRisk}
                                          onChange={e => setAcknowledgeRisk(e.target.checked)}
                                      />
                                      <span className="ml-3 font-bold text-gray-800">I confirm that all payouts are complete.</span>
                                  </label>
                              </div>
                          </div>
                      )}

                  </div>

                  {/* Footer Navigation */}
                  <div className="p-6 border-t border-gray-100 bg-white rounded-b-xl flex justify-between flex-none">
                      <button 
                          onClick={() => setWizardStep(Math.max(1, wizardStep - 1))}
                          disabled={wizardStep === 1 || finalizing}
                          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 flex items-center transition-colors"
                      >
                          <ChevronLeft size={18} className="mr-1" /> Back
                      </button>

                      {wizardStep < 4 ? (
                          <button 
                              onClick={() => setWizardStep(wizardStep + 1)}
                              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-md flex items-center transition-colors"
                          >
                              Next Step <ChevronRight size={18} className="ml-1" />
                          </button>
                      ) : (
                          <button 
                              onClick={handleFinalizeSeason}
                              disabled={!acknowledgeRisk || finalizing}
                              className="px-8 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 shadow-lg flex items-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                              {finalizing ? <Loader2 className="animate-spin mr-2" size={20}/> : <Lock className="mr-2" size={20}/>}
                              Close Season
                          </button>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* Start Season Wizard - REFACTORED */}
      {showStartModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh]">
                  
                  {/* Sticky Header with Steps */}
                  <div className="p-6 border-b border-gray-100 bg-white rounded-t-xl flex-none z-10">
                      <div className="flex justify-between items-center mb-6">
                          <div>
                              <h3 className="text-xl font-bold text-gray-800">{labels.startNewSeason}</h3>
                              <p className="text-sm text-gray-500 mt-1">Configure {group.name}</p>
                          </div>
                          <button onClick={() => setShowStartModal(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                      </div>

                      {/* Progress Steps */}
                      <div className="flex justify-between items-center relative">
                          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 -z-10 rounded"></div>
                          <div 
                              className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-green-500 transition-all duration-300 -z-10 rounded" 
                              style={{ width: `${((startStep - 1) / (steps.length - 1)) * 100}%` }}
                          />
                          {steps.map((step) => {
                              const isActive = startStep >= step.id;
                              const isCurrent = startStep === step.id;
                              return (
                                  <div key={step.id} className="flex flex-col items-center bg-white px-2">
                                      <div 
                                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                                              isActive 
                                              ? 'bg-green-600 border-green-600 text-white' 
                                              : 'bg-white border-gray-300 text-gray-400'
                                          } ${isCurrent ? 'ring-4 ring-green-100' : ''}`}
                                      >
                                          {isActive ? (isCurrent ? step.id : <Check size={14} />) : step.id}
                                      </div>
                                      <span className={`text-xs mt-1 font-medium ${isActive ? 'text-green-700' : 'text-gray-400'}`}>
                                          {step.label}
                                      </span>
                                  </div>
                              );
                          })}
                      </div>
                  </div>

                  {/* Scrollable Body */}
                  <div className="flex-1 overflow-y-auto p-6 bg-gray-50 custom-scrollbar">
                      <div className="max-w-lg mx-auto">
                          
                          {/* STEP 1: TIMELINE */}
                          {startStep === 1 && (
                              <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
                                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-start mb-4">
                                      <Calendar className="text-blue-600 mr-3 mt-1" size={20} />
                                      <div>
                                          <h4 className="font-bold text-blue-900 text-sm">Season Timeline</h4>
                                          <p className="text-xs text-blue-700 mt-1">Define the operating period for this cycle.</p>
                                      </div>
                                  </div>
                                  
                                  <div>
                                      <label className="block text-sm font-bold text-gray-700 mb-1">Season Name <span className="text-red-500">*</span></label>
                                      <input 
                                          type="text" 
                                          value={formData.seasonName}
                                          onChange={(e) => setFormData({...formData, seasonName: e.target.value})}
                                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white shadow-sm"
                                          placeholder="e.g. 2026 Cycle A"
                                          autoFocus
                                      />
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                      <div>
                                          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date <span className="text-red-500">*</span></label>
                                          <input 
                                              type="date"
                                              value={formData.startDate}
                                              onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white"
                                          />
                                      </div>
                                      <div>
                                          <label className="block text-sm font-medium text-gray-700 mb-1">Expected End</label>
                                          <input 
                                              type="date"
                                              value={formData.endDate}
                                              onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white"
                                          />
                                      </div>
                                  </div>
                              </div>
                          )}

                          {/* STEP 2: SAVINGS */}
                          {startStep === 2 && (
                              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                                  <div className="bg-green-50 p-4 rounded-lg border border-green-100 flex items-start">
                                      <DollarSign className="text-green-600 mr-3 mt-1" size={20} />
                                      <div>
                                          <h4 className="font-bold text-green-900 text-sm">Contribution Rules</h4>
                                          <p className="text-xs text-green-700 mt-1">Set the value of shares and contribution limits.</p>
                                      </div>
                                  </div>

                                  <div>
                                      <label className="block text-sm font-bold text-gray-700 mb-1">Share Price (RWF) <span className="text-red-500">*</span></label>
                                      <div className="relative">
                                          <span className="absolute left-4 top-3 text-gray-400 font-bold">RWF</span>
                                          <input 
                                              type="number"
                                              min="50"
                                              step="50"
                                              value={formData.shareValue}
                                              onChange={(e) => setFormData({...formData, shareValue: parseInt(e.target.value)})}
                                              className="w-full pl-14 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white font-bold text-lg text-gray-900 shadow-sm"
                                          />
                                      </div>
                                      <p className="text-xs text-gray-500 mt-1">The value of a single stamp/share.</p>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-lg border border-gray-200">
                                      <div>
                                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Min Shares</label>
                                          <input 
                                              type="number" min="1"
                                              value={formData.minShares}
                                              onChange={(e) => setFormData({...formData, minShares: parseInt(e.target.value)})}
                                              className="w-full px-3 py-2 border rounded-md"
                                          />
                                      </div>
                                      <div>
                                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Max Shares</label>
                                          <input 
                                              type="number" min="1"
                                              value={formData.maxShares}
                                              onChange={(e) => setFormData({...formData, maxShares: parseInt(e.target.value)})}
                                              className="w-full px-3 py-2 border rounded-md"
                                          />
                                      </div>
                                  </div>

                                  <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">Social Fund (RWF/Meeting)</label>
                                      <input 
                                          type="number" min="0"
                                          value={formData.socialFundFee}
                                          onChange={(e) => setFormData({...formData, socialFundFee: parseInt(e.target.value)})}
                                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white"
                                      />
                                  </div>
                              </div>
                          )}

                          {/* STEP 3: LOANS */}
                          {startStep === 3 && (
                              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                                  <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 flex items-start">
                                      <Briefcase className="text-indigo-600 mr-3 mt-1" size={20} />
                                      <div>
                                          <h4 className="font-bold text-indigo-900 text-sm">Loan Configuration</h4>
                                          <p className="text-xs text-indigo-700 mt-1">Define interest rates and credit limits.</p>
                                      </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-6">
                                      <div>
                                          <label className="block text-sm font-bold text-gray-700 mb-1">Interest Rate (%)</label>
                                          <div className="relative">
                                              <input 
                                                  type="number" step="0.1"
                                                  value={formData.interestRate}
                                                  onChange={(e) => setFormData({...formData, interestRate: parseFloat(e.target.value)})}
                                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-bold text-lg"
                                              />
                                              <span className="absolute right-4 top-3.5 text-gray-400 font-bold">%</span>
                                          </div>
                                          <p className="text-xs text-gray-500 mt-1">Per month</p>
                                      </div>
                                      <div>
                                          <label className="block text-sm font-bold text-gray-700 mb-1">Loan Limit (x)</label>
                                          <div className="relative">
                                              <span className="absolute left-4 top-3.5 text-gray-400 font-bold">x</span>
                                              <input 
                                                  type="number" step="0.5"
                                                  value={formData.maxLoanMultiplier}
                                                  onChange={(e) => setFormData({...formData, maxLoanMultiplier: parseFloat(e.target.value)})}
                                                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-bold text-lg"
                                              />
                                          </div>
                                          <p className="text-xs text-gray-500 mt-1">Multiplier of savings</p>
                                      </div>
                                  </div>

                                  <div className="border-t border-gray-200 pt-4">
                                      <label className="block text-sm font-medium text-gray-700 mb-2">Late Payment Penalty</label>
                                      <div className="flex gap-3">
                                          <select 
                                              value={formData.lateFeeType}
                                              onChange={(e) => setFormData({...formData, lateFeeType: e.target.value as any})}
                                              className="w-1/3 px-3 py-2 border rounded-lg bg-white text-sm"
                                          >
                                              <option value="PERCENTAGE">Percentage %</option>
                                              <option value="FIXED">Fixed Amount</option>
                                          </select>
                                          <input 
                                              type="number" min="0"
                                              value={formData.lateFeeAmount}
                                              onChange={(e) => setFormData({...formData, lateFeeAmount: parseFloat(e.target.value)})}
                                              className="flex-1 px-3 py-2 border rounded-lg bg-white"
                                              placeholder="Amount"
                                          />
                                      </div>
                                  </div>
                              </div>
                          )}

                          {/* STEP 4: REVIEW */}
                          {startStep === 4 && (
                              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                                  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                                      <div className="flex justify-between border-b border-gray-100 pb-2">
                                          <span className="text-sm text-gray-500">Season Name</span>
                                          <span className="font-bold text-gray-900">{formData.seasonName}</span>
                                      </div>
                                      <div className="flex justify-between border-b border-gray-100 pb-2">
                                          <span className="text-sm text-gray-500">Share Value</span>
                                          <span className="font-bold text-green-600">{formData.shareValue} RWF</span>
                                      </div>
                                      <div className="flex justify-between border-b border-gray-100 pb-2">
                                          <span className="text-sm text-gray-500">Loan Interest</span>
                                          <span className="font-bold text-indigo-600">{formData.interestRate}% / month</span>
                                      </div>
                                      <div className="flex justify-between pb-2">
                                          <span className="text-sm text-gray-500">Max Loan</span>
                                          <span className="font-bold text-gray-900">{formData.maxLoanMultiplier}x Savings</span>
                                      </div>
                                  </div>

                                  <div className="bg-orange-50 border border-orange-100 p-4 rounded-lg flex gap-3">
                                      <AlertTriangle className="text-orange-600 flex-shrink-0" size={24} />
                                      <div>
                                          <h5 className="font-bold text-orange-900 text-sm">Final Check</h5>
                                          <p className="text-xs text-orange-800 mt-1">
                                              Starting a new season creates an immutable financial ledger. 
                                              Ensure all members agree to these rules (Interest: {formData.interestRate}%, Share: {formData.shareValue}).
                                          </p>
                                      </div>
                                  </div>

                                  <label className="flex items-center cursor-pointer p-3 hover:bg-gray-100 rounded-lg transition-colors border border-transparent hover:border-gray-200">
                                      <input 
                                          type="checkbox" 
                                          className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                                          checked={confirmChecked}
                                          onChange={(e) => setConfirmChecked(e.target.checked)} 
                                      />
                                      <span className="ml-3 font-bold text-gray-800 text-sm">I confirm these settings are correct.</span>
                                  </label>
                              </div>
                          )}
                      </div>
                  </div>

                  {/* Sticky Footer */}
                  <div className="p-5 border-t border-gray-100 bg-white rounded-b-xl flex justify-between flex-none z-10 shadow-lg">
                      <button 
                          onClick={() => startStep > 1 ? setStartStep(startStep - 1) : setShowStartModal(false)}
                          className="px-6 py-2.5 border border-gray-300 bg-white text-gray-700 rounded-lg font-bold hover:bg-gray-50 transition-colors"
                      >
                          {startStep === 1 ? 'Cancel' : 'Back'}
                      </button>
                      
                      {startStep < 4 ? (
                          <button 
                              onClick={() => setStartStep(startStep + 1)}
                              disabled={!formData.seasonName && startStep === 1}
                              className="px-8 py-2.5 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 flex items-center shadow-md disabled:opacity-50"
                          >
                              Next <ChevronRight size={18} className="ml-2" />
                          </button>
                      ) : (
                          <button 
                              onClick={handleStartSeason}
                              disabled={!confirmChecked || isStarting}
                              className="px-8 py-2.5 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 flex justify-center items-center shadow-md disabled:opacity-50 transition-all"
                          >
                              {isStarting ? <Loader2 className="animate-spin mr-2" size={20}/> : <Play className="mr-2" size={20} />}
                              Launch Season
                          </button>
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}

// Helpers for Wizard
function SummaryCard({ label, value, color, size = 'md', isNegative = false }: { label: string, value: number, color: string, size?: 'md'|'lg', isNegative?: boolean }) {
    const colorClasses = {
        blue: 'text-blue-600 bg-blue-50 border-blue-100',
        green: 'text-green-600 bg-green-50 border-green-100',
        red: 'text-red-600 bg-red-50 border-red-100',
        indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    }[color] || 'text-gray-600 bg-gray-50 border-gray-100';

    return (
        <div className={`p-4 rounded-lg border ${colorClasses}`}>
            <p className="text-xs uppercase font-bold opacity-70 mb-1">{label}</p>
            <p className={`font-bold ${size === 'lg' ? 'text-2xl' : 'text-lg'}`}>
                {value.toLocaleString()} RWF
            </p>
        </div>
    );
}

function ActivityIndicator({ isValid }: { isValid: boolean }) {
    return isValid 
        ? <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
        : <div className="w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse"></div>;
}
