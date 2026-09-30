import React, {
  useEffect,
  useState,
} from 'react';

import {
  useNavigate,
} from 'react-router-dom';

import {
  apiDelete,
  apiGet,
  apiPatch,
  clearAuth,
  isUnauthenticated,
} from '../../lib/auth';

import { useBadgeCounts } from '../../lib/useBadgeCounts';

import TutorSidebar from '../../components/Tutor/TutorSidebar';
import TutorHeader from '../../components/Tutor/TutorHeader';
import WelcomeSection from '../../components/Tutor/WelcomeSection';
import TutorStats from '../../components/Tutor/TutorStats';
import TuitionRequests from '../../components/Tutor/TuitionRequests';
import MyStudents from '../../components/Tutor/MyStudents';
import ProfileReminder from '../../components/Tutor/ProfileReminder';
import TutorReviews from '../../components/Reviews/TutorReviews';
import ProfileModal from '../../components/Messages/ProfileModal';
import './TutorDashboard.css';
import { setRole, TUTOR } from '../../lib/useRole';

export default function TutorDashboard({
  darkMode,
  toggleDarkMode,
  currentRole,
  setCurrentRole,
}) {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] =
    useState('');

  const [activeMenu, setActiveMenu] =
    useState('Dashboard');

  /*
   * The sidebar shows the same unread counts, so both read them through the
   * shared hook and one request serves the whole screen.
   */
  const { counts: badges } = useBadgeCounts({ includeRequests: true });
  const unreadCount = badges.notifications.tutor;

  // Real dashboard data from the backend, replacing the placeholder figures
  // the cards used to hard-code.
  const [dashboard, setDashboard] =
    useState(null);

  const [loadingDashboard, setLoadingDashboard] =
    useState(true);

  const [dashboardError, setDashboardError] =
    useState('');

  // Bumped after a request is answered so the figures and the list reload.
  const [refreshKey, setRefreshKey] =
    useState(0);

  // Whose profile is open, if any — opened from a student row.
  const [profileUserId, setProfileUserId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoadingDashboard(true);
      setDashboardError('');

      const { ok, body } = await apiGet('/tutor/dashboard');

      if (cancelled) return;

      if (!ok) {
        // A dead session is the router's problem, not an error banner's.
        if (isUnauthenticated(body)) {
          clearAuth();
          navigate('/login', { replace: true });

          return;
        }

        setDashboardError(
          body?.message || 'Could not load your dashboard. Please try again.'
        );
        setLoadingDashboard(false);

        return;
      }

      setDashboard(body);
      setLoadingDashboard(false);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [navigate, refreshKey]);

  /*
   * TutorRoute already confirmed that this
   * user is a tutor.
   *
   * Therefore DO NOT call /auth/me here again.
   */
  useEffect(() => {
    // TutorRoute has already confirmed this account tutors, so the switch is
    // allowed; useRole owns the stored value.
    setRole(TUTOR);
  }, []);


  /*
   * Answer a request, then reload so the counts and the list agree with the
   * backend rather than drifting from an optimistic local edit.
   */
  const handleRespond = async (requestId, status) => {
    const { ok, body } = await apiPatch(
      '/tuition-requests/' + requestId,
      { status }
    );

    if (!ok) {
      setDashboardError(
        body?.message || 'Could not update that request.'
      );

      return false;
    }

    setRefreshKey((key) => key + 1);

    return true;
  };

  /*
   * Stop teaching a student. They leave "currently teaching" and the
   * conversation closes, but they still count as taught.
   */
  const handleStopTeaching = async (student) => {
    if (!student?.request_id) return;

    const { ok, body } = await apiDelete('/tuition-requests/' + student.request_id);

    if (!ok) {
      setDashboardError(
        body?.errors?.status?.[0] || body?.message || 'Could not update that student.'
      );

      return;
    }

    setRefreshKey((key) => key + 1);
  };

  // The header search filters what is on the dashboard rather than setting
  // state nobody reads, which is all it did before.
  const term = searchQuery.trim().toLowerCase();

  const filteredRequests = !term
    ? dashboard?.recent_requests
    : (dashboard?.recent_requests ?? []).filter(
        (r) =>
          r.student?.name?.toLowerCase().includes(term) ||
          r.subject?.toLowerCase().includes(term) ||
          r.status?.toLowerCase().includes(term)
      );
  const handleNavigation = (
    itemName,
    itemPath
  ) => {
    setActiveMenu(itemName);

    if (
      itemPath &&
      itemPath !== '#'
    ) {
      navigate(itemPath);
    }
  };

  const bgClass = darkMode
    ? 'bg-[#0b0f19] text-slate-100'
    : 'bg-slate-50 text-slate-950';

  return (
    <div
      className={`min-h-screen w-full font-sans antialiased flex ${bgClass}`}
    >
      <TutorSidebar
        darkMode={darkMode}
        activeMenu={activeMenu}
        currentRole="tutor"
        setCurrentRole={setCurrentRole}
        handleNavigation={handleNavigation}
      />

      <main className="flex-grow p-6 lg:p-10 space-y-8 overflow-y-auto max-h-screen">

        <TutorHeader
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          unreadCount={unreadCount}
        />

        {dashboardError && (
          <div className="p-4 rounded-2xl border border-rose-500/40 bg-rose-500/10 text-rose-500 text-sm font-semibold flex items-center justify-between gap-4">
            <span>{dashboardError}</span>
            <button
              type="button"
              onClick={() => setRefreshKey((key) => key + 1)}
              className="shrink-0 px-3 py-1.5 rounded-lg border border-rose-500 text-xs font-bold hover:bg-rose-500 hover:text-white transition"
            >
              Retry
            </button>
          </div>
        )}

        <WelcomeSection
          darkMode={darkMode}
          name={dashboard?.tutor?.name}
          loading={loadingDashboard}
        />

        <TutorStats
          darkMode={darkMode}
          navigate={navigate}
          stats={dashboard?.stats}
          loading={loadingDashboard}
        />

        <TuitionRequests
          darkMode={darkMode}
          navigate={navigate}
          requests={filteredRequests}
          loading={loadingDashboard}
          onRespond={handleRespond}
        />

        {/* The students being taught, with the actions that belong to them. */}
        <MyStudents
          darkMode={darkMode}
          students={dashboard?.students}
          pastStudents={dashboard?.past_students}
          loading={loadingDashboard}
          searchQuery={searchQuery}
          onOpenProfile={setProfileUserId}
          onMessage={() => navigate('/messages')}
          onRemove={handleStopTeaching}
          onRated={() => setRefreshKey((key) => key + 1)}
        />

        {/* What students made of the teaching — the dashboard reported every
            other figure about it and nothing about how it was received. */}
        <div
          id="tutor-reviews"
          className={`p-5 rounded-2xl border space-y-4 ${
            darkMode ? 'bg-[#1f2937] border-slate-800' : 'bg-white border-slate-100'
          }`}
        >
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-300">
            Reviews &amp; Ratings
          </h2>

          <TutorReviews
            darkMode={darkMode}
            tutorId={dashboard?.tutor?.id}
            cardClass={darkMode ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-50'}
          />
        </div>

        {!loadingDashboard && dashboard && !dashboard.profile_complete && (
          <ProfileReminder
            darkMode={darkMode}
          />
        )}

      </main>

      {/* Opening a student from their row, with the rating form inside. */}
      <ProfileModal
        darkMode={darkMode}
        userId={profileUserId}
        onClose={() => setProfileUserId(null)}
        onReviewed={() => setRefreshKey((key) => key + 1)}
      />
    </div>
  );
}
