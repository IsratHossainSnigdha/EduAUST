import React, { useEffect, useState } from 'react';
import { Clock, Lock, Send, XCircle } from 'lucide-react';
import { apiGet, apiPost, firstError } from '../../lib/auth';
import UserAvatar from '../UserAvatar';

/*
 * Asking a tutor for tuition without leaving the chat.
 *
 * Picking a locked tutor used to do nothing but explain why the thread was
 * shut. The student is already here wanting to talk to them, so this is where
 * the request belongs — the thread opens the moment the tutor accepts.
 */
export default function RequestPanel({ darkMode, contact, onSent }) {
  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const status = contact?.request_status ?? null;
  const waiting = status === 'pending';
  const declined = status === 'declined';

  useEffect(() => {
    setError('');
    setMessage('');
    setSubjectId('');
  }, [contact?.user_id]);

  useEffect(() => {
    if (waiting) return undefined;

    let cancelled = false;

    apiGet('/subjects').then(({ ok, body }) => {
      if (cancelled || !ok) return;

      // This endpoint answers with { subjects: [...] }, unlike the listings
      // that answer with { data: [...] }.
      const list = body?.subjects ?? body?.data ?? body;

      setSubjects(Array.isArray(list) ? list : []);
    });

    return () => {
      cancelled = true;
    };
  }, [waiting]);

  const send = async (e) => {
    e.preventDefault();
    setError('');
    setSending(true);

    const { ok, body } = await apiPost('/tuition-requests', {
      tutor_id: contact.user_id,
      subject_id: subjectId ? Number(subjectId) : null,
      message: message.trim() || null,
    });

    setSending(false);

    if (!ok) {
      setError(firstError(body, 'Could not send your request. Please try again.'));

      return;
    }

    onSent?.();
  };

  const cardBg = darkMode ? 'bg-[#1f2937] border-slate-800' : 'bg-white border-slate-200';
  const inputBg = darkMode
    ? 'bg-[#111827] border-slate-700 text-white placeholder-slate-500'
    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400';
  const muted = darkMode ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="flex-grow flex items-center justify-center p-6">
      <div className={`w-full max-w-md rounded-2xl border p-6 ${cardBg}`}>

        <div className="flex items-center gap-3 mb-5">
          <UserAvatar
            user={{ name: contact.participant?.name, profile_picture: contact.participant?.avatar }}
            size={44}
          />

          <div className="min-w-0">
            <h3 className={`text-sm font-black truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {contact.participant?.name}
            </h3>
            <p className={`text-xs font-semibold truncate ${muted}`}>
              {contact.participant?.headline || contact.participant?.department || 'Tutor'}
            </p>
          </div>
        </div>

        {waiting && (
          <div className="text-center py-4">
            <Clock size={22} className="mx-auto text-amber-500 mb-3" />
            <p className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Waiting for a reply
            </p>
            <p className={`text-xs mt-2 ${muted}`}>
              You have already asked {contact.participant?.name?.split(' ')[0]}. The chat opens
              as soon as they accept.
            </p>
          </div>
        )}

        {declined && (
          <div className="text-center py-3 mb-4">
            <XCircle size={20} className="mx-auto text-rose-500 mb-2" />
            <p className={`text-xs ${muted}`}>
              This tutor declined your last request. You can ask again about a different subject.
            </p>
          </div>
        )}

        {!waiting && (
          <form onSubmit={send} className="space-y-4">
            {!declined && (
              <div className="flex items-start gap-2 mb-1">
                <Lock size={13} className={`mt-0.5 shrink-0 ${muted}`} />
                <p className={`text-xs ${muted}`}>
                  Chat opens once {contact.participant?.name?.split(' ')[0]} accepts. Send a
                  request to get started.
                </p>
              </div>
            )}

            <div>
              <label className={`block text-[11px] font-extrabold uppercase tracking-wider mb-2 ${muted}`}>
                Subject
              </label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className={`w-full px-3 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${inputBg}`}
              >
                <option value="">Any subject</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block text-[11px] font-extrabold uppercase tracking-wider mb-2 ${muted}`}>
                Message <span className="font-medium normal-case tracking-normal">(optional)</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                maxLength={1000}
                placeholder="What would you like help with?"
                className={`w-full px-3 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none ${inputBg}`}
              />
            </div>

            {error && (
              <p className="text-xs text-rose-500 font-semibold">{error}</p>
            )}

            <button
              type="submit"
              disabled={sending}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Send size={13} />
              {sending ? 'Sending…' : 'Send tuition request'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
