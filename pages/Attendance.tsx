import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../App';
import { api } from '../api/client';
import { LABELS } from '../constants';
import { Attendance as AttendanceType, Member } from '../types';
import { ClipboardCheck, Calendar, Loader2 } from 'lucide-react';

export default function Attendance() {
  const { activeGroupId, lang } = useContext(AppContext);
  const labels = LABELS[lang];
  const [attendance, setAttendance] = useState<AttendanceType[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeGroupId) return;
    setLoading(true);
    Promise.all([
      api.getAttendance(activeGroupId),
      api.getMembers(activeGroupId)
    ]).then(([a, m]) => {
      setAttendance(a.sort((x, y) => new Date(y.date).getTime() - new Date(x.date).getTime()));
      setMembers(m);
      setLoading(false);
    });
  }, [activeGroupId]);

  const getMemberName = (id: string) => members.find(m => m.id === id)?.fullName || 'Unknown';

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-gray-400" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">{labels.attendance} History</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="p-4">{labels.date}</th>
              <th className="p-4">Member</th>
              <th className="p-4">{labels.status}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {attendance.length === 0 ? (
               <tr><td colSpan={3} className="p-8 text-center text-gray-500">{labels.noData}</td></tr>
            ) : (
              attendance.map(a => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="p-4 text-gray-500 flex items-center">
                    <Calendar size={14} className="mr-2" /> {a.date}
                  </td>
                  <td className="p-4 font-medium text-gray-900">{getMemberName(a.memberId)}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      a.status === 'PRESENT' ? 'bg-green-100 text-green-800' : 
                      a.status === 'ABSENT' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                       {a.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}