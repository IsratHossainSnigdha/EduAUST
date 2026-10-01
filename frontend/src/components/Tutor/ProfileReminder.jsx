import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

/*
 * Shown on the tutor dashboard while the tutor card is missing its headline
 * or hourly rate, which is what makes a card look empty in Find Tutors.
 *
 * Its button used to have no handler at all. It opens the Tutoring profile
 * tab in Settings now, where both are edited.
 */
export default function ProfileReminder({ darkMode }) {
  return (
    <div
      className={`p-4 rounded-2xl border flex items-center justify-between gap-4 shadow-sm ${
        darkMode ? 'bg-[#1f2937] border-slate-800' : 'bg-white border-slate-100'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 shrink-0 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
          <ShieldCheck size={16} aria-hidden="true" />
        </div>

        <p className={`text-xs font-medium ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
          Add a headline and an hourly rate so your card does not look empty to students.
        </p>
      </div>

      <Link
        to="/settings?tab=tutoring"
        className="shrink-0 text-xs font-bold text-emerald-500 hover:underline"
      >
        Update profile &rarr;
      </Link>
    </div>
  );
}
