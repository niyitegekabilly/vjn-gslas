import React, { useContext } from 'react';
import { AppContext } from '../App';
import { LABELS } from '../constants';
import { Settings as SettingsIcon, Globe, Shield, Database, Trash2 } from 'lucide-react';
import { resetDatabase } from '../backend/db';

export default function Settings() {
  const { lang, setLang } = useContext(AppContext);
  const labels = LABELS[lang];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">{labels.status} & Configuration</h2>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
        
        {/* Language */}
        <div className="p-6 flex items-start justify-between">
          <div className="flex">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg mr-4">
              <Globe size={24} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">System Language / Ururimi</h3>
              <p className="text-sm text-gray-500 mt-1">Choose between English and Kinyarwanda.</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
             <button 
               onClick={() => setLang('en')}
               className={`px-4 py-2 rounded-lg text-sm font-medium ${lang === 'en' ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-600'}`}
             >
               English
             </button>
             <button 
               onClick={() => setLang('rw')}
               className={`px-4 py-2 rounded-lg text-sm font-medium ${lang === 'rw' ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-600'}`}
             >
               Kinyarwanda
             </button>
          </div>
        </div>

        {/* Roles */}
        <div className="p-6 flex items-start justify-between">
          <div className="flex">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg mr-4">
              <Shield size={24} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Users & Roles</h3>
              <p className="text-sm text-gray-500 mt-1">Manage admin access and group leaders.</p>
            </div>
          </div>
          <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">
            Manage Users
          </button>
        </div>

        {/* Data */}
        <div className="p-6 flex items-start justify-between">
          <div className="flex">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg mr-4">
              <Database size={24} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Data & Backup</h3>
              <p className="text-sm text-gray-500 mt-1">Export all system data for offline storage.</p>
            </div>
          </div>
          <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">
            Export JSON
          </button>
        </div>

        {/* Reset */}
        <div className="p-6 flex items-start justify-between bg-red-50">
          <div className="flex">
            <div className="p-2 bg-red-100 text-red-600 rounded-lg mr-4">
              <Trash2 size={24} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-red-900">Reset Database</h3>
              <p className="text-sm text-red-600 mt-1">Clear all local data and reset to initial state.</p>
            </div>
          </div>
          <button 
            onClick={() => {
              if(window.confirm('Are you sure you want to reset the database? This cannot be undone.')) {
                resetDatabase();
              }
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
          >
            Reset System
          </button>
        </div>
      </div>
    </div>
  );
}