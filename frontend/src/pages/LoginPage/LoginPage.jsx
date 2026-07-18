import React, { useState } from 'react';
import { 
  Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, 
  Users, BookOpen, Sparkles, Sun, Moon 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function LoginPage({ 
  darkMode, 
  toggleDarkMode, 
  setCurrentPage 
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const bgClass = darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900';
  const cardBgClass = darkMode ? 'bg-slate-900/80 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900';
  const inputBgClass = darkMode ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-600 focus:border-emerald-500' : 'bg-slate-50 border-slate-250 text-slate-900 placeholder-slate-400 focus:border-emerald-500';
  const labelTextClass = darkMode ? 'text-slate-400' : 'text-slate-600';
  const subTextClass = darkMode ? 'text-slate-400' : 'text-slate-600';
  const welcomeTextClass = darkMode ? 'text-white' : 'text-slate-900';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.endsWith('@aust.edu')) {
      setError('Please use a valid AUST email address (@aust.edu).');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    setError('');
    navigate('/dashboard');
  };

  return (
    <div className={`min-h-screen w-full font-sans antialiased flex flex-col justify-between transition-colors duration-300 ${bgClass}`}>
      <div className="flex-grow flex flex-col lg:flex-row w-full min-h-[calc(100vh-60px)]">
        
        {/* LEFT SIDE: LOGIN FORM */}
        <div className="w-full lg:w-[45%] flex flex-col justify-between p-8 sm:p-12 xl:p-16 relative">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentPage('landing')}>
              <div className="bg-emerald-600 text-white w-10 h-10 rounded-2xl font-black text-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">E</div>
              <span className="text-2xl font-black bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent tracking-tight">EduAUST</span>
            </div>
          </div>

          <div className="my-auto py-10 max-w-md w-full mx-auto space-y-8">
            <div className="space-y-3">
              <h1 className={`text-3xl sm:text-4xl font-black tracking-tight ${welcomeTextClass}`}>Welcome back</h1>
              <p className={subTextClass}>Sign in to your EduAUST account.</p>
            </div>

            {error && <p className="text-red-500 text-sm font-semibold bg-red-500/10 p-3 rounded-xl">{error}</p>}

            <div className={`p-8 rounded-3xl border ${cardBgClass} shadow-xl`}>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className={`text-xs font-bold uppercase ${labelTextClass}`}>AUST Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={`w-full p-3.5 rounded-2xl border ${inputBgClass}`} placeholder="ishrat.cse.20230204017@aust.edu" />
                </div>
                
                <div className="space-y-2">
                  <label className={`text-xs font-bold uppercase ${labelTextClass}`}>Password</label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required className={`w-full p-3.5 rounded-2xl border ${inputBgClass}`} placeholder="••••••••" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-slate-400">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-2xl font-bold transition-all">
                  Sign In <ArrowRight size={16} className="inline ml-1" />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: DESIGN */}
        <div className="hidden lg:flex lg:w-[55%] relative flex-col justify-center p-16 bg-[#0b1120] text-white overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1120] to-transparent z-10" />
          <div className="relative z-20 space-y-6">
            <h2 className="text-5xl font-extrabold leading-tight">Peer learning.<br /> Right <span className="text-emerald-500">on campus.</span></h2>
            <p className="text-slate-300 text-lg">Connect with verified peers, ace your courses, and achieve your goals together.</p>
            
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-4">
                <Users className="text-emerald-500" /> 
                <div>
                  <h4 className="font-bold">Verified Community</h4>
                  <p className="text-slate-400 text-sm">All users are verified AUST students.</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <BookOpen className="text-emerald-500" /> 
                <div>
                  <h4 className="font-bold">Quality Learning</h4>
                  <p className="text-slate-400 text-sm">Find the right tutor for your courses.</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <ShieldCheck className="text-emerald-500" /> 
                <div>
                  <h4 className="font-bold">Safe & Secure</h4>
                  <p className="text-slate-400 text-sm">Your data is encrypted and protected.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}