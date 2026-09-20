import React from 'react';
import { UserPlus, CheckCircle, Users, BookOpen } from 'lucide-react';
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
      title: 'Students Taught',
      value: value('students_taught'),
      description: 'Across all subjects',
      icon: Users,
    },
    {
      title: 'Subjects',
      value: value('subjects_count'),
      description: 'On your profile',
      icon: BookOpen,
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
              : undefined
          }
        />
      ))}
    </div>
  );
}
