import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import TutorSidebar from '../../components/Tutor/TutorSidebar';
import TutorHeader from '../../components/Tutor/TutorHeader';
import TuitionRequestList, {
  initialRequests,
} from '../../components/Tutor/TuitionRequestList';
import RequestNotice from '../../components/Tutor/RequestNotice';
import RequestDetailsModal from '../../components/Tutor/RequestDetailsModal';
import './TuitionRequests.css'; // <-- External stylesheet imported here

export default function TuitionRequests({
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

  const [requests, setRequests] = useState(() => {
    try {
      const savedStatuses = localStorage.getItem(
        'eduAust_requestStatuses'
      );

      if (savedStatuses) {
        const statuses = JSON.parse(savedStatuses);

        return initialRequests.map((request) =>
          statuses[request.id]
            ? {
                ...request,
                status: statuses[request.id],
              }
            : request
        );
      }
    } catch (error) {
      console.error(
        'Failed to load request statuses from localStorage',
        error
      );
    }

    return initialRequests;
  });

  const [selectedRequest, setSelectedRequest] =
    useState(null);

  useEffect(() => {
    localStorage.setItem(
      'eduAUST_role',
      currentRole
    );
  }, [currentRole]);

  const handleNavigation = (
    itemName,
    itemPath
  ) => {
    setActiveMenu(itemName);

    if (itemPath && itemPath !== '#') {
      navigate(itemPath);
    }
  };

  const handleAccept = (id) => {
    setRequests((previousRequests) => {
      const updatedRequests = previousRequests.map(
        (request) =>
          request.id === id
            ? {
                ...request,
                status: 'Accepted',
              }
            : request
      );

      const statusMap = updatedRequests.reduce(
        (accumulator, request) => ({
          ...accumulator,
          [request.id]: request.status,
        }),
        {}
      );

      localStorage.setItem(
        'eduAust_requestStatuses',
        JSON.stringify(statusMap)
      );

      return updatedRequests;
    });
  };

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

      {/* Main Content with custom scrollbar class applied */}
      <main className="flex-grow p-6 lg:p-10 space-y-8 overflow-y-auto max-h-screen tuition-requests-container">
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
        <TuitionRequestList
          darkMode={darkMode}
          requests={requests}
          onAccept={handleAccept}
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