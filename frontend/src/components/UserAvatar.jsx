import React from 'react';

/*
 * The signed-in user's picture, falling back to their initials.
 *
 * Every header and sidebar previously showed the same stock photograph, which
 * made one account look like another; initials are at least truthful.
 */
export default function UserAvatar({ user, size = 40, className = '' }) {
  const name = user?.name || '';
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  const style = { width: size, height: size };

  if (user?.profile_picture) {
    return (
      <img
        src={user.profile_picture}
        alt={name || 'Profile'}
        style={style}
        className={`rounded-full object-cover border-2 border-emerald-500/30 ${className}`}
      />
    );
  }

  return (
    <div
      style={style}
      className={`rounded-full bg-emerald-500/10 text-emerald-600 border-2 border-emerald-500/30 flex items-center justify-center font-black ${className}`}
    >
      <span style={{ fontSize: Math.max(10, size / 3) }}>{initials || '?'}</span>
    </div>
  );
}
