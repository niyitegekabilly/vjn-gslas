
import React, { useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AppContext } from '../App';
import { api } from '../api/client';
import { LABELS } from '../constants';
import { Member, Cycle } from '../types';
import { 
  FileText, Download, Printer, Filter, Calendar, Users, 
  BarChart2, PieChart, TrendingUp, AlertCircle, Loader2, ChevronRight, Lock, AlertTriangle, CheckCircle, Wallet
} from 'lucide-react';
import { Skeleton, TableRowSkeleton } from '../components/Skeleton';

type ReportType = 'SAVINGS_SUMMARY' | 'LOAN_PORTFOLIO' | 'CASH_FLOW' | 'ATTENDANCE_REGISTER' | 'EXPENSE_REPORT' | 'SHARE_OUT' | 'FINE_REPORT' | 'MEMBER_FINANCIAL_SUMMARY';

interface ReportConfig {
  id: ReportType;
  titleKey: keyof typeof LABELS.en | 'reports'; 
  categoryKey: 'financial' | 'operational' | 'endOfCycle';
  icon: any;
}

const REPORT_CONFIGS: ReportConfig[] = [
  { id: 'SAVINGS_SUMMARY', titleKey: 'totalSavings', categoryKey: 'financial', icon: PiggyBankIcon },
  { id: 'LOAN_PORTFOLIO', titleKey: 'portfolio', categoryKey: 'financial', icon: BarChart2 },
  { id: 'CASH_FLOW', titleKey: 'financialTrends', categoryKey: 'financial', icon: TrendingUp },
  { id: 'MEMBER_FINANCIAL_SUMMARY', titleKey: 'memberFinancialSummary', categoryKey: 'financial', icon: Wallet },
  { id: 'FINE_REPORT', titleKey: 'outstandingFines', categoryKey: 'operational', icon: AlertCircle },
  { id: 'EXPENSE_REPORT', titleKey: 'expenses', categoryKey: 'operational', icon: FileText },
  { id: 'ATTENDANCE_REGISTER', titleKey: 'attendance', categoryKey: 'operational', icon: Users },
  { id: 'SHARE_OUT', titleKey: 'shareOutReport', categoryKey: 'endOfCycle', icon: PieChart },
];

function PiggyBankIcon(props: any) {
  return <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2.5V5z"/><path d="M2 9v1c0 1.1.9 2 2 2h1"/><path d="M16 11h.01"/></svg>;
}

export default function Reports() {
  const { activeGroupId, lang, groups } = useContext(AppContext);
  const labels = LABELS[lang];
  const group = groups.find(g => g.id === activeGroupId);
  const location = useLocation();

  const [activeReport, setActiveReport] = useState<ReportType>('SAVINGS_SUMMARY');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [cycle, setCycle] = useState<Cycle | null>(null);

  // Filters
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: new Date().toISOString().split('T')[0],
    memberId: '',
    status: 'ALL'
  });

  // Handle Navigation State
  useEffect(() => {
    if (location.state && location.state.reportId) {
      setActiveReport(location.state.reportId);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Initial Load
  useEffect(() => {
    if (!activeGroupId) return;
    api.getMembers(activeGroupId).then(setMembers);
    if(group?.currentCycleId) api.getCycle(group.currentCycleId).then(c => setCycle(c || null));
  }, [activeGroupId, group]);

  // Fetch Report Data
  useEffect(() => {
    if (!activeGroupId) return;
    setLoading(true);
    setData(null);
    api.generateReport(activeGroupId, activeReport, filters)
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [activeGroupId, activeReport, filters]);

  const handlePrint = () => {
    try {
      window.print();
    } catch (e) {
      console.error("Print error:", e);
      alert("Unable to trigger print. Please use your browser's print function.");
    }
  };

  const exportCSV = () => {
    if (!data || (Array.isArray(data) && data.length === 0)) return;
    
    let headers = '';
    let rows = '';

    if (activeReport === 'SHARE_OUT' && data.members) {
       headers = Object.keys(data.members[0]).join(',');
       rows = data.members.map((row: any) => Object.values(row).join(',')).join('\n');
    } else if (activeReport === 'CASH_FLOW' && data.inflows) {
       headers = 'Category,Amount,Type';
       rows = [
         ...Object.entries(data.inflows).map(([k,v]) => `${k},${v},Inflow`),
         ...Object.entries(data.outflows).map(([k,v]) => `${k},${v},Outflow`),
         `Net Cash,${data.netCash},Total`
       ].join('\n');
    } else if (Array.isArray(data) && data.length > 0) {
       headers = Object.keys(data[0]).join(',');
       rows = data.map((row: any) => Object.values(row).join(',')).join('\n');
    } else {
      return;
    }

    const csvContent = headers + "\n" + rows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${activeReport}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Determine status options based on report type
  const getStatusOptions = () => {
      switch(activeReport) {
          case 'SAVINGS_SUMMARY': return ['ACTIVE', 'EXITED', 'SUSPENDED'];
          case 'LOAN_PORTFOLIO': return ['ACTIVE', 'PENDING', 'CLEARED', 'DEFAULTED'];
          case 'FINE_REPORT': return ['PAID', 'UNPAID', 'PARTIALLY_PAID'];
          case 'MEMBER_FINANCIAL_SUMMARY': return ['ACTIVE', 'EXITED', 'SUSPENDED'];
          default: return [];
      }
  };
  const statusOptions = getStatusOptions();

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-100px)] print:h-auto print:block">
      
      {/* SIDEBAR */}
      <div className="w-full lg:w-64 flex-shrink-0 bg-white rounded-xl shadow-sm border border-gray-200 overflow-y-auto print:hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">{labels.reportTypes}</h2>
        </div>
        <div className="p-2 space-y-6">
          {['financial', 'operational', 'endOfCycle'].map(catKey => (
            <div key={catKey}>
              <h3 className="px-3 text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">{labels[catKey as keyof typeof labels]}</h3>
              <div className="space-y-1">
                {REPORT_CONFIGS.filter(r => r.categoryKey === catKey).map(report => (
                  <button
                    key={report.id}
                    onClick={() => setActiveReport(report.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeReport === report.id 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <report.icon size={18} className={`mr-3 ${activeReport === report.id ? 'text-blue-600' : 'text-gray-400'}`} />
                    {/* @ts-ignore */}
                    {labels[report.titleKey]}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden print:border-none print:shadow-none print:overflow-visible print:h-auto">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-wrap gap-4 items-center justify-between print:hidden">
           <div className="flex items-center gap-2 flex-wrap">
              {/* Date Filters */}
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                 <Calendar size={16} className="text-gray-400" />
                 <input 
                   type="date" 
                   className="text-sm outline-none text-gray-600 w-32"
                   value={filters.startDate}
                   onChange={e => setFilters({...filters, startDate: e.target.value})}
                 />
                 <span className="text-gray-300">to</span>
                 <input 
                   type="date" 
                   className="text-sm outline-none text-gray-600 w-32"
                   value={filters.endDate}
                   onChange={e => setFilters({...filters, endDate: e.target.value})}
                 />
              </div>

              {/* Member Filter */}
              {activeReport !== 'CASH_FLOW' && activeReport !== 'EXPENSE_REPORT' && activeReport !== 'SHARE_OUT' && (
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                   <Users size={16} className="text-gray-400" />
                   <select 
                     className="text-sm outline-none text-gray-600 bg-transparent w-32"
                     value={filters.memberId}
                     onChange={e => setFilters({...filters, memberId: e.target.value})}
                   >
                      <option value="">{labels.members}</option>
                      {members.map(m => <option key={m.id} value={m.id}>{m.fullName}</option>)}
                   </select>
                </div>
              )}

              {/* Status Filter */}
              {statusOptions.length > 0 && (
                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                    <Filter size={16} className="text-gray-400" />
                    <select 
                        className="text-sm outline-none text-gray-600 bg-transparent w-24"
                        value={filters.status}
                        onChange={e => setFilters({...filters, status: e.target.value})}
                    >
                        <option value="ALL">All Status</option>
                        {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
              )}
           </div>

           <div className="flex gap-2">
              <button onClick={exportCSV} className="flex items-center px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 shadow-sm">
                 <Download size={16} className="mr-2" /> {labels.exportCsv}
              </button>
              <button onClick={handlePrint} className="flex items-center px-3 py-1.5 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-900 shadow-sm">
                 <Printer size={16} className="mr-2" /> {labels.printPdf}
              </button>
           </div>
        </div>

        {/* Report View */}
        <div className="flex-1 overflow-auto bg-gray-50 p-6 print:overflow-visible print:bg-white print:p-0 print:h-auto">
           <div className="max-w-5xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-200 min-h-full print:border-none print:shadow-none print:max-w-none print:p-0">
              {/* Report Header (Print Friendly) */}
              <div className="mb-8 border-b border-gray-100 pb-6 print:border-gray-300">
                 <div className="flex justify-between items-start">
                    <div>
                        {/* @ts-ignore */}
                       <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-tight">{labels[REPORT_CONFIGS.find(r => r.id === activeReport)?.titleKey]}</h1>
                       <p className="text-sm text-gray-500 mt-1">{group?.name} — {group?.district}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-sm font-bold text-gray-900">{labels.generated}: {new Date().toLocaleDateString()}</p>
                       <p className="text-xs text-gray-500">Season: {cycle?.startDate || 'Active'} — {cycle?.endDate || 'Present'}</p>
                    </div>
                 </div>
              </div>

              {loading ? (
                 <div className="space-y-8">
                    <div className="grid grid-cols-3 gap-6">
                        <Skeleton className="h-24 rounded-lg" />
                        <Skeleton className="h-24 rounded-lg" />
                        <Skeleton className="h-24 rounded-lg" />
                    </div>
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => <TableRowSkeleton key={i} />)}
                    </div>
                 </div>
              ) : (
                 <>
                    {/* SPECIFIC REPORT LAYOUTS */}
                    
                    {activeReport === 'CASH_FLOW' && data && data.inflows && (
                       <div className="space-y-8">
                          <div className="grid grid-cols-3 gap-6">
                             <div className="p-4 bg-green-50 rounded-lg border border-green-100 print:bg-transparent print:border-green-200">
                                <p className="text-xs font-bold text-green-700 uppercase">{labels.totalInflow}</p>
                                <p className="text-2xl font-bold text-green-900 mt-1">
                                   {Object.values(data.inflows || {}).reduce((a:any,b:any)=>a+b,0).toLocaleString()}
                                </p>
                             </div>
                             <div className="p-4 bg-red-50 rounded-lg border border-red-100 print:bg-transparent print:border-red-200">
                                <p className="text-xs font-bold text-red-700 uppercase">{labels.totalOutflow}</p>
                                <p className="text-2xl font-bold text-red-900 mt-1">
                                   {Object.values(data.outflows || {}).reduce((a:any,b:any)=>a+b,0).toLocaleString()}
                                </p>
                             </div>
                             <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 print:bg-transparent print:border-blue-200">
                                <p className="text-xs font-bold text-blue-700 uppercase">{labels.netPosition}</p>
                                <p className="text-2xl font-bold text-blue-900 mt-1">
                                   {data.netCash.toLocaleString()}
                                </p>
                             </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-8">
                             <div>
                                <h3 className="font-bold text-gray-800 mb-3 border-b pb-2">{labels.inflowsBreakdown}</h3>
                                <ul className="space-y-2 text-sm">
                                   {Object.entries(data.inflows || {}).map(([k, v]: any) => (
                                      <li key={k} className="flex justify-between">
                                         <span className="text-gray-600">{k.replace('_', ' ')}</span>
                                         <span className="font-mono font-medium">{v.toLocaleString()}</span>
                                      </li>
                                   ))}
                                </ul>
                             </div>
                             <div>
                                <h3 className="font-bold text-gray-800 mb-3 border-b pb-2">{labels.outflowsBreakdown}</h3>
                                <ul className="space-y-2 text-sm">
                                   {Object.entries(data.outflows || {}).map(([k, v]: any) => (
                                      <li key={k} className="flex justify-between">
                                         <span className="text-gray-600">{k.replace('_', ' ')}</span>
                                         <span className="font-mono font-medium">{v.toLocaleString()}</span>
                                      </li>
                                   ))}
                                </ul>
                             </div>
                          </div>
                       </div>
                    )}

                    {activeReport === 'SHARE_OUT' && data && data.summary && (
                       <div className="space-y-8">
                          {/* Disclaimer Banner for Active Seasons */}
                          {cycle?.status !== 'CLOSED' ? (
                             <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 flex items-start print:hidden">
                                <AlertTriangle className="text-amber-600 mt-0.5 mr-3" size={20} />
                                <div>
                                   <h4 className="font-bold text-amber-900 text-sm">{labels.projectedReport}</h4>
                                   <p className="text-amber-700 text-sm mt-1">
                                      {labels.shareOutDesc}
                                   </p>
                                </div>
                             </div>
                          ) : (
                             <div className="bg-green-50 p-4 rounded-lg border border-green-200 flex items-center print:border-none print:bg-transparent print:p-0">
                                <Lock className="text-green-700 mr-3" size={20} />
                                <h4 className="font-bold text-green-900 text-sm">{labels.finalReport}</h4>
                             </div>
                          )}

                          <div className="bg-slate-900 text-white p-6 rounded-xl shadow-sm print:bg-white print:text-black print:border print:border-gray-200">
                             <div className="grid grid-cols-5 gap-4 text-center divide-x divide-slate-700 print:divide-gray-200">
                                <div>
                                   <p className="text-xs text-slate-400 print:text-gray-500 uppercase mb-1">{labels.totalCash}</p>
                                   <p className="text-lg font-bold">{data.summary.cashOnHand.toLocaleString()}</p>
                                </div>
                                <div>
                                   <p className="text-xs text-slate-400 print:text-gray-500 uppercase mb-1">{labels.socialFund}</p>
                                   <p className="text-lg font-bold text-orange-400 print:text-orange-700">-{data.summary.socialFund.toLocaleString()}</p>
                                </div>
                                <div>
                                   <p className="text-xs text-slate-400 print:text-gray-500 uppercase mb-1">{labels.loansAssets}</p>
                                   <p className="text-lg font-bold text-blue-400 print:text-blue-700">+{data.summary.outstandingLoans.toLocaleString()}</p>
                                </div>
                                <div>
                                   <p className="text-xs text-slate-400 print:text-gray-500 uppercase mb-1">{labels.netWorth}</p>
                                   <p className="text-lg font-bold text-green-400 print:text-green-700">{data.summary.netWorth.toLocaleString()}</p>
                                </div>
                                <div>
                                   <p className="text-xs text-yellow-400 print:text-yellow-700 uppercase mb-1">{labels.valuePerShare}</p>
                                   <p className="text-xl font-bold text-yellow-400 print:text-yellow-700">{Math.round(data.summary.valuePerShare).toLocaleString()}</p>
                                </div>
                             </div>
                          </div>

                          <table className="w-full text-sm text-left">
                             <thead className="bg-gray-50 text-gray-500 font-medium uppercase text-xs print:bg-gray-100 print:text-black">
                                <tr>
                                   <th className="p-3">{labels.members}</th>
                                   <th className="p-3 text-right">{labels.shareCount}</th>
                                   <th className="p-3 text-right">{labels.invested}</th>
                                   <th className="p-3 text-right">{labels.profit}</th>
                                   <th className="p-3 text-right">{labels.totalPayout}</th>
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-gray-100">
                                {data.members.map((m: any, i: number) => (
                                   <tr key={i} className="hover:bg-gray-50">
                                      <td className="p-3 font-medium text-gray-900">{m.name}</td>
                                      <td className="p-3 text-right">{m.shares}</td>
                                      <td className="p-3 text-right text-gray-600">{m.invested.toLocaleString()}</td>
                                      <td className="p-3 text-right text-green-600 font-medium">+{Math.round(m.profit).toLocaleString()}</td>
                                      <td className="p-3 text-right font-bold text-gray-900">{Math.round(m.currentValue).toLocaleString()}</td>
                                   </tr>
                                ))}
                             </tbody>
                          </table>
                       </div>
                    )}

                    {/* GENERIC TABLE FOR LIST REPORTS */}
                    {['SAVINGS_SUMMARY', 'LOAN_PORTFOLIO', 'FINE_REPORT', 'ATTENDANCE_REGISTER', 'EXPENSE_REPORT', 'MEMBER_FINANCIAL_SUMMARY'].includes(activeReport) && data && Array.isArray(data) && (
                       <div className="overflow-x-auto print:overflow-visible">
                          <table className="w-full text-sm text-left border-collapse">
                             <thead className="bg-gray-100 text-gray-600 font-bold uppercase text-xs print:bg-gray-200 print:text-black">
                                <tr>
                                   {Object.keys(data[0] || {}).filter(k => k !== 'id').map(key => (
                                      <th key={key} className="p-3 border-b border-gray-200">
                                         {key.replace(/([A-Z])/g, ' $1').trim()}
                                      </th>
                                   ))}
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-gray-200">
                                {data.map((row: any, idx: number) => (
                                   <tr key={row.id || idx} className="hover:bg-gray-50">
                                      {Object.entries(row).filter(([k]) => k !== 'id').map(([k, v]: any) => (
                                         <td key={k} className="p-3 text-gray-700">
                                            {typeof v === 'number' && k !== 'Interest Rate (%)' ? v.toLocaleString() : v}
                                         </td>
                                      ))}
                                   </tr>
                                ))}
                             </tbody>
                          </table>
                          {data.length === 0 && (
                             <div className="p-8 text-center text-gray-400 italic">{labels.noData}</div>
                          )}
                       </div>
                    )}
                 </>
              )}
              
              <div className="mt-12 pt-8 border-t border-gray-200 text-xs text-gray-400 text-center">
                 <p>Vision Jeunesse Nouvelle — GSLA Management System</p>
                 <p>{labels.confidential}</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
