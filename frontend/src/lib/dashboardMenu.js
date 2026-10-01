import {
  Bell,
  CalendarDays,
  GraduationCap,
  HelpCircle,
  LayoutDashboard,
  MessageSquare,
  Search,
  Settings,
  UserPlus,
  Users,
} from 'lucide-react';

/*
 * The one list of dashboard sidebar links.
 *
 * Five pages each drew this menu from their own copy of the list, so adding an
 * entry meant finding all five. My Tutors reached the dashboard and went
 * missing the moment anyone opened Find Tutors, Messages or Notifications.
 * The markup still belongs to each page; only what goes in it lives here.
 */

export const TUTOR_VIEW = 'tutor';

/**
 * Build the sidebar entries for a role.
 *
 * @param {object}  options
 * @param {string}  options.role    'tutor' shows the teaching side, anything
 *                                  else shows the student side.
 * @param {object}  options.badges  Unread counts: { requests, messages,
 *                                  notifications }. A zero or missing count
 *                                  shows no badge rather than a "0".
 * @returns {Array<{name: string, icon: Function, path: string, badge?: number,
 *                  requiresProfile: boolean}>}
 */
export function buildDashboardMenu({ role, badges = {} } = {}) {
  const isTutorView = role === TUTOR_VIEW;

  return [
    {
      name: 'Dashboard',
      icon: LayoutDashboard,
      // A tutor's Dashboard goes to their own dashboard; hardcoding this to
      // /dashboard used to bounce a tutor onto the student side.
      path: isTutorView ? '/tutor-dashboard' : '/dashboard',
      requiresProfile: false,
    },

    isTutorView
      ? {
          name: 'Tuition Requests',
          icon: UserPlus,
          badge: badges.requests || undefined,
          path: '/tutor-requests',
          requiresProfile: true,
        }
      : {
          name: 'Find Tutors',
          icon: Search,
          path: '/find-tutors',
          requiresProfile: false,
        },

    /*
     * The people on the other end of an active arrangement. Each side manages
     * the same relationship, so each side gets an entry for it.
     */
    isTutorView
      ? {
          name: 'My Students',
          icon: Users,
          path: '/my-students',
          requiresProfile: true,
        }
      : {
          name: 'My Tutors',
          icon: GraduationCap,
          path: '/my-tutors',
          requiresProfile: false,
        },

    /*
     * Times both sides agreed to meet. The badge counts only the ones
     * waiting on this person, not every proposal in flight.
     */
    {
      name: 'Sessions',
      icon: CalendarDays,
      badge: badges.sessions || undefined,
      path: '/sessions',
      requiresProfile: true,
    },

    {
      name: 'Messages',
      icon: MessageSquare,
      badge: badges.messages || undefined,
      path: '/messages',
      requiresProfile: true,
    },

    {
      name: 'Notifications',
      icon: Bell,
      badge: badges.notifications || undefined,
      path: '/notifications',
      requiresProfile: true,
    },

    {
      name: 'Settings',
      icon: Settings,
      path: '/settings',
      requiresProfile: true,
    },

    {
      name: 'Help & Support',
      icon: HelpCircle,
      path: '/support',
      requiresProfile: true,
    },
  ];
}
