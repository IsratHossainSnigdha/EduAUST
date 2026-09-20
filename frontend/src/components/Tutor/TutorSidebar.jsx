import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  Bell,
  Settings,
  HelpCircle,
  LogOut,
  UserPlus,
} from 'lucide-react';
import UserAvatar from '../UserAvatar';
import { useCurrentUser } from '../../lib/useCurrentUser';
import { apiGet, clearAuth } from '../../lib/auth';

export default function TutorSidebar({
  darkMode,
  activeMenu,
  currentRole,
  setCurrentRole,
  handleNavigation,
  hasTutorProfile,
  profileLoading,
}) {
  const navigate = useNavigate();
  const { user: currentUser } = useCurrentUser();

  const sidebarBg = darkMode
    ? 'bg-[#111827] border-slate-800'
    : 'bg-white border-slate-100';

  const textPrimary = darkMode
    ? 'text-white font-extrabold'
    : 'text-slate-900 font-extrabold';

  // Badge counts come from the API so the sidebar agrees with the pages it
  // links to, instead of showing figures that were typed in by hand.
  const [counts, setCounts] = useState({ requests: 0, messages: 0, notifications: 0 });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const [requests, messages, notifications] = await Promise.all([
        currentRole === 'tutor'
          ? apiGet('/tuition-requests?status=pending')
          : Promise.resolve({ ok: false }),
        apiGet('/conversations/unread-count'),
        apiGet('/notifications/unread-count'),
      ]);

      if (cancelled) return;

      setCounts({
        requests: requests.ok ? (requests.body?.meta?.total ?? 0) : 0,
        messages: messages.ok
          ? (messages.body?.unread_total ?? messages.body?.unread_count ?? 0)
          : 0,
        notifications: notifications.ok
          ? (notifications.body?.by_audience?.tutor ?? notifications.body?.unread_count ?? 0)
          : 0,
      });
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [currentRole]);

  /*
   * Dashboard is the ONLY sidebar item
   * accessible without a tutor profile.
   */
  const menuItems = [
    {
      name: 'Dashboard',
      icon: LayoutDashboard,
      path: '/tutor-dashboard',
      requiresProfile: false,
    },

    {
      name: 'Tuition Requests',
      icon: UserPlus,
      badge: counts.requests || undefined,
      path: '/tutor-requests',
      requiresProfile: true,
    },

    {
      name: 'Messages',
      icon: MessageSquare,
      badge: counts.messages || undefined,
      path: '/messages',
      requiresProfile: true,
    },

    {
      name: 'Notifications',
      icon: Bell,
      badge: counts.notifications || undefined,
      path: '/notifications',
      requiresProfile: true,
    },

    {
      name: 'Settings',
      icon: Settings,
      path: '/settings',
      requiresProfile: true,
    },

    {
      name: 'Help & Support',
      icon: HelpCircle,
      path: '/support',
      requiresProfile: true,
    },
  ];

  /*
   * Check whether a menu item is locked.
   */
  const isItemLocked = (item) => {
    return (
      !profileLoading &&
      !hasTutorProfile &&
      item.requiresProfile
    );
  };

  /*
   * Handle sidebar navigation.
   */
  const handleItemClick = (item) => {
    /*
     * If the user does not have a tutor profile,
     * prevent navigation to all locked items.
     */
    if (isItemLocked(item)) {
      return;
    }

    handleNavigation(
      item.name,
      item.path
    );
  };

  return (
    <aside
      className={`w-64 shrink-0 flex flex-col justify-between p-6 border-r transition-colors duration-300 ${sidebarBg}`}
    >

      {/* =====================================================
          TOP SECTION
      ===================================================== */}
      <div>

        {/* Logo */}
        <div
          className="flex items-center gap-3 cursor-pointer mb-8"
          onClick={() => navigate('/')}
        >
          <div className="bg-emerald-600 text-white w-9 h-9 rounded-xl font-black text-lg flex items-center justify-center shadow-md shadow-emerald-500/20">
            E
          </div>

          <span className="text-xl font-black bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
            EduAUST
          </span>
        </div>

        {/* =================================================
            NAVIGATION
        ================================================= */}
        <nav className="space-y-1.5">

          {menuItems.map((item) => {
            const Icon = item.icon;

            const isActive =
              activeMenu === item.name;

            const locked =
              isItemLocked(item);

            return (
              <button
                key={item.name}
                type="button"
                onClick={() =>
                  handleItemClick(item)
                }
                disabled={locked}
                title={
                  locked
                    ? 'Tutor profile required'
                    : undefined
                }
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold tracking-wide transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md'
                    : locked
                    ? 'text-slate-400 dark:text-slate-600 opacity-50 cursor-not-allowed'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >

                {/* Icon + Name */}
                <div className="flex items-center gap-3">

                  <Icon
                    size={16}
                    className={
                      isActive
                        ? 'text-white'
                        : locked
                        ? 'text-slate-400 dark:text-slate-600'
                        : 'text-slate-400 dark:text-slate-300'
                    }
                  />

                  <span>
                    {item.name}
                  </span>

                </div>

                {/* Badge */}
                {item.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${
                      isActive
                        ? 'bg-white text-emerald-600'
                        : locked
                        ? 'bg-slate-300 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}

              </button>
            );
          })}

        </nav>

      </div>

      {/* =====================================================
          BOTTOM USER SECTION
      ===================================================== */}
      <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80 space-y-4">

        {/* User Information */}
        <div className="flex items-center gap-3">
          <UserAvatar user={currentUser} size={40} />

          <div className="min-w-0">
            <h4 className={`text-xs truncate ${textPrimary}`}>
              {currentUser?.name || 'Loading…'}
            </h4>

            <p
              className={`text-[10px] ${
                darkMode
                  ? 'text-slate-400'
                  : 'text-slate-500'
              }`}
            >
              {currentRole === 'tutor'
                ? 'Tutor Dashboard'
                : 'Student Mode'}
            </p>

          </div>

        </div>

        {/* =================================================
            SWITCH DASHBOARD
        ================================================= */}
        <button
          type="button"
          onClick={() => {
            const nextRole =
              currentRole === 'tutor'
                ? 'student'
                : 'tutor';

            setCurrentRole(nextRole);

            localStorage.setItem(
              'eduAUST_role',
              nextRole
            );

            navigate(
              nextRole === 'student'
                ? '/dashboard'
                : '/tutor-dashboard'
            );
          }}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-2 text-xs font-bold transition"
        >
          {currentRole === 'tutor'
            ? 'Switch to Student Dashboard'
            : 'Switch to Tutor Dashboard'}
        </button>

        {/* =================================================
            LOGOUT
        ================================================= */}
        <button
          type="button"
          onClick={() =>
            navigate('/login')
          }
          className="w-full border border-rose-500 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl py-2 text-xs font-bold transition flex items-center justify-center gap-2"
        >
          <LogOut size={14} />
          Logout
        </button>

      </div>

    </aside>
  );
}