import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Bell, GraduationCap, Palette, ShieldCheck, User } from 'lucide-react';

import TutorSidebar from '../../components/Tutor/TutorSidebar';
import TutorHeader from '../../components/Tutor/TutorHeader';
import SettingsSection from '../../components/Settings/SettingsSection';
import ProfileSettings from '../../components/Settings/ProfileSettings';
import TutoringSettings from '../../components/Settings/TutoringSettings';
import AccountSettings from '../../components/Settings/AccountSettings';
import NotificationSettings from '../../components/Settings/NotificationSettings';
import Switch from '../../components/Switch';
import { useCurrentUser } from '../../lib/useCurrentUser';
import { useRole } from '../../lib/useRole';

/*
 * Settings, one section at a time.
 *
 * It used to stack seven sections down one long page, and the whole page
 * scrolled, sidebar included, so reaching anything below Profile meant a long
 * scroll. The sections are tabs now. The one open is in the address, so the
 * account menu can link straight to it and a reload keeps you where you were.
 *
 * Every tab stays mounted while hidden, so a half-finished edit survives a
 * look at another tab.
 *
 * Privacy and Learning Preferences are gone: every control in them only
 * changed the page's own state, and nothing anywhere read the result.
 */
const TABS = [
  {
    key: 'profile',
    label: 'Profile',
    icon: User,
    title: 'Profile',
    description: 'Your name, picture, department and contact details.',
  },
  {
    key: 'tutoring',
    label: 'Tutoring profile',
    icon: GraduationCap,
    title: 'Tutoring profile',
    description: 'What students see on your tutor card, and whether you are taking new students.',
    tutorOnly: true,
  },
  {
    key: 'security',
    label: 'Sign-in & security',
    icon: ShieldCheck,
    title: 'Sign-in & security',
    description: 'How you sign in, your password, and closing your account.',
  },
  {
    key: 'notifications',
    label: 'Notifications',
    icon: Bell,
    title: 'Notifications',
    description: 'What you are told about, and how.',
  },
  {
    key: 'appearance',
    label: 'Appearance',
    icon: Palette,
    title: 'Appearance',
    description: 'How EduAUST looks on this device.',
  },
];

export default function SettingsPage({ darkMode, toggleDarkMode }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useCurrentUser();
  const { role, setRole } = useRole();

  const canTutor = user?.isTutor === true || user?.isTutor === 1 || user?.isTutor === '1';
  const tabs = TABS.filter((tab) => !tab.tutorOnly || canTutor);

  // An unknown or unavailable tab in the address falls back to Profile. The
  // address itself is left alone, so a tutor's link to Tutoring still works
  // once their account has loaded.
  const requested = searchParams.get('tab');
  const active = tabs.some((tab) => tab.key === requested) ? requested : 'profile';

  const select = (key, { focus = false } = {}) => {
    setSearchParams(key === 'profile' ? {} : { tab: key }, { replace: true });

    if (focus) document.getElementById(`settings-tab-${key}`)?.focus();
  };

  // Arrow keys move between tabs and open them, as a tab list should.
  const onTabKeyDown = (event) => {
    const index = tabs.findIndex((tab) => tab.key === active);
    let next = null;

    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;

    if (next === null) return;

    event.preventDefault();
    select(tabs[next].key, { focus: true });
  };

  const bgClass = darkMode ? 'bg-[#0b0f19] text-slate-100' : 'bg-slate-50 text-slate-950';
  const mutedClass = darkMode ? 'text-slate-400' : 'text-slate-500';

  const panel = (key) => {
    switch (key) {
      case 'profile':
        return <ProfileSettings darkMode={darkMode} />;
      case 'tutoring':
        return <TutoringSettings darkMode={darkMode} />;
      case 'security':
        return <AccountSettings darkMode={darkMode} />;
      case 'notifications':
        return <NotificationSettings darkMode={darkMode} />;
      case 'appearance':
        return (
          <div className="flex items-center justify-between gap-4">
            <div>
              <p id="appearance-dark-title" className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Dark mode
              </p>
              <p id="appearance-dark-hint" className={`text-xs mt-1 ${mutedClass}`}>
                A darker interface for comfortable viewing at night.
              </p>
            </div>

            <Switch
              checked={darkMode}
              onChange={() => toggleDarkMode()}
              darkMode={darkMode}
              labelledBy="appearance-dark-title"
              describedBy="appearance-dark-hint"
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen w-full font-sans antialiased flex transition-colors duration-300 ${bgClass}`}>
      <TutorSidebar
        darkMode={darkMode}
        activeMenu="Settings"
        currentRole={role}
        setCurrentRole={setRole}
        handleNavigation={(itemName, itemPath) => {
          if (itemPath && itemPath !== '#') navigate(itemPath);
        }}
      />

      {/* Only this column scrolls, so the sidebar stays put. */}
      <main className="flex-grow p-6 lg:p-10 space-y-8 overflow-y-auto max-h-screen">
        <TutorHeader darkMode={darkMode} toggleDarkMode={toggleDarkMode} showSearch={false} />

        <div>
          <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Settings
          </h1>
          <p className={`text-xs sm:text-sm mt-2 ${mutedClass}`}>
            Manage your profile, how you sign in, and what you are notified about.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[230px_minmax(0,1fr)] gap-6 items-start max-w-6xl">
          <div
            role="tablist"
            aria-label="Settings sections"
            aria-orientation="vertical"
            className={`flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible lg:sticky lg:top-0 p-2 rounded-2xl border ${
              darkMode ? 'bg-[#1f2937] border-slate-800' : 'bg-white border-slate-100'
            }`}
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const selected = tab.key === active;

              return (
                <button
                  key={tab.key}
                  id={`settings-tab-${tab.key}`}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls={`settings-panel-${tab.key}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => select(tab.key)}
                  onKeyDown={onTabKeyDown}
                  className={`shrink-0 flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 ${
                    selected
                      ? 'bg-emerald-600 text-white shadow-md'
                      : darkMode
                        ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon size={16} aria-hidden="true" className={selected ? 'text-white' : 'text-slate-400'} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="min-w-0">
            {tabs.map((tab) => (
              <div
                key={tab.key}
                id={`settings-panel-${tab.key}`}
                role="tabpanel"
                aria-labelledby={`settings-tab-${tab.key}`}
                hidden={tab.key !== active}
                tabIndex={0}
                className="focus:outline-none"
              >
                <SettingsSection title={tab.title} description={tab.description} darkMode={darkMode}>
                  {panel(tab.key)}
                </SettingsSection>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
