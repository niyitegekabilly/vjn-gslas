
import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../App';
import { api } from '../api/client';
import { LABELS } from '../constants';
import { GSLAGroup } from '../types';
import { Building, Plus, Search, Edit, MapPin, Users, Loader2 } from 'lucide-react';
import { CardSkeleton } from '../components/Skeleton';
import { GroupForm } from '../components/GroupForm';
import { useAuth } from '../contexts/AuthContext';

export default function Groups() {
  const { lang, refreshApp } = useContext(AppContext);
  const labels = LABELS[lang];
  const { user } = useAuth();

  const [groups, setGroups] = useState<GSLAGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GSLAGroup | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const data = await api.getGroups();
      setGroups(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (group?: GSLAGroup) => {
    setEditingGroup(group || null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (data: any) => {
    setSubmitting(true);
    try {
      if (editingGroup) {
        await api.updateGroup(editingGroup.id, data, 'Admin Edit', user?.fullName || 'Admin');
      } else {
        await api.createGroup(data, user?.fullName || 'Admin');
      }
      setIsModalOpen(false);
      fetchGroups();
      refreshApp(); // Update global context
    } catch (e) {
      console.error(e);
      alert('Failed to save group');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredGroups = groups.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <Building className="mr-3 text-purple-600" /> {labels.groupsManagement}
        </h2>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 shadow-sm transition-colors w-full sm:w-auto justify-center"
        >
          <Plus size={18} className="mr-2" /> {labels.newGroup}
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
         <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder={labels.search} 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
         </div>
      </div>

      {loading ? (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}
         </div>
      ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGroups.length === 0 ? (
               <div className="col-span-full p-8 text-center text-gray-500">{labels.noData}</div>
            ) : (
               filteredGroups.map(group => (
                  <div key={group.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                     <div className="p-6 flex-1">
                        <div className="flex justify-between items-start mb-4">
                           <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600 font-bold text-lg">
                                 {group.name.charAt(0)}
                              </div>
                              <div>
                                 <h3 className="font-bold text-gray-900 text-lg">{group.name}</h3>
                                 <p className="text-xs text-gray-500 flex items-center mt-1">
                                    <MapPin size={12} className="mr-1" /> {group.location}
                                 </p>
                              </div>
                           </div>
                           <button 
                             onClick={() => handleOpenModal(group)}
                             className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                           >
                              <Edit size={18} />
                           </button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm border-t border-gray-100 pt-4">
                           <div>
                              <p className="text-gray-400 text-xs uppercase font-bold">{labels.status}</p>
                              <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-bold ${group.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                 {group.status}
                              </span>
                           </div>
                           <div>
                              <p className="text-gray-400 text-xs uppercase font-bold">{labels.meetingFreq}</p>
                              <p className="font-medium text-gray-700 mt-1">{group.meetingFrequency}</p>
                           </div>
                           <div>
                              <p className="text-gray-400 text-xs uppercase font-bold">{labels.shareValue}</p>
                              <p className="font-medium text-gray-700 mt-1">{group.shareValue} RWF</p>
                           </div>
                           <div>
                              <p className="text-gray-400 text-xs uppercase font-bold">{labels.members}</p>
                              <p className="font-medium text-gray-700 mt-1 flex items-center">
                                 <Users size={14} className="mr-1 text-gray-400" /> --
                              </p>
                           </div>
                        </div>
                     </div>
                     <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
                        <span>Created {new Date(group.createdAt).toLocaleDateString()}</span>
                        {group.constitutionUrl && <span className="text-blue-600 font-medium">Docs Attached</span>}
                     </div>
                  </div>
               ))
            )}
         </div>
      )}

      {/* Group Form Modal */}
      {isModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
               <GroupForm 
                  initialData={editingGroup || {}}
                  onSubmit={handleSubmit}
                  onCancel={() => setIsModalOpen(false)}
                  isSubmitting={submitting}
                  labels={labels}
                  title={editingGroup ? labels.modifyGroup : labels.createGroupTitle}
               />
            </div>
         </div>
      )}
    </div>
  );
}
