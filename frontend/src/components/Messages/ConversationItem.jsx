import React from 'react';

export default function ConversationItem({
  conversation,
  selected,
  darkMode,
  onClick,
}) {
  const participant = conversation.participant;
  const hasUnread = conversation.unread_count > 0;

  return (
    <div
      onClick={onClick}
      className={`p-3.5 flex items-center gap-3 cursor-pointer transition-all ${
        selected
          ? darkMode
            ? 'bg-slate-800 border-l-4 border-emerald-500 shadow-inner'
            : 'bg-emerald-50/80 border-l-4 border-emerald-600'
          : darkMode
          ? 'hover:bg-slate-800/40 border-l-4 border-transparent'
          : 'hover:bg-slate-50 border-l-4 border-transparent'
      }`}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        {participant?.avatar ? (
          <img
            src={participant.avatar}
            alt={participant?.name || 'User'}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-black">
            {(participant?.name ?? '?')
              .charAt(0)
              .toUpperCase()}
          </div>
        )}
      </div>

      {/* Conversation info */}
      <div className="flex-grow min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <h4
            className={`text-xs truncate ${
              selected
                ? darkMode
                  ? 'font-black text-emerald-400'
                  : 'font-black text-emerald-700'
                : hasUnread
                ? darkMode
                  ? 'font-black text-white'
                  : 'font-black text-slate-900'
                : darkMode
                ? 'font-semibold text-slate-200'
                : 'font-medium text-slate-700'
            }`}
          >
            {participant?.name ?? 'Unknown'}
          </h4>

          <span
            className={`text-[10px] shrink-0 font-medium ${
              darkMode
                ? 'text-slate-300'
                : 'text-slate-500'
            }`}
          >
            {conversation.last_message?.time ?? ''}
          </span>
        </div>

        <p
          className={`text-[11px] truncate ${
            hasUnread
              ? darkMode
                ? 'font-bold text-slate-100'
                : 'font-bold text-slate-900'
              : darkMode
              ? 'font-normal text-slate-400'
              : 'font-normal text-slate-500'
          }`}
        >
          {conversation.last_message
            ? `${
                conversation.last_message.sent_by_me
                  ? 'You: '
                  : ''
              }${conversation.last_message.body}`
            : 'No messages yet'}
        </p>
      </div>

      {/* Unread badge */}
      {hasUnread && (
        <span className="min-w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] font-black flex items-center justify-center shrink-0 px-1.5">
          {conversation.unread_count}
        </span>
      )}
    </div>
  );
}