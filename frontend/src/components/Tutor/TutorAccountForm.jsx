import React, {
  useEffect,
  useState,
} from 'react';

import {
  apiGet,
  apiPost,
  firstError,
} from '../../lib/auth';

export default function TutorAccountForm({
  darkMode,
  onSuccess,
}) {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] =
    useState([]);

  const [formData, setFormData] = useState({
    experience: '',
    bio: '',
  });

  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] =
    useState('');
  const [submitting, setSubmitting] =
    useState(false);
  const [loadingSubjects, setLoadingSubjects] =
    useState(true);

  const inputClass = `w-full px-4 py-2.5 rounded-xl border text-xs outline-none transition ${
    darkMode
      ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-emerald-500'
      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500'
  }`;

  const labelClass = `block text-xs font-bold mb-2 ${
    darkMode
      ? 'text-slate-200'
      : 'text-slate-700'
  }`;

  // Load subjects from backend
  useEffect(() => {
    let cancelled = false;

    const loadSubjects = async () => {
      setLoadingSubjects(true);
      setSubmitError('');

      const { ok, body } =
        await apiGet('/subjects');

      if (cancelled) return;

      if (ok) {
        setSubjects(body?.subjects ?? []);
      } else {
        setSubmitError(
          firstError(
            body,
            'Could not load subjects.'
          )
        );
      }

      setLoadingSubjects(false);
    };

    loadSubjects();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: '',
    }));

    setSubmitError('');
  };

  // Select / unselect a subject
  const toggleSubject = (subjectId) => {
    setSelectedSubjects((previous) => {
      if (previous.includes(subjectId)) {
        return previous.filter(
          (id) => id !== subjectId
        );
      }

      return [...previous, subjectId];
    });

    setErrors((previous) => ({
      ...previous,
      subjects: '',
    }));

    setSubmitError('');
  };

  const validate = () => {
    const nextErrors = {};

    if (selectedSubjects.length === 0) {
      nextErrors.subjects =
        'Please select at least one subject.';
    }

    if (
      formData.experience &&
      (
        Number.isNaN(
          Number(formData.experience)
        ) ||
        Number(formData.experience) < 0
      )
    ) {
      nextErrors.experience =
        'Experience must be a valid non-negative number.';
    }

    if (formData.bio.length > 1000) {
      nextErrors.bio =
        'Bio must be 1000 characters or less.';
    }

    setErrors(nextErrors);

    return (
      Object.keys(nextErrors).length === 0
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    const payload = {
      subjects: selectedSubjects,

      experience:
        formData.experience === ''
          ? null
          : Number(formData.experience),

      bio:
        formData.bio.trim() || null,
    };

    // Create tutor account
    const { ok, body } =
      await apiPost(
        '/tutor/account',
        payload
      );

    if (!ok) {
      setSubmitting(false);

      if (body?.errors) {
        setErrors(body.errors);
      }

      setSubmitError(
        firstError(
          body,
          'Could not create your tutor account.'
        )
      );

      return;
    }

    /*
     * IMPORTANT:
     * Refresh the authenticated user after
     * creating the tutor account.
     *
     * This makes sure localStorage contains
     * isTutor = true before navigation.
     */
    const {
      ok: meOk,
      body: meBody,
    } = await apiGet('/auth/me');

    if (meOk && meBody?.user) {
      localStorage.setItem(
        'eduAUST_user',
        JSON.stringify(meBody.user)
      );

      localStorage.setItem(
        'eduAUST_role',
        'tutor'
      );
    }

    setSubmitting(false);

    // Navigate only after localStorage is updated
    onSuccess(body);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      {/* =========================
          SUBJECTS
      ========================== */}

      <div>
        <label className={labelClass}>
          Teaching Subjects
        </label>

        {loadingSubjects ? (
          <div
            className={`text-xs py-3 ${
              darkMode
                ? 'text-slate-400'
                : 'text-slate-500'
            }`}
          >
            Loading subjects...
          </div>
        ) : subjects.length === 0 ? (
          <div
            className={`p-3 rounded-xl border text-xs ${
              darkMode
                ? 'border-slate-700 text-slate-400'
                : 'border-slate-200 text-slate-500'
            }`}
          >
            No subjects are available.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
            {subjects.map((subject) => {
              const selected =
                selectedSubjects.includes(
                  subject.id
                );

              return (
                <button
                  key={subject.id}
                  type="button"
                  onClick={() =>
                    toggleSubject(
                      subject.id
                    )
                  }
                  disabled={submitting}
                  className={`text-left px-4 py-3 rounded-xl border text-xs transition ${
                    selected
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500'
                      : darkMode
                        ? 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span>
                      {subject.name}
                    </span>

                    {selected && (
                      <span className="text-emerald-500 font-bold">
                        ✓
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <p
          className={`text-[10px] mt-1 ${
            darkMode
              ? 'text-slate-500'
              : 'text-slate-400'
          }`}
        >
          Select all subjects you are comfortable
          teaching.
        </p>

        {selectedSubjects.length > 0 && (
          <p className="text-[10px] text-emerald-500 mt-1">
            {selectedSubjects.length}{' '}
            subject
            {selectedSubjects.length !== 1
              ? 's'
              : ''}{' '}
            selected
          </p>
        )}

        {errors.subjects && (
          <p className="text-[10px] text-rose-500 mt-1">
            {Array.isArray(errors.subjects)
              ? errors.subjects[0]
              : errors.subjects}
          </p>
        )}
      </div>

      {/* =========================
          EXPERIENCE
      ========================== */}

      <div>
        <label
          htmlFor="experience"
          className={labelClass}
        >
          Teaching Experience
        </label>

        <div className="relative">
          <input
            id="experience"
            name="experience"
            type="number"
            min="0"
            step="1"
            value={formData.experience}
            onChange={handleChange}
            placeholder="0"
            className={`${inputClass} pr-20`}
            disabled={submitting}
          />

          <span
            className={`absolute right-4 top-1/2 -translate-y-1/2 text-[10px] ${
              darkMode
                ? 'text-slate-500'
                : 'text-slate-400'
            }`}
          >
            years
          </span>
        </div>

        {errors.experience && (
          <p className="text-[10px] text-rose-500 mt-1">
            {Array.isArray(
              errors.experience
            )
              ? errors.experience[0]
              : errors.experience}
          </p>
        )}
      </div>

      {/* =========================
          BIO
      ========================== */}

      <div>
        <label
          htmlFor="bio"
          className={labelClass}
        >
          About Your Teaching
        </label>

        <textarea
          id="bio"
          name="bio"
          rows={5}
          value={formData.bio}
          onChange={handleChange}
          placeholder="Tell students a little about your teaching style and experience..."
          className={`${inputClass} resize-none`}
          disabled={submitting}
        />

        <div className="flex justify-between mt-1">
          {errors.bio ? (
            <p className="text-[10px] text-rose-500">
              {Array.isArray(errors.bio)
                ? errors.bio[0]
                : errors.bio}
            </p>
          ) : (
            <span />
          )}

          <span
            className={`text-[10px] ${
              darkMode
                ? 'text-slate-500'
                : 'text-slate-400'
            }`}
          >
            {formData.bio.length}/1000
          </span>
        </div>
      </div>

      {/* =========================
          SERVER ERROR
      ========================== */}

      {submitError && (
        <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/5 text-rose-500 text-xs font-medium">
          {submitError}
        </div>
      )}

      {/* =========================
          SUBMIT
      ========================== */}

      <button
        type="submit"
        disabled={
          submitting || loadingSubjects
        }
        className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/50 disabled:cursor-not-allowed text-white rounded-xl py-3 text-xs font-bold transition"
      >
        {submitting
          ? 'Creating Tutor Account...'
          : 'Create Tutor Account'}
      </button>
    </form>
  );
}