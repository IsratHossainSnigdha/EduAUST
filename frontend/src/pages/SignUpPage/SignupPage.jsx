import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Sun, Moon, GraduationCap, Users, ShieldCheck, 
  Mail, UploadCloud, Check, Eye, EyeOff 
} from 'lucide-react';

export default function SignUpPage({ 
  darkMode, toggleDarkMode, themeClass, cardClass, subTextClass, inputBgClass 
}) {
  const navigate = useNavigate();
  const [signUpStep, setSignUpStep] = useState(1);
  const [userRole, setUserRole] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [activeSuccessBtn, setActiveSuccessBtn] = useState('');
  const [semester, setSemester] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const specialRegex = /[@$!%?&#^()_\-+=]/;

  const passwordChecks = {
  length: password.length >= 8,
  uppercase: /[A-Z]/.test(password),
  lowercase: /[a-z]/.test(password),
  number: /\d/.test(password),
  special: specialRegex.test(password),
};

  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return false;
    let nextOtp = [...otp];
    nextOtp[index] = element.value;
    setOtp(nextOtp);

    if (element.nextSibling && element.value) {
      element.nextSibling.focus();
    }
  };

  const textColor = darkMode ? "text-slate-200" : "text-slate-800";
  const labelColor = darkMode ? "text-slate-300" : "text-slate-700";

  const handleAccountInfoSubmit = (e) => {
    e.preventDefault();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@aust\.edu$/;
    if (!emailRegex.test(email.trim())) {
      setEmailError('Please use a valid AUST email address ending with @aust.edu');
      return;
    }
    setEmailError('');
    setSignUpStep(3);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setPasswordError('');
    setConfirmPasswordError('');

    const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%?&#^()_\-+=]).{8,}$/;

    if (!passwordRegex.test(password)) {
      setPasswordError('Password must be at least 8 characters and include uppercase, lowercase, number and special character.');
      return;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match.');
      return;
    }

    setSignUpStep(6);
  };

const passwordLabels = {
  length: "At least 8 characters",
  uppercase: "One uppercase letter",
  lowercase: "One lowercase letter",
  number: "One number",
  special: "One special character",
};

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 py-12 transition-colors duration-300 ${themeClass}`}>
      <div className={`w-full max-w-lg p-10 rounded-3xl border shadow-xl relative transition-all duration-300 ${cardClass}`}>
        
        {signUpStep > 1 && signUpStep < 6 && (
          <button 
            onClick={() => setSignUpStep(signUpStep - 1)} 
            className="absolute top-8 left-8 p-2 rounded-xl border transition hover:bg-emerald-50 dark:hover:bg-slate-800 border-emerald-100 dark:border-slate-700 text-emerald-600"
          >
            <ArrowLeft size={16} />
          </button>
        )}

        <button 
          onClick={toggleDarkMode} 
          className="absolute top-8 right-8 p-2 rounded-xl border transition hover:bg-emerald-50 dark:hover:bg-slate-800 border-emerald-100 dark:border-slate-700"
        >
          {darkMode ? <Sun size={16} className="text-emerald-400" /> : <Moon size={16} className="text-emerald-700" />}
        </button>

        {signUpStep === 1 && (
          <div className="text-center pt-4">
            <div className="bg-emerald-600 text-white w-12 h-12 rounded-2xl font-bold text-xl flex items-center justify-center mx-auto mb-4">E</div>
            <h2 className={`text-2xl font-black tracking-tight ${textColor}`}>Welcome to EduAUST</h2>
            <p className={`text-sm mt-1 mb-8 ${subTextClass}`}>Select how you want to join our verified platform</p>
            
            <div className="space-y-4">
              <button 
                onClick={() => { setUserRole('student'); setSignUpStep(2); }} 
                className={`w-full p-5 border rounded-2xl flex items-center gap-4 text-left transition duration-300 group hover:border-emerald-500 ${darkMode ? 'border-slate-700 bg-slate-900/50' : 'border-slate-200 bg-white'}`}
              >
                <div className="bg-emerald-100 dark:bg-emerald-950 p-3 rounded-xl text-emerald-600 group-hover:scale-105 transition duration-300">
                  <GraduationCap size={24} />
                </div>
                <div>
                  <h4 className={`font-bold text-base ${textColor}`}>Join as a Student</h4>
                  <p className={`text-xs mt-0.5 ${subTextClass}`}>Find senior tutors and clear your academic doubts.</p>
                </div>
              </button>

              <button 
                onClick={() => { setUserRole('tutor'); setSignUpStep(2); }} 
                className={`w-full p-5 border rounded-2xl flex items-center gap-4 text-left transition duration-300 group hover:border-emerald-500 ${darkMode ? 'border-slate-700 bg-slate-900/50' : 'border-slate-200 bg-white'}`}
              >
                <div className="bg-emerald-100 dark:bg-emerald-950 p-3 rounded-xl text-emerald-600 group-hover:scale-105 transition duration-300">
                  <Users size={24} />
                </div>
                <div>
                  <h4 className={`font-bold text-base ${textColor}`}>Join as a Peer Tutor</h4>
                  <p className={`text-xs mt-0.5 ${subTextClass}`}>Share your knowledge with juniors and earn on campus.</p>
                </div>
              </button>
            </div>
            
            <p className="text-xs text-emerald-600 font-medium mt-8 flex items-center justify-center gap-1.5">
              <ShieldCheck size={14} /> Only for verified AUST students
            </p>
          </div>
        )}

        {signUpStep === 2 && (
          <div className="pt-4">
            <div className="text-center mb-8">
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/50 px-3 py-1.5 rounded-full uppercase tracking-wider">Step 1 of 4</span>
              <h3 className={`text-3xl font-black mt-4 tracking-tight ${textColor}`}>Account Information</h3>
              <p className={`text-xs mt-2 ${subTextClass}`}>Please use your authentic campus academic details</p>
            </div>
            
            <form onSubmit={handleAccountInfoSubmit} className="space-y-5">
              <div>
                <label className={`block text-xs font-extrabold mb-2 uppercase tracking-wider ${labelColor}`}>Full Name</label>
                <input type="text" placeholder="Ishrat Jahan Ifa" className={`w-full px-5 py-3.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition duration-200 ${inputBgClass} ${textColor}`} required />
              </div>
              <div>
                <label className={`block text-xs font-extrabold mb-2 uppercase tracking-wider ${labelColor}`}>AUST Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                  placeholder="ishrat.cse.20230204017@aust.edu"
                  className={`w-full px-5 py-3.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition duration-200 ${emailError ? 'border-red-500 focus:ring-red-500/20' : 'focus:border-emerald-500'} ${inputBgClass} ${textColor}`}
                  required
                />
                {emailError && <p className="mt-2 text-xs text-red-500 font-medium">{emailError}</p>}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-extrabold mb-2 uppercase tracking-wider ${labelColor}`}>Student ID</label>
                  <input 
                    type="text" 
                    placeholder="20230204017" 
                    onInput={(e) => e.target.value = e.target.value.replace(/[^0-9]/g, '')}
                    className={`w-full px-5 py-3.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition duration-200 ${inputBgClass} ${textColor}`} 
                    required 
                  />
                </div>
                <div>
                  <label className={`block text-xs font-extrabold mb-2 uppercase tracking-wider ${labelColor}`}>Department</label>
                  <select className={`w-full px-5 py-3.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition duration-200 ${inputBgClass} ${textColor}`}>
                    <option>CSE</option><option>EEE</option><option>CE</option><option>ME</option><option>TE</option><option>IPE</option><option>Arch</option><option>Business</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-extrabold mb-2 uppercase tracking-wider ${labelColor}`}>Semester</label>
                  <select value={semester} onChange={(e) => setSemester(e.target.value)} className={`w-full px-5 py-3.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition duration-200 ${inputBgClass} ${textColor}`} required>
                    <option value="" disabled>Select Semester</option>
                    <option value="1.1">1.1</option><option value="1.2">1.2</option><option value="2.1">2.1</option><option value="2.2">2.2</option><option value="3.1">3.1</option><option value="3.2">3.2</option><option value="4.1">4.1</option><option value="4.2">4.2</option><option value="5.1">5.1</option><option value="5.2">5.2</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-xs font-extrabold mb-2 uppercase tracking-wider ${labelColor}`}>Phone Number</label>
                  <input 
                    type="tel" 
                    placeholder="01XXXXXXXXX" 
                    maxLength="11"
                    onInput={(e) => {
                        e.target.value = e.target.value.replace(/[^0-9]/g, '');
                        if (e.target.value.length >= 2 && !e.target.value.startsWith('01')) {
                            e.target.value = '01';
                        }
                    }}
                    className={`w-full px-5 py-3.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition duration-200 ${inputBgClass} ${textColor}`} 
                    required 
                  />
                </div>
              </div>
              <button type="submit" className="w-full mt-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all duration-200 shadow-md shadow-emerald-600/10 text-base">Continue</button>
            </form>
          </div>
        )}

        {signUpStep === 3 && (
          <div className="text-center pt-4">
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/50 px-3 py-1.5 rounded-full uppercase tracking-wider">Step 2 of 4</span>
            <div className="bg-emerald-50 dark:bg-emerald-950 text-emerald-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mt-6 mb-4">
              <Mail size={32} />
            </div>
            <h3 className={`text-2xl font-black tracking-tight ${textColor}`}>Verify your email</h3>
            <p className={`text-sm mt-1 px-4 ${subTextClass}`}>We have sent a 6-digit code to your institutional email account</p>
            
            <div className="flex justify-center gap-2 my-8">
              {otp.map((data, index) => (
                <input 
                  key={index} type="text" maxLength="1" value={data} 
                  onChange={(e) => handleOtpChange(e.target, index)} 
                  className={`w-12 h-14 border text-center font-bold text-xl rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${inputBgClass} ${textColor}`} 
                />
              ))}
            </div>
            
            <button onClick={() => setSignUpStep(4)} className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition shadow-md shadow-emerald-600/10 text-base">Verify & Proceed</button>
            <p className="text-xs mt-4">Didn't receive code? <button className="text-emerald-600 font-semibold hover:underline">Resend Code</button></p>
          </div>
        )}

        {signUpStep === 4 && (
          <div className="text-center pt-4">
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/50 px-3 py-1.5 rounded-full uppercase tracking-wider">Step 3 of 4</span>
            <h3 className={`text-2xl font-black mt-4 tracking-tight ${textColor}`}>Verify Student Identity</h3>
            <p className={`text-sm mt-1 ${subTextClass}`}>Upload your valid AUST student ID card to ensure platform safety</p>
            
            <div className={`border-2 border-dashed rounded-2xl p-10 my-6 flex flex-col items-center justify-center transition cursor-pointer ${darkMode ? 'border-slate-700 bg-slate-900/20 hover:bg-slate-900/50' : 'border-emerald-200 bg-emerald-50/10 hover:bg-emerald-50/30'}`}>
              <UploadCloud size={44} className="text-emerald-600 mb-3 animate-pulse" />
              <span className={`font-bold text-sm mb-1 ${textColor}`}>Drag and drop files here</span>
              <span className={`text-xs ${subTextClass}`}>Supports JPG, PNG or PDF up to 5MB</span>
            </div>
            
            <button onClick={() => setSignUpStep(5)} className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition shadow-md shadow-emerald-600/10 text-base">Continue</button>
          </div>
        )}

        {signUpStep === 5 && (
          <div className="pt-4">
            <div className="text-center mb-8">
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/50 px-3 py-1.5 rounded-full uppercase tracking-wider">Step 4 of 4</span>
              <h3 className={`text-3xl font-black mt-4 tracking-tight ${textColor}`}>Secure Your Account</h3>
              <p className={`text-xs mt-2 ${subTextClass}`}>Create a strong password to safeguard your portal</p>
            </div>
            
            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              <div>
                <label className={`block text-xs font-extrabold mb-2 uppercase tracking-wider ${labelColor}`}>Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                  onChange={(e) => {
  const value = e.target.value;

  setPassword(value);
  setPasswordError("");

  if (confirmPassword && value !== confirmPassword) {
    setConfirmPasswordError("Passwords do not match.");
  } else {
    setConfirmPasswordError("");
  }
}}
                    placeholder="••••••••"
                    className={`w-full px-5 py-3.5 pr-12 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition duration-200 ${passwordError ? 'border-red-500' : ''} ${inputBgClass} ${textColor}`}
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 transition duration-150">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {passwordError && <p className="mt-2 text-xs text-red-500 font-medium">{passwordError}</p>}
              </div>
              
              <div>
                <label className={`block text-xs font-extrabold mb-2 uppercase tracking-wider ${labelColor}`}>Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
  setConfirmPassword(e.target.value);

  if (password !== e.target.value) {
    setConfirmPasswordError("Passwords do not match.");
  } else {
    setConfirmPasswordError("");
  }
}}
                    placeholder="••••••••"
                    className={`w-full px-5 py-3.5 pr-12 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition duration-200 ${confirmPasswordError ? 'border-red-500' : ''} ${inputBgClass} ${textColor}`}
                    required
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 transition duration-150">
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {confirmPasswordError && <p className="mt-2 text-xs text-red-500 font-medium">{confirmPasswordError}</p>}
              </div>

              <div className="bg-emerald-50/60 dark:bg-emerald-950/30 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/50">
                 <h4 className="font-bold text-emerald-700 dark:text-emerald-400 mb-3">Password Requirements</h4>
                 <div className="space-y-2 text-sm">
                    {Object.entries(passwordChecks).map(([key, valid]) => (
                       <div key={key} className={`flex items-center gap-2 ${valid ? "text-green-600" : "text-slate-500 dark:text-slate-400"}`}>
                          {valid ? <Check size={16}/> : <div className="w-4 h-4 rounded-full border"/>}
                          <span>{passwordLabels[key]}</span>
                       </div>
                    ))}
                 </div>
              </div>

              <div className="flex items-start gap-3 px-1 pt-1">
                <input type="checkbox" id="terms" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} className="w-4 h-4 mt-0.5 accent-emerald-600 cursor-pointer rounded border-slate-300" required />
                <label htmlFor="terms" className="text-xs text-slate-500 dark:text-slate-400 cursor-pointer">I agree to the Terms of Service and Privacy Policy</label>
              </div>

              <button type="submit" disabled={!agreeTerms} className={`w-full mt-6 py-4 text-white font-bold rounded-xl transition-all duration-200 text-base ${agreeTerms ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-300 cursor-not-allowed'}`}>Create Account</button>
            </form>
          </div>
        )}

        {signUpStep === 6 && (
          <div className="text-center pt-6 pb-2">
            <div className="bg-emerald-600 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <Check size={32} strokeWidth={3} />
            </div>
            <h3 className={`text-3xl font-black tracking-tight ${textColor}`}>Welcome aboard!</h3>
            <p className={`text-sm mt-2 px-6 ${subTextClass}`}>Your account has been verified successfully.</p>
            
            <div className="mt-8 space-y-3">
              <button 
                onClick={() => { setActiveSuccessBtn('tutors'); navigate('/tutors'); }} 
                className={`w-full py-4 font-bold rounded-xl transition duration-200 border ${
                  activeSuccessBtn === 'tutors' 
                    ? 'bg-emerald-600 text-white border-emerald-600' 
                    : 'border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950'
                }`}
              >
                Explore Tutors
              </button>
              <button 
                onClick={() => { setActiveSuccessBtn('dashboard'); navigate('/dashboard'); }} 
                className={`w-full py-4 font-bold rounded-xl transition duration-200 border ${
                  activeSuccessBtn === 'dashboard' 
                    ? 'bg-emerald-600 text-white border-emerald-600' 
                    : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                }`}
              >
                Go to Student Dashboard
              </button>
            </div>
          </div>
        )}

        {signUpStep < 6 && (
          <div className="mt-8 text-center text-sm border-t pt-5 border-emerald-100/30 dark:border-slate-700">
            <span className={subTextClass}>Already have an account? </span>
            <button onClick={() => navigate('/')} className="text-emerald-600 font-bold hover:underline">Back to Home</button>
          </div>
        )}
      </div>
    </div>
  );
} 