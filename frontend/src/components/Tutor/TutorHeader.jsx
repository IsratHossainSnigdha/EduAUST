import React, { useEffect, useRef, useState } from 'react';
import {
  Search,
  Bell,
  ChevronDown,
  Sun,
  Moon,
  User,
  LogOut,
  Settings as SettingsIcon,
} from 'lucide-react';
import UserAvatar from '../UserAvatar';
import { useCurrentUser } from '../../lib/useCurrentUser';
import { clearAuth } from '../../lib/auth';
import { useNavigate } from 'react-router-dom';

export default function TutorHeader({
  darkMode,
  toggleDarkMode,
  searchQuery = '',
  setSearchQuery = () => {},
  unreadCount = 0,
  showSearch = true,
}) {
  const navigate = useNavigate();
  const { user: currentUser } = useCurrentUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close the menu when the pointer goes elsewhere, as a menu that stays open
  // over the page it links to is worse than no menu.
  useEffect(() => {
    if (!menuOpen) return undefined;

    const onPointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    const onKeyDown = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  const inputBg = darkMode
    ? 'bg-[#111827] border-slate-700 text-white placeholder-slate-400'
    : 'bg-slate-50 border-slate-200 text-slate-900';

  const textPrimary = darkMode
    ? 'text-white font-extrabold'
    : 'text-slate-900 font-extrabold';

  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Search */}
      {showSearch && (
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

          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
            ⌘ /
          </span>
        </div>
      )}

      {/* Right-side actions */}
      <div
        className={`flex items-center gap-4 ${
          showSearch
            ? 'self-end md:self-auto'
            : 'self-end ml-auto'
        }`}
      >
        {/* Dark mode */}
        <button
          onClick={toggleDarkMode}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1f2937] text-slate-700 dark:text-white transition-all"
          type="button"
          aria-label="Toggle dark mode"
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
          type="button"
          aria-label="Notifications"
        >
          <Bell size={16} />

          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
          )}
        </button>

        {/* Messages */}
        <button
          onClick={() => navigate('/messages')}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1f2937] text-slate-700 dark:text-white relative hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          type="button"
          aria-label="Messages"
        >
          <span className="sr-only">
            Messages
          </span>

          {/* Using Bell-sized spacing so the header remains consistent */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
          </svg>

          <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[11px] font-black px-1.5 py-0.5 rounded-full">
            2
          </span>
        </button>

        {/* Settings */}
        <button
          onClick={() => navigate('/settings')}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1f2937] text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          type="button"
          aria-label="Settings"
        >
          {/* Settings icon using simple inline SVG */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.42 1.42-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21h-2v-.08a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-1.42-1.42.06-.06A1.7 1.7 0 0 0 8.4 15a1.7 1.7 0 0 0-1.56-1.03H6.75v-2h.09A1.7 1.7 0 0 0 8.4 10.94a1.7 1.7 0 0 0-.34-1.88L8 9l1.42-1.42.06.06a1.7 1.7 0 0 0 1.88.34A1.7 1.7 0 0 0 12.39 6.4V6h2v.4a1.7 1.7 0 0 0 1.03 1.58 1.7 1.7 0 0 0 1.88-.34l.06-.06L18.78 9l-.06.06a1.7 1.7 0 0 0-.34 1.88A1.7 1.7 0 0 0 19.94 12h.06v2h-.06A1.7 1.7 0 0 0 19.4 15Z" />
          </svg>
        </button>
        {/* Profile menu */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-800 rounded-xl py-1 pr-2 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition"
          >
            <UserAvatar user={currentUser} size={36} className="ring-2 ring-emerald-500/20" />

            <div className="hidden sm:block min-w-0 text-left">
              <h5 className={`text-xs truncate max-w-[180px] ${textPrimary}`}>
                {currentUser?.name || 'Loading…'}
              </h5>

              <p
                className={`text-[11px] ${
                  darkMode
                    ? 'text-slate-400 font-medium'
                    : 'text-slate-500 font-medium'
                }`}
              >
                {currentUser?.isTutor ? 'Tutor' : 'Student'}
              </p>
            </div>

            <ChevronDown
              size={14}
              className={`text-slate-450 dark:text-slate-350 transition-transform ${
                menuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className={`absolute right-0 mt-2 w-60 rounded-2xl border shadow-xl overflow-hidden z-50 ${
                darkMode
                  ? 'bg-[#111827] border-slate-800'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <p className={`text-xs font-black truncate ${textPrimary}`}>
                  {currentUser?.name || '—'}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {currentUser?.email || ''}
                </p>
              </div>

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  navigate('/settings');
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold transition ${
                  darkMode
                    ? 'text-slate-200 hover:bg-slate-800'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <User size={14} className="text-emerald-500" />
                Edit profile
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  navigate('/settings');
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold transition ${
                  darkMode
                    ? 'text-slate-200 hover:bg-slate-800'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <SettingsIcon size={14} className="text-emerald-500" />
                Settings
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  clearAuth();
                  navigate('/login', { replace: true });
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-rose-500 hover:bg-rose-500/10 transition border-t border-slate-100 dark:border-slate-800"
              >
                <LogOut size={14} />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}