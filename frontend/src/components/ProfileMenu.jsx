import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftRight,
  ChevronDown,
  GraduationCap,
  HelpCircle,
  LogOut,
  Settings as SettingsIcon,
  User,
} from 'lucide-react';

import UserAvatar from './UserAvatar';
import { clearAuth } from '../lib/auth';
import { useCurrentUser } from '../lib/useCurrentUser';
import { setRole, useRole, TUTOR } from '../lib/useRole';

/*
 * The account menu at the right of every signed-in header.
 *
 * Five headers drew this block, and only one of them opened anything: the
 * other four showed the same avatar, name and downward arrow as a picture,
 * so the arrow promised a menu that was not there. They all use this now.
 *
 * It follows the WAI-ARIA menu button pattern, so it works from the keyboard
 * as well as the mouse: Enter, Space or the down arrow open it on the first
 * item, the up arrow opens it on the last, arrows move between items, Home
 * and End jump to the ends, Escape closes it and hands focus back to the
 * button, and Tab closes it and carries on through the page.
 */
export default function ProfileMenu({ darkMode, size = 36 }) {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const { role } = useRole();

  const [open, setOpen] = useState(false);

  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  // Where focus goes once the menu has rendered: first item, last, or none.
  const [focusOnOpen, setFocusOnOpen] = useState(null);

  const menuId = useId();
  const triggerId = useId();

  const isTutorView = role === TUTOR;
  const canTutor = user?.isTutor === true || user?.isTutor === 1 || user?.isTutor === '1';

  const subtitle = [
    isTutorView ? 'Tutor' : 'Student',
    user?.department,
    user?.semester ? `Semester ${user.semester}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  // The menu's items, read from the page when needed rather than tracked with
  // a ref per item.
  const menuItems = () => [...(menuRef.current?.querySelectorAll('[role="menuitem"]') ?? [])];

  const close = useCallback((restoreFocus) => {
    setOpen(false);
    setFocusOnOpen(null);

    if (restoreFocus) triggerRef.current?.focus();
  }, []);

  // Close on a press anywhere outside, as a menu left open over the page it
  // links to is worse than no menu.
  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) close(false);
    };

    document.addEventListener('pointerdown', onPointerDown);

    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open, close]);

  // Move focus into the menu once its items exist.
  useEffect(() => {
    if (!open || !focusOnOpen) return;

    const items = menuItems();
    const target = focusOnOpen === 'last' ? items[items.length - 1] : items[0];

    target?.focus();
  }, [open, focusOnOpen]);

  const toggle = (where = 'first') => {
    if (open) {
      close(false);

      return;
    }

    setFocusOnOpen(where);
    setOpen(true);
  };

  const onTriggerKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setFocusOnOpen('first');
      setOpen(true);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setFocusOnOpen('last');
      setOpen(true);
    }
  };

  const onMenuKeyDown = (event) => {
    const items = menuItems();
    const index = items.indexOf(document.activeElement);

    const focusAt = (i) => items[(i + items.length) % items.length]?.focus();

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        focusAt(index + 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        focusAt(index - 1);
        break;
      case 'Home':
        event.preventDefault();
        focusAt(0);
        break;
      case 'End':
        event.preventDefault();
        focusAt(items.length - 1);
        break;
      case 'Escape':
        event.preventDefault();
        close(true);
        break;
      case 'Tab':
        // Let focus leave naturally; the menu should not trap it.
        close(false);
        break;
      default:
    }
  };

  const go = (path) => {
    close(false);
    navigate(path);
  };

  const switchRole = () => {
    close(false);

    // An account that does not tutor has no tutor dashboard to switch to.
    if (!isTutorView && !canTutor) {
      navigate('/become-a-tutor');

      return;
    }

    const applied = setRole(isTutorView ? 'student' : 'tutor');

    navigate(applied === TUTOR ? '/tutor-dashboard' : '/dashboard');
  };

  const logOut = () => {
    close(false);
    clearAuth();
    navigate('/login', { replace: true });
  };

  const items = [
    { key: 'profile', label: 'My profile', icon: User },
    { key: 'settings', label: 'Settings', icon: SettingsIcon },
    {
      key: 'role',
      label: isTutorView
        ? 'Switch to student dashboard'
        : canTutor
          ? 'Switch to tutor dashboard'
          : 'Become a tutor',
      icon: canTutor || isTutorView ? ArrowLeftRight : GraduationCap,
      divider: true,
    },
    { key: 'help', label: 'Help and support', icon: HelpCircle },
    { key: 'logout', label: 'Log out', icon: LogOut, danger: true, divider: true },
  ];

  // What each item does. Kept out of the list above so the list stays plain
  // data that rendering can walk over.
  const select = (key) => {
    switch (key) {
      case 'profile':
        go('/settings?tab=profile');
        break;
      case 'settings':
        go('/settings');
        break;
      case 'role':
        switchRole();
        break;
      case 'help':
        go('/support');
        break;
      case 'logout':
        logOut();
        break;
      default:
    }
  };

  const nameClass = darkMode ? 'text-white' : 'text-slate-900';
  const mutedClass = darkMode ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="relative" ref={rootRef}>
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        onClick={() => toggle('first')}
        onKeyDown={onTriggerKeyDown}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`Account menu for ${user?.name ?? 'your account'}`}
        className={`flex items-center gap-3 pl-3 pr-2 py-1 border-l rounded-xl transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 ${
          darkMode
            ? 'border-slate-800 hover:bg-slate-800/60'
            : 'border-slate-200 hover:bg-slate-100'
        }`}
      >
        <UserAvatar user={user} size={size} />

        <span className="hidden sm:block min-w-0 text-left">
          <span className={`block text-xs font-extrabold truncate max-w-[180px] ${nameClass}`}>
            {user?.name || 'Loading…'}
          </span>
          <span className={`block text-[11px] font-medium truncate max-w-[180px] ${mutedClass}`}>
            {subtitle}
          </span>
        </span>

        <ChevronDown
          size={14}
          aria-hidden="true"
          className={`shrink-0 transition-transform ${mutedClass} ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          id={menuId}
          ref={menuRef}
          role="menu"
          aria-labelledby={triggerId}
          onKeyDown={onMenuKeyDown}
          className={`absolute right-0 mt-2 w-64 rounded-2xl border shadow-xl overflow-hidden z-50 py-1 ${
            darkMode ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          {/* Who is signed in, so the menu confirms the account it acts on. */}
          <div
            className={`px-4 py-3 mb-1 border-b ${
              darkMode ? 'border-slate-800' : 'border-slate-100'
            }`}
          >
            <p className={`text-xs font-black truncate ${nameClass}`}>{user?.name || '—'}</p>
            <p className={`text-[11px] truncate ${mutedClass}`}>{user?.email || ''}</p>
          </div>

          {items.map((item) => {
            const Icon = item.icon;

            return (
              <React.Fragment key={item.key}>
                {item.divider && (
                  <div
                    role="separator"
                    className={`my-1 border-t ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}
                  />
                )}

                <button
                  type="button"
                  role="menuitem"
                  tabIndex={-1}
                  onClick={() => select(item.key)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-left transition focus:outline-none ${
                    item.danger
                      ? 'text-rose-500 hover:bg-rose-500/10 focus:bg-rose-500/10'
                      : darkMode
                        ? 'text-slate-200 hover:bg-slate-800 focus:bg-slate-800'
                        : 'text-slate-700 hover:bg-slate-50 focus:bg-slate-100'
                  }`}
                >
                  <Icon
                    size={14}
                    aria-hidden="true"
                    className={item.danger ? '' : 'text-emerald-500'}
                  />
                  {item.label}
                </button>
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}
