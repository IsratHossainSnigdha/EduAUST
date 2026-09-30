import React from 'react';
import { UserMinus } from 'lucide-react';
import UserAvatar from '../UserAvatar';

export default function ChatHeader({
  activeChat,
  darkMode,
  currentRole = 'student',
  onRemoveStudent,
  onOpenProfile,
}) {
  if (!activeChat) return null;

  const participant = activeChat.participant;

  // A tutor viewing a student they are currently teaching can end the
  // arrangement from here — that student stops counting as "currently
  // teaching" (they still count as taught).
  const canRemove =
    currentRole === 'tutor' &&
    activeChat.request_status === 'accepted' &&
    activeChat.request_id &&
    typeof onRemoveStudent === 'function';

  return (
    <div
      className={`p-3.5 border-b flex items-center justify-between shrink-0 ${
        darkMode ? 'border-slate-800 bg-[#1f2937]' : 'border-slate-100 bg-white'
      }`}
    >
      {/* The whole identity block opens the profile — tapping someone's
          picture to see who they are is the expected gesture. */}
      <button
        type="button"
        onClick={() => onOpenProfile?.(participant?.id)}
        className="flex items-center gap-3 text-left rounded-xl -m-1 p-1 transition hover:bg-slate-100 dark:hover:bg-slate-800"
        title={`View ${participant?.name ?? 'profile'}`}
      >
        <UserAvatar
          user={{ name: participant?.name, profile_picture: participant?.avatar }}
          size={36}
        />

        <div>
          <h4 className={`text-xs font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            {participant?.name ?? 'Unknown'}
          </h4>

          <p className={`text-[11px] ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}>
            {currentRole === 'tutor' && activeChat.request_status === 'accepted'
              ? `Currently teaching · ${participant?.department ?? 'AUST'}`
              : participant?.department ?? 'AUST'}
          </p>
        </div>
      </button>

      {canRemove && (
        <button
          type="button"
          onClick={() => onRemoveStudent(activeChat)}
          className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition ${
            darkMode
              ? 'border-rose-500/60 text-rose-400 hover:bg-rose-500 hover:text-white'
              : 'border-rose-300 text-rose-500 hover:bg-rose-500 hover:text-white'
          }`}
          title="Stop teaching this student"
        >
          <UserMinus size={13} /> Remove student
        </button>
      )}
    </div>
  );
}
