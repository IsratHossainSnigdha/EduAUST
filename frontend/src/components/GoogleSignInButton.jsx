import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiPost, saveAuth, firstError } from '../lib/auth';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GSI_SRC = 'https://accounts.google.com/gsi/client';

/**
 * Sign in or register with an AUST institutional Google account.
 *
 * Google's own button is rendered when the client ID is configured and its
 * script loads. Until then a matching button is shown in its place, so the
 * option is always visible rather than silently disappearing.
 */
export default function GoogleSignInButton({ darkMode, onError, label = 'Continue with Google' }) {
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [googleRendered, setGoogleRendered] = useState(false);

  // The GIS callback is registered once, so it must not close over stale
  // state; keeping it in a ref lets the latest version always run.
  const handleCredential = useRef(null);

  handleCredential.current = async ({ credential }) => {
    onError?.('');
    setLoading(true);

    const { ok, body } = await apiPost('/auth/google', { id_token: credential });

    setLoading(false);

    if (!ok) {
      // Google remembers the account it just used and would silently reuse it,
      // trapping anyone who picked a personal address. Clearing that choice
      // makes the next click show the account chooser again.
      window.google?.accounts?.id?.disableAutoSelect?.();
      onError?.(firstError(body, 'Google sign-in failed. Please try again.'));

      return;
    }

    saveAuth(body);
    // A first-time Google user still owes us the details Google cannot supply.
    navigate(body.profile_complete ? '/dashboard' : '/complete-profile');
  };

  useEffect(() => {
    if (!CLIENT_ID) return undefined;

    let cancelled = false;

    const render = () => {
      if (cancelled || !window.google?.accounts?.id || !containerRef.current) return;

      try {
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (response) => handleCredential.current?.(response),
          // Students often have a personal Google account signed in as well,
          // so always let them choose rather than assuming the last one.
          auto_select: false,
        });

        containerRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(containerRef.current, {
          theme: darkMode ? 'filled_black' : 'outline',
          size: 'large',
          width: 320,
          text: 'continue_with',
          shape: 'pill',
        });

        setGoogleRendered(true);
      } catch {
        // Leave the stand-in button in place if Google refuses the client ID.
        setGoogleRendered(false);
      }
    };

    // Reuse the script when another page already loaded it.
    const existing = document.querySelector(`script[src="${GSI_SRC}"]`);

    if (existing) {
      if (window.google?.accounts?.id) render();
      else existing.addEventListener('load', render);

      return () => {
        cancelled = true;
        existing.removeEventListener('load', render);
      };
    }

    const script = document.createElement('script');
    script.src = GSI_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener('load', render);
    document.body.appendChild(script);

    return () => {
      cancelled = true;
      script.removeEventListener('load', render);
    };
  }, [darkMode]);

  const standInClasses = darkMode
    ? 'bg-slate-900 border-slate-700 text-slate-100 hover:bg-slate-800'
    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50';

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Google renders its official button here once it is available. */}
      <div ref={containerRef} />

      {!googleRendered && (
        <button
          type="button"
          onClick={() => {
            onError?.(
              CLIENT_ID
                ? 'Google sign-in is still loading. Please try again in a moment.'
                : 'Google sign-in is not set up yet. Add VITE_GOOGLE_CLIENT_ID to frontend/.env and GOOGLE_CLIENT_ID to backend/.env, then restart the dev server.'
            );
          }}
          className={`w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl border font-bold transition ${standInClasses}`}
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.2 17.7 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9.1h12.4c-.5 2.9-2.1 5.3-4.6 7l7.6 5.9c4.4-4.1 6.7-10.1 6.7-17.4z" />
            <path fill="#FBBC05" d="M10.4 28.7c-.5-1.4-.8-2.9-.8-4.7s.3-3.3.8-4.7l-7.8-6.1C.9 16.5 0 20.1 0 24s.9 7.5 2.6 10.8l7.8-6.1z" />
            <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.8 2.3-8.3 2.3-6.3 0-11.7-3.7-13.6-9.9l-7.8 6.1C6.5 42.6 14.6 48 24 48z" />
          </svg>
          {label}
        </button>
      )}

      {loading && <p className="text-xs text-slate-400">Signing you in…</p>}
    </div>
  );
}
