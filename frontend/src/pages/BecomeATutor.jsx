import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  UserCheck, 
  Lock, 
  Award, 
  CheckCircle, 
  FileText, 
  ArrowRight, 
  ArrowLeft, 
  Info,
  Moon,
  Sun,
  Globe,
  Share2
} from 'lucide-react';
import './BecomeATutor.css'; // আলাদা করা সিএসএস ফাইলটি ইম্পোর্ট করা হলো

export default function BecomeATutor({ darkMode, toggleDarkMode }) {
  const navigate = useNavigate();
  const [isChecked, setIsChecked] = useState(false);

  const handleProceed = () => {
    if (isChecked) {
      navigate('/signup', { state: { step: 2, role: 'student' } });
    } else {
      alert('Please agree to the terms & conditions before proceeding.');
    }
  };

  return (
    <div className={`become-tutor-container ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* Navbar Section */}
      <header className={`become-tutor-navbar ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`}>
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="become-tutor-logo-badge">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <span className="become-tutor-logo-text">EduAUST</span>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={toggleDarkMode}
            className={`p-2 rounded-full transition ${darkMode ? 'text-yellow-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'}`}
            title="Toggle Theme"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button 
            onClick={() => navigate('/login')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg font-medium text-sm transition shadow-sm"
          >
            Login
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-grow flex justify-center px-4 py-10">
        <div className={`become-tutor-card ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`}>
          
          {/* Header Title */}
          <div className="text-center mb-10">
            <h1 className={`text-3xl md:text-4xl font-extrabold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Become a Tutor</h1>
            <p className={`text-sm md:text-base ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Share your knowledge. Empower your peers. Grow together.</p>
          </div>

          {/* Before You Continue Card */}
          <div className={`border rounded-2xl p-6 md:p-8 mb-8 text-center transition-colors duration-300 ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className={`inline-block p-3 rounded-2xl mb-4 ${darkMode ? 'bg-emerald-950/50 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Before You Continue</h2>
            <p className={`text-sm max-w-lg mx-auto mb-8 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              To maintain a safe and trusted tutoring platform, all tutors must first register as a student on EduAUST.
            </p>

            {/* 4 Feature Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className={`become-tutor-badge-box ${darkMode ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex justify-center mb-2 text-emerald-600 dark:text-emerald-400"><ShieldCheck className="w-6 h-6" /></div>
                <h3 className={`font-bold text-xs mb-1 ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>Verify Students</h3>
                <p className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>We verify every tutor is an AUST student.</p>
              </div>
              <div className={`become-tutor-badge-box ${darkMode ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex justify-center mb-2 text-emerald-600 dark:text-emerald-400"><UserCheck className="w-6 h-6" /></div>
                <h3 className={`font-bold text-xs mb-1 ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>Prevent Fake Accounts</h3>
                <p className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>We prevent fake or anonymous tutor accounts.</p>
              </div>
              <div className={`become-tutor-badge-box ${darkMode ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex justify-center mb-2 text-emerald-600 dark:text-emerald-400"><Lock className="w-6 h-6" /></div>
                <h3 className={`font-bold text-xs mb-1 ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>Secure Communication</h3>
                <p className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>We ensure secure communication between students.</p>
              </div>
              <div className={`become-tutor-badge-box ${darkMode ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex justify-center mb-2 text-emerald-600 dark:text-emerald-400"><Award className="w-6 h-6" /></div>
                <h3 className={`font-bold text-xs mb-1 ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>Quality & Trust</h3>
                <p className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>We maintain the quality and credibility of the platform.</p>
              </div>
            </div>

            {/* Eligibility & Terms Section */}
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 text-left border-t pt-8 ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
              
              {/* Eligibility Requirements */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <UserCheck className="w-5 h-5 text-emerald-600" />
                  <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Eligibility Requirements</h3>
                </div>
                <p className={`text-xs mb-3 font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>You must:</p>
                <ul className={`space-y-2.5 text-xs ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Be an active AUST student.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Create a Student Account before applying as a tutor.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Use your university email during registration.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Provide accurate information during verification.</span>
                  </li>
                </ul>
              </div>

              {/* Terms & Conditions */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Terms & Conditions</h3>
                </div>
                <p className={`text-xs mb-3 font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>By continuing, you agree that:</p>
                <ul className={`space-y-2.5 text-xs ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full shrink-0 mt-1.5"></span>
                    <span>Your information may be verified by the EduAUST administration.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full shrink-0 mt-1.5"></span>
                    <span>False or misleading information may result in rejection or account suspension.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full shrink-0 mt-1.5"></span>
                    <span>You will follow the community guidelines while tutoring.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full shrink-0 mt-1.5"></span>
                    <span>Tutor approval is subject to administrative verification.</span>
                  </li>
                </ul>
              </div>

            </div>

          </div>

          {/* Checkbox Agreement */}
          <div className={`become-tutor-checkbox-box ${darkMode ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <input 
              type="checkbox" 
              id="terms" 
              checked={isChecked}
              onChange={(e) => setIsChecked(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
            />
            <label htmlFor="terms" className={`text-xs cursor-pointer select-none ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              I have read and understood the above requirements, and I agree to the <span className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">Terms & Conditions</span>.
            </label>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button 
              onClick={handleProceed}
              className={`w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 text-white transition shadow-sm ${
                isChecked ? 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer' : 'bg-emerald-400/60 cursor-not-allowed'
              }`}
            >
              <span>Proceed to Student Sign Up</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button 
              onClick={() => navigate('/')}
              className={`w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 border transition ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-750' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          </div>

          {/* Footer Note inside card */}
          <div className={`flex items-center justify-center gap-2 mt-6 text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            <Info className="w-4 h-4" />
            <span>Already have a student account? <span onClick={() => navigate('/login')} className="text-emerald-600 dark:text-emerald-400 font-medium cursor-pointer hover:underline">Log in</span> first, then apply to become a tutor from your dashboard.</span>
          </div>

        </div>
      </main>

      {/* Footer Section */}
      <footer className={`become-tutor-footer ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-emerald-600 text-white p-1.5 rounded-lg">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="font-bold text-emerald-600 text-base">EduAUST</span>
            </div>
            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Connecting students. Building futures.</p>
          </div>

          <div>
            <h4 className={`font-semibold mb-3 text-xs uppercase tracking-wider ${darkMode ? 'text-white' : 'text-slate-900'}`}>Support</h4>
            <ul className={`space-y-2 text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              <li><a href="#" className="hover:text-emerald-600">Help Center</a></li>
              <li><a href="#" className="hover:text-emerald-600">Contact Us</a></li>
              <li><a href="#" className="hover:text-emerald-600">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-emerald-600">Terms of Service</a></li>
            </ul>
          </div>

          <div>
            <h4 className={`font-semibold mb-3 text-xs uppercase tracking-wider ${darkMode ? 'text-white' : 'text-slate-900'}`}>Follow Us</h4>
            <div className="flex gap-3 mb-4">
              <a href="#" className={`p-2 rounded-full border hover:text-emerald-600 shadow-xs transition ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-600'}`}><Globe className="w-4 h-4" /></a>
              <a href="#" className={`p-2 rounded-full border hover:text-emerald-600 shadow-xs transition ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-600'}`}><Share2 className="w-4 h-4" /></a>
            </div>
            <p className={`text-[11px] ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>© 2026 EduAUST. All rights reserved.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}