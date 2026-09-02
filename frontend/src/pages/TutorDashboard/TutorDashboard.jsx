import React, {
  useEffect,
  useState,
} from 'react';

import {
  useNavigate,
} from 'react-router-dom';

import {
  apiGet,
} from '../../lib/auth';

import TutorSidebar from '../../components/Tutor/TutorSidebar';
import TutorHeader from '../../components/Tutor/TutorHeader';
import WelcomeSection from '../../components/Tutor/WelcomeSection';
import TutorStats from '../../components/Tutor/TutorStats';
import TuitionRequests from '../../components/Tutor/TuitionRequests';
import ProfileReminder from '../../components/Tutor/ProfileReminder';
import './TutorDashboard.css'; // <-- External stylesheet imported here

export default function TutorDashboard({
  darkMode,
  toggleDarkMode,
  currentRole,
  setCurrentRole,
}) {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');

  const [activeMenu, setActiveMenu] =
    useState('Dashboard');

  const [unreadCount, setUnreadCount] =
    useState(0);

  /*
   * Tutor profile status
   *
   * false = tutor profile does not exist
   * true  = tutor profile exists
   */
  const [hasTutorProfile, setHasTutorProfile] =
    useState(false);

  const [profileLoading, setProfileLoading] =
    useState(true);

  /*
   * Set current role to tutor.
   */
  useEffect(() => {
    setCurrentRole('tutor');

    localStorage.setItem(
      'eduAUST_role',
      'tutor'
    );
  }, [setCurrentRole]);

  /*
   * Check tutor profile status.
   *
   * Backend:
   * GET /api/v1/tutor/status
   *
   * Response:
   * {
   *    "isTutor": true
   * }
   */
  useEffect(() => {
    let cancelled = false;

    const checkTutorStatus = async () => {
      try {
        const {
          ok,
          body,
        } = await apiGet('/tutor/status');

        if (cancelled) {
          return;
        }

        if (ok) {
          setHasTutorProfile(
            body?.isTutor === true
          );
        } else {
          setHasTutorProfile(false);
        }

        setProfileLoading(false);
      } catch (error) {
        console.error(
          'Failed to check tutor status:',
          error
        );

        if (!cancelled) {
          setHasTutorProfile(false);
          setProfileLoading(false);
        }
      }
    };

    checkTutorStatus();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * Load notification count.
   */
  useEffect(() => {
    let cancelled = false;

    const loadNotifications = async () => {
      try {
        const {
          ok,
          body,
        } = await apiGet(
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
      } catch (error) {
        console.error(
          'Failed to load notifications:',
          error
        );
      }
    };

    loadNotifications();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * Sidebar navigation.
   *
   * Dashboard is always accessible.
   *
   * All other sidebar items require
   * a tutor profile.
   */
  const handleNavigation = (
    itemName,
    itemPath
  ) => {
    /*
     * Dashboard is always accessible.
     */
    if (itemName === 'Dashboard') {
      setActiveMenu(itemName);

      if (
        itemPath &&
        itemPath !== '#'
      ) {
        navigate(itemPath);
      }

      return;
    }

    /*
     * Block every other sidebar item
     * if the tutor profile does not exist.
     */
    if (!hasTutorProfile) {
      navigate('/become-tutor');
      return;
    }

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
      className={`min-h-screen w-full font-sans antialiased flex tutor-dashboard-container ${bgClass}`}
    >

      {/* Sidebar */}
      <TutorSidebar
        darkMode={darkMode}
        activeMenu={activeMenu}
        currentRole="tutor"
        setCurrentRole={setCurrentRole}
        handleNavigation={handleNavigation}
        hasTutorProfile={hasTutorProfile}
        profileLoading={profileLoading}
      />

      {/* Main Content */}
      <main className="flex-grow p-6 lg:p-10 space-y-8 overflow-y-auto max-h-screen">

        {/* Header */}
        <TutorHeader
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          unreadCount={unreadCount}
        />

        {/* Welcome */}
        <WelcomeSection
          darkMode={darkMode}
        />

        {/* Statistics */}
        <TutorStats
          darkMode={darkMode}
          navigate={navigate}
        />

        {/* Tuition Requests */}
        <TuitionRequests
          darkMode={darkMode}
          navigate={navigate}
        />

        {/* Profile Reminder */}
        <ProfileReminder
          darkMode={darkMode}
        />

      </main>
    </div>
  );
}