import React, { useEffect, useState } from 'react';
import { apiGet, apiPatch, firstError } from '../../lib/auth';
import { useCurrentUser } from '../../lib/useCurrentUser';
import UserAvatar from '../UserAvatar';

const SEMESTERS = ['1.1', '1.2', '2.1', '2.2', '3.1', '3.2', '4.1', '4.2'];

/*
 * The account's own details: name, picture, department, semester and phone.
 *
 * Both dashboards read the same account, so an edit here shows everywhere the
 * name, department or picture appears. What students see on a tutor card is
 * edited under Tutoring profile instead, so this tab stays short.
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

  const [departments, setDepartments] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const inputClass = darkMode
    ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-600'
    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400';
  const labelClass = `block text-xs font-extrabold mb-2 uppercase tracking-wider ${
    darkMode ? 'text-slate-300' : 'text-slate-700'
  }`;
  const hintClass = `mt-1.5 text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`;
  const fieldClass = (name) =>
    `w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
      fieldErrors[name] ? 'border-red-500' : ''
    } ${inputClass}`;

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
    let cancelled = false;

    apiGet('/departments').then(({ ok, body }) => {
      if (!cancelled && ok) setDepartments(body?.data ?? []);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const set = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setStatus('');
  };

  const handleSave = async (event) => {
    event.preventDefault();
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

    await refresh();
    setSaving(false);
    setStatus('Your profile has been saved.');
  };

  if (loading && !user) {
    return (
      <div className="space-y-3" aria-busy="true">
        {[0, 1, 2].map((row) => (
          <div
            key={row}
            className={`h-12 rounded-xl animate-pulse ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}
          />
        ))}
      </div>
    );
  }

  // A semester recorded before the list existed still shows as chosen.
  const semesters =
    form.semester && !SEMESTERS.includes(form.semester) ? [form.semester, ...SEMESTERS] : SEMESTERS;

  return (
    <form onSubmit={handleSave} className="space-y-5" noValidate>
      <div className="flex items-center gap-4">
        <UserAvatar user={{ ...user, profile_picture: form.profile_picture }} size={64} />

        <div className="flex-1 min-w-0">
          <label htmlFor="profile-picture" className={labelClass}>
            Profile picture URL
          </label>
          <input
            id="profile-picture"
            type="url"
            inputMode="url"
            value={form.profile_picture}
            onChange={set('profile_picture')}
            placeholder="https://…"
            className={fieldClass('profile_picture')}
          />
          {fieldErrors.profile_picture && (
            <p className="mt-1.5 text-xs text-red-500 font-medium">{fieldErrors.profile_picture}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="profile-name" className={labelClass}>
          Full name
        </label>
        <input
          id="profile-name"
          type="text"
          autoComplete="name"
          value={form.name}
          onChange={set('name')}
          className={fieldClass('name')}
        />
        {fieldErrors.name && <p className="mt-1.5 text-xs text-red-500 font-medium">{fieldErrors.name}</p>}
      </div>

      <div>
        <label htmlFor="profile-email" className={labelClass}>
          AUST email
        </label>
        <input
          id="profile-email"
          type="email"
          value={user?.email ?? ''}
          readOnly
          aria-describedby="profile-email-hint"
          className={`${fieldClass('email')} opacity-70 cursor-not-allowed`}
        />
        <p id="profile-email-hint" className={hintClass}>
          Your institutional address identifies your account and cannot be changed.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="profile-department" className={labelClass}>
            Department
          </label>
          <select
            id="profile-department"
            value={form.department_id}
            onChange={set('department_id')}
            className={fieldClass('department_id')}
          >
            <option value="">Select</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.code}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="profile-semester" className={labelClass}>
            Semester
          </label>
          <select
            id="profile-semester"
            value={form.semester}
            onChange={set('semester')}
            className={fieldClass('semester')}
          >
            <option value="">Select</option>
            {semesters.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="profile-phone" className={labelClass}>
          Phone number
        </label>
        <input
          id="profile-phone"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          value={form.phone}
          onChange={(e) => {
            setForm((current) => ({ ...current, phone: e.target.value.replace(/[^0-9+]/g, '') }));
            setStatus('');
          }}
          placeholder="01XXXXXXXXX"
          className={fieldClass('phone')}
        />
        {fieldErrors.phone && <p className="mt-1.5 text-xs text-red-500 font-medium">{fieldErrors.phone}</p>}
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-500 font-semibold bg-red-500/10 p-3 rounded-xl">
          {error}
        </p>
      )}

      {status && (
        <p role="status" className="text-sm text-emerald-600 font-semibold bg-emerald-500/10 p-3 rounded-xl">
          {status}
        </p>
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
