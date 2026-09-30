import { useCallback, useEffect, useState } from 'react';
import { apiGet, isAuthenticated } from './auth';

/*
 * One shared copy of the sidebar badge counts.
 *
 * The sidebar and the dashboard behind it each used to fetch the same unread
 * counts, so opening a dashboard asked the server for the same three numbers
 * twice. That is invisible against a production server, but `artisan serve`
 * answers one request at a time, so every duplicate pushed the whole page back
 * by a round trip.
 *
 * Like useCurrentUser, however many components ask at once share one request.
 */
const EMPTY = { requests: 0, messages: 0, sessions: 0, notifications: { student: 0, tutor: 0 } };

let cache = null;
let inFlight = null;
const subscribers = new Set();

function publish(counts) {
  subscribers.forEach((notify) => notify(counts));
}

/**
 * Fetch the counts, reusing a request that is already running.
 *
 * @param {{ includeRequests?: boolean, force?: boolean }} options
 *   `includeRequests` asks for the tutor's pending inbox, which only a tutor
 *   account may read — the endpoint is behind the tutor middleware.
 */
export async function fetchBadgeCounts({ includeRequests = false, force = false } = {}) {
  if (!isAuthenticated()) {
    // Signing out does not reload the page, so a cache left standing would
    // show the previous account's badges to whoever signs in next.
    cache = null;

    return EMPTY;
  }

  if (!force && inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const [requests, messages, notifications, sessions] = await Promise.all([
        includeRequests ? apiGet('/tuition-requests?status=pending') : Promise.resolve({ ok: false }),
        apiGet('/conversations/unread-count'),
        apiGet('/notifications/unread-count'),
        apiGet('/sessions'),
      ]);

      const next = {
        // A tutor who has not been asked anything yet simply has none.
        requests: requests.ok ? (requests.body?.meta?.total ?? 0) : (cache?.requests ?? 0),
        messages: messages.ok
          ? (messages.body?.unread_total ?? messages.body?.unread_count ?? 0)
          : (cache?.messages ?? 0),
        // Only the proposals actually waiting on this person, not every
        // session in flight; a badge for your own suggestion is noise.
        sessions: sessions.ok ? (sessions.body?.awaiting_you ?? 0) : (cache?.sessions ?? 0),
        notifications: notifications.ok
          ? {
              student: notifications.body?.by_audience?.student ?? 0,
              tutor: notifications.body?.by_audience?.tutor ?? 0,
            }
          : (cache?.notifications ?? EMPTY.notifications),
      };

      cache = next;
      publish(next);

      return next;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

/**
 * The badge counts, kept in step across every component that shows them.
 *
 * @param {{ includeRequests?: boolean }} options
 * @returns {{ counts: typeof EMPTY, refresh: () => Promise<typeof EMPTY> }}
 */
export function useBadgeCounts({ includeRequests = false } = {}) {
  const [counts, setCounts] = useState(() => cache ?? EMPTY);

  const refresh = useCallback(
    () => fetchBadgeCounts({ includeRequests, force: true }),
    [includeRequests]
  );

  useEffect(() => {
    let cancelled = false;

    const notify = (next) => {
      if (!cancelled) setCounts(next);
    };

    subscribers.add(notify);

    fetchBadgeCounts({ includeRequests }).then((next) => {
      if (!cancelled) setCounts(next);
    });

    return () => {
      cancelled = true;
      subscribers.delete(notify);
    };
  }, [includeRequests]);

  return { counts, refresh };
}
