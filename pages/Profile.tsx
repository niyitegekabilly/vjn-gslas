
import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../App';
import { api } from '../api/client';
import { LABELS } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { User, UserRole } from '../types';
import { User as UserIcon, Lock, Mail, Phone, Calendar, Shield, Save, Loader2, Key, ShieldCheck, Check, Sparkles } from 'lucide-react';

export default function Profile() {
  const { lang, showHelpAssistant, setShowHelpAssistant } = useContext(AppContext);
  const labels = LABELS[lang];
  const { user } = useAuth();
  
  // Local state for form fields
  const [phone, setPhone] = useState(user?.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user?.twoFactorEnabled || false);
  
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [updatingSecurity, setUpdatingSecurity] = useState(false);
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  // Reset message after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setUpdatingProfile(true);
    try {
      await api.updateUser(user.id, { phone });
      setMessage({ type: 'success', text: labels.updateSuccess });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: "Passwords do not match" });
      return;
    }
    // Simulate current password check (In real app, backend handles this validation)
    if (user.passwordHash && currentPassword !== user.passwordHash) {
        setMessage({ type: 'error', text: "Incorrect current password" });
        return;
    }

    setUpdatingPassword(true);
    try {
      await api.updateUser(user.id, { passwordHash: newPassword });
      setMessage({ type: 'success', text: "Password changed successfully" });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleSecurityUpdate = async (newVal: boolean) => {
    if (!user) return;
    setUpdatingSecurity(true);
    try {
        await api.updateUser(user.id, { twoFactorEnabled: newVal });
        setTwoFactorEnabled(newVal);
        setMessage({ type: 'success', text: `Two-Factor Authentication ${newVal ? 'Enabled' : 'Disabled'}` });
    } catch (err: any) {
        setMessage({ type: 'error', text: err.message });
        setTwoFactorEnabled(!newVal); // Revert
    } finally {
        setUpdatingSecurity(false);
    }
  };

  if (!user) return <div className="p-8 text-center">Please log in to view profile.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <h2 className="text-2xl font-bold text-gray-800">{labels.profile}</h2>

      {message && (
        <div className={`p-4 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <UserIcon size={24} />
            </div>
            <h3 className="font-bold text-gray-800">{labels.personalInfo}</h3>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-white text-2xl font-bold">
                {user.fullName.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900">{user.fullName}</h4>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {user.role}
                </span>
              </div>
            </div>

            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{labels.emailAddr}</label>
                <div className="flex items-center px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
                  <Mail size={16} className="mr-2 text-gray-400" />
                  {user.email}
                </div>
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{labels.phoneNumber}</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-3 text-gray-400" />
                  <input 
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                 <button 
                   type="submit" 
                   disabled={updatingProfile}
                   className="w-full flex justify-center items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                 >
                   {updatingProfile ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save size={18} className="mr-2" />}
                   {labels.updateProfile}
                 </button>
              </div>
            </form>

            <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-4 text-xs text-gray-500">
               <div>
                 <p className="uppercase font-bold text-gray-400 mb-1">User ID</p>
                 <p className="font-mono">{user.id}</p>
               </div>
               <div>
                 <p className="uppercase font-bold text-gray-400 mb-1">{labels.lastLogin}</p>
                 <p>{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}</p>
               </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
            {/* Preferences */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-fit">
                <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex">
                        <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg mr-4 h-fit">
                        <Sparkles size={24} />
                        </div>
                        <div>
                        <h3 className="text-lg font-medium text-gray-900">Help Assistant</h3>
                        <p className="text-sm text-gray-500 mt-1">Show the AI support button in the corner.</p>
                        </div>
                    </div>
                    <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                        <input 
                            type="checkbox" 
                            id="help-toggle-profile"
                            className="peer absolute opacity-0 w-0 h-0"
                            checked={showHelpAssistant}
                            onChange={(e) => setShowHelpAssistant(e.target.checked)}
                        />
                        <label 
                            htmlFor="help-toggle-profile"
                            className="block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer peer-checked:bg-yellow-500 transition-colors"
                        ></label>
                        <div className="absolute left-0 top-0 w-6 h-6 bg-white rounded-full border border-gray-300 transition-transform duration-200 ease-in-out peer-checked:translate-x-full peer-checked:border-yellow-500 shadow-sm"></div>
                    </div>
                </div>
            </div>

            {/* Security Settings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-fit">
            <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                <Shield size={24} />
                </div>
                <h3 className="font-bold text-gray-800">{labels.security}</h3>
            </div>
            
            <div className="p-6">
                <h4 className="text-sm font-bold text-gray-700 mb-4">{labels.changePassword}</h4>
                <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{labels.currentPassword}</label>
                    <div className="relative">
                    <Key size={16} className="absolute left-3 top-2.5 text-gray-400" />
                    <input 
                        type="password"
                        required
                        value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                    />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{labels.newPassword}</label>
                    <div className="relative">
                    <Lock size={16} className="absolute left-3 top-2.5 text-gray-400" />
                    <input 
                        type="password"
                        required
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                    />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{labels.confirmPassword}</label>
                    <div className="relative">
                    <Lock size={16} className="absolute left-3 top-2.5 text-gray-400" />
                    <input 
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                    />
                    </div>
                </div>

                <div className="pt-2">
                    <button 
                    type="submit" 
                    disabled={updatingPassword}
                    className="w-full flex justify-center items-center px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50"
                    >
                    {updatingPassword ? <Loader2 className="animate-spin mr-2" size={18} /> : labels.save}
                    </button>
                </div>
                </form>
            </div>
            </div>

            {/* 2FA Toggle */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-fit">
                <div className="p-6 flex items-start gap-4">
                    <div className={`p-3 rounded-full flex-shrink-0 ${twoFactorEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                        <ShieldCheck size={24} />
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-gray-800">Two-Factor Authentication</h3>
                            <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                                <input 
                                    type="checkbox" 
                                    id="2fa-toggle"
                                    className="peer absolute opacity-0 w-0 h-0"
                                    checked={twoFactorEnabled}
                                    onChange={(e) => handleSecurityUpdate(e.target.checked)}
                                    disabled={updatingSecurity}
                                />
                                <label 
                                    htmlFor="2fa-toggle"
                                    className={`block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer peer-checked:bg-green-500 transition-colors ${updatingSecurity ? 'opacity-50 cursor-not-allowed' : ''}`}
                                ></label>
                                <div className="absolute left-0 top-0 w-6 h-6 bg-white rounded-full border border-gray-300 transition-transform duration-200 ease-in-out peer-checked:translate-x-full peer-checked:border-green-500 flex items-center justify-center shadow-sm">
                                    {updatingSecurity && <Loader2 size={12} className="animate-spin text-gray-500"/>}
                                </div>
                            </div>
                        </div>
                        <p className="text-sm text-gray-500">
                            Secure your account with an extra layer of protection. When enabled, you will receive a verification code during login.
                        </p>
                        {twoFactorEnabled && (
                            <div className="mt-3 text-xs bg-green-50 text-green-800 p-2 rounded border border-green-100 flex items-center">
                                <Check size={14} className="mr-1" /> Active on your account.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
