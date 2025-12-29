import React from 'react';
import { FileText, Download, Printer } from 'lucide-react';

const reports = [
  { id: 1, title: 'Member Savings Summary', desc: 'Total contributions per member for current season.' },
  { id: 2, title: 'Loan Portfolio Report', desc: 'Active loans, overdue analysis, and expected interest.' },
  { id: 3, title: 'Attendance Register', desc: 'Member attendance logs for all meetings.' },
  { id: 4, title: 'Expense & Fine Report', desc: 'Breakdown of operational costs and collected fines.' },
  { id: 5, title: 'End of Cycle Share-out', desc: 'Projected payout per member based on current share value.' },
];

export default function Reports() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">System Reports</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((r) => (
          <div key={r.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-blue-200 transition">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-4">
              <FileText size={24} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{r.title}</h3>
            <p className="text-gray-500 text-sm mb-6">{r.desc}</p>
            
            <div className="flex gap-2">
              <button className="flex-1 flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                <Printer size={16} className="mr-2" />
                Print
              </button>
              <button className="flex-1 flex items-center justify-center px-3 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900">
                <Download size={16} className="mr-2" />
                Export CSV
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-semibold text-yellow-800 mb-1">Audit Note</h4>
        <p className="text-sm text-yellow-700">
          All reports generated here are immutable snapshots. Financial data cannot be deleted after a Season is closed.
        </p>
      </div>
    </div>
  );
}