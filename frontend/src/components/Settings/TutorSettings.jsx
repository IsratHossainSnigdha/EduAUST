import React, { useState } from 'react';

export default function TutorSettings({
  darkMode,
}) {
  const [subjects, setSubjects] = useState(
    'Data Structures, Algorithms'
  );

  const [availability, setAvailability] =
    useState('Weekdays');

  return (
    <div className="space-y-5">
      <div>
        <label
          className={`block text-xs font-bold mb-2 ${
            darkMode
              ? 'text-slate-200'
              : 'text-slate-700'
          }`}
        >
          Teaching Subjects
        </label>

        <input
          value={subjects}
          onChange={(e) =>
            setSubjects(e.target.value)
          }
          className={`w-full px-4 py-2.5 rounded-xl border text-xs outline-none ${
            darkMode
              ? 'bg-slate-900 border-slate-700 text-white'
              : 'bg-slate-50 border-slate-200'
          }`}
          placeholder="e.g. Data Structures, C Programming"
        />
      </div>

      <div>
        <label
          className={`block text-xs font-bold mb-2 ${
            darkMode
              ? 'text-slate-200'
              : 'text-slate-700'
          }`}
        >
          Availability
        </label>

        <select
          value={availability}
          onChange={(e) =>
            setAvailability(e.target.value)
          }
          className={`w-full px-4 py-2.5 rounded-xl border text-xs outline-none ${
            darkMode
              ? 'bg-slate-900 border-slate-700 text-white'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <option>Weekdays</option>
          <option>Weekends</option>
          <option>Evenings</option>
          <option>Flexible</option>
        </select>
      </div>

      <button
        type="button"
        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
      >
        Save Tutor Preferences
      </button>
    </div>
  );
}