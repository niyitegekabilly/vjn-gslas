import React, { createContext, useContext, useEffect, useState } from 'react';
import { HashRouter as Router, Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Loader2, Menu } from 'lucide-react';

import { api } from './api/client';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LABELS, MENU_ITEMS } from './constants';
import { Sidebar } from './components/Sidebar';
import { HelpAssistant } from './components/HelpAssistant';
import { GSLAGroup, UserRole } from './types';

// Pages
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Groups from './pages/Groups';
import MembersList from './pages/MembersList';
import LoanManager from './pages/LoanManager';
import MeetingMode from './pages/MeetingMode';
import Contributions from './pages/Contributions';
import Fines from './pages/Fines';
import Expenses from './pages/Expenses';
import Attendance from './pages/Attendance';
import Seasons from './pages/Seasons';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import UserManagement from './pages/UserManagement';
import AuditLogs from './pages/AuditLogs';
import Help from './pages/Help';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';

interface AppContextType {
  lang: 'en' | 'rw';
  setLang: (lang: 'en' | 'rw') => void;
  activeGroupId: string;
  setActiveGroupId: (id: string) => void;
  groups: GSLAGroup[];
  refreshApp: () => void;
  isOnline: boolean;
  showHelpAssistant: boolean;
  setShowHelpAssistant: (show: boolean) => void;
  unreadNotificationsCount: number;
  refreshNotifications: () => void;
}

export const AppContext = createContext<AppContextType>({
  lang: 'en',
  setLang: () => {},
  activeGroupId: '',
  setActiveGroupId: () => {},
  groups: [],
  refreshApp: () => {},
  isOnline: true,
  showHelpAssistant: true,
  setShowHelpAssistant: () => {},
  unreadNotificationsCount: 0,
  refreshNotifications: () => {},
});

const Layout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const { lang, setLang, activeGroupId, setActiveGroupId, groups, showHelpAssistant, setShowHelpAssistant, unreadNotificationsCount } =
    useContext(AppContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const labels = LABELS[lang];

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" />;

  const getBreadcrumbs = () => {
    try {
      const pathnames = location.pathname.split('/').filter((x) => x);
      const crumbs: { name: string; path: string; isLast: boolean }[] = [
        { name: labels.dashboard || 'Dashboard', path: '/', isLast: pathnames.length === 0 },
      ];

      pathnames.forEach((name, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;

        let label = name.charAt(0).toUpperCase() + name.slice(1);
        const menuItem = MENU_ITEMS?.find((item) => item.path === routeTo);
        if (menuItem?.label?.[lang]) label = menuItem.label[lang];
        if (name === 'profile') label = labels.profile || 'Profile';

        crumbs.push({ name: label, path: routeTo, isLast });
      });

      return crumbs;
    } catch {
      return [{ name: labels.dashboard || 'Dashboard', path: '/', isLast: true }];
    }
  };

  const breadcrumbs = getBreadcrumbs();
  const canSeeAllGroups = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.AUDITOR].includes(user.role);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden font-sans">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden h-full">
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6 z-10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500 hover:text-gray-700">
              <Menu size={24} />
            </button>
            <div className="lg:hidden flex items-center gap-2">
              <img
                src="https://odiukwlqorbjuipntmzj.supabase.co/storage/v1/object/public/images/logo.png"
                alt="VJN Logo"
                className="w-6 h-6 object-contain"
              />
              <span className="font-bold text-gray-700">VJN GSLA</span>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-1 justify-end lg:justify-between">
            <div className="hidden lg:flex items-center bg-gray-100 rounded-lg px-3 py-1.5 border border-gray-200">
              <span className="text-xs font-bold text-gray-500 mr-2 uppercase tracking-wide">
                {labels.groupSelector}
              </span>
              <select
                value={activeGroupId}
                onChange={(e) => setActiveGroupId(e.target.value)}
                className="bg-transparent text-sm font-semibold text-gray-800 outline-none cursor-pointer w-48"
                disabled={groups.length <= 1}
              >
                {canSeeAllGroups && <option value="ALL">All Groups (Aggregate)</option>}
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setLang(lang === 'en' ? 'rw' : 'en')}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200"
                title={labels.switchLanguage}
              >
                <img
                  src={lang === 'en' ? 'https://flagcdn.com/w40/gb.png' : 'https://flagcdn.com/w40/rw.png'}
                  alt="Language"
                  className="w-6 h-4 object-cover rounded-[2px] shadow-sm"
                />
                <span className="text-sm font-semibold text-gray-700">{lang === 'en' ? 'EN' : 'RW'}</span>
              </button>

              <div className="h-6 w-px bg-gray-200 mx-1"></div>

              <button
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-full relative transition-colors group"
                onClick={() => navigate('/notifications')}
                title={unreadNotificationsCount > 0 ? `${unreadNotificationsCount} unread notification${unreadNotificationsCount !== 1 ? 's' : ''}` : 'Notifications'}
              >
                <Bell size={20} className={unreadNotificationsCount > 0 ? 'text-blue-600' : ''} />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center px-1.5 border-2 border-white shadow-md animate-pulse">
                    <span className="text-[10px] font-bold text-white leading-none">
                      {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                    </span>
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <div className="flex items-center text-sm text-gray-500 mb-6">
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={crumb.path}>
                {index > 0 && <span className="mx-2 text-gray-400">/</span>}
                {crumb.isLast ? (
                  <span className="font-semibold text-gray-700">{crumb.name}</span>
                ) : (
                  <Link to={crumb.path} className="hover:text-blue-600 transition-colors">
                    {crumb.name}
                  </Link>
                )}
              </React.Fragment>
            ))}
          </div>

          {children}
        </main>

        {showHelpAssistant && (
          <HelpAssistant
            lang={lang}
            activeGroupId={activeGroupId}
            groups={groups}
            setShowHelpAssistant={setShowHelpAssistant}
          />
        )}
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [lang, setLang] = useState<'en' | 'rw'>('en');
  const [activeGroupId, setActiveGroupId] = useState('');
  const [groups, setGroups] = useState<GSLAGroup[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  const [showHelpAssistant, setShowHelpAssistantState] = useState(() => {
    return localStorage.getItem('vjn_show_help') !== 'false';
  });

  const setShowHelpAssistant = (show: boolean) => {
    setShowHelpAssistantState(show);
    localStorage.setItem('vjn_show_help', String(show));
  };

  const refreshNotifications = async () => {
    try {
      const notifications = await api.getNotifications();
      const unreadCount = notifications.filter(n => !n.read).length;
      setUnreadNotificationsCount(unreadCount);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setUnreadNotificationsCount(0);
    }
  };

  useEffect(() => {
    const handleStatusChange = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);
    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  const refreshApp = () => {
    api.getGroups().then((data) => {
      let visibleGroups = data;

      // Security: restrict Group Leader to their managed group(s)
      if (user?.role === UserRole.GROUP_LEADER) {
        const ids = user.managedGroupIds?.filter(Boolean) ?? [];
        if (ids.length > 0) {
          visibleGroups = data.filter((g) => ids.includes(g.id));
        } else if (user.managedGroupId) {
          visibleGroups = data.filter((g) => g.id === user.managedGroupId);
        }
      }

      setGroups(visibleGroups);

      if (visibleGroups.length > 0) {
        const isActiveValid = activeGroupId && visibleGroups.find((g) => g.id === activeGroupId);
        if (!isActiveValid) {
          const defaultGroup = visibleGroups.find((g) => g.id === 'g1') || visibleGroups[0];
          setActiveGroupId(defaultGroup.id);
        }
      } else {
        setActiveGroupId('');
      }
    });
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshApp();
      refreshNotifications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id]);

  // Refresh notifications periodically (every 30 seconds) when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    
    refreshNotifications();
    const interval = setInterval(refreshNotifications, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  return (
    <AppContext.Provider
      value={{ lang, setLang, activeGroupId, setActiveGroupId, groups, refreshApp, isOnline, showHelpAssistant, setShowHelpAssistant, unreadNotificationsCount, refreshNotifications }}
    >
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route path="/" element={<Layout><Dashboard /></Layout>} />
          <Route path="/groups" element={<Layout><Groups /></Layout>} />
          <Route path="/members" element={<Layout><MembersList /></Layout>} />
          <Route path="/loans" element={<Layout><LoanManager /></Layout>} />
          <Route path="/meeting" element={<Layout><MeetingMode /></Layout>} />
          <Route path="/contributions" element={<Layout><Contributions /></Layout>} />
          <Route path="/fines" element={<Layout><Fines /></Layout>} />
          <Route path="/expenses" element={<Layout><Expenses /></Layout>} />
          <Route path="/attendance" element={<Layout><Attendance /></Layout>} />
          <Route path="/seasons" element={<Layout><Seasons /></Layout>} />
          <Route path="/reports" element={<Layout><Reports /></Layout>} />
          <Route path="/settings" element={<Layout><Settings /></Layout>} />
          <Route path="/users" element={<Layout><UserManagement /></Layout>} />
          <Route path="/audit" element={<Layout><AuditLogs /></Layout>} />
          <Route path="/help" element={<Layout><Help /></Layout>} />
          <Route path="/notifications" element={<Layout><Notifications /></Layout>} />
          <Route path="/profile" element={<Layout><Profile /></Layout>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AppContext.Provider>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

