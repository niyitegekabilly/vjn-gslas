
import React, { useContext, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { LABELS } from '../constants';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { Settings as SettingsIcon, Globe, Shield, Database, Trash2, Upload, Download, X, User, Lock, Copy, Check, Loader2, AlertTriangle, LogOut, Sparkles } from 'lucide-react';
import { resetDatabase } from '../backend/db';
import { RLS_POLICIES_SQL, TABLE_SCHEMA_SQL } from '../backend/schema';

export default function Settings() {
  const { lang, setLang, showHelpAssistant, setShowHelpAssistant } = useContext(AppContext);
  const { user } = useAuth();
  const labels = LABELS[lang];
  const navigate = useNavigate();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [wiping, setWiping] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await api.getFullDatabaseBackup();
      const dataStr = JSON.stringify(data, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `vjn_full_backup_${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e: any) {
      alert("Export failed: " + e.message);
    } finally {
      setExporting(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if(!window.confirm("WARNING: Importing data will overwrite existing records. Ensure you have a backup. Continue?")) {
        e.target.value = '';
        return;
    }

    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
         try {
           const result = await api.importDatabase(content);
           if (!result.success) {
             alert("Import failed: " + result.error);
           } else {
             alert("Database imported successfully. The page will reload.");
             window.location.reload();
           }
         } catch (e: any) {
           alert("Import error: " + e.message);
         }
      }
      setImporting(false);
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  const handleRemoteWipe = async () => {
    if(!window.confirm("CRITICAL WARNING: This will permanently DELETE ALL business data (Members, Groups, Loans, etc) from the server. Users will be preserved. This cannot be undone. Are you absolutely sure?")) {
        return;
    }
    setWiping(true);
    try {
        const res = await api.wipeRemoteDatabase();
        if(res.success) {
            alert("System wiped successfully.");
            window.location.reload();
        } else {
            alert("Wipe failed: " + res.error);
        }
    } catch (e: any) {
        alert("Error: " + e.message);
    } finally {
        setWiping(false);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      <h2 className="text-2xl font-bold text-gray-800">{labels.settingsTitle}</h2>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
        
        {/* Language */}
        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg mr-4 h-fit">
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
               className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${lang === 'en' ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
             >
               <img src="https://flagcdn.com/w40/gb.png" alt="English" className="w-5 h-3.5 object-cover rounded-[2px]" />
               English
             </button>
             <button 
               onClick={() => setLang('rw')}
               className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${lang === 'rw' ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
             >
               <img src="https://flagcdn.com/w40/rw.png" alt="Kinyarwanda" className="w-5 h-3.5 object-cover rounded-[2px]" />
               Kinyarwanda
             </button>
          </div>
        </div>

        {/* Interface: Help Assistant */}
        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex">
            <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg mr-4 h-fit">
              <Sparkles size={24} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Help Assistant</h3>
              <p className="text-sm text-gray-500 mt-1">Enable the AI support button in the bottom right corner.</p>
            </div>
          </div>
          <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
              <input 
                  type="checkbox" 
                  id="help-toggle"
                  className="peer absolute opacity-0 w-0 h-0"
                  checked={showHelpAssistant}
                  onChange={(e) => setShowHelpAssistant(e.target.checked)}
              />
              <label 
                  htmlFor="help-toggle"
                  className="block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer peer-checked:bg-blue-600 transition-colors"
              ></label>
              <div className="absolute left-0 top-0 w-6 h-6 bg-white rounded-full border border-gray-300 transition-transform duration-200 ease-in-out peer-checked:translate-x-full peer-checked:border-blue-600 shadow-sm"></div>
          </div>
        </div>

        {/* Roles */}
        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg mr-4 h-fit">
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

        {/* Database & Security */}
        <div className="p-6">
          <div className="flex mb-6">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg mr-4 h-fit">
              <Lock size={24} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Database & Security (RLS)</h3>
              <p className="text-sm text-gray-500 mt-1">Configure Row Level Security policies to secure data access.</p>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
             <div className="flex border-b border-gray-200">
               <div className="px-4 py-2 bg-white border-r border-gray-200 text-sm font-bold text-gray-700">RLS Policies SQL</div>
               <div className="flex-1 bg-gray-50"></div>
               <button 
                 onClick={() => copyToClipboard(RLS_POLICIES_SQL, 'rls')}
                 className="px-4 py-2 flex items-center text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
               >
                 {copied === 'rls' ? <Check size={14} className="mr-1" /> : <Copy size={14} className="mr-1" />}
                 {copied === 'rls' ? 'Copied!' : 'Copy SQL'}
               </button>
             </div>
             <pre className="p-4 text-xs font-mono text-gray-600 overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto">
               {RLS_POLICIES_SQL}
             </pre>
          </div>
          <p className="text-xs text-amber-600 mt-2 flex items-center">
             <Shield size={12} className="mr-1" /> 
             Important: Run this SQL in your Supabase Dashboard SQL Editor to apply security rules.
          </p>
        </div>

        {/* Data Backup */}
        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg mr-4 h-fit">
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
              disabled={importing}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center disabled:opacity-50"
            >
              {importing ? <Loader2 size={16} className="animate-spin mr-2"/> : <Upload size={16} className="mr-2" />} Import
            </button>
            <button 
              onClick={handleExport}
              disabled={exporting}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center disabled:opacity-50"
            >
              {exporting ? <Loader2 size={16} className="animate-spin mr-2"/> : <Download size={16} className="mr-2" />} {labels.exportJson}
            </button>
          </div>
        </div>

        {/* Local Reset */}
        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50">
          <div className="flex">
            <div className="p-2 bg-gray-200 text-gray-600 rounded-lg mr-4 h-fit">
              <LogOut size={24} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Reset Local Session</h3>
              <p className="text-sm text-gray-500 mt-1">Clear browser cache and force logout. No remote data is lost.</p>
            </div>
          </div>
          <button 
            onClick={() => resetDatabase()}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-100 shadow-sm"
          >
            Clear & Logout
          </button>
        </div>

        {/* Remote Wipe (Admin Only) */}
        {(user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ADMIN) && (
            <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-red-50/50 border-t border-red-100">
            <div className="flex">
                <div className="p-2 bg-red-100 text-red-600 rounded-lg mr-4 h-fit">
                <Trash2 size={24} />
                </div>
                <div>
                <h3 className="text-lg font-medium text-red-900">Factory Reset System</h3>
                <p className="text-sm text-red-600 mt-1 font-medium">
                    <AlertTriangle size={14} className="inline mr-1" />
                    Danger: Permanently wipes all business data from the database.
                </p>
                </div>
            </div>
            <button 
                onClick={handleRemoteWipe}
                disabled={wiping}
                className="px-4 py-2 bg-red-600 border border-red-700 text-white rounded-lg text-sm font-bold hover:bg-red-700 shadow-sm disabled:opacity-50 flex items-center"
            >
                {wiping ? <Loader2 size={16} className="animate-spin mr-2"/> : <Trash2 size={16} className="mr-2"/>}
                Wipe Remote Data
            </button>
            </div>
        )}
      </div>
    </div>
  );
}
