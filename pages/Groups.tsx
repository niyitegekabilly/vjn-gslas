import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { api } from '../api/client';
import { LABELS } from '../constants';
import { GSLAGroup, Member, MemberStatus, UserRole } from '../types';
import { Plus, Building, MapPin, Users, Edit, Search, X, CheckCircle, AlertCircle, Phone, Mail, Calendar, ChevronRight, Upload } from 'lucide-react';
import { GroupForm } from '../components/GroupForm';
import { TableRowSkeleton } from '../components/Skeleton';
import { CsvImporter } from '../components/CsvImporter';

export default function Groups() {
  const { lang, groups: contextGroups, refreshApp, setActiveGroupId } = useContext(AppContext);
  const navigate = useNavigate();
  const labels = LABELS[lang];
  
  const [groups, setGroups] = useState<GSLAGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GSLAGroup | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  
  // Members modal state
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [membersGroupName, setMembersGroupName] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [showImportMembers, setShowImportMembers] = useState(false);

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
      // Fetch member counts for all groups
      fetchMemberCounts(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMemberCounts = async (groupsList: GSLAGroup[]) => {
    const counts: Record<string, number> = {};
    try {
      // Fetch members for all groups in parallel
      const memberPromises = groupsList.map(async (group) => {
        try {
          const members = await api.getMembers(group.id);
          counts[group.id] = members.length;
        } catch (e) {
          console.error(`Failed to fetch members for group ${group.id}:`, e);
          counts[group.id] = 0;
        }
      });
      await Promise.all(memberPromises);
      setMemberCounts(counts);
    } catch (e) {
      console.error('Failed to fetch member counts:', e);
    }
  };

  const handleMembersClick = async (e: React.MouseEvent, group: GSLAGroup) => {
    e.stopPropagation(); // Prevent card navigation
    setMembersGroupName(group.name);
    setSelectedGroupId(group.id);
    setLoadingMembers(true);
    setIsMembersModalOpen(true);
    try {
      const members = await api.getMembers(group.id);
      setSelectedGroupMembers(members);
    } catch (e) {
      console.error('Failed to fetch members:', e);
      setSelectedGroupMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleMemberClick = (member: Member) => {
    // Set active group and navigate to members page
    if (selectedGroupId) {
      setActiveGroupId(selectedGroupId);
    }
    navigate('/members');
    setIsMembersModalOpen(false);
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
    } finally {
      setSubmitting(false);
    }
  };

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

  const handleImportGroups = async (data: any[]) => {
    try {
      const res: any = await api.importGroups(data);
      await fetchGroups();
      refreshApp();

      const added = Number(res?.added ?? 0);
      const skippedExisting = Number(res?.skippedExisting ?? 0);
      const skippedInvalid = Number(res?.skippedInvalid ?? 0);

      const parts = [
        `${added} added`,
        skippedExisting ? `${skippedExisting} skipped (duplicates)` : null,
        skippedInvalid ? `${skippedInvalid} skipped (invalid rows)` : null
      ].filter(Boolean);

      return { success: true, message: parts.join('. ') };
    } catch (e: any) {
      return { success: false, message: e?.message || 'Failed to import groups' };
    }
  };

  const handleImportMembers = async (data: any[]) => {
    if (!selectedGroupId) return { success: false, message: 'No group selected' };
    try {
      const res: any = await api.importMembers(selectedGroupId, data);
      // Refresh the members list
      const members = await api.getMembers(selectedGroupId);
      setSelectedGroupMembers(members);
      // Update member counts
      await fetchMemberCounts(groups);
      // @ts-ignore
      return { success: true, message: `Imported ${res.added} members successfully.` };
    } catch (e: any) {
      return { success: false, message: e?.message || 'Failed to import members' };
    }
  };

  const handleAddMemberClick = () => {
    if (selectedGroupId) {
      setActiveGroupId(selectedGroupId);
    }
    navigate('/members');
    setIsMembersModalOpen(false);
  };

  const importMemberFields = [
    { key: 'FullName', label: 'Full Name', sample: 'John Doe', required: true },
    { key: 'NationalID', label: 'National ID', sample: '1199000...', required: true },
    { key: 'Phone', label: 'Phone', sample: '0788123456', required: true },
    { key: 'Role', label: 'Role (Optional)', sample: 'MEMBER_USER', required: false },
  ];

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
          <CsvImporter
            entityName="Groups"
            className="hidden md:flex"
            templateFileName="groups_template.csv"
            fields={[
              { key: 'Name', label: 'Group Name', sample: 'ABAKATAJE MU ITERAMBERE', required: true },
              { key: 'District', label: 'District', sample: 'Rubavu', required: true },
              { key: 'Sector', label: 'Sector', sample: 'Muhoza' },
              { key: 'MeetingDay', label: 'Meeting Day', sample: 'Friday' },
              { key: 'ShareValue', label: 'Share Value', sample: '200' }
            ]}
            onImport={handleImportGroups}
          />
          <button 
            onClick={handleCreate}
            className="flex items-center px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 font-medium shadow-sm transition-colors whitespace-nowrap"
          >
            <Plus size={18} className="mr-2" /> {labels.newGroup}
          </button>
        </div>
      </div>

      {/* Mobile: put importer on its own row */}
      <div className="md:hidden">
        <CsvImporter
          entityName="Groups"
          templateFileName="groups_template.csv"
          fields={[
            { key: 'Name', label: 'Group Name', sample: 'ABAKATAJE MU ITERAMBERE', required: true },
            { key: 'District', label: 'District', sample: 'Rubavu', required: true },
            { key: 'Sector', label: 'Sector', sample: 'Muhoza' },
            { key: 'MeetingDay', label: 'Meeting Day', sample: 'Friday' },
            { key: 'ShareValue', label: 'Share Value', sample: '200' }
          ]}
          onImport={handleImportGroups}
        />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
           <div className="w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-xl flex flex-col bg-white shadow-xl">
              <div className="flex-1 overflow-y-auto custom-scrollbar">
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
             <div 
               key={group.id} 
               className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all cursor-pointer group-card"
               onClick={() => navigate(`/groups/${group.id}`)}
             >
                <div className="p-5">
                   <div className="flex justify-between items-start mb-4">
                      <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
                         <Building size={24} />
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(group);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors"
                        title={labels.edit}
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
                         <p className="font-medium text-gray-700 mt-1">{group.shareValue.toLocaleString()} RWF</p>
                      </div>
                      <div>
                         <p className="text-gray-400 text-xs uppercase font-bold">{labels.members}</p>
                         <button
                           onClick={(e) => handleMembersClick(e, group)}
                           className="font-medium text-gray-700 mt-1 flex items-center hover:text-blue-600 transition-colors cursor-pointer"
                           title="View members"
                         >
                            <Users size={14} className="mr-1 text-gray-400" /> {memberCounts[group.id] ?? '...'}
                         </button>
                      </div>
                   </div>
                </div>
             </div>
           ))
        )}
      </div>

      {/* Members Modal */}
      {isMembersModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setIsMembersModalOpen(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex flex-col gap-4 p-6 border-b border-gray-200 flex-shrink-0 bg-white">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-50 p-2 rounded-lg">
                    <Users className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{labels.members}</h3>
                    <p className="text-sm text-gray-500">{membersGroupName} • {selectedGroupMembers.length} {selectedGroupMembers.length === 1 ? 'member' : 'members'}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsMembersModalOpen(false);
                    setMemberSearchTerm('');
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              {/* Search Bar */}
              {selectedGroupMembers.length > 0 && (
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search members by name, phone, or ID..." 
                    value={memberSearchTerm}
                    onChange={(e) => setMemberSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
              )}
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar bg-gray-50" style={{ maxHeight: 'calc(90vh - 200px)' }}>
              {loadingMembers ? (
                <div className="p-6 space-y-3">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>
                  ))}
                </div>
              ) : (() => {
                const filteredMembers = selectedGroupMembers.filter(member => {
                  if (!memberSearchTerm) return true;
                  const search = memberSearchTerm.toLowerCase();
                  return (
                    member.fullName.toLowerCase().includes(search) ||
                    member.phone.includes(search) ||
                    member.nationalId.includes(search) ||
                    (member.email && member.email.toLowerCase().includes(search))
                  );
                });
                
                if (filteredMembers.length === 0) {
                  return (
                    <div className="text-center py-16 text-gray-500">
                      <Search size={48} className="mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">No members found</p>
                      <p className="text-sm mt-2">Try adjusting your search terms</p>
                    </div>
                  );
                }
                
                return (
                  <div className="divide-y divide-gray-100">
                    {filteredMembers.map((member) => (
                      <div
                        key={member.id}
                        className="p-4 hover:bg-blue-50 transition-colors cursor-pointer group border-l-4 border-l-transparent hover:border-l-blue-500"
                        onClick={() => handleMemberClick(member)}
                      >
                        <div className="flex items-center gap-4">
                          {/* Avatar */}
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-sm">
                            {member.fullName.charAt(0).toUpperCase()}
                          </div>
                          
                          {/* Member Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 
                                className="font-bold text-gray-900 text-base hover:text-blue-600 transition-colors cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMemberClick(member);
                                }}
                              >
                                {member.fullName}
                              </h4>
                              <ChevronRight size={18} className="text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                              <div className="flex items-center gap-1.5">
                                <Phone size={14} className="text-gray-400" />
                                <span>{member.phone}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-xs">{member.nationalId}</span>
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                  member.status === MemberStatus.ACTIVE
                                    ? 'bg-green-100 text-green-700'
                                    : member.status === MemberStatus.SUSPENDED
                                      ? 'bg-orange-100 text-orange-700'
                                      : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {member.status === MemberStatus.ACTIVE ? (
                                  <span className="flex items-center gap-1">
                                    <CheckCircle size={10} />
                                    {member.status}
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1">
                                    <AlertCircle size={10} />
                                    {member.status}
                                  </span>
                                )}
                              </span>
                              {member.role === UserRole.GROUP_LEADER && (
                                <span className="px-2 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-700">
                                  {labels.groupLeader}
                                </span>
                              )}
                            </div>
                            
                            {/* Additional Info Row */}
                            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-500">
                              <span>{labels.sharesCollected || 'Shares'}: <strong className="text-gray-700">{member.totalShares}</strong></span>
                              <span>{labels.loans || 'Loans'}: <strong className="text-gray-700">{member.totalLoans}</strong></span>
                              {member.email && (
                                <span className="flex items-center gap-1">
                                  <Mail size={12} />
                                  {member.email}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 flex flex-col gap-4 flex-shrink-0 bg-white">
              {/* Import Members Section */}
              {showImportMembers && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-bold text-blue-900">Upload Members from CSV</h4>
                    <button
                      onClick={() => setShowImportMembers(false)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <CsvImporter
                    entityName="Members"
                    fields={importMemberFields}
                    onImport={handleImportMembers}
                    className="w-full"
                  />
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  {(() => {
                    const filtered = selectedGroupMembers.filter(member => {
                      if (!memberSearchTerm) return true;
                      const search = memberSearchTerm.toLowerCase();
                      return (
                        member.fullName.toLowerCase().includes(search) ||
                        member.phone.includes(search) ||
                        member.nationalId.includes(search) ||
                        (member.email && member.email.toLowerCase().includes(search))
                      );
                    });
                    return `${filtered.length} of ${selectedGroupMembers.length} members`;
                  })()}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowImportMembers(!showImportMembers)}
                    className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    <Upload size={16} className="mr-2" />
                    {showImportMembers ? 'Hide Upload' : 'Upload CSV'}
                  </button>
                  <button
                    onClick={handleAddMemberClick}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    <Plus size={16} className="mr-2" />
                    Add Member
                  </button>
                  <button
                    onClick={() => {
                      setIsMembersModalOpen(false);
                      setMemberSearchTerm('');
                      setShowImportMembers(false);
                    }}
                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    {labels.close}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
