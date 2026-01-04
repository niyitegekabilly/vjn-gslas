
import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../App';
import { api } from '../api/client';
import { LABELS } from '../constants';
import { Meeting, Attendance as AttendanceType } from '../types';
import { ClipboardCheck, Plus, Calendar, Clock, Loader2 } from 'lucide-react';
import { TableRowSkeleton } from '../components/Skeleton';
import { useNavigate } from 'react-router-dom';

export default function Attendance() {
  const { activeGroupId, lang } = useContext(AppContext);
  const labels = LABELS[lang];
  const navigate = useNavigate();

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [attendance, setAttendance] = useState<AttendanceType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeGroupId) fetchData();
  }, [activeGroupId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [m, a] = await Promise.all([
        api.getMeetings(activeGroupId),
        api.getAttendance(activeGroupId)
      ]);
      setMeetings(m.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setAttendance(a);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceStats = (meetingId: string) => {
    const records = attendance.filter(a => a.meetingId === meetingId);
    const present = records.filter(a => a.status === 'PRESENT').length;
    const total = records.length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    return { present, total, rate };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <ClipboardCheck className="mr-3 text-blue-600" /> {labels.attendanceManagement}
        </h2>
        <button 
          onClick={() => navigate('/meeting')}
          className="flex items-center px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 shadow-sm transition-colors w-full sm:w-auto justify-center"
        >
          <Plus size={18} className="mr-2" /> {labels.scheduleNewMeeting}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
         <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-bold text-gray-800">Recent Meetings</h3>
         </div>

         {loading ? (
            <div className="p-4 space-y-4">
               {[...Array(5)].map((_, i) => <TableRowSkeleton key={i} />)}
            </div>
         ) : (
            <div className="overflow-x-auto">
               <table className="w-full text-left text-sm">
                  <thead className="bg-white text-gray-500 font-bold uppercase text-xs border-b border-gray-200">
                     <tr>
                        <th className="p-4">{labels.date}</th>
                        <th className="p-4">{labels.type}</th>
                        <th className="p-4">{labels.attendance}</th>
                        <th className="p-4 text-right">Rate</th>
                        <th className="p-4 text-right">{labels.actions}</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                       {meetings.length === 0 ? (
                          <tr><td colSpan={5} className="p-8 text-center text-gray-500">{labels.noData}</td></tr>
                       ) : (
                          meetings.map(m => {
                             const stats = getAttendanceStats(m.id);
                             // @ts-ignore
                             const typeLabel = labels[m.type.toLowerCase()] || m.type;
                             return (
                                <tr key={m.id} className="hover:bg-gray-50">
                                   <td className="p-4 font-medium text-gray-900 flex items-center">
                                      <Calendar size={16} className="mr-2 text-gray-400" />
                                      {m.date}
                                   </td>
                                   <td className="p-4">
                                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">{typeLabel}</span>
                                   </td>
                                   <td className="p-4 text-gray-600">
                                      {stats.present} / {stats.total}
                                   </td>
                                   <td className="p-4 text-right">
                                      <div className="flex items-center justify-end gap-2">
                                         <div className="w-24 bg-gray-200 rounded-full h-2">
                                            <div className="bg-green-500 h-2 rounded-full" style={{ width: `${stats.rate}%` }}></div>
                                         </div>
                                         <span className="text-xs font-bold">{stats.rate}%</span>
                                      </div>
                                   </td>
                                   <td className="p-4 text-right">
                                      <button className="text-blue-600 hover:underline text-xs font-medium">{labels.viewDetails}</button>
                                   </td>
                                </tr>
                             );
                          })
                       )}
                  </tbody>
               </table>
            </div>
         )}
      </div>
    </div>
  );
}
