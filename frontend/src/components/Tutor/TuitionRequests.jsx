import React from 'react';
import { Plus } from 'lucide-react';
import RequestItem from './RequestItem';

export default function TuitionRequests({
  darkMode,
  navigate,
}) {
  const requests = [
    {
      subject: 'Data Structures',
      level: 'University Level',
      time: '2 hours ago',
      status: 'New',
    },
    {
      subject: 'Discrete Mathematics',
      level: 'HSC 2nd Year',
      time: '5 hours ago',
      status: 'New',
    },
    {
      subject: 'Algorithms',
      level: 'University Level',
      time: '1 day ago',
      status: 'Viewed',
    },
  ];

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
          {requests.map((request) => (
            <RequestItem
              key={`${request.subject}-${request.time}`}
              request={request}
              darkMode={darkMode}
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