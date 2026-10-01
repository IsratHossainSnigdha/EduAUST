import React, { useEffect, useState } from 'react';
import { Check, KeyRound, ShieldCheck, X } from 'lucide-react';
import { apiDelete, apiGet, apiPost, firstError } from '../../lib/auth';
import { useCurrentUser } from '../../lib/useCurrentUser';
import GoogleSignInButton from '../GoogleSignInButton';
import DeleteAccount from './DeleteAccount';
import { checkPassword } from '../../lib/passwordRules';

/*
 * The ways this account can be signed into.
 *
 * Someone who joined through Google has no password, and someone who
 * registered with their email has not linked Google — either can add the
 * other here, and neither can remove their last way in.
 */
export default function AccountSettings({ darkMode }) {
  const { refresh } = useCurrentUser();

  const [methods, setMethods] = useState(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  const inputClass = darkMode
    ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-600'
    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400';

  const labelClass = darkMode ? 'text-slate-300' : 'text-slate-700';
  const cardClass = darkMode
    ? 'border-slate-800 bg-slate-900/40'
    : 'border-slate-200 bg-slate-50/60';

  const loadMethods = async () => {
    const { ok, body } = await apiGet('/auth/sign-in-methods');

    if (ok) setMethods(body);

    setLoading(false);
  };

  useEffect(() => {
    loadMethods();
  }, []);

  const hasPassword = Boolean(methods?.password?.enabled);
  const googleLinked = Boolean(methods?.google?.enabled);

  const { results: passwordRules } = checkPassword(form.password);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setStatus('');
    setFieldErrors({});
    setSaving(true);

    const payload = {
      password: form.password,
      password_confirmation: form.password_confirmation,
    };

    // Only an account that already has one is asked to confirm it.
    if (hasPassword) payload.current_password = form.current_password;

    const { ok, body } = await apiPost('/auth/password', payload);
    setSaving(false);

    if (!ok) {
      if (body?.errors) {
        setFieldErrors(
          Object.fromEntries(
            Object.entries(body.errors).map(([field, messages]) => [field, messages[0]])
          )
        );
      }

      setError(firstError(body, 'Could not save your password.'));

      return;
    }

    setForm({ current_password: '', password: '', password_confirmation: '' });
    setStatus(body?.message || 'Your password has been saved.');
    await loadMethods();
    await refresh();
  };

  const handleLinkGoogle = async (credential) => {
    setError('');
    setStatus('');

    const { ok, body } = await apiPost('/auth/google/link', { id_token: credential });

    if (!ok) {
      setError(firstError(body, 'Could not link that Google account.'));

      return;
    }

    setStatus(body?.message || 'Your Google account is now linked.');
    await loadMethods();
    await refresh();
  };

  const handleUnlinkGoogle = async () => {
    setError('');
    setStatus('');

    const { ok, body } = await apiDelete('/auth/google/link');

    if (!ok) {
      setError(firstError(body, 'Could not unlink your Google account.'));

      return;
    }

    setStatus(body?.message || 'Your Google account has been unlinked.');
    await loadMethods();
    await refresh();
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1].map((row) => (
          <div
            key={row}
            className={`h-24 rounded-xl animate-pulse ${
              darkMode ? 'bg-slate-800' : 'bg-slate-100'
            }`}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <p role="alert" className="text-sm text-red-500 font-semibold bg-red-500/10 p-3 rounded-xl">{error}</p>
      )}

      {status && (
        <p role="status" className="text-sm text-emerald-600 font-semibold bg-emerald-500/10 p-3 rounded-xl">
          {status}
        </p>
      )}

      {/* Google */}
      <div className={`p-5 rounded-2xl border ${cardClass}`}>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className={`text-xs font-black flex items-center gap-2 ${labelClass}`}>
              <ShieldCheck size={14} className="text-emerald-500" />
              Google account
            </h3>
            <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {googleLinked
                ? 'Linked — you can sign in with Google.'
                : 'Not linked. Link your AUST Google account to sign in with one click.'}
            </p>
          </div>

          {googleLinked && (
            <span className="shrink-0 text-[11px] font-extrabold px-2 py-1 rounded bg-emerald-500/10 text-emerald-500 flex items-center gap-1">
              <Check size={11} /> Connected
            </span>
          )}
        </div>

        {googleLinked ? (
          <button
            type="button"
            onClick={handleUnlinkGoogle}
            disabled={!hasPassword}
            title={
              hasPassword
                ? 'Remove Google as a sign-in method'
                : 'Set a password first, or you would have no way to sign in'
            }
            className="py-2.5 px-4 rounded-xl border border-rose-500 text-rose-500 text-xs font-bold hover:bg-rose-500 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-rose-500"
          >
            Unlink Google
          </button>
        ) : (
          <GoogleSignInButton
            darkMode={darkMode}
            onError={setError}
            label="Link Google account"
            onCredential={handleLinkGoogle}
          />
        )}
      </div>

      {/* Password */}
      <div className={`p-5 rounded-2xl border ${cardClass}`}>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className={`text-xs font-black flex items-center gap-2 ${labelClass}`}>
              <KeyRound size={14} className="text-emerald-500" />
              {hasPassword ? 'Change password' : 'Set a password'}
            </h3>
            <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {hasPassword
                ? 'Update the password you sign in with.'
                : 'You joined with Google. Set a password to also sign in with your email.'}
            </p>
          </div>

          {hasPassword && (
            <span className="shrink-0 text-[11px] font-extrabold px-2 py-1 rounded bg-emerald-500/10 text-emerald-500 flex items-center gap-1">
              <Check size={11} /> Enabled
            </span>
          )}
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          {hasPassword && (
            <div>
              <label htmlFor="account-current-password" className={`block text-xs font-extrabold mb-2 uppercase tracking-wider ${labelClass}`}>
            Current password
          </label>
              <input id="account-current-password"
                type="password"
                autoComplete="current-password"
                value={form.current_password}
                onChange={(e) => setForm({ ...form, current_password: e.target.value })}
                className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
                  fieldErrors.current_password ? 'border-red-500' : ''
                } ${inputClass}`}
              />
              {fieldErrors.current_password && (
                <p className="mt-1.5 text-xs text-red-500 font-medium">{fieldErrors.current_password}</p>
              )}
            </div>
          )}

          <div>
            <label htmlFor="account-new-password" className={`block text-xs font-extrabold mb-2 uppercase tracking-wider ${labelClass}`}>
            New password
          </label>
            <input id="account-new-password"
              type="password"
              autoComplete="new-password"
              aria-describedby="account-password-rules"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
                fieldErrors.password ? 'border-red-500' : ''
              } ${inputClass}`}
            />
            {fieldErrors.password && (
              <p className="mt-1.5 text-xs text-red-500 font-medium">{fieldErrors.password}</p>
            )}
            {/* The server's own rule, ticked off as it is met. */}
            <ul id="account-password-rules" className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2">
              {passwordRules.map((rule) => (
                <li
                  key={rule.key}
                  className={`flex items-center gap-1.5 text-xs font-semibold ${
                    rule.met ? 'text-emerald-600' : darkMode ? 'text-slate-400' : 'text-slate-500'
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

          <div>
            <label htmlFor="account-confirm-new-password" className={`block text-xs font-extrabold mb-2 uppercase tracking-wider ${labelClass}`}>
            Confirm new password
          </label>
            <input id="account-confirm-new-password"
              type="password"
              autoComplete="new-password"
              value={form.password_confirmation}
              onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
              placeholder="••••••••"
              className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${inputClass}`}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold rounded-xl transition text-sm"
          >
            {saving ? 'Saving…' : hasPassword ? 'Change password' : 'Set password'}
          </button>
        </form>
      </div>

      <DeleteAccount darkMode={darkMode} hasPassword={hasPassword} />
    </div>
  );
}
