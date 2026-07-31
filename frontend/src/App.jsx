import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage/LandingPage";
import LoginPage from "./pages/LoginPage/LoginPage";
import SignUpPage from "./pages/SignUpPage/SignupPage";
import StudentDashboard from "./pages/StudentDashboard/StudentDashboard";
import FindTutorsPage from "./pages/StudentDashboard/FindTutorsPage";
import TutorDashboard from "./pages/TutorDashboard/TutorDashboard";
import TuitionRequests from "./pages/TutorDashboard/TuitionRequests";
import BecomeATutor from "./pages/BecomeATutor";
import MessagesPage from "./pages/TutorDashboard/MessagesPage";
import NotificationsPage from "./pages/NotificationsPage"; 

export default function App() {
  
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('eduAust_darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  
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
          <Route path="/find-tutors" element={<FindTutorsPage {...sharedProps} />} />
          <Route path="/tutor-dashboard" element={<TutorDashboard {...sharedProps} />} />
          <Route path="/tutor-requests" element={<TuitionRequests {...sharedProps} />} />
          <Route path="/become-a-tutor" element={<BecomeATutor {...sharedProps} />} />
          <Route path="/messages" element={<MessagesPage {...sharedProps} />} />
          <Route path="/notifications" element={<NotificationsPage {...sharedProps} />} /> 
        </Routes>
      </BrowserRouter>
    </div>
  );
}