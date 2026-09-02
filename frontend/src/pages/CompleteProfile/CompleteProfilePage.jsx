import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { API_BASE, apiGet, apiPatch, firstError, isAuthenticated } from '../../lib/auth';
import './CompleteProfilePage.css';

/**
 * Collects the details a Google sign-in cannot provide.
 *
 * The student ID and department are read from the AUST address during sign-in,
 * so this normally only asks for the phone number and semester — and shows the
 * derived values as read-only confirmation.
 */
export default function CompleteProfilePage({
  darkMode, themeClass, cardClass, subTextClass,
}) {
  const navigate = useNavigate();

  const [departments, setDepartments] = useState([]);
  const [user, setUser] = useState(null);
  const [phone, setPhone] = useState('');
  const [semester, setSemester] = useState('');
  const [studentId, setStudentId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);

  /**
   * Check the form before sending it, so obvious mistakes are corrected in
   * place rather than after a round trip.
   */
  const validate = () => {
    const errors = {};

    if (!user?.student_id) {
      if (!studentId.trim()) errors.student_id = 'Your student ID is required.';
      else if (!/^\d{6,15}$/.test(studentId.trim())) errors.student_id = 'The student ID should be 6–15 digits.';
    }

    if (!departmentId) errors.department_id = 'Please select your department.';
    if (!semester) errors.semester = 'Please select your semester.';

    const trimmedPhone = phone.trim();
    if (!trimmedPhone) errors.phone = 'Your phone number is required.';
    else if (!/^01\d{9}$/.test(trimmedPhone)) errors.phone = 'Enter an 11-digit number starting with 01.';

    return errors;
  };

  const textColor = darkMode ? 'text-slate-200' : 'text-slate-800';
  const labelColor = darkMode ? 'text-slate-300' : 'text-slate-700';
  const inputBgClass = darkMode
    ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-600'
    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400';

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');

      return;
    }

    apiGet('/auth/me').then(({ ok, body }) => {
      if (!ok) return;
      const me = body.user ?? {};
      setUser(me);
      setStudentId(me.student_id ?? '');
      setDepartmentId(me.department_id ? String(me.department_id) : '');
      setPhone(me.phone ?? '');
      setSemester(me.semester ?? '');
    });

    fetch(`${API_BASE}/departments`)
      .then((res) => res.json())
      .then((body) => setDepartments(body.data ?? []))
      .catch(() => setDepartments([]));
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const errors = validate();
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) return;

    setSaving(true);

    // Send only what the account is still missing.
    const payload = { phone, semester };
    if (!user?.student_id && studentId) payload.student_id = studentId;
    if (!user?.department_id && departmentId) payload.department_id = Number(departmentId);

    const { ok, body } = await apiPatch('/auth/profile', payload);
    setSaving(false);

    if (!ok) {
      // Show the server's per-field complaints beside the fields themselves.
      if (body?.errors) {
        setFieldErrors(
          Object.fromEntries(Object.entries(body.errors).map(([field, messages]) => [field, messages[0]]))
        );
      }

      setError(firstError(body, 'Could not save your profile. Please try again.'));

      return;
    }

    navigate('/dashboard');
  };

  return (
    <div className={`complete-profile-container ${themeClass}`}>
      <div className={`complete-profile-card border shadow-xl ${cardClass}`}>
        <div className="text-center mb-8">
          <div className="complete-profile-icon-box">
            <Check size={24} strokeWidth={3} />
          </div>
          <h2 className={`text-2xl font-black tracking-tight ${textColor}`}>Almost there</h2>
          <p className={`text-sm mt-2 ${subTextClass}`}>
            We got your name and AUST email from Google. Just a couple more details.
          </p>
        </div>

        {error && <p className="mb-4 text-sm text-red-500 font-semibold bg-red-500/10 p-3 rounded-xl">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-5">
          {user?.student_id ? (
            <div>
              <label className={`block text-xs font-extrabold mb-2 uppercase tracking-wider ${labelColor}`}>Student ID</label>
              <input type="text" value={user.student_id} readOnly className={`complete-profile-input opacity-70 ${inputBgClass}`} />
            </div>
          ) : (
            <div>
              <label className={`block text-xs font-extrabold mb-2 uppercase tracking-wider ${labelColor}`}>Student ID</label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="20230204017"
                className={`complete-profile-input ${fieldErrors.student_id ? 'border-red-500' : ''} ${inputBgClass}`}
              />
              {fieldErrors.student_id && <p className="mt-2 text-xs text-red-500 font-medium">{fieldErrors.student_id}</p>}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-xs font-extrabold mb-2 uppercase tracking-wider ${labelColor}`}>Department</label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                disabled={Boolean(user?.department_id)}
                className={`complete-profile-input disabled:opacity-70 ${fieldErrors.department_id ? 'border-red-500' : ''} ${inputBgClass}`}
              >
                <option value="">Select</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.code}</option>
                ))}
              </select>
              {fieldErrors.department_id && <p className="mt-2 text-xs text-red-500 font-medium">{fieldErrors.department_id}</p>}
            </div>

            <div>
              <label className={`block text-xs font-extrabold mb-2 uppercase tracking-wider ${labelColor}`}>Semester</label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className={`complete-profile-input ${fieldErrors.semester ? 'border-red-500' : ''} ${inputBgClass}`}
              >
                <option value="">Select</option>
                {['1.1', '1.2', '2.1', '2.2', '3.1', '3.2', '4.1', '4.2'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {fieldErrors.semester && <p className="mt-2 text-xs text-red-500 font-medium">{fieldErrors.semester}</p>}
            </div>
          </div>

          <div>
            <label className={`block text-xs font-extrabold mb-2 uppercase tracking-wider ${labelColor}`}>Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
              maxLength="11"
              placeholder="01XXXXXXXXX"
              className={`complete-profile-input ${fieldErrors.phone ? 'border-red-500' : ''} ${inputBgClass}`}
            />
            {fieldErrors.phone && <p className="mt-2 text-xs text-red-500 font-medium">{fieldErrors.phone}</p>}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="complete-profile-submit-btn"
          >
            {saving ? 'Saving…' : 'Finish and continue'}
          </button>
        </form>
      </div>
    </div>
  );
}