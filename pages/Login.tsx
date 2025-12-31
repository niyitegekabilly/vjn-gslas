
import React, { useState, useContext } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Loader2, AlertCircle, Database, Check, X } from 'lucide-react';
import { AppContext } from '../App';
import { LABELS } from '../constants';
import { api } from '../api/client';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [seedMessage, setSeedMessage] = useState('');
  const [showSeedConfirm, setShowSeedConfirm] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const { lang, setLang } = useContext(AppContext);
  const labels = LABELS[lang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSeed = async () => {
    setShowSeedConfirm(false);
    try {
      setSeedMessage("Seeding database (this may take 10s)...");
      const res = await api.seedDatabase();
      setSeedMessage(res.message || "Done");
      if (res.success) {
        setEmail("admin@vjn.rw");
        setPassword("admin123");
      }
    } catch (e: any) {
      setSeedMessage("Error: " + e.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
      {/* Language Switcher for Login */}
      <div className="absolute top-4 right-4 flex gap-2">
         <button onClick={() => setLang('en')} className={`px-3 py-1 rounded text-xs font-bold ${lang === 'en' ? 'bg-slate-800 text-white' : 'bg-white text-gray-600'}`}>EN</button>
         <button onClick={() => setLang('rw')} className={`px-3 py-1 rounded text-xs font-bold ${lang === 'rw' ? 'bg-slate-800 text-white' : 'bg-white text-gray-600'}`}>RW</button>
      </div>

      <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-8">
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-md">
              V
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">{labels.appName}</h2>
          <p className="text-center text-gray-500 text-sm mb-8">{labels.securePortal}</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700 text-sm">
              <AlertCircle size={16} className="mr-2 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{labels.emailAddr}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input 
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  placeholder="name@vjn.rw"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{labels.password}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input 
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors flex justify-center items-center"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : labels.signIn}
            </button>
          </form>
        </div>
        <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-500">
            {labels.unauthMsg}
          </p>
        </div>
      </div>
      <div className="mt-8 text-center text-gray-400 text-xs">
        <p>Use <strong>admin@vjn.rw</strong> / <strong>admin123</strong></p>
        
        {!showSeedConfirm ? (
          <button 
            onClick={() => setShowSeedConfirm(true)} 
            className="mt-4 text-blue-500 hover:underline flex items-center justify-center mx-auto transition-colors"
          >
             <Database size={12} className="mr-1" /> Initialize Database (Groups, Members, Loans)
          </button>
        ) : (
          <div className="mt-4 bg-white p-3 rounded-lg shadow-sm border border-gray-200 inline-block animate-in fade-in slide-in-from-bottom-2">
             <p className="text-gray-700 font-semibold mb-2">Seed Database with Demo Data?</p>
             <div className="flex justify-center gap-2">
                <button 
                  onClick={handleSeed}
                  className="px-3 py-1 bg-green-600 text-white rounded text-xs font-bold flex items-center hover:bg-green-700"
                >
                  <Check size={12} className="mr-1" /> Confirm
                </button>
                <button 
                  onClick={() => setShowSeedConfirm(false)}
                  className="px-3 py-1 bg-gray-200 text-gray-600 rounded text-xs font-bold flex items-center hover:bg-gray-300"
                >
                  <X size={12} className="mr-1" /> Cancel
                </button>
             </div>
          </div>
        )}

        {seedMessage && <p className="text-green-600 mt-3 font-medium animate-pulse">{seedMessage}</p>}
      </div>
    </div>
  );
}
