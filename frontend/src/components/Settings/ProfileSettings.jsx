import React, { useEffect, useState } from 'react';
import { apiGet, apiPatch, firstError } from '../../lib/auth';
import { useCurrentUser } from '../../lib/useCurrentUser';
import UserAvatar from '../UserAvatar';

/*
 * The signed-in user's own profile, loaded from and saved to the backend.
 *
 * Both dashboards read the same account, so an edit here is reflected
 * everywhere the name, department or picture is shown.
 */
export default function ProfileSettings({ darkMode }) {
  const { user, loading, refresh } = useCurrentUser();

  const [form, setForm] = useState({
    name: '',
    phone: '',
    semester: '',
    department_id: '',
    profile_picture: '',
  });

  const [tutorForm, setTutorForm] = useState({
    headline: '',
    bio: '',
    hourly_rate: '',
    is_available: true,
  });

  const [departments, setDepartments] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const inputClass = darkMode
    ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-600'
    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400';

  const labelClass = darkMode ? 'text-slate-300' : 'text-slate-700';

  // Seed the form once the account has loaded.
  useEffect(() => {
    if (!user) return;

    setForm({
      name: user.name ?? '',
      phone: user.phone ?? '',
      semester: user.semester ?? '',
      department_id: user.department_id ? String(user.department_id) : '',
      profile_picture: user.profile_picture ?? '',
    });
  }, [user]);

  useEffect(() => {
    apiGet('/departments').then(({ ok, body }) => {
      if (ok) setDepartments(body?.data ?? []);
    });
  }, []);

  // A tutor also owns the details shown on their public card.
  useEffect(() => {
    if (!user?.isTutor) return;

    apiGet('/tutor/dashboard').then(({ ok, body }) => {
      if (!ok || !body?.tutor) return;

      setTutorForm({
        headline: body.tutor.headline ?? '',
        bio: body.tutor.bio ?? '',
        hourly_rate: body.tutor.hourly_rate ? String(body.tutor.hourly_rate) : '',
        is_available: Boolean(body.tutor.is_available),
      });
    });
  }, [user?.isTutor]);

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setStatus('');
    setFieldErrors({});
    setSaving(true);

    // Send only what the user actually filled in.
    const payload = {
      name: form.name.trim(),
      profile_picture: form.profile_picture.trim() || null,
    };

    if (form.phone.trim()) payload.phone = form.phone.trim();
    if (form.semester) payload.semester = form.semester;
    if (form.department_id) payload.department_id = Number(form.department_id);

    const { ok, body } = await apiPatch('/auth/profile', payload);

    if (!ok) {
      setSaving(false);

      if (body?.errors) {
        setFieldErrors(
          Object.fromEntries(
            Object.entries(body.errors).map(([field, messages]) => [field, messages[0]])
          )
        );
      }

      setError(firstError(body, 'Could not save your profile.'));

      return;
    }

    // Tutors save their public card in the same action.
    if (user?.isTutor) {
      const tutorPayload = {
        headline: tutorForm.headline.trim() || null,
        bio: tutorForm.bio.trim() || null,
        is_available: tutorForm.is_available,
      };

      if (tutorForm.hourly_rate !== '') {
        tutorPayload.hourly_rate = Number(tutorForm.hourly_rate);
      }

      const tutorResult = await apiPatch('/tutor/profile', tutorPayload);

      if (!tutorResult.ok) {
        setSaving(false);
        setError(firstError(tutorResult.body, 'Could not save your tutor details.'));

        return;
      }
    }

    await refresh();
    setSaving(false);
    setStatus('Your profile has been saved.');
  };

  if (loading && !user) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((row) => (
          <div
            key={row}
            className={`h-12 rounded-xl animate-pulse ${
              darkMode ? 'bg-slate-800' : 'bg-slate-100'
            }`}
          />
        ))}
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-5">
      <div className="flex items-center gap-4">
        <UserAvatar user={{ ...user, profile_picture: form.profile_picture }} size={64} />

        <div className="flex-1 min-w-0">
          <label className={`block text-xs font-extrabold mb-2 uppercase tracking-wider ${labelClass}`}>
            Profile picture URL
          </label>
          <input
            type="url"
            value={form.profile_picture}
            onChange={(e) => setForm({ ...form, profile_picture: e.target.value })}
            placeholder="https://…"
            className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${inputClass}`}
          />
        </div>
      </div>

      <div>
        <label className={`block text-xs font-extrabold mb-2 uppercase tracking-wider ${labelClass}`}>
          Full name
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
            fieldErrors.name ? 'border-red-500' : ''
          } ${inputClass}`}
        />
        {fieldErrors.name && <p className="mt-1.5 text-xs text-red-500 font-medium">{fieldErrors.name}</p>}
      </div>

      <div>
        <label className={`block text-xs font-extrabold mb-2 uppercase tracking-wider ${labelClass}`}>
          AUST email
        </label>
        <input
          type="email"
          value={user?.email ?? ''}
          readOnly
          className={`w-full px-4 py-3 rounded-xl border opacity-70 cursor-not-allowed ${inputClass}`}
        />
        <p className={`mt-1.5 text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          Your institutional address identifies your account and cannot be changed.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={`block text-xs font-extrabold mb-2 uppercase tracking-wider ${labelClass}`}>
            Department
          </label>
          <select
            value={form.department_id}
            onChange={(e) => setForm({ ...form, department_id: e.target.value })}
            className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${inputClass}`}
          >
            <option value="">Select</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.code}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={`block text-xs font-extrabold mb-2 uppercase tracking-wider ${labelClass}`}>
            Semester
          </label>
          <select
            value={form.semester}
            onChange={(e) => setForm({ ...form, semester: e.target.value })}
            className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${inputClass}`}
          >
            <option value="">Select</option>
            {['1.1', '1.2', '2.1', '2.2', '3.1', '3.2', '4.1', '4.2'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={`block text-xs font-extrabold mb-2 uppercase tracking-wider ${labelClass}`}>
          Phone number
        </label>
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/[^0-9+]/g, '') })}
          placeholder="01XXXXXXXXX"
          className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
            fieldErrors.phone ? 'border-red-500' : ''
          } ${inputClass}`}
        />
        {fieldErrors.phone && <p className="mt-1.5 text-xs text-red-500 font-medium">{fieldErrors.phone}</p>}
      </div>

      {user?.isTutor && (
        <div className="pt-5 border-t border-slate-200 dark:border-slate-800 space-y-5">
          <h4 className={`text-xs font-black uppercase tracking-wider ${labelClass}`}>
            Tutoring details
          </h4>

          <div>
            <label className={`block text-xs font-extrabold mb-2 uppercase tracking-wider ${labelClass}`}>
              Headline
            </label>
            <input
              type="text"
              value={tutorForm.headline}
              onChange={(e) => setTutorForm({ ...tutorForm, headline: e.target.value })}
              placeholder="e.g. Data Structures & Algorithms Tutor"
              className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${inputClass}`}
            />
          </div>

          <div>
            <label className={`block text-xs font-extrabold mb-2 uppercase tracking-wider ${labelClass}`}>
              About your tutoring
            </label>
            <textarea
              rows={3}
              value={tutorForm.bio}
              onChange={(e) => setTutorForm({ ...tutorForm, bio: e.target.value })}
              className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${inputClass}`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 items-end">
            <div>
              <label className={`block text-xs font-extrabold mb-2 uppercase tracking-wider ${labelClass}`}>
                Hourly rate (৳)
              </label>
              <input
                type="number"
                min="0"
                value={tutorForm.hourly_rate}
                onChange={(e) => setTutorForm({ ...tutorForm, hourly_rate: e.target.value })}
                className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${inputClass}`}
              />
            </div>

            <label className={`flex items-center gap-2 pb-3 cursor-pointer ${labelClass}`}>
              <input
                type="checkbox"
                checked={tutorForm.is_available}
                onChange={(e) => setTutorForm({ ...tutorForm, is_available: e.target.checked })}
                className="w-4 h-4 accent-emerald-600 rounded"
              />
              <span className="text-xs font-bold">Accepting students</span>
            </label>
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500 font-semibold bg-red-500/10 p-3 rounded-xl">{error}</p>
      )}

      {status && (
        <p className="text-sm text-emerald-600 font-semibold bg-emerald-500/10 p-3 rounded-xl">{status}</p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold rounded-xl transition"
      >
        {saving ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  );
}
