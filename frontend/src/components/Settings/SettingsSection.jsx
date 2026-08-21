import React from 'react';

export default function SettingsSection({
  title,
  description,
  children,
  darkMode,
}) {
  return (
    <section
      className={`rounded-2xl border shadow-sm ${
        darkMode
          ? 'bg-[#1f2937] border-slate-800'
          : 'bg-white border-slate-100'
      }`}
    >
      <div className="p-6 border-b border-slate-200 dark:border-slate-800">
        <h2
          className={`text-sm font-black ${
            darkMode
              ? 'text-white'
              : 'text-slate-900'
          }`}
        >
          {title}
        </h2>

        {description && (
          <p
            className={`text-xs mt-1 ${
              darkMode
                ? 'text-slate-400'
                : 'text-slate-500'
            }`}
          >
            {description}
          </p>
        )}
      </div>

      <div className="p-6 space-y-5">
        {children}
      </div>
    </section>
  );
}