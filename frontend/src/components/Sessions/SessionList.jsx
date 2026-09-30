import React, { useState } from 'react';
import { BookOpen, Calendar, Check, Clock, MapPin, X } from 'lucide-react';
import UserAvatar from '../UserAvatar';
import { formatDuration, formatWhen } from '../../lib/dates';

/*
 * Sessions a person has coming up, or has already had.
 *
 * The same row reads from either end: the tutor and the student see the other
 * one's name, so nothing here needs to know which side is looking.
 */

const STATUS_STYLES = {
  proposed: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20',
  confirmed: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  completed: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/20',
  cancelled: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20',
};

export default function SessionList({
  darkMode,
  sessions,
  loading,
  emptyMessage = 'Nothing scheduled yet.',
  onConfirm,
  onCancel,
  busyId,
}) {
  const [confirmingCancel, setConfirmingCancel] = useState(null);

  const rowBg = darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200';
  const muted = darkMode ? 'text-slate-400' : 'text-slate-500';
  const heading = darkMode ? 'text-white' : 'text-slate-900';

  if (loading) {
    return (
      <div className="space-y-2">
        {[0, 1].map((i) => (
          <div
            key={i}
            className={`h-20 rounded-xl animate-pulse ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}
          />
        ))}
      </div>
    );
  }

  if (!sessions?.length) {
    return (
      <div className="text-center py-8">
        <Calendar size={22} className="mx-auto text-emerald-500/60 mb-2" />
        <p className={`text-xs font-semibold ${muted}`}>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sessions.map((s) => (
        <div key={s.id} className={`rounded-xl border p-3.5 ${rowBg}`}>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <UserAvatar user={{ name: s.with?.name, profile_picture: s.with?.avatar }} size={38} />

              <div className="min-w-0">
                <h3 className={`text-xs font-black truncate ${heading}`}>
                  {s.with?.name ?? 'Someone'}
                </h3>

                <p className={`text-xs font-semibold ${muted}`}>
                  {/* Which side of this the reader is on, so a row is never ambiguous. */}
                  {s.role === 'tutor' ? 'You are teaching' : 'Your tutor'}
                  {s.with?.department ? ` · ${s.with.department}` : ''}
                </p>
              </div>
            </div>

            <span
              className={`shrink-0 text-xs font-extrabold px-2 py-1 rounded border capitalize ${
                STATUS_STYLES[s.status] ?? STATUS_STYLES.proposed
              }`}
            >
              {s.status === 'proposed' && !s.can_confirm ? 'Awaiting reply' : s.status}
            </span>
          </div>

          <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 mt-2.5 text-xs font-semibold ${muted}`}>
            <span className="flex items-center gap-1.5">
              <Calendar size={11} /> {formatWhen(s.scheduled_at)}
            </span>

            <span className="flex items-center gap-1.5">
              <Clock size={11} /> {formatDuration(s.duration_minutes)}
            </span>

            {s.subject && (
              <span className="flex items-center gap-1.5">
                <BookOpen size={11} /> {s.subject}
              </span>
            )}

            {s.location && (
              <span className="flex items-center gap-1.5">
                <MapPin size={11} /> {s.location}
              </span>
            )}
          </div>

          {s.note && <p className={`text-xs mt-2 ${muted}`}>{s.note}</p>}

          {(s.can_confirm || s.can_cancel) && (
            <div className="flex items-center gap-2 mt-3">
              {/* Only the side that did not propose it is asked to agree. */}
              {s.can_confirm && (
                <button
                  type="button"
                  disabled={busyId === s.id}
                  onClick={() => onConfirm?.(s)}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                >
                  <Check size={12} /> Confirm
                </button>
              )}

              {s.can_cancel && confirmingCancel !== s.id && (
                <button
                  type="button"
                  onClick={() => setConfirmingCancel(s.id)}
                  className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition ${
                    darkMode
                      ? 'border-slate-700 text-slate-300 hover:border-rose-500/60 hover:text-rose-400'
                      : 'border-slate-200 text-slate-600 hover:border-rose-300 hover:text-rose-500'
                  }`}
                >
                  <X size={12} /> Cancel
                </button>
              )}

              {confirmingCancel === s.id && (
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${muted}`}>Cancel this session?</span>

                  <button
                    type="button"
                    disabled={busyId === s.id}
                    onClick={() => {
                      setConfirmingCancel(null);
                      onCancel?.(s);
                    }}
                    className="bg-rose-500 hover:bg-rose-600 disabled:opacity-60 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                  >
                    Yes, cancel it
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfirmingCancel(null)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition ${
                      darkMode ? 'border-slate-700 text-slate-300' : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Keep it
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
