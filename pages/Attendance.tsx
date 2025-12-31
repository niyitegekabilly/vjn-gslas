
import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../App';
import { api } from '../api/client';
import { LABELS } from '../constants';
import { Attendance as AttendanceType, Member, Meeting, AttendanceStatus, MemberStatus, FineCategory } from '../types';
import { ClipboardCheck, Calendar, Loader2, Plus, Users, CheckCircle, XCircle, Clock, AlertTriangle, ChevronRight, Edit, Save, ArrowLeft, History, X, Filter } from 'lucide-react';
import { CardSkeleton, Skeleton } from '../components/Skeleton';

export default function Attendance() {
  const { activeGroupId, lang } = useContext(AppContext);
  const labels = LABELS[lang];
  
  const [view, setView] = useState<'LIST' | 'CREATE_MEETING' | 'RECORD_ATTENDANCE'>('LIST');
  const [loading, setLoading] = useState(true);

  // Data
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [attendance, setAttendance] = useState<AttendanceType[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [fineCategories, setFineCategories] = useState<FineCategory[]>([]);

  // Filter State
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Selection
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);

  // Forms
  const [newMeetingData, setNewMeetingData] = useState({ date: new Date().toISOString().split('T')[0], type: 'REGULAR', notes: '' });
  const [attendanceRecords, setAttendanceRecords] = useState<{ [memberId: string]: { status: AttendanceStatus, notes: string } }>({});
  const [submitting, setSubmitting] = useState(false);

  // Edit Audit
  const [editRecord, setEditRecord] = useState<AttendanceType | null>(null);
  const [editForm, setEditForm] = useState({ status: AttendanceStatus.PRESENT, notes: '', reason: '' });

  const fetchData = () => {
    if (!activeGroupId) return;
    setLoading(true);
    Promise.all([
      api.getMeetings(activeGroupId),
      api.getAttendance(activeGroupId),
      api.getMembers(activeGroupId),
      api.getFineCategories(activeGroupId)
    ]).then(([m, a, mem, fc]) => {
      setMeetings(m.sort((x, y) => new Date(y.date).getTime() - new Date(x.date).getTime()));
      setAttendance(a);
      setMembers(mem.filter(member => member.status === MemberStatus.ACTIVE));
      setFineCategories(fc);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchData();
  }, [activeGroupId]);

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const meeting = await api.createMeeting(activeGroupId, { ...newMeetingData, createdBy: 'CURRENT_USER' });
      // Initialize empty records for UI
      const initRecords: any = {};
      members.forEach(m => {
        initRecords[m.id] = { status: AttendanceStatus.ABSENT, notes: '' };
      });
      setAttendanceRecords(initRecords);
      setSelectedMeeting(meeting);
      setView('RECORD_ATTENDANCE');
    } catch (e: any) { alert(e.message); }
    setSubmitting(false);
  };

  const handleOpenAttendance = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    const meetingRecords = attendance.filter(a => a.meetingId === meeting.id);
    
    const recordMap: any = {};
    members.forEach(m => {
      const existing = meetingRecords.find(r => r.memberId === m.id);
      recordMap[m.id] = existing ? { status: existing.status, notes: existing.notes || '' } : { status: AttendanceStatus.ABSENT, notes: '' };
    });
    
    setAttendanceRecords(recordMap);
    setView('RECORD_ATTENDANCE');
  };

  const handleSaveAttendance = async () => {
    if (!selectedMeeting) return;
    setSubmitting(true);
    try {
      const recordsToSave = Object.keys(attendanceRecords).map(memberId => ({
        memberId,
        status: attendanceRecords[memberId].status,
        notes: attendanceRecords[memberId].notes
      }));
      
      await api.saveAttendanceBatch(selectedMeeting.id, recordsToSave, 'CURRENT_USER');
      fetchData();
      setView('LIST');
    } catch (e: any) { alert(e.message); }
    setSubmitting(false);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRecord) return;
    setSubmitting(true);
    try {
      await api.updateAttendance(editRecord.id, { status: editForm.status, notes: editForm.notes }, 'CURRENT_USER', editForm.reason);
      setEditRecord(null);
      fetchData(); // Refresh list to show updates
      if (selectedMeeting) handleOpenAttendance(selectedMeeting); // Refresh current view
    } catch (e: any) { alert(e.message); }
    setSubmitting(false);
  };

  const getMemberName = (id: string) => members.find(m => m.id === id)?.fullName || 'Unknown';

  // Find penalty amounts
  const absentFine = fineCategories.find(c => c.name.toLowerCase().includes('absent') && c.isSystem)?.defaultAmount || 0;
  const lateFine = fineCategories.find(c => c.name.toLowerCase().includes('late') && c.isSystem)?.defaultAmount || 0;

  const filteredMeetings = meetings.filter(m => 
    typeFilter === 'ALL' || m.type === typeFilter
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-3">
             <Skeleton className="h-10 w-40 rounded-lg" />
             <Skeleton className="h-10 w-32 rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {view === 'LIST' && (
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-800">{labels.attendanceManagement}</h2>
            <div className="flex gap-3">
               <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
                  <Filter size={16} className="text-gray-500" />
                  <select 
                    className="text-sm bg-transparent outline-none cursor-pointer text-gray-700"
                    value={typeFilter}
                    onChange={e => setTypeFilter(e.target.value)}
                  >
                     <option value="ALL">All Types</option>
                     <option value="REGULAR">{labels.regularWeekly}</option>
                     <option value="SPECIAL">{labels.specialEvent}</option>
                     <option value="EMERGENCY">{labels.emergency}</option>
                  </select>
               </div>
               <button 
                 onClick={() => setView('CREATE_MEETING')}
                 className="flex items-center px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 shadow-sm"
               >
                 <Plus size={18} className="mr-2" /> {labels.scheduleNewMeeting}
               </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMeetings.length === 0 ? (
               <div className="col-span-full p-12 text-center bg-white rounded-xl border border-dashed border-gray-300">
                  <ClipboardCheck className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                  <p className="text-gray-500 font-medium">{labels.noData}</p>
               </div>
            ) : (
              filteredMeetings.map(meeting => {
                const stats = attendance.filter(a => a.meetingId === meeting.id);
                const present = stats.filter(a => a.status === AttendanceStatus.PRESENT).length;
                const absent = stats.filter(a => a.status === AttendanceStatus.ABSENT).length;
                const total = members.length; // Approximate active members
                const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

                return (
                  <div key={meeting.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 transition group cursor-pointer" onClick={() => handleOpenAttendance(meeting)}>
                     <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center">
                           <div className="p-2 bg-blue-50 text-blue-600 rounded-lg mr-3">
                              <Calendar size={20} />
                           </div>
                           <div>
                              <h3 className="font-bold text-gray-900">{new Date(meeting.date).toDateString()}</h3>
                              <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">{meeting.type}</p>
                           </div>
                        </div>
                        <ChevronRight className="text-gray-300 group-hover:text-blue-500" size={20} />
                     </div>
                     
                     <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${percentage}%` }}></div>
                     </div>
                     
                     <div className="flex justify-between text-sm text-gray-600">
                        <span className="flex items-center"><CheckCircle size={14} className="mr-1 text-green-500" /> {present} {labels.present}</span>
                        <span className="flex items-center"><XCircle size={14} className="mr-1 text-red-500" /> {absent} {labels.absent}</span>
                     </div>
                  </div>
                )
              })
            )}
          </div>
        </>
      )}

      {view === 'CREATE_MEETING' && (
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg border border-gray-200 p-6">
           <h3 className="text-xl font-bold text-gray-900 mb-6">{labels.scheduleNewMeeting}</h3>
           <form onSubmit={handleCreateMeeting} className="space-y-4">
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">{labels.date}</label>
                 <input 
                   type="date"
                   required
                   value={newMeetingData.date}
                   onChange={e => setNewMeetingData({...newMeetingData, date: e.target.value})}
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                 />
              </div>
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">{labels.type}</label>
                 <select 
                   value={newMeetingData.type}
                   onChange={e => setNewMeetingData({...newMeetingData, type: e.target.value as any})}
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                 >
                    <option value="REGULAR">{labels.regularWeekly}</option>
                    <option value="SPECIAL">{labels.specialEvent}</option>
                    <option value="EMERGENCY">{labels.emergency}</option>
                 </select>
              </div>
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">{labels.notes}</label>
                 <textarea 
                   value={newMeetingData.notes}
                   onChange={e => setNewMeetingData({...newMeetingData, notes: e.target.value})}
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                   rows={3}
                 />
              </div>
              <div className="flex gap-3 pt-4">
                 <button type="button" onClick={() => setView('LIST')} className="flex-1 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">{labels.cancel}</button>
                 <button type="submit" disabled={submitting} className="flex-1 py-2 text-white bg-slate-800 rounded-lg hover:bg-slate-900 flex justify-center items-center">
                    {submitting ? <Loader2 className="animate-spin" size={18} /> : labels.save}
                 </button>
              </div>
           </form>
        </div>
      )}

      {view === 'RECORD_ATTENDANCE' && selectedMeeting && (
         <div className="bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col h-[calc(100vh-140px)]">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
               <div className="flex items-center">
                  <button onClick={() => setView('LIST')} className="mr-3 p-2 hover:bg-gray-200 rounded-full transition"><ArrowLeft size={20} /></button>
                  <div>
                     <h3 className="font-bold text-gray-900">{new Date(selectedMeeting.date).toDateString()}</h3>
                     <p className="text-xs text-gray-500">{labels.recordingAttendance}</p>
                  </div>
               </div>
               <div className="flex items-center gap-3">
                  <div className="hidden md:flex items-center text-xs gap-3 mr-4">
                     <span className="flex items-center"><div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div> {labels.absent}: {absentFine.toLocaleString()} F</span>
                     <span className="flex items-center"><div className="w-2 h-2 bg-orange-500 rounded-full mr-1"></div> {labels.late}: {lateFine.toLocaleString()} F</span>
                  </div>
                  <button 
                     onClick={handleSaveAttendance}
                     disabled={submitting}
                     className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center shadow-sm"
                  >
                     {submitting ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save size={18} className="mr-2" />} {labels.save}
                  </button>
               </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-0">
               <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm text-xs uppercase text-gray-500">
                     <tr>
                        <th className="p-4 border-b">{labels.members}</th>
                        <th className="p-4 border-b text-center">{labels.status}</th>
                        <th className="p-4 border-b">{labels.notes}</th>
                        <th className="p-4 border-b w-12"></th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                     {members.map(member => {
                        const record = attendanceRecords[member.id];
                        const existingRecord = attendance.find(a => a.meetingId === selectedMeeting.id && a.memberId === member.id);
                        
                        return (
                           <tr key={member.id} className="hover:bg-gray-50 group">
                              <td className="p-4 font-medium text-gray-900">{member.fullName}</td>
                              <td className="p-4 flex justify-center gap-2">
                                 {([
                                    { s: AttendanceStatus.PRESENT, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
                                    { s: AttendanceStatus.LATE, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
                                    { s: AttendanceStatus.ABSENT, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
                                    { s: AttendanceStatus.EXCUSED, icon: AlertTriangle, color: 'text-blue-600', bg: 'bg-blue-50' }
                                 ] as const).map(opt => (
                                    <button
                                       key={opt.s}
                                       onClick={() => setAttendanceRecords({
                                          ...attendanceRecords,
                                          [member.id]: { ...record, status: opt.s }
                                       })}
                                       className={`p-2 rounded-lg transition-all ${
                                          record.status === opt.s 
                                          ? `${opt.bg} ${opt.color} ring-2 ring-offset-1 ring-${opt.color.split('-')[1]}-400 shadow-sm` 
                                          : 'text-gray-300 hover:bg-gray-100 hover:text-gray-500'
                                       }`}
                                       title={opt.s}
                                    >
                                       <opt.icon size={20} />
                                    </button>
                                 ))}
                              </td>
                              <td className="p-4">
                                 <input 
                                    type="text"
                                    placeholder="Optional note..."
                                    value={record.notes}
                                    onChange={e => setAttendanceRecords({
                                       ...attendanceRecords,
                                       [member.id]: { ...record, notes: e.target.value }
                                    })}
                                    className="w-full bg-transparent border-b border-transparent focus:border-gray-300 focus:outline-none text-sm py-1"
                                 />
                              </td>
                              <td className="p-4 text-center">
                                 {existingRecord && (
                                    <button 
                                       onClick={() => { setEditRecord(existingRecord); setEditForm({ status: existingRecord.status, notes: existingRecord.notes || '', reason: '' }); }}
                                       className="text-gray-400 hover:text-blue-600 p-1 rounded"
                                       title="Edit Existing Record"
                                    >
                                       <Edit size={16} />
                                    </button>
                                 )}
                              </td>
                           </tr>
                        );
                     })}
                  </tbody>
               </table>
            </div>
         </div>
      )}

      {/* Edit Audit Modal */}
      {editRecord && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border-t-4 border-amber-500">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900">{labels.correctAttendance}</h3>
                  <button onClick={() => setEditRecord(null)}><X className="text-gray-400 hover:text-gray-600" /></button>
               </div>
               
               <div className="mb-4 text-sm bg-amber-50 text-amber-800 p-3 rounded-lg">
                  Changing status for <strong>{getMemberName(editRecord.memberId)}</strong>.<br/>
               </div>

               <form onSubmit={handleEditSubmit} className="space-y-4">
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">{labels.status}</label>
                     <select 
                        value={editForm.status}
                        onChange={e => setEditForm({...editForm, status: e.target.value as AttendanceStatus})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                     />
                  </div>
                  <div className="flex justify-end pt-2">
                     <button className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700">{labels.save}</button>
                  </div>
               </form>

               {/* History Mini-view */}
               {editRecord.auditHistory && editRecord.auditHistory.length > 0 && (
                  <div className="mt-6 border-t pt-4">
                     <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">{labels.history}</h4>
                     <ul className="space-y-2">
                        {editRecord.auditHistory.map(h => (
                           <li key={h.id} className="text-xs text-gray-600">
                              <span className="font-bold">{new Date(h.date).toLocaleDateString()}</span>: {h.reason}
                           </li>
                        ))}
                     </ul>
                  </div>
               )}
            </div>
         </div>
      )}

    </div>
  );
}
