import React, { useState } from 'react';
import { Star } from 'lucide-react';

/*
 * A tutor's rating, shown or chosen.
 *
 * Read-only by default. Given onChange it becomes the picker used to leave a
 * review — the same stars either way, so a rating looks the same wherever it
 * appears.
 */
export default function StarRating({
  value = 0,
  count,
  size = 13,
  onChange,
  darkMode,
  showEmpty = true,
}) {
  const [hovered, setHovered] = useState(0);
  const interactive = typeof onChange === 'function';
  const shown = interactive && hovered ? hovered : value;

  // Nobody has rated them yet, which is not the same as a rating of zero.
  if (!interactive && !value) {
    if (!showEmpty) return null;

    return (
      <span className={`text-[10px] font-semibold ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
        No ratings yet
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1">
      <span className="inline-flex items-center" onMouseLeave={() => interactive && setHovered(0)}>
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= Math.round(shown);

          const icon = (
            <Star
              size={size}
              className={filled ? 'text-amber-400' : darkMode ? 'text-slate-600' : 'text-slate-300'}
              fill={filled ? 'currentColor' : 'none'}
            />
          );

          if (!interactive) {
            return <span key={star}>{icon}</span>;
          }

          return (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              onMouseEnter={() => setHovered(star)}
              aria-label={`${star} star${star > 1 ? 's' : ''}`}
              className="p-0.5 transition hover:scale-110"
            >
              {icon}
            </button>
          );
        })}
      </span>

      {!interactive && (
        <span className={`text-[10px] font-bold ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
          {Number(value).toFixed(1)}
          {typeof count === 'number' && (
            <span className={`font-medium ml-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              ({count})
            </span>
          )}
        </span>
      )}
    </span>
  );
}
