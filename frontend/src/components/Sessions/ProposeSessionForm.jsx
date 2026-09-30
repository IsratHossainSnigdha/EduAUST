import React, { useState } from 'react';
import { apiPost, firstError } from '../../lib/auth';

/*
 * Suggest a time to the other side of an arrangement.
 *
 * Deliberately short: a day and time, how long, and where. Anything else can
 * be said in the note or in the conversation the pair already have.
 */

const DURATIONS = [
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
];

/**
 * The soonest sensible default: tomorrow afternoon, in the format the
 * datetime-local input wants.
 */
function defaultWhen() {
  const when = new Date();

  when.setDate(when.getDate() + 1);
  when.setHours(15, 0, 0, 0);

  const pad = (n) => String(n).padStart(2, '0');

  return `${when.getFullYear()}-${pad(when.getMonth() + 1)}-${pad(when.getDate())}T${pad(when.getHours())}:${pad(when.getMinutes())}`;
}

export default function ProposeSessionForm({
  darkMode,
  requestId,
  withName,
  onCancel,
  onProposed,
}) {
  const [when, setWhen] = useState(defaultWhen);
  const [duration, setDuration] = useState(60);
  const [location, setLocation] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const muted = darkMode ? 'text-slate-400' : 'text-slate-500';
  const labelClass = `block text-xs font-extrabold mb-1.5 uppercase tracking-wider ${muted}`;

  const fieldClass = `w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
    darkMode
      ? 'bg-slate-900 border-slate-700 text-white'
      : 'bg-white border-slate-200 text-slate-900'
  }`;

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    const { ok, body } = await apiPost('/sessions', {
      tuition_request_id: requestId,
      // The input gives local wall-clock time, which is what was meant.
      scheduled_at: when.replace('T', ' ') + ':00',
      duration_minutes: duration,
      location: location.trim() || null,
      note: note.trim() || null,
    });

    setSaving(false);

    if (!ok) {
      setError(firstError(body, 'Could not propose that session.'));

      return;
    }

    onProposed?.(body?.data);
  };

  const id = `propose-${requestId}`;

  return (
    <form onSubmit={submit} className="space-y-3">
      <p className={`text-xs ${muted}`}>
        Suggest a time to {withName ?? 'them'}. They confirm before it is booked.
      </p>

      {error && (
        <p className="text-xs font-semibold text-rose-500 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor={`${id}-when`} className={labelClass}>
            Date and time
          </label>
          <input
            id={`${id}-when`}
            type="datetime-local"
            required
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor={`${id}-duration`} className={labelClass}>
            How long
          </label>
          <select
            id={`${id}-duration`}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className={fieldClass}
          >
            {DURATIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor={`${id}-where`} className={labelClass}>
          Where (optional)
        </label>
        <input
          id={`${id}-where`}
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Library 3rd floor, CSE Lab 2, or a meeting link"
          maxLength={160}
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor={`${id}-note`} className={labelClass}>
          Anything to add (optional)
        </label>
        <textarea
          id={`${id}-note`}
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Bring last week's problem set"
          maxLength={500}
          className={fieldClass}
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={saving}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition"
        >
          {saving ? 'Proposing…' : 'Propose session'}
        </button>

        <button
          type="button"
          onClick={onCancel}
          className={`text-xs font-bold px-3.5 py-2 rounded-lg border transition ${
            darkMode ? 'border-slate-700 text-slate-300' : 'border-slate-200 text-slate-600'
          }`}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
