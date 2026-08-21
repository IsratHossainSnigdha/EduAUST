import React from 'react';
import { ChevronRight } from 'lucide-react';

export default function AccountSettings({
  darkMode,
}) {
  const itemClass = `w-full flex items-center justify-between p-4 rounded-xl transition ${
    darkMode
      ? 'hover:bg-slate-800'
      : 'hover:bg-slate-50'
  }`;

  return (
    <div className="space-y-2">
      <button
        type="button"
        className={itemClass}
      >
        <div className="text-left">
          <h3
            className={`text-xs font-bold ${
              darkMode
                ? 'text-white'
                : 'text-slate-900'
            }`}
          >
            Change Password
          </h3>

          <p
            className={`text-[11px] mt-1 ${
              darkMode
                ? 'text-slate-400'
                : 'text-slate-500'
            }`}
          >
            Update your account password.
          </p>
        </div>

        <ChevronRight size={16} />
      </button>

      <button
        type="button"
        className={itemClass}
      >
        <div className="text-left">
          <h3
            className={`text-xs font-bold ${
              darkMode
                ? 'text-white'
                : 'text-slate-900'
            }`}
          >
            Connected Accounts
          </h3>

          <p
            className={`text-[11px] mt-1 ${
              darkMode
                ? 'text-slate-400'
                : 'text-slate-500'
            }`}
          >
            Manage linked authentication methods.
          </p>
        </div>

        <ChevronRight size={16} />
      </button>
    </div>
  );
}