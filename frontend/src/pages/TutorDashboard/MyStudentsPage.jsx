import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

import {
  apiDelete,
  apiGet,
  clearAuth,
  isUnauthenticated,
} from '../../lib/auth';

import TutorSidebar from '../../components/Tutor/TutorSidebar';
import TutorHeader from '../../components/Tutor/TutorHeader';
import MyStudents from '../../components/Tutor/MyStudents';
import ProfileModal from '../../components/Messages/ProfileModal';
import { setRole, TUTOR, useRole } from '../../lib/useRole';

/*
 * Managing the students a tutor is teaching, on a page of its own.
 *
 * The dashboard carries the same panel, but a tutor with several students
 * wants somewhere to go rather than something to scroll past.
 */
export default function MyStudentsPage({ darkMode, toggleDarkMode }) {
  const navigate = useNavigate();

  const [activeMenu, setActiveMenu] = useState('My Students');

  // TutorRoute has already confirmed this account tutors; useRole owns the
  // stored role rather than this page keeping its own copy.
  const { role: currentRole, setRole: setCurrentRole } = useRole();

  const [students, setStudents] = useState([]);
  const [pastStudents, setPastStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [profileUserId, setProfileUserId] = useState(null);

  useEffect(() => {
    setRole(TUTOR);
  }, []);

  const load = useCallback(() => {
    let cancelled = false;

    apiGet('/tutor/dashboard').then(({ ok, body }) => {
      if (cancelled) return;

      if (!ok) {
        // A dead session is the router's problem, not an error banner's.
        if (isUnauthenticated(body)) {
          clearAuth();
          navigate('/login', { replace: true });

          return;
        }

        setError(body?.message || 'Could not load your students.');
        setLoading(false);

        return;
      }

      setStudents(body?.students ?? []);
      setPastStudents(body?.past_students ?? []);
      setError('');
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  useEffect(() => load(), [load]);

  /*
   * Stop teaching a student. They leave "currently teaching" and the
   * conversation closes, but they still count as taught.
   */
  const handleStopTeaching = async (student) => {
    if (!student?.request_id) return;

    const { ok, body } = await apiDelete('/tuition-requests/' + student.request_id);

    if (!ok) {
      setError(
        body?.errors?.status?.[0] || body?.message || 'Could not update that student.'
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
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          showSearch={false}
        />

        <div className="space-y-1">
          <h1
            className={`text-2xl sm:text-3xl font-black tracking-tight ${
              darkMode ? 'text-white' : 'text-slate-900'
            }`}
          >
            My Students
          </h1>
          <p className={`text-xs sm:text-sm ${muted}`}>
            Everyone you are teaching, and everyone you have taught. Open a profile, start a
            message, leave a rating, or end an arrangement.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl border border-rose-500/40 bg-rose-500/10 text-rose-500 text-sm font-semibold flex items-center justify-between gap-4">
            <span>{error}</span>
            <button
              type="button"
              onClick={load}
              className="shrink-0 px-3 py-1.5 rounded-lg border border-rose-500 text-xs font-bold hover:bg-rose-500 hover:text-white transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* Worth having once a tutor takes on more than a couple of students. */}
        {students.length + pastStudents.length > 3 && (
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

        <MyStudents
          darkMode={darkMode}
          students={students}
          pastStudents={pastStudents}
          loading={loading}
          searchQuery={searchQuery}
          onOpenProfile={setProfileUserId}
          onMessage={() => navigate('/messages')}
          onRemove={handleStopTeaching}
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
