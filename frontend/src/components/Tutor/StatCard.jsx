import React from 'react';

export default function StatCard({
  title,
  value,
  description,
  icon: Icon,
  darkMode,
  onClick,
}) {
  return (
    <div
      onClick={onClick}
      className={`p-6 rounded-2xl border flex items-center justify-between shadow-sm transition-all ${
        onClick
          ? 'cursor-pointer hover:border-emerald-500/50'
          : ''
      } ${
        darkMode
          ? 'bg-[#1f2937] border-slate-800'
          : 'bg-white border-slate-100'
      }`}
    >
      <div>
        <p
          className={`text-xs font-semibold ${
            darkMode
              ? 'text-slate-400'
              : 'text-slate-500'
          }`}
        >
          {title}
        </p>

        <h3
          className={`text-3xl font-black mt-2 ${
            darkMode
              ? 'text-white'
              : 'text-slate-900'
          }`}
        >
          {value}
        </h3>

        <p
          className={`text-[11px] mt-1 ${
            darkMode
              ? 'text-slate-400'
              : 'text-slate-400'
          }`}
        >
          {description}
        </p>
      </div>

      <div className="w-14 h-14 bg-emerald-500/10 text-emerald-600 rounded-2xl flex items-center justify-center">
        <Icon size={24} />
      </div>
    </div>
  );
}