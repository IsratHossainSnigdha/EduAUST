import { usePushNotifications } from './lib/usePushNotifications';
import { useRole } from './lib/useRole';
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
import MyRequestsPage from './pages/StudentDashboard/MyRequestsPage';
import SavedTutorsPage from './pages/StudentDashboard/SavedTutorsPage';
import MyTutorsPage from './pages/StudentDashboard/MyTutorsPage';

import TutorDashboard from './pages/TutorDashboard/TutorDashboard';
import TuitionRequests from './pages/TutorDashboard/TuitionRequests';
import MyStudentsPage from './pages/TutorDashboard/MyStudentsPage';
import SessionsPage from './pages/Sessions/SessionsPage';

import TutorRoute from './components/TutorRoute';
import DocumentTitle from './components/DocumentTitle';
import ForgotPasswordPage from './pages/PasswordReset/ForgotPasswordPage';
import ResetPasswordPage from './pages/PasswordReset/ResetPasswordPage';

import TutorAccountPage from './pages/TutorAccount/TutorAccountPage';

import MessagesPage from './pages/Messages/MessagesPage';
import NotificationsPage from './pages/NotificationsPage';
import SettingsPage from './pages/Settings/SettingsPage';
import SupportPage from './pages/SupportPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  // Raise a desktop notification for anything that arrives while the app is
  // open, for whichever account is signed in.
  usePushNotifications();

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem(
      'eduAust_darkMode'
    );

    return saved
      ? JSON.parse(saved)
      : false;
  });

  // Which dashboard the account is looking at. useRole owns the stored value;
  // App used to keep a second copy synced to the same key, and because parent
  // effects run after child effects, that copy overwrote whatever a page had
  // just set — so the student dashboard could never take the role off 'tutor'.
  const { role: currentRole, setRole: setCurrentRole } = useRole();

  useEffect(() => {
    localStorage.setItem(
      'eduAust_darkMode',
      JSON.stringify(darkMode)
    );
  }, [darkMode]);


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
        {/* Names the browser tab for whichever route is showing. */}
        <DocumentTitle />

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

          {/* Password reset. The reset email has always linked to
              /password-reset/{token}; neither page existed. */}
          <Route
            path="/forgot-password"
            element={
              <ForgotPasswordPage
                {...sharedProps}
              />
            }
          />

          <Route
            path="/password-reset/:token"
            element={
              <ResetPasswordPage
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

          {/* The two cards the dashboard has always offered, now with
              somewhere to go. */}
          <Route
            path="/my-requests"
            element={
              <MyRequestsPage
                {...sharedProps}
              />
            }
          />

          <Route
            path="/saved-tutors"
            element={
              <SavedTutorsPage
                {...sharedProps}
              />
            }
          />

          {/* The tutors teaching them right now: the student's half of the
              same relationship the tutor manages under /my-students. */}
          <Route
            path="/my-tutors"
            element={
              <MyTutorsPage
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

          <Route
            path="/my-students"
            element={
              <TutorRoute>
                <MyStudentsPage
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

          {/* ==================== Sessions ==================== */}

          {/* A session belongs to the pair rather than to one role, so
              both sides reach the same page. */}
          <Route
            path="/sessions"
            element={
              <SessionsPage
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

          {/* Anything unmatched: a real page with a way back, rather than the
              blank white screen an unmatched route rendered before. */}
          <Route
            path="*"
            element={
              <NotFoundPage
                {...sharedProps}
              />
            }
          />

        </Routes>
      </BrowserRouter>
    </div>
  );
}