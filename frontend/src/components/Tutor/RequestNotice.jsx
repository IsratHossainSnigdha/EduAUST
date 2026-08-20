import React from 'react';
import { Info } from 'lucide-react';

export default function RequestNotice({ darkMode }) {
  const cardBg = darkMode
    ? 'bg-[#1f2937] border-slate-800'
    : 'bg-white border-slate-100';

  return (
    <div
      className={`p-4 rounded-2xl border flex items-center gap-3 shadow-sm ${cardBg}`}
    >
      <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
        <Info size={16} />
      </div>

      <p
        className={`text-xs font-medium ${
          darkMode
            ? 'text-slate-300'
            : 'text-slate-600'
        }`}
      >
        Responding quickly to requests improves your
        visibility and gets you more students.
      </p>
    </div>
  );
}