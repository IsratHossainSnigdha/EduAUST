import React from 'react';
import { Inbox } from 'lucide-react';

import TuitionRequestCard from './TuitionRequestCard';

export default function TuitionRequestList({
  darkMode,
  requests,
  loading,
  onAccept,
  onDecline,
  onViewDetails,
}) {
  const items = requests ?? [];

  return (
    <div
      className={`p-6 rounded-2xl border shadow-sm space-y-4 ${
        darkMode
          ? 'bg-[#1f2937] border-slate-800'
          : 'bg-white border-slate-100'
      }`}
    >
      {loading &&
        [0, 1, 2].map((row) => (
          <div
            key={row}
            className={`h-28 rounded-2xl animate-pulse ${
              darkMode ? 'bg-slate-800' : 'bg-slate-100'
            }`}
          />
        ))}

      {!loading && items.length === 0 && (
        <div
          className={`flex flex-col items-center justify-center py-14 text-center ${
            darkMode ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          <Inbox size={32} className="mb-3 text-emerald-500/60" />
          <p className="text-sm font-bold">No tuition requests yet</p>
          <p className="text-xs mt-1">
            When a student asks for your help, their request appears here.
          </p>
        </div>
      )}

      {!loading &&
        items.map((request) => (
          <TuitionRequestCard
            key={request.id}
            request={request}
            darkMode={darkMode}
            onAccept={onAccept}
            onDecline={onDecline}
            onViewDetails={onViewDetails}
          />
        ))}
    </div>
  );
}
