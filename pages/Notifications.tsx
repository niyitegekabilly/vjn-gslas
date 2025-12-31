
import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../App';
import { api } from '../api/client';
import { LABELS } from '../constants';
import { Notification } from '../types';
import { Bell, Check, Loader2, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { Skeleton } from '../components/Skeleton';

export default function Notifications() {
  const { lang } = useContext(AppContext);
  const labels = LABELS[lang];
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const data = await api.getNotifications();
    setNotifications(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    await api.markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = async () => {
    await api.markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

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
        {notifications.some(n => !n.read) && (
          <button 
            onClick={markAllRead}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
          >
            <Check className="mr-1" size={16} /> {labels.markAllRead}
          </button>
        )}
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
    </div>
  );
}
