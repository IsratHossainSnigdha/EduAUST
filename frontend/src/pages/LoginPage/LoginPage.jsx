import React, { useState } from 'react';
import {
  Eye, EyeOff, ArrowRight, ShieldCheck, Users, BookOpen,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { apiPost, saveAuth, firstError } from '../../lib/auth';
import { setRole, STUDENT, TUTOR } from '../../lib/useRole';
import GoogleSignInButton from '../../components/GoogleSignInButton';
import './LoginPage.css';

export default function LoginPage({ darkMode }) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  /*
   * Whether to issue a refresh token. Nothing on the page could change this,
   * so it was always off: no refresh token was ever issued, and every session
   * ended when the one-hour access token expired. Staying signed in is the
   * default now, with the box there for a shared computer.
   */
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const bgClass = darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900';
  const cardBgClass = darkMode ? 'bg-slate-900/80 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900';
  const inputBgClass = darkMode ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-600 focus:border-emerald-500' : 'bg-slate-50 border-slate-250 text-slate-900 placeholder-slate-400 focus:border-emerald-500';
  const labelTextClass = darkMode ? 'text-slate-400' : 'text-slate-600';
  const subTextClass = darkMode ? 'text-slate-400' : 'text-slate-600';
  const welcomeTextClass = darkMode ? 'text-white' : 'text-slate-900';

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Addresses are not case-sensitive, so neither is this check.
    if (!email.trim().toLowerCase().endsWith('@aust.edu')) {
      setError('Please use a valid AUST email address (@aust.edu).');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    setError('');
    setSubmitting(true);

    const { ok, body } = await apiPost('/auth/login', {
      identifier: email.trim(),
      password,
      remember: rememberMe,
    });

    if (!ok) {
      setSubmitting(false);
      setError(firstError(body, 'Unable to sign in. Please try again.'));
      return;
    }

    saveAuth(body);

    // A tutor lands on their own dashboard, not the student one; setRole keeps
    // the rest of the app in step. Non-tutors, and dual-role accounts, default
    // to the student side.
    if (body.user?.isTutor) {
      setRole(TUTOR);
      navigate('/tutor-dashboard');
    } else {
      setRole(STUDENT);
      navigate('/dashboard');
    }
  };

  return (
    <div className={`login-container ${bgClass}`}>
      <div className="login-body-wrapper">

        {/* LEFT SIDE: LOGIN FORM */}
        <div className="login-form-side">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
              <div className="bg-emerald-600 text-white w-10 h-10 rounded-2xl font-black text-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">E</div>
              <span className="text-2xl font-black bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent tracking-tight">EduAUST</span>
            </div>
          </div>

          <div className="login-form-content space-y-8">
            <div className="space-y-3">
              <h1 className={`text-3xl sm:text-4xl font-black tracking-tight ${welcomeTextClass}`}>Welcome back</h1>
              <p className={subTextClass}>Sign in to your EduAUST account.</p>
            </div>

            {error && <p role="alert" className="text-red-500 text-sm font-semibold bg-red-500/10 p-3 rounded-xl">{error}</p>}

            <div className={`login-card ${cardBgClass} shadow-xl`}>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label htmlFor="login-email" className={`text-xs font-bold uppercase ${labelTextClass}`}>AUST Email</label>
                  <input id="login-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={`login-input ${inputBgClass}`} placeholder="ishrat.cse.20230204017@aust.edu" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="login-password" className={`text-xs font-bold uppercase ${labelTextClass}`}>Password</label>
                    {/* The server has always been able to reset a password;
                        nothing on the site led there. */}
                    <Link to="/forgot-password" className="text-xs font-bold text-emerald-600 hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <input id="login-password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required className={`login-input ${inputBgClass}`} placeholder="••••••••" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      aria-pressed={showPassword}
                      className="absolute right-4 top-4 text-slate-400"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <label className={`flex items-center gap-2 text-xs font-semibold cursor-pointer ${labelTextClass}`}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 accent-emerald-600 rounded"
                  />
                  Keep me signed in
                </label>

                <button type="submit" disabled={submitting} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-wait text-white py-3.5 rounded-2xl font-bold transition-all">
                  {submitting ? 'Signing in…' : <>Sign In <ArrowRight size={16} className="inline ml-1" /></>}
                </button>
              </form>

              <div className="flex items-center gap-3 my-5">
                <span className={`h-px flex-1 ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`} />
                <span className={`text-xs font-semibold ${subTextClass}`}>OR</span>
                <span className={`h-px flex-1 ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`} />
              </div>

              <GoogleSignInButton darkMode={darkMode} onError={setError} />

              {/* The only way from here to registration used to be the
                  landing page. */}
              <p className={`text-center text-xs mt-6 ${subTextClass}`}>
                New to EduAUST?{' '}
                <Link to="/signup" className="font-bold text-emerald-600 hover:underline">
                  Create an account
                </Link>
              </p>
            </div>
          </div>
          <div />
        </div>

        {/* RIGHT SIDE: DESIGN */}
        <div className="login-design-side">
          <div className="login-design-gradient" />
          <div className="login-design-content space-y-6">
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