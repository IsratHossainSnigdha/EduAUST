import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function ProfileReminder({
  darkMode,
}) {
  return (
    <div
      className={`p-4 rounded-2xl border flex items-center justify-between shadow-sm ${
        darkMode
          ? 'bg-[#1f2937] border-slate-800'
          : 'bg-white border-slate-100'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
          <ShieldCheck size={16} />
        </div>

        <p
          className={`text-xs font-medium ${
            darkMode
              ? 'text-slate-300'
              : 'text-slate-600'
          }`}
        >
          Keep your profile updated to attract more
          students.
        </p>
      </div>

      <button className="text-xs font-bold text-emerald-500 hover:underline">
        Update Profile &rarr;
      </button>
    </div>
  );
}