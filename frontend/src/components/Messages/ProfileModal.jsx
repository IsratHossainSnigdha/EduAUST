import React, { useEffect, useState } from 'react';
import { BookOpen, GraduationCap, X } from 'lucide-react';
import { apiGet } from '../../lib/auth';
import UserAvatar from '../UserAvatar';
import StarRating from '../StarRating';
import ReviewForm from '../Reviews/ReviewForm';

/*
 * The other person's profile, opened from the message box.
 *
 * Shows who they are — a tutor's headline, subjects and rating, or a student's
 * department and their rating as a student — and, when the viewer has worked
 * with them, lets the viewer leave or edit a rating. It runs both ways: a
 * student rates the tutor, a tutor rates the student.
 */
export default function ProfileModal({ darkMode, userId, onClose, onReviewed }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(false);

  useEffect(() => {
    if (!userId) return undefined;

    let cancelled = false;
    setLoading(true);
    setRating(false);

    apiGet(`/users/${userId}/profile`).then(({ ok, body }) => {
      if (cancelled) return;

      if (ok) setProfile(body);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (!userId) return null;

  const cardBg = darkMode ? 'bg-[#1f2937] border-slate-800' : 'bg-white border-slate-200';
  const muted = darkMode ? 'text-slate-400' : 'text-slate-500';
  const heading = darkMode ? 'text-white' : 'text-slate-900';

  const u = profile?.user;
  const review = profile?.review;
  const isTutorProfile = u?.is_tutor && profile?.tutor;
  // A tutor's own rating is their tutor rating; a student's is their student
  // rating. Show whichever fits who they are.
  const shownRating = u?.is_tutor ? profile?.tutor_rating : profile?.student_rating;

  const reviewedName = u?.name?.split(' ')[0] ?? 'them';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-md rounded-2xl border shadow-xl max-h-[85vh] overflow-y-auto ${cardBg}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className={`text-sm font-black ${heading}`}>Profile</h3>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
          >
            <X size={16} />
          </button>
        </div>

        {loading ? (
          <p className={`p-8 text-center text-xs font-semibold ${muted}`}>Loading…</p>
        ) : !profile ? (
          <p className={`p-8 text-center text-xs font-semibold ${muted}`}>Could not load this profile.</p>
        ) : (
          <div className="p-5 space-y-5">

            {/* Identity */}
            <div className="flex items-center gap-4">
              <UserAvatar user={{ name: u.name, profile_picture: u.avatar }} size={56} />

              <div className="min-w-0">
                <h4 className={`text-base font-black truncate ${heading}`}>{u.name}</h4>
                <p className={`text-xs font-semibold flex items-center gap-1.5 ${muted}`}>
                  {u.is_tutor ? <BookOpen size={12} /> : <GraduationCap size={12} />}
                  {[u.is_tutor ? 'Tutor' : 'Student', u.department, u.semester].filter(Boolean).join(' · ')}
                </p>
                {shownRating?.count > 0 && (
                  <div className="mt-1">
                    <StarRating value={shownRating.average} count={shownRating.count} darkMode={darkMode} />
                  </div>
                )}
              </div>
            </div>

            {/* Tutor details */}
            {isTutorProfile && (
              <div className="space-y-3">
                {profile.tutor.headline && (
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {profile.tutor.headline}
                  </p>
                )}
                {profile.tutor.bio && (
                  <p className={`text-xs leading-relaxed ${muted}`}>{profile.tutor.bio}</p>
                )}

                <div className={`grid grid-cols-2 gap-3 text-center rounded-xl border p-3 ${
                  darkMode ? 'border-slate-700 bg-slate-800/40' : 'border-slate-200 bg-slate-50'
                }`}>
                  <div>
                    <p className={`text-[11px] font-semibold ${muted}`}>Experience</p>
                    <p className={`text-xs font-black ${heading}`}>{profile.tutor.experience_years ?? 0}+ yrs</p>
                  </div>
                  <div>
                    <p className={`text-[11px] font-semibold ${muted}`}>Rate</p>
                    <p className="text-xs font-black text-emerald-500">
                      {profile.tutor.hourly_rate ? `৳${profile.tutor.hourly_rate}/hr` : '—'}
                    </p>
                  </div>
                </div>

                {profile.tutor.subjects?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {profile.tutor.subjects.map((s) => (
                      <span
                        key={s}
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Rating: shown only when the viewer has worked with this person */}
            {review?.can_review && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                {rating ? (
                  <ReviewForm
                    darkMode={darkMode}
                    tutor={{ id: u.id, name: u.name, avatar: u.avatar, department: u.department }}
                    direction={review.direction}
                    existing={review.my_review}
                    onCancel={() => setRating(false)}
                    onSaved={() => {
                      setRating(false);
                      onReviewed?.();
                      // Reload so the shown rating and my_review update.
                      apiGet(`/users/${userId}/profile`).then(({ ok, body }) => ok && setProfile(body));
                    }}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setRating(true)}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl text-xs font-bold transition"
                  >
                    {review.my_review
                      ? 'Edit your rating'
                      : review.direction === 'tutor_to_student'
                        ? `Rate ${reviewedName}`
                        : `Rate ${reviewedName}`}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
