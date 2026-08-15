import React from "react";

export default function SupportPage({ darkMode }) {
  return (
    <div className={darkMode ? "min-h-screen bg-slate-900 text-white p-8" : "min-h-screen bg-white text-slate-900 p-8"}>
      <h1 className="text-3xl font-bold">Help & Support</h1>
      <p className="mt-2">Support page coming soon.</p>
    </div>
  );
}