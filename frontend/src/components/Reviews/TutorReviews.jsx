import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { apiGet } from '../../lib/auth';
import StarRating from '../StarRating';
import UserAvatar from '../UserAvatar';

/*
 * What students said about this tutor.
 *
 * The tutor dashboard reported every other figure about their teaching and
 * nothing about how it was received.
 */
export default function TutorReviews({ darkMode, tutorId, cardClass }) {
  const [summary, setSummary] = useState({ average: null, count: 0 });
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tutorId) return undefined;

    let cancelled = false;

    setLoading(true);

    apiGet(`/tutors/${tutorId}/reviews`).then(({ ok, body }) => {
      if (cancelled) return;

      if (ok) {
        setSummary(body?.summary ?? { average: null, count: 0 });
        setReviews(body?.data ?? []);
      }

      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [tutorId]);

  const muted = darkMode ? 'text-slate-400' : 'text-slate-500';
  const heading = darkMode ? 'text-white' : 'text-slate-900';

  if (loading) {
    return <p className={`text-xs font-semibold ${muted}`}>Loading reviews…</p>;
  }

  if (summary.count === 0) {
    return (
      <div className="text-center py-6">
        <Star size={20} className="mx-auto text-amber-400 mb-2" />
        <p className={`text-xs font-semibold ${muted}`}>
          No ratings yet. Students can rate you once you have taught them.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      <div className={`flex items-center gap-4 p-4 rounded-xl border ${cardClass}`}>
        <div className="text-center shrink-0">
          <p className={`text-3xl font-black ${heading}`}>{summary.average}</p>
          <p className={`text-[11px] font-semibold ${muted}`}>
            {summary.count} review{summary.count === 1 ? '' : 's'}
          </p>
        </div>

        <div className="border-l border-slate-200 dark:border-slate-700 pl-4">
          <StarRating value={summary.average} size={18} darkMode={darkMode} />
          <p className={`text-xs mt-1 ${muted}`}>Average rating from your students.</p>
        </div>
      </div>

      <div className="space-y-2">
        {reviews.map((review) => (
          <div key={review.id} className={`p-3 rounded-xl border ${cardClass}`}>
            <div className="flex items-start gap-3">
              <UserAvatar
                user={{ name: review.student?.name, profile_picture: review.student?.avatar }}
                size={34}
              />

              <div className="min-w-0 flex-grow">
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-xs font-bold truncate ${heading}`}>
                    {review.student?.name ?? 'Student'}
                  </p>
                  <StarRating value={review.rating} darkMode={darkMode} size={11} />
                </div>

                {review.comment && (
                  <p className={`text-xs mt-1.5 ${muted}`}>{review.comment}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
