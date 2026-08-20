import React from 'react';
import {
  Paperclip,
  Smile,
  Send,
} from 'lucide-react';

export default function MessageComposer({
  darkMode,
  messageInput,
  setMessageInput,
  onSubmit,
  sending,
}) {
  return (
    <form
      onSubmit={onSubmit}
      className={`p-3 border-t flex items-center gap-2 shrink-0 ${
        darkMode
          ? 'border-slate-800 bg-[#1f2937]'
          : 'border-slate-100 bg-white'
      }`}
    >
      {/* Attachment */}
      <button
        type="button"
        className="text-slate-400 hover:text-emerald-600 transition"
        aria-label="Attach file"
      >
        <Paperclip size={16} />
      </button>

      {/* Input */}
      <div
        className={`flex-grow flex items-center gap-2 px-3.5 py-2 rounded-xl border ${
          darkMode
            ? 'bg-slate-900 border-slate-700 text-white'
            : 'bg-slate-50 border-slate-200 text-slate-800'
        }`}
      >
        <input
          type="text"
          value={messageInput}
          onChange={(e) =>
            setMessageInput(e.target.value)
          }
          placeholder="Type a message..."
          className="bg-transparent border-none outline-none text-xs w-full"
          disabled={sending}
        />

        <button
          type="button"
          className="text-slate-400 hover:text-emerald-600 transition"
          aria-label="Add emoji"
        >
          <Smile size={16} />
        </button>
      </div>

      {/* Send */}
      <button
        type="submit"
        disabled={sending || !messageInput.trim()}
        className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-xl transition shadow-md shadow-emerald-500/20"
        aria-label="Send message"
      >
        <Send size={15} />
      </button>
    </form>
  );
}