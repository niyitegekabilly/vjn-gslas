
import React, { useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { LABELS } from '../constants';
import { api } from '../api/client';
import { Settings as SettingsIcon, Globe, Shield, Database, Trash2, Upload, Download, X, User } from 'lucide-react';
import { resetDatabase } from '../backend/db';

export default function Settings() {
  const { lang, setLang } = useContext(AppContext);
  const labels = LABELS[lang];
  const navigate = useNavigate();
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    const data = await api.getFullDatabaseBackup();
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `vjn_backup_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        if(window.confirm("This will overwrite all current data. Are you sure?")) {
           const result = await api.importDatabase(content);
           if (!result.success) {
             alert("Import failed: " + result.error);
           }
        }
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">{labels.settingsTitle}</h2>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
        
        {/* Language */}
        <div className="p-6 flex items-start justify-between">
          <div className="flex">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg mr-4">
              <Globe size={24} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">{labels.language}</h3>
              <p className="text-sm text-gray-500 mt-1">{labels.languageDesc}</p>
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
              <h3 className="text-lg font-medium text-gray-900">{labels.usersRoles}</h3>
              <p className="text-sm text-gray-500 mt-1">{labels.usersRolesDesc}</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/users')}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center"
          >
            <User size={16} className="mr-2" />
            {labels.manageUsers}
          </button>
        </div>

        {/* Data */}
        <div className="p-6 flex items-start justify-between">
          <div className="flex">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg mr-4">
              <Database size={24} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">{labels.dataBackup}</h3>
              <p className="text-sm text-gray-500 mt-1">{labels.dataBackupDesc}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".json" 
              onChange={handleFileChange}
            />
            <button 
              onClick={handleImportClick}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center"
            >
              <Upload size={16} className="mr-2" /> Import
            </button>
            <button 
              onClick={handleExport}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center"
            >
              <Download size={16} className="mr-2" /> {labels.exportJson}
            </button>
          </div>
        </div>

        {/* Reset */}
        <div className="p-6 flex items-start justify-between bg-red-50">
          <div className="flex">
            <div className="p-2 bg-red-100 text-red-600 rounded-lg mr-4">
              <Trash2 size={24} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-red-900">{labels.resetDb}</h3>
              <p className="text-sm text-red-600 mt-1">{labels.resetDbDesc}</p>
            </div>
          </div>
          <button 
            onClick={() => {
              if(window.confirm(labels.confirmReset)) {
                resetDatabase();
              }
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
          >
            {labels.resetSystem}
          </button>
        </div>
      </div>
    </div>
  );
}
