import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage/LandingPage";
import LoginPage from "./pages/LoginPage/LoginPage";
import SignUpPage from "./pages/SignUpPage/SignUpPage";
import StudentDashboard from "./pages/StudentDashboard/StudentDashboard";
import TutorDashboard from "./pages/TutorDashboard/TutorDashboard";
import BecomeATutor from "./pages/BecomeATutor";

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const toggleDarkMode = () => setDarkMode(prev => !prev);

  const sharedProps = {
    darkMode,
    toggleDarkMode,
    themeClass: darkMode ? 'bg-slate-950 text-slate-100' : 'bg-white text-slate-900',
    navClass: darkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-emerald-100',
    cardClass: darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-emerald-100',
    subTextClass: darkMode ? 'text-slate-400' : 'text-slate-700'
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage {...sharedProps} />} />
          <Route path="/login" element={<LoginPage {...sharedProps} />} />
          <Route path="/signup" element={<SignUpPage {...sharedProps} />} />
          <Route path="/dashboard" element={<StudentDashboard {...sharedProps} />} />
          <Route path="/tutor-dashboard" element={<TutorDashboard {...sharedProps} />} />
          <Route path="/become-a-tutor" element={<BecomeATutor {...sharedProps} />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}