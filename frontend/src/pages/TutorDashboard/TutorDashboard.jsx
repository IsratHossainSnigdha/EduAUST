import React, {
  useEffect,
  useState,
} from 'react';

import {
  useNavigate,
} from 'react-router-dom';

import {
  apiGet,
  apiPatch,
  clearAuth,
  isUnauthenticated,
} from '../../lib/auth';

import TutorSidebar from '../../components/Tutor/TutorSidebar';
import TutorHeader from '../../components/Tutor/TutorHeader';
import WelcomeSection from '../../components/Tutor/WelcomeSection';
import TutorStats from '../../components/Tutor/TutorStats';
import TuitionRequests from '../../components/Tutor/TuitionRequests';
import ProfileReminder from '../../components/Tutor/ProfileReminder';

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
  const [unreadCount, setUnreadCount] =
    useState(0);

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
    setCurrentRole('tutor');

    localStorage.setItem(
      'eduAUST_role',
      'tutor'
    );
  }, [setCurrentRole]);

  /*
   * Notifications
   */
  useEffect(() => {
    let cancelled = false;

    const loadNotifications = async () => {
      const { ok, body } =
        await apiGet(
          '/notifications/unread-count'
        );

      if (
        !cancelled &&
        ok
      ) {
        setUnreadCount(
          body?.by_audience?.tutor ?? 0
        );
      }
    };

    loadNotifications();

    return () => {
      cancelled = true;
    };
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
          requests={dashboard?.recent_requests}
          loading={loadingDashboard}
          onRespond={handleRespond}
        />

        {!loadingDashboard && dashboard && !dashboard.profile_complete && (
          <ProfileReminder
            darkMode={darkMode}
          />
        )}

      </main>
    </div>
  );
}
