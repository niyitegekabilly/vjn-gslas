
import React, { useState, useContext, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Loader2, AlertCircle, ShieldCheck, ArrowRight, ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react';
import { AppContext } from '../App';
import { LABELS } from '../constants';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Auth State
  const [step, setStep] = useState<'CREDENTIALS' | '2FA' | 'FORGOT_PASSWORD'>('CREDENTIALS');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [tempUserId, setTempUserId] = useState<string | null>(null);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  const { login, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const { lang, setLang } = useContext(AppContext);
  const labels = LABELS[lang];

  // Focus first input on 2FA step
  useEffect(() => {
    if (step === '2FA') {
        otpInputRefs.current[0]?.focus();
    }
  }, [step]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    try {
      const response = await login(email, password);
      if (response.needs2FA && response.userId) {
        setTempUserId(response.userId);
        setStep('2FA');
        // Simulate sending code visually
        alert(`DEMO: Your 2FA code is 123456`);
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otpCode];
    newOtp[index] = value;
    setOtpCode(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
        otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
        otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempUserId) return;
    
    const code = otpCode.join('');
    if (code.length !== 6) {
        setError("Please enter a 6-digit code.");
        return;
    }

    setError('');
    setIsSubmitting(true);
    try {
        await verifyOtp(tempUserId, code);
        navigate('/');
    } catch (err: any) {
        setError(err.message || 'Invalid code');
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
        setError('Please enter your email address first.');
        return;
    }
    
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
        setIsSubmitting(false);
        setSuccessMsg(`If an account exists for ${email}, a reset link has been sent.`);
        setTimeout(() => {
            setSuccessMsg('');
            setStep('CREDENTIALS');
        }, 3000);
    }, 1000);
  };

  return (
    <div 
      className="min-h-screen flex flex-col justify-center items-center p-4 bg-cover bg-center bg-no-repeat bg-fixed relative font-sans"
      style={{
        backgroundImage: `url('https://odiukwlqorbjuipntmzj.supabase.co/storage/v1/object/public/images/particle-lines-futuristic-gradie.png')`
      }}
    >
      {/* Deep Blue Overlay */}
      <div className="absolute inset-0 bg-blue-950/60 backdrop-blur-[3px]"></div>

      {/* Main Login Card - 50% Transparency */}
      <div className="max-w-md w-full bg-white/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Language Switcher moved inside card */}
        <div className="absolute top-4 right-4 flex gap-2 z-20">
           <button 
              onClick={() => setLang('en')} 
              className={`p-1.5 rounded-md transition-all border ${
                  lang === 'en' 
                  ? 'bg-blue-600 border-blue-500 shadow-blue-500/30 shadow-md ring-2 ring-blue-400/50 scale-110' 
                  : 'bg-white/40 border-white/30 hover:bg-white/60 backdrop-blur-sm grayscale hover:grayscale-0'
              }`}
              title="English"
           >
              <img 
                src="https://flagcdn.com/w40/gb.png" 
                alt="English" 
                className="w-6 h-4 object-cover rounded-[2px] shadow-sm"
              />
           </button>
           <button 
              onClick={() => setLang('rw')} 
              className={`p-1.5 rounded-md transition-all border ${
                  lang === 'rw' 
                  ? 'bg-blue-600 border-blue-500 shadow-blue-500/30 shadow-md ring-2 ring-blue-400/50 scale-110' 
                  : 'bg-white/40 border-white/30 hover:bg-white/60 backdrop-blur-sm grayscale hover:grayscale-0'
              }`}
              title="Kinyarwanda"
           >
              <img 
                src="https://flagcdn.com/w40/rw.png" 
                alt="Kinyarwanda" 
                className="w-6 h-4 object-cover rounded-[2px] shadow-sm"
              />
           </button>
        </div>

        <div className="p-8 md:p-10">
          <div className="flex justify-center mb-8">
            <div className="bg-white/20 p-3 rounded-full backdrop-blur-md border border-white/30 shadow-2xl ring-1 ring-white/40">
                {step === 'CREDENTIALS' ? (
                    <img 
                        src="https://odiukwlqorbjuipntmzj.supabase.co/storage/v1/object/public/images/logo.png"
                        alt="VJN Logo"
                        className="w-20 h-20 object-contain rounded-full drop-shadow-md filter brightness-110"
                    />
                ) : (
                    <div className="w-20 h-20 flex items-center justify-center rounded-full bg-gradient-to-tr from-blue-900 to-blue-800 text-white shadow-inner">
                        {step === '2FA' ? <ShieldCheck size={36} /> : <KeyRound size={36} />}
                    </div>
                )}
            </div>
          </div>
          
          <h2 className="text-3xl font-extrabold text-center text-blue-950 mb-3 tracking-tight drop-shadow-sm">
            {step === '2FA' ? 'Verify Identity' : (step === 'FORGOT_PASSWORD' ? 'Recover Access' : labels.appName)}
          </h2>
          
          <p className="text-center text-blue-900 text-sm mb-8 font-semibold px-4 leading-relaxed opacity-90">
            {step === '2FA' 
                ? `Enter the secure code sent to your inbox` 
                : (step === 'FORGOT_PASSWORD' ? 'Enter your email to receive a recovery link' : labels.securePortal)
            }
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50/90 border border-red-200/50 rounded-xl flex items-start text-red-900 text-sm animate-in slide-in-from-top-2 shadow-sm backdrop-blur-sm">
              <AlertCircle size={18} className="mr-3 flex-shrink-0 mt-0.5 text-red-700" />
              <span className="font-bold">{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 bg-green-50/90 border border-green-200/50 rounded-xl flex items-start text-green-900 text-sm animate-in slide-in-from-top-2 shadow-sm backdrop-blur-sm">
              <CheckCircle2 size={18} className="mr-3 flex-shrink-0 mt-0.5 text-green-700" />
              <span className="font-bold">{successMsg}</span>
            </div>
          )}

          {step === 'CREDENTIALS' && (
            <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                <div>
                <label className="block text-xs font-bold text-blue-950 uppercase tracking-wider mb-2 ml-1">{labels.emailAddr}</label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="text-blue-800 group-focus-within:text-blue-600 transition-colors" size={20} />
                    </div>
                    <input 
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white/60 border border-white/50 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent focus:bg-white/90 outline-none transition-all text-blue-950 placeholder-blue-900/40 font-semibold shadow-sm"
                    placeholder="name@vjn.rw"
                    required
                    />
                </div>
                </div>

                <div>
                <label className="block text-xs font-bold text-blue-950 uppercase tracking-wider mb-2 ml-1">{labels.password}</label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="text-blue-800 group-focus-within:text-blue-600 transition-colors" size={20} />
                    </div>
                    <input 
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white/60 border border-white/50 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent focus:bg-white/90 outline-none transition-all text-blue-950 placeholder-blue-900/40 font-semibold shadow-sm"
                    placeholder="••••••••"
                    required
                    />
                </div>
                </div>

                <div className="flex justify-end">
                    <button 
                        type="button" 
                        onClick={() => { setError(''); setStep('FORGOT_PASSWORD'); }}
                        className="text-xs font-bold text-blue-800 hover:text-blue-950 transition-colors hover:underline"
                    >
                        Forgot Password?
                    </button>
                </div>

                <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full py-3.5 bg-gradient-to-r from-blue-800 to-indigo-900 text-white rounded-xl font-bold hover:from-blue-900 hover:to-indigo-950 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex justify-center items-center shadow-lg shadow-blue-900/30 border border-white/20"
                >
                {isSubmitting ? <Loader2 className="animate-spin text-white/80" size={22} /> : <span className="flex items-center tracking-wide">{labels.signIn} <ArrowRight size={18} className="ml-2"/></span>}
                </button>
            </form>
          )}

          {step === '2FA' && (
            <form onSubmit={handleVerifyOtp} className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex justify-center gap-2 md:gap-3">
                    {otpCode.map((digit, idx) => (
                        <input
                            key={idx}
                            ref={(el) => { otpInputRefs.current[idx] = el; }}
                            type="text"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(idx, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                            className="w-10 h-14 md:w-12 md:h-16 border-2 border-white/50 rounded-xl text-center text-2xl font-bold bg-white/60 text-blue-950 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/20 focus:bg-white/90 outline-none transition-all shadow-sm"
                        />
                    ))}
                </div>
                
                <div className="flex gap-4">
                    <button 
                        type="button"
                        onClick={() => setStep('CREDENTIALS')}
                        className="flex-1 py-3 border border-blue-900/30 text-blue-900 rounded-xl font-bold hover:bg-blue-50/50 transition-colors flex justify-center items-center"
                    >
                        <ArrowLeft size={18} className="mr-2"/> Back
                    </button>
                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="flex-1 py-3 bg-gradient-to-r from-green-700 to-emerald-800 text-white rounded-xl font-bold hover:from-green-800 hover:to-emerald-900 transition-all shadow-lg shadow-green-900/20 flex justify-center items-center border border-white/20"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin text-white/80" size={22} /> : 'Verify Code'}
                    </button>
                </div>
            </form>
          )}

          {step === 'FORGOT_PASSWORD' && (
            <form onSubmit={handleForgotPassword} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div>
                    <label className="block text-xs font-bold text-blue-950 uppercase tracking-wider mb-2 ml-1">{labels.emailAddr}</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Mail className="text-blue-800 group-focus-within:text-blue-600 transition-colors" size={20} />
                        </div>
                        <input 
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white/60 border border-white/50 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent focus:bg-white/90 outline-none transition-all text-blue-950 placeholder-blue-900/40 font-semibold shadow-sm"
                        placeholder="name@vjn.rw"
                        required
                        />
                    </div>
                </div>

                <div className="flex gap-4 pt-2">
                    <button 
                        type="button"
                        onClick={() => { setError(''); setStep('CREDENTIALS'); }}
                        className="flex-1 py-3 border border-blue-900/30 text-blue-900 rounded-xl font-bold hover:bg-blue-50/50 transition-colors flex justify-center items-center"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="flex-1 py-3 bg-gradient-to-r from-blue-800 to-indigo-900 text-white rounded-xl font-bold hover:from-blue-900 hover:to-indigo-950 transition-all shadow-lg shadow-blue-900/30 flex justify-center items-center border border-white/20"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin text-white/80" size={22} /> : 'Send Link'}
                    </button>
                </div>
            </form>
          )}
        </div>
        <div className="bg-blue-950/20 px-8 py-4 border-t border-white/30 text-center backdrop-blur-sm">
          <p className="text-xs text-blue-900 font-bold tracking-wide opacity-80">
            {labels.unauthMsg}
          </p>
        </div>
      </div>
    </div>
  );
}
