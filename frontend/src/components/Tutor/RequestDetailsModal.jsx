import React from 'react';
import { X, Check, Mail, BookOpen } from 'lucide-react';

export default function RequestDetailsModal({
  request,
  darkMode,
  onClose,
  onAccept,
}) {
  if (!request) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-lg rounded-2xl border shadow-2xl ${
          darkMode
            ? 'bg-[#1f2937] border-slate-700 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-black">
              Tuition Request Details
            </h2>

            <p
              className={`text-xs mt-1 ${
                darkMode
                  ? 'text-slate-400'
                  : 'text-slate-500'
              }`}
            >
              Review the student's request before responding.
            </p>
          </div>

          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition ${
              darkMode
                ? 'hover:bg-slate-700 text-slate-300'
                : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Student */}
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black">
              {request.initials}
            </div>

            <div>
              <h3 className="text-sm font-black">
                {request.name}
              </h3>

              <div className="flex items-center gap-2 mt-1">
                <Mail
                  size={12}
                  className={
                    darkMode
                      ? 'text-slate-400'
                      : 'text-slate-500'
                  }
                />

                <p
                  className={`text-xs ${
                    darkMode
                      ? 'text-slate-400'
                      : 'text-slate-500'
                  }`}
                >
                  {request.email}
                </p>
              </div>
            </div>
          </div>

          {/* Subject */}
          <div
            className={`p-4 rounded-xl ${
              darkMode
                ? 'bg-slate-800'
                : 'bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              <BookOpen
                size={16}
                className="text-emerald-500"
              />

              <span className="text-xs font-black">
                Subject
              </span>
            </div>

            <h4 className="text-sm font-bold">
              {request.subject}
            </h4>

            <span
              className={`inline-block mt-2 text-[9px] px-2 py-1 rounded ${
                darkMode
                  ? 'bg-slate-700 text-slate-300'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {request.level}
            </span>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-black mb-2">
              Request Description
            </h4>

            <p
              className={`text-sm leading-6 ${
                darkMode
                  ? 'text-slate-300'
                  : 'text-slate-600'
              }`}
            >
              {request.description}
            </p>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-4">
            <div
              className={`p-3 rounded-xl ${
                darkMode
                  ? 'bg-slate-800'
                  : 'bg-slate-50'
              }`}
            >
              <p
                className={`text-[10px] ${
                  darkMode
                    ? 'text-slate-400'
                    : 'text-slate-500'
                }`}
              >
                Submitted
              </p>

              <p className="text-xs font-bold mt-1">
                {request.time}
              </p>
            </div>

            <div
              className={`p-3 rounded-xl ${
                darkMode
                  ? 'bg-slate-800'
                  : 'bg-slate-50'
              }`}
            >
              <p
                className={`text-[10px] ${
                  darkMode
                    ? 'text-slate-400'
                    : 'text-slate-500'
                }`}
              >
                Status
              </p>

              <p
                className={`text-xs font-bold mt-1 ${
                  request.status === 'Accepted'
                    ? 'text-emerald-500'
                    : request.status === 'New'
                    ? 'text-amber-500'
                    : 'text-slate-400'
                }`}
              >
                {request.status}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-xl border text-xs font-bold ${
              darkMode
                ? 'border-slate-600 text-slate-300 hover:bg-slate-800'
                : 'border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Close
          </button>

          {request.status !== 'Accepted' && (
            <button
              onClick={() => {
                onAccept(request.id);
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2"
            >
              <Check size={14} />
              Accept Request
            </button>
          )}
        </div>
      </div>
    </div>
  );
}