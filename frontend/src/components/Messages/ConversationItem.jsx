import { Archive, CheckCircle2, Clock, Lock, MessageSquarePlus, XCircle } from 'lucide-react';
import React from 'react';
import UserAvatar from '../UserAvatar';

/*
 * Where a contact stands, at a glance.
 *
 * A row can be one of a few things, and the icon says which without the reader
 * having to open it:
 *   - active   an accepted request, chat open
 *   - waiting  a request sent, no answer yet
 *   - declined the tutor said no
 *   - new      nobody has asked yet, so a request is the way in
 */
const STATUS = {
  active: {
    icon: CheckCircle2,
    label: 'Active',
    tint: 'text-emerald-500 bg-emerald-500/10',
  },
  waiting: {
    icon: Clock,
    label: 'Waiting',
    tint: 'text-amber-500 bg-amber-500/10',
  },
  declined: {
    icon: XCircle,
    label: 'Declined',
    tint: 'text-rose-500 bg-rose-500/10',
  },
  ended: {
    icon: Archive,
    label: 'Ended',
    tint: 'text-slate-500 bg-slate-500/10',
  },
  new: {
    icon: MessageSquarePlus,
    label: 'Request',
    tint: 'text-slate-400 bg-slate-400/10',
  },
};

function statusOf(conversation) {
  if (conversation.request_status === 'accepted') return 'active';
  if (conversation.request_status === 'pending') return 'waiting';
  if (conversation.request_status === 'declined') return 'declined';
  // A finished arrangement: the history stays, the chat does not reopen.
  if (conversation.request_status === 'ended') return 'ended';

  return 'new';
}

export default function ConversationItem({
  conversation,
  selected,
  darkMode,
  onClick,
  onOpenProfile,
}) {
  const participant = conversation.participant;
  const hasUnread = conversation.unread_count > 0;
  const status = STATUS[statusOf(conversation)];
  const StatusIcon = status.icon;

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
      } ${conversation.locked ? 'opacity-70' : ''}`}
    >
      {/* Avatar, with a small status dot so the state reads even at a glance.
          Tapping the picture itself opens the person's profile rather than
          the conversation. */}
      <div
        className="relative shrink-0 cursor-pointer"
        onClick={(e) => {
          if (!onOpenProfile) return;
          e.stopPropagation();
          onOpenProfile(participant?.id);
        }}
        title={`View ${participant?.name ?? 'profile'}`}
      >
        <UserAvatar user={{ name: participant?.name, profile_picture: participant?.avatar }} size={40} />

        <span
          className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center ring-2 ${
            darkMode ? 'ring-[#111827]' : 'ring-white'
          } ${status.tint}`}
          title={status.label}
        >
          <StatusIcon size={9} />
        </span>
      </div>

      {/* Conversation info */}
      <div className="flex-grow min-w-0">
        <div className="flex items-center justify-between mb-0.5 gap-2">
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
              darkMode ? 'text-slate-300' : 'text-slate-500'
            }`}
          >
            {conversation.last_message?.time ?? ''}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
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
              ? `${conversation.last_message.sent_by_me ? 'You: ' : ''}${conversation.last_message.body}`
              : status.label === 'Waiting'
                ? 'Waiting for them to accept…'
                : status.label === 'Declined'
                  ? 'Request declined'
                  : status.label === 'Ended'
                    ? 'Tutoring ended'
                    : status.label === 'Request'
                      ? 'Send a request to start chatting'
                      : 'No messages yet'}
          </p>

          {/* A small text tag mirrors the dot for anyone who reads labels
              faster than colours. */}
          <span
            className={`shrink-0 text-[8px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded-full ${status.tint}`}
          >
            {status.label}
          </span>
        </div>
      </div>

      {/* Unread badge, or a lock for a contact not yet reachable */}
      {hasUnread ? (
        <span className="min-w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] font-black flex items-center justify-center shrink-0 px-1.5">
          {conversation.unread_count}
        </span>
      ) : conversation.locked ? (
        <Lock size={13} className="shrink-0 text-slate-400" />
      ) : null}
    </div>
  );
}
