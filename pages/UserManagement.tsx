
import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../App';
import { api } from '../api/client';
import { LABELS } from '../constants';
import { User, UserRole, UserStatus, GSLAGroup } from '../types';
import { Users, Search, Plus, Shield, CheckCircle, XCircle, AlertTriangle, Lock, Edit, UserCheck, Loader2, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function UserManagement() {
  const { lang, groups } = useContext(AppContext);
  const { user: currentUser } = useAuth();
  const labels = LABELS[lang];
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: UserRole.GROUP_LEADER,
    managedGroupId: '',
    password: '' // Only for creation
  });
  
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // @ts-ignore
      const data = await api.getUsers();
      setUsers(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        managedGroupId: user.managedGroupId || '',
        password: ''
      });
    } else {
      setEditingUser(null);
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        role: UserRole.GROUP_LEADER,
        managedGroupId: '',
        password: 'ChangeMe123!' // Default temp pass
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingUser) {
        // Update logic (Not fully implemented in mock service, but UI ready)
        alert("Update functionality would go here.");
      } else {
        // @ts-ignore
        await api.createUser({
          ...formData,
          passwordHash: formData.password
        }, currentUser?.id || 'system');
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN: return <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-bold border border-purple-200">Super Admin</span>;
      case UserRole.ADMIN: return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-bold border border-blue-200">{labels.admins}</span>;
      case UserRole.GROUP_LEADER: return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold border border-green-200">{labels.groupLeaders}</span>;
      default: return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">{labels.members}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{labels.systemUsers}</h2>
          <p className="text-sm text-gray-500">{labels.manageAccess}</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 shadow-sm"
        >
          <Plus size={18} className="mr-2" /> {labels.addUser}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-xs font-bold text-gray-400 uppercase">{labels.totalUsers}</p>
          <p className="text-2xl font-bold text-gray-900">{users.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-xs font-bold text-blue-500 uppercase">{labels.admins}</p>
          <p className="text-2xl font-bold text-blue-900">{users.filter(u => u.role === UserRole.ADMIN || u.role === UserRole.SUPER_ADMIN).length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-xs font-bold text-green-500 uppercase">{labels.groupLeaders}</p>
          <p className="text-2xl font-bold text-green-900">{users.filter(u => u.role === UserRole.GROUP_LEADER).length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-xs font-bold text-red-500 uppercase">{labels.lockedDisabled}</p>
          <p className="text-2xl font-bold text-red-900">{users.filter(u => u.status !== UserStatus.ACTIVE).length}</p>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder={labels.searchUsers} 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>
        </div>
        
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 font-medium">
            <tr>
              <th className="p-4">{labels.members}</th>
              <th className="p-4">{labels.role}</th>
              <th className="p-4">{labels.status}</th>
              <th className="p-4">{labels.scope}</th>
              <th className="p-4 text-right">{labels.lastLogin}</th>
              <th className="p-4 text-right">{labels.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center"><Loader2 className="animate-spin mx-auto text-gray-400" /></td></tr>
            ) : filteredUsers.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-gray-500">{labels.noData}</td></tr>
            ) : (
              filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <div className="font-bold text-gray-900">{user.fullName}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </td>
                  <td className="p-4">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="p-4">
                    <span className={`flex items-center text-xs font-bold ${
                      user.status === UserStatus.ACTIVE ? 'text-green-600' : 
                      user.status === UserStatus.LOCKED ? 'text-red-600' : 'text-gray-500'
                    }`}>
                      {user.status === UserStatus.ACTIVE && <CheckCircle size={14} className="mr-1" />}
                      {user.status === UserStatus.LOCKED && <Lock size={14} className="mr-1" />}
                      {user.status}
                    </span>
                  </td>
                  <td className="p-4 text-gray-600">
                    {user.managedGroupId ? (
                      <span className="flex items-center">
                        <Users size={14} className="mr-1 text-gray-400" /> 
                        {groups.find(g => g.id === user.managedGroupId)?.name || 'Unknown Group'}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">{labels.global}</span>
                    )}
                  </td>
                  <td className="p-4 text-right text-gray-500">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : labels.never}
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => handleOpenModal(user)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded transition">
                      <Edit size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">{editingUser ? labels.editUser : labels.createUser}</h3>
              <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{labels.fullName}</label>
                <input 
                  required
                  value={formData.fullName}
                  onChange={e => setFormData({...formData, fullName: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input 
                  type="email"
                  required
                  disabled={!!editingUser}
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg disabled:bg-gray-100"
                />
              </div>
              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{labels.initialPassword}</label>
                  <input 
                    type="text"
                    required
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                  />
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{labels.role}</label>
                  <select 
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value={UserRole.GROUP_LEADER}>{labels.groupLeaders}</option>
                    <option value={UserRole.ADMIN}>{labels.admins}</option>
                    <option value={UserRole.SUPER_ADMIN}>Super Admin</option>
                    <option value={UserRole.MEMBER_USER}>{labels.members}</option>
                  </select>
                </div>
                
                {formData.role === UserRole.GROUP_LEADER && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">{labels.assignedGroup}</label>
                    <select 
                      value={formData.managedGroupId}
                      onChange={e => setFormData({...formData, managedGroupId: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    >
                      <option value="">-- {labels.groupSelector} --</option>
                      {groups.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-50 border rounded-lg">{labels.cancel}</button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 flex items-center"
                >
                  {submitting ? <Loader2 className="animate-spin mr-2" size={16} /> : <UserCheck className="mr-2" size={16} />}
                  {labels.saveUser}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
