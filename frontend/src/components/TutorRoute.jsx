import React, {
  useEffect,
  useState,
} from 'react';

import {
  Navigate,
} from 'react-router-dom';

import {
  apiGet,
} from '../lib/auth';

export default function TutorRoute({
  children,
}) {
  const [status, setStatus] =
    useState('checking');

  useEffect(() => {
    let cancelled = false;

    const checkTutor = async () => {
      try {
        const { ok, body } =
          await apiGet('/auth/me');

        if (cancelled) return;

        if (!ok || !body?.user) {
          setStatus('unauthenticated');
          return;
        }

        const user = body.user;

        const tutorStatus =
          user.isTutor === true ||
          user.isTutor === 1 ||
          user.isTutor === '1';

        if (tutorStatus) {
          localStorage.setItem(
            'eduAUST_role',
            'tutor'
          );

          setStatus('tutor');
        } else {
          setStatus('not-tutor');
        }
      } catch (error) {
        if (cancelled) return;

        console.error(
          'Tutor route check failed:',
          error
        );

        setStatus('unauthenticated');
      }
    };

    checkTutor();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * IMPORTANT:
   *
   * While checking, render ONLY a loading screen.
   * This prevents the dashboard from appearing briefly
   * before the API response arrives.
   */
  if (status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />

          <p className="text-xs text-slate-500">
            Checking tutor access...
          </p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (status === 'not-tutor') {
    return (
      <Navigate
        to="/become-a-tutor"
        replace
      />
    );
  }

  /*
   * Backend confirmed tutor.
   */
  return children;
}