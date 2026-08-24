import React, { useEffect, useState } from 'react';

import {
  BrowserRouter,
  Routes,
  Route,
} from 'react-router-dom';

import LandingPage from './pages/LandingPage/LandingPage';
import LoginPage from './pages/LoginPage/LoginPage';
import SignUpPage from './pages/SignUpPage/SignupPage';
import CompleteProfilePage from './pages/CompleteProfile/CompleteProfilePage';

import BecomeATutor from './pages/BecomeATutor';

import StudentDashboard from './pages/StudentDashboard/StudentDashboard';
import FindTutorsPage from './pages/StudentDashboard/FindTutorsPage';

import TutorDashboard from './pages/TutorDashboard/TutorDashboard';
import TuitionRequests from './pages/TutorDashboard/TuitionRequests';

import TutorRoute from './components/TutorRoute';

import TutorAccountPage from './pages/TutorAccount/TutorAccountPage';

import MessagesPage from './pages/Messages/MessagesPage';
import NotificationsPage from './pages/NotificationsPage';
import SettingsPage from './pages/Settings/SettingsPage';
import SupportPage from './pages/SupportPage';

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem(
      'eduAust_darkMode'
    );

    return saved
      ? JSON.parse(saved)
      : false;
  });

  const [currentRole, setCurrentRole] = useState(
    () =>
      localStorage.getItem('eduAUST_role') ||
      'student'
  );

  useEffect(() => {
    localStorage.setItem(
      'eduAust_darkMode',
      JSON.stringify(darkMode)
    );
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem(
      'eduAUST_role',
      currentRole
    );
  }, [currentRole]);

  const toggleDarkMode = () => {
    setDarkMode((previous) => !previous);
  };

  const sharedProps = {
    darkMode,
    toggleDarkMode,

    currentRole,
    setCurrentRole,

    themeClass: darkMode
      ? 'bg-slate-950 text-slate-100'
      : 'bg-white text-slate-900',

    navClass: darkMode
      ? 'bg-slate-950/80 border-slate-800'
      : 'bg-white/80 border-emerald-100',

    cardClass: darkMode
      ? 'bg-slate-900 border-slate-800'
      : 'bg-white border-emerald-100',

    subTextClass: darkMode
      ? 'text-slate-400'
      : 'text-slate-700',
  };

  return (
    <div
      className={
        darkMode
          ? 'dark min-h-screen'
          : 'min-h-screen'
      }
    >
      <BrowserRouter>
        <Routes>

          {/* ==================== Landing ==================== */}

          <Route
            path="/"
            element={
              <LandingPage
                {...sharedProps}
              />
            }
          />

          {/* ==================== Authentication ==================== */}

          <Route
            path="/login"
            element={
              <LoginPage
                {...sharedProps}
              />
            }
          />

          <Route
            path="/signup"
            element={
              <SignUpPage
                {...sharedProps}
              />
            }
          />

          {/* Finishes a Google sign-up: collects what Google cannot supply */}
          <Route
            path="/complete-profile"
            element={
              <CompleteProfilePage
                {...sharedProps}
              />
            }
          />

          {/* ==================== Student ==================== */}

          <Route
            path="/dashboard"
            element={
              <StudentDashboard
                {...sharedProps}
              />
            }
          />

          <Route
            path="/find-tutors"
            element={
              <FindTutorsPage
                {...sharedProps}
              />
            }
          />

          {/* ==================== Tutor Dashboard ==================== */}

          <Route
            path="/tutor-dashboard"
            element={
              <TutorRoute>
                <TutorDashboard
                  {...sharedProps}
                />
              </TutorRoute>
            }
          />

          <Route
            path="/tutor-requests"
            element={
              <TutorRoute>
                <TuitionRequests
                  {...sharedProps}
                />
              </TutorRoute>
            }
          />

          {/* ==================== Become Tutor ==================== */}

          {/* Conditions / eligibility page */}
          <Route
            path="/become-a-tutor"
            element={
              <BecomeATutor
                {...sharedProps}
              />
            }
          />

          {/* Actual tutor profile creation */}
          <Route
            path="/tutor/create-profile"
            element={
              <TutorAccountPage
                {...sharedProps}
              />
            }
          />

          {/* ==================== Messages ==================== */}

          <Route
            path="/messages"
            element={
              <MessagesPage
                darkMode={darkMode}
                toggleDarkMode={toggleDarkMode}
                currentRole={currentRole}
                setCurrentRole={setCurrentRole}
              />
            }
          />

          {/* ==================== Notifications ==================== */}

          <Route
            path="/notifications"
            element={
              <NotificationsPage
                {...sharedProps}
              />
            }
          />

          {/* ==================== Settings ==================== */}

          <Route
            path="/settings"
            element={
              <SettingsPage
                {...sharedProps}
              />
            }
          />

          {/* ==================== Support ==================== */}

          <Route
            path="/support"
            element={
              <SupportPage
                {...sharedProps}
              />
            }
          />

        </Routes>
      </BrowserRouter>
    </div>
  );
}