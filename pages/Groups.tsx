import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../App';
import { api } from '../api/client';
import { LABELS } from '../constants';
import { GSLAGroup } from '../types';
import { Plus, Building, MapPin, Users, Edit, Search } from 'lucide-react';
import { GroupForm } from '../components/GroupForm';
import { TableRowSkeleton } from '../components/Skeleton';
import { CsvImporter } from '../components/CsvImporter';

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
