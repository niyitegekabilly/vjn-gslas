<<<<<<< HEAD
import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../App';
import { api } from '../api/client';
import { LABELS } from '../constants';
import { GSLAGroup } from '../types';
import { Plus, Building, MapPin, Users, Edit, Search } from 'lucide-react';
import { GroupForm } from '../components/GroupForm';
import { TableRowSkeleton } from '../components/Skeleton';

export default function Groups() {
  const { lang, groups: contextGroups, refreshApp } = useContext(AppContext);
  const labels = LABELS[lang];
  
  const [groups, setGroups] = useState<GSLAGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GSLAGroup | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Initial load from context, then background refresh
    setGroups(contextGroups);
    setLoading(false);
    fetchGroups();
  }, [contextGroups]);

  const fetchGroups = async () => {
    try {
      const data = await api.getGroups();
      setGroups(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async (data: any) => {
    setSubmitting(true);
    try {
      if (selectedGroup) {
        await api.updateGroup(selectedGroup.id, data, data.reason || 'Admin Update', 'Admin');
      } else {
        await api.createGroup(data, 'Admin');
      }
      await fetchGroups();
      refreshApp();
      setIsModalOpen(false);
    } catch (e) {
      console.error(e);
      alert('Failed to save group');
=======

import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../App';
import { api } from '../api/client';
import { LABELS } from '../constants';
import { Building, MapPin, Plus, User, Info, Settings, History, Shield, Users, ArrowRight, Loader2, Save, X, Search, Filter, Edit2, CheckCircle, Globe, DollarSign, Upload, FileText, ExternalLink, Map, MoreVertical, Eye, Trash2 } from 'lucide-react';
import { GSLAGroup, GroupStatus, MeetingFrequency, Member, AuditRecord, UserRole, MemberStatus } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { GroupForm } from '../components/GroupForm';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';

type ViewMode = 'LIST' | 'CREATE' | 'PROFILE' | 'EDIT';

export default function Groups() {
  const { groups: allGroups, lang, setActiveGroupId, refreshApp } = useContext(AppContext);
  const labels = LABELS[lang];
  const { user } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<ViewMode>('LIST');
  const [selectedGroup, setSelectedGroup] = useState<GSLAGroup | null>(null);

  // Dialog State
  const [deleteGroup, setDeleteGroup] = useState<GSLAGroup | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | GroupStatus>('ALL');

  const handleGroupClick = (group: GSLAGroup) => {
    setSelectedGroup(group);
    setView('PROFILE');
  };

  const handleCreateSuccess = (newGroup: GSLAGroup) => {
    setSelectedGroup(newGroup);
    setView('PROFILE');
    refreshApp();
  };

  const handleEditSuccess = (updatedGroup: GSLAGroup) => {
    setSelectedGroup(updatedGroup);
    setView('PROFILE');
    refreshApp();
  };

  const handleManageMembers = (group: GSLAGroup) => {
    setActiveGroupId(group.id);
    navigate('/members');
  };

  const confirmDeleteGroup = (group: GSLAGroup) => {
    setDeleteGroup(group);
  };

  const handleDeleteGroup = async () => {
    if (!deleteGroup) return;
    setIsDeleting(true);
    try {
      await api.updateGroup(deleteGroup.id, { status: GroupStatus.CLOSED }, "Group Closed via List Action", user?.fullName || 'Admin');
      refreshApp();
      setDeleteGroup(null); // Close dialog
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredGroups = allGroups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          group.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || group.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const canCreate = user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ADMIN;

  return (
    <div className="space-y-6">
      {view === 'LIST' && (
        <GroupList 
          groups={filteredGroups} 
          onCreate={() => setView('CREATE')} 
          onSelect={handleGroupClick}
          onEdit={(g: GSLAGroup) => { setSelectedGroup(g); setView('EDIT'); }}
          onManageMembers={handleManageMembers}
          onDelete={confirmDeleteGroup}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          labels={labels}
          canCreate={canCreate}
        />
      )}
      
      {view === 'CREATE' && canCreate && (
        <CreateGroupForm 
          onCancel={() => setView('LIST')} 
          onSuccess={handleCreateSuccess} 
          labels={labels}
        />
      )}

      {view === 'EDIT' && selectedGroup && (
        <EditGroupForm 
          group={selectedGroup}
          onCancel={() => setView('PROFILE')} 
          onSuccess={handleEditSuccess} 
          labels={labels}
        />
      )}

      {view === 'PROFILE' && selectedGroup && (
        <GroupProfile 
          group={selectedGroup} 
          onBack={() => setView('LIST')}
          onEdit={() => setView('EDIT')}
          onChangeGroup={() => {
             api.getGroup(selectedGroup.id).then(g => g && setSelectedGroup(g));
          }}
          labels={labels}
        />
      )}

      {/* Delete Dialog */}
      <DeleteConfirmDialog 
        isOpen={!!deleteGroup}
        title="Close Group?"
        description={
          <span>
            Are you sure you want to close <strong>{deleteGroup?.name}</strong>?
            <br/><br/>
            This action will mark the group as 'CLOSED'. Data is preserved for auditing but operations will be suspended.
          </span>
        }
        onConfirm={handleDeleteGroup}
        onCancel={() => setDeleteGroup(null)}
        isDeleting={isDeleting}
        confirmLabel="Close Group"
        variant="danger"
      />
    </div>
  );
}

// ... existing SUB-COMPONENTS code ...

function GroupList({ 
  groups, onCreate, onSelect, onEdit, onManageMembers, onDelete,
  searchTerm, setSearchTerm, statusFilter, setStatusFilter, labels, canCreate
}: any) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Click outside handler to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId && !(event.target as Element).closest('.group-menu-container')) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId]);

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-gray-800">{labels.groupsManagement}</h2>
           <p className="text-gray-500 text-sm">{labels.manageGroupsDesc}</p>
        </div>
        {canCreate && (
          <button 
            onClick={onCreate}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
          >
            <Plus size={18} className="mr-2" />
            {labels.newGroup}
          </button>
        )}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder={labels.search} 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
          />
        </div>
        <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
          <Filter size={18} className="text-gray-500" />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer"
          >
            <option value="ALL">{labels.allStatus}</option>
            <option value={GroupStatus.ACTIVE}>{labels.active}</option>
            <option value={GroupStatus.SUSPENDED}>{labels.suspended}</option>
            <option value={GroupStatus.CLOSED}>{labels.closed}</option>
          </select>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
          <Building className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <p className="text-gray-500">{labels.noData}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group: GSLAGroup) => (
            <div key={group.id} className={`bg-white p-6 rounded-xl shadow-sm border transition-all hover:shadow-md ${group.status === GroupStatus.ACTIVE ? 'border-gray-100 hover:border-blue-200' : 'border-red-100 bg-red-50/20'}`}>
              <div className="flex justify-between items-start mb-4">
                 <div className="flex items-center overflow-hidden flex-1">
                  <div className={`p-3 rounded-lg mr-4 flex-shrink-0 ${group.status === GroupStatus.ACTIVE ? 'bg-blue-50 text-blue-600' : 'bg-gray-200 text-gray-500'}`}>
                    <Building size={24} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-900 truncate text-lg cursor-pointer hover:text-blue-600 transition-colors" onClick={() => onSelect(group)}>{group.name}</h3>
                    <div className="flex items-center text-sm text-gray-500 truncate mt-1">
                      <MapPin size={14} className="mr-1 flex-shrink-0" />
                      <span className="truncate">{group.location}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-2 pl-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase flex-shrink-0 tracking-wide ${
                    group.status === GroupStatus.ACTIVE ? 'bg-green-100 text-green-800' : 
                    group.status === GroupStatus.SUSPENDED ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'
                    }`}>
                    {group.status === GroupStatus.ACTIVE ? labels.active : group.status === GroupStatus.SUSPENDED ? labels.suspended : labels.closed}
                    </span>
                    
                    <div className="relative group-menu-container">
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(openMenuId === group.id ? null : group.id);
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <MoreVertical size={20} />
                        </button>
                        
                        {openMenuId === group.id && (
                            <div className="absolute right-0 top-8 w-48 bg-white rounded-lg shadow-xl border border-gray-100 z-20 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onSelect(group); setOpenMenuId(null); }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors"
                                >
                                    <Eye size={16} className="mr-2 text-gray-400" /> View Profile
                                </button>
                                {canCreate && (
                                    <>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onEdit(group); setOpenMenuId(null); }}
                                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors"
                                        >
                                            <Edit2 size={16} className="mr-2 text-blue-500" /> Edit Group
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onManageMembers(group); setOpenMenuId(null); }}
                                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors"
                                        >
                                            <Users size={16} className="mr-2 text-green-500" /> Manage Members
                                        </button>
                                        <div className="h-px bg-gray-100 my-1"></div>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onDelete(group); setOpenMenuId(null); }}
                                            className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center transition-colors"
                                        >
                                            <Trash2 size={16} className="mr-2" /> Delete / Close
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 border-t border-gray-100 pt-4 mt-2">
                 <div className="text-center">
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{labels.totalSavings}</p>
                    <p className="font-bold text-gray-800 text-sm mt-1">{(group.totalSavings || 0).toLocaleString()}</p>
                 </div>
                 <div className="text-center border-l border-gray-100">
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{labels.loansActive}</p>
                    <p className="font-bold text-blue-600 text-sm mt-1">{(group.totalLoansOutstanding || 0).toLocaleString()}</p>
                 </div>
                 <div className="text-center border-l border-gray-100">
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{labels.shareValue}</p>
                    <p className="font-bold text-gray-800 text-sm mt-1">{group.shareValue}</p>
                 </div>
              </div>

              <button 
                onClick={() => onSelect(group)}
                className="w-full mt-5 flex items-center justify-center py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-sm font-medium transition-colors border border-gray-200 hover:border-gray-300"
              >
                {labels.manageProfile} <ArrowRight size={16} className="ml-2" />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function CreateGroupForm({ onCancel, onSuccess, labels }: any) {
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (formData: any) => {
    setSubmitting(true);
    try {
      const newGroup = await api.createGroup(formData, user?.fullName || 'System Admin');
      onSuccess(newGroup);
    } catch (error: any) {
      alert(error.message);
>>>>>>> 7c17f3ba72aad7656a6b64c3bf0bfbc90a688a2a
    } finally {
      setSubmitting(false);
    }
  };

<<<<<<< HEAD
  const handleEdit = (group: GSLAGroup) => {
    setSelectedGroup(group);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedGroup(undefined);
    setIsModalOpen(true);
  };

  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    g.district.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <Building className="mr-3 text-blue-600" /> {labels.groupsManagement}
        </h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
             <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
             <input 
               type="text" 
               placeholder={labels.search} 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
             />
          </div>
          <button 
            onClick={handleCreate}
            className="flex items-center px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 font-medium shadow-sm transition-colors whitespace-nowrap"
          >
            <Plus size={18} className="mr-2" /> {labels.newGroup}
          </button>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
           <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl">
              <GroupForm 
                initialData={selectedGroup}
                onSubmit={handleSave}
                onCancel={() => setIsModalOpen(false)}
                isSubmitting={submitting}
                labels={labels}
                title={selectedGroup ? labels.modifyGroup : labels.createGroupTitle}
              />
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && groups.length === 0 ? (
           [...Array(3)].map((_, i) => <div key={i} className="h-48 bg-gray-100 rounded-xl animate-pulse"></div>)
        ) : filteredGroups.length === 0 ? (
           <div className="col-span-full text-center p-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
             {labels.noData}
           </div>
        ) : (
           filteredGroups.map(group => (
             <div key={group.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group-card">
                <div className="p-5">
                   <div className="flex justify-between items-start mb-4">
                      <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
                         <Building size={24} />
                      </div>
                      <button 
                        onClick={() => handleEdit(group)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                         <Edit size={18} />
                      </button>
                   </div>
                   
                   <h3 className="text-lg font-bold text-gray-900 mb-1">{group.name}</h3>
                   <p className="text-sm text-gray-500 flex items-center mb-4">
                      <MapPin size={14} className="mr-1" /> {group.location || `${group.sector}, ${group.district}`}
                   </p>
                   
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
             </div>
           ))
        )}
      </div>
    </div>
  );
}
=======
  return (
    <GroupForm 
      onSubmit={handleSubmit}
      onCancel={onCancel}
      isSubmitting={submitting}
      labels={labels}
      title={labels.createGroupTitle}
    />
  );
}

function EditGroupForm({ group, onCancel, onSuccess, labels }: { group: GSLAGroup, onCancel: () => void, onSuccess: (g: GSLAGroup) => void, labels: any }) {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  
  const [formData, setFormData] = useState({
    name: group.name,
    branchId: group.branchId,
    district: group.district,
    sector: group.sector,
    cell: group.cell || '',
    village: group.village || '',
    coordinates: group.coordinates || null,
    constitutionUrl: group.constitutionUrl || '',
    meetingDay: group.meetingDay,
    shareValue: group.shareValue,
    minShares: group.minShares,
    maxShares: group.maxShares,
    maxLoanMultiplier: group.maxLoanMultiplier || 3,
    status: group.status,
    presidentId: group.presidentId || '',
    secretaryId: group.secretaryId || '',
    accountantId: group.accountantId || '',
    reason: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);

  useEffect(() => {
    setLoadingMembers(true);
    api.getMembers(group.id).then(m => {
        setMembers(m);
        setLoadingMembers(false);
    });
  }, [group.id]);

  const handleGetLocation = () => {
    setGeoLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            coordinates: {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            }
          }));
          setGeoLoading(false);
        },
        (error) => {
          alert("Error getting location: " + error.message);
          setGeoLoading(false);
        }
      );
    } else {
      alert("Geolocation is not supported.");
      setGeoLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, constitutionUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.reason.trim()) {
      alert("Please provide a reason for modification.");
      return;
    }
    setSubmitting(true);
    try {
      const changes: any = {};
      let hasChanges = false;
      const isDifferent = (a: any, b: any) => String(a) !== String(b || '');

      (Object.keys(formData) as Array<keyof typeof formData>).forEach(key => {
         if (key === 'reason') return;
         if (key === 'coordinates') return; 
         // @ts-ignore
         if (isDifferent(formData[key], group[key])) {
            // @ts-ignore
            changes[key] = formData[key];
            hasChanges = true;
         }
      });

      if (JSON.stringify(formData.coordinates) !== JSON.stringify(group.coordinates)) {
          changes.coordinates = formData.coordinates;
          hasChanges = true;
      }

      const newLocation = `${formData.sector}, ${formData.district}`;
      if (newLocation !== group.location) {
         changes.location = newLocation;
         hasChanges = true;
      }

      if (!hasChanges) {
         alert("No changes detected.");
         setSubmitting(false);
         return;
      }
      
      const updatedGroup = await api.updateGroup(
          group.id, 
          changes, 
          formData.reason, 
          user?.fullName || 'Unknown'
      );
      onSuccess(updatedGroup);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      <div className="p-6 border-b border-gray-100 bg-amber-50 flex justify-between items-center">
        <h2 className="text-xl font-bold text-amber-900">{labels.modifyGroup}</h2>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 space-y-8">
        {/* ... form content remains same ... */}
        {/* Section 1: Identification & Location */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide flex items-center border-b border-gray-100 pb-2">
            <Info size={16} className="mr-2" /> {labels.identification}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
              <input 
                required
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">{labels.status}</label>
              <select 
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value as GroupStatus})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
              >
                {Object.values(GroupStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="col-span-2 grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                    <input 
                        value={formData.district}
                        onChange={e => setFormData({...formData, district: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sector</label>
                    <input 
                        value={formData.sector}
                        onChange={e => setFormData({...formData, sector: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cell</label>
                    <input 
                        value={formData.cell}
                        onChange={e => setFormData({...formData, cell: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Village</label>
                    <input 
                        value={formData.village}
                        onChange={e => setFormData({...formData, village: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                </div>
                <div className="col-span-2">
                   <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div>
                         <label className="block text-xs font-bold text-gray-500 uppercase mb-1">GPS Coordinates</label>
                         <div className="font-mono text-sm text-gray-800">
                            {formData.coordinates ? `${formData.coordinates.lat.toFixed(6)}, ${formData.coordinates.lng.toFixed(6)}` : 'Not Set'}
                         </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={handleGetLocation} 
                        disabled={geoLoading}
                        className="text-xs bg-white border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-100 flex items-center"
                      >
                        {geoLoading ? <Loader2 size={12} className="animate-spin mr-1"/> : <MapPin size={12} className="mr-1"/>}
                        Update GPS
                      </button>
                   </div>
                </div>
            </div>
          </div>
        </div>

        {/* Documents */}
        <div className="space-y-4">
           <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide flex items-center border-b border-gray-100 pb-2">
             <FileText size={16} className="mr-2" /> Documents
           </h3>
           <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{labels.constitution} (PDF/Image)</label>
              <div className="flex items-center gap-3">
                 <label className="cursor-pointer bg-white border border-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 flex items-center shadow-sm">
                    <Upload size={16} className="mr-2 text-gray-500" />
                    {formData.constitutionUrl ? 'Replace File' : 'Upload File'}
                    <input type="file" className="hidden" accept="image/*,application/pdf" onChange={handleFileChange} />
                 </label>
                 {formData.constitutionUrl ? (
                    <span className="text-xs text-green-600 font-medium flex items-center bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
                        <CheckCircle size={12} className="mr-1"/> {labels.fileAttached}
                    </span>
                 ) : (
                    <span className="text-xs text-gray-400">{labels.noFileSelected}</span>
                 )}
              </div>
              <p className="text-xs text-gray-500 mt-2">{labels.uploadInstruction}</p>
           </div>
        </div>

        {/* Section 2: Governance */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide flex items-center border-b border-gray-100 pb-2">
            <Shield size={16} className="mr-2" /> {labels.governanceStructure}
          </h3>
          {loadingMembers ? (
              <div className="text-sm text-gray-500 flex items-center"><Loader2 size={16} className="animate-spin mr-2"/> Loading members...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">President</label>
                    <select 
                        value={formData.presidentId}
                        onChange={e => setFormData({...formData, presidentId: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
                    >
                        <option value="">-- Select --</option>
                        {members.map(m => <option key={m.id} value={m.id}>{m.fullName}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Secretary</label>
                    <select 
                        value={formData.secretaryId}
                        onChange={e => setFormData({...formData, secretaryId: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
                    >
                        <option value="">-- Select --</option>
                        {members.map(m => <option key={m.id} value={m.id}>{m.fullName}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Accountant</label>
                    <select 
                        value={formData.accountantId}
                        onChange={e => setFormData({...formData, accountantId: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
                    >
                        <option value="">-- Select --</option>
                        {members.map(m => <option key={m.id} value={m.id}>{m.fullName}</option>)}
                    </select>
                </div>
            </div>
          )}
        </div>

        {/* Section 3: Financial Rules */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide flex items-center border-b border-gray-100 pb-2">
            <Settings size={16} className="mr-2" /> {labels.financialRules}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="col-span-2 md:col-span-1">
               <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Day</label>
               <select 
                 value={formData.meetingDay}
                 onChange={e => setFormData({...formData, meetingDay: e.target.value})}
                 className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
               >
                 {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => (
                   <option key={d} value={d}>{d}</option>
                 ))}
               </select>
             </div>
             <div className="col-span-2 md:col-span-1">
               <label className="block text-sm font-medium text-gray-700 mb-1">Share Value</label>
               <input 
                 type="number"
                 min="50"
                 step="50"
                 value={formData.shareValue}
                 onChange={e => setFormData({...formData, shareValue: parseInt(e.target.value)})}
                 className="w-full px-4 py-2 border border-gray-300 rounded-lg"
               />
             </div>
             <div className="col-span-1">
               <label className="block text-sm font-medium text-gray-700 mb-1">Min Shares</label>
               <input 
                 type="number"
                 min="1"
                 value={formData.minShares}
                 onChange={e => setFormData({...formData, minShares: parseInt(e.target.value)})}
                 className="w-full px-4 py-2 border border-gray-300 rounded-lg"
               />
             </div>
             <div className="col-span-1">
               <label className="block text-sm font-medium text-gray-700 mb-1">Max Shares</label>
               <input 
                 type="number"
                 min="1"
                 value={formData.maxShares}
                 onChange={e => setFormData({...formData, maxShares: parseInt(e.target.value)})}
                 className="w-full px-4 py-2 border border-gray-300 rounded-lg"
               />
             </div>
             <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Loan Multiplier</label>
                <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-400 text-sm font-bold">x</span>
                    <input 
                        type="number"
                        min="1"
                        step="0.5"
                        value={formData.maxLoanMultiplier}
                        onChange={e => setFormData({...formData, maxLoanMultiplier: parseFloat(e.target.value)})}
                        className="w-full pl-6 pr-4 py-2 border border-gray-300 rounded-lg"
                    />
                </div>
             </div>
          </div>
        </div>

        {/* Section 4: Audit */}
        <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 mt-4">
           <label className="block text-sm font-bold text-amber-900 mb-1">Reason for Changes <span className="text-red-500">*</span></label>
           <input 
             required
             value={formData.reason}
             onChange={e => setFormData({...formData, reason: e.target.value})}
             placeholder="e.g. Annual Policy Update, Leadership Change"
             className="w-full px-4 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500"
           />
           <p className="text-xs text-amber-700 mt-2">
               Change performed by: <strong>{user?.fullName || 'Unknown User'}</strong>
           </p>
        </div>

        <div className="flex gap-4 pt-4">
          <button type="button" onClick={onCancel} className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">{labels.cancel}</button>
          <button type="submit" disabled={submitting} className="flex-1 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex justify-center items-center">
            {submitting ? <Loader2 className="animate-spin" size={20} /> : <div className="flex items-center"><Save className="mr-2" size={18} /> Update Group</div>}
          </button>
        </div>
      </form>
    </div>
  );
}

function GroupProfile({ group, onBack, onEdit, onChangeGroup, labels }: { group: GSLAGroup, onBack: () => void, onEdit: () => void, onChangeGroup: () => void, labels: any }) {
  // ... existing implementation ...
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const { setActiveGroupId } = useContext(AppContext);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    api.getMembers(group.id).then(m => {
      setMembers(m);
      setLoading(false);
    });
  }, [group.id]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center text-gray-500 hover:text-gray-800 transition-colors">
          <ArrowRight className="rotate-180 mr-2" size={20} /> {labels.back}
        </button>
        <button 
          onClick={() => { setActiveGroupId(group.id); alert(`Switched context to ${group.name}`); }}
          className="text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 flex items-center transition-colors border border-blue-100"
        >
          <CheckCircle size={16} className="mr-2" /> Select as Active Context
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 relative group">
             <button 
               onClick={onEdit} 
               className="absolute top-4 right-4 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
               title={labels.modifyGroup}
             >
               <Edit2 size={20} />
             </button>

             <div className="flex justify-between items-start mb-6">
                <div>
                   <h1 className="text-3xl font-bold text-gray-900">{group.name}</h1>
                   <div className="flex flex-col gap-1 mt-2">
                      <div className="flex items-center text-gray-500">
                        <MapPin size={18} className="mr-1 text-gray-400" /> {group.location}
                      </div>
                      {group.coordinates && (
                        <a 
                          href={`https://www.google.com/maps?q=${group.coordinates.lat},${group.coordinates.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-xs text-blue-600 hover:text-blue-800 hover:underline ml-6"
                        >
                          <Map size={12} className="mr-1" /> View on Map
                        </a>
                      )}
                   </div>
                </div>
                <div className="flex flex-col items-end mr-12">
                   <span className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wide ${group.status === GroupStatus.ACTIVE ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {group.status}
                   </span>
                   <span className="text-xs text-gray-400 mt-2 font-mono">ID: {group.id}</span>
                </div>
             </div>

             <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-t border-b border-gray-100">
                <div>
                   <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">{labels.totalSavings}</p>
                   <p className="text-xl font-bold text-gray-900 mt-1">{(group.totalSavings || 0).toLocaleString()}</p>
                </div>
                <div>
                   <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">{labels.loansActive}</p>
                   <p className="text-xl font-bold text-blue-600 mt-1">{(group.totalLoansOutstanding || 0).toLocaleString()}</p>
                </div>
                <div>
                   <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Social Fund</p>
                   <p className="text-xl font-bold text-orange-600 mt-1">{(group.totalSolidarity || 0).toLocaleString()}</p>
                </div>
                <div 
                  onClick={() => {
                    setActiveGroupId(group.id);
                    navigate('/members');
                  }}
                  className="cursor-pointer group/stat hover:bg-gray-50 rounded-lg -m-2 p-2 transition-colors"
                  title="View Members List"
                >
                   <p className="text-xs text-gray-400 uppercase font-bold tracking-wider flex items-center group-hover/stat:text-blue-600">
                     {labels.members} <ArrowRight size={12} className="ml-1 opacity-0 group-hover/stat:opacity-100 transition-opacity" />
                   </p>
                   <p className="text-xl font-bold text-gray-900 mt-1 group-hover/stat:text-blue-600">{members.length}</p>
                </div>
             </div>

             <div className="mt-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-800 flex items-center"><Shield size={20} className="mr-2 text-purple-600" /> {labels.governanceStructure}</h3>
                    <button 
                        onClick={() => {
                            setActiveGroupId(group.id);
                            navigate('/members');
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center bg-blue-50 px-3 py-1 rounded-full transition-colors"
                    >
                        View Full List <ArrowRight size={14} className="ml-1" />
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <p className="text-xs text-gray-500 uppercase font-bold mb-1">President</p>
                      <p className="font-medium text-gray-900">{members.find(m => m.id === group.presidentId)?.fullName || 'Not Assigned'}</p>
                   </div>
                   <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <p className="text-xs text-gray-500 uppercase font-bold mb-1">Secretary</p>
                      <p className="font-medium text-gray-900">{members.find(m => m.id === group.secretaryId)?.fullName || 'Not Assigned'}</p>
                   </div>
                   <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <p className="text-xs text-gray-500 uppercase font-bold mb-1">Accountant</p>
                      <p className="font-medium text-gray-900">{members.find(m => m.id === group.accountantId)?.fullName || 'Not Assigned'}</p>
                   </div>
                </div>
             </div>
          </div>

          {/* Audit History */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
             <h3 className="font-bold text-gray-800 mb-4 flex items-center"><History size={20} className="mr-2 text-gray-400" /> {labels.auditTrail}</h3>
             <div className="space-y-6 relative">
                <div className="absolute top-0 bottom-0 left-2.5 w-px bg-gray-200"></div>
                {(group.auditHistory && group.auditHistory.length > 0) ? (
                   group.auditHistory.slice().reverse().map(audit => (
                      <div key={audit.id} className="relative pl-8">
                         <div className="absolute left-0 top-1.5 w-5 h-5 rounded-full border-2 border-white bg-blue-100 ring-1 ring-blue-500 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                         </div>
                         <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-1">
                            <span className="font-bold text-gray-900 text-sm">{audit.reason}</span>
                            <span className="text-xs text-gray-400">{new Date(audit.date).toLocaleString()}</span>
                         </div>
                         <div className="text-xs text-gray-500 mb-2">
                            by <span className="font-medium text-gray-700">{audit.editorId}</span>
                         </div>
                         <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 space-y-2">
                            {audit.changes.length === 0 && (
                                <div className="text-xs text-gray-500 italic">No specific field changes recorded.</div>
                            )}
                            {audit.changes.map((c, idx) => (
                               <div key={idx} className="flex flex-col sm:flex-row sm:items-center text-xs">
                                  <span className="font-mono text-gray-500 uppercase w-32 shrink-0">{c.field}</span>
                                  <div className="flex items-center flex-1">
                                     <span className="text-red-500 bg-red-50 px-1.5 py-0.5 rounded decoration-slice line-through mr-2 max-w-[120px] truncate" title={String(c.oldValue)}>{String(c.oldValue || '-')}</span>
                                     <ArrowRight size={10} className="text-gray-400 mr-2" />
                                     <span className="text-green-700 bg-green-50 px-1.5 py-0.5 rounded font-medium max-w-[120px] truncate" title={String(c.newValue)}>{String(c.newValue || '-')}</span>
                                  </div>
                               </div>
                            ))}
                         </div>
                      </div>
                   ))
                ) : (
                   <p className="text-sm text-gray-400 italic pl-8">No recent changes recorded.</p>
                )}
             </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
           {/* Documents Card */}
           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                 <FileText size={20} className="mr-2 text-blue-500" /> Documents
              </h3>
              {group.constitutionUrl ? (
                 <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex justify-between items-center">
                    <div>
                       <p className="text-sm font-semibold text-gray-800">Constitution / Bylaws</p>
                       <p className="text-xs text-gray-500">Digital Copy Stored</p>
                    </div>
                    <a 
                      href={group.constitutionUrl} 
                      download={`Constitution-${group.name}.pdf`} 
                      className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded transition-colors"
                      title="Download"
                    >
                       <ExternalLink size={18} />
                    </a>
                 </div>
              ) : (
                 <div className="text-center p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <p className="text-xs text-gray-500">No constitution uploaded.</p>
                 </div>
              )}
           </div>

           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center"><Settings size={20} className="mr-2 text-gray-400" /> {labels.financialConfiguration}</h3>
              <ul className="space-y-3 text-sm">
                 <li className="flex justify-between items-center pb-2 border-b border-gray-50">
                    <span className="text-gray-600">Share Value</span>
                    <span className="font-mono font-bold text-gray-800">{group.shareValue}</span>
                 </li>
                 <li className="flex justify-between items-center pb-2 border-b border-gray-50">
                    <span className="text-gray-600">Meeting Day</span>
                    <span className="font-medium text-gray-900">{group.meetingDay}</span>
                 </li>
                 <li className="flex justify-between items-center pb-2 border-b border-gray-50">
                    <span className="text-gray-600">Frequency</span>
                    <span className="font-medium text-gray-900">{group.meetingFrequency}</span>
                 </li>
                 <li className="flex justify-between items-center pt-2">
                    <span className="text-gray-600">Loan Limit</span>
                    <span className="font-medium text-gray-900">{group.maxLoanMultiplier}x Savings</span>
                 </li>
              </ul>
           </div>

           <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
              <h3 className="font-bold text-blue-900 mb-2">Cycle Status</h3>
              <p className="text-sm text-blue-700 mb-4">
                 Current cycle ID: <span className="font-mono bg-white px-2 py-0.5 rounded border border-blue-100">{group.currentCycleId || 'None'}</span>
              </p>
              <button 
                onClick={() => {
                    setActiveGroupId(group.id);
                    navigate('/seasons');
                }}
                className="w-full py-2 bg-white text-blue-600 rounded-lg text-sm font-bold shadow-sm hover:bg-blue-50 border border-blue-200 transition-colors"
              >
                 Manage Cycles
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
>>>>>>> 7c17f3ba72aad7656a6b64c3bf0bfbc90a688a2a
