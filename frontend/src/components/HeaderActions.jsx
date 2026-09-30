import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, MessageSquare, Moon, Sun } from 'lucide-react';

import ProfileMenu from './ProfileMenu';
import { useBadgeCounts } from '../lib/useBadgeCounts';
import { useRole, TUTOR } from '../lib/useRole';

/*
 * The controls at the right of every signed-in header.
 *
 * Five pages each drew their own copy, and each copy had drifted: one bell
 * had no click handler, one pinged whether or not anything was unread, one
 * messages badge was the number 2 typed into the markup, and one page was
 * handed a hard-coded 3. The counts here come from the shared hook every
 * sidebar already reads, so they cost no extra request and cannot disagree
 * with the sidebar beside them.
 */
export default function HeaderActions({
  darkMode,
  toggleDarkMode,
  // A page does not need a shortcut to itself.
  showNotifications = true,
  showMessages = true,
  // Anything page-specific, placed after the account menu.
  children,
}) {
  const navigate = useNavigate();
  const { role } = useRole();
  const { counts } = useBadgeCounts({ includeRequests: role === TUTOR });

  const unreadNotifications = counts.notifications[role === TUTOR ? 'tutor' : 'student'] ?? 0;
  const unreadMessages = counts.messages ?? 0;

  const iconButton = `relative p-2.5 rounded-xl border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 ${
    darkMode
      ? 'border-slate-700 bg-[#1f2937] text-white hover:bg-slate-800'
      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
  }`;

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={toggleDarkMode}
        aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        className={iconButton}
      >
        {darkMode ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
      </button>

      {showNotifications && (
        <button
          type="button"
          onClick={() => navigate('/notifications')}
          aria-label={
            unreadNotifications > 0
              ? `Notifications, ${unreadNotifications} unread`
              : 'Notifications'
          }
          className={iconButton}
        >
          <Bell size={16} />

          {/* Only when there is actually something to read. */}
          {unreadNotifications > 0 && (
            <span
              aria-hidden="true"
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-600 text-white text-[11px] font-black flex items-center justify-center"
            >
              {unreadNotifications > 9 ? '9+' : unreadNotifications}
            </span>
          )}
        </button>
      )}

      {showMessages && (
        <button
          type="button"
          onClick={() => navigate('/messages')}
          aria-label={unreadMessages > 0 ? `Messages, ${unreadMessages} unread` : 'Messages'}
          className={iconButton}
        >
          <MessageSquare size={16} />

          {unreadMessages > 0 && (
            <span
              aria-hidden="true"
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-600 text-white text-[11px] font-black flex items-center justify-center"
            >
              {unreadMessages > 9 ? '9+' : unreadMessages}
            </span>
          )}
        </button>
      )}

      <ProfileMenu darkMode={darkMode} />

      {children}
    </div>
  );
}
