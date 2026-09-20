import React from 'react';
import { Plus, Inbox } from 'lucide-react';
import RequestItem from './RequestItem';

export default function TuitionRequests({
  darkMode,
  navigate,
  requests,
  loading,
  onRespond,
}) {
  const items = requests ?? [];

  return (
    <div
      className={`p-6 rounded-2xl border shadow-sm flex flex-col justify-between ${
        darkMode
          ? 'bg-[#1f2937] border-slate-800'
          : 'bg-white border-slate-100'
      }`}
    >
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3
            className={`text-sm font-black uppercase tracking-wider ${
              darkMode
                ? 'text-white'
                : 'text-slate-900'
            }`}
          >
            Recent Tuition Requests
          </h3>

          <button
            onClick={() =>
              navigate('/tutor-requests')
            }
            className="text-xs font-bold text-emerald-500 hover:underline"
          >
            View all
          </button>
        </div>

        <div className="space-y-3">
          {loading && (
            // Placeholder rows keep the card from collapsing while loading.
            [0, 1, 2].map((row) => (
              <div
                key={row}
                className={`h-16 rounded-xl animate-pulse ${
                  darkMode ? 'bg-slate-800' : 'bg-slate-100'
                }`}
              />
            ))
          )}

          {!loading && items.length === 0 && (
            <div
              className={`flex flex-col items-center justify-center py-10 text-center ${
                darkMode ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              <Inbox size={28} className="mb-2 text-emerald-500/60" />
              <p className="text-xs font-bold">No requests yet</p>
              <p className="text-[11px] mt-1">
                Students who want your help will appear here.
              </p>
            </div>
          )}

          {!loading &&
            items.map((request) => (
              <RequestItem
                key={request.id}
                request={request}
                darkMode={darkMode}
                onRespond={onRespond}
              />
            ))}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
        <button
          onClick={() =>
            navigate('/tutor-requests')
          }
          className="text-xs font-bold text-emerald-500 hover:underline flex items-center justify-center gap-1 mx-auto"
        >
          View all requests
          <Plus size={12} />
        </button>
      </div>
    </div>
  );
}
