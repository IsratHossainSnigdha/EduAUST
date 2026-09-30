import { useCallback, useEffect, useState } from 'react';
import { getUser, isAuthenticated } from './auth';
import { fetchCurrentUser } from './useCurrentUser';

/*
 * Which dashboard the account is currently looking at.
 *
 * One account can be both a student and a tutor, and the two sides must not be
 * read off each other. This used to be a localStorage key written from nine
 * different places — including unconditionally on dashboard mount — while
 * App.jsx kept its own copy synced to the same key. Parent effects run after
 * child effects, so App's write landed last and overwrote whatever the page
 * had just set: opening the student dashboard left the role on 'tutor', and
 * the notifications page went on showing the tutor's notifications.
 *
 * The rule now lives here alone:
 *
 *   - the role changes only when something asks it to, never as a side effect
 *     of rendering a page;
 *   - an account that does not tutor can never hold 'tutor', however stale the
 *     stored value is — a previous account's role cannot grant tutor views.
 */
const KEY = 'eduAUST_role';
export const STUDENT = 'student';
export const TUTOR = 'tutor';

const subscribers = new Set();

function read() {
  try {
    return localStorage.getItem(KEY) === TUTOR ? TUTOR : STUDENT;
  } catch {
    return STUDENT;
  }
}

function write(role) {
  try {
    localStorage.setItem(KEY, role);
  } catch {
    // Private browsing: the role simply resets on reload.
  }
}

/**
 * The role as it stands, with no account check applied.
 */
export function currentRole() {
  return isAuthenticated() ? read() : STUDENT;
}

/**
 * Change the active dashboard. Refused for a tutor role on an account that
 * does not tutor, so callers cannot put the app into a state its routes will
 * immediately bounce out of.
 */
export function setRole(role) {
  const next = role === TUTOR ? TUTOR : STUDENT;

  if (next === TUTOR && !getUser()?.isTutor) return STUDENT;

  write(next);
  subscribers.forEach((notify) => notify(next));

  return next;
}

/**
 * Drop the stored role. Called on sign-out so the next account does not
 * inherit the previous one's dashboard.
 */
export function clearRole() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing to clear.
  }

  subscribers.forEach((notify) => notify(STUDENT));
}

/**
 * @returns {{ role: string, isTutor: boolean, setRole: (role: string) => void }}
 */
export function useRole() {
  const [role, setLocal] = useState(() => currentRole());
  const [isTutor, setIsTutor] = useState(() => Boolean(getUser()?.isTutor));

  useEffect(() => {
    let cancelled = false;

    const notify = (next) => {
      if (!cancelled) setLocal(next);
    };

    subscribers.add(notify);

    // The stored role is only a preference; whether it is allowed depends on
    // the account, which is why this is confirmed against the server.
    fetchCurrentUser().then((user) => {
      if (cancelled) return;

      const tutor = Boolean(user?.isTutor);
      setIsTutor(tutor);

      if (!tutor && read() === TUTOR) {
        write(STUDENT);
        setLocal(STUDENT);
      }
    });

    return () => {
      cancelled = true;
      subscribers.delete(notify);
    };
  }, []);

  const change = useCallback((next) => {
    setLocal(setRole(next));
  }, []);

  return { role, isTutor, setRole: change };
}
