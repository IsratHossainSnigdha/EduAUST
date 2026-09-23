import { useCurrentUser } from '../../lib/useCurrentUser';
import React from 'react';
import { Bell, Moon, Sun, ChevronDown } from 'lucide-react';
import UserAvatar from '../UserAvatar';

export default function MessagesHeader({
  darkMode,
  toggleDarkMode,
  currentRole = 'student',
}) {
  const { user: currentUser } = useCurrentUser();
  const isTutorView = currentRole === 'tutor';
  const textPrimary = darkMode
    ? 'text-white font-extrabold'
    : 'text-slate-900 font-extrabold';

  // The chrome follows the dashboard being used: a tutor is talking with the
  // students who approached them, a student with the tutors they can reach.
  const subtitle = isTutorView
    ? 'Chat with your students and answer their questions.'
    : 'Chat with tutors and manage your conversations.';
  const roleLabel = isTutorView
    ? 'Tutor'
    : ['Student', currentUser?.department, currentUser?.semester].filter(Boolean).join(' · ');

  return (
    <header className="flex items-center justify-between shrink-0">
      <div>
        <h2
          className={`text-xl sm:text-2xl font-black tracking-tight ${
            darkMode ? 'text-white' : 'text-slate-900'
          }`}
        >
          Messages
        </h2>

        <p
          className={`text-xs ${
            darkMode
              ? 'text-slate-200 font-medium'
              : 'text-slate-600 font-medium'
          }`}
        >
          {subtitle}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Dark Mode */}
        <button
          type="button"
          onClick={toggleDarkMode}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1f2937] text-slate-700 dark:text-white transition-all"
          aria-label="Toggle dark mode"
        >
          {darkMode ? (
            <Sun
              size={15}
              className="text-amber-400"
            />
          ) : (
            <Moon size={15} />
          )}
        </button>

        {/* Notifications */}
        <button
          type="button"
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1f2937] text-slate-700 dark:text-white relative"
          aria-label="Notifications"
        >
          <Bell size={15} />

          <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
        </button>

        {/* Profile */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200 dark:border-slate-800">
          <UserAvatar user={currentUser} size={32} />

          <div className="hidden sm:block">
            <h5 className={`text-xs ${textPrimary}`}>
              {currentUser?.name || 'Loading…'}
            </h5>

            <p
              className={`text-[10px] ${
                darkMode
                  ? 'text-slate-400 font-medium'
                  : 'text-slate-500 font-medium'
              }`}
            >
              {roleLabel}
            </p>
          </div>

          <ChevronDown
            size={13}
            className="text-slate-400"
          />
        </div>
      </div>
    </header>
  );
}