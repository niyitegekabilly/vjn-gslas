
import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../App';
import { api } from '../api/client';
import { LABELS, BROADCAST_EMAIL_TEMPLATES, BROADCAST_SMS_TEMPLATES } from '../constants';
import { Notification, Member, UserRole } from '../types';
import { Bell, Check, Loader2, Info, AlertTriangle, CheckCircle, Mail, MessageSquare, Send, X, Users } from 'lucide-react';
import { Skeleton } from '../components/Skeleton';
import { useAuth } from '../contexts/AuthContext';

export default function Notifications() {
  const { lang, activeGroupId, refreshNotifications } = useContext(AppContext);
  const labels = LABELS[lang];
  const { user } = useAuth();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Compose State
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeType, setComposeType] = useState<'EMAIL' | 'SMS'>('EMAIL');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [recipientMode, setRecipientMode] = useState<'MEMBERS' | 'CUSTOM'>('MEMBERS');
  const [customList, setCustomList] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchData();
    refreshNotifications();
  }, []);

  useEffect(() => {
    if (activeGroupId && isComposeOpen) {
       api.getMembers(activeGroupId).then(setMembers);
    }
  }, [activeGroupId, isComposeOpen]);

  const fetchData = async () => {
    setLoading(true);
    const data = await api.getNotifications();
    setNotifications(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    await api.markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    refreshNotifications(); // Update the badge count
  };

  const markAllRead = async () => {
    await api.markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    refreshNotifications(); // Update the badge count
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    try {
      let recipientList: string[] = [];

      if (recipientMode === 'MEMBERS') {
        if (!activeGroupId) {
          alert(lang === 'en' ? 'Select a group to send to its members, or use "Custom emails / phones".' : 'Hitamo itsinda kugira ngo wohereze abanyamuryango, cyangwa koresha "Imeyili / telefoni byihariye".');
          setSending(false);
          return;
        }
        if (composeType === 'EMAIL') {
          recipientList = members
            .filter(m => m.email || (m.fullName && m.fullName.includes('@')))
            .map(m => m.email || `${(m.fullName || '').replace(/\s/g, '.').toLowerCase()}@amatsinda.vjn.org.rw`);
        } else {
          recipientList = members.filter(m => m.phone).map(m => m.phone!);
        }
      } else {
        const raw = customList.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean);
        if (composeType === 'EMAIL') {
          recipientList = raw.filter(s => s.includes('@'));
        } else {
          recipientList = raw.filter(s => /^[+\d\s-]+$/.test(s));
        }
      }

      if (recipientList.length === 0) {
        alert(lang === 'en' ? 'No valid recipients. Add emails or phone numbers.' : 'Nta bigenewe. Ongeraho imeyili cyangwa nomero.');
        setSending(false);
        return;
      }

      const htmlMessage = message.replace(/\n/g, '<br/>');
      if (composeType === 'EMAIL') {
        await api.sendEmail(recipientList, subject, htmlMessage);
      } else {
        for (const phone of recipientList) {
          await api.sendSMS(phone, message);
        }
      }

      await api.createNotification({
        title: `Broadcast Sent (${composeType})`,
        message: `Sent to ${recipientList.length} recipients by ${user?.fullName}`,
        type: 'INFO'
      });

      alert(labels.msgSentSuccess);
      setIsComposeOpen(false);
      setSubject('');
      setMessage('');
      setCustomList('');
      setSelectedTemplateId('');
      fetchData();
    } catch (e: any) {
      const errMsg = e?.message || (typeof e === 'string' ? e : labels.msgFailed);
      alert(errMsg);
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const applyTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (!templateId) return;
    if (composeType === 'EMAIL') {
      const t = BROADCAST_EMAIL_TEMPLATES.find(x => x.id === templateId);
      if (t) {
        setSubject(lang === 'rw' ? t.subjectRw : t.subjectEn);
        setMessage(lang === 'rw' ? t.bodyRw : t.bodyEn);
      }
    } else {
      const t = BROADCAST_SMS_TEMPLATES.find(x => x.id === templateId);
      if (t) setMessage(lang === 'rw' ? t.bodyRw : t.bodyEn);
    }
  };

  const canBroadcast = user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ADMIN || user?.role === UserRole.GROUP_LEADER;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden divide-y divide-gray-100">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-6">
              <div className="flex items-start gap-4">
                <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <Bell className="mr-3 text-blue-600" /> {labels.notifications}
        </h2>
        <div className="flex gap-3">
            {canBroadcast && (
                <button 
                    onClick={() => setIsComposeOpen(true)}
                    className="text-sm bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-900 font-medium flex items-center shadow-sm"
                >
                    <Mail className="mr-2" size={16} /> {labels.composeBroadcast}
                </button>
            )}
            {notifications.some(n => !n.read) && (
            <button 
                onClick={markAllRead}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center px-3 py-2 bg-blue-50 rounded-lg"
            >
                <Check className="mr-1" size={16} /> {labels.markAllRead}
            </button>
            )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Bell size={48} className="mx-auto mb-4 text-gray-300" />
            <p>{labels.noNotifications}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map(n => (
              <div key={n.id} className={`p-6 hover:bg-gray-50 transition-colors ${!n.read ? 'bg-blue-50/30' : ''}`}>
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-full flex-shrink-0 ${
                    n.type === 'WARNING' ? 'bg-orange-100 text-orange-600' :
                    n.type === 'SUCCESS' ? 'bg-green-100 text-green-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {n.type === 'WARNING' ? <AlertTriangle size={20} /> :
                     n.type === 'SUCCESS' ? <CheckCircle size={20} /> :
                     <Info size={20} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className={`text-base font-semibold ${n.read ? 'text-gray-800' : 'text-gray-900'}`}>{n.title}</h4>
                      <span className="text-xs text-gray-500 whitespace-nowrap ml-4">{new Date(n.date).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                    {!n.read && (
                      <button 
                        onClick={() => markAsRead(n.id)}
                        className="mt-3 text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        {labels.markRead}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Compose Modal */}
      {isComposeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
           <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                 <h3 className="font-bold text-gray-800 flex items-center">
                    <Mail size={20} className="mr-2 text-slate-700" /> {labels.composeBroadcast}
                 </h3>
                 <button onClick={() => setIsComposeOpen(false)}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
              </div>
              
              <form onSubmit={handleSend} className="p-6 space-y-5">
                 {/* Channel Selector */}
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{labels.channel}</label>
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => setComposeType('EMAIL')}
                            className={`flex-1 py-3 rounded-lg border flex justify-center items-center font-medium transition-all ${
                                composeType === 'EMAIL' 
                                ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500' 
                                : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                            }`}
                        >
                            <Mail size={18} className="mr-2" /> Email
                        </button>
                        <button
                            type="button"
                            onClick={() => setComposeType('SMS')}
                            className={`flex-1 py-3 rounded-lg border flex justify-center items-center font-medium transition-all ${
                                composeType === 'SMS' 
                                ? 'bg-green-50 border-green-500 text-green-700 ring-1 ring-green-500' 
                                : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                            }`}
                        >
                            <MessageSquare size={18} className="mr-2" /> SMS
                        </button>
                    </div>
                 </div>

                 {/* Recipients: Members vs Custom */}
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{labels.recipients}</label>
                    <div className="flex gap-3 mb-2">
                        <button
                            type="button"
                            onClick={() => setRecipientMode('MEMBERS')}
                            className={`flex-1 py-2.5 rounded-lg border flex justify-center items-center text-sm font-medium transition-all ${
                                recipientMode === 'MEMBERS' ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500' : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                            }`}
                        >
                            <Users size={16} className="mr-2" /> {labels.recipientsOptionMembers}
                        </button>
                        <button
                            type="button"
                            onClick={() => setRecipientMode('CUSTOM')}
                            className={`flex-1 py-2.5 rounded-lg border flex justify-center items-center text-sm font-medium transition-all ${
                                recipientMode === 'CUSTOM' ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500' : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                            }`}
                        >
                            <Mail size={16} className="mr-2" /> {labels.recipientsOptionCustom}
                        </button>
                    </div>
                    {recipientMode === 'MEMBERS' ? (
                        <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <Users size={18} className="text-gray-500 mr-2" />
                            <span className="text-sm text-gray-800">{labels.allMembers} {activeGroupId ? `(${members.length})` : '(select a group)'}</span>
                        </div>
                    ) : (
                        <textarea
                            value={customList}
                            onChange={e => setCustomList(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            placeholder={composeType === 'EMAIL' ? labels.oneEmailPerLine : labels.onePhonePerLine}
                        />
                    )}
                 </div>

                 {/* Template selector */}
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{labels.selectTemplate}</label>
                    <select
                        value={selectedTemplateId}
                        onChange={e => applyTemplate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    >
                        <option value="">{labels.customTemplate}</option>
                        {composeType === 'EMAIL'
                            ? BROADCAST_EMAIL_TEMPLATES.map(t => (
                                <option key={t.id} value={t.id}>{lang === 'rw' ? t.nameRw : t.nameEn}</option>
                              ))
                            : BROADCAST_SMS_TEMPLATES.map(t => (
                                <option key={t.id} value={t.id}>{lang === 'rw' ? t.nameRw : t.nameEn}</option>
                              ))}
                    </select>
                 </div>

                 {/* Subject (Email Only) */}
                 {composeType === 'EMAIL' && (
                     <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                        <label className="block text-sm font-medium text-gray-700 mb-1">{labels.subject}</label>
                        <input 
                            type="text" 
                            required
                            value={subject}
                            onChange={e => setSubject(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g. Important Meeting Reminder"
                        />
                     </div>
                 )}

                 {/* Message */}
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{labels.message}</label>
                    <textarea 
                        required
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        rows={5}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Type your message here..."
                    />
                    {composeType === 'SMS' && (
                        <p className="text-xs text-right mt-1 text-gray-400">{message.length}/160 chars</p>
                    )}
                 </div>

                 <div className="pt-2 flex justify-end gap-3">
                    <button 
                        type="button" 
                        onClick={() => setIsComposeOpen(false)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                    >
                        {labels.cancel}
                    </button>
                    <button 
                        type="submit" 
                        disabled={sending}
                        className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium flex items-center disabled:opacity-70"
                    >
                        {sending ? <Loader2 className="animate-spin mr-2" size={18} /> : <Send className="mr-2" size={18} />}
                        {labels.send}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
