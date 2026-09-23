import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, MessageSquare } from 'lucide-react';
import { apiGet, clearAuth, isAuthenticated, isUnauthenticated } from '../../lib/auth';
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
};

const TABS = ['All', 'Pending', 'Accepted', 'Declined'];

export default function MyRequestsPage({ darkMode }) {
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('All');

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login', { replace: true });

      return undefined;
    }

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
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const shown = useMemo(
    () => (tab === 'All' ? requests : requests.filter((r) => r.status === tab.toLowerCase())),
    [requests, tab]
  );

  const bgClass = darkMode ? 'bg-[#0b0f19] text-slate-100' : 'bg-slate-50 text-slate-900';
  const cardBg = darkMode ? 'bg-[#1f2937] border-slate-800' : 'bg-white border-slate-100';
  const muted = darkMode ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className={`min-h-screen w-full font-sans antialiased ${bgClass}`}>
      <div className="max-w-4xl mx-auto p-6 lg:p-10 space-y-6">

        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className={`flex items-center gap-2 text-xs font-bold ${muted} hover:text-emerald-500 transition`}
        >
          <ArrowLeft size={14} /> Back to dashboard
        </button>

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

                    <p className={`text-[11px] font-semibold ${muted} flex items-center gap-1.5 mt-0.5`}>
                      <BookOpen size={11} />
                      {r.subject ?? 'General tutoring'}
                      {r.tutor?.department ? ` • ${r.tutor.department}` : ''}
                    </p>

                    {r.message && (
                      <p className={`text-[11px] mt-2 ${muted}`}>{r.message}</p>
                    )}
                  </div>
                </div>

                <span
                  className={`shrink-0 text-[9px] font-extrabold px-2 py-1 rounded border capitalize ${
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
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
