import { useCallback, useEffect, useState } from 'react';
import { apiGet, getUser, isAuthenticated, saveAuth } from './auth';

/*
 * One shared copy of the signed-in user.
 *
 * Every dashboard, sidebar and header used to hard-code a name and a stock
 * photo, so the two dashboards disagreed with each other and with the account
 * actually signed in. They now all read this, and a single request is shared
 * between however many components mount at once.
 */
let inFlight = null;
const subscribers = new Set();

function publish(user) {
  subscribers.forEach((notify) => notify(user));
}

/**
 * Fetch the current user, reusing a request that is already running.
 */
export async function fetchCurrentUser({ force = false } = {}) {
  if (!isAuthenticated()) return null;

  if (!force) {
    const cached = getUser();

    if (cached) {
      // Refresh in the background so a stale cache still repaints quickly.
      if (!inFlight) fetchCurrentUser({ force: true });

      return cached;
    }
  }

  inFlight ??= (async () => {
    try {
      const { ok, body } = await apiGet('/auth/me');

      if (!ok || !body?.user) return null;

      saveAuth({ user: body.user });
      publish(body.user);

      return body.user;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

/**
 * The signed-in user, kept in step across every component that uses it.
 *
 * @returns {{ user: object|null, loading: boolean, refresh: () => Promise<object|null> }}
 */
export function useCurrentUser() {
  const [user, setUser] = useState(() => getUser());
  const [loading, setLoading] = useState(() => !getUser());

  const refresh = useCallback(async () => {
    const fresh = await fetchCurrentUser({ force: true });

    setUser(fresh);
    setLoading(false);

    return fresh;
  }, []);

  useEffect(() => {
    let cancelled = false;

    // Repaint whenever anyone else refreshes the user.
    const notify = (next) => {
      if (!cancelled) setUser(next);
    };

    subscribers.add(notify);

    fetchCurrentUser().then((fresh) => {
      if (cancelled) return;

      if (fresh) setUser(fresh);
      setLoading(false);
    });

    return () => {
      cancelled = true;
      subscribers.delete(notify);
    };
  }, []);

  return { user, loading, refresh };
}
