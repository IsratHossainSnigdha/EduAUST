import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

import {
  apiGet,
  apiPatch,
  clearAuth,
  isUnauthenticated,
} from '../../lib/auth';

import TutorSidebar from '../../components/Tutor/TutorSidebar';
import TutorHeader from '../../components/Tutor/TutorHeader';
import TuitionRequestList from '../../components/Tutor/TuitionRequestList';
import RequestNotice from '../../components/Tutor/RequestNotice';
import RequestDetailsModal from '../../components/Tutor/RequestDetailsModal';

/*
 * How long ago the request arrived, in the short form the cards use.
 */
function timeAgo(iso) {
  if (!iso) return '';

  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);

  if (Number.isNaN(seconds)) return '';
  if (seconds < 60) return 'just now';

  const units = [
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];

  for (const [label, size] of units) {
    const amount = Math.floor(seconds / size);

    if (amount >= 1) {
      return `${amount} ${label}${amount > 1 ? 's' : ''} ago`;
    }
  }

  return 'just now';
}

/*
 * Map an API request onto the shape the existing cards render, so the UI
 * stays exactly as it was while the data behind it becomes real.
 */
function toCard(request) {
  const name = request.student?.name || 'Student';

  return {
    id: request.id,
    name,
    email: [request.student?.department, request.student?.semester]
      .filter(Boolean)
      .join(' • '),
    subject: request.subject || 'General tutoring',
    level: request.level || '',
    description: request.message || 'No additional details were provided.',
    time: timeAgo(request.created_at),
    status: request.status,
    initials: name.slice(0, 2).toUpperCase(),
    icon: BookOpen,
    iconColor: 'text-emerald-500 bg-emerald-500/10',
  };
}

export default function TutorRequests({
  darkMode,
  toggleDarkMode,
}) {
  const navigate = useNavigate();

  const [activeMenu, setActiveMenu] = useState(
    'Tuition Requests'
  );

  const [currentRole, setCurrentRole] = useState(
    () =>
      localStorage.getItem('eduAUST_role') ||
      'tutor'
  );

  // Requests come from the backend; statuses are no longer kept in
  // localStorage, where they could disagree with what the tutor actually did.
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const [selectedRequest, setSelectedRequest] =
    useState(null);

  useEffect(() => {
    localStorage.setItem(
      'eduAUST_role',
      currentRole
    );
  }, [currentRole]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError('');

      const { ok, body } = await apiGet('/tuition-requests');

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

      setRequests((body?.data ?? []).map(toCard));
      setLoading(false);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [navigate, refreshKey]);

  const handleNavigation = (
    itemName,
    itemPath
  ) => {
    setActiveMenu(itemName);

    if (itemPath && itemPath !== '#') {
      navigate(itemPath);
    }
  };

  /*
   * Persist the tutor's answer, then reload so the list reflects what the
   * backend stored rather than an optimistic guess.
   */
  const respond = async (id, status) => {
    const { ok, body } = await apiPatch(
      '/tuition-requests/' + id,
      { status }
    );

    if (!ok) {
      setError(body?.message || 'Could not update that request.');

      return;
    }

    setSelectedRequest(null);
    setRefreshKey((key) => key + 1);
  };

  const handleAccept = (id) => respond(id, 'accepted');

  const handleDecline = (id) => respond(id, 'declined');

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
  };

  const handleCloseDetails = () => {
    setSelectedRequest(null);
  };

  const bgClass = darkMode
    ? 'bg-[#0b0f19] text-slate-150'
    : 'bg-slate-50 text-slate-950';

  return (
    <div
      className={`min-h-screen w-full font-sans antialiased flex transition-colors duration-300 ${bgClass}`}
    >
      {/* Sidebar */}
      <TutorSidebar
        darkMode={darkMode}
        activeMenu={activeMenu}
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        handleNavigation={handleNavigation}
      />

      {/* Main Content */}
      <main className="flex-grow p-6 lg:p-10 space-y-8 overflow-y-auto max-h-screen">
        {/* Header */}
        <TutorHeader
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          unreadCount={3}
          showSearch={false}
        />

        {/* Page Title */}
        <div className="space-y-1">
          <h2
            className={`text-2xl sm:text-3xl font-black tracking-tight ${
              darkMode
                ? 'text-white'
                : 'text-slate-900'
            }`}
          >
            Tuition Requests
          </h2>

          <p
            className={`text-xs sm:text-sm ${
              darkMode
                ? 'text-slate-200 font-medium'
                : 'text-slate-600 font-medium'
            }`}
          >
            Students are looking for help. Review and
            respond to their requests.
          </p>
        </div>

        {/* Request List */}
        {error && (
          <div className="p-4 rounded-2xl border border-rose-500/40 bg-rose-500/10 text-rose-500 text-sm font-semibold flex items-center justify-between gap-4">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setRefreshKey((key) => key + 1)}
              className="shrink-0 px-3 py-1.5 rounded-lg border border-rose-500 text-xs font-bold hover:bg-rose-500 hover:text-white transition"
            >
              Retry
            </button>
          </div>
        )}

        <TuitionRequestList
          darkMode={darkMode}
          requests={requests}
          loading={loading}
          onAccept={handleAccept}
          onDecline={handleDecline}
          onViewDetails={handleViewDetails}
        />

        {/* Notice */}
        <RequestNotice darkMode={darkMode} />

        {/* Request Details Modal */}
        <RequestDetailsModal
          request={selectedRequest}
          darkMode={darkMode}
          onClose={handleCloseDetails}
          onAccept={(id) => {
            handleAccept(id);
            handleCloseDetails();
          }}
        />
      </main>
    </div>
  );
}