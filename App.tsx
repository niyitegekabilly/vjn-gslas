
import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate, NavLink } from 'react-router-dom';
import { 
  Menu, Globe, Bell, LogOut, Loader2, ChevronDown, User, Check, X
} from 'lucide-react';
import { MENU_ITEMS, LABELS } from './constants';
import { api } from './api/client';
import { GSLAGroup, Notification, User as UserType, UserRole } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Lazy Load Pages to prevent circular dependencies and improve load time
const Login = React.lazy(() => import('./pages/Login'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Groups = React.lazy(() => import('./pages/Groups'));
const MembersList = React.lazy(() => import('./pages/MembersList'));
const Seasons = React.lazy(() => import('./pages/Seasons'));
const MeetingMode = React.lazy(() => import('./pages/MeetingMode'));
const Contributions = React.lazy(() => import('./pages/Contributions'));
const LoanManager = React.lazy(() => import('./pages/LoanManager'));
const Fines = React.lazy(() => import('./pages/Fines'));
const Expenses = React.lazy(() => import('./pages/Expenses'));
const Attendance = React.lazy(() => import('./pages/Attendance'));
const Reports = React.lazy(() => import('./pages/Reports'));
const Settings = React.lazy(() => import('./pages/Settings'));
const AuditLogs = React.lazy(() => import('./pages/AuditLogs'));
const Help = React.lazy(() => import('./pages/Help'));
const UserManagement = React.lazy(() => import('./pages/UserManagement'));
const Notifications = React.lazy(() => import('./pages/Notifications'));

// Lazy load component to match page pattern
const HelpAssistant = React.lazy(() => import('./components/HelpAssistant').then(module => ({ default: module.HelpAssistant })));

// Context definition
interface AppContextType {
  lang: 'en' | 'rw';
  setLang: (l: 'en' | 'rw') => void;
  activeGroupId: string;
  setActiveGroupId: (id: string) => void;
  groups: GSLAGroup[];
  refreshApp: () => void;
  isOnline: boolean;
}

export const AppContext = React.createContext<AppContextType>({
  lang: 'en',
  setLang: () => {},
  activeGroupId: '',
  setActiveGroupId: () => {},
  groups: [],
  refreshApp: () => {},
  isOnline: true,
});

const ProtectedRoute = ({ children, allowedRoles }: { children?: React.ReactNode, allowedRoles?: UserRole[] }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-green-600" size={32} /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
     return <div className="p-8 text-center text-red-600 font-bold">Access Denied: Insufficient Permissions</div>;
  }

  return <>{children}</>;
};

const Layout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { lang, setLang, activeGroupId, setActiveGroupId, groups } = React.useContext(AppContext);
  const { user, logout } = useAuth();
  const labels = LABELS[lang];
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Notification State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  useEffect(() => {
    if (user) fetchNotifications();
  }, [user]);

  const fetchNotifications = () => {
    api.getNotifications().then(setNotifications);
  };

  const handleMarkRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await api.markNotificationRead(id);
    fetchNotifications();
  };

  const handleMarkAllRead = async () => {
    await api.markAllNotificationsRead();
    fetchNotifications();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Role Based Menu Filtering
  const isMenuVisible = (itemId: string): boolean => {
    if (!user) return false;
    
    // Global items
    if (['dashboard', 'help'].includes(itemId)) return true;

    // Super Admin & Admin see everything
    if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN) return true;

    // Group Leader Restrictions
    if (user.role === UserRole.GROUP_LEADER) {
       // Hidden for Group Leaders
       if (['users', 'audit', 'settings'].includes(itemId)) return false;
       return true;
    }

    // Member Restrictions (High Security / Read Only View)
    if (user.role === UserRole.MEMBER_USER) {
       // Visible to Members
       if (['loans', 'reports'].includes(itemId)) return true;
       return false; 
    }

    // Auditor
    if (user.role === UserRole.AUDITOR) {
       if (['dashboard', 'reports', 'audit', 'groups', 'members'].includes(itemId)) return true;
       return false;
    }

    return false;
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans text-gray-900 print:h-auto print:overflow-visible">
      {/* Sidebar Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden print:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        flex flex-col shadow-xl print:hidden
      `}>
        <div className="flex items-center justify-center h-16 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center font-bold text-white">V</div>
            <span className="text-xl font-bold tracking-wider text-white">VJN GSLA</span>
          </div>
        </div>

        <nav className="flex-1 mt-6 px-3 space-y-1 overflow-y-auto custom-scrollbar">
          {MENU_ITEMS.map((item) => {
            if (!isMenuVisible(item.id)) return null;
            
            return (
              <NavLink
                key={item.id}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => `
                  w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200
                  ${isActive 
                    ? 'bg-green-600 text-white shadow-md' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                `}
              >
                <span className="mr-3">{item.icon}</span>
                {item.label[lang]}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="text-xs text-slate-500 text-center mb-2">VJN System v1.3 RBAC</div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden print:overflow-visible print:h-auto">
        {/* Top Header (Always Visible) */}
        <header className="flex items-center justify-between h-16 px-4 sm:px-6 bg-white shadow-sm border-b border-gray-200 z-10 print:hidden">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 mr-3 text-gray-500 rounded-md lg:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-lg font-bold text-gray-800 hidden md:block tracking-tight">
              {labels.appName}
            </h1>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Group Selector */}
            <div className="relative group hidden sm:block">
              <div className="flex items-center space-x-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg">
                <span className="text-xs text-gray-500 uppercase font-semibold">{labels.groupSelector}</span>
                {groups.length > 1 ? (
                  <select 
                    className="bg-transparent text-sm font-bold text-gray-800 outline-none cursor-pointer min-w-[120px]"
                    value={activeGroupId}
                    onChange={(e) => setActiveGroupId(e.target.value)}
                  >
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                ) : (
                  <span className="text-sm font-bold text-gray-800 min-w-[120px] px-1">
                    {groups.find(g => g.id === activeGroupId)?.name || 'Loading...'}
                  </span>
                )}
              </div>
            </div>

            {/* Language Switch */}
            <button 
              onClick={() => setLang(lang === 'en' ? 'rw' : 'en')}
              className="flex items-center px-3 py-1.5 text-xs font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 uppercase"
              title={labels.switchLanguage}
            >
              {lang === 'en' ? 'EN' : 'RW'}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className={`relative p-2 rounded-full transition-colors ${isNotifOpen ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white animate-pulse"></span>
                )}
              </button>

              {isNotifOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsNotifOpen(false)} />
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                      <h3 className="text-sm font-bold text-gray-800">{labels.notifications}</h3>
                      {unreadCount > 0 && (
                        <button onClick={handleMarkAllRead} className="text-xs text-blue-600 hover:underline">
                          {labels.markAllRead}
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm">{labels.noNotifications}</div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {notifications.map(n => (
                            <div 
                              key={n.id} 
                              className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${!n.read ? 'bg-blue-50/50' : ''}`}
                              onClick={() => { 
                                if(!n.read) api.markNotificationRead(n.id).then(fetchNotifications);
                              }}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <span className={`text-xs font-bold uppercase ${
                                  n.type === 'WARNING' ? 'text-orange-600' :
                                  n.type === 'SUCCESS' ? 'text-green-600' :
                                  'text-blue-600'
                                }`}>
                                  {n.type}
                                </span>
                                <span className="text-xs text-gray-400">{new Date(n.date).toLocaleDateString()}</span>
                              </div>
                              <h4 className={`text-sm font-semibold mb-1 ${n.read ? 'text-gray-700' : 'text-gray-900'}`}>{n.title}</h4>
                              <p className="text-xs text-gray-500">{n.message}</p>
                              {!n.read && (
                                <button 
                                  onClick={(e) => handleMarkRead(n.id, e)}
                                  className="mt-2 text-xs text-blue-600 flex items-center hover:underline"
                                >
                                  <Check size={12} className="mr-1" /> {labels.markRead}
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="h-8 w-px bg-gray-200 mx-2 hidden sm:block"></div>

            {/* User Profile */}
            <div className="flex items-center">
              <div className="flex flex-col items-end mr-3 hidden sm:flex">
                <span className="text-sm font-bold text-gray-800 leading-none">{user?.fullName || 'User'}</span>
                <span className="text-xs text-green-600 font-medium">{user?.role || 'Guest'}</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold border-2 border-white shadow-sm">
                {user?.fullName.substring(0, 2).toUpperCase() || 'GS'}
              </div>
            </div>

            {/* Logout */}
            <button 
              onClick={logout}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg ml-2" 
              title={labels.logout}
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8 print:overflow-visible print:h-auto print:bg-white print:p-0 relative">
          <div className="max-w-7xl mx-auto print:max-w-none print:mx-0">
            {children}
          </div>
          {/* HELP BOT */}
          <Suspense fallback={null}>
            <HelpAssistant lang={lang} activeGroupId={activeGroupId} groups={groups} />
          </Suspense>
        </main>
      </div>
    </div>
  );
};

const AppContent = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [lang, setLang] = useState<'en' | 'rw'>('en');
  const [activeGroupId, setActiveGroupId] = useState('');
  const [groups, setGroups] = useState<GSLAGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Network Status
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const refreshApp = () => setRefreshTrigger(t => t + 1);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    // Only fetch when auth is ready
    if (authLoading) return;

    api.getGroups().then(data => {
      let availableGroups = data;

      // Restrict groups if user is a GROUP_LEADER
      if (user && user.role === UserRole.GROUP_LEADER && user.managedGroupId) {
        availableGroups = data.filter(g => g.id === user.managedGroupId);
      }

      setGroups(availableGroups);
      
      // Auto-select group
      if (availableGroups.length > 0) {
        // If current active is invalid or empty, set to first available
        if (!activeGroupId || !availableGroups.find(g => g.id === activeGroupId)) {
          setActiveGroupId(availableGroups[0].id);
        }
      } else {
        setActiveGroupId('');
      }
      
      setLoading(false);
    });
  }, [user, authLoading, refreshTrigger]);

  const contextValue = useMemo(() => ({
    lang, setLang, activeGroupId, setActiveGroupId, groups, refreshApp, isOnline
  }), [lang, activeGroupId, groups, refreshTrigger, isOnline]);

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="flex flex-col items-center">
          <Loader2 className="animate-spin text-green-600 mb-4" size={48} />
          <h2 className="text-lg font-semibold text-gray-700">Loading VJN System...</h2>
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={contextValue}>
      <HashRouter>
        <Suspense fallback={
          <div className="flex items-center justify-center h-screen bg-gray-50">
            <div className="flex flex-col items-center">
              <Loader2 className="animate-spin text-green-600 mb-4" size={32} />
              <p className="text-sm text-gray-500">Loading Module...</p>
            </div>
          </div>
        }>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
            <Route path="/groups" element={<ProtectedRoute><Layout><Groups /></Layout></ProtectedRoute>} />
            <Route path="/members" element={<ProtectedRoute><Layout><MembersList /></Layout></ProtectedRoute>} />
            <Route path="/seasons" element={<ProtectedRoute><Layout><Seasons /></Layout></ProtectedRoute>} />
            
            {/* Protected Meeting Mode - Only Admin/Leaders */}
            <Route path="/meeting" element={
              <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.GROUP_LEADER]}>
                  <Layout><MeetingMode /></Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/contributions" element={<ProtectedRoute><Layout><Contributions /></Layout></ProtectedRoute>} />
            <Route path="/loans" element={<ProtectedRoute><Layout><LoanManager /></Layout></ProtectedRoute>} />
            <Route path="/fines" element={<ProtectedRoute><Layout><Fines /></Layout></ProtectedRoute>} />
            <Route path="/expenses" element={<ProtectedRoute><Layout><Expenses /></Layout></ProtectedRoute>} />
            
            {/* Protected Attendance - Only Admin/Leaders */}
            <Route path="/attendance" element={
              <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.GROUP_LEADER]}>
                  <Layout><Attendance /></Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/reports" element={<ProtectedRoute><Layout><Reports /></Layout></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Layout><Notifications /></Layout></ProtectedRoute>} />
            
            {/* Admin Only Routes */}
            <Route path="/settings" element={
              <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN, UserRole.ADMIN]}>
                  <Layout><Settings /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/audit" element={
              <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.AUDITOR]}>
                  <Layout><AuditLogs /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/users" element={
              <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN, UserRole.ADMIN]}>
                  <Layout><UserManagement /></Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/help" element={<ProtectedRoute><Layout><Help /></Layout></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </HashRouter>
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
