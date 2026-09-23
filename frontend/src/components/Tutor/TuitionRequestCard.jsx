import React from 'react';
import { Check, X } from 'lucide-react';

export default function TuitionRequestCard({
  request,
  darkMode,
  onAccept,
  onDecline,
  onViewDetails,
}) {
  const SubjectIcon = request.icon;

  // The backend sends lowercase statuses ('pending' / 'accepted' / 'declined').
  // This card used to compare against 'Accepted', which never matched, so the
  // Accept button stayed on a request that was already answered.
  const status = (request.status || 'pending').toLowerCase();
  const isPending = status === 'pending';

  const STATUS_BADGE = {
    pending: 'bg-amber-500/15 text-amber-500',
    accepted: 'bg-emerald-500/15 text-emerald-500',
    declined: 'bg-rose-500/15 text-rose-500',
  };

  return (
    <div
      className={`flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border transition-colors gap-4 ${
        darkMode
          ? 'bg-slate-800/70 border-slate-700'
          : 'bg-slate-50 border-slate-200'
      }`}
    >
      {/* Student Info */}
      <div className="flex items-start md:items-center gap-3.5 min-w-[240px]">
        <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
          {request.initials}
        </div>

        <div>
          <h4
            className={`text-xs font-black ${
              darkMode
                ? 'text-white'
                : 'text-slate-900'
            }`}
          >
            {request.name}
          </h4>

          <p
            className={`text-[10px] ${
              darkMode
                ? 'text-slate-400'
                : 'text-slate-500'
            }`}
          >
            {request.email}
          </p>
        </div>
      </div>

      {/* Subject */}
      <div className="flex-grow space-y-1">
        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shadow-sm ${request.iconColor}`}
          >
            <SubjectIcon size={14} />
          </div>

          <h5
            className={`text-xs font-bold ${
              darkMode
                ? 'text-white'
                : 'text-slate-900'
            }`}
          >
            {request.subject}
          </h5>

          <span
            className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
              darkMode
                ? 'bg-slate-700 text-slate-300'
                : 'bg-slate-200 text-slate-700'
            }`}
          >
            {request.level}
          </span>
        </div>

        <p
          className={`text-[11px] ${
            darkMode
              ? 'text-slate-300'
              : 'text-slate-600'
          }`}
        >
          {request.description}
        </p>
      </div>

      {/* Status + Actions */}
      <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200 dark:border-slate-700">
        <div className="text-left md:text-right">
          <span
            className={`text-[10px] block mb-1 ${
              darkMode
                ? 'text-slate-400'
                : 'text-slate-400'
            }`}
          >
            {request.time}
          </span>

          <span
            className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded ${
              STATUS_BADGE[status] || STATUS_BADGE.pending
            }`}
          >
            {status}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* View Details */}
          <button
            onClick={() => onViewDetails(request)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition ${
              darkMode
                ? 'border-slate-600 hover:bg-slate-700 text-slate-200'
                : 'border-slate-300 hover:bg-slate-100 text-slate-700'
            }`}
          >
            View Details
          </button>

          {/* Only a pending request can be answered; once answered the card
              carries its outcome instead of the action buttons. */}
          {isPending ? (
            <>
              <button
                onClick={() => onDecline?.(request.id)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition ${
                  darkMode
                    ? 'border-rose-500/60 text-rose-400 hover:bg-rose-500 hover:text-white'
                    : 'border-rose-300 text-rose-500 hover:bg-rose-500 hover:text-white'
                }`}
              >
                Decline
              </button>
              <button
                onClick={() => onAccept(request.id)}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm"
              >
                Accept
              </button>
            </>
          ) : status === 'accepted' ? (
            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-500 text-xs font-bold flex items-center gap-1">
              <Check size={12} /> Accepted
            </span>
          ) : (
            <span className="px-3 py-1.5 rounded-xl bg-rose-500/15 text-rose-500 text-xs font-bold flex items-center gap-1">
              <X size={12} /> Declined
            </span>
          )}
        </div>
      </div>
    </div>
  );
}