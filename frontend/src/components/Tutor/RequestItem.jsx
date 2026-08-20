import React from 'react';

export default function RequestItem({
  request,
  darkMode,
}) {
  return (
    <div
      className={`flex items-center justify-between p-3.5 rounded-xl border transition-colors ${
        darkMode
          ? 'bg-slate-800/70 border-slate-700'
          : 'bg-slate-50 border-slate-200'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs">
          {request.subject
            .slice(0, 2)
            .toUpperCase()}
        </div>

        <div>
          <h4
            className={`text-xs font-black ${
              darkMode
                ? 'text-white'
                : 'text-slate-900'
            }`}
          >
            {request.subject}
          </h4>

          <p
            className={`text-[10px] ${
              darkMode
                ? 'text-slate-400'
                : 'text-slate-500'
            }`}
          >
            {request.level}
          </p>
        </div>
      </div>

      <div className="text-right">
        <span
          className={`text-[10px] block mb-1 ${
            darkMode
              ? 'text-slate-400'
              : 'text-slate-400'
          }`}
        >
          {request.time}
        </span>

        <span
          className={`text-[9px] font-extrabold px-2 py-0.5 rounded ${
            request.status === 'New'
              ? 'bg-amber-500/15 text-amber-500'
              : 'bg-slate-500/15 text-slate-400'
          }`}
        >
          {request.status}
        </span>
      </div>
    </div>
  );
}