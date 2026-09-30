import React from 'react';

/*
 * An on/off switch that says what it is and whether it is on.
 *
 * Settings drew its switches as bare buttons, so assistive tech heard an
 * unnamed button with no state. This one is a real switch, named by the
 * label beside it or by `label`.
 */
export default function Switch({
  checked,
  onChange,
  darkMode,
  label,
  labelledBy,
  describedBy,
  disabled = false,
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={labelledBy ? undefined : label}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative shrink-0 w-11 h-6 rounded-full p-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 disabled:opacity-50 disabled:cursor-not-allowed ${
        checked ? 'bg-emerald-600' : darkMode ? 'bg-slate-700' : 'bg-slate-300'
      }`}
    >
      <span
        aria-hidden="true"
        className={`block w-4 h-4 bg-white rounded-full shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}
