import React from 'react';
import { useNavigate } from 'react-router-dom';

import SettingsSection from '../../components/Settings/SettingsSection';
import ProfileSettings from '../../components/Settings/ProfileSettings';
import AccountSettings from '../../components/Settings/AccountSettings';
import NotificationSettings from '../../components/Settings/NotificationSettings';
import PrivacySettings from '../../components/Settings/PrivacySettings';
import TutorSettings from '../../components/Settings/TutorSettings';
import StudentSettings from '../../components/Settings/StudentSettings';
import TutorSidebar from '../../components/Tutor/TutorSidebar';
import './SettingsPage.css';

export default function SettingsPage({
  darkMode,
  toggleDarkMode,
  currentRole = 'student',
  setCurrentRole,
}) {
  const navigate = useNavigate();

  const isTutor = currentRole === 'tutor';

  const bgClass = darkMode
    ? 'bg-[#0b0f19] text-slate-100'
    : 'bg-slate-50 text-slate-950';

  return (
    <div className={`settings-container antialiased ${bgClass}`}>
      <TutorSidebar
        darkMode={darkMode}
        activeMenu="Settings"
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        handleNavigation={(itemName, itemPath) => {
          if (itemPath && itemPath !== '#') {
            navigate(itemPath);
          }
        }}
      />

      <main className="settings-main">
        <div className="settings-content-wrapper space-y-8">
          {/* Page header */}
          <div>
            <h1
              className={`text-2xl sm:text-3xl font-black ${
                darkMode ? 'text-white' : 'text-slate-900'
              }`}
            >
              Settings
            </h1>

            <p
              className={`text-xs sm:text-sm mt-2 ${
                darkMode ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Manage your account, preferences, and privacy settings.
            </p>
          </div>

          {/* Profile */}
          <SettingsSection
            title="Profile"
            description="Manage your basic profile information."
            darkMode={darkMode}
          >
            <ProfileSettings darkMode={darkMode} role={currentRole} />
          </SettingsSection>

          {/* Account */}
          <SettingsSection
            title="Account"
            description="Manage your account and security."
            darkMode={darkMode}
          >
            <AccountSettings darkMode={darkMode} />
          </SettingsSection>

          {/* Notifications */}
          <SettingsSection
            title="Notifications"
            description="Choose what notifications you receive."
            darkMode={darkMode}
          >
            <NotificationSettings darkMode={darkMode} />
          </SettingsSection>

          {/* Privacy */}
          <SettingsSection
            title="Privacy"
            description="Control how other users interact with your profile."
            darkMode={darkMode}
          >
            <PrivacySettings darkMode={darkMode} />
          </SettingsSection>

          {/* Role-specific */}
          {isTutor ? (
            <SettingsSection
              title="Tutoring Preferences"
              description="Manage your tutoring-related preferences."
              darkMode={darkMode}
            >
              <TutorSettings darkMode={darkMode} />
            </SettingsSection>
          ) : (
            <SettingsSection
              title="Learning Preferences"
              description="Manage your learning and tutor preferences."
              darkMode={darkMode}
            >
              <StudentSettings darkMode={darkMode} />
            </SettingsSection>
          )}

          {/* Appearance */}
          <SettingsSection
            title="Appearance"
            description="Customize how EduAUST looks."
            darkMode={darkMode}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3
                  className={`text-xs font-bold ${
                    darkMode ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  Dark Mode
                </h3>

                <p
                  className={`text-[11px] mt-1 ${
                    darkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  Use a darker interface for comfortable viewing.
                </p>
              </div>

              <button
                type="button"
                onClick={toggleDarkMode}
                className={`w-11 h-6 rounded-full p-1 transition ${
                  darkMode ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full transition-transform ${
                    darkMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </SettingsSection>

          {/* Danger Zone */}
          <SettingsSection
            title="Danger Zone"
            description="Actions that affect your account."
            darkMode={darkMode}
          >
            <div
              className={`p-4 rounded-xl border ${
                darkMode
                  ? 'border-rose-500/30 bg-rose-500/5'
                  : 'border-rose-200 bg-rose-50'
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xs font-black text-rose-500">
                    Delete Account
                  </h3>

                  <p
                    className={`text-[11px] mt-1 ${
                      darkMode ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    Permanently remove your EduAUST account and associated data.
                  </p>
                </div>

                <button
                  type="button"
                  className="px-4 py-2 rounded-xl border border-rose-500 text-rose-500 hover:bg-rose-500 hover:text-white text-xs font-bold transition shrink-0"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </SettingsSection>
        </div>
      </main>
    </div>
  );
}