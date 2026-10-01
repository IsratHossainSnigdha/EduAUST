import { useCallback, useEffect, useRef, useState } from 'react';
import { apiGet, apiPatch, isAuthenticated } from './auth';

/*
 * Desktop notifications for anything new that arrives while the app is open.
 *
 * The server records a notification for every event that matters to the other
 * party; this polls for them and raises a browser notification, so a tutor
 * hears about a request without sitting on the dashboard.
 *
 * It pops up only while EduAUST is open but out of sight, in another tab or
 * behind another window. It used to do the opposite: polling stopped whenever
 * the tab was hidden, so a pop-up could only appear while you were already
 * looking at the page it was about.
 *
 * Scope worth being honest about: delivery to a closed browser needs Web Push
 * (a service worker, VAPID keys and a push service), which is a separate
 * piece of infrastructure.
 */
const POLL_MS = 20000;
const SEEN_KEY = 'eduaust_last_notified_at';

// The build serves from /app/, the dev server from /, so the icon is found
// relative to wherever the app lives.
const ICON = `${import.meta.env.BASE_URL}favicon.svg`;

// Timestamps arrive as "+00:00" from the server and "Z" from the browser, so
// they are compared as moments rather than as strings.
const toTime = (iso) => {
  const t = Date.parse(iso);

  return Number.isNaN(t) ? 0 : t;
};

function canNotify() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function usePushNotifications({ enabled = true } = {}) {
  const [permission, setPermission] = useState(() =>
    canNotify() ? Notification.permission : 'unsupported'
  );

  // Newest notification already announced, so a repeat poll stays quiet.
  const lastSeenAt = useRef(
    (() => {
      try {
        return localStorage.getItem(SEEN_KEY);
      } catch {
        return null;
      }
    })()
  );

  const request = useCallback(async () => {
    if (!canNotify()) return 'unsupported';

    const result = await Notification.requestPermission();
    setPermission(result);

    return result;
  }, []);

  useEffect(() => {
    if (!enabled || !canNotify()) return undefined;

    let cancelled = false;
    let timer = null;

    const announce = (notification) => {
      if (Notification.permission !== 'granted') return;

      try {
        const shown = new Notification(notification.title || 'EduAUST', {
          body: notification.body ?? '',
          tag: notification.id,
          icon: ICON,
        });

        // Straight to the thing it is about, and read once opened, the same
        // as opening it from the notifications page.
        shown.onclick = () => {
          window.focus();
          apiPatch(`/notifications/${notification.id}/read`).finally(() => {
            window.location.assign(notification.link || '/notifications');
          });
          shown.close();
        };
      } catch {
        // A browser that refuses to construct one should not break polling.
      }
    };

    const poll = async () => {
      if (cancelled || !isAuthenticated()) return;

      const { ok, body } = await apiGet('/notifications?unread=1&limit=10');

      if (cancelled || !ok) return;

      // The listing groups by recency, so flatten whatever shape comes back.
      const groups = body?.groups ?? {};
      const items = Array.isArray(groups)
        ? groups.flatMap((group) => group.items ?? group.notifications ?? [])
        : Object.values(groups).flatMap((group) =>
            Array.isArray(group) ? group : (group?.items ?? group?.notifications ?? [])
          );

      const fresh = items
        .filter((item) => item?.created_at)
        .filter((item) => !lastSeenAt.current || toTime(item.created_at) > toTime(lastSeenAt.current))
        // Oldest first, so the newest ends up on top of the stack.
        .sort((a, b) => toTime(a.created_at) - toTime(b.created_at));

      if (fresh.length === 0) return;

      // Someone looking at the page already sees the badge change; a pop-up
      // on top of that is noise. What they missed is still marked as seen,
      // so it does not pop up later out of context.
      const outOfSight = document.visibilityState === 'hidden' || !document.hasFocus();

      if (outOfSight) fresh.forEach(announce);

      const newest = fresh[fresh.length - 1].created_at;
      lastSeenAt.current = newest;

      try {
        localStorage.setItem(SEEN_KEY, newest);
      } catch {
        // Private browsing: announcements simply repeat after a reload.
      }
    };

    // Skip the first sweep's backlog: only announce what arrives from now on.
    const prime = async () => {
      if (lastSeenAt.current) {
        poll();
      } else {
        lastSeenAt.current = new Date().toISOString();

        try {
          localStorage.setItem(SEEN_KEY, lastSeenAt.current);
        } catch {
          // Ignored.
        }
      }

      timer = setInterval(poll, POLL_MS);
    };

    prime();

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [enabled]);

  return { permission, request, supported: canNotify() };
}
