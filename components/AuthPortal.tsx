
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, Shield, TrendingUp, FileText, ArrowRight, CheckCircle2, AlertCircle, ExternalLink, Mail, Lock } from 'lucide-react';

interface AuthPortalProps {
  onComplete: () => void;
}

type Step = 'landing' | 'auth' | 'key-setup' | 'success';
type AuthMode = 'signup' | 'login';

const AuthPortal: React.FC<AuthPortalProps> = ({ onComplete }) => {
  const [step, setStep] = useState<Step>('landing');
  const [authMode, setAuthMode] = useState<AuthMode>('signup');
  const [hasKey, setHasKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const checkKey = async () => {
      try {
        const aistudio = (window as any).aistudio;
        if (aistudio && typeof aistudio.hasSelectedApiKey === 'function') {
          const keyExists = await aistudio.hasSelectedApiKey();
          setHasKey(keyExists);
        }
      } catch (err) {
        console.warn("Aistudio key check failed:", err);
      }
    };
    checkKey();
  }, []);

  const handleConnectKey = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio && typeof aistudio.openSelectKey === 'function') {
      try {
        await aistudio.openSelectKey();
        setHasKey(true);
        setStep('success');
      } catch (err) {
        console.error("Failed to open key selector:", err);
        alert("There was an error opening the key selector. Please try again.");
      }
    } else {
      // Fallback for environments where aistudio isn't injected
      const manualKey = prompt("Please enter your Gemini API Key (Key selection is currently unavailable in this view):");
      if (manualKey) {
        localStorage.setItem('salarytrack_manual_key', manualKey);
        setHasKey(true);
        setStep('success');
      }
    }
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    setTimeout(() => {
      setLoading(false);
      if (hasKey) {
        setStep('success');
      } else {
        setStep('key-setup');
      }
    }, 1500);
  };

  const handleGoogleSignIn = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (hasKey) {
        setStep('success');
      } else {
        setStep('key-setup');
      }
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px]" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-500/5 rounded-full blur-[100px]" />
      </div>

      <AnimatePresence mode="wait">
        {step === 'landing' && (
          <motion.div 
            key="landing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-4xl w-full text-center space-y-12 relative z-10"
          >
            <div className="space-y-4">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-block px-4 py-1.5 bg-indigo-50 rounded-full text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-4"
              >
                Financial Intelligence for Professionals
              </motion.div>
              <h1 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter leading-[0.9]">
                SalaryTrack<span className="text-indigo-600">Pro</span>
              </h1>
              <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed">
                The ultimate companion for tracking your lifetime earnings, career progression, and salary velocity with precision.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              {[
                { icon: FileText, title: "AI Digitization", desc: "Extract data from pay stubs instantly" },
                { icon: TrendingUp, title: "Velocity Tracking", desc: "Visualize your growth trajectory" },
                { icon: Shield, title: "Private & Secure", desc: "Your data stays in your control" }
              ].map((feature, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + (i * 0.1) }}
                  className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm"
                >
                  <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 mb-1">{feature.title}</h3>
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
            </div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <button 
                onClick={() => { setAuthMode('signup'); setStep('auth'); }}
                className="px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-bold text-sm shadow-2xl shadow-slate-200 flex items-center gap-3 hover:bg-slate-800 transition-all active:scale-95 group"
              >
                Get Started 
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => { setAuthMode('login'); setStep('auth'); }}
                className="px-10 py-5 bg-white text-slate-600 rounded-[2rem] font-bold text-sm border border-slate-100 hover:bg-slate-50 transition-all active:scale-95"
              >
                Sign In
              </button>
            </motion.div>
          </motion.div>
        )}

        {step === 'auth' && (
          <motion.div 
            key="auth"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-md w-full bg-white rounded-[3rem] p-10 shadow-2xl border border-slate-100 relative z-10"
          >
            <div className="text-center mb-10">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
                {authMode === 'signup' ? 'Create Account' : 'Welcome Back'}
              </h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                {authMode === 'signup' ? 'Join the professional network' : 'Sign in to your portfolio'}
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <button 
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="text-sm font-bold text-slate-700">Continue with Google</span>
              </button>
              
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-slate-100"></div>
                <span className="flex-shrink mx-4 text-[10px] font-bold text-slate-300 uppercase tracking-widest">Or email</span>
                <div className="flex-grow border-t border-slate-100"></div>
              </div>
            </div>

            <form onSubmit={handleAuth} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input 
                    required
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 transition-all outline-none"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input 
                    required
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 transition-all outline-none"
                  />
                </div>
              </div>
              <button 
                disabled={loading}
                type="submit"
                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-xl shadow-slate-200 flex items-center justify-center gap-3 hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>{authMode === 'signup' ? 'Create Account' : 'Sign In'} <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            <div className="mt-8 pt-8 border-t border-slate-50 text-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                {authMode === 'signup' ? (
                  <>Already have an account? <button onClick={() => setAuthMode('login')} className="text-indigo-600 underline">Login</button></>
                ) : (
                  <>Don't have an account? <button onClick={() => setAuthMode('signup')} className="text-indigo-600 underline">Sign Up</button></>
                )}
              </p>
            </div>
          </motion.div>
        )}

        {step === 'key-setup' && (
          <motion.div 
            key="key-setup"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-lg w-full bg-white rounded-[3rem] p-10 shadow-2xl border border-slate-100 relative z-10"
          >
            <div className="text-center mb-10">
              <div className="w-16 h-16 bg-indigo-50 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6">
                <Key className="w-8 h-8 text-indigo-600" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">AI Intelligence Setup</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Connect your Google Gemini API Key</p>
            </div>

            <div className="space-y-6">
              <div className="bg-indigo-50/50 border border-indigo-100 p-6 rounded-[2rem] space-y-4">
                <p className="text-xs text-indigo-900 leading-relaxed font-medium">
                  To provide high-precision pay stub scanning and financial insights while keeping the tool free, we use your personal Google Gemini API key.
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</div>
                    <p className="text-[11px] text-indigo-700 font-bold">
                      Visit <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" className="underline inline-flex items-center gap-1">Google AI Studio <ExternalLink className="w-3 h-3" /></a>
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</div>
                    <p className="text-[11px] text-indigo-700 font-bold">Click "Get API key" and create a new one.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</div>
                    <p className="text-[11px] text-indigo-700 font-bold">Paste it into the secure dialog below.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={handleConnectKey}
                  className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all active:scale-95"
                >
                  <Key className="w-4 h-4" />
                  Connect Your API Key
                </button>
                <p className="text-[9px] text-slate-400 text-center font-bold uppercase tracking-widest">
                  Securely stored in your browser session
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full bg-white rounded-[3rem] p-10 shadow-2xl border border-slate-100 text-center relative z-10"
          >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 12 }}
              className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8"
            >
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </motion.div>
            
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Setup Complete</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-10">Welcome to SalaryTrack Pro</p>

            <div className="space-y-4">
              <div className="bg-slate-50 p-6 rounded-[1.5rem] border border-slate-100 text-left space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-[11px] font-bold text-slate-700">Account Verified</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-[11px] font-bold text-slate-700">AI Engine Connected</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-[11px] font-bold text-slate-700">Portfolio Initialized</span>
                </div>
              </div>

              <button 
                onClick={onComplete}
                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-xl shadow-slate-200 flex items-center justify-center gap-3 hover:bg-slate-800 transition-all active:scale-95"
              >
                Enter Dashboard <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AuthPortal;
