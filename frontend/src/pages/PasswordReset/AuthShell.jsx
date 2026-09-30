import React from 'react';
import { Link } from 'react-router-dom';
import '../LoginPage/LoginPage.css';

/*
 * The frame around the two password-reset pages: the logo home, a heading,
 * and a card in the same style as the sign-in page they are reached from.
 */
export default function AuthShell({ darkMode, title, subtitle, children }) {
  const bgClass = darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900';
  const cardClass = darkMode
    ? 'bg-slate-900/80 border-slate-800 text-slate-100'
    : 'bg-white border-slate-200 text-slate-900';

  return (
    <div className={`min-h-screen w-full flex flex-col ${bgClass}`}>
      <header className="p-6 sm:p-10">
        <Link to="/" className="inline-flex items-center gap-3" aria-label="EduAUST home">
          <span className="bg-emerald-600 text-white w-10 h-10 rounded-2xl font-black text-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            E
          </span>
          <span className="text-2xl font-black bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent tracking-tight">
            EduAUST
          </span>
        </Link>
      </header>

      <main className="flex-1 flex items-start sm:items-center justify-center px-6 pb-16">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2">
            <h1 className={`text-3xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {title}
            </h1>
            {subtitle && (
              <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{subtitle}</p>
            )}
          </div>

          <div className={`login-card ${cardClass}`}>{children}</div>
        </div>
      </main>
    </div>
  );
}
