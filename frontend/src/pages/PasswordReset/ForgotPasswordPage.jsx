import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MailCheck } from 'lucide-react';

import AuthShell from './AuthShell';
import { apiPost, firstError } from '../../lib/auth';

/*
 * Ask for a password reset link.
 *
 * The server has always been able to email one, but nothing on the site led
 * there, so a student who forgot their password had no way back in.
 */
export default function ForgotPasswordPage({ darkMode }) {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [sentTo, setSentTo] = useState('');

  const inputClass = darkMode
    ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-600 focus:border-emerald-500'
    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500';
  const labelClass = darkMode ? 'text-slate-400' : 'text-slate-600';
  const mutedClass = darkMode ? 'text-slate-400' : 'text-slate-600';

  const submit = async (event) => {
    event.preventDefault();

    const address = email.trim().toLowerCase();

    if (!address.endsWith('@aust.edu')) {
      setError('Please use your AUST email address (@aust.edu).');

      return;
    }

    setError('');
    setSending(true);

    const { ok, body } = await apiPost('/auth/forgot-password', { email: address });

    setSending(false);

    if (!ok) {
      setError(firstError(body, 'Could not send the reset link. Please try again.'));

      return;
    }

    setSentTo(address);
  };

  if (sentTo) {
    return (
      <AuthShell darkMode={darkMode} title="Check your inbox">
        <div className="space-y-5 text-center" role="status">
          <MailCheck size={40} className="mx-auto text-emerald-500" aria-hidden="true" />

          <p className={`text-sm ${mutedClass}`}>
            We sent a password reset link to <strong className="break-all">{sentTo}</strong>. It
            works for 60 minutes.
          </p>

          <p className={`text-xs ${mutedClass}`}>
            Nothing there? Check your spam folder, or{' '}
            <button
              type="button"
              onClick={() => setSentTo('')}
              className="font-bold text-emerald-600 hover:underline"
            >
              send it again
            </button>
            .
          </p>

          <Link
            to="/login"
            className="block w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-2xl font-bold transition-all"
          >
            Back to sign in
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      darkMode={darkMode}
      title="Forgot your password?"
      subtitle="Enter your AUST email and we will send you a link to choose a new one."
    >
      <form onSubmit={submit} className="space-y-5" noValidate>
        {error && (
          <p role="alert" className="text-red-500 text-sm font-semibold bg-red-500/10 p-3 rounded-xl">
            {error}
          </p>
        )}

        <div className="space-y-2">
          <label htmlFor="forgot-email" className={`text-xs font-bold uppercase ${labelClass}`}>
            AUST Email
          </label>
          <input
            id="forgot-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name.dept.id@aust.edu"
            className={`login-input ${inputClass}`}
          />
        </div>

        <button
          type="submit"
          disabled={sending}
          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-wait text-white py-3.5 rounded-2xl font-bold transition-all"
        >
          {sending ? 'Sending…' : 'Send reset link'}
        </button>

        <p className={`text-center text-xs ${mutedClass}`}>
          Remembered it?{' '}
          <Link to="/login" className="font-bold text-emerald-600 hover:underline">
            Back to sign in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
