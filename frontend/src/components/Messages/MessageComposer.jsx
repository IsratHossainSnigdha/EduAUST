import React, { useEffect, useRef, useState } from 'react';
import { Smile, Send } from 'lucide-react';

/*
 * A short list rather than a full picker: these are the ones that come up in
 * a conversation about coursework, and a handful you can see at a glance
 * beats a grid you have to search.
 */
const EMOJI = [
  '👍', '🙏', '😀', '😅', '🎉', '🔥',
  '✅', '❌', '❓', '💡', '📚', '✏️',
  '⏰', '👀', '💯', '🤔', '😭', '🙌',
];

export default function MessageComposer({
  darkMode,
  messageInput,
  setMessageInput,
  onSubmit,
  sending,
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef(null);
  const inputRef = useRef(null);

  // A picker that stays open over the thing you clicked next is worse than
  // no picker.
  useEffect(() => {
    if (!pickerOpen) return undefined;

    const onPointerDown = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setPickerOpen(false);
      }
    };

    const onKeyDown = (event) => {
      if (event.key === 'Escape') setPickerOpen(false);
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [pickerOpen]);

  /*
   * Insert at the caret rather than appending, so picking one in the middle
   * of a half-typed sentence puts it where the writer was looking.
   */
  const insert = (emoji) => {
    const input = inputRef.current;
    const at = input?.selectionStart ?? messageInput.length;
    const end = input?.selectionEnd ?? at;

    const next = messageInput.slice(0, at) + emoji + messageInput.slice(end);

    setMessageInput(next);
    setPickerOpen(false);

    // Put the caret after what was just inserted.
    requestAnimationFrame(() => {
      if (!input) return;

      input.focus();
      const caret = at + emoji.length;
      input.setSelectionRange(caret, caret);
    });
  };

  return (
    <form
      onSubmit={onSubmit}
      className={`p-3 border-t flex items-center gap-2 shrink-0 ${
        darkMode
          ? 'border-slate-800 bg-[#1f2937]'
          : 'border-slate-100 bg-white'
      }`}
    >
      {/* Input */}
      <div
        className={`flex-grow flex items-center gap-2 px-3.5 py-2 rounded-xl border ${
          darkMode
            ? 'bg-slate-900 border-slate-700 text-white'
            : 'bg-slate-50 border-slate-200 text-slate-800'
        }`}
      >
        <input
          ref={inputRef}
          type="text"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          placeholder="Type a message..."
          aria-label="Message"
          className="bg-transparent border-none outline-none text-xs w-full"
          disabled={sending}
        />

        <div className="relative" ref={pickerRef}>
          <button
            type="button"
            onClick={() => setPickerOpen((open) => !open)}
            className={`transition ${
              pickerOpen ? 'text-emerald-600' : 'text-slate-400 hover:text-emerald-600'
            }`}
            aria-label="Add emoji"
            aria-expanded={pickerOpen}
            aria-haspopup="true"
          >
            <Smile size={16} />
          </button>

          {pickerOpen && (
            <div
              className={`absolute bottom-8 right-0 z-20 p-2 rounded-xl border shadow-lg grid grid-cols-6 gap-1 ${
                darkMode
                  ? 'bg-slate-900 border-slate-700'
                  : 'bg-white border-slate-200'
              }`}
            >
              {EMOJI.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => insert(emoji)}
                  aria-label={`Insert ${emoji}`}
                  className={`w-8 h-8 rounded-lg text-base leading-none transition ${
                    darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
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
