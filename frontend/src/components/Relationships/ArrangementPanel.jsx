import React, { useState } from 'react';
import { BookOpen, Clock, MessageSquare, Star, UserMinus } from 'lucide-react';
import UserAvatar from '../UserAvatar';
import StarRating from '../StarRating';
import ReviewForm from '../Reviews/ReviewForm';

/*
 * One side of a tutoring arrangement, listed and managed.
 *
 * A tutor's students and a student's tutors are the same relationship read
 * from opposite ends, so they are the same panel with different wording. They
 * were briefly two near-identical files, which is two places for every fix.
 */

/**
 * A date as a reader wants it, not as the API stores it.
 */
export function formatDate(iso) {
  if (!iso) return null;

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * How long the arrangement ran, in the largest unit that is not a lie.
 */
export function describeSpan(fromIso, toIso) {
  if (!fromIso) return null;

  const from = new Date(fromIso);
  const to = toIso ? new Date(toIso) : new Date();

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return null;

  const days = Math.max(0, Math.floor((to - from) / 86400000));

  if (days < 1) return 'today';
  if (days < 31) return `${days} day${days === 1 ? '' : 's'}`;

  /*
   * Calendar months, not days divided by an average month. Dividing made
   * 23 December to 23 June read as five months rather than six.
   */
  let months =
    (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());

  // The final month has not completed if the day of the month has not come
  // round yet.
  if (to.getDate() < from.getDate()) months -= 1;

  months = Math.max(1, months);

  if (months < 12) return `${months} month${months === 1 ? '' : 's'}`;

  const years = Math.floor(months / 12);
  const rest = months % 12;

  return rest === 0
    ? `${years} year${years === 1 ? '' : 's'}`
    : `${years}y ${rest}m`;
}

export default function ArrangementPanel({
  darkMode,
  anchorId,
  title,
  /** Which key on a row identifies the other person. */
  idKey,
  current,
  past,
  loading,
  searchQuery = '',
  /** 'student_to_tutor' rates a tutor; 'tutor_to_student' rates a student. */
  reviewDirection,
  labels,
  onMessage,
  onRemove,
  onOpenProfile,
  onRated,
}) {
  const [tab, setTab] = useState('current');
  const [rating, setRating] = useState(null);
  const [confirming, setConfirming] = useState(null);

  const cardBg = darkMode ? 'bg-[#1f2937] border-slate-800' : 'bg-white border-slate-100';
  const rowBg = darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200';
  const muted = darkMode ? 'text-slate-400' : 'text-slate-500';
  const heading = darkMode ? 'text-white' : 'text-slate-900';

  const iconBtn = darkMode
    ? 'border-slate-700 text-slate-300 hover:bg-slate-700'
    : 'border-slate-200 text-slate-600 hover:bg-white';

  const currentRows = current ?? [];
  const pastRows = past ?? [];
  const isPast = tab === 'past';

  const term = searchQuery.trim().toLowerCase();

  const match = (row) =>
    !term ||
    row.name?.toLowerCase().includes(term) ||
    row.department?.toLowerCase().includes(term) ||
    row.subjects?.some((x) => x.toLowerCase().includes(term));

  const shown = (isPast ? pastRows : currentRows).filter(match);

  const tabs = [
    { key: 'current', label: labels.currentTab, count: currentRows.length },
    { key: 'past', label: labels.pastTab, count: pastRows.length },
  ];

  const Empty = labels.emptyIcon;

  return (
    <div className={`p-5 rounded-2xl border space-y-4 ${cardBg}`} id={anchorId}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-300">
          {title}
        </h2>

        {/* Who is here now, and who used to be. */}
        <div className="flex items-center gap-1.5">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                setTab(t.key);
                setRating(null);
                setConfirming(null);
              }}
              className={`text-[11px] font-bold px-2.5 py-1 rounded-full transition ${
                tab === t.key
                  ? 'bg-emerald-600 text-white'
                  : darkMode
                    ? 'bg-slate-800 text-slate-300 hover:text-white'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="space-y-2">
          {[0, 1].map((i) => (
            <div
              key={i}
              className={`h-16 rounded-xl animate-pulse ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}
            />
          ))}
        </div>
      )}

      {!loading && shown.length === 0 && (
        <div className="text-center py-8">
          <Empty size={22} className="mx-auto text-emerald-500/60 mb-2" />
          <p className={`text-xs font-semibold ${muted}`}>
            {term ? labels.noMatch : isPast ? labels.pastEmpty : labels.currentEmpty}
          </p>
        </div>
      )}

      <div className="space-y-2">
        {!loading &&
          shown.map((row) => {
            const id = row[idKey];
            const started = formatDate(row.since);
            const ended = formatDate(row.ended_at);
            const span = describeSpan(row.since, row.ended_at);

            return (
              <div key={id} className={`rounded-xl border p-3.5 ${rowBg}`}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <button
                    type="button"
                    onClick={() => onOpenProfile?.(id)}
                    className="flex items-center gap-3 min-w-0 text-left rounded-lg -m-1 p-1 transition hover:opacity-80"
                    title={`View ${row.name}`}
                  >
                    <UserAvatar user={{ name: row.name, profile_picture: row.avatar }} size={38} />

                    <div className="min-w-0">
                      <h3 className={`text-xs font-black truncate ${heading}`}>{row.name}</h3>
                      <p className={`text-[11px] font-semibold ${muted}`}>
                        {[row.department, row.semester].filter(Boolean).join(' · ')}
                      </p>

                      {row.rating || row.my_rating ? (
                        <StarRating
                          value={row.rating ?? row.my_rating}
                          size={10}
                          darkMode={darkMode}
                          showEmpty={false}
                        />
                      ) : null}
                    </div>
                  </button>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onMessage?.(row)}
                      title="Message"
                      className={`p-2 rounded-lg border transition ${iconBtn}`}
                    >
                      <MessageSquare size={13} />
                    </button>

                    <button
                      type="button"
                      onClick={() => setRating(rating === id ? null : id)}
                      title={row.my_rating ? 'Edit your rating' : labels.rateTitle}
                      className={`p-2 rounded-lg border transition ${
                        row.my_rating ? 'border-amber-400 text-amber-500' : iconBtn
                      }`}
                    >
                      <Star size={13} />
                    </button>

                    {/* Nothing to end on a finished arrangement. */}
                    {!isPast && (
                      <button
                        type="button"
                        disabled={row.can_end === false}
                        onClick={() => setConfirming(confirming === id ? null : id)}
                        title={
                          row.can_end === false
                            ? row.end_blocked_reason || labels.removeTitle
                            : labels.removeTitle
                        }
                        className={`p-2 rounded-lg border transition ${
                          row.can_end === false
                            ? 'border-slate-300 text-slate-400 opacity-50 cursor-not-allowed dark:border-slate-700 dark:text-slate-600'
                            : darkMode
                              ? 'border-rose-500/60 text-rose-400 hover:bg-rose-500 hover:text-white'
                              : 'border-rose-200 text-rose-500 hover:bg-rose-500 hover:text-white'
                        }`}
                      >
                        <UserMinus size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* When it started, and when it finished. */}
                {(started || ended) && (
                  <div
                    className={`flex items-center gap-1.5 mt-2 text-[11px] font-semibold ${muted}`}
                  >
                    <Clock size={10} className="shrink-0" />
                    <span>
                      {started ? `${labels.sinceWord} ${started}` : 'Start date unknown'}
                      {ended ? ` · ended ${ended}` : ''}
                      {span ? ` · ${span}` : ''}
                    </span>
                  </div>
                )}

                {row.subjects?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {row.subjects.map((subject) => (
                      <span
                        key={subject}
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          darkMode
                            ? 'bg-slate-900 text-slate-300'
                            : 'bg-white text-slate-600 border border-slate-200'
                        }`}
                      >
                        <BookOpen size={9} /> {subject}
                      </span>
                    ))}
                  </div>
                )}

                {/* Say why the button is dead rather than leaving them to guess. */}
                {!isPast && row.can_end === false && row.end_blocked_reason && (
                  <p
                    className={`mt-2.5 text-[11px] font-semibold rounded-lg px-2.5 py-2 ${
                      darkMode
                        ? 'bg-amber-500/10 text-amber-300'
                        : 'bg-amber-500/10 text-amber-700'
                    }`}
                  >
                    {row.end_blocked_reason}
                  </p>
                )}

                {/* Ending an arrangement is not a one-tap accident. */}
                {confirming === id && (
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <p className={`text-xs ${muted}`}>
                      {labels.confirmCopy(row.name?.split(' ')[0] ?? 'them')}
                    </p>

                    <div className="flex items-center gap-2 mt-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setConfirming(null);
                          onRemove?.(row);
                        }}
                        className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                      >
                        {labels.confirmButton}
                      </button>

                      <button
                        type="button"
                        onClick={() => setConfirming(null)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition ${
                          darkMode
                            ? 'border-slate-700 text-slate-300'
                            : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {rating === id && (
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <ReviewForm
                      darkMode={darkMode}
                      direction={reviewDirection}
                      tutor={{
                        id,
                        name: row.name,
                        avatar: row.avatar,
                        department: row.department,
                      }}
                      existing={row.my_rating ? { rating: row.my_rating } : null}
                      onCancel={() => setRating(null)}
                      onSaved={() => {
                        setRating(null);
                        onRated?.();
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
