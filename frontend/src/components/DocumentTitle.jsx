import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/*
 * The name in the browser tab.
 *
 * Every page used to inherit the one from index.html, so all of them read
 * "frontend": tabs, bookmarks and history were indistinguishable from each
 * other. Setting it in one place keeps it that way for routes added later,
 * rather than relying on each page to remember.
 */

const SUFFIX = 'EduAUST';

const TITLES = {
  '/': 'Peer tutoring at AUST',
  '/login': 'Sign in',
  '/signup': 'Create an account',
  '/complete-profile': 'Complete your profile',

  '/dashboard': 'Student dashboard',
  '/find-tutors': 'Find tutors',
  '/my-tutors': 'My tutors',
  '/my-requests': 'My requests',
  '/saved-tutors': 'Saved tutors',

  '/tutor-dashboard': 'Tutor dashboard',
  '/tutor-requests': 'Tuition requests',
  '/my-students': 'My students',
  '/become-a-tutor': 'Become a tutor',
  '/tutor/create-profile': 'Create your tutor profile',

  '/sessions': 'Sessions',
  '/messages': 'Messages',
  '/notifications': 'Notifications',
  '/settings': 'Settings',
  '/support': 'Help and support',
};

/**
 * The tab name for a path, falling back to the product name alone.
 */
export function titleFor(pathname) {
  const page = TITLES[pathname];

  if (page) return `${page} · ${SUFFIX}`;

  // An unmatched path is the not-found page.
  return `Page not found · ${SUFFIX}`;
}

export default function DocumentTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = titleFor(pathname);
  }, [pathname]);

  return null;
}
