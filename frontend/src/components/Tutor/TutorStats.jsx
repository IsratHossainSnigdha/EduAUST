import React from 'react';
import { UserPlus } from 'lucide-react';
import StatCard from './StatCard';

export default function TutorStats({
  darkMode,
  navigate,
}) {
  const stats = [
    {
      title: 'Pending Requests',
      value: 6,
      description: 'New requests',
      icon: UserPlus,
      path: '/tutor-requests',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6">
      {stats.map((stat) => (
        <StatCard
          key={stat.title}
          {...stat}
          darkMode={darkMode}
          onClick={
            stat.path
              ? () => navigate(stat.path)
              : undefined
          }
        />
      ))}
    </div>
  );
}