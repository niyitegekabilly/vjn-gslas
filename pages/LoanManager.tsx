import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../App';
import { api } from '../api/client';
import { LABELS } from '../constants';
import { LoanStatus, Loan, Member } from '../types';
import { Check, X, AlertTriangle, FileText, Calculator, Loader2, Coins, RefreshCw } from 'lucide-react';

export default function LoanManager() {
  const { activeGroupId, lang } = useContext(AppContext);
  const labels = LABELS[lang];
  
  const [loans, setLoans] = useState<Loan[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // Tools State
  const [showCalculator, setShowCalculator] = useState(false);
  const [showFeeManager, setShowFeeManager] = useState(false);
  
  // Calculator State
  const [calcAmount, setCalcAmount] = useState<number>(50000);
  const [calcRate, setCalcRate] = useState<number>(5);
  const [calcDuration, setCalcDuration] = useState<number>(3);

  // Late Fee State
  const [feeAmount, setFeeAmount] = useState<number>(5);
  const [feeIsPercentage, setFeeIsPercentage] = useState<boolean>(true);
  const [applyingFees, setApplyingFees] = useState(false);
  const [feeResult, setFeeResult] = useState<string | null>(null);

  const fetchData = () => {
    if (!activeGroupId) return;
    setLoading(true);
    Promise.all([
      api.getLoans(activeGroupId),
      api.getMembers(activeGroupId)
    ]).then(([l, m]) => {
      setLoans(l);
      setMembers(m);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchData();
  }, [activeGroupId]);

  const handleApplyFees = async () => {
    setApplyingFees(true);
    try {
      const result = await api.applyLateFees(activeGroupId, { 
        amount: feeAmount, 
        isPercentage: feeIsPercentage 
      });
      setFeeResult(`Successfully applied fees to ${result.count} overdue loan(s).`);
      setTimeout(() => setFeeResult(null), 5000);
      fetchData(); // Refresh data
    } catch (e) {
      setFeeResult("Error applying fees.");
    } finally {
      setApplyingFees(false);
    }
  };

  const getMemberName = (id: string) => members.find(m => m.id === id)?.fullName || 'Unknown';

  const pendingLoans = loans.filter(l => l.status === LoanStatus.PENDING);
  const activeLoans = loans.filter(l => l.status === LoanStatus.ACTIVE || l.status === LoanStatus.DEFAULTED);

  // Calculator Logic
  const totalInterest = calcAmount * (calcRate / 100) * calcDuration;
  const totalRepayment = calcAmount + totalInterest;
  const monthlyPayment = calcDuration > 0 ? totalRepayment / calcDuration : 0;

  if (loading) {
     return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-gray-400" /></div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">{labels.applyLoan} / Management</h2>
        <div className="flex flex-wrap gap-2">
           <button 
            onClick={() => { setShowFeeManager(!showFeeManager); setShowCalculator(false); }}
            className={`flex items-center px-4 py-2 border rounded-lg shadow-sm transition-colors ${
              showFeeManager 
                ? 'bg-red-50 border-red-200 text-red-700' 
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Coins size={18} className="mr-2" />
            {showFeeManager ? 'Hide Penalty Tool' : 'Late Penalties'}
          </button>
          <button 
            onClick={() => { setShowCalculator(!showCalculator); setShowFeeManager(false); }}
            className={`flex items-center px-4 py-2 border rounded-lg shadow-sm transition-colors ${
              showCalculator 
                ? 'bg-blue-50 border-blue-200 text-blue-700' 
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Calculator size={18} className="mr-2" />
            {showCalculator ? 'Hide Calculator' : 'Loan Calculator'}
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700">
            New Loan Application
          </button>
        </div>
      </div>

      {/* Late Fee Manager Section */}
      {showFeeManager && (
        <div className="bg-gradient-to-br from-white to-red-50 p-6 rounded-xl border border-red-100 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <h3 className="text-lg font-semibold text-red-800 mb-4 flex items-center">
            <Coins size={20} className="mr-2" /> Overdue Penalty Manager
          </h3>
          <p className="text-sm text-gray-600 mb-6 max-w-2xl">
            Automatically check all active loans. If a loan is past its due date, the system will apply the configured penalty to the loan balance and mark it as 'Defaulted'.
          </p>
          
          <div className="flex flex-col md:flex-row items-end gap-6">
            <div className="w-full md:w-64">
              <label className="block text-sm font-medium text-gray-700 mb-1">Penalty Type</label>
              <div className="flex rounded-lg shadow-sm">
                <button
                  onClick={() => setFeeIsPercentage(true)}
                  className={`flex-1 px-4 py-2 text-sm font-medium border rounded-l-lg ${
                    feeIsPercentage ? 'bg-red-100 text-red-700 border-red-200' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Percentage (%)
                </button>
                <button
                   onClick={() => setFeeIsPercentage(false)}
                   className={`flex-1 px-4 py-2 text-sm font-medium border-t border-b border-r rounded-r-lg ${
                    !feeIsPercentage ? 'bg-red-100 text-red-700 border-red-200' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Fixed Amount
                </button>
              </div>
            </div>

            <div className="w-full md:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {feeIsPercentage ? 'Percentage Rate' : 'Fixed Amount (RWF)'}
              </label>
              <input 
                type="number"
                min="0"
                value={feeAmount}
                onChange={(e) => setFeeAmount(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
              />
            </div>

            <button 
              onClick={handleApplyFees}
              disabled={applyingFees}
              className={`flex items-center px-6 py-2 rounded-lg font-medium text-white shadow-sm transition-all ${
                applyingFees ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {applyingFees ? <Loader2 className="animate-spin mr-2" size={18} /> : <RefreshCw size={18} className="mr-2" />}
              {applyingFees ? 'Processing...' : 'Apply Penalties'}
            </button>
          </div>

          {feeResult && (
            <div className="mt-4 p-3 bg-green-100 text-green-800 rounded-lg text-sm flex items-center">
              <Check size={16} className="mr-2" /> {feeResult}
            </div>
          )}
        </div>
      )}

      {/* Calculator Section */}
      {showCalculator && (
        <div className="bg-gradient-to-br from-white to-blue-50 p-6 rounded-xl border border-blue-100 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Calculator size={20} className="mr-2 text-blue-600" /> Loan Estimator
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Inputs */}
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loan Amount (RWF)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    min="0"
                    value={calcAmount}
                    onChange={(e) => setCalcAmount(Number(e.target.value))}
                    className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate (%)</label>
                  <input 
                    type="number" 
                    min="0"
                    step="0.1"
                    value={calcRate}
                    onChange={(e) => setCalcRate(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                  />
                  <span className="text-xs text-gray-500 mt-1 block">Per month</span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                  <input 
                    type="number" 
                    min="1"
                    value={calcDuration}
                    onChange={(e) => setCalcDuration(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                  />
                  <span className="text-xs text-gray-500 mt-1 block">Months</span>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="lg:col-span-2 bg-white rounded-lg p-6 border border-gray-100 shadow-sm flex flex-col justify-center">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
                <div className="pb-4 sm:pb-0">
                  <p className="text-sm font-medium text-gray-500 mb-1">Monthly Payment</p>
                  <p className="text-2xl font-bold text-gray-900 tracking-tight">
                    {monthlyPayment.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    <span className="text-sm font-normal text-gray-400 ml-1">RWF</span>
                  </p>
                </div>
                <div className="py-4 sm:py-0">
                  <p className="text-sm font-medium text-gray-500 mb-1">Total Interest</p>
                  <p className="text-2xl font-bold text-blue-600 tracking-tight">
                    {totalInterest.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    <span className="text-sm font-normal text-gray-400 ml-1">RWF</span>
                  </p>
                </div>
                <div className="pt-4 sm:pt-0">
                  <p className="text-sm font-medium text-gray-500 mb-1">Total Repayment</p>
                  <p className="text-2xl font-bold text-green-600 tracking-tight">
                    {totalRepayment.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    <span className="text-sm font-normal text-gray-400 ml-1">RWF</span>
                  </p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-100">
                 <p className="text-xs text-center text-gray-400">
                    * This is an estimation based on a flat monthly interest rate of {calcRate}%. Actual terms may vary based on group bylaws and penalties.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pending Approvals Section */}
      {pendingLoans.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
            <FileText size={20} className="mr-2" /> Pending Approval
          </h3>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="p-4">Member</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Purpose</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pendingLoans.map(loan => (
                  <tr key={loan.id}>
                    <td className="p-4 font-medium">{getMemberName(loan.memberId)}</td>
                    <td className="p-4">{loan.principal.toLocaleString()} RWF</td>
                    <td className="p-4 text-gray-600">{loan.purpose}</td>
                    <td className="p-4 flex justify-end gap-2">
                      <button className="p-2 bg-green-100 text-green-600 rounded hover:bg-green-200" title={labels.approve}>
                        <Check size={18} />
                      </button>
                      <button className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200" title={labels.reject}>
                        <X size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Active Loans Table */}
      <section>
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Active Portfolio</h3>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
           <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                <tr>
                  <th className="p-4">Member</th>
                  <th className="p-4">Start Date</th>
                  <th className="p-4">Due Date</th>
                  <th className="p-4">Principal</th>
                  <th className="p-4">Repaid</th>
                  <th className="p-4">Balance</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activeLoans.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center text-gray-500">No active loans found.</td></tr>
                ) : (
                  activeLoans.map(loan => {
                    const repaid = loan.totalRepayable - loan.balance;
                    const progress = (repaid / loan.totalRepayable) * 100;
                    const isOverdue = new Date(loan.dueDate) < new Date();
                    const isDefaulted = loan.status === LoanStatus.DEFAULTED;
                    
                    return (
                      <tr key={loan.id} className="hover:bg-gray-50">
                        <td className="p-4 font-medium text-gray-900">{getMemberName(loan.memberId)}</td>
                        <td className="p-4 text-gray-500">{loan.startDate}</td>
                        <td className="p-4 text-gray-500">
                          <span className={isOverdue ? "text-red-600 font-bold flex items-center" : ""}>
                            {isOverdue && <AlertTriangle size={14} className="mr-1" />}
                            {loan.dueDate}
                          </span>
                        </td>
                        <td className="p-4">{loan.principal.toLocaleString()}</td>
                        <td className="p-4 text-green-600">{repaid.toLocaleString()}</td>
                        <td className="p-4 font-bold">{loan.balance.toLocaleString()}</td>
                        <td className="p-4">
                          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                            <div className={`h-2.5 rounded-full ${isDefaulted ? 'bg-red-500' : 'bg-blue-600'}`} style={{ width: `${progress}%` }}></div>
                          </div>
                          <span className={`text-xs ${isDefaulted ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                            {isDefaulted ? 'DEFAULTED' : `${Math.round(progress)}% Paid`}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}