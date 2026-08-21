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

        <WelcomeSection
          darkMode={darkMode}
        />

        <TutorStats
          darkMode={darkMode}
          navigate={navigate}
        />

        <TuitionRequests
          darkMode={darkMode}
          navigate={navigate}
        />

        <ProfileReminder
          darkMode={darkMode}
        />

      </main>
    </div>
  );
}