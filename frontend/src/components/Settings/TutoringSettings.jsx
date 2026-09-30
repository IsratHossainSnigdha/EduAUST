import React, { useEffect, useId, useState } from 'react';
import { X } from 'lucide-react';

import Switch from '../Switch';
import { apiGet, apiPatch, firstError } from '../../lib/auth';

const HEADLINE_MAX = 255;
const BIO_MAX = 1000;

/*
 * What students see on this tutor's card.
 *
 * The tab this replaces showed "Data Structures, Algorithms" to every tutor,
 * typed into the code, beside a save button with no handler, so a tutor could
 * not change the subjects they had signed up with. Everything here is read
 * from and saved to the tutor's real profile.
 */
export default function TutoringSettings({ darkMode }) {
  const [form, setForm] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [languageDraft, setLanguageDraft] = useState('');
  const [loadError, setLoadError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  const availabilityLabelId = useId();
  const availabilityHintId = useId();

  const inputClass = darkMode
    ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-600'
    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400';
  const labelClass = `block text-xs font-extrabold mb-2 uppercase tracking-wider ${
    darkMode ? 'text-slate-300' : 'text-slate-700'
  }`;
  const mutedClass = darkMode ? 'text-slate-400' : 'text-slate-500';
  const fieldClass = (name) =>
    `w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
      fieldErrors[name] ? 'border-red-500' : ''
    } ${inputClass}`;

  useEffect(() => {
    let cancelled = false;

    Promise.all([apiGet('/tutor/profile'), apiGet('/subjects')]).then(([profile, list]) => {
      if (cancelled) return;

      if (!profile.ok) {
        setLoadError(profile.body?.message || 'Could not load your tutoring profile.');

        return;
      }

      const p = profile.body.tutor_profile;

      setForm({
        headline: p.headline ?? '',
        bio: p.bio ?? '',
        hourly_rate: p.hourly_rate === null || p.hourly_rate === undefined ? '' : String(p.hourly_rate),
        experience_years: String(p.experience_years ?? 0),
        languages: p.languages ?? [],
        subjects: (p.subjects ?? []).map((s) => s.id),
        is_available: Boolean(p.is_available),
      });

      setSubjects(list.ok ? (list.body?.subjects ?? []) : []);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const update = (patch) => {
    setForm((current) => ({ ...current, ...patch }));
    setStatus('');
  };

  const addLanguage = (raw) => {
    const value = raw.trim().replace(/,$/, '').trim();

    if (!value) return;

    // "English" and "english" are one language.
    if (!form.languages.some((l) => l.toLowerCase() === value.toLowerCase())) {
      update({ languages: [...form.languages, value] });
    }

    setLanguageDraft('');
  };

  const toggleSubject = (id) => {
    update({
      subjects: form.subjects.includes(id)
        ? form.subjects.filter((s) => s !== id)
        : [...form.subjects, id],
    });
  };

  const save = async (event) => {
    event.preventDefault();
    setError('');
    setStatus('');
    setFieldErrors({});

    // Say so before a round trip rather than after one.
    if (form.subjects.length === 0) {
      setFieldErrors({ subjects: 'Choose at least one subject you teach.' });

      return;
    }

    setSaving(true);

    // Anything half-typed in the language box counts too.
    const languages = languageDraft.trim()
      ? [...form.languages, languageDraft.trim()]
      : form.languages;

    const { ok, body } = await apiPatch('/tutor/profile', {
      headline: form.headline.trim() || null,
      bio: form.bio.trim() || null,
      hourly_rate: form.hourly_rate === '' ? null : Number(form.hourly_rate),
      experience_years: Number(form.experience_years || 0),
      languages,
      subjects: form.subjects,
      is_available: form.is_available,
    });

    setSaving(false);

    if (!ok) {
      if (body?.errors) {
        setFieldErrors(
          Object.fromEntries(
            Object.entries(body.errors).map(([field, messages]) => [field.split('.')[0], messages[0]])
          )
        );
      }

      setError(firstError(body, 'Could not save your tutoring profile.'));

      return;
    }

    const p = body.tutor_profile;

    // What the server kept, which may differ from what was typed (a repeated
    // language is dropped, for instance).
    setForm((current) => ({
      ...current,
      languages: p.languages ?? [],
      subjects: (p.subjects ?? []).map((s) => s.id),
    }));
    setLanguageDraft('');
    setStatus('Your tutoring profile has been saved.');
  };

  if (loadError) {
    return (
      <p role="alert" className="text-sm text-red-500 font-semibold bg-red-500/10 p-3 rounded-xl">
        {loadError}
      </p>
    );
  }

  if (!form) {
    return (
      <div className="space-y-3" aria-busy="true">
        {[0, 1, 2, 3].map((row) => (
          <div
            key={row}
            className={`h-12 rounded-xl animate-pulse ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}
          />
        ))}
      </div>
    );
  }

  return (
    <form onSubmit={save} className="space-y-6" noValidate>
      {/* Accepting students first: it decides whether the rest is seen. */}
      <div
        className={`flex items-start justify-between gap-4 p-4 rounded-xl border ${
          darkMode ? 'border-slate-800 bg-slate-900/40' : 'border-slate-200 bg-slate-50/60'
        }`}
      >
        <div>
          <p id={availabilityLabelId} className={`text-xs font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Accepting new students
          </p>
          <p id={availabilityHintId} className={`text-xs mt-1 ${mutedClass}`}>
            {form.is_available
              ? 'You appear in Find Tutors and students can send you requests.'
              : 'You are hidden from Find Tutors and nobody can send you a new request. Students you already teach are not affected.'}
          </p>
        </div>

        <Switch
          checked={form.is_available}
          onChange={(value) => update({ is_available: value })}
          darkMode={darkMode}
          labelledBy={availabilityLabelId}
          describedBy={availabilityHintId}
        />
      </div>

      <div>
        <label htmlFor="tutoring-headline" className={labelClass}>
          Headline
        </label>
        <input
          id="tutoring-headline"
          type="text"
          maxLength={HEADLINE_MAX}
          value={form.headline}
          onChange={(e) => update({ headline: e.target.value })}
          placeholder="e.g. Data Structures & Algorithms Tutor"
          className={fieldClass('headline')}
        />
        {fieldErrors.headline && <p className="mt-1.5 text-xs text-red-500 font-medium">{fieldErrors.headline}</p>}
      </div>

      <div>
        <label htmlFor="tutoring-bio" className={labelClass}>
          About your tutoring
        </label>
        <textarea
          id="tutoring-bio"
          rows={4}
          maxLength={BIO_MAX}
          value={form.bio}
          onChange={(e) => update({ bio: e.target.value })}
          aria-describedby="tutoring-bio-count"
          placeholder="How you teach, what you cover, and who you are a good fit for."
          className={fieldClass('bio')}
        />
        <p id="tutoring-bio-count" className={`mt-1 text-xs text-right ${mutedClass}`}>
          {form.bio.length} / {BIO_MAX}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="tutoring-rate" className={labelClass}>
            Hourly rate (৳)
          </label>
          <input
            id="tutoring-rate"
            type="number"
            inputMode="numeric"
            min="0"
            max="100000"
            step="1"
            value={form.hourly_rate}
            onChange={(e) => update({ hourly_rate: e.target.value })}
            placeholder="Leave empty to discuss"
            className={fieldClass('hourly_rate')}
          />
          {fieldErrors.hourly_rate && <p className="mt-1.5 text-xs text-red-500 font-medium">{fieldErrors.hourly_rate}</p>}
        </div>

        <div>
          <label htmlFor="tutoring-experience" className={labelClass}>
            Years of experience
          </label>
          <input
            id="tutoring-experience"
            type="number"
            inputMode="numeric"
            min="0"
            max="60"
            step="1"
            value={form.experience_years}
            onChange={(e) => update({ experience_years: e.target.value })}
            className={fieldClass('experience_years')}
          />
          {fieldErrors.experience_years && (
            <p className="mt-1.5 text-xs text-red-500 font-medium">{fieldErrors.experience_years}</p>
          )}
        </div>
      </div>

      <fieldset>
        <legend className={labelClass}>Subjects you teach</legend>
        <p className={`-mt-1 mb-3 text-xs ${mutedClass}`}>
          Students filter Find Tutors by these. Choose at least one.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
          {subjects.map((subject) => {
            const on = form.subjects.includes(subject.id);

            return (
              <label
                key={subject.id}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-xs font-bold cursor-pointer transition ${
                  on
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                    : darkMode
                      ? 'border-slate-800 text-slate-300 hover:border-slate-600'
                      : 'border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => toggleSubject(subject.id)}
                  className="w-4 h-4 accent-emerald-600"
                />
                {subject.name}
              </label>
            );
          })}
        </div>

        {fieldErrors.subjects && (
          <p role="alert" className="mt-2 text-xs text-red-500 font-medium">
            {fieldErrors.subjects}
          </p>
        )}
      </fieldset>

      <div>
        <label htmlFor="tutoring-language" className={labelClass}>
          Languages you teach in
        </label>

        {form.languages.length > 0 && (
          <ul className="flex flex-wrap gap-2 mb-2" aria-label="Languages added">
            {form.languages.map((language) => (
              <li
                key={language}
                className={`flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full text-xs font-bold ${
                  darkMode ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {language}
                <button
                  type="button"
                  onClick={() => update({ languages: form.languages.filter((l) => l !== language) })}
                  aria-label={`Remove ${language}`}
                  className="p-0.5 rounded-full hover:bg-rose-500/20 hover:text-rose-500 transition"
                >
                  <X size={12} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <input
          id="tutoring-language"
          type="text"
          value={languageDraft}
          onChange={(e) => {
            // A comma finishes a language, the way it reads when typed.
            if (e.target.value.endsWith(',')) addLanguage(e.target.value);
            else setLanguageDraft(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addLanguage(languageDraft);
            } else if (e.key === 'Backspace' && !languageDraft && form.languages.length) {
              update({ languages: form.languages.slice(0, -1) });
            }
          }}
          onBlur={() => addLanguage(languageDraft)}
          aria-describedby="tutoring-language-hint"
          placeholder="Type a language and press Enter"
          className={fieldClass('languages')}
        />
        <p id="tutoring-language-hint" className={`mt-1.5 text-xs ${mutedClass}`}>
          For example Bangla or English. Students can filter by language.
        </p>
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
        {saving ? 'Saving…' : 'Save tutoring profile'}
      </button>
    </form>
  );
}
