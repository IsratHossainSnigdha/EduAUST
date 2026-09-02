import React from "react";
import './SettingsPage.css'; // <-- External stylesheet imported here

export default function SettingsPage({ darkMode }) {
  return (
    <div className={`min-h-screen p-8 settings-container ${darkMode ? "bg-slate-900 text-white" : "bg-white text-slate-900"}`}>
      <h1 className="text-3xl font-bold">Settings</h1>
      <p className="mt-2">Settings page coming soon.</p>
    </div>
  );
}