import React, { useState, useMemo, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { 
  Menu, Globe, Bell, LogOut, Loader2, ChevronDown, User
} from 'lucide-react';
import { MENU_ITEMS, LABELS } from './constants';
import { api } from './api/client';
import { GSLAGroup } from './types';

// Pages
import Dashboard from './pages/Dashboard';
import Groups from './pages/Groups';
import MembersList from './pages/MembersList';
import Seasons from './pages/Seasons';
import MeetingMode from './pages/MeetingMode';
import Contributions from './pages/Contributions';
import LoanManager from './pages/LoanManager';
import Fines from './pages/Fines';
import Expenses from './pages/Expenses';
import Attendance from './pages/Attendance';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import AuditLogs from './pages/AuditLogs';
import Help from './pages/Help';

// Context definition
interface AppContextType {
  lang: 'en' | 'rw';
  setLang: (l: 'en' | 'rw') => void;
  activeGroupId: string;
  setActiveGroupId: (id: string) => void;
  groups: GSLAGroup[];
}

export const AppContext = React.createContext<AppContextType>({
  lang: 'en',
  setLang: () => {},
  activeGroupId: '',
  setActiveGroupId: () => {},
  groups: [],
});

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { lang, setLang, activeGroupId, setActiveGroupId, groups } = React.useContext(AppContext);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const activeGroup = groups.find(g => g.id === activeGroupId);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans text-gray-900">
      {/* Sidebar Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        flex flex-col shadow-xl
      `}>
        <div className="flex items-center justify-center h-16 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center font-bold text-white">V</div>
            <span className="text-xl font-bold tracking-wider text-white">VJN GSLA</span>
          </div>
        </div>

        <nav className="flex-1 mt-6 px-3 space-y-1 overflow-y-auto custom-scrollbar">
          {MENU_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <a
                key={item.id}
                href={`#${item.path}`}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200
                  ${isActive 
                    ? 'bg-green-600 text-white shadow-md' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                `}
              >
                <span className={`mr-3 ${isActive ? 'text-white' : 'text-slate-500'}`}>{item.icon}</span>
                {item.label[lang]}
              </a>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="text-xs text-slate-500 text-center mb-2">VJN System v1.2</div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header (Always Visible) */}
        <header className="flex items-center justify-between h-16 px-4 sm:px-6 bg-white shadow-sm border-b border-gray-200 z-10">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 mr-3 text-gray-500 rounded-md lg:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-lg font-bold text-gray-800 hidden md:block tracking-tight">
              VJN GSLA Management System
            </h1>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Group Selector */}
            <div className="relative group hidden sm:block">
              <div className="flex items-center space-x-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg">
                <span className="text-xs text-gray-500 uppercase font-semibold">Group:</span>
                <select 
                  className="bg-transparent text-sm font-bold text-gray-800 outline-none cursor-pointer min-w-[120px]"
                  value={activeGroupId}
                  onChange={(e) => setActiveGroupId(e.target.value)}
                >
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Language Switch */}
            <button 
              onClick={() => setLang(lang === 'en' ? 'rw' : 'en')}
              className="flex items-center px-3 py-1.5 text-xs font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 uppercase"
              title="Switch Language"
            >
              {lang === 'en' ? 'EN' : 'RW'}
            </button>

            {/* Notifications */}
            <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
            </button>

            <div className="h-8 w-px bg-gray-200 mx-2 hidden sm:block"></div>

            {/* User Profile */}
            <div className="flex items-center">
              <div className="flex flex-col items-end mr-3 hidden sm:flex">
                <span className="text-sm font-bold text-gray-800 leading-none">Jean Admin</span>
                <span className="text-xs text-green-600 font-medium">Super Admin</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold border-2 border-white shadow-sm">
                JA
              </div>
            </div>

            {/* Logout */}
            <button className="p-2 text-red-500 hover:bg-red-50 rounded-lg ml-2" title="Logout">
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  const [lang, setLang] = useState<'en' | 'rw'>('en');
  const [activeGroupId, setActiveGroupId] = useState('');
  const [groups, setGroups] = useState<GSLAGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial fetch of groups
    api.getGroups().then(data => {
      setGroups(data);
      if (data.length > 0) {
        setActiveGroupId(data[0].id);
      }
      setLoading(false);
    });
  }, []);

  const contextValue = useMemo(() => ({
    lang, setLang, activeGroupId, setActiveGroupId, groups
  }), [lang, activeGroupId, groups]);

  if (loading) {
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
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/groups" element={<Groups />} />
            <Route path="/members" element={<MembersList />} />
            <Route path="/seasons" element={<Seasons />} />
            <Route path="/meeting" element={<MeetingMode />} />
            <Route path="/contributions" element={<Contributions />} />
            <Route path="/loans" element={<LoanManager />} />
            <Route path="/fines" element={<Fines />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/audit" element={<AuditLogs />} />
            <Route path="/help" element={<Help />} />
            <Route path="/notifications" element={<div className="p-8 text-center text-gray-500">No new announcements.</div>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </HashRouter>
    </AppContext.Provider>
  );
}