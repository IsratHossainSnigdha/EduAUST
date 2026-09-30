import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

import { apiDelete, clearAuth, firstError } from '../../lib/auth';

const CONFIRMATION = 'DELETE';

/*
 * Closing the account for good.
 *
 * The button this replaces had no handler. Deleting takes the account's
 * requests, sessions, conversations, reviews and notifications with it, so it
 * asks for the password (where the account has one) and for DELETE typed out,
 * and nothing happens until both are given.
 */
export default function DeleteAccount({ darkMode, hasPassword }) {
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [typed, setTyped] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const ready = typed === CONFIRMATION && (!hasPassword || password !== '');

  const inputClass = `w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 ${
    darkMode
      ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-600'
      : 'bg-white border-rose-200 text-slate-900 placeholder-slate-400'
  }`;
  const mutedClass = darkMode ? 'text-slate-400' : 'text-slate-600';

  const cancel = () => {
    setOpen(false);
    setPassword('');
    setTyped('');
    setError('');
  };

  const submit = async (event) => {
    event.preventDefault();

    if (!ready) return;

    setDeleting(true);
    setError('');

    const payload = { confirmation: typed };
    if (hasPassword) payload.password = password;

    const { ok, body } = await apiDelete('/auth/account', payload);

    if (!ok) {
      setDeleting(false);
      setError(firstError(body, 'Could not delete your account. Please try again.'));

      return;
    }

    // The account is gone; so is the session that belonged to it.
    clearAuth();
    navigate('/', { replace: true });
  };

  return (
    <section
      aria-labelledby="delete-account-title"
      className={`p-5 rounded-2xl border ${
        darkMode ? 'border-rose-500/30 bg-rose-500/5' : 'border-rose-200 bg-rose-50'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 id="delete-account-title" className="text-xs font-black text-rose-500 flex items-center gap-2">
            <AlertTriangle size={14} aria-hidden="true" />
            Delete account
          </h3>
          <p className={`text-xs mt-1 ${mutedClass}`}>
            Permanently remove your EduAUST account. This cannot be undone.
          </p>
        </div>

        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="shrink-0 px-4 py-2 rounded-xl border border-rose-500 text-rose-500 hover:bg-rose-500 hover:text-white text-xs font-bold transition"
          >
            Delete my account…
          </button>
        )}
      </div>

      {open && (
        <form onSubmit={submit} className="mt-4 space-y-4" noValidate>
          <div className={`text-xs ${mutedClass}`}>
            <p className="font-bold">This deletes, for everyone involved:</p>
            <ul className="list-disc pl-5 mt-1 space-y-0.5">
              <li>your profile, and your tutor card if you have one</li>
              <li>your tuition requests and tutoring arrangements</li>
              <li>your sessions, conversations and messages</li>
              <li>reviews you wrote and reviews written about you</li>
              <li>your saved tutors and notifications</li>
            </ul>
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-500 font-semibold bg-red-500/10 p-3 rounded-xl">
              {error}
            </p>
          )}

          {hasPassword && (
            <div>
              <label htmlFor="delete-password" className={`block text-xs font-extrabold mb-2 uppercase tracking-wider ${mutedClass}`}>
                Your password
              </label>
              <input
                id="delete-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
            </div>
          )}

          <div>
            <label htmlFor="delete-confirmation" className={`block text-xs font-extrabold mb-2 uppercase tracking-wider ${mutedClass}`}>
              Type {CONFIRMATION} to confirm
            </label>
            <input
              id="delete-confirmation"
              type="text"
              autoComplete="off"
              spellCheck={false}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={!ready || deleting}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold transition"
            >
              {deleting ? 'Deleting…' : 'Permanently delete my account'}
            </button>

            <button
              type="button"
              onClick={cancel}
              className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition ${
                darkMode ? 'border-slate-700 text-slate-300' : 'border-slate-300 text-slate-700 bg-white'
              }`}
            >
              Keep my account
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
