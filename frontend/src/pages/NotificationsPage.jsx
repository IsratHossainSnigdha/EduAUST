import { useCurrentUser } from '../lib/useCurrentUser';
import UserAvatar from '../components/UserAvatar';
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Bell,
  LogOut,
  Sun,
  Moon,
  CheckCheck,
  Calendar,
  BookOpen,
  UserCheck,
  AlertCircle,
} from 'lucide-react';
import { apiGet, apiPatch, clearAuth, isAuthenticated, isUnauthenticated } from '../lib/auth';
import { useBadgeCounts } from '../lib/useBadgeCounts';
import { buildDashboardMenu } from '../lib/dashboardMenu';
import { setRole, useRole } from '../lib/useRole';
import './NotificationsPage.css'; // <-- External stylesheet imported here

// How each backend category is rendered in the list.
const CATEGORY_STYLES = {
  message: { icon: MessageSquare, color: 'text-sky-500 bg-sky-500/15' },
  request: { icon: UserCheck, color: 'text-violet-500 bg-violet-500/15' },
  session: { icon: Calendar, color: 'text-emerald-500 bg-emerald-500/15' },
  system: { icon: AlertCircle, color: 'text-rose-500 bg-rose-500/15' },
};

const FALLBACK_STYLE = { icon: BookOpen, color: 'text-slate-500 bg-slate-500/15' };

// Tabs map onto the query the API already supports.
const TABS = [
  { label: 'All', params: {} },
  { label: 'Unread', params: { unread: 1 } },
  { label: 'Messages', params: { category: 'message' } },
  { label: 'Requests', params: { category: 'request' } },
  { label: 'Sessions', params: { category: 'session' } },
  { label: 'System', params: { category: 'system' } },
];

export default function NotificationsPage({ darkMode, toggleDarkMode }) {
  const navigate = useNavigate();
  const { user: currentUser } = useCurrentUser();
  const [activeMenu, setActiveMenu] = useState('Notifications');
  // The audience shown here follows the dashboard the account is on, which
  // useRole owns; this page used to keep its own copy of that key.
  const { role: currentRole, setRole: setCurrentRole } = useRole();
  const [activeTab, setActiveTab] = useState('All');

  // The sidebar badges were fixed numbers typed into this file; they now read
  // the same shared counts as every other page.
  const { counts: badges } = useBadgeCounts({ includeRequests: currentRole === 'tutor' });

  // Live data from the API, scoped to whichever dashboard is active.
  const [groups, setGroups] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError('');

    const tab = TABS.find((t) => t.label === activeTab) ?? TABS[0];
    const query = new URLSearchParams({ audience: currentRole, ...tab.params });

    const { ok, body } = await apiGet(`/notifications?${query}`);

    if (!ok) {
      setGroups([]);

      // A dead session used to leave the page sitting there telling the user
      // to sign in again, with nothing on it that would let them.
      if (isUnauthenticated(body)) {
        clearAuth();
        navigate('/login', { replace: true });

        return;
      }

      setError(body?.message || 'Could not load notifications.');
      setLoading(false);

      return;
    }

    setGroups(body.groups ?? []);
    setUnreadCount(body.unread_count ?? 0);
    setLoading(false);
  }, [activeTab, currentRole]);

  useEffect(() => {
    // Without a session there is nothing to show and no way to sign in from
    // this page, so send them where they can.
    if (!isAuthenticated()) {
      navigate('/login', { replace: true });

      return;
    }

    loadNotifications();
  }, [loadNotifications, navigate]);

  // Mark every notification on this dashboard as read
  const handleMarkAllAsRead = async () => {
    const { ok } = await apiPatch(`/notifications/read-all?audience=${currentRole}`);
    if (ok) loadNotifications();
  };

  /*
   * Where a notification leads.
   *
   * New ones carry their own destination, because only whatever raised the
   * notification knows what it was about. Anything recorded before that
   * existed is placed by its category, which is coarse but better than a row
   * that looks clickable and goes nowhere.
   */
  const destinationFor = (item) => {
    if (item.link) return item.link;

    if (item.category === 'message') return '/messages';

    if (item.category === 'request') {
      return currentRole === 'tutor' ? '/tutor-requests' : '/my-requests';
    }

    return null;
  };

  /*
   * Opening a notification clears its unread state and takes you to the thing
   * it is about. It used to do the first only, and only when unread, so every
   * row was a dead end.
   */
  const handleOpenNotification = async (item) => {
    const to = destinationFor(item);

    if (item.unread) {
      const { ok } = await apiPatch(`/notifications/${item.id}/read`);

      // Nothing to come back to if we are leaving, so only reload in place.
      if (ok && !to) loadNotifications();
    }

    if (to) navigate(to);
  };

  const bgClass = darkMode ? 'bg-[#12161f] text-slate-100' : 'bg-[#f1f3f6] text-slate-900';
  const sidebarBg = darkMode ? 'bg-[#1a202c] border-slate-700/60' : 'bg-white border-slate-200 shadow-sm';
  const cardBg = darkMode ? 'bg-[#1e2533] border-slate-700/60' : 'bg-white border-slate-200 shadow-sm';
  const textPrimary = darkMode ? 'text-white font-extrabold' : 'text-slate-900 font-extrabold';
  const textSecondary = darkMode ? 'text-slate-300 font-medium' : 'text-slate-700 font-medium';

  const canTutor = currentUser?.isTutor === true
    || currentUser?.isTutor === 1
    || currentUser?.isTutor === '1';

  const menuItems = buildDashboardMenu({
    role: currentRole,
    badges: { ...badges, notifications: unreadCount },
  });

  const totalShown = groups.reduce((sum, group) => sum + group.notifications.length, 0);

  return (
    <div className={`min-h-screen w-full font-sans antialiased flex transition-colors duration-300 ${bgClass}`}>
      
      {/* Sidebar */}
      <aside className={`w-64 shrink-0 flex flex-col justify-between p-6 border-r transition-colors duration-300 ${sidebarBg}`}>
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer mb-8" onClick={() => navigate('/')}>
            <div className="bg-emerald-600 text-white w-9 h-9 rounded-xl font-black text-lg flex items-center justify-center shadow-md shadow-emerald-500/20">E</div>
            <span className="text-xl font-black bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">EduAUST</span>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    setActiveMenu(item.name);
                    navigate(item.path);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold tracking-wide transition-all ${
                    isActive 
                      ? 'bg-emerald-600 text-white shadow-md' 
                      : darkMode 
                        ? 'text-slate-300 hover:text-white hover:bg-slate-800' 
                        : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} className={isActive ? 'text-white' : darkMode ? 'text-slate-400' : 'text-slate-500 hover:text-slate-950'} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-black ${
                      isActive ? 'bg-white text-emerald-600' : 'bg-emerald-600 text-white'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
        
        {/* User Profile & Logout */}
        <div className={`pt-6 border-t ${darkMode ? 'border-slate-700/60' : 'border-slate-200'} space-y-4`}>
          <div className="flex items-center gap-3">
            <UserAvatar user={currentUser} size={40} />
            <div>
              <p className={`text-xs ${textPrimary}`}>{currentUser?.name || 'Loading…'}</p>
              <p className={`text-[11px] ${darkMode ? 'text-slate-400 font-semibold' : 'text-slate-500 font-semibold'}`}>
                {currentRole === 'tutor'
                  ? 'Tutor'
                  : ['Student', currentUser?.department, currentUser?.semester].filter(Boolean).join(' · ')}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => {
              // Only an account that tutors has a tutor dashboard to reach;
              // anyone else is sent to sign up as one rather than being put
              // straight back where they started.
              if (currentRole === 'student' && !canTutor) {
                navigate('/become-a-tutor');

                return;
              }

              // setRole refuses a tutor role on an account that does not
              // tutor, so follow where it landed rather than where we asked.
              const applied = setRole(currentRole === 'student' ? 'tutor' : 'student');

              navigate(applied === 'tutor' ? '/tutor-dashboard' : '/dashboard');
            }}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-2 text-xs font-bold transition shadow-sm"
          >
            {currentRole !== 'student'
              ? 'Switch to Student Dashboard'
              : canTutor
                ? 'Switch to Tutor Dashboard'
                : 'Become a Tutor'}
          </button>

          <button
            onClick={() => {
              // Without clearing the token this only changed page: the account
              // stayed signed in and any dashboard let them straight back in.
              clearAuth();
              navigate('/login', { replace: true });
            }}
            className="w-full border border-rose-500 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl py-2 text-xs font-bold transition flex items-center justify-center gap-2"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area with custom scrollbar class applied */}
      <main className="flex-grow p-6 lg:p-10 space-y-8 overflow-y-auto max-h-screen notifications-container">
        
        {/* Top Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${textPrimary}`}>Notifications</h1>
            <p className={`text-xs sm:text-sm ${textSecondary}`}>Stay updated with your latest tutoring sessions, messages, and alerts.</p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleDarkMode}
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              className={`p-2.5 rounded-xl border transition-all ${darkMode ? 'border-slate-700 bg-[#1e2533] text-white' : 'border-slate-300 bg-white text-slate-700 shadow-sm'}`}
            >
              {darkMode ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
            </button>
            <div className={`flex items-center gap-3 pl-3 border-l ${darkMode ? 'border-slate-700' : 'border-slate-300'}`}>
              <UserAvatar user={currentUser} size={36} />
              <div className="hidden sm:block">
                <span className={`block text-xs ${textPrimary}`}>{currentUser?.name || 'Loading…'}</span>
                <p className={`text-[11px] ${darkMode ? 'text-slate-400 font-semibold' : 'text-slate-500 font-semibold'}`}>
                  {currentRole === 'tutor'
                    ? 'Tutor Dashboard'
                    : ['Student', currentUser?.department, currentUser?.semester].filter(Boolean).join(' · ')}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Toolbar & Action Buttons */}
        <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm ${cardBg}`}>
          
          {/* Notification Categories / Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {TABS.map(({ label }) => (
              <button
                key={label}
                onClick={() => setActiveTab(label)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === label
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : darkMode
                      ? 'bg-[#12161f] text-slate-300 hover:bg-slate-800'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Action Triggers */}
          <div className="flex items-center gap-3">
            <span className={`text-[11px] font-bold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {unreadCount} unread
            </span>
            <button
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
              className={`px-3.5 py-2 border rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed ${
                darkMode ? 'border-slate-700 hover:bg-slate-800 text-slate-200' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <CheckCheck size={14} className="text-emerald-500" />
              Mark all as read
            </button>
          </div>

        </div>

        {/* Notifications List Section */}
        <div className="space-y-6">
          {error && (
            <div className={`p-4 rounded-2xl border border-rose-500/40 text-rose-500 text-xs font-semibold ${cardBg}`}>
              {error}
            </div>
          )}

          {loading ? (
            <div className={`p-12 text-center rounded-2xl border ${cardBg}`}>
              <Bell size={40} className="mx-auto text-slate-400 mb-3 opacity-50 animate-pulse" />
              <p className={`text-sm font-bold ${textPrimary}`}>Loading notifications…</p>
            </div>
          ) : totalShown > 0 ? (
            groups.map((group) => (
              <section key={group.key} className="space-y-3">
                <h3 className={`text-xs font-black uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {group.label}
                </h3>

                {group.notifications.map((item) => {
                  const { icon: Icon, color } = CATEGORY_STYLES[item.category] ?? FALLBACK_STYLE;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleOpenNotification(item)}
                      title={
                        destinationFor(item)
                          ? 'Open'
                          : item.unread
                            ? 'Mark as read'
                            : undefined
                      }
                      className={`w-full text-left p-5 rounded-2xl border transition flex items-start gap-4 shadow-sm ${cardBg} ${
                        destinationFor(item) || item.unread
                          ? 'hover:border-emerald-500/60 cursor-pointer'
                          : 'cursor-default'
                      } ${
                        item.unread ? (darkMode ? 'border-emerald-500/40 bg-[#1e2533]' : 'border-emerald-500/40 bg-emerald-50/30') : ''
                      }`}
                    >
                      {/* Icon */}
                      <div className={`p-3 rounded-2xl shrink-0 ${color}`}>
                        <Icon size={20} />
                      </div>

                      {/* Content */}
                      <div className="flex-grow space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <h4 className={`text-sm ${textPrimary}`}>{item.title}</h4>
                            {item.unread && (
                              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                            )}
                          </div>
                          <span className={`text-[11px] ${darkMode ? 'text-slate-400 font-medium' : 'text-slate-500 font-medium'}`}>
                            {item.time}
                          </span>
                        </div>
                        <p className={`text-xs ${textSecondary}`}>
                          {item.body}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </section>
            ))
          ) : (
            <div className={`p-12 text-center rounded-2xl border ${cardBg}`}>
              <Bell size={40} className="mx-auto text-slate-400 mb-3 opacity-50" />
              <h4 className={`text-sm font-bold ${textPrimary}`}>No notifications found</h4>
              <p className={`text-xs mt-1 ${textSecondary}`}>You're all caught up! Check back later for updates.</p>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}