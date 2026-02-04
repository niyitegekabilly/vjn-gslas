
import React, { useContext, useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { AppContext } from '../App';
import { api } from '../api/client';
import { LABELS } from '../constants';
import { Member, Cycle } from '../types';
import { 
  FileText, Download, Printer, Filter, Calendar, Users, 
  BarChart2, PieChart, TrendingUp, AlertCircle, Loader2, 
  ChevronRight, Lock, Wallet, ArrowUpRight, ArrowDownRight, LayoutTemplate, CheckCircle,
  RefreshCw, Clock, TrendingDown, DollarSign, Activity, Eye
} from 'lucide-react';
import { Skeleton, TableRowSkeleton } from '../components/Skeleton';
import { MemberSearchSelect } from '../components/MemberSearchSelect';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart as RePieChart, Pie, Cell
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { generatePDFReport } from '../services/pdfGenerator';

type ReportType = 'SAVINGS_SUMMARY' | 'LOAN_PORTFOLIO' | 'CASH_FLOW' | 'ATTENDANCE_REGISTER' | 'EXPENSE_REPORT' | 'SHARE_OUT' | 'FINE_REPORT' | 'MEMBER_FINANCIAL_SUMMARY';

interface ReportConfig {
  id: ReportType;
  titleKey: keyof typeof LABELS.en | 'reports'; 
  categoryKey: 'financial' | 'operational' | 'endOfCycle';
  icon: any;
  description?: string;
}

const REPORT_CONFIGS: ReportConfig[] = [
  { id: 'SAVINGS_SUMMARY', titleKey: 'totalSavings', categoryKey: 'financial', icon: Wallet, description: "Detailed breakdown of member share contributions." },
  { id: 'LOAN_PORTFOLIO', titleKey: 'portfolio', categoryKey: 'financial', icon: BarChart2, description: "Status of all active and past loans." },
  { id: 'CASH_FLOW', titleKey: 'financialTrends', categoryKey: 'financial', icon: TrendingUp, description: "Inflow vs Outflow analysis." },
  { id: 'MEMBER_FINANCIAL_SUMMARY', titleKey: 'memberFinancialSummary', categoryKey: 'financial', icon: LayoutTemplate, description: "Comprehensive view per member." },
  { id: 'FINE_REPORT', titleKey: 'outstandingFines', categoryKey: 'operational', icon: AlertCircle, description: "Fines assessed and collected." },
  { id: 'EXPENSE_REPORT', titleKey: 'expenses', categoryKey: 'operational', icon: FileText, description: "Operational expenditure tracking." },
  { id: 'ATTENDANCE_REGISTER', titleKey: 'attendance', categoryKey: 'operational', icon: Users, description: "Meeting presence records." },
  { id: 'SHARE_OUT', titleKey: 'shareOutReport', categoryKey: 'endOfCycle', icon: RePieChart, description: "End of cycle calculation and dividend distribution." },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function Reports() {
  const { activeGroupId, lang, groups } = useContext(AppContext);
  const { user } = useAuth();
  const labels = LABELS[lang];
  const group = groups.find(g => g.id === activeGroupId);
  const location = useLocation();

  const [activeReport, setActiveReport] = useState<ReportType>('SAVINGS_SUMMARY');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [cycle, setCycle] = useState<Cycle | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    memberId: '',
    status: 'ALL'
  });

  // Handle Navigation State
  useEffect(() => {
    if (location.state) {
      if (location.state.reportId) {
        setActiveReport(location.state.reportId);
      }
      if (location.state.successMessage) {
        setSuccessMessage(location.state.successMessage);
        // Clear message after 5 seconds
        setTimeout(() => setSuccessMessage(null), 5000);
      }
      // Clear location state to prevent reappearing on refresh (optional, but good practice)
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
  const fetchReportData = async () => {
    if (!activeGroupId) return;
    setLoading(true);
    try {
      const res = await api.generateReport(activeGroupId, activeReport, filters);
      setData(res);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [activeGroupId, activeReport, filters]);

  // Auto-refresh every 30 seconds if enabled
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchReportData();
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, activeGroupId, activeReport, filters]);

  const handlePrint = () => {
    if (!data || !group) return;
    
    // @ts-ignore
    const title = labels[REPORT_CONFIGS.find(r => r.id === activeReport)?.titleKey] || activeReport;
    
    generatePDFReport({
        reportType: activeReport,
        reportTitle: title,
        group: group,
        user: user,
        cycle: cycle,
        data: data,
        filters: filters
    });
  };

  const exportCSV = () => {
    if (!data) return;
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
    link.setAttribute("download", `${activeReport}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- RENDER HELPERS ---

  const renderSummaryCards = () => {
    if (!data) return null;

    if (activeReport === 'CASH_FLOW' && data.inflows) {
        const totalIn = data.totalInflow || Object.values(data.inflows as Record<string, number>).reduce((a,b) => a+b, 0);
        const totalOut = data.totalOutflow || Object.values(data.outflows as Record<string, number>).reduce((a,b) => a+b, 0);
        const netCash = data.netCash || (totalIn - totalOut);
        const isPositive = netCash >= 0;
        
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-xl border-2 border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">{labels.totalInflow}</span>
                        <div className="p-2 bg-emerald-200 rounded-lg">
                            <ArrowUpRight size={18} className="text-emerald-700"/>
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-emerald-900">{totalIn.toLocaleString()} <span className="text-sm font-normal text-emerald-700">RWF</span></p>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl border-2 border-red-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-red-700 uppercase tracking-wide">{labels.totalOutflow}</span>
                        <div className="p-2 bg-red-200 rounded-lg">
                            <ArrowDownRight size={18} className="text-red-700"/>
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-red-900">{totalOut.toLocaleString()} <span className="text-sm font-normal text-red-700">RWF</span></p>
                </div>
                <div className={`bg-gradient-to-br ${isPositive ? 'from-blue-50 to-blue-100 border-blue-200' : 'from-orange-50 to-orange-100 border-orange-200'} p-6 rounded-xl border-2 shadow-sm hover:shadow-md transition-shadow`}>
                    <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-bold uppercase tracking-wide ${isPositive ? 'text-blue-700' : 'text-orange-700'}`}>{labels.netPosition}</span>
                        <div className={`p-2 rounded-lg ${isPositive ? 'bg-blue-200' : 'bg-orange-200'}`}>
                            {isPositive ? (
                                <TrendingUp size={18} className={isPositive ? 'text-blue-700' : 'text-orange-700'}/>
                            ) : (
                                <TrendingDown size={18} className="text-orange-700"/>
                            )}
                        </div>
                    </div>
                    <p className={`text-3xl font-bold ${isPositive ? 'text-blue-900' : 'text-orange-900'}`}>
                        {netCash.toLocaleString()} <span className={`text-sm font-normal ${isPositive ? 'text-blue-700' : 'text-orange-700'}`}>RWF</span>
                    </p>
                </div>
            </div>
        );
    }

    if (activeReport === 'SHARE_OUT' && data && typeof data === 'object' && 'summary' in data && data.summary) {
        const shareOutData = data as { summary: any };
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white p-6 rounded-xl shadow-lg border-2 border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-300 uppercase tracking-wide font-bold">{labels.netWorth}</span>
                        <DollarSign size={20} className="text-slate-400"/>
                    </div>
                    <p className="text-3xl font-bold">{shareOutData.summary.netWorth?.toLocaleString() || 0} <span className="text-sm font-normal text-slate-300">RWF</span></p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border-2 border-green-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-green-700 uppercase tracking-wide font-bold">{labels.valuePerShare}</span>
                        <TrendingUp size={20} className="text-green-600"/>
                    </div>
                    <p className="text-3xl font-bold text-green-900">{Math.round(shareOutData.summary.valuePerShare || 0).toLocaleString()} <span className="text-sm font-normal text-green-700">RWF</span></p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border-2 border-blue-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-blue-700 uppercase tracking-wide font-bold">{labels.outstandingLoans}</span>
                        <AlertCircle size={20} className="text-blue-600"/>
                    </div>
                    <p className="text-3xl font-bold text-blue-900">{shareOutData.summary.outstandingLoans?.toLocaleString() || 0} <span className="text-sm font-normal text-blue-700">RWF</span></p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border-2 border-purple-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-purple-700 uppercase tracking-wide font-bold">{labels.cashBalance}</span>
                        <Wallet size={20} className="text-purple-600"/>
                    </div>
                    <p className="text-3xl font-bold text-purple-900">{shareOutData.summary.cashOnHand?.toLocaleString() || 0} <span className="text-sm font-normal text-purple-700">RWF</span></p>
                </div>
            </div>
        );
    }

    if (Array.isArray(data) && data.length > 0) {
        // Generic summarizer for list reports
        let total = 0;
        let count = data.length;
        let label = "Total Amount";

        if (activeReport === 'SAVINGS_SUMMARY') {
            total = data.reduce((acc: number, curr: any) => acc + (curr["Total Savings"] || 0), 0);
            label = labels.totalSavings;
        } else if (activeReport === 'LOAN_PORTFOLIO') {
            total = data.reduce((acc: number, curr: any) => acc + (curr["Balance"] || 0), 0);
            label = labels.loanBalance;
        } else if (activeReport === 'FINE_REPORT') {
            total = data.reduce((acc: number, curr: any) => acc + (curr["Balance"] || 0), 0);
            label = labels.outstandingFines;
        }

        if (total > 0 || count > 0) {
            return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border-2 border-blue-200 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">{label}</span>
                            <DollarSign size={20} className="text-blue-600"/>
                        </div>
                        <p className="text-3xl font-bold text-blue-900">{total.toLocaleString()} <span className="text-sm font-normal text-blue-700">RWF</span></p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border-2 border-purple-200 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-purple-700 uppercase tracking-wide">Total Records</span>
                            <FileText size={20} className="text-purple-600"/>
                        </div>
                        <p className="text-3xl font-bold text-purple-900">{count}</p>
                    </div>
                    {activeReport === 'SAVINGS_SUMMARY' && (
                        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border-2 border-green-200 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-green-700 uppercase tracking-wide">Average Savings</span>
                                <TrendingUp size={20} className="text-green-600"/>
                            </div>
                            <p className="text-3xl font-bold text-green-900">
                                {count > 0 ? Math.round(total / count).toLocaleString() : 0} <span className="text-sm font-normal text-green-700">RWF</span>
                            </p>
                        </div>
                    )}
                    {activeReport === 'LOAN_PORTFOLIO' && (
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border-2 border-orange-200 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-orange-700 uppercase tracking-wide">Active Loans</span>
                                <AlertCircle size={20} className="text-orange-600"/>
                            </div>
                            <p className="text-3xl font-bold text-orange-900">
                                {data.filter((l: any) => l.Status === 'ACTIVE' || l.Status === 'APPROVED').length}
                            </p>
                        </div>
                    )}
                </div>
            );
        }
    }
    return null;
  };

  const renderCharts = () => {
    if (!data) return null;

    // 1. Savings Distribution (Bar Chart of Top 10)
    if (activeReport === 'SAVINGS_SUMMARY' && Array.isArray(data) && data.length > 0) {
        const chartData = [...data]
          .filter((m: any) => (m["Total Savings"] || 0) > 0)
          .sort((a,b) => (b["Total Savings"] || 0) - (a["Total Savings"] || 0))
          .slice(0, 10)
          .map((m: any, idx: number) => ({
            ...m,
            name: m["Member Name"]?.substring(0, 15) + (m["Member Name"]?.length > 15 ? '...' : ''),
            savings: m["Total Savings"] || 0
          }));
        
        if (chartData.length === 0) return null;
        
        return (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <TrendingUp size={20} className="text-green-600"/>
                            Top Savers
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">Top 10 members by savings</p>
                    </div>
                </div>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 60 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis 
                                dataKey="name" 
                                angle={-45}
                                textAnchor="end"
                                height={80}
                                tick={{ fontSize: 11, fill: '#6b7280' }}
                            />
                            <YAxis 
                                tick={{ fontSize: 12, fill: '#6b7280' }}
                                tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                            />
                            <Tooltip 
                                contentStyle={{ 
                                    borderRadius: '8px', 
                                    border: '1px solid #e5e7eb', 
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                    backgroundColor: 'white'
                                }}
                                formatter={(value: any) => [`${Number(value).toLocaleString()} RWF`, 'Savings']}
                                labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                            />
                            <Bar 
                                dataKey="savings" 
                                fill="url(#colorGradient)"
                                radius={[8, 8, 0, 0]}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                            <defs>
                                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.8}/>
                                    <stop offset="100%" stopColor="#059669" stopOpacity={0.6}/>
                                </linearGradient>
                            </defs>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        );
    }

    // 2. Loan Status (Pie Chart)
    if (activeReport === 'LOAN_PORTFOLIO' && Array.isArray(data) && data.length > 0) {
        const statusCounts = data.reduce((acc: any, curr: any) => {
            const s = curr["Status"] || 'Unknown';
            acc[s] = (acc[s] || 0) + 1;
            return acc;
        }, {});
        const chartData = Object.keys(statusCounts).map(k => ({ name: k, value: statusCounts[k] }));

        if (chartData.length === 0) return null;

        return (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <PieChart size={20} className="text-blue-600"/>
                            Portfolio Health
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">Loan status distribution</p>
                    </div>
                </div>
                <div className="h-80 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <RePieChart>
                            <Pie 
                                data={chartData} 
                                cx="50%" 
                                cy="50%" 
                                innerRadius={70} 
                                outerRadius={100} 
                                paddingAngle={3}
                                dataKey="value"
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                labelLine={false}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ 
                                    borderRadius: '8px', 
                                    border: '1px solid #e5e7eb', 
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                    backgroundColor: 'white'
                                }}
                                formatter={(value: any, name: string) => [value, name]}
                            />
                        </RePieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        );
    }

    // 3. Cash Flow (Detailed Breakdown)
    if (activeReport === 'CASH_FLOW' && data.inflows) {
        const inflowEntries = Object.entries(data.inflows as Record<string, number>).map(([name, amount]) => ({
            name: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            amount,
            type: 'Inflow'
        }));
        const outflowEntries = Object.entries(data.outflows as Record<string, number>).map(([name, amount]) => ({
            name: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            amount,
            type: 'Outflow'
        }));
        const chartData = [...inflowEntries, ...outflowEntries].sort((a, b) => b.amount - a.amount);

        return (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <BarChart2 size={20} className="text-blue-600"/>
                            Cash Flow Breakdown
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">Detailed inflow and outflow analysis</p>
                    </div>
                </div>
                <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} layout="vertical" margin={{ top: 20, right: 30, left: 100, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" />
                            <XAxis 
                                type="number" 
                                tick={{ fontSize: 12, fill: '#6b7280' }}
                                tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                            />
                            <YAxis 
                                dataKey="name" 
                                type="category" 
                                width={90}
                                tick={{ fontSize: 11, fill: '#6b7280' }}
                            />
                            <Tooltip 
                                contentStyle={{ 
                                    borderRadius: '8px', 
                                    border: '1px solid #e5e7eb', 
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                    backgroundColor: 'white'
                                }}
                                formatter={(value: any) => `${Number(value).toLocaleString()} RWF`}
                            />
                            <Legend />
                            <Bar dataKey="amount" radius={[0, 8, 8, 0]}>
                                {chartData.map((entry, index) => (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={entry.type === 'Inflow' ? '#10b981' : '#ef4444'} 
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        );
    }

    return null;
  };

  const renderTable = () => {
    if (activeReport === 'SHARE_OUT' && data && typeof data === 'object' && 'members' in data && Array.isArray(data.members)) {
        const shareOutData = data as { members: any[]; summary?: any };
        return (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-sm">
                        <thead className="bg-gradient-to-r from-slate-800 to-slate-900 text-white">
                            <tr>
                                <th className="p-4 text-left font-bold uppercase text-xs tracking-wide sticky left-0 bg-slate-900 z-10">Member</th>
                                <th className="p-4 text-right font-bold uppercase text-xs tracking-wide">Shares</th>
                                <th className="p-4 text-right font-bold uppercase text-xs tracking-wide">Invested</th>
                                <th className="p-4 text-right font-bold uppercase text-xs tracking-wide">Profit</th>
                                <th className="p-4 text-right font-bold uppercase text-xs tracking-wide bg-blue-600">Total Payout</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {shareOutData.members.map((m: any, i: number) => (
                                <tr key={i} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="p-4 font-bold text-gray-900 sticky left-0 bg-white group-hover:bg-blue-50/30 z-10">
                                        {m.name}
                                    </td>
                                    <td className="p-4 text-right text-gray-700">{m.shares}</td>
                                    <td className="p-4 text-right text-gray-600">{m.invested.toLocaleString()} <span className="text-xs text-gray-400">RWF</span></td>
                                    <td className={`p-4 text-right font-semibold ${m.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {m.profit >= 0 ? '+' : ''}{Math.round(m.profit).toLocaleString()} <span className="text-xs">RWF</span>
                                    </td>
                                    <td className="p-4 text-right font-bold text-gray-900 bg-blue-50">
                                        {Math.round(m.currentValue).toLocaleString()} <span className="text-xs text-gray-500 font-normal">RWF</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        {shareOutData.summary && (
                            <tfoot className="bg-gradient-to-r from-gray-50 to-gray-100 border-t-2 border-gray-300">
                                <tr>
                                    <td colSpan={4} className="p-4 text-right font-bold text-gray-700 uppercase text-xs">Total Distributable</td>
                                    <td className="p-4 text-right font-bold text-lg text-gray-900 bg-blue-100">
                                        {shareOutData.summary.cashOnHand?.toLocaleString() || shareOutData.summary.netWorth?.toLocaleString() || 0} <span className="text-sm font-normal">RWF</span>
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
        );
    }

    if (Array.isArray(data)) {
        if (data.length === 0) {
            return (
                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
                    <FileText size={48} className="mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium text-gray-500">{labels.noData}</p>
                    <p className="text-sm text-gray-400 mt-2">No data available for the selected filters</p>
                </div>
            );
        }
        
        const cols = Object.keys(data[0]).filter(k => k !== 'id');
        return (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-sm">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                            <tr>
                                {cols.map((key, idx) => (
                                    <th 
                                        key={key} 
                                        className={`p-4 text-left font-bold text-gray-700 uppercase text-xs tracking-wide whitespace-nowrap ${
                                            idx === 0 ? 'sticky left-0 bg-gradient-to-r from-gray-50 to-gray-100 z-10' : ''
                                        }`}
                                    >
                                        {key.replace(/([A-Z])/g, ' $1').trim().replace(/^./, str => str.toUpperCase())}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {data.map((row: any, idx: number) => (
                                <tr 
                                    key={row.id || idx} 
                                    className="hover:bg-blue-50/50 transition-colors group"
                                >
                                    {cols.map((key: any, colIdx: number) => {
                                        const value = row[key];
                                        const isNumber = typeof value === 'number';
                                        const isAmount = isNumber && (key.toLowerCase().includes('amount') || 
                                            key.toLowerCase().includes('savings') || 
                                            key.toLowerCase().includes('balance') ||
                                            key.toLowerCase().includes('principal') ||
                                            key.toLowerCase().includes('repayable') ||
                                            key.toLowerCase().includes('invested') ||
                                            key.toLowerCase().includes('profit') ||
                                            key.toLowerCase().includes('payout'));
                                        const isStatus = key.toLowerCase() === 'status';
                                        
                                        return (
                                            <td 
                                                key={key} 
                                                className={`p-4 text-gray-700 whitespace-nowrap ${
                                                    colIdx === 0 ? 'sticky left-0 bg-white group-hover:bg-blue-50/50 z-10 font-medium' : ''
                                                } ${
                                                    isAmount ? 'text-right font-semibold' : ''
                                                }`}
                                            >
                                                {isAmount ? (
                                                    <span className="text-gray-900">{value.toLocaleString()} <span className="text-gray-500 text-xs">RWF</span></span>
                                                ) : isStatus ? (
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                                                        value === 'ACTIVE' || value === 'PAID' ? 'bg-green-100 text-green-700' :
                                                        value === 'PENDING' || value === 'APPROVED' ? 'bg-blue-100 text-blue-700' :
                                                        value === 'DEFAULTED' || value === 'UNPAID' ? 'bg-red-100 text-red-700' :
                                                        value === 'CLEARED' ? 'bg-gray-100 text-gray-700' :
                                                        'bg-gray-100 text-gray-600'
                                                    }`}>
                                                        {value}
                                                    </span>
                                                ) : isNumber ? (
                                                    value.toLocaleString()
                                                ) : (
                                                    value || '-'
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }
    return null;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-100px)] print:h-auto print:block relative">
      
      {/* Toast Notification */}
      {successMessage && (
        <div className="absolute top-0 right-0 left-0 z-50 p-4 flex justify-center animate-in fade-in slide-in-from-top-4 duration-500 pointer-events-none">
            <div className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-3">
                <CheckCircle size={24} />
                <span className="font-bold">{successMessage}</span>
            </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-gray-50 to-white">
           <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {REPORT_CONFIGS.find(r => r.id === activeReport)?.icon && (
                  <div className="p-2 bg-blue-100 rounded-lg">
                    {React.createElement(REPORT_CONFIGS.find(r => r.id === activeReport)!.icon, { 
                      size: 24, 
                      className: "text-blue-600" 
                    })}
                  </div>
                )}
                <div>
                  {/* @ts-ignore */}
                  <h2 className="text-2xl font-bold text-gray-900">{labels[REPORT_CONFIGS.find(r => r.id === activeReport)?.titleKey] || activeReport}</h2>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-sm text-gray-600">{group?.name}</p>
                    <span className="text-gray-300">•</span>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock size={12} />
                      <span>Updated {lastUpdated.toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              </div>
           </div>
           <div className="flex gap-2 flex-wrap">
              <button 
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  autoRefresh 
                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title={autoRefresh ? 'Auto-refresh enabled (30s)' : 'Enable auto-refresh'}
              >
                <Activity size={16} className={`mr-2 ${autoRefresh ? 'animate-pulse' : ''}`} />
                Auto
              </button>
              <button 
                onClick={fetchReportData} 
                disabled={loading}
                className="flex items-center px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium disabled:opacity-50 transition-colors"
                title="Refresh data"
              >
                <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button onClick={exportCSV} disabled={!data || loading} className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium disabled:opacity-50 transition-colors shadow-sm">
                 <Download size={16} className="mr-2" /> CSV
              </button>
              <button onClick={handlePrint} disabled={!data || loading} className="flex items-center px-4 py-2 bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-lg hover:from-slate-800 hover:to-slate-900 text-sm font-medium disabled:opacity-50 shadow-md transition-all">
                 <Printer size={16} className="mr-2" /> PDF
              </button>
           </div>
        </div>
        
        {/* Scrollable Report Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-white custom-scrollbar print:overflow-visible">
           {loading ? (
              <div className="space-y-4">
                 <Skeleton className="h-32 w-full rounded-xl" />
                 <Skeleton className="h-64 w-full rounded-xl" />
                 {[1,2,3].map(i => <TableRowSkeleton key={i} />)}
              </div>
           ) : (
              <div className="animate-in fade-in duration-300">
                 {renderSummaryCards()}
                 {renderCharts()}
                 {renderTable()}
              </div>
           )}
        </div>
      </div>

      {/* Sidebar Report Selector */}
      <div className="w-full lg:w-80 flex-shrink-0 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col print:hidden">
         <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
               <FileText size={20} className="text-blue-600"/>
               {labels.reportTypes}
            </h3>
            <p className="text-xs text-gray-600 mt-1">Select a report to view</p>
         </div>
         <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar bg-gray-50/50">
            {REPORT_CONFIGS.map(report => {
               const isActive = activeReport === report.id;
               return (
                  <button
                     key={report.id}
                     onClick={() => setActiveReport(report.id)}
                     className={`w-full flex items-start p-4 rounded-xl text-left transition-all ${
                        isActive 
                        ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-900 border-2 border-blue-300 shadow-md transform scale-[1.02]' 
                        : 'text-gray-700 hover:bg-white border-2 border-transparent hover:border-gray-200 hover:shadow-sm'
                     }`}
                  >
                     <div className={`p-2.5 rounded-lg mr-3 flex-shrink-0 ${
                        isActive ? 'bg-blue-200 text-blue-800 shadow-sm' : 'bg-gray-100 text-gray-500'
                     }`}>
                        <report.icon size={20} />
                     </div>
                     <div className="flex-1 min-w-0">
                        {/* @ts-ignore */}
                        <p className={`font-bold text-sm mb-1 ${isActive ? 'text-blue-900' : 'text-gray-900'}`}>
                           {labels[report.titleKey] || report.id}
                        </p>
                        {/* @ts-ignore */}
                        <p className={`text-[10px] uppercase tracking-wide font-bold mb-1 ${
                           isActive ? 'text-blue-700' : 'text-gray-500'
                        }`}>
                           {report.categoryKey === 'financial' ? 'Financial' : 
                            report.categoryKey === 'operational' ? 'Operational' : 'End of Cycle'}
                        </p>
                        {report.description && (
                           <p className={`text-[11px] leading-tight ${isActive ? 'text-blue-800' : 'text-gray-600'}`}>
                              {report.description}
                           </p>
                        )}
                     </div>
                     {isActive && (
                        <ChevronRight size={18} className="ml-2 text-blue-600 flex-shrink-0" />
                     )}
                  </button>
               );
            })}
         </div>
         
         {/* Filters Panel */}
         <div className="p-4 border-t border-gray-200 bg-gradient-to-b from-gray-50 to-white space-y-4">
            <div className="flex items-center justify-between">
               <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                  <Filter size={14} className="text-blue-600" /> Filters
               </h4>
               <button
                  onClick={() => {
                     setFilters({
                        startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
                        endDate: new Date().toISOString().split('T')[0],
                        memberId: '',
                        status: 'ALL'
                     });
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
               >
                  Reset
               </button>
            </div>
            
            {/* Date Range Filter */}
            {['CASH_FLOW', 'EXPENSE_REPORT', 'ATTENDANCE_REGISTER', 'FINE_REPORT'].includes(activeReport) && (
               <>
                  <div>
                     <label className="block text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                        <Calendar size={12} />
                        Start Date
                     </label>
                     <input 
                        type="date" 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        value={filters.startDate}
                        onChange={e => setFilters({...filters, startDate: e.target.value})}
                     />
                  </div>
                  <div>
                     <label className="block text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                        <Calendar size={12} />
                        End Date
                     </label>
                     <input 
                        type="date" 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        value={filters.endDate}
                        onChange={e => setFilters({...filters, endDate: e.target.value})}
                     />
                  </div>
               </>
            )}
            
            {/* Member Filter */}
            {['SAVINGS_SUMMARY', 'LOAN_PORTFOLIO', 'MEMBER_FINANCIAL_SUMMARY'].includes(activeReport) && (
               <div>
                  <MemberSearchSelect
                    members={members}
                    selectedMemberId={filters.memberId || ''}
                    onSelect={(memberId) => setFilters({...filters, memberId: memberId || ''})}
                    onClear={() => setFilters({...filters, memberId: ''})}
                    label={labels.members}
                    placeholder="Search members..."
                    showAllOption={true}
                    allOptionLabel="All Members"
                    className="text-xs"
                  />
               </div>
            )}
            
            {/* Quick Date Presets */}
            {['CASH_FLOW', 'EXPENSE_REPORT', 'ATTENDANCE_REGISTER', 'FINE_REPORT'].includes(activeReport) && (
               <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">Quick Filters</label>
                  <div className="grid grid-cols-2 gap-2">
                     <button
                        onClick={() => {
                           const today = new Date();
                           setFilters({
                              ...filters,
                              startDate: new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0],
                              endDate: today.toISOString().split('T')[0]
                           });
                        }}
                        className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                     >
                        This Month
                     </button>
                     <button
                        onClick={() => {
                           const today = new Date();
                           const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                           const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
                           setFilters({
                              ...filters,
                              startDate: lastMonth.toISOString().split('T')[0],
                              endDate: lastMonthEnd.toISOString().split('T')[0]
                           });
                        }}
                        className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                     >
                        Last Month
                     </button>
                     <button
                        onClick={() => {
                           const today = new Date();
                           setFilters({
                              ...filters,
                              startDate: new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0],
                              endDate: today.toISOString().split('T')[0]
                           });
                        }}
                        className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                     >
                        This Year
                     </button>
                     <button
                        onClick={() => {
                           const today = new Date();
                           const lastWeek = new Date(today);
                           lastWeek.setDate(today.getDate() - 7);
                           setFilters({
                              ...filters,
                              startDate: lastWeek.toISOString().split('T')[0],
                              endDate: today.toISOString().split('T')[0]
                           });
                        }}
                        className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                     >
                        Last 7 Days
                     </button>
                  </div>
               </div>
            )}
         </div>
      </div>
    </div>
  );
}
