import React from 'react';

import HeaderActions from '../HeaderActions';

/*
 * The top of the message box.
 *
 * Its bell used to have no click handler and pinged whether or not anything
 * was unread, and its profile block showed an arrow that opened nothing. The
 * controls come from HeaderActions now, like every other signed-in page.
 */
export default function MessagesHeader({
  darkMode,
  toggleDarkMode,
  currentRole = 'student',
}) {
  // The chrome follows the dashboard being used: a tutor is talking with the
  // students who approached them, a student with the tutors they can reach.
  const subtitle =
    currentRole === 'tutor'
      ? 'Chat with your students and answer their questions.'
      : 'Chat with tutors and manage your conversations.';

  return (
    <header className="flex items-center justify-between gap-4 shrink-0">
      <div className="min-w-0">
        <h1
          className={`text-xl sm:text-2xl font-black tracking-tight ${
            darkMode ? 'text-white' : 'text-slate-900'
          }`}
        >
          Messages
        </h1>

        <p
          className={`text-xs font-medium ${
            darkMode ? 'text-slate-200' : 'text-slate-600'
          }`}
        >
          {subtitle}
        </p>
      </div>

      {/* A shortcut to the page you are already on is noise. */}
      <HeaderActions
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        showMessages={false}
      />
    </header>
  );
}
