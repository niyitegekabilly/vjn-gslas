
import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../App';
import { api } from '../api/client';
import { LABELS } from '../constants';
import { Meeting, AttendanceStatus, Attendance as AttendanceType } from '../types';
import { CalendarCheck, Plus, Search, Edit, X, Loader2, Calendar } from 'lucide-react';
import { TableRowSkeleton } from '../components/Skeleton';

export default function Attendance() {
  const { activeGroupId, lang } = useContext(AppContext);
  const labels = LABELS[lang];

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceType[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [editingRecord, setEditingRecord] = useState<AttendanceType | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Forms
  const [newMeetingData, setNewMeetingData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'REGULAR',
    notes: ''
  });

  const [editForm, setEditForm] = useState({
    status: AttendanceStatus.PRESENT,
    reason: ''
  });

  useEffect(() => {
    if (activeGroupId) fetchData();
  }, [activeGroupId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mtgs, att] = await Promise.all([
        api.getMeetings(activeGroupId),
        api.getAttendance(activeGroupId)
      ]);
      setMeetings(mtgs.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setAttendanceRecords(att);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createMeeting(activeGroupId, { ...newMeetingData, createdBy: 'Admin' });
      setIsCreateOpen(false);
      setNewMeetingData({
        date: new Date().toISOString().split('T')[0],
        type: 'REGULAR',
        notes: ''
      });
      fetchData();
    } catch (e) {
      console.error(e);
      alert("Failed to create meeting");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    setSubmitting(true);
    try {
      await api.updateAttendance(editingRecord.id, { status: editForm.status }, 'Admin', editForm.reason);
      setIsEditOpen(false);
      fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (record: AttendanceType) => {
    setEditingRecord(record);
    setEditForm({
      status: record.status,
      reason: ''
    });
    setIsEditOpen(true);
  };

  const getAttendanceStats = (meetingId: string) => {
    const records = attendanceRecords.filter(r => r.meetingId === meetingId);
    const total = records.length;
    const present = records.filter(r => r.status === AttendanceStatus.PRESENT).length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    return { total, present, rate };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <CalendarCheck className="mr-3 text-blue-600" /> {labels.attendanceManagement}
        </h2>
        <button 
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 shadow-sm w-full sm:w-auto justify-center"
        >
          <Plus size={18} className="mr-2" /> {labels.scheduleNewMeeting}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
         <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-bold text-gray-700">Meeting History</h3>
         </div>
         
         {loading ? (
            <div className="p-4 space-y-4">
               {[...Array(5)].map((_, i) => <TableRowSkeleton key={i} />)}
            </div>
         ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                 <table className="w-full text-left text-sm">
                    <thead className="bg-white text-gray-500 font-bold uppercase text-xs border-b border-gray-200">
                       <tr>
                          <th className="p-4">{labels.date}</th>
                          <th className="p-4">{labels.type}</th>
                          <th className="p-4">Stats (Present/Total)</th>
                          <th className="p-4 text-right">Attendance Rate</th>
                          <th className="p-4 text-right">{labels.actions}</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                       {meetings.length === 0 ? (
                          <tr><td colSpan={5} className="p-8 text-center text-gray-500">{labels.noData}</td></tr>
                       ) : (
                          meetings.map(m => {
                             const stats = getAttendanceStats(m.id);
                             return (
                                <tr key={m.id} className="hover:bg-gray-50">
                                   <td className="p-4 font-medium text-gray-900 flex items-center">
                                      <Calendar size={16} className="mr-2 text-gray-400" />
                                      {m.date}
                                   </td>
                                   <td className="p-4">
                                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">{m.type}</span>
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
                                      {/* Action to view details or edit would go here */}
                                      <button className="text-blue-600 hover:underline text-xs">View Details</button>
                                   </td>
                                </tr>
                             );
                          })
                       )}
                    </tbody>
                 </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-gray-100">
                 {meetings.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">{labels.noData}</div>
                 ) : (
                    meetings.map(m => {
                       const stats = getAttendanceStats(m.id);
                       return (
                          <div key={m.id} className="p-4">
                             <div className="flex justify-between items-start mb-2">
                                <div>
                                   <p className="font-bold text-gray-900 flex items-center">
                                      <Calendar size={16} className="mr-2 text-gray-500" />
                                      {m.date}
                                   </p>
                                   <span className="inline-block mt-1 bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[10px] font-bold">{m.type}</span>
                                </div>
                                <button className="text-blue-600 text-xs font-bold bg-blue-50 px-2 py-1 rounded">Details</button>
                             </div>
                             
                             <div className="mt-3">
                                <div className="flex justify-between text-xs text-gray-500 mb-1">
                                   <span>Attendance</span>
                                   <span className="font-bold text-gray-900">{stats.present}/{stats.total} ({stats.rate}%)</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                   <div className="bg-green-500 h-2 rounded-full" style={{ width: `${stats.rate}%` }}></div>
                                </div>
                             </div>
                          </div>
                       );
                    })
                 )}
              </div>
            </>
         )}
      </div>

      {/* Create Modal */}
      {isCreateOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden">
               <div className="flex justify-between items-center p-6 border-b border-gray-100 flex-none bg-white">
                  <h3 className="font-bold text-lg">{labels.scheduleNewMeeting}</h3>
                  <button onClick={() => setIsCreateOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="text-gray-400" /></button>
               </div>
               
               <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                  <form id="create-meeting-form" onSubmit={handleCreateMeeting} className="space-y-4">
                      <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">{labels.date}</label>
                         <input 
                            type="date"
                            required
                            value={newMeetingData.date}
                            onChange={e => setNewMeetingData({...newMeetingData, date: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                         />
                      </div>
                      <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">{labels.type}</label>
                         <select 
                            value={newMeetingData.type}
                            onChange={e => setNewMeetingData({...newMeetingData, type: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                         >
                            <option value="REGULAR">{labels.regularWeekly}</option>
                            <option value="SPECIAL">{labels.specialEvent}</option>
                            <option value="EMERGENCY">{labels.emergency}</option>
                         </select>
                      </div>
                      <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">{labels.notes}</label>
                         <textarea 
                            rows={3}
                            value={newMeetingData.notes}
                            onChange={e => setNewMeetingData({...newMeetingData, notes: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                         />
                      </div>
                  </form>
               </div>

               <div className="p-4 border-t border-gray-100 bg-gray-50 flex-none flex gap-3">
                  <button type="button" onClick={() => setIsCreateOpen(false)} className="flex-1 py-2 border rounded-lg text-gray-700 font-medium hover:bg-gray-50">{labels.cancel}</button>
                  <button type="submit" form="create-meeting-form" disabled={submitting} className="flex-1 py-2 bg-slate-800 text-white rounded-lg font-bold flex justify-center items-center shadow-sm">
                     {submitting ? <Loader2 className="animate-spin" size={18}/> : labels.save}
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* Edit Record Modal */}
      {isEditOpen && editingRecord && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-white rounded-xl shadow-xl max-w-sm w-full max-h-[90vh] flex flex-col overflow-hidden">
               <div className="flex justify-between items-center p-6 border-b border-gray-100 flex-none bg-white">
                  <h3 className="font-bold text-lg">{labels.correctAttendance}</h3>
                  <button onClick={() => setIsEditOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
               </div>
               
               <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                  <form id="edit-attendance-form" onSubmit={handleEditSubmit} className="space-y-4">
                      <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">{labels.status}</label>
                         <select 
                            value={editForm.status}
                            onChange={e => setEditForm({...editForm, status: e.target.value as AttendanceStatus})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                         >
                            {Object.values(AttendanceStatus).map(s => <option key={s} value={s}>{s}</option>)}
                         </select>
                      </div>
                      <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">{labels.reason} <span className="text-red-500">*</span></label>
                         <textarea 
                            required
                            value={editForm.reason}
                            onChange={e => setEditForm({...editForm, reason: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                         />
                      </div>
                  </form>
               </div>

               <div className="p-4 border-t border-gray-100 bg-gray-50 flex-none flex gap-3">
                  <button type="button" onClick={() => setIsEditOpen(false)} className="flex-1 py-2 border rounded-lg text-gray-700 font-medium hover:bg-gray-50">{labels.cancel}</button>
                  <button type="submit" form="edit-attendance-form" disabled={submitting} className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold flex justify-center items-center shadow-sm">
                     {submitting ? <Loader2 className="animate-spin" size={18}/> : labels.save}
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
