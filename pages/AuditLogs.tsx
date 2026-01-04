
import React, { useContext } from 'react';
import { ShieldAlert } from 'lucide-react';
import { AppContext } from '../App';
import { LABELS } from '../constants';

export default function AuditLogs() {
  const { lang } = useContext(AppContext);
  const labels = LABELS[lang];

  const logs = [
    { id: 1, action: 'Meeting Data Saved', user: 'Jean Admin', timestamp: '2024-03-05 14:30', details: 'Added 15 records for Group A' },
    { id: 2, action: 'Loan Approved', user: 'Jean Admin', timestamp: '2024-03-04 09:15', details: 'Approved loan #L1 for M. Claire' },
    { id: 3, action: 'System Login', user: 'Jean Admin', timestamp: '2024-03-04 08:00', details: 'IP: 192.168.1.1' },
  ];

  return (
    <div className="space-y-6">
       <h2 className="text-2xl font-bold text-gray-800 flex items-center">
         <ShieldAlert className="mr-3 text-slate-800" /> {labels.auditLogs}
       </h2>
       
       <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 font-medium">
            <tr>
              <th className="p-4">{labels.timestamp}</th>
              <th className="p-4">{labels.userLog}</th>
              <th className="p-4">{labels.actionLog}</th>
              <th className="p-4">{labels.detailsLog}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.map(log => (
              <tr key={log.id}>
                <td className="p-4 text-gray-500 font-mono">{log.timestamp}</td>
                <td className="p-4 font-medium">{log.user}</td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-gray-100 rounded text-xs font-semibold uppercase">{log.action}</span>
                </td>
                <td className="p-4 text-gray-600">{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
       </div>
    </div>
  );
}
