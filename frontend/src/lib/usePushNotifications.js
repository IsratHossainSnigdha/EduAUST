import { useCallback, useEffect, useRef, useState } from 'react';
import { apiGet, isAuthenticated } from './auth';

/*
 * Desktop notifications for anything new that arrives while the app is open.
 *
 * The server records a notification for every event that matters to the other
 * party; this polls for them and raises a browser notification, so a tutor
 * hears about a request without sitting on the dashboard.
 *
 * Scope worth being honest about: this is a foreground notifier. Delivery to
 * a closed browser needs Web Push — a service worker, VAPID keys and a push
 * service — which is a separate piece of infrastructure.
 */
const POLL_MS = 20000;
const SEEN_KEY = 'eduaust_last_notified_at';

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
          icon: '/vite.svg',
        });

        shown.onclick = () => {
          window.focus();
          window.location.assign('/notifications');
          shown.close();
        };
      } catch {
        // A browser that refuses to construct one should not break polling.
      }
    };

    const poll = async () => {
      if (cancelled || !isAuthenticated() || document.visibilityState === 'hidden') return;

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
        .filter((item) => !lastSeenAt.current || item.created_at > lastSeenAt.current)
        // Oldest first, so the newest ends up on top of the stack.
        .sort((a, b) => a.created_at.localeCompare(b.created_at));

      if (fresh.length === 0) return;

      fresh.forEach(announce);

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
