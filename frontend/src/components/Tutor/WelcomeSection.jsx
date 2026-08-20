import React from 'react';

export default function WelcomeSection({ darkMode }) {
  return (
    <div className="space-y-1">
      <h2
        className={`text-2xl sm:text-3xl font-black tracking-tight ${
          darkMode
            ? 'text-white'
            : 'text-slate-900'
        }`}
      >
        Let's Connect, Nusrat! 👋
      </h2>

      <p
        className={`text-xs sm:text-sm ${
          darkMode
            ? 'text-slate-200 font-medium'
            : 'text-slate-600 font-medium'
        }`}
      >
        Here's an overview of your tutoring activity.
      </p>
    </div>
  );
}