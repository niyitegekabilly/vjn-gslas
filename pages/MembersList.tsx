import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../App';
import { api } from '../api/client';
import { LABELS } from '../constants';
import { Search, UserPlus, Phone, User as UserIcon, Loader2 } from 'lucide-react';
import { MemberStatus, Member } from '../types';

export default function MembersList() {
  const { activeGroupId, lang, groups } = useContext(AppContext);
  const labels = LABELS[lang];
  const group = groups.find(g => g.id === activeGroupId);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeGroupId) return;
    setLoading(true);
    api.getMembers(activeGroupId).then(data => {
      setMembers(data);
      setLoading(false);
    });
  }, [activeGroupId]);

  const filteredMembers = members.filter(m => 
    m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.phone.includes(searchTerm)
  );

  if (loading) {
     return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-gray-400" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">{labels.members} ({members.length})</h2>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          <UserPlus size={18} className="mr-2" />
          Add Member
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={18} className="text-gray-400" />
        </div>
        <input
          type="text"
          placeholder={labels.search}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-4 py-2 w-full sm:w-80 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredMembers.map(member => (
          <div key={member.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                  <UserIcon size={24} />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">{member.fullName}</h3>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    member.status === MemberStatus.ACTIVE ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {member.status}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
              <div className="flex flex-col">
                <span className="text-gray-500">Total Savings</span>
                <span className="font-semibold text-gray-900">
                  {((member.totalShares || 0) * (group?.shareValue || 0)).toLocaleString()} RWF
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-500">Loan Balance</span>
                <span className={`font-semibold ${member.totalLoans > 0 ? 'text-orange-600' : 'text-gray-900'}`}>
                  {member.totalLoans > 0 ? member.totalLoans.toLocaleString() : '-'}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center text-gray-500 text-sm">
              <Phone size={14} className="mr-2" />
              {member.phone}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}