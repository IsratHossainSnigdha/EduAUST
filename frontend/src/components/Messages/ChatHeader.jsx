import React from 'react';

export default function ChatHeader({
  activeChat,
  darkMode,
}) {
  if (!activeChat) return null;

  const participant = activeChat.participant;

  return (
    <div
      className={`p-3.5 border-b flex items-center justify-between shrink-0 ${
        darkMode
          ? 'border-slate-800 bg-[#1f2937]'
          : 'border-slate-100 bg-white'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          {participant?.avatar ? (
            <img
              src={participant.avatar}
              alt={participant?.name || 'User'}
              className="w-9 h-9 rounded-full object-cover"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-black">
              {(participant?.name ?? '?')
                .charAt(0)
                .toUpperCase()}
            </div>
          )}
        </div>

        <div>
          <h4
            className={`text-xs font-black ${
              darkMode
                ? 'text-white'
                : 'text-slate-900'
            }`}
          >
            {participant?.name ?? 'Unknown'}
          </h4>

          <p
            className={`text-[10px] ${
              darkMode
                ? 'text-slate-300'
                : 'text-slate-500'
            }`}
          >
            {participant?.department ?? 'AUST'}
          </p>
        </div>
      </div>
    </div>
  );
}