import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../App';
import { api } from '../api/client';
import { LABELS } from '../constants';
import { Member, MemberStatus, UserRole, GSLAGroup } from '../types';
import { Users, Plus, Search, Edit, Trash2, Filter, Loader2, X, CheckCircle, AlertCircle, Building } from 'lucide-react';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
import { CsvImporter } from '../components/CsvImporter';
import { TableRowSkeleton } from '../components/Skeleton';
import { useAuth } from '../contexts/AuthContext';

export default function MembersList() {
  const { activeGroupId, lang, groups, setActiveGroupId } = useContext(AppContext);
  const { user } = useAuth();
  const labels = LABELS[lang];
  const group = groups.find((g) => g.id === activeGroupId);
  
  // Check if user is admin
  const canSeeAllGroups = user && [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.AUDITOR].includes(user.role);

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | MemberStatus>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    nationalId: '',
    phone: '',
    role: UserRole.MEMBER_USER,
    status: MemberStatus.ACTIVE,
  });

  // Delete State
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Group Selection Dialog State (for admins when no group selected)
  const [showGroupSelectDialog, setShowGroupSelectDialog] = useState(false);
  const [selectedGroupForMember, setSelectedGroupForMember] = useState<string>('');

  useEffect(() => {
    // For admins: show group selection dialog if no group is selected
    if (canSeeAllGroups && !activeGroupId && groups.length > 0) {
      setShowGroupSelectDialog(true);
    } else if (activeGroupId) {
      fetchMembers();
      setShowGroupSelectDialog(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGroupId, canSeeAllGroups, groups.length]);

  const fetchMembers = async () => {
    if (!activeGroupId) return;
    setLoading(true);
    try {
      const data = await api.getMembers(activeGroupId);
      setMembers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (member?: Member) => {
    // If no group selected and trying to add a new member, show group selection first
    if (!member && !activeGroupId && canSeeAllGroups && groups.length > 0) {
      setShowGroupSelectDialog(true);
      return;
    }
    
    if (member) {
      setEditingMember(member);
      setFormData({
        fullName: member.fullName,
        nationalId: member.nationalId,
        phone: member.phone,
        role: member.role as any,
        status: member.status,
      });
    } else {
      setEditingMember(null);
      setFormData({
        fullName: '',
        nationalId: '',
        phone: '',
        role: UserRole.MEMBER_USER,
        status: MemberStatus.ACTIVE,
      });
    }
    setIsModalOpen(true);
  };
  
  const handleGroupSelect = (groupId: string) => {
    setActiveGroupId(groupId);
    setShowGroupSelectDialog(false);
    if (selectedGroupForMember) {
      // If we were trying to add a member, open the modal now
      setSelectedGroupForMember('');
      setTimeout(() => handleOpenModal(), 100);
    }
  };
  
  const handleGroupSelectForMember = (groupId: string) => {
    setSelectedGroupForMember(groupId);
    setActiveGroupId(groupId);
    setShowGroupSelectDialog(false);
    // Open member form after group is selected
    setTimeout(() => {
      handleOpenModal();
    }, 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const groupIdToUse = activeGroupId || selectedGroupForMember;
    if (!groupIdToUse) {
      alert('Please select a group');
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingMember) {
        await api.updateMember(editingMember.id, formData);
      } else {
        await api.addMember(groupIdToUse, formData);
      }
      setIsModalOpen(false);
      setSelectedGroupForMember('');
      if (groupIdToUse !== activeGroupId) {
        setActiveGroupId(groupIdToUse);
      }
      fetchMembers();
    } catch (e) {
      console.error(e);
      alert('Failed to save member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await api.deleteMember(deletingId);
      setDeletingId(null);
      fetchMembers();
    } catch (e) {
      console.error(e);
      alert('Failed to delete member');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleImport = async (data: any[]) => {
    const groupIdToUse = activeGroupId || selectedGroupForMember;
    if (!groupIdToUse) {
      if (canSeeAllGroups && groups.length > 0) {
        setShowGroupSelectDialog(true);
        return { success: false, message: 'Please select a group first' };
      }
      return { success: false, message: 'No active group selected' };
    }
    try {
      const res = await api.importMembers(groupIdToUse, data);
      if (groupIdToUse !== activeGroupId) {
        setActiveGroupId(groupIdToUse);
      }
      fetchMembers();
      // @ts-ignore
      return { success: true, message: `Imported ${res.added} members successfully.` };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  };

  const importFields = [
    { key: 'FullName', label: 'Full Name', sample: 'John Doe', required: true },
    { key: 'NationalID', label: 'National ID', sample: '1199000...', required: true },
    { key: 'Phone', label: 'Phone', sample: '0788123456', required: true },
    { key: 'Role', label: 'Role (Optional)', sample: 'MEMBER_USER', required: false },
  ];

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.nationalId.includes(searchTerm) ||
      m.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'ALL' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Group Selection Dialog for Admins */}
      {showGroupSelectDialog && canSeeAllGroups && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-blue-50 p-2 rounded-lg">
                  <Building className="text-blue-600" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Select Group</h3>
                  <p className="text-sm text-gray-500">Please select a group to view or manage members</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                {groups.map((g: GSLAGroup) => (
                  <button
                    key={g.id}
                    onClick={() => selectedGroupForMember ? handleGroupSelectForMember(g.id) : handleGroupSelect(g.id)}
                    className="w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-gray-900 group-hover:text-blue-700">{g.name}</h4>
                        <p className="text-sm text-gray-500 mt-1">{g.district} • {g.sector}</p>
                      </div>
                      <ChevronRight size={20} className="text-gray-400 group-hover:text-blue-600" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setShowGroupSelectDialog(false);
                  setSelectedGroupForMember('');
                }}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <Users className="mr-3 text-blue-600" /> {labels.members}
        </h2>
        <div className="flex gap-2">
          <CsvImporter entityName="Members" fields={importFields} onImport={handleImport} />
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 shadow-sm transition-colors"
          >
            <Plus size={18} className="mr-2" /> {labels.addMember}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              type="text"
              placeholder={labels.memberSearchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">{labels.allStatus}</option>
              <option value={MemberStatus.ACTIVE}>{labels.active}</option>
              <option value={MemberStatus.SUSPENDED}>{labels.suspended}</option>
              <option value={MemberStatus.EXITED}>{labels.exited}</option>
            </select>
          </div>
        </div>

        {!activeGroupId && canSeeAllGroups ? (
          <div className="p-12 text-center bg-white rounded-xl border-2 border-dashed border-gray-300">
            <Building size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium text-gray-500 mb-2">No Group Selected</p>
            <p className="text-sm text-gray-400 mb-4">Please select a group to view members</p>
            <button
              onClick={() => setShowGroupSelectDialog(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Select Group
            </button>
          </div>
        ) : loading ? (
          <div className="p-4 space-y-4">
            {[...Array(5)].map((_, i) => (
              <TableRowSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs border-b border-gray-200">
                <tr>
                  <th className="p-4">{labels.fullName}</th>
                  <th className="p-4">{labels.nationalId}</th>
                  <th className="p-4">{labels.phoneNumber}</th>
                  <th className="p-4">{labels.role}</th>
                  <th className="p-4">{labels.status}</th>
                  <th className="p-4 text-right">{labels.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      {labels.noData}
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50 group">
                      <td className="p-4 font-medium text-gray-900">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                            {member.fullName.charAt(0)}
                          </div>
                          {member.fullName}
                        </div>
                      </td>
                      <td className="p-4 text-gray-600 font-mono text-xs">{member.nationalId}</td>
                      <td className="p-4 text-gray-600">{member.phone}</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-bold ${
                            member.role === UserRole.GROUP_LEADER
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {member.role === UserRole.GROUP_LEADER ? labels.groupLeader : labels.memberUser}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`flex items-center w-fit px-2 py-1 rounded-full text-xs font-bold ${
                            member.status === MemberStatus.ACTIVE
                              ? 'bg-green-100 text-green-700'
                              : member.status === MemberStatus.SUSPENDED
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {member.status === MemberStatus.ACTIVE ? (
                            <CheckCircle size={12} className="mr-1" />
                          ) : (
                            <AlertCircle size={12} className="mr-1" />
                          )}
                          {member.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleOpenModal(member)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                            title={labels.edit}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => setDeletingId(member.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            title={labels.delete}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 flex-shrink-0">
              <h3 className="text-lg font-bold text-gray-800">{editingMember ? labels.editMember : labels.addMember}</h3>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedGroupForMember('');
                }} 
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form id="member-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar min-h-0">
              {/* Group Selector for Admins when no group is selected */}
              {(!activeGroupId || selectedGroupForMember) && canSeeAllGroups && groups.length > 0 && !editingMember && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Group <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={selectedGroupForMember || activeGroupId || ''}
                    onChange={(e) => {
                      const groupId = e.target.value;
                      setSelectedGroupForMember(groupId);
                      if (!activeGroupId) {
                        setActiveGroupId(groupId);
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="">-- Select a Group --</option>
                    {groups.map((g: GSLAGroup) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.district})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Choose the group to add this member to</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{labels.fullName}</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{labels.nationalId}</label>
                  <input
                    type="text"
                    value={formData.nationalId}
                    onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="16 Digits"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{labels.phoneNumber}</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{labels.role}</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value={UserRole.MEMBER_USER}>{labels.memberUser}</option>
                    <option value={UserRole.GROUP_LEADER}>{labels.groupLeader}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{labels.status}</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value={MemberStatus.ACTIVE}>{labels.active}</option>
                    <option value={MemberStatus.SUSPENDED}>{labels.suspended}</option>
                    <option value={MemberStatus.EXITED}>{labels.exited}</option>
                  </select>
                </div>
              </div>

            </form>
            <div className="pt-2 flex gap-3 p-6 border-t border-gray-100 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedGroupForMember('');
                }}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
              >
                {labels.cancel}
              </button>
              <button
                type="submit"
                form="member-form"
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 flex justify-center items-center shadow-sm"
              >
                {isSubmitting ? <Loader2 className="animate-spin mr-2" size={18} /> : labels.save}
              </button>
            </div>
          </div>
        </div>
      )}

      <DeleteConfirmDialog
        isOpen={!!deletingId}
        title={labels.removeMember}
        description={
          <div className="text-center space-y-2">
            <p>{labels.confirmRemoveMember}</p>
            <p className="text-xs text-orange-600 bg-orange-50 p-2 rounded border border-orange-100">{labels.archiveWarning}</p>
          </div>
        }
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
        isDeleting={isDeleting}
      />
    </div>
  );
}

