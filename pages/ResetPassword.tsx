
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { Lock, Loader2, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
        setError('Invalid or missing reset token.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
    }
    
    setError('');
    setIsSubmitting(true);
    
    try {
        await api.completePasswordReset(token, password);
        setSuccess(true);
        setTimeout(() => {
            navigate('/login');
        }, 3000);
    } catch (err: any) {
        setError(err.message || "Failed to reset password. Link may be expired.");
    } finally {
        setIsSubmitting(false);
    }
  };

  if (!token) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 text-center max-w-md w-full">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid Link</h2>
                <p className="text-gray-600 mb-6">The password reset link is invalid or missing.</p>
                <button onClick={() => navigate('/login')} className="text-blue-600 font-bold hover:underline">
                    Return to Login
                </button>
            </div>
        </div>
      );
  }

  return (
    <div 
      className="min-h-screen flex flex-col justify-center items-center p-4 bg-cover bg-center bg-no-repeat bg-fixed relative font-sans"
      style={{
        backgroundImage: `url('https://odiukwlqorbjuipntmzj.supabase.co/storage/v1/object/public/images/particle-lines-futuristic-gradie.png')`
      }}
    >
      <div className="absolute inset-0 bg-blue-950/60 backdrop-blur-[3px]"></div>

      <div className="max-w-md w-full bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 overflow-hidden relative z-10 p-8">
        <div className="flex justify-center mb-6">
            <div className="bg-blue-100 p-4 rounded-full">
                <Lock size={32} className="text-blue-600" />
            </div>
        </div>

        <h2 className="text-2xl font-extrabold text-center text-gray-900 mb-2">Reset Password</h2>
        <p className="text-center text-gray-500 text-sm mb-8">Enter your new password below.</p>

        {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start text-red-800 text-sm">
              <AlertCircle size={18} className="mr-3 flex-shrink-0 mt-0.5" />
              <span className="font-bold">{error}</span>
            </div>
        )}

        {success ? (
            <div className="text-center py-8">
                <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Password Reset!</h3>
                <p className="text-gray-600 mb-4">Your password has been updated successfully.</p>
                <p className="text-sm text-gray-400">Redirecting to login...</p>
            </div>
        ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">New Password</label>
                    <input 
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                        placeholder="••••••••"
                        required
                        minLength={6}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Confirm Password</label>
                    <input 
                        type="password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                        placeholder="••••••••"
                        required
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all flex justify-center items-center shadow-lg"
                >
                    {isSubmitting ? <Loader2 className="animate-spin" size={22} /> : "Update Password"}
                </button>
            </form>
        )}
      </div>
    </div>
  );
}
