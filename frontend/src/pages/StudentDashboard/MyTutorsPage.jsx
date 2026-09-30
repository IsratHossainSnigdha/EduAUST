import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

import {
  apiDelete,
  apiGet,
  clearAuth,
  isAuthenticated,
  isUnauthenticated,
} from '../../lib/auth';

import TutorSidebar from '../../components/Tutor/TutorSidebar';
import TutorHeader from '../../components/Tutor/TutorHeader';
import MyTutors from '../../components/Student/MyTutors';
import ProfileModal from '../../components/Messages/ProfileModal';
import { setRole, STUDENT, useRole } from '../../lib/useRole';

/*
 * The student's side of an active tutoring arrangement.
 *
 * The tutor has had a page for managing their students; the student had only a
 * count on the dashboard, so this is the same relationship read from the other
 * end, with the same furniture around it.
 */
export default function MyTutorsPage({ darkMode, toggleDarkMode }) {
  const navigate = useNavigate();

  const [activeMenu, setActiveMenu] = useState('My Tutors');

  // The sidebar is shared with every other dashboard page and follows the
  // active role, so a student sees the student links.
  const { role: currentRole, setRole: setCurrentRole } = useRole();

  const [tutors, setTutors] = useState([]);
  const [pastTutors, setPastTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [profileUserId, setProfileUserId] = useState(null);

  // Reaching this page is a deliberate move to the student side.
  useEffect(() => {
    setRole(STUDENT);
  }, []);

  const load = useCallback(() => {
    let cancelled = false;

    apiGet('/student/dashboard').then(({ ok, body }) => {
      if (cancelled) return;

      if (!ok) {
        // A dead session is the router's problem, not an error banner's.
        if (isUnauthenticated(body)) {
          clearAuth();
          navigate('/login', { replace: true });

          return;
        }

        setError(body?.message || 'Could not load your tutors.');
        setLoading(false);

        return;
      }

      setTutors(body?.tutors ?? []);
      setPastTutors(body?.past_tutors ?? []);
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

    return load();
  }, [load, navigate]);

  /*
   * Leave an arrangement. The tutor keeps the record of having taught them,
   * and the conversation closes for both sides.
   *
   * The backend refuses this inside the student's first month, so the error it
   * sends back is the explanation shown here.
   */
  const handleEnd = async (tutor) => {
    if (!tutor?.request_id) return;

    const { ok, body } = await apiDelete('/tuition-requests/' + tutor.request_id);

    if (!ok) {
      setError(
        body?.errors?.status?.[0] || body?.message || 'Could not end that arrangement.'
      );

      return;
    }

    load();
  };

  const handleNavigation = (itemName, itemPath) => {
    setActiveMenu(itemName);

    if (itemPath && itemPath !== '#') {
      navigate(itemPath);
    }
  };

  const bgClass = darkMode ? 'bg-[#0b0f19] text-slate-100' : 'bg-slate-50 text-slate-950';
  const muted = darkMode ? 'text-slate-400' : 'text-slate-500';

  const inputBg = darkMode
    ? 'bg-[#111827] border-slate-700 text-white placeholder-slate-400'
    : 'bg-white border-slate-200 text-slate-900';

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
        <TutorHeader
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          showSearch={false}
        />

        <div className="space-y-1">
          <h1
            className={`text-2xl sm:text-3xl font-black tracking-tight ${
              darkMode ? 'text-white' : 'text-slate-900'
            }`}
          >
            My Tutors
          </h1>
          <p className={`text-xs sm:text-sm ${muted}`}>
            The tutors teaching you, and the ones who used to. Open a profile, start a message,
            leave a rating, or end an arrangement.
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

        {/* Worth having once a student works with more than a couple of them. */}
        {tutors.length + pastTutors.length > 3 && (
          <div className="relative max-w-md">
            <Search size={14} className={`absolute left-4 top-1/2 -translate-y-1/2 ${muted}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, department, or subject…"
              className={`w-full pl-10 pr-4 py-2.5 rounded-2xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition ${inputBg}`}
            />
          </div>
        )}

        <MyTutors
          darkMode={darkMode}
          tutors={tutors}
          pastTutors={pastTutors}
          loading={loading}
          searchQuery={searchQuery}
          onOpenProfile={setProfileUserId}
          onMessage={() => navigate('/messages')}
          onRemove={handleEnd}
          onRated={load}
          onScheduled={() => navigate('/sessions')}
        />
      </main>

      <ProfileModal
        darkMode={darkMode}
        userId={profileUserId}
        onClose={() => setProfileUserId(null)}
        onReviewed={load}
      />
    </div>
  );
}
