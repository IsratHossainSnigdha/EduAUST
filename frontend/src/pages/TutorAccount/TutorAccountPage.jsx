import React, {
  useEffect,
  useState,
} from 'react';

import {
  useNavigate,
} from 'react-router-dom';

import {
  apiGet,
  clearAuth,
  isUnauthenticated,
} from '../../lib/auth';

import TutorSidebar from '../../components/Tutor/TutorSidebar';
import TutorAccountForm from '../../components/Tutor/TutorAccountForm';

export default function TutorAccountPage({
  darkMode,
  toggleDarkMode,
  currentRole,
  setCurrentRole,
}) {
  const navigate = useNavigate();

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  /*
   * Only check authentication here.
   *
   * DO NOT check isTutor and redirect.
   *
   * TutorRoute handles tutor dashboard protection.
   */
  useEffect(() => {
    let cancelled = false;

    const loadUser = async () => {
      setLoading(true);
      setError('');

      const { ok, body } =
        await apiGet('/auth/me');

      if (cancelled) return;

      if (!ok) {
        if (isUnauthenticated(body)) {
          clearAuth();

          navigate('/login', {
            replace: true,
          });

          return;
        }

        setError(
          body?.message ||
            'Could not determine your account status.'
        );

        setLoading(false);
        return;
      }

      /*
       * Keep the role as student while creating
       * the tutor account.
       */
      setCurrentRole('student');

      setLoading(false);
    };

    loadUser();

    return () => {
      cancelled = true;
    };
  }, [
    navigate,
    setCurrentRole,
  ]);

  /*
   * Called after tutor account is successfully
   * created by the backend.
   */
  const handleTutorCreated = () => {
    /*
     * Update role immediately.
     */
    setCurrentRole('tutor');

    localStorage.setItem(
      'eduAUST_role',
      'tutor'
    );

    /*
     * Go to dashboard.
     *
     * TutorRoute will verify the backend status.
     */
    navigate('/tutor-dashboard', {
      replace: true,
    });
  };

  const bgClass = darkMode
    ? 'bg-[#0b0f19] text-slate-100'
    : 'bg-slate-50 text-slate-950';

  /*
   * Loading
   */
  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${bgClass}`}
      >
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />

          <p
            className={`text-xs font-semibold ${
              darkMode
                ? 'text-slate-300'
                : 'text-slate-600'
            }`}
          >
            Checking your account...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen w-full font-sans antialiased flex ${bgClass}`}
    >
      <TutorSidebar
        darkMode={darkMode}
        activeMenu="Tutor Account"
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        handleNavigation={(
          itemName,
          itemPath
        ) => {
          if (
            itemPath &&
            itemPath !== '#'
          ) {
            navigate(itemPath);
          }
        }}
      />

      <main className="flex-grow p-6 lg:p-10 overflow-y-auto">
        <div className="max-w-3xl mx-auto">

          {/* Header */}
          <div className="mb-8">
            <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-2">
              Become a Tutor
            </p>

            <h1
              className={`text-2xl sm:text-3xl font-black ${
                darkMode
                  ? 'text-white'
                  : 'text-slate-900'
              }`}
            >
              Create Your Tutor Account
            </h1>

            <p
              className={`text-xs sm:text-sm mt-2 ${
                darkMode
                  ? 'text-slate-400'
                  : 'text-slate-500'
              }`}
            >
              Complete your tutor profile to start
              accepting tuition requests from students.
            </p>
          </div>

          {/* Form */}
          <div
            className={`rounded-2xl border shadow-sm ${
              darkMode
                ? 'bg-[#1f2937] border-slate-800'
                : 'bg-white border-slate-100'
            }`}
          >
            <div
              className={`p-6 border-b ${
                darkMode
                  ? 'border-slate-800'
                  : 'border-slate-200'
              }`}
            >
              <h2
                className={`text-sm font-black ${
                  darkMode
                    ? 'text-white'
                    : 'text-slate-900'
                }`}
              >
                Tutor Information
              </h2>

              <p
                className={`text-[11px] mt-1 ${
                  darkMode
                    ? 'text-slate-400'
                    : 'text-slate-500'
                }`}
              >
                Provide some information so students can
                understand what you can teach.
              </p>
            </div>

            <div className="p-6">
              <TutorAccountForm
                darkMode={darkMode}
                onSuccess={handleTutorCreated}
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-6 p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 text-rose-500 text-xs font-medium">
              {error}

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="ml-2 underline font-bold"
              >
                Try again
              </button>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}