
import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../App';
import { api } from '../api/client';
import { LABELS } from '../constants';
import { SystemSettings, SMSConfig, SMSTemplate, SMSLog } from '../types';
import { Settings as SettingsIcon, Save, Download, RefreshCw, AlertTriangle, ShieldCheck, Loader2, Database, MessageSquare, ToggleRight, ToggleLeft, Edit, Activity, Zap, Trash2, CheckCircle, Copy } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { TABLE_SCHEMA_SQL, RLS_POLICIES_SQL } from '../backend/schema';

export default function Settings() {
  const { lang } = useContext(AppContext);
  const labels = LABELS[lang];
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'SYSTEM' | 'SMS' | 'DATA'>('SYSTEM');

  const [sysSettings, setSysSettings] = useState<SystemSettings | null>(null);
  
  // SMS State
  const [smsConfig, setSmsConfig] = useState<SMSConfig | null>(null);
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [smsLogs, setSmsLogs] = useState<SMSLog[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<SMSTemplate | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checkingHealth, setCheckingHealth] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sys, sms, tmpl, logs] = await Promise.all([
        api.getSystemSettings(),
        api.getSMSConfig(),
        api.getSMSTemplates(),
        api.getSMSLogs()
      ]);
      setSysSettings(sys);
      setSmsConfig(sms);
      setTemplates(tmpl);
      setSmsLogs(logs.sort((a,b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()).slice(0, 50));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSystem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sysSettings || !user) return;
    setSaving(true);
    try {
      await api.updateSystemSettings(sysSettings, user.id);
      alert('Settings updated successfully');
    } catch (e) {
      console.error(e);
      alert('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingTemplate) return;
      setSaving(true);
      try {
          await api.updateSMSTemplate(editingTemplate.eventType, editingTemplate.template, editingTemplate.isEnabled);
          setTemplates(prev => prev.map(t => t.eventType === editingTemplate.eventType ? editingTemplate : t));
          setEditingTemplate(null);
      } catch (e) {
          console.error(e);
      } finally {
          setSaving(false);
      }
  };

  const toggleSMSLive = async () => {
      if (!smsConfig) return;
      try {
          await api.toggleSMSLiveMode(!smsConfig.isLiveMode);
          setSmsConfig({ ...smsConfig, isLiveMode: !smsConfig.isLiveMode });
      } catch (e) {
          console.error(e);
      }
  };

  const handleExport = async () => {
    try {
      const data = await api.getFullDatabaseBackup();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `VJN_BACKUP_${new Date().toISOString().slice(0,10)}.json`;
      a.click();
    } catch (e) {
      alert("Backup failed");
    }
  };

  const handleClearCache = () => {
    if (window.confirm("This will clear your local session and refresh the application. You will be logged out. Continue?")) {
        localStorage.clear();
        window.location.reload();
    }
  };

  const handleHealthCheck = async () => {
    setCheckingHealth(true);
    try {
        await api.getSystemSettings();
        // Artificial delay for UX
        await new Promise(r => setTimeout(r, 1000));
        alert("System Status: HEALTHY. Database connection is active.");
    } catch (e) {
        alert("System Status: UNSTABLE. Could not reach database.");
    } finally {
        setCheckingHealth(false);
    }
  };

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      alert("SQL copied to clipboard. Paste this in your Supabase SQL Editor.");
  };

  if (loading) {
    return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto text-gray-400" /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <SettingsIcon className="mr-3 text-slate-700" /> {labels.settingsTitle}
        </h2>
        <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-200">
            <button 
                onClick={() => setActiveTab('SYSTEM')}
                className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'SYSTEM' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
            >
                System
            </button>
            <button 
                onClick={() => setActiveTab('SMS')}
                className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'SMS' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
            >
                SMS & Notifications
            </button>
            <button 
                onClick={() => setActiveTab('DATA')}
                className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'DATA' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
            >
                Data & DB
            </button>
        </div>
      </div>

      {/* SYSTEM TAB */}
      {activeTab === 'SYSTEM' && sysSettings && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-left-4">
            <div className="p-6 border-b border-gray-100 bg-gray-50">
                <h3 className="font-bold text-gray-800 flex items-center">
                <ShieldCheck className="mr-2 text-blue-600" size={20} /> Security & Session
                </h3>
            </div>
            <div className="p-6">
                <form onSubmit={handleSaveSystem} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (Minutes)</label>
                        <select 
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900"
                            value={sysSettings.sessionTimeoutMinutes}
                            onChange={(e) => setSysSettings({...sysSettings, sessionTimeoutMinutes: parseInt(e.target.value)})}
                        >
                            <option value={15}>15 Minutes</option>
                            <option value={30}>30 Minutes</option>
                            <option value={60}>1 Hour</option>
                            <option value={240}>4 Hours</option>
                            <option value={480}>8 Hours</option>
                            <option value={1440}>24 Hours</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Users inactive for this period will be logged out.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Password Length</label>
                        <input 
                            type="number" 
                            min="6" 
                            max="32"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900"
                            value={sysSettings.passwordMinLength}
                            onChange={(e) => setSysSettings({...sysSettings, passwordMinLength: parseInt(e.target.value)})}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4 border-t border-gray-100 pt-6">
                    <div className="flex items-center">
                        <input 
                            type="checkbox" 
                            id="2fa"
                            className="w-4 h-4 text-blue-600 rounded"
                            checked={sysSettings.enforce2FA}
                            onChange={(e) => setSysSettings({...sysSettings, enforce2FA: e.target.checked})}
                        />
                        <label htmlFor="2fa" className="ml-2 text-sm text-gray-700 font-medium">Enforce 2FA for Admins</label>
                    </div>
                    <div className="flex items-center ml-6">
                        <input 
                            type="checkbox" 
                            id="nums"
                            className="w-4 h-4 text-blue-600 rounded"
                            checked={sysSettings.passwordRequireNumber}
                            onChange={(e) => setSysSettings({...sysSettings, passwordRequireNumber: e.target.checked})}
                        />
                        <label htmlFor="nums" className="ml-2 text-sm text-gray-700 font-medium">Require Numbers in Passwords</label>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button disabled={saving} className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-sm">
                        {saving ? <Loader2 className="animate-spin mr-2" size={18}/> : <Save className="mr-2" size={18}/>}
                        {labels.save}
                    </button>
                </div>
                </form>
            </div>
        </div>
      )}

      {/* SMS TAB */}
      {activeTab === 'SMS' && smsConfig && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              
              {/* Config Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                      <h3 className="font-bold text-gray-800 flex items-center">
                          <MessageSquare className="mr-2 text-green-600" size={20} /> SMS Gateway (MTN Rwanda)
                      </h3>
                      <div className="flex items-center">
                          <span className={`text-xs font-bold uppercase mr-2 ${smsConfig.isLiveMode ? 'text-green-600' : 'text-orange-500'}`}>
                              {smsConfig.isLiveMode ? 'Live Mode' : 'Sandbox Mode'}
                          </span>
                          <button onClick={toggleSMSLive} className="text-gray-400 hover:text-gray-600">
                              {smsConfig.isLiveMode ? <ToggleRight size={32} className="text-green-500" /> : <ToggleLeft size={32} />}
                          </button>
                      </div>
                  </div>
                  <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                          <p className="text-sm text-blue-600 font-bold uppercase mb-1">Current Usage</p>
                          <p className="text-2xl font-bold text-blue-900">{smsConfig.currentUsage} <span className="text-sm text-blue-400 font-normal">/ {smsConfig.monthlyCap}</span></p>
                          <div className="w-full bg-blue-200 h-1.5 mt-2 rounded-full overflow-hidden">
                              <div className="bg-blue-600 h-full" style={{ width: `${Math.min((smsConfig.currentUsage / smsConfig.monthlyCap) * 100, 100)}%` }}></div>
                          </div>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex flex-col justify-center">
                          <p className="text-sm text-gray-500 font-bold uppercase mb-1">Status</p>
                          <div className="flex items-center">
                              <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                              <span className="font-bold text-gray-700">Operational</span>
                          </div>
                      </div>
                      <div className="p-4 bg-orange-50 rounded-lg border border-orange-100 flex flex-col justify-center">
                          <p className="text-sm text-orange-600 font-bold uppercase mb-1">Provider</p>
                          <p className="font-bold text-orange-900">MTN MoMo API</p>
                      </div>
                  </div>
              </div>

              {/* Templates */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6 border-b border-gray-100 bg-gray-50">
                      <h3 className="font-bold text-gray-800 flex items-center">
                          <Zap className="mr-2 text-yellow-500" size={20} /> Automation Templates
                      </h3>
                  </div>
                  <div className="divide-y divide-gray-100">
                      {templates.map(tmpl => (
                          <div key={tmpl.eventType} className="p-4 hover:bg-gray-50 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                              <div className="flex-1">
                                  <div className="flex items-center mb-1">
                                      <span className="font-bold text-sm text-gray-800 mr-2">{tmpl.eventType.replace(/_/g, ' ')}</span>
                                      {tmpl.isEnabled ? (
                                          <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">ON</span>
                                      ) : (
                                          <span className="text-[10px] bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full font-bold">OFF</span>
                                      )}
                                  </div>
                                  <p className="text-xs text-gray-500 font-mono bg-gray-100 p-2 rounded border border-gray-200 break-all">
                                      {tmpl.template}
                                  </p>
                                  <p className="text-[10px] text-blue-500 mt-1">Vars: {tmpl.variables.join(', ')}</p>
                              </div>
                              <button 
                                onClick={() => setEditingTemplate(tmpl)}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              >
                                  <Edit size={18} />
                              </button>
                          </div>
                      ))}
                  </div>
              </div>

              {/* Logs */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6 border-b border-gray-100 bg-gray-50">
                      <h3 className="font-bold text-gray-800 flex items-center">
                          <Activity className="mr-2 text-slate-500" size={20} /> Recent Logs
                      </h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                          <thead className="bg-gray-100 text-gray-500 uppercase sticky top-0">
                              <tr>
                                  <th className="p-3">Time</th>
                                  <th className="p-3">To</th>
                                  <th className="p-3">Message</th>
                                  <th className="p-3">Status</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                              {smsLogs.map(log => (
                                  <tr key={log.id} className="hover:bg-gray-50">
                                      <td className="p-3 text-gray-500 whitespace-nowrap">{new Date(log.sentAt).toLocaleString()}</td>
                                      <td className="p-3 font-mono">{log.recipient}</td>
                                      <td className="p-3 text-gray-700 truncate max-w-xs">{log.message}</td>
                                      <td className="p-3">
                                          <span className={`px-2 py-0.5 rounded-full font-bold ${log.status === 'SENT' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                              {log.status}
                                          </span>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      )}

      {/* DATA TAB */}
      {activeTab === 'DATA' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            
            {/* Database Schema Viewer */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-bold text-gray-800 flex items-center">
                    <Database className="mr-2 text-blue-600" size={20} /> {labels.rlsConfig}
                    </h3>
                </div>
                <div className="p-6 space-y-4">
                    <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg text-sm flex items-start border border-yellow-200">
                        <AlertTriangle className="mr-2 flex-shrink-0 mt-0.5" size={16} />
                        <div>
                            <p className="font-bold">Missing Tables? (e.g. sms_config)</p>
                            <p>{labels.runSqlWarning}</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Table Schema (Run First)</label>
                            <div className="relative">
                                <textarea 
                                    readOnly 
                                    className="w-full h-48 p-3 bg-slate-900 text-slate-300 font-mono text-xs rounded-lg resize-y focus:outline-none"
                                    value={TABLE_SCHEMA_SQL}
                                />
                                <button 
                                    onClick={() => copyToClipboard(TABLE_SCHEMA_SQL)}
                                    className="absolute top-2 right-2 px-2 py-1 bg-white/10 hover:bg-white/20 text-white text-xs rounded transition-colors flex items-center"
                                >
                                    <Copy size={12} className="mr-1"/> {labels.copySql}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">RLS Policies (Run Second)</label>
                            <div className="relative">
                                <textarea 
                                    readOnly 
                                    className="w-full h-48 p-3 bg-slate-900 text-slate-300 font-mono text-xs rounded-lg resize-y focus:outline-none"
                                    value={RLS_POLICIES_SQL}
                                />
                                <button 
                                    onClick={() => copyToClipboard(RLS_POLICIES_SQL)}
                                    className="absolute top-2 right-2 px-2 py-1 bg-white/10 hover:bg-white/20 text-white text-xs rounded transition-colors flex items-center"
                                >
                                    <Copy size={12} className="mr-1"/> {labels.copySql}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Backup Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-bold text-gray-800 flex items-center">
                    <Database className="mr-2 text-purple-600" size={20} /> {labels.dataBackup}
                    </h3>
                </div>
                <div className="p-6 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div>
                    <p className="font-medium text-gray-900">{labels.dataBackupDesc}</p>
                    <p className="text-sm text-gray-500 mt-1">Export all system data including users, transactions, and settings.</p>
                    </div>
                    <button onClick={handleExport} className="flex items-center px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700">
                    <Download className="mr-2" size={18} /> {labels.exportJson}
                    </button>
                </div>
            </div>

            {/* System Maintenance Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-bold text-gray-800 flex items-center">
                    <Activity className="mr-2 text-orange-600" size={20} /> {labels.systemMaintenance}
                    </h3>
                </div>
                <div className="p-6 space-y-6 divide-y divide-gray-50">
                    {/* Clear Cache */}
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                        <div>
                        <p className="font-medium text-gray-900">{labels.clearCache}</p>
                        <p className="text-sm text-gray-500 mt-1">{labels.clearCacheDesc}</p>
                        </div>
                        <button onClick={handleClearCache} className="flex items-center px-5 py-2.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg hover:bg-orange-100 font-bold shadow-sm">
                        <Trash2 className="mr-2" size={18} /> {labels.clearCacheBtn}
                        </button>
                    </div>
                    
                    {/* Health Check */}
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-center pt-6">
                        <div>
                        <p className="font-medium text-gray-900">{labels.verifyHealth}</p>
                        <p className="text-sm text-gray-500 mt-1">{labels.healthCheckDesc}</p>
                        </div>
                        <button onClick={handleHealthCheck} disabled={checkingHealth} className="flex items-center px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-bold shadow-sm disabled:opacity-50">
                            {checkingHealth ? <Loader2 className="animate-spin mr-2" size={18} /> : <CheckCircle className="mr-2 text-green-600" size={18} />} 
                            Check Status
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Edit Template Modal */}
      {editingTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Edit Template: {editingTemplate.eventType}</h3>
                  <form onSubmit={handleSaveTemplate}>
                      <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Message Template</label>
                          <textarea 
                              className="w-full p-3 border border-gray-300 rounded-lg h-32 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono text-gray-800"
                              value={editingTemplate.template}
                              onChange={e => setEditingTemplate({...editingTemplate, template: e.target.value})}
                          />
                          <p className="text-xs text-right mt-1 text-gray-400">{editingTemplate.template.length} chars</p>
                          <div className="mt-2 text-xs text-blue-600 bg-blue-50 p-2 rounded">
                              Available Variables: {editingTemplate.variables.map(v => `{{${v}}}`).join(', ')}
                          </div>
                      </div>
                      <div className="mb-6 flex items-center">
                          <input 
                              type="checkbox" 
                              id="enable-tmpl"
                              className="mr-2"
                              checked={editingTemplate.isEnabled}
                              onChange={e => setEditingTemplate({...editingTemplate, isEnabled: e.target.checked})}
                          />
                          <label htmlFor="enable-tmpl" className="text-sm font-medium text-gray-700">Enable Notification</label>
                      </div>
                      <div className="flex gap-3">
                          <button type="button" onClick={() => setEditingTemplate(null)} className="flex-1 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                          <button type="submit" disabled={saving} className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold">
                              {saving ? <Loader2 className="animate-spin inline mr-1" size={16}/> : 'Save Changes'}
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
}
