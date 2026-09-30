import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  apiDelete,
  apiGet,
  apiPatch,
  clearAuth,
  isAuthenticated,
  isUnauthenticated,
} from '../../lib/auth';

import TutorSidebar from '../../components/Tutor/TutorSidebar';
import TutorHeader from '../../components/Tutor/TutorHeader';
import SessionList from '../../components/Sessions/SessionList';
import { useRole } from '../../lib/useRole';

/*
 * Everything this account has arranged, on both sides of the relationship.
 *
 * A tutor and a student see the same page: sessions belong to the pair, not
 * to a role, so there is no reason to build it twice.
 */

const TABS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
];

export default function SessionsPage({ darkMode, toggleDarkMode }) {
  const navigate = useNavigate();

  const [activeMenu, setActiveMenu] = useState('Sessions');
  const { role: currentRole, setRole: setCurrentRole } = useRole();

  const [sessions, setSessions] = useState([]);
  const [awaiting, setAwaiting] = useState(0);
  const [tab, setTab] = useState('upcoming');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(() => {
    let cancelled = false;

    setLoading(true);

    apiGet(`/sessions?filter=${tab}`).then(({ ok, body }) => {
      if (cancelled) return;

      if (!ok) {
        // A dead session is the router's problem, not an error banner's.
        if (isUnauthenticated(body)) {
          clearAuth();
          navigate('/login', { replace: true });

          return;
        }

        setError(body?.message || 'Could not load your sessions.');
        setLoading(false);

        return;
      }

      setSessions(body?.data ?? []);
      setAwaiting(body?.awaiting_you ?? 0);
      setError('');
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [navigate, tab]);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login', { replace: true });

      return undefined;
    }

    return load();
  }, [load, navigate]);

  const act = async (session, run, fallback) => {
    setBusyId(session.id);

    const { ok, body } = await run();

    setBusyId(null);

    if (!ok) {
      setError(body?.errors?.status?.[0] || body?.message || fallback);

      return;
    }

    load();
  };

  const confirm = (session) =>
    act(
      session,
      () => apiPatch(`/sessions/${session.id}/confirm`),
      'Could not confirm that session.'
    );

  const cancel = (session) =>
    act(session, () => apiDelete(`/sessions/${session.id}`), 'Could not cancel that session.');

  const handleNavigation = (itemName, itemPath) => {
    setActiveMenu(itemName);

    if (itemPath && itemPath !== '#') navigate(itemPath);
  };

  const bgClass = darkMode ? 'bg-[#0b0f19] text-slate-100' : 'bg-slate-50 text-slate-950';
  const cardBg = darkMode ? 'bg-[#1f2937] border-slate-800' : 'bg-white border-slate-100';
  const muted = darkMode ? 'text-slate-400' : 'text-slate-500';

  return (
    <div
      className={`min-h-screen w-full font-sans antialiased flex transition-colors duration-300 ${bgClass}`}
    >
      <TutorSidebar
        darkMode={darkMode}
        activeMenu={activeMenu}
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        handleNavigation={handleNavigation}
      />

      <main className="flex-grow p-6 lg:p-10 space-y-8 overflow-y-auto max-h-screen">
        <TutorHeader darkMode={darkMode} toggleDarkMode={toggleDarkMode} showSearch={false} />

        <div className="space-y-1">
          <h1
            className={`text-2xl sm:text-3xl font-black tracking-tight ${
              darkMode ? 'text-white' : 'text-slate-900'
            }`}
          >
            Sessions
          </h1>
          <p className={`text-xs sm:text-sm ${muted}`}>
            Times you have agreed to meet. Either side can suggest one, and the other confirms.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl border border-rose-500/40 bg-rose-500/10 text-rose-500 text-sm font-semibold flex items-center justify-between gap-4">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => {
                setError('');
                load();
              }}
              className="shrink-0 px-3 py-1.5 rounded-lg border border-rose-500 text-xs font-bold hover:bg-rose-500 hover:text-white transition"
            >
              Retry
            </button>
          </div>
        )}

        <div className={`p-5 rounded-2xl border space-y-4 ${cardBg}`}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full transition ${
                    tab === t.key
                      ? 'bg-emerald-600 text-white'
                      : darkMode
                        ? 'bg-slate-800 text-slate-300 hover:text-white'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Only counts the ones actually waiting on this person. */}
            {awaiting > 0 && (
              <span className="bg-amber-500/15 text-amber-600 dark:text-amber-400 text-xs px-2.5 py-1 rounded-full font-black">
                {awaiting} waiting on you
              </span>
            )}
          </div>

          <SessionList
            darkMode={darkMode}
            sessions={sessions}
            loading={loading}
            busyId={busyId}
            onConfirm={confirm}
            onCancel={cancel}
            emptyMessage={
              tab === 'upcoming'
                ? 'Nothing coming up. Suggest a time from My Tutors or My Students.'
                : 'Nothing has happened yet.'
            }
          />
        </div>
      </main>
    </div>
  );
}
