import React from 'react';

export default function WelcomeSection({ darkMode, name, loading }) {
  // Greet by first name only; the full name goes in the profile card.
  const firstName = name ? name.split(' ')[0] : '';

  return (
    <div className="space-y-1">
      <h1
        className={`text-2xl sm:text-3xl font-black tracking-tight ${
          darkMode
            ? 'text-white'
            : 'text-slate-900'
        }`}
      >
        {loading && !firstName ? (
          <span
            className={`inline-block h-7 w-56 rounded-lg animate-pulse ${
              darkMode ? 'bg-slate-700' : 'bg-slate-200'
            }`}
          />
        ) : (
          <>Let&apos;s Connect{firstName ? `, ${firstName}` : ''}! 👋</>
        )}
      </h1>

      <p
        className={`text-xs sm:text-sm ${
          darkMode
            ? 'text-slate-200 font-medium'
            : 'text-slate-600 font-medium'
        }`}
      >
        Here&apos;s an overview of your tutoring activity.
      </p>
    </div>
  );
}
