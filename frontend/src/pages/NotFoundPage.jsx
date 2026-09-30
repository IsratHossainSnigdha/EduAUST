import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';
import { isAuthenticated } from '../lib/auth';

/*
 * A page for a URL that does not exist.
 *
 * There was no catch-all route, so a mistyped or stale link rendered a blank
 * white page with no way back. This gives it a way home — to the dashboard if
 * they are signed in, otherwise to the landing page.
 */
export default function NotFoundPage({ darkMode }) {
  const navigate = useNavigate();

  const bgClass = darkMode ? 'bg-[#0b0f19] text-slate-100' : 'bg-slate-50 text-slate-900';
  const muted = darkMode ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className={`min-h-screen w-full font-sans antialiased flex items-center justify-center p-6 ${bgClass}`}>
      <div className="text-center max-w-sm">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-6">
          <Compass size={28} />
        </div>

        <p className="text-5xl font-black text-emerald-500">404</p>

        <h1 className={`text-xl font-black mt-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          Page not found
        </h1>

        <p className={`text-sm mt-2 ${muted}`}>
          The page you are looking for does not exist or may have moved.
        </p>

        <button
          type="button"
          onClick={() => navigate(isAuthenticated() ? '/dashboard' : '/')}
          className="inline-flex items-center gap-2 mt-6 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition"
        >
          <Home size={14} />
          {isAuthenticated() ? 'Back to dashboard' : 'Back to home'}
        </button>
      </div>
    </div>
  );
}
