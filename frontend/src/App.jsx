import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage/LandingPage";
import LoginPage from "./pages/LoginPage/LoginPage";
import SignUpPage from "./pages/SignUpPage/SignupPage";
import StudentDashboard from "./pages/StudentDashboard/StudentDashboard";
import TutorDashboard from "./pages/TutorDashboard/TutorDashboard";
import TuitionRequests from "./pages/TutorDashboard/TuitionRequests";
import BecomeATutor from "./pages/BecomeATutor";
import MessagesPage from "./pages/TutorDashboard/MessagesPage";

export default function App() {
  // লোকাল স্টোরেজ থেকে ডার্ক মোডের স্টেট রিড করা, না থাকলে ডিফল্ট false
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('eduAust_darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  // darkMode পরিবর্তন হলে সেটি localStorage-এ সেভ করে রাখা
  useEffect(() => {
    localStorage.setItem('eduAust_darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

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
    <div className={darkMode ? 'dark min-h-screen' : 'min-h-screen'}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage {...sharedProps} />} />
          <Route path="/login" element={<LoginPage {...sharedProps} />} />
          <Route path="/signup" element={<SignUpPage {...sharedProps} />} />
          <Route path="/dashboard" element={<StudentDashboard {...sharedProps} />} />
          <Route path="/tutor-dashboard" element={<TutorDashboard {...sharedProps} />} />
          <Route path="/tutor-requests" element={<TuitionRequests {...sharedProps} />} />
          <Route path="/become-a-tutor" element={<BecomeATutor {...sharedProps} />} />
          <Route path="/messages" element={<MessagesPage {...sharedProps} />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}