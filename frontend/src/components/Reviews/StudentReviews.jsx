import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { apiDelete, apiGet } from '../../lib/auth';
import StarRating from '../StarRating';
import UserAvatar from '../UserAvatar';
import ReviewForm from './ReviewForm';

/*
 * The student's side of reviewing: the tutors who taught them and are still
 * unrated, and the ratings they have already left.
 */
export default function StudentReviews({ darkMode, cardClass, onChanged }) {
  const [written, setWritten] = useState([]);
  const [awaiting, setAwaiting] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    const { ok, body } = await apiGet('/reviews/mine');

    if (ok) {
      setWritten(body?.data ?? []);
      setAwaiting(body?.awaiting_review ?? []);
    }

    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (id) => {
    const { ok } = await apiDelete(`/reviews/${id}`);

    if (ok) {
      await load();
      onChanged?.();
    }
  };

  const muted = darkMode ? 'text-slate-400' : 'text-slate-500';
  const heading = darkMode ? 'text-white' : 'text-slate-900';

  if (loading) {
    return <p className={`text-xs font-semibold ${muted}`}>Loading reviews…</p>;
  }

  // Nothing to rate and nothing rated: say why rather than showing a blank.
  if (awaiting.length === 0 && written.length === 0) {
    return (
      <div className="text-center py-6">
        <Star size={20} className="mx-auto text-amber-400 mb-2" />
        <p className={`text-xs font-semibold ${muted}`}>
          Once a tutor accepts your request and teaches you, you can rate them here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {editing && (
        <div className={`p-4 rounded-xl border ${cardClass}`}>
          <ReviewForm
            darkMode={darkMode}
            tutor={editing.tutor}
            existing={editing.existing}
            onCancel={() => setEditing(null)}
            onSaved={async () => {
              setEditing(null);
              await load();
              onChanged?.();
            }}
          />
        </div>
      )}

      {awaiting.length > 0 && !editing && (
        <div>
          <h4 className={`text-[11px] font-extrabold uppercase tracking-wider mb-3 ${muted}`}>
            Waiting on your rating
          </h4>

          <div className="space-y-2">
            {awaiting.map((tutor) => (
              <div
                key={tutor.id}
                className={`flex items-center justify-between gap-3 p-3 rounded-xl border ${cardClass}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <UserAvatar user={{ name: tutor.name, profile_picture: tutor.avatar }} size={34} />

                  <div className="min-w-0">
                    <p className={`text-xs font-bold truncate ${heading}`}>{tutor.name}</p>
                    <p className={`text-[10px] ${muted}`}>{tutor.department ?? 'AUST'}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setEditing({ tutor, existing: null })}
                  className="shrink-0 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-[11px] font-bold transition"
                >
                  Rate
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {written.length > 0 && !editing && (
        <div>
          <h4 className={`text-[11px] font-extrabold uppercase tracking-wider mb-3 ${muted}`}>
            Your reviews
          </h4>

          <div className="space-y-2">
            {written.map((review) => (
              <div key={review.id} className={`p-3 rounded-xl border ${cardClass}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <UserAvatar
                      user={{ name: review.tutor?.name, profile_picture: review.tutor?.avatar }}
                      size={34}
                    />

                    <div className="min-w-0">
                      <p className={`text-xs font-bold truncate ${heading}`}>{review.tutor?.name}</p>
                      <StarRating value={review.rating} darkMode={darkMode} size={11} />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditing({ tutor: review.tutor, existing: review })}
                      className="text-[11px] font-bold text-emerald-500 hover:text-emerald-400 transition"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(review.id)}
                      className="text-[11px] font-bold text-rose-500 hover:text-rose-400 transition"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {review.comment && (
                  <p className={`text-[11px] mt-2 ${muted}`}>{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
