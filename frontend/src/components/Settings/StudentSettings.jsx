import React, { useState } from 'react';

export default function StudentSettings({
  darkMode,
}) {
  const [subjects, setSubjects] = useState(
    'Data Structures, Mathematics'
  );

  const [learningMode, setLearningMode] =
    useState('Online');

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
          Subjects of Interest
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
          placeholder="e.g. Algorithms, Physics"
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
          Preferred Learning Mode
        </label>

        <select
          value={learningMode}
          onChange={(e) =>
            setLearningMode(e.target.value)
          }
          className={`w-full px-4 py-2.5 rounded-xl border text-xs outline-none ${
            darkMode
              ? 'bg-slate-900 border-slate-700 text-white'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <option>Online</option>
          <option>In Person</option>
          <option>Either</option>
        </select>
      </div>

      <button
        type="button"
        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
      >
        Save Learning Preferences
      </button>
    </div>
  );
}