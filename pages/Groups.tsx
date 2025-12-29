import React, { useContext } from 'react';
import { AppContext } from '../App';
import { LABELS } from '../constants';
import { Building, MapPin, Plus } from 'lucide-react';

export default function Groups() {
  const { groups, lang } = useContext(AppContext);
  const labels = LABELS[lang];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">{labels.group} Management</h2>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus size={18} className="mr-2" />
          New Group
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map(group => (
          <div key={group.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-blue-50 rounded-lg text-blue-600 mr-4">
                <Building size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{group.name}</h3>
                <div className="flex items-center text-sm text-gray-500">
                  <MapPin size={14} className="mr-1" />
                  {group.location}
                </div>
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Share Value:</span>
                <span className="font-medium">{group.shareValue} RWF</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Meeting Day:</span>
                <span className="font-medium">{group.meetingDay}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Savings:</span>
                <span className="font-medium text-green-600">{group.totalSavings.toLocaleString()} RWF</span>
              </div>
            </div>

            <button className="w-full mt-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              Manage Settings
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}