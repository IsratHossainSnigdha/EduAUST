import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiPost, saveAuth, firstError } from '../lib/auth';
import { setRole, STUDENT, TUTOR } from '../lib/useRole';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
// Google picks the button's language when this script loads, from the
// browser's own language rather than the page's. `hl` is the only thing that
// overrides it: passing `locale` to initialize() or renderButton() does not,
// which is why a Bangla-configured Chrome kept rendering a Bangla button on an
// otherwise English page.
const GSI_SRC = 'https://accounts.google.com/gsi/client?hl=en';

/*
 * How long to keep watching for Google's button before giving up on it.
 *
 * renderButton() returns before the button exists and never reports failure,
 * so the only honest way to know whether the option is really on screen is to
 * look for it. Assuming success left an empty gap whenever the script was
 * blocked or offline.
 */
const RENDER_GIVE_UP_MS = 15000;

/*
 * Google allows one initialize() per page. Calling it again logs
 * "google.accounts.id.initialize() is called multiple times" and keeps only
 * the last configuration. Every page showing this button used to call it on
 * mount, and again whenever the theme changed, so going from login to signup
 * and back called it three times. It now runs once per page load, and each
 * button only renders itself.
 *
 * The credential callback is fixed by that single call, so it hands the
 * credential to whichever button is mounted at the time.
 */
let initializedClientId = null;
let activeCredentialHandler = null;

function ensureInitialized() {
  if (initializedClientId === CLIENT_ID) return;

  window.google.accounts.id.initialize({
    client_id: CLIENT_ID,
    callback: (response) => activeCredentialHandler?.(response),
    // Students often have a personal Google account signed in as well, so
    // always let them choose rather than assuming the last one.
    auto_select: false,
  });

  // Only once it has actually succeeded, so a failed attempt is retried.
  initializedClientId = CLIENT_ID;
}

/**
 * Sign in or register with an AUST institutional Google account.
 *
 * Google's own button is rendered when the client ID is configured and its
 * script loads. Until then a matching button is shown in its place, so the
 * option is always visible rather than silently disappearing.
 */
export default function GoogleSignInButton({
  darkMode,
  onError,
  label = 'Continue with Google',
  // Given a handler, the credential is passed to it instead of being
  // exchanged for a session — which is how Settings links an account that is
  // already signed in.
  onCredential,
}) {
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  /*
   * 'waiting'      — Google's script or button has not arrived yet.
   * 'ready'        — Google's own button is on screen, so ours steps aside.
   * 'unconfigured' — no client ID was built into the app at all.
   */
  const [status, setStatus] = useState(CLIENT_ID ? 'waiting' : 'unconfigured');

  const googleRendered = status === 'ready';

  // The GIS callback is registered once, so it must not close over stale
  // state; keeping it in a ref lets the latest version always run.
  const handleCredential = useRef(null);

  handleCredential.current = async ({ credential }) => {
    onError?.('');
    setLoading(true);

    if (onCredential) {
      try {
        await onCredential(credential);
      } finally {
        setLoading(false);
      }

      return;
    }

    // Stay signed in, as a password sign-in now does by default. Without a
    // refresh token the session ended when the one-hour access token did.
    const { ok, body } = await apiPost('/auth/google', { id_token: credential, remember: true });

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
    if (!body.profile_complete) {
      navigate('/complete-profile');

      return;
    }

    // A returning tutor lands on their own dashboard, the same as a password
    // login; a student, or a first-time account, on the student side.
    if (body.user?.isTutor) {
      setRole(TUTOR);
      navigate('/tutor-dashboard');
    } else {
      setRole(STUDENT);
      navigate('/dashboard');
    }
  };

  // This button is the one a Google credential belongs to while it is on
  // screen. Cleared on unmount only if nothing newer has claimed it since.
  useEffect(() => {
    const handler = (response) => handleCredential.current?.(response);

    activeCredentialHandler = handler;

    return () => {
      if (activeCredentialHandler === handler) activeCredentialHandler = null;
    };
  }, []);

  useEffect(() => {
    if (!CLIENT_ID) return undefined;

    let cancelled = false;

    let pollTimer = null;

    /*
     * Whether Google has actually put a button on the page.
     *
     * Google builds a real element with role="button"; the iframe beside it is
     * an internal detail whose size varies with the sign-in mode in use, so
     * measuring the iframe reported a perfectly good button as missing and
     * left ours sitting underneath it.
     */
    const buttonIsVisible = () => {
      const rendered = containerRef.current?.querySelector('[role="button"]');

      if (!rendered) return false;

      const { width, height } = rendered.getBoundingClientRect();

      return width > 0 && height > 0;
    };

    const watchForButton = () => {
      const startedAt = Date.now();

      const tick = () => {
        if (cancelled) return;

        if (buttonIsVisible()) {
          setStatus('ready');

          return;
        }

        // Keep looking for a while: a slow network should be allowed to catch
        // up rather than being written off on the first check.
        if (Date.now() - startedAt < RENDER_GIVE_UP_MS) {
          pollTimer = setTimeout(tick, 250);
        }
      };

      tick();
    };

    const render = () => {
      if (cancelled || !window.google?.accounts?.id || !containerRef.current) return;

      try {
        ensureInitialized();

        containerRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(containerRef.current, {
          theme: darkMode ? 'filled_black' : 'outline',
          size: 'large',
          width: 320,
          text: 'continue_with',
          shape: 'pill',
          // Without this Google labels the button in the browser's or the
          // Google account's language, which on a Bangla locale left an
          // otherwise English page with a Bangla button.
          locale: 'en',
        });

        // Rendering is asynchronous and silent about failure, so confirm it
        // rather than assuming this call succeeded.
        watchForButton();
      } catch {
        // Leave the stand-in button in place if Google refuses the client ID.
        setStatus('waiting');
      }
    };

    // Reuse the script when another page already loaded it.
    const existing = document.querySelector(`script[src="${GSI_SRC}"]`);

    if (existing) {
      if (window.google?.accounts?.id) render();
      else existing.addEventListener('load', render);

      return () => {
        cancelled = true;
        clearTimeout(pollTimer);
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
      clearTimeout(pollTimer);
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
            if (status === 'unconfigured') {
              onError?.(
                'Google sign-in is not set up yet. Add VITE_GOOGLE_CLIENT_ID to frontend/.env and GOOGLE_CLIENT_ID to backend/.env, then restart the dev server.'
              );

              return;
            }

            /*
             * Google's own button never arrived. Its script being blocked and
             * the origin being unregistered look the same from here, so say
             * what to check rather than guessing which one it was.
             */
            onError?.(
              `Google sign-in is unavailable on this page. Check that ${window.location.origin} is listed under Authorized JavaScript origins for this OAuth client, and that accounts.google.com is reachable. Email and password sign-in still works.`
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
