import React, { useState } from 'react';
import { apiPost, firstError } from '../../lib/auth';
import StarRating from '../StarRating';
import UserAvatar from '../UserAvatar';

/*
 * Rating someone you worked with.
 *
 * Runs both ways: by default a student rating the tutor who taught them, or —
 * with direction 'tutor_to_student' — a tutor rating their student. The server
 * enforces that the two actually worked together, so a rating always means a
 * real arrangement. `tutor` is the person being rated, whichever role.
 */
export default function ReviewForm({ darkMode, tutor, existing, direction = 'student_to_tutor', onSaved, onCancel }) {
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [comment, setComment] = useState(existing?.comment ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();

    if (!rating) {
      setError('Please choose a rating.');

      return;
    }

    setError('');
    setSaving(true);

    // A tutor rating a student names student_id; a student rating a tutor
    // names tutor_id. The person being rated is the same `tutor` prop either
    // way — only the field name changes.
    const target = direction === 'tutor_to_student' ? { student_id: tutor.id } : { tutor_id: tutor.id };

    const { ok, body } = await apiPost('/reviews', {
      ...target,
      rating,
      comment: comment.trim() || null,
    });

    setSaving(false);

    if (!ok) {
      setError(firstError(body, 'Could not save your review.'));

      return;
    }

    onSaved?.(body);
  };

  const inputBg = darkMode
    ? 'bg-[#111827] border-slate-700 text-white placeholder-slate-500'
    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400';
  const muted = darkMode ? 'text-slate-400' : 'text-slate-500';

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex items-center gap-3">
        <UserAvatar user={{ name: tutor.name, profile_picture: tutor.avatar }} size={36} />

        <div className="min-w-0">
          <p className={`text-xs font-black truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            {tutor.name}
          </p>
          <p className={`text-[11px] font-semibold ${muted}`}>{tutor.department ?? 'AUST'}</p>
        </div>
      </div>

      <div>
        <label className={`block text-[11px] font-extrabold uppercase tracking-wider mb-2 ${muted}`}>
          Your rating
        </label>
        <StarRating value={rating} onChange={setRating} size={22} darkMode={darkMode} />
      </div>

      <div>
        <label className={`block text-[11px] font-extrabold uppercase tracking-wider mb-2 ${muted}`}>
          Comment <span className="font-medium normal-case tracking-normal">(optional)</span>
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder="What was the tutoring like?"
          className={`w-full px-3 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none ${inputBg}`}
        />
      </div>

      {error && <p className="text-xs text-rose-500 font-semibold">{error}</p>}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={saving}
          className="flex-grow bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl text-xs font-bold transition disabled:opacity-60"
        >
          {saving ? 'Saving…' : existing ? 'Update review' : 'Submit review'}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition ${
              darkMode
                ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
