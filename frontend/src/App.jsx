import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage/LandingPage";
import LoginPage from "./pages/LoginPage/LoginPage";
import SignUpPage from "./pages/SignUpPage/SignUpPage";
import StudentDashboard from "./pages/StudentDashboard/StudentDashboard";
import TutorDashboard from "./pages/TutorDashboard/TutorDashboard"; // ইমপোর্ট করা হয়েছে

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const toggleDarkMode = () => setDarkMode(!darkMode);

  const themeClass = darkMode ? 'bg-slate-950 text-slate-100' : 'bg-white text-slate-900';
  const navClass = darkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-emerald-100';
  const cardClass = darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-emerald-100';
  const subTextClass = darkMode ? 'text-slate-400' : 'text-slate-500';

  const sharedProps = { darkMode, toggleDarkMode, themeClass, navClass, cardClass, subTextClass };

  return (
    <div className={darkMode ? 'dark' : ''}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage {...sharedProps} />} />
          <Route path="/login" element={<LoginPage {...sharedProps} />} />
          <Route path="/signup" element={<SignUpPage {...sharedProps} />} />
          <Route path="/dashboard" element={<StudentDashboard {...sharedProps} />} />
          <Route path="/tutor-dashboard" element={<TutorDashboard {...sharedProps} />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}