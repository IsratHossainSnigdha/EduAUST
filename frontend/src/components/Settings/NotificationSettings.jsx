import { usePushNotifications } from '../../lib/usePushNotifications';
import React, { useState } from 'react';

function Toggle({
  enabled,
  setEnabled,
  darkMode,
  label,
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onClick={() => setEnabled(!enabled)}
      className={`w-10 h-5 rounded-full p-0.5 transition ${
        enabled
          ? 'bg-emerald-600'
          : darkMode
          ? 'bg-slate-700'
          : 'bg-slate-300'
      }`}
    >
      <div
        className={`w-4 h-4 bg-white rounded-full transition-transform ${
          enabled ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export default function NotificationSettings({
  darkMode,
}) {
  const { permission, request, supported } = usePushNotifications({ enabled: false });
  const [messages, setMessages] =
    useState(true);

  const [requests, setRequests] =
    useState(true);

  const [system, setSystem] =
    useState(true);

  return (
    <div className="space-y-4">
      {/* Desktop notifications */}
      <div
        className={`p-4 rounded-xl border ${
          darkMode ? 'border-slate-800 bg-slate-900/40' : 'border-slate-200 bg-slate-50/60'
        }`}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Desktop notifications
            </h3>
            <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {!supported
                ? 'Your browser does not support desktop notifications.'
                : permission === 'granted'
                  ? 'On — new requests and messages appear while EduAUST is open.'
                  : permission === 'denied'
                    ? 'Blocked. Allow notifications for this site in your browser settings.'
                    : 'Get alerted about new requests and messages while EduAUST is open.'}
            </p>
          </div>

          {supported && permission === 'default' && (
            <button
              type="button"
              onClick={request}
              className="shrink-0 py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition"
            >
              Enable
            </button>
          )}

          {permission === 'granted' && (
            <span className="shrink-0 text-[11px] font-extrabold px-2 py-1 rounded bg-emerald-500/10 text-emerald-500">
              Enabled
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h3
            className={`text-xs font-bold ${
              darkMode
                ? 'text-white'
                : 'text-slate-900'
            }`}
          >
            Messages
          </h3>

          <p
            className={`text-xs mt-1 ${
              darkMode
                ? 'text-slate-400'
                : 'text-slate-500'
            }`}
          >
            Get notified when you receive messages.
          </p>
        </div>

        <Toggle
          enabled={messages}
          setEnabled={setMessages}
          darkMode={darkMode}
          label="Message notifications"
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h3
            className={`text-xs font-bold ${
              darkMode
                ? 'text-white'
                : 'text-slate-900'
            }`}
          >
            {requests
              ? 'Tuition Requests'
              : 'Tuition Requests'}
          </h3>

          <p
            className={`text-xs mt-1 ${
              darkMode
                ? 'text-slate-400'
                : 'text-slate-500'
            }`}
          >
            Receive updates about requests and activity.
          </p>
        </div>

        <Toggle
          enabled={requests}
          setEnabled={setRequests}
          darkMode={darkMode}
          label="Tuition request notifications"
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h3
            className={`text-xs font-bold ${
              darkMode
                ? 'text-white'
                : 'text-slate-900'
            }`}
          >
            System Notifications
          </h3>

          <p
            className={`text-xs mt-1 ${
              darkMode
                ? 'text-slate-400'
                : 'text-slate-500'
            }`}
          >
            Important updates from EduAUST.
          </p>
        </div>

        <Toggle
          enabled={system}
          setEnabled={setSystem}
          darkMode={darkMode}
          label="System notifications"
        />
      </div>
    </div>
  );
}