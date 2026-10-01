import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, MessageSquare, X } from 'lucide-react';
import { apiDelete, apiGet, clearAuth, isAuthenticated, isUnauthenticated } from '../../lib/auth';
import TutorSidebar from '../../components/Tutor/TutorSidebar';
import TutorHeader from '../../components/Tutor/TutorHeader';
import { useRole } from '../../lib/useRole';
import UserAvatar from '../../components/UserAvatar';

/*
 * The requests this student has sent.
 *
 * The dashboard has offered a "My Requests" card since it was built, pointing
 * at nothing. The data was already there — it just had nowhere to go.
 */
const STATUS_STYLES = {
  pending: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20',
  accepted: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  declined: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20',
  withdrawn: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/20',
  ended: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/20',
};

const TABS = ['All', 'Pending', 'Accepted', 'Declined'];

export default function MyRequestsPage({ darkMode, toggleDarkMode }) {
  const navigate = useNavigate();

  const [activeMenu, setActiveMenu] = useState('My Requests');
  const { role: currentRole, setRole: setCurrentRole } = useRole();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('All');

  // Which request is asking "are you sure?" before being taken back.
  const [confirming, setConfirming] = useState(null);
  const [withdrawing, setWithdrawing] = useState(null);

  const loadRequests = useCallback(() => {
    let cancelled = false;

    apiGet('/student/requests').then(({ ok, body }) => {
      if (cancelled) return;

      if (!ok) {
        if (isUnauthenticated(body)) {
          clearAuth();
          navigate('/login', { replace: true });

          return;
        }

        setError(body?.message || 'Could not load your requests.');
        setLoading(false);

        return;
      }

      setRequests(body?.data ?? []);
      setError('');
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login', { replace: true });

      return undefined;
    }

    return loadRequests();
  }, [loadRequests, navigate]);

  /*
   * Take back a request the tutor has not answered yet. One sent by mistake,
   * or to a tutor no longer needed, previously sat in someone's inbox with no
   * way for the student to retract it.
   */
  const withdraw = async (request) => {
    setWithdrawing(request.id);

    const { ok, body } = await apiDelete(`/tuition-requests/${request.id}`);

    setWithdrawing(null);
    setConfirming(null);

    if (!ok) {
      setError(
        body?.errors?.status?.[0] || body?.message || 'Could not withdraw that request.'
      );

      return;
    }

    loadRequests();
  };

  const shown = useMemo(
    () => (tab === 'All' ? requests : requests.filter((r) => r.status === tab.toLowerCase())),
    [requests, tab]
  );

  const bgClass = darkMode ? 'bg-[#0b0f19] text-slate-100' : 'bg-slate-50 text-slate-900';
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
        handleNavigation={(name, path) => {
          setActiveMenu(name);

          if (path && path !== '#') navigate(path);
        }}
      />

      <main className="flex-grow p-6 lg:p-10 space-y-6 overflow-y-auto max-h-screen">
        <TutorHeader darkMode={darkMode} toggleDarkMode={toggleDarkMode} showSearch={false} />


        <div>
          <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            My Requests
          </h1>
          <p className={`text-xs sm:text-sm mt-2 ${muted}`}>
            Every tuition request you have sent, and where each one stands.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                tab === t
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : darkMode
                    ? 'bg-slate-800 text-slate-300 hover:text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              {t}
              {t !== 'All' && (
                <span className="ml-1.5 opacity-70">
                  {requests.filter((r) => r.status === t.toLowerCase()).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {error && (
          <p className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 text-xs font-semibold">
            {error}
          </p>
        )}

        {loading && (
          <p className={`text-xs font-semibold ${muted}`}>Loading your requests…</p>
        )}

        {!loading && shown.length === 0 && (
          <div className={`p-8 rounded-2xl border text-center ${cardBg}`}>
            <p className={`text-xs font-semibold ${muted}`}>
              {tab === 'All'
                ? 'You have not sent any requests yet.'
                : `No ${tab.toLowerCase()} requests.`}
            </p>
            <button
              type="button"
              onClick={() => navigate('/find-tutors')}
              className="mt-4 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition"
            >
              Find a tutor
            </button>
          </div>
        )}

        <div className="space-y-3">
          {!loading && shown.map((r) => (
            <div key={r.id} className={`p-5 rounded-2xl border ${cardBg}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <UserAvatar user={{ name: r.tutor?.name, profile_picture: r.tutor?.avatar }} size={40} />

                  <div className="min-w-0">
                    <h3 className={`text-sm font-extrabold truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      {r.tutor?.name ?? 'Tutor'}
                    </h3>

                    <p className={`text-xs font-semibold ${muted} flex items-center gap-1.5 mt-0.5`}>
                      <BookOpen size={11} />
                      {r.subject ?? 'General tutoring'}
                      {r.tutor?.department ? ` • ${r.tutor.department}` : ''}
                    </p>

                    {r.message && (
                      <p className={`text-xs mt-2 ${muted}`}>{r.message}</p>
                    )}
                  </div>
                </div>

                <span
                  className={`shrink-0 text-[11px] font-extrabold px-2 py-1 rounded border capitalize ${
                    STATUS_STYLES[r.status] ?? STATUS_STYLES.pending
                  }`}
                >
                  {r.status === 'pending' ? 'Waiting' : r.status}
                </span>
              </div>

              {/* Acceptance is what unlocks messaging, so that is where it is offered. */}
              {r.status === 'accepted' && (
                <button
                  type="button"
                  onClick={() => navigate('/messages')}
                  className="mt-4 flex items-center gap-1.5 text-xs font-bold text-emerald-500 hover:text-emerald-400 transition"
                >
                  <MessageSquare size={13} /> Message {r.tutor?.name?.split(' ')[0] ?? 'them'}
                </button>
              )}

              {/* Only an unanswered request is still the student's to take back. */}
              {r.status === 'pending' && confirming !== r.id && (
                <button
                  type="button"
                  onClick={() => setConfirming(r.id)}
                  className={`mt-4 flex items-center gap-1.5 text-xs font-bold transition ${
                    darkMode
                      ? 'text-slate-400 hover:text-rose-400'
                      : 'text-slate-500 hover:text-rose-500'
                  }`}
                >
                  <X size={13} /> Withdraw request
                </button>
              )}

              {/* Taking a request back is not a one-tap accident. */}
              {r.status === 'pending' && confirming === r.id && (
                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <p className={`text-xs ${muted}`}>
                    Withdraw your request to {r.tutor?.name?.split(' ')[0] ?? 'this tutor'}? It
                    leaves their inbox, and you can send a new one later.
                  </p>

                  <div className="flex items-center gap-2 mt-2.5">
                    <button
                      type="button"
                      disabled={withdrawing === r.id}
                      onClick={() => withdraw(r)}
                      className="bg-rose-500 hover:bg-rose-600 disabled:opacity-60 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                    >
                      {withdrawing === r.id ? 'Withdrawing…' : 'Yes, withdraw'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setConfirming(null)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition ${
                        darkMode
                          ? 'border-slate-700 text-slate-300'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

      </main>
    </div>
  );
}
