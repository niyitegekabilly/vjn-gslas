
import React, { useContext, useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, LogOut, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { AppContext } from '../App';
import { useAuth } from '../contexts/AuthContext';
import { MENU_ITEMS, MENU_CATEGORIES, LABELS } from '../constants';
import { UserRole } from '../types';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, isCollapsed, setIsCollapsed }) => {
  const { user, logout } = useAuth();
  const { lang } = useContext(AppContext);
  const location = useLocation();
  const labels = LABELS[lang];

  // Which category contains current path (for default-open dropdown)
  const categoryContainingPath = useMemo(() => {
    const path = location.pathname;
    const item = MENU_ITEMS.find((i) => i.path === path);
    if (!item) return null;
    return MENU_CATEGORIES.find((c) => c.itemIds.includes(item.id))?.id ?? null;
  }, [location.pathname]);

  const [openCategoryId, setOpenCategoryId] = useState<string | null>(() => categoryContainingPath);

  // Open the category that contains the current route when navigating
  React.useEffect(() => {
    if (categoryContainingPath) setOpenCategoryId(categoryContainingPath);
  }, [categoryContainingPath]);

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
       return ['loans', 'reports', 'dashboard', 'meeting'].includes(itemId); 
    }

    if (user.role === UserRole.AUDITOR) {
       return ['dashboard', 'reports', 'audit', 'groups', 'members', 'meeting'].includes(itemId);
    }

    return false;
  };

  if (!user) return null;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 bg-slate-900 text-white transform transition-all duration-300 ease-in-out 
        flex flex-col h-full
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        lg:translate-x-0 lg:static 
        ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
      `}>
        {/* Header */}
        <div className={`flex items-center h-16 bg-slate-950 border-b border-slate-800 flex-shrink-0 ${isCollapsed ? 'justify-center px-0' : 'justify-between px-6'}`}>
          <div className="flex items-center gap-3 overflow-hidden">
             <div className="bg-white p-1 rounded-md shadow-sm flex-shrink-0">
                <img 
                  src="https://odiukwlqorbjuipntmzj.supabase.co/storage/v1/object/public/images/logo.png" 
                  alt="VJN Logo" 
                  className="w-6 h-6 object-contain" 
                />
             </div>
             {!isCollapsed && <span className="text-lg font-bold tracking-wider whitespace-nowrap">VJN GSLA</span>}
          </div>
          
          {/* Mobile Close */}
          <button onClick={() => setIsOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
            <X size={24} />
          </button>

          {/* Desktop Collapse Toggle */}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)} 
            className="hidden lg:flex text-slate-500 hover:text-white transition-colors"
            title={isCollapsed ? "Expand" : "Collapse"}
          >
             {isCollapsed ? null : <ChevronLeft size={20} />}
          </button>
        </div>
        
        {/* Nav Items - grouped when expanded, flat when collapsed */}
        <nav className="flex-1 overflow-y-auto py-4 overflow-x-hidden">
          <ul className="space-y-1 px-3">
            {isCollapsed ? (
              /* Collapsed: flat icon list */
              MENU_ITEMS.filter((item) => isMenuVisible(item.id)).map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.id}>
                    <Link
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      title={item.label[lang]}
                      className={`
                        flex items-center justify-center py-3 rounded-lg transition-colors px-0
                        ${isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
                      `}
                    >
                      <div className="flex-shrink-0">{item.icon}</div>
                    </Link>
                  </li>
                );
              })
            ) : (
              /* Expanded: categories with dropdowns */
              MENU_CATEGORIES.map((category) => {
                const visibleItems = category.itemIds
                  .map((id) => MENU_ITEMS.find((i) => i.id === id))
                  .filter((item): item is NonNullable<typeof item> => !!item && isMenuVisible(item.id));
                if (visibleItems.length === 0) return null;

                const isSingle = visibleItems.length === 1;
                const isOpen = openCategoryId === category.id;
                const hasActiveChild = visibleItems.some((i) => location.pathname === i.path);

                if (isSingle) {
                  const item = visibleItems[0];
                  const isActive = location.pathname === item.path;
                  return (
                    <li key={category.id}>
                      <Link
                        to={item.path}
                        onClick={() => setIsOpen(false)}
                        className={`
                          flex items-center py-2.5 px-4 rounded-lg transition-colors
                          ${isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
                        `}
                      >
                        <div className="flex-shrink-0">{item.icon}</div>
                        <span className="ml-3 font-medium whitespace-nowrap">{item.label[lang]}</span>
                      </Link>
                    </li>
                  );
                }

                return (
                  <li key={category.id} className="space-y-0.5">
                    <button
                      type="button"
                      onClick={() => setOpenCategoryId((prev) => (prev === category.id ? null : category.id))}
                      className={`
                        flex items-center w-full py-2.5 px-4 rounded-lg transition-colors text-left
                        ${hasActiveChild ? 'text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
                      `}
                    >
                      <span className="font-medium whitespace-nowrap flex-1">{category.label[lang]}</span>
                      <ChevronDown
                        size={18}
                        className={`flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {isOpen && (
                      <ul className="pl-4 space-y-0.5 border-l border-slate-700 ml-4">
                        {visibleItems.map((item) => {
                          const isActive = location.pathname === item.path;
                          return (
                            <li key={item.id}>
                              <Link
                                to={item.path}
                                onClick={() => setIsOpen(false)}
                                className={`
                                  flex items-center py-2 px-3 rounded-lg transition-colors text-sm
                                  ${isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                                `}
                              >
                                <div className="flex-shrink-0">{item.icon}</div>
                                <span className="ml-2 whitespace-nowrap">{item.label[lang]}</span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </nav>

        {/* Footer */}
        <div className={`border-t border-slate-800 flex-shrink-0 ${isCollapsed ? 'p-2' : 'p-4'}`}>
          {!isCollapsed && (
            <div className="flex items-center gap-3 mb-4 px-2">
               <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-blue-400 flex-shrink-0">
                  {user.fullName.charAt(0)}
               </div>
               <div className="overflow-hidden">
                  <p className="text-sm font-medium truncate">{user.fullName}</p>
                  <p className="text-xs text-slate-400 truncate">{user.role}</p>
               </div>
            </div>
          )}
          
          <button 
            onClick={logout} 
            className={`
              flex items-center w-full rounded-lg transition-colors text-slate-400 hover:text-white hover:bg-slate-800
              ${isCollapsed ? 'justify-center py-3' : 'px-4 py-2 text-sm'}
            `}
            title={isCollapsed ? labels.logout : ''}
          >
            <LogOut size={18} className={isCollapsed ? '' : 'mr-3'} />
            {!isCollapsed && labels.logout}
          </button>
          
          {/* Toggle button moved to bottom center if collapsed for easier access? No, kept in header for consistency */}
          {isCollapsed && (
             <button 
               onClick={() => setIsCollapsed(false)} 
               className="hidden lg:flex w-full justify-center mt-2 text-slate-600 hover:text-slate-400"
             >
                <ChevronRight size={16} />
             </button>
          )}
        </div>
      </aside>
    </>
  );
};
