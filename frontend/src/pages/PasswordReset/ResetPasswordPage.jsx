import React, { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Check, CircleCheck, Eye, EyeOff, X } from 'lucide-react';

import AuthShell from './AuthShell';
import { apiPost, firstError } from '../../lib/auth';
import { checkPassword } from '../../lib/passwordRules';

/*
 * Choose a new password from the link in a reset email.
 *
 * The email has always pointed at /password-reset/{token}, and no such page
 * existed, so the link landed on Not Found.
 */
export default function ResetPasswordPage({ darkMode }) {
  const { token = '' } = useParams();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState(() => searchParams.get('email') ?? '');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [expired, setExpired] = useState(false);
  const [done, setDone] = useState(false);

  const emailFromLink = Boolean(searchParams.get('email'));
  const { results, valid } = checkPassword(password);
  const mismatch = confirmation !== '' && confirmation !== password;

  const inputClass = darkMode
    ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-600 focus:border-emerald-500'
    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500';
  const labelClass = darkMode ? 'text-slate-400' : 'text-slate-600';
  const mutedClass = darkMode ? 'text-slate-400' : 'text-slate-600';

  const submit = async (event) => {
    event.preventDefault();
    setError('');

    if (!valid) {
      setError('Your new password does not meet every requirement yet.');

      return;
    }

    if (password !== confirmation) {
      setError('The two passwords do not match.');

      return;
    }

    setSaving(true);

    const { ok, body } = await apiPost('/auth/reset-password', {
      token,
      email: email.trim().toLowerCase(),
      password,
      password_confirmation: confirmation,
    });

    setSaving(false);

    if (!ok) {
      const message = firstError(body, 'Could not reset your password. Please try again.');

      // A used or out-of-date link cannot be retried; offer a fresh one.
      setExpired(/token is invalid/i.test(message));
      setError(message);

      return;
    }

    setDone(true);
  };

  if (done) {
    return (
      <AuthShell darkMode={darkMode} title="Password changed">
        <div className="space-y-5 text-center" role="status">
          <CircleCheck size={40} className="mx-auto text-emerald-500" aria-hidden="true" />
          <p className={`text-sm ${mutedClass}`}>
            Your password has been reset. Sign in with your new password.
          </p>
          <Link
            to="/login"
            className="block w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-2xl font-bold transition-all"
          >
            Sign in
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      darkMode={darkMode}
      title="Choose a new password"
      subtitle="Pick something you have not used here before."
    >
      <form onSubmit={submit} className="space-y-5" noValidate>
        {error && (
          <div role="alert" className="text-red-500 text-sm font-semibold bg-red-500/10 p-3 rounded-xl space-y-1">
            <p>
              {expired
                ? 'This reset link has expired or has already been used.'
                : error}
            </p>
            {expired && (
              <Link to="/forgot-password" className="inline-block font-bold underline">
                Send me a new link
              </Link>
            )}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="reset-email" className={`text-xs font-bold uppercase ${labelClass}`}>
            AUST Email
          </label>
          <input
            id="reset-email"
            type="email"
            autoComplete="username"
            required
            readOnly={emailFromLink}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`login-input ${inputClass} ${emailFromLink ? 'opacity-70 cursor-not-allowed' : ''}`}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="reset-password" className={`text-xs font-bold uppercase ${labelClass}`}>
            New password
          </label>
          <div className="relative">
            <input
              id="reset-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-describedby="reset-password-rules"
              className={`login-input ${inputClass}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              className="absolute right-4 top-4 text-slate-400"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* The same rule the server applies, shown as it is met. */}
          <ul id="reset-password-rules" className="grid grid-cols-2 gap-x-3 gap-y-1 pt-1">
            {results.map((rule) => (
              <li
                key={rule.key}
                className={`flex items-center gap-1.5 text-xs font-semibold ${
                  rule.met ? 'text-emerald-600' : mutedClass
                }`}
              >
                {rule.met ? <Check size={12} aria-hidden="true" /> : <X size={12} aria-hidden="true" />}
                <span>
                  {rule.label}
                  <span className="sr-only">{rule.met ? ' (met)' : ' (not yet)'}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2">
          <label htmlFor="reset-confirm" className={`text-xs font-bold uppercase ${labelClass}`}>
            Confirm new password
          </label>
          <input
            id="reset-confirm"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            required
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            aria-invalid={mismatch}
            className={`login-input ${inputClass} ${mismatch ? 'border-red-500' : ''}`}
          />
          {mismatch && <p className="text-xs font-semibold text-red-500">The passwords do not match yet.</p>}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-wait text-white py-3.5 rounded-2xl font-bold transition-all"
        >
          {saving ? 'Saving…' : 'Set new password'}
        </button>

        <p className={`text-center text-xs ${mutedClass}`}>
          <Link to="/login" className="font-bold text-emerald-600 hover:underline">
            Back to sign in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
