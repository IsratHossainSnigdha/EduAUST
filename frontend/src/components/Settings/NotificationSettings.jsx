import React, { useEffect, useId, useState } from 'react';

import Switch from '../Switch';
import { apiGet, apiPatch, firstError } from '../../lib/auth';
import { usePushNotifications } from '../../lib/usePushNotifications';

const TOPICS = [
  { key: 'messages', title: 'Messages', description: 'When someone sends you a message.' },
  { key: 'requests', title: 'Tuition requests', description: 'New requests, answers to yours, and arrangements ending.' },
  { key: 'sessions', title: 'Sessions', description: 'Sessions proposed to you, confirmed or cancelled.' },
  { key: 'system', title: 'EduAUST updates', description: 'Occasional notices about your account and the site.' },
];

/*
 * Which notifications this account receives.
 *
 * These switches used to be page state only: nothing saved them and nothing
 * read them, so switching one off changed nothing and it was back on after a
 * reload. Each one is now saved as it is flipped, and the server skips that
 * kind of notification when it is off.
 */
export default function NotificationSettings({ darkMode }) {
  const { permission, request, supported } = usePushNotifications({ enabled: false });

  const [preferences, setPreferences] = useState(null);
  const [savingKey, setSavingKey] = useState(null);
  const [error, setError] = useState('');
  const baseId = useId();

  const mutedClass = darkMode ? 'text-slate-400' : 'text-slate-500';
  const titleClass = darkMode ? 'text-white' : 'text-slate-900';
  const cardClass = darkMode ? 'border-slate-800 bg-slate-900/40' : 'border-slate-200 bg-slate-50/60';

  useEffect(() => {
    let cancelled = false;

    apiGet('/notifications/preferences').then(({ ok, body }) => {
      if (cancelled) return;

      if (ok) setPreferences(body.preferences);
      else setError(firstError(body, 'Could not load your notification settings.'));
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const change = async (key, value) => {
    const previous = preferences;

    // Show the change at once, and put it back if the save fails.
    setPreferences({ ...preferences, [key]: value });
    setSavingKey(key);
    setError('');

    const { ok, body } = await apiPatch('/notifications/preferences', { [key]: value });

    setSavingKey(null);

    if (!ok) {
      setPreferences(previous);
      setError(firstError(body, 'Could not save that change. Please try again.'));

      return;
    }

    setPreferences(body.preferences);
  };

  return (
    <div className="space-y-6">
      {/* Desktop notifications */}
      <div className={`p-4 rounded-xl border ${cardClass}`}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className={`text-xs font-black ${titleClass}`}>Desktop notifications</h3>
            <p className={`text-xs mt-1 ${mutedClass}`}>
              {!supported
                ? 'Your browser does not support desktop notifications.'
                : permission === 'granted'
                  ? 'On. New notifications pop up while EduAUST is open in another tab.'
                  : permission === 'denied'
                    ? 'Blocked. Allow notifications for this site in your browser settings.'
                    : 'Get a pop-up for new notifications while EduAUST is open in another tab.'}
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
        </div>
      </div>

      <div>
        <h3 className={`text-xs font-black uppercase tracking-wider mb-1 ${titleClass}`}>
          What to notify you about
        </h3>
        <p className={`text-xs mb-3 ${mutedClass}`}>
          Changes save as soon as you make them. Switching one off stops new notifications of that
          kind; messages and requests themselves still arrive.
        </p>

        {error && (
          <p role="alert" className="mb-3 text-sm text-red-500 font-semibold bg-red-500/10 p-3 rounded-xl">
            {error}
          </p>
        )}

        {!preferences && !error && (
          <div className="space-y-2" aria-busy="true">
            {TOPICS.map((t) => (
              <div key={t.key} className={`h-16 rounded-xl animate-pulse ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`} />
            ))}
          </div>
        )}

        {preferences && (
          <ul className={`rounded-xl border divide-y ${darkMode ? 'border-slate-800 divide-slate-800' : 'border-slate-200 divide-slate-200'}`}>
            {TOPICS.map((topic) => {
              const titleId = `${baseId}-${topic.key}-title`;
              const hintId = `${baseId}-${topic.key}-hint`;

              return (
                <li key={topic.key} className="flex items-center justify-between gap-4 p-4">
                  <div>
                    <p id={titleId} className={`text-xs font-bold ${titleClass}`}>
                      {topic.title}
                    </p>
                    <p id={hintId} className={`text-xs mt-1 ${mutedClass}`}>
                      {topic.description}
                    </p>
                  </div>

                  <Switch
                    checked={Boolean(preferences[topic.key])}
                    onChange={(value) => change(topic.key, value)}
                    darkMode={darkMode}
                    labelledBy={titleId}
                    describedBy={hintId}
                    disabled={savingKey === topic.key}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
