import React from 'react';
import { CheckCheck } from 'lucide-react';

export default function MessageBubble({
  message,
  darkMode,
}) {
  return (
    <div
      className={`flex flex-col ${
        message.sent_by_me
          ? 'items-end'
          : 'items-start'
      }`}
    >
      <div
        className={`max-w-md p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap break-words ${
          message.sent_by_me
            ? 'bg-emerald-600 text-white rounded-br-none shadow-sm'
            : darkMode
            ? 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700/80 shadow-sm'
            : 'bg-white text-slate-800 rounded-bl-none shadow-sm border border-slate-100'
        }`}
      >
        {message.body}
      </div>

      <div className="flex items-center gap-1 mt-1">
        <span
          className={`text-[10px] font-semibold ${
            darkMode
              ? 'text-slate-300'
              : 'text-slate-500'
          }`}
        >
          {message.time}
        </span>

        {message.sent_by_me && (
          <CheckCheck
            size={12}
            className={
              message.read
                ? 'text-emerald-500'
                : 'text-slate-400'
            }
          />
        )}
      </div>
    </div>
  );
}