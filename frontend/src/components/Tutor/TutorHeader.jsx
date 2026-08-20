import React from 'react';
import {
  Search,
  Bell,
  ChevronDown,
  Sun,
  Moon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TutorHeader({
  darkMode,
  toggleDarkMode,
  searchQuery,
  setSearchQuery,
  unreadCount,
}) {
  const navigate = useNavigate();

  const inputBg = darkMode
    ? 'bg-[#111827] border-slate-700 text-white placeholder-slate-400'
    : 'bg-slate-50 border-slate-200 text-slate-900';

  const textPrimary = darkMode
    ? 'text-white font-extrabold'
    : 'text-slate-900 font-extrabold';

  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Search */}
      <div className="relative max-w-md w-full">
        <Search
          className={`absolute left-4 top-1/2 -translate-y-1/2 ${
            darkMode
              ? 'text-slate-400'
              : 'text-slate-450'
          }`}
          size={16}
        />

        <input
          type="text"
          placeholder="Search students, subjects or requests..."
          value={searchQuery}
          onChange={(e) =>
            setSearchQuery(e.target.value)
          }
          className={`w-full pl-11 pr-12 py-2.5 rounded-2xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all ${inputBg}`}
        />

        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
          ⌘ /
        </span>
      </div>

      <div className="flex items-center gap-4 self-end md:self-auto">
        {/* Dark mode */}
        <button
          onClick={toggleDarkMode}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1f2937] text-slate-700 dark:text-white transition-all"
        >
          {darkMode ? (
            <Sun
              size={16}
              className="text-amber-400"
            />
          ) : (
            <Moon size={16} />
          )}
        </button>

        {/* Notifications */}
        <button
          onClick={() =>
            navigate('/notifications')
          }
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1f2937] text-slate-700 dark:text-white relative cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <Bell size={16} />

          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
          )}
        </button>

        {/* Profile */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-800">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120"
            alt="Profile"
            className="w-9 h-9 rounded-full object-cover ring-2 ring-emerald-500/20"
          />

          <div className="hidden sm:block">
            <h5 className={`text-xs ${textPrimary}`}>
              Nusrat Jahan
            </h5>

            <p
              className={`text-[10px] ${
                darkMode
                  ? 'text-slate-400 font-medium'
                  : 'text-slate-500 font-medium'
              }`}
            >
              Tutor
            </p>
          </div>

          <ChevronDown
            size={14}
            className="text-slate-450 dark:text-slate-350"
          />
        </div>
      </div>
    </header>
  );
}