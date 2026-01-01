
import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, LogOut } from 'lucide-react';
import { AppContext } from '../App';
import { useAuth } from '../contexts/AuthContext';
import { MENU_ITEMS, LABELS } from '../constants';
import { UserRole } from '../types';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();
  const { lang } = useContext(AppContext);
  const location = useLocation();
  const labels = LABELS[lang];

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

  if (!user) return null;

  return (
    <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col h-full ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center justify-between h-16 px-6 bg-slate-950 border-b border-slate-800 flex-shrink-0">
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
        <button onClick={() => setIsOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
          <X size={24} />
        </button>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {MENU_ITEMS.filter(item => isMenuVisible(item.id)).map((item) => (
            <li key={item.id}>
              <Link 
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${location.pathname === item.path ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
              >
                {item.icon}
                <span className="ml-3 font-medium">{item.label[lang]}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-800 flex-shrink-0">
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
  );
};
