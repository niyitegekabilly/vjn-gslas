
import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../App';
import { api } from '../api/client';
import { LABELS } from '../constants';
import { User, UserRole, UserStatus } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Users, Plus, Search, Edit, Trash2, Shield, Lock, Unlock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { TableRowSkeleton } from '../components/Skeleton';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';

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
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: UserRole.MEMBER_USER,
    status: UserStatus.ACTIVE,
    linkedMemberId: '',
    managedGroupIds: [] as string[]
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (e) {
      console.error(e);
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
        status: user.status,
        linkedMemberId: user.linkedMemberId || '',
        managedGroupIds: user.managedGroupIds || []
      });
    } else {
      setEditingUser(null);
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        role: UserRole.MEMBER_USER,
        status: UserStatus.ACTIVE,
        linkedMemberId: '',
        managedGroupIds: []
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingUser) {
        await api.updateUser(editingUser.id, formData);
      } else {
        await api.createUser(formData, currentUser?.id || 'admin');
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (e) {
      console.error(e);
      alert('Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!isDeleting) return;
    setSubmitting(true);
    try {
      await api.deleteUser(isDeleting);
      setIsDeleting(null);
      fetchUsers();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = users.filter(u => u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.includes(searchTerm));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <Shield className="mr-3 text-slate-800" /> {labels.systemUsers}
        </h2>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 shadow-sm"
        >
          <Plus size={18} className="mr-2" /> {labels.addUser}
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
         <div className="relative max-w-md">
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
         {loading ? (
            <div className="p-4 space-y-4">
               {[...Array(5)].map((_, i) => <TableRowSkeleton key={i} />)}
            </div>
         ) : (
            <div className="overflow-x-auto">
               <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs border-b border-gray-200">
                     <tr>
                        <th className="p-4">{labels.fullName}</th>
                        <th className="p-4">{labels.emailAddr}</th>
                        <th className="p-4">{labels.role}</th>
                        <th className="p-4">{labels.status}</th>
                        <th className="p-4 text-right">{labels.actions}</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                     {filteredUsers.map(user => (
                        <tr key={user.id} className="hover:bg-gray-50">
                           <td className="p-4 font-bold text-gray-900">{user.fullName}</td>
                           <td className="p-4 text-gray-600">{user.email}</td>
                           <td className="p-4"><span className="bg-gray-100 px-2 py-1 rounded text-xs">{user.role}</span></td>
                           <td className="p-4">
                              {user.status === 'ACTIVE' ? (
                                 <span className="flex items-center text-green-600 text-xs font-bold">
                                    <CheckCircle size={14} className="mr-1" /> {labels.activeUser}
                                 </span>
                              ) : (
                                 <span className="flex items-center text-red-600 text-xs font-bold">
                                    <XCircle size={14} className="mr-1" /> {user.status}
                                 </span>
                              )}
                           </td>
                           <td className="p-4 text-right flex justify-end gap-2">
                              <button onClick={() => handleOpenModal(user)} className="p-1.5 text-blue-600 bg-blue-50 rounded"><Edit size={16}/></button>
                              <button onClick={() => setIsDeleting(user.id)} className="p-1.5 text-red-600 bg-red-50 rounded"><Trash2 size={16}/></button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         )}
      </div>

      {/* Modal */}
      {isModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
               <h3 className="text-lg font-bold mb-4">{editingUser ? labels.editUser : labels.createUser}</h3>
               <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium mb-1">{labels.fullName}</label>
                        <input required className="w-full p-2 border rounded-lg" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
                     </div>
                     <div>
                        <label className="block text-sm font-medium mb-1">{labels.emailAddr}</label>
                        <input type="email" required className="w-full p-2 border rounded-lg" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                     </div>
                  </div>
                  <div>
                     <label className="block text-sm font-medium mb-1">{labels.phoneNumber}</label>
                     <input required className="w-full p-2 border rounded-lg" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium mb-1">{labels.role}</label>
                        <select className="w-full p-2 border rounded-lg" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as any})}>
                           {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                     </div>
                     <div>
                        <label className="block text-sm font-medium mb-1">{labels.status}</label>
                        <select className="w-full p-2 border rounded-lg" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                           {Object.values(UserStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                     </div>
                  </div>
                  {formData.role === UserRole.GROUP_LEADER && (
                     <div>
                        <label className="block text-sm font-medium mb-1">{labels.assignedGroup}</label>
                        <select multiple className="w-full p-2 border rounded-lg h-24" value={formData.managedGroupIds} onChange={e => setFormData({...formData, managedGroupIds: Array.from(e.target.selectedOptions, o => o.value)})}>
                           {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                     </div>
                  )}
                  <div className="flex gap-3 pt-4">
                     <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 border rounded-lg">{labels.cancel}</button>
                     <button type="submit" disabled={submitting} className="flex-1 py-2 bg-slate-800 text-white rounded-lg font-bold">{submitting ? <Loader2 className="animate-spin inline"/> : labels.saveUser}</button>
                  </div>
               </form>
            </div>
         </div>
      )}

      <DeleteConfirmDialog 
         isOpen={!!isDeleting} 
         title={labels.removeUser} 
         description={labels.confirmRemoveUser} 
         onConfirm={handleDelete} 
         onCancel={() => setIsDeleting(null)} 
         isDeleting={submitting}
      />
    </div>
  );
}
