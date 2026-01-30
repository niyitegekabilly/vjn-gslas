import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../App';
import { api } from '../api/client';
import { LABELS } from '../constants';
import { Meeting, AttendanceStatus, Attendance as AttendanceType } from '../types';
import { CalendarCheck, Plus, Search, Edit, X, Loader2, Calendar, Users, CheckCircle, XCircle, Clock, AlertCircle, Eye } from 'lucide-react';
import { TableRowSkeleton } from '../components/Skeleton';
import { Member } from '../types';

export default function Attendance() {
  const { activeGroupId, lang } = useContext(AppContext);
  const labels = LABELS[lang];

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceType[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [editingRecord, setEditingRecord] = useState<AttendanceType | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

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

  const handleViewDetails = async (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setSelectedMeetingId(meeting.id);
    setIsDetailsOpen(true);
    setLoadingDetails(true);
    
    try {
      // Fetch members if not already loaded
      if (members.length === 0 && activeGroupId) {
        const mems = await api.getMembers(activeGroupId);
        setMembers(mems);
      }
    } catch (e) {
      console.error('Failed to load members:', e);
    } finally {
      setLoadingDetails(false);
    }
  };

  const getAttendanceStats = (meetingId: string) => {
    const records = attendanceRecords.filter(r => r.meetingId === meetingId);
    const total = records.length;
    const present = records.filter(r => r.status === AttendanceStatus.PRESENT).length;
    const absent = records.filter(r => r.status === AttendanceStatus.ABSENT).length;
    const late = records.filter(r => r.status === AttendanceStatus.LATE).length;
    const excused = records.filter(r => r.status === AttendanceStatus.EXCUSED).length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    return { total, present, absent, late, excused, rate };
  };

  const getMemberName = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    return member?.fullName || 'Unknown Member';
  };

  const getStatusBadge = (status: AttendanceStatus) => {
    const configs = {
      [AttendanceStatus.PRESENT]: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, label: 'Present' },
      [AttendanceStatus.ABSENT]: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle, label: 'Absent' },
      [AttendanceStatus.LATE]: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock, label: 'Late' },
      [AttendanceStatus.EXCUSED]: { bg: 'bg-blue-100', text: 'text-blue-800', icon: AlertCircle, label: 'Excused' },
    };
    const config = configs[status] || configs[AttendanceStatus.ABSENT];
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold ${config.bg} ${config.text}`}>
        <Icon size={12} />
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <CalendarCheck className="mr-3 text-blue-600" /> {labels.attendanceManagement}
        </h2>
        <button 
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 shadow-sm"
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
            <div className="overflow-x-auto">
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
                                    <button 
                                      onClick={() => handleViewDetails(m)}
                                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                      <Eye size={14} />
                                      View Details
                                    </button>
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

      {/* Create Modal */}
      {isCreateOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in zoom-in-95">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
               <div className="flex justify-between mb-4">
                  <h3 className="font-bold text-lg">{labels.scheduleNewMeeting}</h3>
                  <button onClick={() => setIsCreateOpen(false)}><X className="text-gray-400" /></button>
               </div>
               <form onSubmit={handleCreateMeeting} className="space-y-4">
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
                  <div className="pt-2 flex gap-3">
                     <button type="button" onClick={() => setIsCreateOpen(false)} className="flex-1 py-2 border rounded-lg">{labels.cancel}</button>
                     <button type="submit" disabled={submitting} className="flex-1 py-2 bg-slate-800 text-white rounded-lg font-bold flex justify-center items-center">
                        {submitting ? <Loader2 className="animate-spin" size={18}/> : labels.save}
                     </button>
                  </div>
               </form>
            </div>
         </div>
      )}

      {/* Meeting Details Modal */}
      {isDetailsOpen && selectedMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in zoom-in-95">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                    <CalendarCheck className="text-blue-600" size={24} />
                    Meeting Details
                  </h3>
                  <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                    <Calendar size={14} />
                    {selectedMeeting.date}
                  </p>
                </div>
                <button 
                  onClick={() => setIsDetailsOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              {/* Meeting Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">Meeting Type</p>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">{selectedMeeting.type}</span>
                </div>
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">Created By</p>
                  <p className="text-sm font-medium text-gray-900">{selectedMeeting.createdBy || 'System'}</p>
                </div>
                {selectedMeeting.notes && (
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Notes</p>
                    <p className="text-sm text-gray-700 line-clamp-2">{selectedMeeting.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Statistics Summary */}
            {(() => {
              const stats = getAttendanceStats(selectedMeeting.id);
              return (
                <div className="p-6 border-b border-gray-200 bg-gray-50">
                  <h4 className="text-sm font-bold text-gray-700 uppercase mb-3">Attendance Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="bg-white rounded-lg p-3 border border-gray-200 text-center">
                      <p className="text-xs font-bold text-gray-500 uppercase mb-1">Total</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 border border-green-200 text-center">
                      <p className="text-xs font-bold text-green-700 uppercase mb-1">Present</p>
                      <p className="text-2xl font-bold text-green-700">{stats.present}</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3 border border-red-200 text-center">
                      <p className="text-xs font-bold text-red-700 uppercase mb-1">Absent</p>
                      <p className="text-2xl font-bold text-red-700">{stats.absent}</p>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200 text-center">
                      <p className="text-xs font-bold text-yellow-700 uppercase mb-1">Late</p>
                      <p className="text-2xl font-bold text-yellow-700">{stats.late}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 text-center">
                      <p className="text-xs font-bold text-blue-700 uppercase mb-1">Rate</p>
                      <p className="text-2xl font-bold text-blue-700">{stats.rate}%</p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Attendance Records Table */}
            <div className="flex-1 overflow-y-auto p-6">
              <h4 className="text-sm font-bold text-gray-700 uppercase mb-4 flex items-center gap-2">
                <Users size={16} />
                Attendance Records ({attendanceRecords.filter(r => r.meetingId === selectedMeeting.id).length})
              </h4>
              
              {loadingDetails ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => <TableRowSkeleton key={i} />)}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 text-gray-600 font-bold uppercase text-xs border-b border-gray-200">
                      <tr>
                        <th className="p-3 text-left">Member</th>
                        <th className="p-3 text-left">Status</th>
                        <th className="p-3 text-left">Recorded By</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {attendanceRecords
                        .filter(r => r.meetingId === selectedMeeting.id)
                        .length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-gray-500">
                            No attendance records found for this meeting
                          </td>
                        </tr>
                      ) : (
                        attendanceRecords
                          .filter(r => r.meetingId === selectedMeeting.id)
                          .map(record => (
                            <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                              <td className="p-3 font-medium text-gray-900">
                                {getMemberName(record.memberId)}
                              </td>
                              <td className="p-3">
                                {getStatusBadge(record.status)}
                              </td>
                              <td className="p-3 text-gray-600 text-sm">
                                {record.recordedBy || 'System'}
                              </td>
                              <td className="p-3 text-right">
                                <button
                                  onClick={() => {
                                    setIsDetailsOpen(false);
                                    openEdit(record);
                                  }}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                  <Edit size={12} />
                                  Edit
                                </button>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                onClick={() => setIsDetailsOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Record Modal */}
      {isEditOpen && editingRecord && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in zoom-in-95">
            <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
               <h3 className="font-bold text-lg mb-4">{labels.correctAttendance}</h3>
               <form onSubmit={handleEditSubmit} className="space-y-4">
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
                  <div className="pt-2 flex gap-3">
                     <button type="button" onClick={() => setIsEditOpen(false)} className="flex-1 py-2 border rounded-lg">{labels.cancel}</button>
                     <button type="submit" disabled={submitting} className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold flex justify-center items-center">
                        {submitting ? <Loader2 className="animate-spin" size={18}/> : labels.save}
                     </button>
                  </div>
               </form>
            </div>
         </div>
      )}
    </div>
  );
}
