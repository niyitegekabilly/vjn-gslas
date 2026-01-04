
import React, { useContext, useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { AppContext } from '../App';
import { api } from '../api/client';
import { LABELS } from '../constants';
import { Member, Cycle } from '../types';
import { 
  FileText, Download, Printer, Filter, Calendar, Users, 
  BarChart2, PieChart, TrendingUp, AlertCircle, Loader2, 
  ChevronRight, Lock, Wallet, ArrowUpRight, ArrowDownRight, LayoutTemplate, CheckCircle
} from 'lucide-react';
import { Skeleton, TableRowSkeleton } from '../components/Skeleton';
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

  // Filters
  const [filters, setFilters] = useState({
    startDate: '',
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
        const totalIn = Object.values(data.inflows as Record<string, number>).reduce((a,b) => a+b, 0);
        const totalOut = Object.values(data.outflows as Record<string, number>).reduce((a,b) => a+b, 0);
        return (
            <div className="grid grid-cols-3 gap-6 mb-8 print:grid-cols-3">
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex flex-col">
                    <span className="text-xs font-bold text-emerald-600 uppercase mb-1">{labels.totalInflow}</span>
                    <span className="text-2xl font-bold text-emerald-900 flex items-center">
                        <ArrowUpRight size={20} className="mr-1"/> {totalIn.toLocaleString()}
                    </span>
                </div>
                <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex flex-col">
                    <span className="text-xs font-bold text-red-600 uppercase mb-1">{labels.totalOutflow}</span>
                    <span className="text-2xl font-bold text-red-900 flex items-center">
                        <ArrowDownRight size={20} className="mr-1"/> {totalOut.toLocaleString()}
                    </span>
                </div>
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col">
                    <span className="text-xs font-bold text-blue-600 uppercase mb-1">{labels.netPosition}</span>
                    <span className="text-2xl font-bold text-blue-900">{data.netCash.toLocaleString()}</span>
                </div>
            </div>
        );
    }

    if (activeReport === 'SHARE_OUT' && data.summary) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 print:grid-cols-4">
                <div className="bg-slate-900 text-white p-4 rounded-xl">
                    <span className="text-xs text-slate-400 uppercase">{labels.netWorth}</span>
                    <p className="text-2xl font-bold">{data.summary.netWorth.toLocaleString()}</p>
                </div>
                <div className="bg-white border border-gray-200 p-4 rounded-xl">
                    <span className="text-xs text-gray-500 uppercase">{labels.valuePerShare}</span>
                    <p className="text-2xl font-bold text-green-600">{Math.round(data.summary.valuePerShare).toLocaleString()}</p>
                </div>
                <div className="bg-white border border-gray-200 p-4 rounded-xl">
                    <span className="text-xs text-gray-500 uppercase">{labels.outstandingLoans}</span>
                    <p className="text-2xl font-bold text-blue-600">{data.summary.outstandingLoans.toLocaleString()}</p>
                </div>
                <div className="bg-white border border-gray-200 p-4 rounded-xl">
                    <span className="text-xs text-gray-500 uppercase">{labels.cashBalance}</span>
                    <p className="text-2xl font-bold text-gray-800">{data.summary.cashOnHand.toLocaleString()}</p>
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

        if (total > 0) {
            return (
                <div className="flex gap-6 mb-8 bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div>
                        <span className="text-xs font-bold text-gray-500 uppercase">{label}</span>
                        <p className="text-2xl font-bold text-gray-900">{total.toLocaleString()} <span className="text-sm font-normal text-gray-500">{labels.currency}</span></p>
                    </div>
                    <div className="pl-6 border-l border-gray-300">
                        <span className="text-xs font-bold text-gray-500 uppercase">Records</span>
                        <p className="text-2xl font-bold text-gray-900">{count}</p>
                    </div>
                </div>
            );
        }
    }
    return null;
  };

  const renderCharts = () => {
    if (!data) return null;

    // 1. Savings Distribution (Bar Chart of Top 10)
    if (activeReport === 'SAVINGS_SUMMARY' && Array.isArray(data)) {
        const chartData = [...data].sort((a,b) => b["Total Savings"] - a["Total Savings"]).slice(0, 10);
        return (
            <div className="h-64 mb-8 print:h-48">
                <h3 className="text-sm font-bold text-gray-500 uppercase mb-4">{labels.topSavers}</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="Member Name" hide />
                        <YAxis />
                        <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            formatter={(value: any) => [`${value.toLocaleString()} RWF`, 'Savings']}
                        />
                        <Bar dataKey="Total Savings" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        );
    }

    // 2. Loan Status (Pie Chart)
    if (activeReport === 'LOAN_PORTFOLIO' && Array.isArray(data)) {
        const statusCounts = data.reduce((acc: any, curr: any) => {
            const s = curr["Status"] || 'Unknown';
            acc[s] = (acc[s] || 0) + 1;
            return acc;
        }, {});
        const chartData = Object.keys(statusCounts).map(k => ({ name: k, value: statusCounts[k] }));

        return (
            <div className="h-64 mb-8 print:h-48 flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1 w-full h-full">
                    <h3 className="text-sm font-bold text-gray-500 uppercase mb-2 text-center">{labels.portfolioHealth}</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <RePieChart>
                            <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" paddingAngle={5} dataKey="value">
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </RePieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        );
    }

    // 3. Cash Flow (Simple Bar)
    if (activeReport === 'CASH_FLOW' && data.inflows) {
        const chartData = [
            { name: 'Inflow', amount: Object.values(data.inflows as Record<string, number>).reduce((a,b) => a+b, 0) },
            { name: 'Outflow', amount: Object.values(data.outflows as Record<string, number>).reduce((a,b) => a+b, 0) },
        ];
        return (
            <div className="h-64 mb-8 print:h-48">
                <h3 className="text-sm font-bold text-gray-500 uppercase mb-4">{labels.flowComparison}</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" />
                        <Tooltip formatter={(value: any) => `${value.toLocaleString()} RWF`} />
                        <Bar dataKey="amount" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.name === 'Inflow' ? '#10b981' : '#ef4444'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        );
    }

    return null;
  };

  const renderTable = () => {
    if (activeReport === 'SHARE_OUT' && data?.members) {
        return (
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-600 font-bold uppercase text-xs">
                <tr>
                    <th className="p-3 border-b">{labels.members}</th>
                    <th className="p-3 text-right border-b">{labels.shareCount}</th>
                    <th className="p-3 text-right border-b">{labels.invested}</th>
                    <th className="p-3 text-right border-b">{labels.profit}</th>
                    <th className="p-3 text-right border-b">{labels.totalPayout}</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                {data.members.map((m: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-50">
                        <td className="p-3 font-medium text-gray-900">{m.name}</td>
                        <td className="p-3 text-right">{m.shares}</td>
                        <td className="p-3 text-right text-gray-600">{m.invested.toLocaleString()}</td>
                        <td className="p-3 text-right text-green-600 font-medium">+{Math.round(m.profit).toLocaleString()}</td>
                        <td className="p-3 text-right font-bold text-gray-900 bg-gray-50">{Math.round(m.currentValue).toLocaleString()}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        );
    }

    if (Array.isArray(data)) {
        if (data.length === 0) return <div className="p-8 text-center text-gray-400 italic bg-gray-50 rounded-lg">{labels.noData}</div>;
        
        const cols = Object.keys(data[0]).filter(k => k !== 'id');
        return (
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-gray-100 text-gray-600 font-bold uppercase text-xs">
                        <tr>
                            {cols.map(key => (
                                <th key={key} className="p-3 border-b border-gray-200 whitespace-nowrap">
                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {data.map((row: any, idx: number) => (
                            <tr key={row.id || idx} className="hover:bg-gray-50">
                                {cols.map((key: any) => (
                                    <td key={key} className="p-3 text-gray-700 whitespace-nowrap">
                                        {typeof row[key] === 'number' && !key.toLowerCase().includes('rate') ? row[key].toLocaleString() : row[key]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
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
                <span className="font-bold">{successMessage