import React from 'react';

/*
 * How long ago the request arrived, in the short form the card uses.
 */
function timeAgo(iso) {
  if (!iso) return '';

  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);

  if (Number.isNaN(seconds)) return '';
  if (seconds < 60) return 'just now';

  const units = [
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];

  for (const [label, size] of units) {
    const amount = Math.floor(seconds / size);

    if (amount >= 1) {
      return `${amount} ${label}${amount > 1 ? 's' : ''} ago`;
    }
  }

  return 'just now';
}

const STATUS_STYLES = {
  pending: 'bg-emerald-500/10 text-emerald-500',
  accepted: 'bg-sky-500/10 text-sky-500',
  declined: 'bg-rose-500/10 text-rose-500',
};

export default function RequestItem({
  request,
  darkMode,
  onRespond,
}) {
  // A request may carry no subject, so the avatar falls back to the student.
  const label = request.subject || request.student?.name || '?';
  const status = request.status || 'pending';

  return (
    <div
      className={`flex items-center justify-between p-3.5 rounded-xl border transition-colors ${
        darkMode
          ? 'bg-slate-800/70 border-slate-700'
          : 'bg-slate-50 border-slate-200'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 shrink-0 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs">
          {label.slice(0, 2).toUpperCase()}
        </div>

        <div className="min-w-0">
          <h4
            className={`text-xs font-black truncate ${
              darkMode ? 'text-white' : 'text-slate-900'
            }`}
          >
            {request.subject || 'General tutoring'}
          </h4>

          <p
            className={`text-[10px] truncate ${
              darkMode ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            {[request.student?.name, request.level]
              .filter(Boolean)
              .join(' • ')}
          </p>
        </div>
      </div>

      <div className="text-right shrink-0 pl-3">
        <span
          className={`text-[10px] block mb-1 ${
            darkMode ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          {timeAgo(request.created_at)}
        </span>

        {status === 'pending' && onRespond ? (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onRespond(request.id, 'accepted')}
              className="text-[9px] font-extrabold px-2 py-1 rounded bg-emerald-500 text-white hover:bg-emerald-600 transition"
            >
              Accept
            </button>
            <button
              type="button"
              onClick={() => onRespond(request.id, 'declined')}
              className="text-[9px] font-extrabold px-2 py-1 rounded border border-rose-500 text-rose-500 hover:bg-rose-500 hover:text-white transition"
            >
              Decline
            </button>
          </div>
        ) : (
          <span
            className={`text-[9px] font-extrabold px-2 py-0.5 rounded capitalize ${
              STATUS_STYLES[status] || STATUS_STYLES.pending
            }`}
          >
            {status}
          </span>
        )}
      </div>
    </div>
  );
}
