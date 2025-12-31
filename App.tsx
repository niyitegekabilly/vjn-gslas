
import React, { createContext, useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { GSLAGroup, UserRole } from './types';
import { api } from './api/client';
import { MENU_ITEMS, LABELS } from './constants';
import { Menu, X, LogOut, Globe, Bell, User as UserIcon, Loader2 } from 'lucide-react';

// Pages
import Login from './pages/Login';
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
import { HelpAssistant } from './components/HelpAssistant';

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
  setShowHelpAssistant: () => {}
});

const Layout = ({ children }: { children?: React.ReactNode }) => {
  const { user, logout, isLoading } = useAuth();
  const { lang, setLang, activeGroupId, setActiveGroupId, groups, showHelpAssistant, setShowHelpAssistant } = React.useContext(AppContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const labels = LABELS[lang];

  // Prevent redirect loop during session restoration
  if (isLoading) {
     return (
       <div className="h-screen w-full flex items-center justify-center bg-gray-50">
          <Loader2 className="animate-spin text-blue-600" size={40} />
       </div>
     );
  }

  // Role Based Menu Filtering
  const isMenuVisible = (itemId: string): boolean => {
    if (!user) return false;
    
    // 1. Strict Admin-Only Menus
    if (['settings', 'users'].includes(itemId)) {
        return user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN;
    }

    // 2. Global items
    if (['dashboard', 'help'].includes(itemId)) return true;

    // 3. Super Admin & Admin see everything
    if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN) return true;

    // 4. Role Specific Logic
    if (user.role === UserRole.GROUP_LEADER) {
       if (itemId === 'audit') return false;
       return true;
    }

    if (user.role === UserRole.MEMBER_USER) {
       return ['loans', 'reports', 'dashboard'].includes(itemId); 
    }

    if (user.role === UserRole.AUDITOR) {
       return ['dashboard', 'reports', 'audit', 'groups', 'members'].includes(itemId);
    }

    return false;
  };

  // Safe Breadcrumb Logic
  const getBreadcrumbs = () => {
    try {
        const pathnames = location.pathname.split('/').filter((x) => x);
        const crumbs = [
            { name: labels.dashboard || 'Dashboard', path: '/', isLast: pathnames.length === 0 }
        ];

        pathnames.forEach((name, index) => {
            const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
            const isLast = index === pathnames.length - 1;
            
            let label = name.charAt(0).toUpperCase() + name.slice(1);
            
            // Try matching menu items
            if (MENU_ITEMS) {
                const menuItem = MENU_ITEMS.find(item => item.path === routeTo);
                if (menuItem && menuItem.label && menuItem.label[lang]) {
                    label = menuItem.label[lang];
                }
            }
            
            // Manual overrides
            if (name === 'profile') label = labels.profile || 'Profile';

            crumbs.push({ name: label, path: routeTo, isLast });
        });
        return crumbs;
    } catch (e) {
        return [{ name: labels.dashboard || 'Dashboard', path: '/', isLast: true }];
    }
  };

  const breadcrumbs = getBreadcrumbs();
  const canSeeAllGroups = user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ADMIN || user?.role === UserRole.AUDITOR;

  if (!user) return <Navigate to="/login" />;

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between h-16 px-6 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3">
             <div className="bg-white p-1 rounded-md shadow-sm">
                <img 
                  src="https://odiukwlqorbjuipntmzj.supabase.co/storage/v1/object/public/images/logo.png" 
                  alt="VJN Logo" 
                  className="w-6 h-6 object-contain" 
                />
             </div>
             <span className="text-lg font-bold tracking-wider">VJN GSLA</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {MENU_ITEMS.filter(item => isMenuVisible(item.id)).map((item) => (
              <li key={item.id}>
                <Link 
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors ${location.pathname === item.path ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
                >
                  {item.icon}
                  <span className="ml-3 font-medium">{item.label[lang]}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4 px-2">
             <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-blue-400">
                {user.fullName.charAt(0)}
             </div>
             <div className="overflow-hidden">
                <p className="text-sm font-medium truncate">{user.fullName}</p>
                <p className="text-xs text-slate-400 truncate">{user.role}</p>
             </div>
          </div>
          <button onClick={logout} className="flex items-center w-full px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
            <LogOut size={18} className="mr-3" />
            {labels.logout}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6 z-10">
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
             {/* Context Selector */}
             <div className="hidden lg:flex items-center bg-gray-100 rounded-lg px-3 py-1.5 border border-gray-200">
                <span className="text-xs font-bold text-gray-500 mr-2 uppercase tracking-wide">{labels.groupSelector}</span>
                <select 
                  value={activeGroupId} 
                  onChange={(e) => setActiveGroupId(e.target.value)}
                  className="bg-transparent text-sm font-semibold text-gray-800 outline-none cursor-pointer w-48"
                  disabled={groups.length <= 1}
                >
                   {canSeeAllGroups && <option value="ALL">All Groups (Aggregate)</option>}
                   {groups.map(g => (
                     <option key={g.id} value={g.id}>{g.name}</option>
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
                     src={lang === 'en' ? "https://flagcdn.com/w40/gb.png" : "https://flagcdn.com/w40/rw.png"} 
                     alt="Language" 
                     className="w-6 h-4 object-cover rounded-[2px] shadow-sm"
                   />
                   <span className="text-sm font-semibold text-gray-700">{lang === 'en' ? 'EN' : 'RW'}</span>
                </button>
                
                <div className="h-6 w-px bg-gray-200 mx-1"></div>

                <button 
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-full relative"
                  onClick={() => {}} // Navigate to notifications or open dropdown
                >
                   <Bell size={20} />
                   <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
             </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
           {/* Simple Text Breadcrumbs */}
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
        
        {/* Helper */}
        {showHelpAssistant && <HelpAssistant lang={lang} activeGroupId={activeGroupId} groups={groups} setShowHelpAssistant={setShowHelpAssistant} />}
      </div>
    </div>
  );
};

const AppContent = () => {
  const { isAuthenticated, user } = useAuth();
  const [lang, setLang] = useState<'en' | 'rw'>('en');
  const [activeGroupId, setActiveGroupId] = useState('');
  const [groups, setGroups] = useState<GSLAGroup[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Persistent Setting for Help Assistant
  const [showHelpAssistant, setShowHelpAssistantState] = useState(() => {
    return localStorage.getItem('vjn_show_help') !== 'false';
  });

  const setShowHelpAssistant = (show: boolean) => {
    setShowHelpAssistantState(show);
    localStorage.setItem('vjn_show_help', String(show));
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
    api.getGroups().then(data => {
      let visibleGroups = data;

      // Security: Restrict Group Leader to their managed group
      if (user?.role === UserRole.GROUP_LEADER && user.managedGroupId) {
         visibleGroups = data.filter(g => g.id === user.managedGroupId);
      }

      setGroups(visibleGroups);
      
      if (visibleGroups.length > 0) {
        // If the current active group is no longer visible (or not set), default to the first available one
        const isActiveValid = activeGroupId && visibleGroups.find(g => g.id === activeGroupId);
        if (!isActiveValid) {
            // Prefer 'g1' if available, otherwise first
            const defaultGroup = visibleGroups.find(g => g.id === 'g1') || visibleGroups[0];
            setActiveGroupId(defaultGroup.id);
        }
      } else {
         setActiveGroupId('');
      }
    });
  };

  useEffect(() => {
    if (isAuthenticated) refreshApp();
  }, [isAuthenticated, user]);

  return (
    <AppContext.Provider value={{ lang, setLang, activeGroupId, setActiveGroupId, groups, refreshApp, isOnline, showHelpAssistant, setShowHelpAssistant }}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
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
