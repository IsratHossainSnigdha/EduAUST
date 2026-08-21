import React, { useState } from 'react';
import { Camera } from 'lucide-react';

export default function ProfileSettings({
  darkMode,
  role,
}) {
  const [name, setName] = useState(
    role === 'tutor'
      ? 'Nusrat Jahan'
      : 'Ishrat Jahan Ifa'
  );

  const [email] = useState(
    role === 'tutor'
      ? 'nusrat.jahan@aust.edu'
      : 'ishrat.ifa@aust.edu'
  );

  const [bio, setBio] = useState(
    role === 'tutor'
      ? 'Computer Science tutor at AUST.'
      : 'CSE student at AUST.'
  );

  return (
    <div className="space-y-5">
      {/* Profile image */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <img
            src={
              role === 'tutor'
                ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120'
                : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120'
            }
            alt="Profile"
            className="w-16 h-16 rounded-full object-cover"
          />

          <button
            type="button"
            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow"
          >
            <Camera size={13} />
          </button>
        </div>

        <div>
          <h3
            className={`text-xs font-bold ${
              darkMode
                ? 'text-white'
                : 'text-slate-900'
            }`}
          >
            Profile Picture
          </h3>

          <p
            className={`text-[11px] mt-1 ${
              darkMode
                ? 'text-slate-400'
                : 'text-slate-500'
            }`}
          >
            JPG or PNG. Max 2MB.
          </p>
        </div>
      </div>

      {/* Name */}
      <div>
        <label
          className={`block text-xs font-bold mb-2 ${
            darkMode
              ? 'text-slate-200'
              : 'text-slate-700'
          }`}
        >
          Full Name
        </label>

        <input
          type="text"
          value={name}
          onChange={(e) =>
            setName(e.target.value)
          }
          className={`w-full px-4 py-2.5 rounded-xl border text-xs outline-none ${
            darkMode
              ? 'bg-slate-900 border-slate-700 text-white'
              : 'bg-slate-50 border-slate-200 text-slate-900'
          }`}
        />
      </div>

      {/* Email */}
      <div>
        <label
          className={`block text-xs font-bold mb-2 ${
            darkMode
              ? 'text-slate-200'
              : 'text-slate-700'
          }`}
        >
          Email
        </label>

        <input
          type="email"
          value={email}
          disabled
          className={`w-full px-4 py-2.5 rounded-xl border text-xs ${
            darkMode
              ? 'bg-slate-800 border-slate-700 text-slate-400'
              : 'bg-slate-100 border-slate-200 text-slate-500'
          }`}
        />
      </div>

      {/* Bio */}
      <div>
        <label
          className={`block text-xs font-bold mb-2 ${
            darkMode
              ? 'text-slate-200'
              : 'text-slate-700'
          }`}
        >
          Bio
        </label>

        <textarea
          rows="3"
          value={bio}
          onChange={(e) =>
            setBio(e.target.value)
          }
          className={`w-full px-4 py-2.5 rounded-xl border text-xs outline-none resize-none ${
            darkMode
              ? 'bg-slate-900 border-slate-700 text-white'
              : 'bg-slate-50 border-slate-200 text-slate-900'
          }`}
        />
      </div>

      <button
        type="button"
        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
      >
        Save Profile
      </button>
    </div>
  );
}