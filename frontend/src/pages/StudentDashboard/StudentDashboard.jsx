import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Heart,
  GitPullRequest,
  MessageSquare,
  Bell,
  LogOut,
  ChevronDown,
  Plus,
  ArrowRight,
  BookOpen,
  Sun,
  Moon,
} from 'lucide-react';
import { apiDelete, apiGet, isAuthenticated, isUnauthenticated, clearAuth } from '../../lib/auth';
import { useBadgeCounts } from '../../lib/useBadgeCounts';
import StudentReviews from '../../components/Reviews/StudentReviews';
import MyTutors from '../../components/Student/MyTutors';
import ProfileModal from '../../components/Messages/ProfileModal';
import './StudentDashboard.css';
import { setRole, STUDENT, TUTOR } from '../../lib/useRole';
import UserAvatar from '../../components/UserAvatar';
import { buildDashboardMenu } from '../../lib/dashboardMenu';

// Status pill colours for the student's own requests.
const REQUEST_STATUS_STYLES = {
  pending: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/10',
  accepted: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/10',
  declined: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/10',
};

export default function StudentDashboard({ darkMode, toggleDarkMode }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenu, setActiveMenu] = useState('Dashboard');
  // The signed-in user, so the profile card and the tutor switch reflect the
  // real account rather than a placeholder.
  const [me, setMe] = useState(null);

  useEffect(() => {
    // Without a session this page used to render anyway: the profile card
    // showed placeholder text and every action quietly fell back to the
    // signed-out path, which is why "Become a Tutor" led to registration.
    if (!isAuthenticated()) {
      navigate('/login', { replace: true });

      return undefined;
    }

    let cancelled = false;

    apiGet('/auth/me').then(({ ok, body }) => {
      if (cancelled) return;

      if (!ok) {
        // An expired or revoked token is a dead session, not a blank profile.
        if (isUnauthenticated(body)) {
          clearAuth();
          navigate('/login', { replace: true });
        }

        return;
      }

      // Merged, not replaced: the dashboard call fills in the department code
      // that this one does not carry, and either may land first.
      setMe((current) => ({ ...(current ?? {}), ...(body?.user ?? {}) }));
    });

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  // The student's own requests, so the dashboard reports real status rather
  // than two fixed examples.
  const [myRequests, setMyRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [stats, setStats] = useState(null);
  const [dashboardError, setDashboardError] = useState('');

  // The tutors teaching them right now, and whose profile is open, if any.
  const [tutors, setTutors] = useState([]);
  const [pastTutors, setPastTutors] = useState([]);
  const [profileUserId, setProfileUserId] = useState(null);

  // The unread badges are shared with every other page that shows them, so
  // one request serves them all rather than each page asking again.
  const { counts: badges } = useBadgeCounts();
  const unreadMessages = badges.messages;
  const unreadCount = badges.notifications.student;

  // One call for the whole page, the way the tutor dashboard works: the
  // account's own details, its figures, and its most recent requests.
  // Kept callable so leaving a review can bring the figures back in step.
  const refreshDashboard = useCallback(() => {
    let cancelled = false;

    apiGet('/student/dashboard').then(({ ok, body }) => {
      if (cancelled) return;

      if (ok) {
        setStats(body?.stats ?? null);
        setMyRequests((body?.recent_requests ?? []).slice(0, 4));
        setTutors(body?.tutors ?? []);
        setPastTutors(body?.past_tutors ?? []);

        // /auth/me carries department_id but not the code, so the header chip
        // had nothing to show for it; this payload has the resolved code.
        setMe((current) => ({ ...(current ?? {}), ...(body?.student ?? {}) }));
      } else if (!isUnauthenticated(body)) {
        setDashboardError(body?.message || 'Could not load your dashboard.');
      }

      setLoadingRequests(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => refreshDashboard(), [refreshDashboard]);

  const bgClass = darkMode ? 'bg-[#0b0f19] text-slate-150' : 'bg-slate-50 text-slate-950';
  const sidebarBg = darkMode ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-100';
  const cardBg = darkMode ? 'bg-[#1f2937] border-slate-800' : 'bg-white border-slate-100';
  const inputBg = darkMode ? 'bg-[#111827] border-slate-700 text-white placeholder-slate-400' : 'bg-slate-50 border-slate-200 text-slate-900';

  const textPrimary = darkMode ? 'text-white font-extrabold' : 'text-slate-900 font-extrabold';
  const textSecondary = darkMode ? 'text-slate-200 font-medium' : 'text-slate-600 font-medium';
  const textMuted = darkMode ? 'text-slate-350 font-medium' : 'text-slate-500 font-medium';

  const menuItems = buildDashboardMenu({
    role: 'student',
    badges: { messages: unreadMessages, notifications: unreadCount },
  });

  /*
   * Leave a tutoring arrangement. The conversation closes for both sides, and
   * the student can send a fresh request later.
   */
  const handleEndTutoring = async (tutor) => {
    if (!tutor?.request_id) return;

    const { ok, body } = await apiDelete('/tuition-requests/' + tutor.request_id);

    if (!ok) {
      setDashboardError(
        body?.errors?.status?.[0] || body?.message || 'Could not end that arrangement.'
      );

      return;
    }

    refreshDashboard();
  };

  const handleNavigation = (itemName, itemPath) => {
    setActiveMenu(itemName);
    if (itemPath && itemPath !== '#') {
      navigate(itemPath);
    }
  };
  // Reaching this page is a deliberate move to the student side, so the role
  // follows the navigation rather than being set as a side effect of render.
  useEffect(() => {
    setRole(STUDENT);
  }, []);

  return (
    <div className={`min-h-screen w-full font-sans antialiased flex transition-colors duration-300 ${bgClass}`}>
      
      <aside className={`w-64 shrink-0 flex flex-col justify-between p-6 border-r transition-colors duration-300 ${sidebarBg}`}>
        <div className="space-y-8">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="bg-emerald-600 text-white w-9 h-9 rounded-xl font-black text-lg flex items-center justify-center shadow-md shadow-emerald-500/20">E</div>
            <span className="text-xl font-black bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">EduAUST</span>
          </div>

          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item.name, item.path)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold tracking-wide transition-all ${
                    isActive 
                      ? 'bg-emerald-600 text-white dark:bg-emerald-600 dark:text-white shadow-md' 
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} className={isActive ? 'text-white' : 'text-slate-400 dark:text-slate-300'} />
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

        <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80 space-y-4">
          <div className="flex items-center gap-3">
            <UserAvatar user={me} size={40} />
            <div>
              <h4 className={`text-xs ${textPrimary}`}>{me?.name ?? 'Student'}</h4>
              <p className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {['Student', me?.department, me?.semester].filter(Boolean).join(' · ')}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              // Only an account that actually tutors has a tutor dashboard to
              // reach; anyone else is sent to sign up as one rather than being
              // bounced there by the route guard.
              if (!me?.isTutor) {
                navigate('/become-a-tutor');
                return;
              }

              setRole(TUTOR);
              navigate('/tutor-dashboard');
            }}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-2 text-xs font-bold transition"
          >
            {me?.isTutor ? 'Switch to Tutor Dashboard' : 'Become a Tutor'}
          </button>

          <button
            onClick={() => { clearAuth(); navigate('/login', { replace: true }); }}
            className="w-full border border-rose-500 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl py-2 text-xs font-bold transition flex items-center justify-center gap-2"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-grow p-6 lg:p-10 space-y-8 overflow-y-auto max-h-screen">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative max-w-md w-full">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${darkMode ? 'text-slate-400' : 'text-slate-450'}`} size={16} />
            <input 
              type="text" 
              placeholder="Search by course, subject, or tutor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                // The box set state nobody read. Find Tutors already takes a
                // search term, so hand the query over instead of filtering
                // a list this page does not have.
                if (e.key === 'Enter' && searchQuery.trim()) {
                  navigate(`/find-tutors?search=${encodeURIComponent(searchQuery.trim())}`);
                }
              }}
              className={`w-full pl-11 pr-12 py-2.5 rounded-2xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all ${inputBg}`}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">⌘ /</span>
          </div>

          <div className="flex items-center gap-4 self-end md:self-auto">
            <button onClick={toggleDarkMode} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1f2937] text-slate-700 dark:text-white transition-all">
              {darkMode ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
            </button>
            
            
            <button 
              onClick={() => navigate('/notifications')} 
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1f2937] text-slate-700 dark:text-white relative cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
              )}
            </button>

            <div className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-800">
              <UserAvatar user={me} size={36} />
              <div className="hidden sm:block">
                <h5 className={`text-xs ${textPrimary}`}>{me?.name ?? 'Student'}</h5>
                <p className={`text-[11px] ${darkMode ? 'text-slate-400 font-medium' : 'text-slate-500 font-medium'}`}>
                  {[me?.department, me?.semester && `Semester ${me.semester}`].filter(Boolean).join(' • ')}
                </p>
              </div>
              <ChevronDown size={14} className="text-slate-450 dark:text-slate-350" />
            </div>

            <button 
              onClick={() => navigate('/find-tutors')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold transition text-xs shadow-lg shadow-emerald-500/10 flex items-center gap-1.5"
            >
              <Plus size={14} /> Find Tutors
            </button>
          </div>
        </header>

        {/* This was collected and never shown, so a failed load or a failed
            action left the page looking merely empty. */}
        {dashboardError && (
          <div className="p-4 rounded-2xl border border-rose-500/40 bg-rose-500/10 text-rose-500 text-sm font-semibold flex items-center justify-between gap-4">
            <span>{dashboardError}</span>
            <button
              type="button"
              onClick={() => {
                setDashboardError('');
                refreshDashboard();
              }}
              className="shrink-0 px-3 py-1.5 rounded-lg border border-rose-500 text-xs font-bold hover:bg-rose-500 hover:text-white transition"
            >
              Retry
            </button>
          </div>
        )}

        <div className="space-y-1">
          <h1 className={`text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Let's Connect, {me?.name?.split(' ')[0] ?? 'there'}! <span className="animate-bounce">👋</span>
          </h1>
          <p className={`text-xs sm:text-sm ${textSecondary}`}>Find the right tutor and ace your studies.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {[
            { title: 'Find Tutors', desc: 'Search by course or subject', icon: Search, color: 'text-blue-500 bg-blue-500/10 border-blue-500/15', path: '/find-tutors' },
            { title: 'Saved Tutors', desc: 'View your saved tutor list', icon: Heart, color: 'text-pink-500 bg-pink-500/10 border-pink-500/15', badge: stats?.saved_tutors || undefined, path: '/saved-tutors' },
            { title: 'My Requests', desc: 'Check the status of your requests', icon: GitPullRequest, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/15', badge: stats?.pending_requests || undefined, path: '/my-requests' },
            { title: 'Messages', desc: 'Chat with active tutors', icon: MessageSquare, color: 'text-violet-500 bg-violet-500/10 border-violet-500/15', badge: unreadMessages || undefined, path: '/messages' }
          ].map((card, idx) => {
            const Icon = card.icon;
            return (
              <div 
                key={idx} 
                onClick={() => {
                  if (card.path && card.path !== '#') {
                    navigate(card.path);
                  }
                }}
                className={`p-5 rounded-2xl border transition-all duration-300 ${cardBg} hover:-translate-y-1 hover:shadow-lg relative group cursor-pointer`}
              >
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-xl border ${card.color}`}>
                    <Icon size={18} />
                  </div>
                  {card.badge && (
                    <span className="bg-emerald-600 text-white text-[11px] px-2 py-0.5 rounded-full font-black">{card.badge}</span>
                  )}
                </div>
                <div className="mt-4 space-y-1">
                  <h3 className={`text-sm font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>{card.title}</h3>
                  <p className={`text-xs font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{card.desc}</p>
                </div>
                <div className="absolute bottom-5 right-5 text-slate-400 group-hover:text-emerald-500 transition-colors">
                  <ArrowRight size={14} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="space-y-6">
            <div className={`p-5 rounded-2xl border ${cardBg} space-y-4`}>
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-300">
                  Recent Tutor Requests
                </h3>
                <button
                  type="button"
                  onClick={() => navigate('/my-requests')}
                  className="text-xs font-bold text-emerald-500 dark:text-emerald-400 hover:underline"
                >
                  View All
                </button>
              </div>

              <div className="space-y-3">
                {loadingRequests && (
                  [0, 1].map((row) => (
                    <div
                      key={row}
                      className={`h-14 rounded-xl animate-pulse ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}
                    />
                  ))
                )}

                {!loadingRequests && myRequests.length === 0 && (
                  <div className={`py-8 text-center ${textMuted}`}>
                    <BookOpen size={24} className="mx-auto mb-2 text-emerald-500/60" />
                    <p className="text-xs font-bold">No requests yet</p>
                    <p className="text-xs mt-1">Find a tutor and send your first request.</p>
                  </div>
                )}

                {!loadingRequests && myRequests.map((req) => (
                  <div
                    key={req.id}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-colors ${darkMode ? 'bg-slate-800/70 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2 rounded-lg shrink-0 ${darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
                        <BookOpen size={14} />
                      </div>

                      <div className="min-w-0">
                        <h4 className={`text-xs font-black truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                          {req.subject ?? 'General tutoring'}
                        </h4>

                        <p className={`text-[11px] truncate ${textMuted}`}>
                          {req.tutor?.name ?? 'Tutor'}
                        </p>
                      </div>
                    </div>

                    <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded border capitalize ${REQUEST_STATUS_STYLES[req.status] ?? REQUEST_STATUS_STYLES.pending}`}>
                      {req.status === 'pending' ? 'Waiting' : req.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Who is teaching them, and what they can do about each one. The
              mirror of the tutor dashboard's My Students panel. */}
          <div className="xl:col-span-2">
            <MyTutors
              darkMode={darkMode}
              tutors={tutors}
              pastTutors={pastTutors}
              loading={loadingRequests}
              onOpenProfile={setProfileUserId}
              onMessage={() => navigate('/messages')}
              onRemove={handleEndTutoring}
              onRated={refreshDashboard}
            />
          </div>

          {/* Rate the tutors who taught you. */}
          <div className="xl:col-span-3">
            <div className={`p-5 rounded-2xl border ${cardBg} space-y-4`}>
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-300">
                  Reviews &amp; Ratings
                </h3>

                {stats?.reviews_pending > 0 && (
                  <span className="bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[11px] px-2 py-0.5 rounded-full font-black">
                    {stats.reviews_pending} to rate
                  </span>
                )}
              </div>

              <StudentReviews
                darkMode={darkMode}
                cardClass={darkMode ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-50'}
                onChanged={refreshDashboard}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Opening a tutor from their row, with the rating form inside. */}
      <ProfileModal
        darkMode={darkMode}
        userId={profileUserId}
        onClose={() => setProfileUserId(null)}
        onReviewed={refreshDashboard}
      />
    </div>
  );
}
