
import React, { useContext, useState, useEffect, useRef } from 'react';
import { AppContext } from '../App';
import { api } from '../api/client';
import { LABELS } from '../constants';
import { Search, UserPlus, Phone, User as UserIcon, Loader2, Edit2, Trash2, X, Save, ChevronLeft, ChevronRight, Filter, Upload } from 'lucide-react';
import { MemberStatus, Member, UserRole } from '../types';
import { CardSkeleton } from '../components/Skeleton';

const ITEMS_PER_PAGE = 24;

export default function MembersList() {
  const { activeGroupId, lang, groups } = useContext(AppContext);
  const labels = LABELS[lang];
  const group = groups.find(g => g.id === activeGroupId);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | MemberStatus>('ALL');
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');
  
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    nationalId: '',
    phone: '',
    role: UserRole.MEMBER_USER,
    status: MemberStatus.ACTIVE
  });
  const [submitting, setSubmitting] = useState(false);
  
  // Import Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMembers = () => {
    if (!activeGroupId) return;
    setLoading(true);
    api.getMembers(activeGroupId).then(data => {
      setMembers(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchMembers();
  }, [activeGroupId]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, roleFilter]);

  const handleOpenModal = (member?: Member) => {
    if (member) {
      setEditingMember(member);
      setFormData({
        fullName: member.fullName,
        nationalId: member.nationalId,
        phone: member.phone,
        role: member.role as UserRole, // Ensure cast for safety
        status: member.status
      });
    } else {
      setEditingMember(null);
      setFormData({
        fullName: '',
        nationalId: '',
        phone: '',
        role: UserRole.MEMBER_USER,
        status: MemberStatus.ACTIVE
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMember(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGroupId) return;
    
    setSubmitting(true);
    try {
      if (editingMember) {
        await api.updateMember(editingMember.id, formData);
      } else {
        await api.addMember(activeGroupId, formData);
      }
      handleCloseModal();
      fetchMembers();
    } catch (error) {
      console.error(error);
      alert("Failed to save member");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (member: Member) => {
    if (!window.confirm(`Are you sure you want to remove ${member.fullName}?`)) return;

    try {
      const result = await api.deleteMember(member.id);
      // @ts-ignore
      if (result.mode === 'archived') {
        alert("Member has been marked as EXITED because they have financial history. Their records are preserved.");
      }
      fetchMembers();
    } catch (error) {
      alert("Failed to delete member");
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split('\n');
      const membersToImport = [];
      
      // Parse CSV (Simple implementation)
      // Format assumption: Name, NationalID, Phone, Role
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.split(',');
        
        // Skip header if detected
        if (i === 0 && parts[0].toLowerCase().includes('name')) continue;

        if (parts.length >= 3) {
           membersToImport.push({
             fullName: parts[0].trim(),
             nationalId: parts[1].trim(),
             phone: parts[2].trim(),
             role: parts[3]?.trim().toUpperCase() === 'ADMIN' ? 'ADMIN' : 'MEMBER'
           });
        }
      }

      if (membersToImport.length > 0) {
        if(window.confirm(`Found ${membersToImport.length} members in CSV. Import them?`)) {
          setSubmitting(true);
          try {
            const result = await api.importMembers(activeGroupId, membersToImport);
            alert(`Successfully imported ${result.added} new members. Duplicates were skipped.`);
            fetchMembers();
          } catch (err: any) {
            alert("Import failed: " + err.message);
          } finally {
            setSubmitting(false);
          }
        }
      } else {
        alert("No valid member records found in CSV. Format: Name, NationalID, Phone, Role(optional)");
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset
  };

  const filteredMembers = members.filter(m => {
    const matchesSearch = m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          m.phone.includes(searchTerm) ||
                          m.nationalId.includes(searchTerm);
    const matchesStatus = statusFilter === 'ALL' || m.status === statusFilter;
    const matchesRole = roleFilter === 'ALL' || m.role === roleFilter;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  const totalPages = Math.ceil(filteredMembers.length / ITEMS_PER_PAGE);
  const paginatedMembers = filteredMembers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-6 relative pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">{labels.members} ({members.length})</h2>
        <div className="flex gap-2">
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden"
            accept=".csv"
            onChange={handleFileChange}
          />
          <button 
            onClick={handleImportClick}
            disabled={submitting}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition shadow-sm"
            title="CSV Format: Name, NationalID, Phone, Role"
          >
            {submitting ? <Loader2 size={18} className="animate-spin mr-2" /> : <Upload size={18} className="mr-2" />}
            Import CSV
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm"
          >
            <UserPlus size={18} className="mr-2" />
            {labels.addMember}
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder={labels.memberSearchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
             <Filter size={16} className="text-gray-500" />
             <select 
               value={statusFilter}
               onChange={(e) => setStatusFilter(e.target.value as any)}
               className="bg-transparent text-sm text-gray-700 outline-none cursor-pointer"
             >
               <option value="ALL">All Status</option>
               <option value={MemberStatus.ACTIVE}>Active</option>
               <option value={MemberStatus.SUSPENDED}>Suspended</option>
               <option value={MemberStatus.EXITED}>Exited (Archived)</option>
             </select>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
             <UserIcon size={16} className="text-gray-500" />
             <select 
               value={roleFilter}
               onChange={(e) => setRoleFilter(e.target.value as any)}
               className="bg-transparent text-sm text-gray-700 outline-none cursor-pointer"
             >
               <option value="ALL">All Roles</option>
               <option value={UserRole.MEMBER_USER}>Member</option>
               <option value={UserRole.GROUP_LEADER}>Admin</option>
             </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
          <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Search className="text-gray-400" size={24} />
          </div>
          <h3 className="text-lg font-medium text-gray-900">{labels.noData}</h3>
          <p className="text-gray-500">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {paginatedMembers.map(member => (
            <div key={member.id} className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition group relative ${member.status === MemberStatus.EXITED ? 'opacity-75 bg-gray-50' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border border-gray-200 ${
                    member.status === MemberStatus.ACTIVE ? 'bg-gray-100 text-gray-500' : 'bg-red-50 text-red-400'
                  }`}>
                    <UserIcon size={24} />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">{member.fullName}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wide ${
                        member.status === MemberStatus.ACTIVE ? 'bg-green-100 text-green-800' : 
                        member.status === MemberStatus.EXITED ? 'bg-gray-200 text-gray-600' : 'bg-red-100 text-red-800'
                      }`}>
                        {member.status}
                      </span>
                      {member.role !== UserRole.MEMBER_USER && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                          {member.role === UserRole.GROUP_LEADER ? 'Admin' : member.role}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button 
                    onClick={() => handleOpenModal(member)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title={labels.editMember}
                   >
                     <Edit2 size={16} />
                   </button>
                   {member.status !== MemberStatus.EXITED && (
                     <button 
                      onClick={() => handleDelete(member)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title={labels.removeMember}
                     >
                       <Trash2 size={16} />
                     </button>
                   )}
                </div>
              </div>
              
              <div className="mt-6 grid grid-cols-2 gap-4 text-sm bg-gray-50 p-3 rounded-lg border border-gray-100">
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs uppercase tracking-wide font-medium">{labels.totalSavings}</span>
                  <span className="font-bold text-gray-800 mt-0.5">
                    {((member.totalShares || 0) * (group?.shareValue || 0)).toLocaleString()} {labels.currency}
                  </span>
                </div>
                <div className="flex flex-col border-l border-gray-200 pl-4">
                  <span className="text-gray-500 text-xs uppercase tracking-wide font-medium">{labels.loanBalance}</span>
                  <span className={`font-bold mt-0.5 ${member.totalLoans > 0 ? 'text-red-600' : 'text-gray-800'}`}>
                    {member.totalLoans > 0 ? member.totalLoans.toLocaleString() + ' ' + labels.currency : '-'}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-gray-500 text-sm">
                <div className="flex items-center">
                  <Phone size={14} className="mr-2 text-gray-400" />
                  {member.phone || 'N/A'}
                </div>
                <div className="text-xs text-gray-400 font-mono">
                   {member.nationalId}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8 pt-4 border-t border-gray-200">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm font-medium text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800">
                {editingMember ? labels.editMember : labels.addMember}
              </h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input 
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">National ID</label>
                  <input 
                    type="text"
                    value={formData.nationalId}
                    onChange={(e) => setFormData({...formData, nationalId: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="16 digits"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input 
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <select 
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    >
                      <option value={UserRole.MEMBER_USER}>Member</option>
                      <option value={UserRole.GROUP_LEADER}>Group Admin</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select 
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value as MemberStatus})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    >
                      <option value={MemberStatus.ACTIVE}>Active</option>
                      <option value={MemberStatus.SUSPENDED}>Suspended</option>
                      <option value={MemberStatus.EXITED}>Exited</option>
                    </select>
                 </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button 
                  type="button" 
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  {labels.cancel}
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex justify-center items-center font-medium"
                >
                  {submitting ? <Loader2 className="animate-spin" size={20} /> : <div className="flex items-center"><Save size={18} className="mr-2" /> {labels.save}</div>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
