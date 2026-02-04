
import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../App';
import { api } from '../api/client';
import { LABELS } from '../constants';
import { LoanStatus, Loan, Member, UserRole } from '../types';
import { Check, X, AlertTriangle, FileText, Calculator, Loader2, Coins, RefreshCw, Info, Plus, Banknote, Search, Filter, CheckCircle, ChevronDown, ChevronUp, Eye, FileCheck, ThumbsUp, ThumbsDown, ArrowRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { TableRowSkeleton } from '../components/Skeleton';
import { useAuth } from '../contexts/AuthContext';
import { CsvImporter } from '../components/CsvImporter';

export default function LoanManager() {
  const { activeGroupId, lang, groups } = useContext(AppContext);
  const { user } = useAuth();
  const labels = LABELS[lang];
  const group = groups.find(g => g.id === activeGroupId);
  
  const [loans, setLoans] = useState<Loan[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [cashBalance, setCashBalance] = useState(0);

  // Tools State
  const [showCalculator, setShowCalculator] = useState(false);
  const [showFeeManager, setShowFeeManager] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Repayment Modal State
  const [isRepayModalOpen, setIsRepayModalOpen] = useState(false);
  const [repayLoanId, setRepayLoanId] = useState<string | null>(null);
  const [repayAmount, setRepayAmount] = useState<number | ''>('');
  const [repaySubmitting, setRepaySubmitting] = useState(false);

  // View Details Modal State
  const [viewingLoan, setViewingLoan] = useState<Loan | null>(null);

  // Review (Approval/Rejection) Modal State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewingLoan, setReviewingLoan] = useState<Loan | null>(null);
  const [reviewAction, setReviewAction] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Calculator State
  const [calcAmount, setCalcAmount] = useState<number>(50000);
  const [calcRate, setCalcRate] = useState<number>(5);
  const [calcDuration, setCalcDuration] = useState<number>(3);
  const [calcType, setCalcType] = useState<'FLAT' | 'REDUCING'>('FLAT');

  // Application Form State
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [formAmount, setFormAmount] = useState<number | ''>('');
  const [formDuration, setFormDuration] = useState<number>(3);
  const [formPurpose, setFormPurpose] = useState('');
  const [purposeError, setPurposeError] = useState<string | null>(null); // Validation State
  const [formSubmitting, setFormSubmitting] = useState(false);
  
  // Member Search State
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);

  // Late Fee State
  const [feeAmount, setFeeAmount] = useState<number>(5);
  const [feeIsPercentage, setFeeIsPercentage] = useState<boolean>(true);
  const [applyingFees, setApplyingFees] = useState(false);
  const [feeResult, setFeeResult] = useState<string | null>(null);

  // Filter & Sort State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'DEFAULTED' | 'CLEARED' | 'PENDING' | 'REJECTED'>('ALL');
  const [sortField, setSortField] = useState<'memberName' | 'amount' | 'dueDate' | 'status'>('dueDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Mobile Expanded State
  const [expandedLoanId, setExpandedLoanId] = useState<string | null>(null);

  const canEdit = user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ADMIN || user?.role === UserRole.GROUP_LEADER;

  const fetchData = () => {
    if (!activeGroupId) return;
    setLoading(true);
    
    const promises: Promise<any>[] = [
      api.getLoans(activeGroupId),
      api.getMembers(activeGroupId),
      api.getCashBalance(activeGroupId)
    ];

    if (group?.currentCycleId) {
      promises.push(api.getCycle(group.currentCycleId));
    }

    Promise.all(promises).then((results) => {
      setLoans(results[0]);
      setMembers(results[1]);
      setCashBalance(results[2]);
      
      // If cycle data exists (index 3), use it to set default calculator rate
      if (results[3]) {
        setCalcRate(results[3].interestRate);
      }
      
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchData();
    // Load Group Defaults
    if (group) {
        setFeeAmount(group.lateFeeAmount ?? 5);
        setFeeIsPercentage(group.lateFeeType !== 'FIXED');
    }
  }, [activeGroupId, group]);

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

  const handleImportLoans = async (data: any[]) => {
    if(!activeGroupId) return { success: false, message: "No active group." };
    try {
        const res = await api.importLoans(activeGroupId, data);
        fetchData();
        return { success: true, message: `Successfully imported ${res.added} loans.` + (res.errors.length ? ` (${res.errors.length} skipped)` : '') };
    } catch(e: any) {
        return { success: false, message: e.message };
    }
  };

  const openReviewModal = (loan: Loan) => {
      setReviewingLoan(loan);
      setReviewAction(null);
      setRejectReason('');
      setIsReviewModalOpen(true);
  };

  const handleReviewSubmit = async () => {
      if (!reviewingLoan || !reviewAction) return;
      
      if (reviewAction === 'APPROVE' && cashBalance < reviewingLoan.principal) {
          alert("Insufficient cash balance to disburse this loan.");
          return;
      }

      if (reviewAction === 'REJECT' && !rejectReason.trim()) {
          alert("Please provide a reason for rejection.");
          return;
      }

      setReviewSubmitting(true);
      try {
          const status = reviewAction === 'APPROVE' ? LoanStatus.ACTIVE : LoanStatus.REJECTED;
          await api.updateLoanStatus(reviewingLoan.id, status, rejectReason);
          setIsReviewModalOpen(false);
          fetchData();
      } catch (error: any) {
          alert(error.message || "Failed to update loan status");
      } finally {
          setReviewSubmitting(false);
      }
  };

  const openRepayModal = (loan: Loan) => {
    setRepayLoanId(loan.id);
    setRepayAmount(''); // Start empty
    setIsRepayModalOpen(true);
  };

  const handleRepaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repayLoanId || !repayAmount) return;
    
    setRepaySubmitting(true);
    try {
      await api.repayLoan(repayLoanId, Number(repayAmount));
      setIsRepayModalOpen(false);
      fetchData();
    } catch (error) {
      console.error(error);
      alert("Failed to submit repayment");
    } finally {
      setRepaySubmitting(false);
    }
  };

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formPurpose.trim()) {
      setPurposeError("Purpose is required.");
      return;
    }
    // Only alphabetic characters and spaces allowed
    if (!/^[a-zA-Z\s]+$/.test(formPurpose)) {
      setPurposeError("Purpose must contain only alphabetic characters.");
      return;
    }
    setPurposeError(null);

    if (!selectedMemberId || !formAmount || !group) return;

    setFormSubmitting(true);
    try {
      await api.applyForLoan(activeGroupId, {
        memberId: selectedMemberId,
        amount: Number(formAmount),
        duration: formDuration,
        purpose: formPurpose,
        interestRate: calcRate // Uses the rate from the context/calculator (current cycle rate)
      });
      setIsModalOpen(false);
      // Reset form
      setFormAmount('');
      setFormPurpose('');
      setSelectedMemberId('');
      setPurposeError(null);
      setMemberSearchTerm('');
      setShowMemberDropdown(false);
      fetchData();
    } catch (error) {
      console.error(error);
      alert('Failed to submit loan application.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const getMemberName = (id: string) => members.find(m => m.id === id)?.fullName || 'Unknown';
  
  // Max Loan Calculation
  const selectedMember = members.find(m => m.id === selectedMemberId);
  const maxLoanAmount = selectedMember ? (selectedMember.totalShares * (group?.shareValue || 0) * 3) : 0;
  const isAmountValid = typeof formAmount === 'number' && formAmount > 0 && formAmount <= maxLoanAmount;

  const pendingLoans = loans.filter(l => l.status === LoanStatus.PENDING);
  
  // Overdue Check
  const overdueLoans = loans.filter(l => l.status === LoanStatus.ACTIVE && l.dueDate < new Date().toISOString().split('T')[0]);
  const overdueCount = overdueLoans.length;

  const handleSort = (field: 'memberName' | 'amount' | 'dueDate' | 'status') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: 'memberName' | 'amount' | 'dueDate' | 'status' }) => {
    if (sortField !== field) return <ArrowUpDown size={14} className="ml-1 text-gray-400" />;
    return sortDirection === 'asc' ? <ArrowUp size={14} className="ml-1 text-blue-600" /> : <ArrowDown size={14} className="ml-1 text-blue-600" />;
  };

  // Filter active loans
  const filteredActiveLoans = loans.filter(l => {
    // Search filter
    const nameMatch = getMemberName(l.memberId).toLowerCase().includes(searchTerm.toLowerCase());
    if (!nameMatch) return false;

    // Status filter
    if (statusFilter === 'ALL') {
        return l.status !== LoanStatus.PENDING && l.status !== LoanStatus.REJECTED;
    }
    
    return l.status === statusFilter;
  }).sort((a, b) => {
    let comparison = 0;
    
    switch (sortField) {
      case 'memberName':
        comparison = getMemberName(a.memberId).localeCompare(getMemberName(b.memberId));
        break;
      case 'amount':
        comparison = a.principal - b.principal;
        break;
      case 'dueDate':
        comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });
  
  // Helper for modal
  const repayingLoan = loans.find(l => l.id === repayLoanId);
  const repayingMember = repayingLoan ? members.find(m => m.id === repayingLoan.memberId) : null;

  // --- Calculator Logic ---
  let totalInterest = 0;
  let totalRepayment = 0;
  let monthlyPayment = 0;

  if (calcType === 'FLAT') {
    // Simple Interest
    totalInterest = calcAmount * (calcRate / 100) * calcDuration;
    totalRepayment = calcAmount + totalInterest;
    monthlyPayment = calcDuration > 0 ? totalRepayment / calcDuration : 0;
  } else {
    // Reducing Balance (Standard Amortization PMT)
    const r = calcRate / 100;
    const n = calcDuration;
    if (r === 0) {
       monthlyPayment = calcAmount / n;
       totalRepayment = calcAmount;
       totalInterest = 0;
    } else {
       monthlyPayment = calcAmount * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
       totalRepayment = monthlyPayment * n;
       totalInterest = totalRepayment - calcAmount;
    }
  }

  // --- Breakdown Render Helper ---
  const BreakdownView = ({ principal, totalRepayable, interestRate }: { principal: number, totalRepayable: number, interestRate: number }) => {
    const interest = totalRepayable - principal;
    const durationEstimate = interestRate > 0 && principal > 0 ? Math.round(interest / (principal * (interestRate / 100))) : 0;
    
    return (
      <div className="bg-gray-50 p-3 rounded-lg text-sm border border-gray-100 mt-3">
        <p className="text-xs font-bold text-gray-500 uppercase mb-2 border-b border-gray-200 pb-1">Interest Breakdown</p>
        <div className="flex justify-between mb-1 text-gray-600">
            <span>Principal</span>
            <span className="font-mono">{principal.toLocaleString()} {labels.currency}</span>
        </div>
        <div className="flex justify-between mb-1 pb-1 border-b border-gray-200">
            <span className="text-gray-600 flex items-center">
                Interest <span className="text-xs text-gray-400 ml-1">({interestRate}% /mo)</span>
            </span>
            <span className="font-mono text-blue-600">+{interest.toLocaleString()} {labels.currency}</span>
        </div>
        <div className="flex justify-between font-bold pt-1">
            <span className="text-gray-800">Total Repayable</span>
            <span className="font-mono">{totalRepayable.toLocaleString()} {labels.currency}</span>
        </div>
      </div>
    );
  };

  const importFields = [
    { key: 'NationalID', label: 'National ID', sample: '11990800...', required: true },
    { key: 'Amount', label: 'Principal', sample: '50000', required: true },
    { key: 'InterestRate', label: 'Rate (%)', sample: '5', required: true },
    { key: 'DurationMonths', label: 'Months', sample: '3', required: true },
    { key: 'StartDate', label: 'Start Date', sample: '2024-01-01', required: false },
    { key: 'Purpose', label: 'Purpose', sample: 'School Fees', required: false },
  ];

  if (loading) {
     return (
       <div className="space-y-6">
         <div className="h-12 bg-gray-200 rounded animate-pulse mb-6" />
         <div className="space-y-4">
           {[...Array(5)].map((_, i) => <TableRowSkeleton key={i} />)}
         </div>
       </div>
     );
  }

  return (
    <div className="space-y-8 relative">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">{labels.loanManagement}</h2>
        <div className="flex flex-wrap gap-2 w-full xl:w-auto">
           {canEdit && (
             <>
             <CsvImporter 
                entityName="Loans"
                fields={importFields}
                onImport={handleImportLoans}
             />
             <button 
              onClick={() => { setShowFeeManager(!showFeeManager); setShowCalculator(false); }}
              className={`flex-1 xl:flex-none flex justify-center items-center px-4 py-2 border rounded-lg shadow-sm transition-colors ${
                showFeeManager 
                  ? 'bg-red-50 border-red-200 text-red-700' 
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Coins size={18} className="mr-2" />
              {showFeeManager ? labels.hidePenalty : labels.penaltyTool}
            </button>
            </>
           )}
          <button 
            onClick={() => { setShowCalculator(!showCalculator); setShowFeeManager(false); }}
            className={`flex-1 xl:flex-none flex justify-center items-center px-4 py-2 border rounded-lg shadow-sm transition-colors ${
              showCalculator 
                ? 'bg-blue-50 border-blue-200 text-blue-700' 
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Calculator size={18} className="mr-2" />
            {showCalculator ? labels.hideCalc : labels.loanEstimator}
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex-1 xl:flex-none justify-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 flex items-center"
          >
            <Plus size={18} className="mr-2" />
            {labels.newLoanApp}
          </button>
        </div>
      </div>

      {/* Review Modal */}
      {isReviewModalOpen && reviewingLoan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
                  <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                      <h3 className="font-bold text-gray-800 flex items-center">
                          <FileCheck size={20} className="mr-2 text-blue-600" /> Review Application
                      </h3>
                      <button onClick={() => setIsReviewModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                  </div>
                  
                  <div className="p-6 space-y-4">
                      {/* Loan Summary */}
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                          <div className="flex justify-between items-center mb-2">
                              <span className="text-sm text-blue-700 font-bold">{getMemberName(reviewingLoan.memberId)}</span>
                              <span className="text-xs bg-white px-2 py-1 rounded text-blue-600 border border-blue-200">ID: {reviewingLoan.memberId.slice(0,6)}</span>
                          </div>
                          <div className="text-2xl font-bold text-blue-900 mb-1">
                              {reviewingLoan.principal.toLocaleString()} {labels.currency}
                          </div>
                          <p className="text-xs text-blue-700 opacity-80">{reviewingLoan.purpose}</p>
                      </div>

                      {/* Cash Check */}
                      <div className="flex justify-between text-sm py-2 border-b border-gray-100">
                          <span className="text-gray-500">Group Cash Balance:</span>
                          <span className={`font-bold ${cashBalance < reviewingLoan.principal ? 'text-red-600' : 'text-green-600'}`}>
                              {cashBalance.toLocaleString()} {labels.currency}
                          </span>
                      </div>

                      {/* Review Actions */}
                      {!reviewAction ? (
                          <div className="grid grid-cols-2 gap-4 mt-4">
                              <button 
                                onClick={() => setReviewAction('APPROVE')} 
                                className="flex flex-col items-center justify-center p-4 border border-green-200 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition-colors"
                              >
                                  <ThumbsUp size={24} className="mb-2" />
                                  <span className="font-bold">Approve</span>
                              </button>
                              <button 
                                onClick={() => setReviewAction('REJECT')} 
                                className="flex flex-col items-center justify-center p-4 border border-red-200 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 transition-colors"
                              >
                                  <ThumbsDown size={24} className="mb-2" />
                                  <span className="font-bold">Reject</span>
                              </button>
                          </div>
                      ) : (
                          <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-bottom-2">
                              {reviewAction === 'APPROVE' ? (
                                  <div className="bg-green-50 p-3 rounded-lg border border-green-100 text-sm text-green-800">
                                      <p className="font-bold mb-1 flex items-center"><CheckCircle size={16} className="mr-2"/> Approval Confirmation</p>
                                      <p>This will set the loan to <strong>ACTIVE</strong> and create a disbursement transaction. Ensure funds are handed over.</p>
                                  </div>
                              ) : (
                                  <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Rejection <span className="text-red-500">*</span></label>
                                      <textarea 
                                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none bg-white text-gray-900"
                                          rows={3}
                                          placeholder="e.g. Insufficient collateral, bad credit history..."
                                          value={rejectReason}
                                          onChange={(e) => setRejectReason(e.target.value)}
                                      />
                                  </div>
                              )}

                              <div className="flex gap-3">
                                  <button 
                                      onClick={() => setReviewAction(null)}
                                      className="flex-1 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                                  >
                                      Back
                                  </button>
                                  <button 
                                      onClick={handleReviewSubmit}
                                      disabled={reviewSubmitting}
                                      className={`flex-1 py-2 text-white rounded-lg font-bold flex justify-center items-center ${
                                          reviewAction === 'APPROVE' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                                      }`}
                                  >
                                      {reviewSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Confirm'}
                                  </button>
                              </div>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* Repayment Modal */}
      {isRepayModalOpen && repayingLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full overflow-hidden">
             <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-gray-800">{labels.recordRepayment}</h3>
                <button onClick={() => setIsRepayModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
             </div>
             <form onSubmit={handleRepaySubmit} className="p-6">
                <div className="mb-4">
                   <p className="text-sm text-gray-500 mb-1">{labels.repaymentFor}:</p>
                   <p className="font-bold text-gray-900 text-lg">{repayingMember?.fullName}</p>
                </div>
                <div className="mb-6 bg-blue-50 p-3 rounded-lg flex justify-between items-center">
                   <span className="text-sm text-blue-700">{labels.currentBalance}:</span>
                   <span className="font-bold text-blue-800">{repayingLoan.balance.toLocaleString()} {labels.currency}</span>
                </div>
                
                <div className="mb-6">
                   <label className="block text-sm font-medium text-gray-700 mb-1">{labels.repaymentAmount} ({labels.currency})</label>
                   <input 
                      type="number"
                      min="1"
                      max={repayingLoan.balance}
                      value={repayAmount}
                      onChange={(e) => setRepayAmount(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900"
                      required
                      autoFocus
                   />
                   {repayAmount && Number(repayAmount) >= repayingLoan.balance && (
                       <p className="text-xs text-green-600 font-bold mt-2 flex items-center animate-pulse">
                           <CheckCircle size={14} className="mr-1"/> {labels.clearsLoan}
                       </p>
                   )}
                </div>
                
                <button 
                  type="submit" 
                  disabled={repaySubmitting}
                  className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex justify-center items-center"
                >
                   {repaySubmitting ? <Loader2 size={18} className="animate-spin" /> : labels.confirm}
                </button>
             </form>
          </div>
        </div>
      )}

      {/* Loan Details Modal */}
      {viewingLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
             <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-gray-800">Loan Details</h3>
                <button onClick={() => setViewingLoan(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
             </div>
             <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                   <div>
                      <p className="text-sm text-gray-500">Member</p>
                      <p className="font-bold text-gray-900 text-lg">{getMemberName(viewingLoan.memberId)}</p>
                   </div>
                   <div className="text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        viewingLoan.status === LoanStatus.ACTIVE ? 'bg-blue-100 text-blue-800' :
                        viewingLoan.status === LoanStatus.DEFAULTED ? 'bg-red-100 text-red-800' :
                        viewingLoan.status === LoanStatus.CLEARED ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {viewingLoan.status}
                      </span>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                   <div>
                      <p className="text-gray-500">Start Date</p>
                      <p className="font-medium">{viewingLoan.startDate}</p>
                   </div>
                   <div>
                      <p className="text-gray-500">Due Date</p>
                      <p className={`font-medium ${new Date(viewingLoan.dueDate) < new Date() && viewingLoan.balance > 0 ? 'text-red-600 font-bold' : ''}`}>
                         {viewingLoan.dueDate}
                      </p>
                   </div>
                </div>

                <div>
                   <p className="text-sm text-gray-500 mb-1">Purpose</p>
                   <p className="text-sm text-gray-800 bg-gray-50 p-2 rounded border border-gray-100">{viewingLoan.purpose}</p>
                </div>

                <BreakdownView 
                    principal={viewingLoan.principal} 
                    totalRepayable={viewingLoan.totalRepayable} 
                    interestRate={viewingLoan.interestRate} 
                />

                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                   <p className="text-gray-500 font-medium">Outstanding Balance</p>
                   <p className="text-2xl font-bold text-blue-600">{viewingLoan.balance.toLocaleString()} {labels.currency}</p>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Loan Application Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800">{labels.newLoanApp}</h3>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setMemberSearchTerm('');
                  setShowMemberDropdown(false);
                  setSelectedMemberId('');
                  setFormAmount('');
                  setFormPurpose('');
                  setPurposeError(null);
                }} 
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleCreateLoan} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{labels.selectMember}</label>
                {canEdit ? (
                  <div className="relative">
                    {/* Search Input */}
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                      <input
                        type="text"
                        placeholder="Search members by name, phone, or ID..."
                        value={memberSearchTerm}
                        onChange={(e) => {
                          setMemberSearchTerm(e.target.value);
                          setShowMemberDropdown(true);
                        }}
                        onFocus={() => setShowMemberDropdown(true)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900"
                      />
                      {selectedMemberId && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMemberId('');
                            setMemberSearchTerm('');
                            setFormAmount('');
                            setShowMemberDropdown(false);
                          }}
                          className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                        >
                          <X size={18} />
                        </button>
                      )}
                    </div>
                    
                    {/* Member Dropdown */}
                    {showMemberDropdown && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setShowMemberDropdown(false)}
                        ></div>
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto custom-scrollbar">
                          {(() => {
                            const filteredMembers = members.filter(member => {
                              if (!memberSearchTerm) return true;
                              const search = memberSearchTerm.toLowerCase();
                              return (
                                member.fullName.toLowerCase().includes(search) ||
                                member.phone.includes(search) ||
                                member.nationalId.includes(search) ||
                                (member.email && member.email.toLowerCase().includes(search))
                              );
                            });
                            
                            if (filteredMembers.length === 0) {
                              return (
                                <div className="p-4 text-center text-gray-500 text-sm">
                                  <Search size={24} className="mx-auto mb-2 text-gray-300" />
                                  <p>No members found</p>
                                </div>
                              );
                            }
                            
                            return (
                              <div className="divide-y divide-gray-100">
                                {filteredMembers.map((member) => {
                                  const memberSavings = member.totalShares * (group?.shareValue || 0);
                                  const isSelected = selectedMemberId === member.id;
                                  return (
                                    <button
                                      key={member.id}
                                      type="button"
                                      onClick={() => {
                                        setSelectedMemberId(member.id);
                                        setMemberSearchTerm(member.fullName);
                                        setFormAmount('');
                                        setShowMemberDropdown(false);
                                      }}
                                      className={`w-full text-left p-3 hover:bg-blue-50 transition-colors ${
                                        isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                            {member.fullName.charAt(0).toUpperCase()}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 truncate">{member.fullName}</p>
                                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                              <span className="font-mono">{member.phone}</span>
                                              <span>•</span>
                                              <span>{labels.totalSavings}: {memberSavings.toLocaleString()} {labels.currency}</span>
                                            </div>
                                          </div>
                                        </div>
                                        {isSelected && (
                                          <CheckCircle size={18} className="text-blue-600 flex-shrink-0" />
                                        )}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            );
                          })()}
                        </div>
                      </>
                    )}
                    
                    {/* Selected Member Display */}
                    {selectedMemberId && selectedMember && (
                      <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                              {selectedMember.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-blue-900">{selectedMember.fullName}</p>
                              <p className="text-xs text-blue-700">{selectedMember.phone}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-blue-600 font-medium">{labels.maxEligible}:</p>
                            <p className="text-sm font-bold text-blue-800">{maxLoanAmount.toLocaleString()} {labels.currency}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                     You can only apply for yourself. Please contact leader for assistance.
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{labels.amount} ({labels.currency})</label>
                  <input 
                    type="number"
                    min="1"
                    max={maxLoanAmount}
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none bg-white text-gray-900 ${
                       formAmount && Number(formAmount) > maxLoanAmount ? 'border-red-300 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    disabled={!selectedMemberId && canEdit}
                    required
                  />
                  {formAmount && Number(formAmount) > maxLoanAmount && (
                    <span className="text-xs text-red-600 mt-1">{labels.exceedsLimit}</span>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{labels.durationMonths}</label>
                  <input 
                    type="number"
                    min="1"
                    max="24"
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{labels.purpose}</label>
                <textarea 
                  rows={2}
                  value={formPurpose}
                  onChange={(e) => {
                    setFormPurpose(e.target.value);
                    if (purposeError) setPurposeError(null);
                  }}
                  placeholder="e.g. School Fees, Agriculture, Business..."
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none bg-white text-gray-900 ${
                    purposeError ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  required
                />
                {purposeError && (
                  <p className="text-xs text-red-600 mt-1 flex items-center">
                    <AlertTriangle size={12} className="mr-1" /> {purposeError}
                  </p>
                )}
              </div>

              <div className="pt-2 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => {
                    setIsModalOpen(false);
                    setPurposeError(null);
                    setMemberSearchTerm('');
                    setShowMemberDropdown(false);
                    setSelectedMemberId('');
                    setFormAmount('');
                    setFormPurpose('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  {labels.cancel}
                </button>
                <button 
                  type="submit" 
                  disabled={!isAmountValid || formSubmitting}
                  className={`flex-1 px-4 py-2 text-white rounded-lg flex justify-center items-center ${
                    !isAmountValid || formSubmitting ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {formSubmitting ? <Loader2 className="animate-spin" size={20} /> : labels.submit}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fee Manager Tool */}
      {showFeeManager && (
        <div className="bg-gradient-to-br from-white to-red-50 p-6 rounded-xl border border-red-100 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h3 className="text-lg font-semibold text-red-800 flex items-center">
                <Coins size={20} className="mr-2" /> {labels.penaltyManager}
              </h3>
              <p className="text-sm text-gray-600 max-w-2xl mt-1">
                Calculate and apply fees to overdue loans. {overdueLoans.length} loans are currently overdue.
              </p>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row items-end gap-6 border-b border-red-100 pb-6 mb-6">
            <div className="w-full md:w-64">
              <label className="block text-sm font-medium text-gray-700 mb-1">{labels.penaltyType}</label>
              <div className="flex rounded-lg shadow-sm">
                <button
                  onClick={() => setFeeIsPercentage(true)}
                  className={`flex-1 px-4 py-2 text-sm font-medium border rounded-l-lg ${
                    feeIsPercentage ? 'bg-red-100 text-red-700 border-red-200' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {labels.percentage} (%)
                </button>
                <button
                   onClick={() => setFeeIsPercentage(false)}
                   className={`flex-1 px-4 py-2 text-sm font-medium border-t border-b border-r rounded-r-lg ${
                    !feeIsPercentage ? 'bg-red-100 text-red-700 border-red-200' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {labels.fixedAmount}
                </button>
              </div>
            </div>

            <div className="w-full md:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {feeIsPercentage ? labels.percentageRate : `${labels.fixedAmount} (${labels.currency})`}
              </label>
              <input 
                type="number"
                min="0"
                value={feeAmount}
                onChange={(e) => setFeeAmount(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none bg-white text-gray-900"
              />
            </div>

            <button 
              onClick={handleApplyFees}
              disabled={applyingFees || overdueCount === 0}
              className={`flex items-center px-6 py-2 rounded-lg font-medium text-white shadow-sm transition-all ${
                applyingFees || overdueCount === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {applyingFees ? <Loader2 className="animate-spin mr-2" size={18} /> : <RefreshCw size={18} className="mr-2" />}
              {applyingFees ? labels.processing : labels.applyPenalties}
            </button>
          </div>

          {/* Penalty Preview Table */}
          {overdueCount > 0 && (
             <div className="bg-white rounded-lg border border-red-100 overflow-hidden">
                <table className="w-full text-sm text-left">
                   <thead className="bg-red-50 text-red-800 font-bold uppercase text-xs">
                      <tr>
                         <th className="p-3">Member</th>
                         <th className="p-3 text-right">Balance</th>
                         <th className="p-3 text-right">Proposed Penalty</th>
                         <th className="p-3 text-right">New Total</th>
                      </tr>
                   </thead>
                   <tbody>
                      {overdueLoans.map(loan => {
                         const penalty = feeIsPercentage ? (loan.balance * feeAmount / 100) : feeAmount;
                         return (
                            <tr key={loan.id} className="border-t border-red-50">
                               <td className="p-3 font-medium text-gray-700">{getMemberName(loan.memberId)}</td>
                               <td className="p-3 text-right">{loan.balance.toLocaleString()}</td>
                               <td className="p-3 text-right text-red-600 font-bold">+{penalty.toLocaleString()}</td>
                               <td className="p-3 text-right font-bold text-gray-900">{(loan.balance + penalty).toLocaleString()}</td>
                            </tr>
                         );
                      })}
                   </tbody>
                </table>
             </div>
          )}

          {feeResult && (
            <div className="mt-4 p-3 bg-green-100 text-green-800 rounded-lg text-sm flex items-center">
              <Check size={16} className="mr-2" /> {feeResult}
            </div>
          )}
        </div>
      )}

      {/* Loan Estimator Tool */}
      {showCalculator && (
        <div className="bg-gradient-to-br from-white to-blue-50 p-6 rounded-xl border border-blue-100 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <Calculator size={20} className="mr-2 text-blue-600" /> {labels.loanEstimator}
            </h3>
            <div className="flex items-center bg-blue-100 rounded-lg p-1">
                <button 
                   onClick={() => setCalcType('FLAT')}
                   className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${calcType === 'FLAT' ? 'bg-white text-blue-700 shadow-sm' : 'text-blue-500 hover:bg-blue-200'}`}
                >
                   Flat Rate
                </button>
                <button 
                   onClick={() => setCalcType('REDUCING')}
                   className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${calcType === 'REDUCING' ? 'bg-white text-blue-700 shadow-sm' : 'text-blue-500 hover:bg-blue-200'}`}
                >
                   Reducing
                </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Inputs */}
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{labels.amount} ({labels.currency})</label>
                <div className="relative">
                  <input 
                    type="number" 
                    min="0"
                    value={calcAmount}
                    onChange={(e) => setCalcAmount(Number(e.target.value))}
                    className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow bg-white text-gray-900"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{labels.interestRate} (%)</label>
                  <input 
                    type="number" 
                    min="0"
                    step="0.1"
                    value={calcRate}
                    onChange={(e) => setCalcRate(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow bg-white text-gray-900"
                  />
                  <span className="text-xs text-gray-500 mt-1 block">{labels.perMonth}</span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{labels.durationMonths}</label>
                  <input 
                    type="number" 
                    min="1"
                    value={calcDuration}
                    onChange={(e) => setCalcDuration(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow bg-white text-gray-900"
                  />
                  <span className="text-xs text-gray-500 mt-1 block">{labels.months}</span>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="lg:col-span-2 bg-white rounded-lg p-6 border border-gray-100 shadow-sm flex flex-col justify-center">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
                <div className="pb-4 sm:pb-0">
                  <p className="text-sm font-medium text-gray-500 mb-1">{labels.monthlyPayment}</p>
                  <p className="text-2xl font-bold text-gray-900 tracking-tight">
                    {monthlyPayment.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    <span className="text-sm font-normal text-gray-400 ml-1">{labels.currency}</span>
                  </p>
                </div>
                <div className="py-4 sm:py-0">
                  <p className="text-sm font-medium text-gray-500 mb-1">{labels.totalInterest}</p>
                  <p className="text-2xl font-bold text-blue-600 tracking-tight">
                    {totalInterest.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    <span className="text-sm font-normal text-gray-400 ml-1">{labels.currency}</span>
                  </p>
                </div>
                <div className="pt-4 sm:pt-0">
                  <p className="text-sm font-medium text-gray-500 mb-1">{labels.totalRepayment}</p>
                  <p className="text-2xl font-bold text-green-600 tracking-tight">
                    {totalRepayment.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    <span className="text-sm font-normal text-gray-400 ml-1">{labels.currency}</span>
                  </p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-100">
                 <BreakdownView principal={calcAmount} totalRepayable={totalRepayment} interestRate={calcRate} />
                 <p className="text-xs text-center text-gray-400 mt-2">
                    * {calcType === 'FLAT' ? labels.formulaNote : 'Formula: Amortization (PMT)'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pending Approvals Section */}
      {pendingLoans.length > 0 && canEdit && (
        <section>
          <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
            <FileText size={20} className="mr-2" /> {labels.pendingApproval}
          </h3>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Desktop Table for Pending */}
            <div className="hidden md:block">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="p-4">{labels.members}</th>
                    <th className="p-4">{labels.amount}</th>
                    <th className="p-4">{labels.purpose}</th>
                    <th className="p-4 text-right">{labels.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pendingLoans.map(loan => (
                    <tr key={loan.id}>
                      <td className="p-4 font-medium">{getMemberName(loan.memberId)}</td>
                      <td className="p-4">{loan.principal.toLocaleString()} {labels.currency}</td>
                      <td className="p-4 text-gray-600">{loan.purpose}</td>
                      <td className="p-4 flex justify-end gap-2">
                        <button 
                            onClick={() => openReviewModal(loan)} 
                            className="flex items-center px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors text-sm"
                        >
                           <FileCheck size={16} className="mr-2" /> Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile Cards for Pending */}
            <div className="md:hidden divide-y divide-gray-100">
                {pendingLoans.map(loan => (
                    <div key={loan.id} className="p-4">
                        <div className="flex justify-between items-start mb-2">
                            <span className="font-bold text-gray-900">{getMemberName(loan.memberId)}</span>
                            <span className="text-lg font-bold text-gray-800">{loan.principal.toLocaleString()} F</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{loan.purpose}</p>
                        <button 
                            onClick={() => openReviewModal(loan)} 
                            className="w-full py-2 bg-slate-800 text-white rounded-lg text-sm font-medium flex justify-center items-center"
                        >
                            Review Application
                        </button>
                    </div>
                ))}
            </div>
          </div>
        </section>
      )}

      {/* Active Loans Table/Cards */}
      <section>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <h3 className="text-lg font-semibold text-gray-700">{labels.portfolio}</h3>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
             <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <input 
                  type="text" 
                  placeholder={labels.search} 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                />
             </div>
             <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2">
                <Filter size={16} className="text-gray-500" />
                <select 
                  className="text-sm bg-transparent outline-none cursor-pointer text-gray-700"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                >
                   <option value="ALL">All Portfolio</option>
                   <option value="ACTIVE">Active</option>
                   <option value="PENDING">Pending Approval</option>
                   <option value="DEFAULTED">Defaulted / Overdue</option>
                   <option value="CLEARED">Cleared History</option>
                   <option value="REJECTED">Rejected</option>
                </select>
             </div>
             <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2">
                <ArrowUpDown size={16} className="text-gray-500" />
                <select 
                  className="text-sm bg-transparent outline-none cursor-pointer text-gray-700"
                  value={`${sortField}-${sortDirection}`}
                  onChange={(e) => {
                      const [field, dir] = e.target.value.split('-');
                      setSortField(field as any);
                      setSortDirection(dir as any);
                  }}
                >
                   <option value="dueDate-asc">Due Date (Earliest)</option>
                   <option value="dueDate-desc">Due Date (Latest)</option>
                   <option value="amount-desc">Amount (High-Low)</option>
                   <option value="amount-asc">Amount (Low-High)</option>
                   <option value="memberName-asc">Name (A-Z)</option>
                   <option value="status-asc">Status</option>
                </select>
             </div>
          </div>
        </div>

        {/* --- DESKTOP TABLE VIEW --- */}
        <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
           <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                <tr>
                  <th className="p-4 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('memberName')}>
                    <div className="flex items-center">
                      {labels.members}
                      <SortIcon field="memberName" />
                    </div>
                  </th>
                  <th className="p-4">Start Date</th>
                  <th className="p-4 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('dueDate')}>
                    <div className="flex items-center">
                      Due Date
                      <SortIcon field="dueDate" />
                    </div>
                  </th>
                  <th className="p-4 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('amount')}>
                    <div className="flex items-center">
                      Principal
                      <SortIcon field="amount" />
                    </div>
                  </th>
                  <th className="p-4">Repaid</th>
                  <th className="p-4">Balance</th>
                  <th className="p-4 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('status')}>
                    <div className="flex items-center">
                      {labels.status}
                      <SortIcon field="status" />
                    </div>
                  </th>
                  <th className="p-4">Progress</th>
                  <th className="p-4 text-right">{labels.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredActiveLoans.length === 0 ? (
                  <tr><td colSpan={9} className="p-8 text-center text-gray-500">{labels.noData}</td></tr>
                ) : (
                  filteredActiveLoans.map(loan => {
                    const repaid = loan.totalRepayable - loan.balance;
                    const progress = loan.totalRepayable > 0 ? (repaid / loan.totalRepayable) * 100 : 100;
                    const isOverdue = loan.status !== LoanStatus.CLEARED && new Date(loan.dueDate) < new Date();
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
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            loan.status === LoanStatus.ACTIVE ? 'bg-blue-100 text-blue-800' :
                            loan.status === LoanStatus.DEFAULTED ? 'bg-red-100 text-red-800' :
                            loan.status === LoanStatus.CLEARED ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {loan.status}
                          </span>
                        </td>
                        <td className="p-4">
                          {loan.status === LoanStatus.CLEARED ? (
                             <span className="text-xs font-bold text-green-600">100% Paid</span>
                          ) : (
                            <>
                              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                                <div className={`h-2.5 rounded-full ${isDefaulted ? 'bg-red-500' : 'bg-blue-600'}`} style={{ width: `${progress}%` }}></div>
                              </div>
                              <span className={`text-xs ${isDefaulted ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                                {Math.round(progress)}% Paid
                              </span>
                            </>
                          )}
                        </td>
                        <td className="p-4 text-right flex justify-end gap-1">
                          <button onClick={() => setViewingLoan(loan)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="View Details">
                              <Eye size={16} />
                          </button>
                          {(loan.status === LoanStatus.ACTIVE || loan.status === LoanStatus.DEFAULTED) && canEdit && (
                            <button 
                              onClick={() => openRepayModal(loan)}
                              className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                              title={labels.recordRepayment}
                            >
                              <Banknote size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* --- MOBILE CARD VIEW --- */}
        <div className="md:hidden space-y-4">
            {filteredActiveLoans.length === 0 ? (
                <div className="p-8 text-center text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">{labels.noData}</div>
            ) : (
                filteredActiveLoans.map(loan => {
                    const repaid = loan.totalRepayable - loan.balance;
                    const progress = loan.totalRepayable > 0 ? (repaid / loan.totalRepayable) * 100 : 100;
                    const isOverdue = loan.status !== LoanStatus.CLEARED && new Date(loan.dueDate) < new Date();
                    const isDefaulted = loan.status === LoanStatus.DEFAULTED;
                    const isExpanded = expandedLoanId === loan.id;

                    return (
                        <div key={loan.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h4 className="font-bold text-gray-900">{getMemberName(loan.memberId)}</h4>
                                    <div className="flex items-center mt-1 space-x-2">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                                            loan.status === LoanStatus.ACTIVE ? 'bg-blue-100 text-blue-800' :
                                            loan.status === LoanStatus.DEFAULTED ? 'bg-red-100 text-red-800' :
                                            loan.status === LoanStatus.CLEARED ? 'bg-green-100 text-green-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                            {loan.status}
                                        </span>
                                        {isOverdue && <span className="text-xs text-red-600 font-bold flex items-center"><AlertTriangle size={12} className="mr-1"/> Overdue</span>}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-gray-900">{loan.balance.toLocaleString()}</p>
                                    <p className="text-xs text-gray-500">Balance</p>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mb-3">
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-gray-500">Progress</span>
                                    <span className="font-medium text-gray-700">{Math.round(progress)}%</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                    <div className={`h-2 rounded-full ${isDefaulted ? 'bg-red-500' : 'bg-blue-600'}`} style={{ width: `${progress}%` }}></div>
                                </div>
                            </div>

                            <button 
                                onClick={() => setExpandedLoanId(isExpanded ? null : loan.id)}
                                className="w-full flex items-center justify-between text-xs text-gray-500 py-2 border-t border-gray-100"
                            >
                                {isExpanded ? 'Hide Details' : 'Show Details'}
                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>

                            {isExpanded && (
                                <div className="pt-2 text-sm space-y-2 border-t border-gray-100 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Principal:</span>
                                        <span className="font-medium">{loan.principal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Due Date:</span>
                                        <span className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>{loan.dueDate}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Start Date:</span>
                                        <span className="font-medium">{loan.startDate}</span>
                                    </div>
                                    
                                    <BreakdownView 
                                        principal={loan.principal} 
                                        totalRepayable={loan.totalRepayable} 
                                        interestRate={loan.interestRate} 
                                    />
                                </div>
                            )}

                            {(loan.status === LoanStatus.ACTIVE || loan.status === LoanStatus.DEFAULTED) && canEdit && (
                                <button 
                                    onClick={() => openRepayModal(loan)}
                                    className="w-full mt-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium flex justify-center items-center active:bg-blue-700"
                                >
                                    <Banknote size={16} className="mr-2" /> {labels.recordRepayment}
                                </button>
                            )}
                        </div>
                    );
                })
            )}
        </div>
      </section>
    </div>
  );
}
