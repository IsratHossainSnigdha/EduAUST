import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage/LandingPage";
import LoginPage from "./pages/LoginPage/LoginPage";
import SignUpPage from "./pages/SignUpPage/SignUpPage";

export default function App() {
  // এখানে স্টেটগুলো ম্যানেজ করুন
  const [darkMode, setDarkMode] = useState(false);
  const toggleDarkMode = () => setDarkMode(!darkMode);

  // থিম ক্লাসের লজিক
  const themeClass = darkMode ? 'bg-slate-950 text-slate-100' : 'bg-white text-slate-900';
  const navClass = darkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-emerald-100';
  const cardClass = darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-emerald-100';
  const subTextClass = darkMode ? 'text-slate-400' : 'text-slate-500';

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <LandingPage 
            darkMode={darkMode} 
            toggleDarkMode={toggleDarkMode} 
            themeClass={themeClass}
            navClass={navClass}
            cardClass={cardClass}
            subTextClass={subTextClass}
          />
        } />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
      </Routes>
    </BrowserRouter>
  );
}