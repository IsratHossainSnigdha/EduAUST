import React from "react";

export default function SettingsPage({ darkMode }) {
  return (
    <div className={darkMode ? "min-h-screen bg-slate-900 text-white p-8" : "min-h-screen bg-white text-slate-900 p-8"}>
      <h1 className="text-3xl font-bold">Settings</h1>
      <p className="mt-2">Settings page coming soon.</p>
    </div>
  );
}