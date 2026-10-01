import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, Heart } from 'lucide-react';
import { apiDelete, apiGet, clearAuth, isAuthenticated, isUnauthenticated } from '../../lib/auth';
import TutorSidebar from '../../components/Tutor/TutorSidebar';
import TutorHeader from '../../components/Tutor/TutorHeader';
import { useRole } from '../../lib/useRole';
import UserAvatar from '../../components/UserAvatar';

/*
 * The student's shortlist.
 *
 * "Saved Tutors" was offered on the dashboard with nothing behind it — no
 * table, no endpoint, no page. Keeping a tutor is deliberately separate from
 * asking them: a student can shortlist a few and send a request later.
 */
export default function SavedTutorsPage({ darkMode, toggleDarkMode }) {
  const navigate = useNavigate();

  const [activeMenu, setActiveMenu] = useState('Saved Tutors');
  const { role: currentRole, setRole: setCurrentRole } = useRole();

  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [removing, setRemoving] = useState(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login', { replace: true });

      return undefined;
    }

    let cancelled = false;

    apiGet('/student/saved-tutors').then(({ ok, body }) => {
      if (cancelled) return;

      if (!ok) {
        if (isUnauthenticated(body)) {
          clearAuth();
          navigate('/login', { replace: true });

          return;
        }

        setError(body?.message || 'Could not load your saved tutors.');
        setLoading(false);

        return;
      }

      setSaved(body?.data ?? []);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const remove = async (tutorId) => {
    setRemoving(tutorId);

    const { ok, body } = await apiDelete(`/student/saved-tutors/${tutorId}`);

    setRemoving(null);

    if (!ok) {
      setError(body?.message || 'Could not remove that tutor.');

      return;
    }

    setSaved((list) => list.filter((s) => s.tutor_id !== tutorId));
  };

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
            Saved Tutors
          </h1>
          <p className={`text-xs sm:text-sm mt-2 ${muted}`}>
            Tutors you have kept while browsing. Send a request when you are ready.
          </p>
        </div>

        {error && (
          <p className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 text-xs font-semibold">
            {error}
          </p>
        )}

        {loading && <p className={`text-xs font-semibold ${muted}`}>Loading…</p>}

        {!loading && saved.length === 0 && (
          <div className={`p-8 rounded-2xl border text-center ${cardBg}`}>
            <Heart size={22} className="mx-auto text-pink-500 mb-3" />
            <p className={`text-xs font-semibold ${muted}`}>
              You have not saved any tutors yet.
            </p>
            <button
              type="button"
              onClick={() => navigate('/find-tutors')}
              className="mt-4 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition"
            >
              Browse tutors
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {!loading && saved.map((t) => (
            <div key={t.id} className={`p-5 rounded-2xl border ${cardBg}`}>
              <div className="flex items-start gap-3">
                <UserAvatar user={{ name: t.name, profile_picture: t.avatar }} size={44} />

                <div className="min-w-0 flex-grow">
                  <h3 className={`text-sm font-extrabold truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    {t.name}
                  </h3>

                  <p className={`text-xs font-semibold ${muted} truncate`}>
                    {t.headline || [t.department, t.experience_years ? `${t.experience_years} yr` : null]
                      .filter(Boolean)
                      .join(' • ')}
                  </p>
                </div>
              </div>

              {t.subjects?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {t.subjects.slice(0, 3).map((s) => (
                    <span
                      key={s}
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => navigate('/find-tutors')}
                  className="flex-grow bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <Award size={12} /> Request
                </button>

                <button
                  type="button"
                  onClick={() => remove(t.tutor_id)}
                  disabled={removing === t.tutor_id}
                  className="shrink-0 px-3 py-2 rounded-xl border border-rose-500 text-rose-500 hover:bg-rose-500 hover:text-white text-xs font-bold transition disabled:opacity-50"
                >
                  {removing === t.tutor_id ? '…' : 'Remove'}
                </button>
              </div>
            </div>
          ))}
        </div>

      </main>
    </div>
  );
}
