import React from 'react';
import { UserPlus, CheckCircle, Users, BookOpen, Star } from 'lucide-react';
import StatCard from './StatCard';

export default function TutorStats({
  darkMode,
  navigate,
  stats,
  loading,
}) {
  // Every figure comes from the backend; while it is in flight the cards show
  // a dash rather than a misleading zero.
  const value = (key) => (loading || !stats ? '—' : stats[key] ?? 0);

  const cards = [
    {
      title: 'Pending Requests',
      value: value('pending_requests'),
      description: 'Awaiting your reply',
      icon: UserPlus,
      path: '/tutor-requests',
    },
    {
      title: 'Accepted Requests',
      value: value('accepted_requests'),
      description: 'Students you took on',
      icon: CheckCircle,
      path: '/tutor-requests',
    },
    {
      title: 'Currently Teaching',
      value: value('currently_teaching'),
      description: 'Active students right now',
      icon: Users,
      // Jumps to the panel that lists and manages them.
      anchor: 'my-students',
    },
    {
      title: 'Students Taught',
      value: value('students_taught'),
      description: 'Everyone you have taken on',
      icon: Users,
    },
    {
      title: 'Subjects',
      value: value('subjects_count'),
      description: 'On your profile',
      icon: BookOpen,
    },
    {
      title: 'Rating',
      // No ratings yet is not a rating of zero, which would read as terrible.
      value: loading || !stats ? '—' : (stats.rating ?? '—'),
      description: stats?.rating_count
        ? `From ${stats.rating_count} review${stats.rating_count === 1 ? '' : 's'}`
        : 'No ratings yet',
      icon: Star,
      anchor: 'tutor-reviews',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
      {cards.map((card) => (
        <StatCard
          key={card.title}
          {...card}
          darkMode={darkMode}
          onClick={
            card.path
              ? () => navigate(card.path)
              : card.anchor
                // Some figures are explained by a panel further down this
                // page rather than by another page.
                ? () =>
                    document
                      .getElementById(card.anchor)
                      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                : undefined
          }
        />
      ))}
    </div>
  );
}
