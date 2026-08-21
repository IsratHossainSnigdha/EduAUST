import React, { useState } from 'react';

function Toggle({
  enabled,
  setEnabled,
  darkMode,
}) {
  return (
    <button
      type="button"
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
  const [messages, setMessages] =
    useState(true);

  const [requests, setRequests] =
    useState(true);

  const [system, setSystem] =
    useState(true);

  return (
    <div className="space-y-4">
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
            className={`text-[11px] mt-1 ${
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
            className={`text-[11px] mt-1 ${
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
            className={`text-[11px] mt-1 ${
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
        />
      </div>
    </div>
  );
}