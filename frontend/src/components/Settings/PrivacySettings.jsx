import React, { useState } from 'react';

export default function PrivacySettings({
  darkMode,
}) {
  const [profileVisible, setProfileVisible] =
    useState(true);

  const [showOnlineStatus, setShowOnlineStatus] =
    useState(true);

  return (
    <div className="space-y-4">
      <label className="flex items-center justify-between cursor-pointer">
        <div>
          <h3
            className={`text-xs font-bold ${
              darkMode
                ? 'text-white'
                : 'text-slate-900'
            }`}
          >
            Public Profile
          </h3>

          <p
            className={`text-[11px] mt-1 ${
              darkMode
                ? 'text-slate-400'
                : 'text-slate-500'
            }`}
          >
            Allow other users to view your profile.
          </p>
        </div>

        <input
          type="checkbox"
          checked={profileVisible}
          onChange={(e) =>
            setProfileVisible(e.target.checked)
          }
          className="accent-emerald-600"
        />
      </label>

      <label className="flex items-center justify-between cursor-pointer">
        <div>
          <h3
            className={`text-xs font-bold ${
              darkMode
                ? 'text-white'
                : 'text-slate-900'
            }`}
          >
            Online Status
          </h3>

          <p
            className={`text-[11px] mt-1 ${
              darkMode
                ? 'text-slate-400'
                : 'text-slate-500'
            }`}
          >
            Show when you are active.
          </p>
        </div>

        <input
          type="checkbox"
          checked={showOnlineStatus}
          onChange={(e) =>
            setShowOnlineStatus(
              e.target.checked
            )
          }
          className="accent-emerald-600"
        />
      </label>
    </div>
  );
}