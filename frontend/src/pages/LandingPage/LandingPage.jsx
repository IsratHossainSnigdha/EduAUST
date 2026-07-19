import React, { useState } from 'react'; 
import { useNavigate, Link } from 'react-router-dom';
import { 
  Search, Star, ChevronDown, ChevronUp, 
  GraduationCap, Users, ShieldCheck, Sun, Moon
} from 'lucide-react';

export default function LandingPage({ 
  darkMode, toggleDarkMode, 
  themeClass, cardClass, subTextClass, navClass 
}) {
  const [openFaq, setOpenFaq] = useState(null);
  const navigate = useNavigate();

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <div className={`min-h-screen font-sans antialiased transition-colors duration-300 ${themeClass}`}>
      {/* NAVBAR */}
      <nav className={`sticky top-0 z-50 backdrop-blur-md border-b transition-colors duration-300 ${navClass}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* বাম পাশে লোগো */}
          <Link to="/" className="flex items-center gap-3">
            <div className="bg-emerald-600 text-white w-9 h-9 rounded-xl font-bold text-lg flex items-center justify-center">E</div>
            <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent tracking-tight">EduAUST</span>
          </Link>
          
          {/* ডান পাশের বাটনগুলো */}
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/login')} className="font-semibold hover:text-emerald-600 transition text-sm px-2 py-1">Sign in</button>
            
            <button 
              onClick={toggleDarkMode} 
              className={`p-2 rounded-xl border transition-all duration-300 ${
                darkMode 
                  ? 'bg-slate-900 border-slate-800 text-emerald-400 hover:bg-slate-850 hover:border-emerald-500' 
                  : 'bg-emerald-50/80 border-emerald-100 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            
            <button onClick={() => navigate('/signup')} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-semibold transition text-sm shadow-md shadow-emerald-600/15">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="pt-20 pb-16 text-center">
        <div className="max-w-7xl mx-auto px-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 mb-6 border border-emerald-100">
            <GraduationCap size={14} /> Exclusively for AUST Students
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold max-w-4xl mx-auto leading-tight">
            Find the perfect tutor, <br />
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">right on campus</span>
          </h1>
          <p className={`mt-6 text-lg max-w-2xl mx-auto ${subTextClass}`}>
            EduAUST connects students who need academic support with verified senior tutors from within Ahsanullah University of Science & Technology. Search by course, book a session, and start learning.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <button onClick={() => navigate('/signup')} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-xl font-semibold transition shadow-lg shadow-emerald-600/20">
              Find a Tutor
            </button>
            <button onClick={() => navigate('/signup')} className={`px-8 py-4 rounded-xl font-semibold transition border ${darkMode ? 'border-slate-800 hover:bg-slate-900' : 'border-emerald-200 hover:bg-emerald-50/50 text-emerald-700'}`}>
              Become a Tutor
            </button>
          </div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="py-12 border-y transition-colors duration-300 border-emerald-100/50 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          <div>
            <h3 className="text-4xl font-extrabold text-emerald-600">7,000+</h3>
            <p className={`text-xs font-bold uppercase tracking-wider mt-1 ${subTextClass}`}>Students</p>
            <span className="text-[10px] opacity-70 block">Active Campus</span>
          </div>
          <div>
            <h3 className="text-4xl font-extrabold text-emerald-600">8</h3>
            <p className={`text-xs font-bold uppercase tracking-wider mt-1 ${subTextClass}`}>Departments</p>
            <span className="text-[10px] opacity-70 block">Full coverage</span>
          </div>
          <div>
            <h3 className="text-4xl font-extrabold text-emerald-600">300+</h3>
            <p className={`text-xs font-bold uppercase tracking-wider mt-1 ${subTextClass}`}>Courses</p>
            <span className="text-[10px] opacity-70 block">And counting</span>
          </div>
          <div>
            <h3 className="text-4xl font-extrabold text-emerald-600">100%</h3>
            <p className={`text-xs font-bold uppercase tracking-wider mt-1 ${subTextClass}`}>Verified Tutors</p>
            <span className="text-[10px] opacity-70 block">Verified Tutors</span>
          </div>
        </div>
      </section>

      {/* PROCESS SECTION */}
      <section className="py-20 max-w-7xl mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">PROCESS</span>
          <h2 className="text-3xl font-bold mt-2">How EduAUST works</h2>
          <p className={`mt-4 ${subTextClass}`}>Go from searching to studying together in three simple steps.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <div className={`p-8 rounded-2xl border transition-colors duration-300 ${cardClass}`}>
            <div className="bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 w-12 h-12 rounded-xl flex items-center justify-center font-bold mb-6">1</div>
            <h3 className="text-xl font-bold mb-3">Search for a tutor</h3>
            <p className={subTextClass}>Search by course or subject, view tutor profiles, and filter by department and availability.</p>
          </div>
          <div className={`p-8 rounded-2xl border transition-colors duration-300 ${cardClass}`}>
            <div className="bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 w-12 h-12 rounded-xl flex items-center justify-center font-bold mb-6">2</div>
            <h3 className="text-xl font-bold mb-3">Connect & book</h3>
            <p className={subTextClass}>Message your tutor directly and schedule a session that fits your schedule.</p>
          </div>
          <div className={`p-8 rounded-2xl border transition-colors duration-300 ${cardClass}`}>
            <div className="bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 w-12 h-12 rounded-xl flex items-center justify-center font-bold mb-6">3</div>
            <h3 className="text-xl font-bold mb-3">Learn & grow</h3>
            <p className={subTextClass}>Meet with your tutor, master the material, and boost your grades with peer support.</p>
          </div>
        </div>
      </section>

      {/* BENEFITS SECTION */}
      <section className={`py-20 border-y transition-colors duration-300 ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-emerald-50/20 border-emerald-100'}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-16">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">BENEFITS</span>
            <h2 className="text-3xl font-bold mt-2">Why students choose EduAUST</h2>
            <p className={`text-sm mt-1 ${subTextClass}`}>Everything you need to find real academic support in one place</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className={`p-6 rounded-2xl border flex gap-4 transition-colors duration-300 ${cardClass}`}>
              <ShieldCheck className="text-emerald-600 shrink-0" size={24} />
              <div>
                <h3 className="font-bold text-lg mb-2">Verified tutors</h3>
                <p className={subTextClass}>Every tutor is a real, verified AUST student vetted through the platform, not a stranger from social media.</p>
              </div>
            </div>
            <div className={`p-6 rounded-2xl border flex gap-4 transition-colors duration-300 ${cardClass}`}>
              <Search className="text-emerald-600 shrink-0" size={24} />
              <div>
                <h3 className="font-bold text-lg mb-2">Course-specific search</h3>
                <p className={subTextClass}>Find tutors by exact course or subject and department, so you get help suited to your need.</p>
              </div>
            </div>
            <div className={`p-6 rounded-2xl border flex gap-4 transition-colors duration-300 ${cardClass}`}>
              <Star className="text-emerald-600 shrink-0" size={24} />
              <div>
                <h3 className="font-bold text-lg mb-2">Ratings & reviews</h3>
                <p className={subTextClass}>See ratings and reviews from fellow students before you book a session with a tutor.</p>
              </div>
            </div>
            <div className={`p-6 rounded-2xl border flex gap-4 transition-colors duration-300 ${cardClass}`}>
              <Users className="text-emerald-600 shrink-0" size={24} />
              <div>
                <h3 className="font-bold text-lg mb-2">Direct, on-campus connection</h3>
                <p className={subTextClass}>Message tutors directly and meet up right on campus. No middlemen involved.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS SECTION */}
      <section className="py-20 max-w-7xl mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">TESTIMONIALS</span>
          <h2 className="text-3xl font-bold mt-2">Trusted by AUST students</h2>
          <p className={`mt-4 ${subTextClass}`}>See what students and tutors have to say about their experience with EduAUST</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { quote: '"EduAUST helped me find a senior who\'d already aced Numerical Methods. My grade went from a C to an A in one semester."', name: "Rafid Ahmed", role: "CSE" },
            { quote: '"As a tutor, I finally have a real way to reach juniors who need help instead of relying on word of mouth."', name: "Nusrat Jahan", role: "Peer Tutor" },
            { quote: '"Searching by course code saved me so much time. I found exactly the right tutor in minutes."', name: "Tanvir Islam", role: "Student" },
            { quote: '"Knowing every tutor is verified made me comfortable reaching out. It feels safe and genuinely useful."', name: "Mehjabin Chowdhury", role: "Student" }
          ].map((item, idx) => (
            <div key={idx} className={`p-6 rounded-2xl border flex flex-col justify-between transition-colors duration-300 min-h-[250px] ${cardClass}`}>
              <div className="flex flex-col flex-grow justify-between">
                <p className="italic text-sm min-h-[110px] flex items-center">{item.quote}</p>
                <ul className="flex items-center gap-0.5 mt-2">
                  {[...Array(5)].map((_, i) => (
                    <li key={i}><Star size={16} className="text-amber-500 fill-amber-500" /></li>
                  ))}
                </ul>
              </div>
              <div className="mt-5 pt-2 border-t border-emerald-50/10 dark:border-slate-800">
                <h4 className="font-bold text-sm">{item.name}</h4>
                <span className="text-xs text-emerald-600 font-semibold">{item.role}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className={`py-20 border-t transition-colors duration-300 ${darkMode ? 'bg-slate-900/20 border-slate-800' : 'bg-emerald-50/10 border-emerald-100'}`}>
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">SUPPORT</span>
            <h2 className="text-3xl font-bold mt-2">Frequently asked questions</h2>
          </div>
          <div className="space-y-4">
            {[
              { q: "How do I find a tutor for my course?", a: "Search by course or subject, view tutor profiles, and filter by department and availability." },
              { q: "How do I become a tutor on EduAUST?", a: "Click on 'Become a Tutor', register with your institutional credentials, and submit your verified course achievements." },
              { q: "Is EduAUST only for CSE students?", a: "No, EduAUST provides full peer tutoring coverage across all departments." },
              { q: "How are tutors verified?", a: "Every tutor is a real, verified AUST student vetted through official grade submissions." },
              { q: "Is there a fee for using EduAUST?", a: "Using the platform is completely free. Peer session terms are mutually agreed upon by students." },
              { q: "Is my information kept private?", a: "Yes, your personal profile data is securely maintained and only accessible within the verified campus community." }
            ].map((faq, idx) => (
              <div key={idx} className={`border rounded-xl overflow-hidden transition-all duration-300 ${cardClass}`}>
                <button onClick={() => toggleFaq(idx)} className="w-full p-5 flex justify-between items-center text-left font-semibold">
                  <span>{faq.q}</span>
                  {openFaq === idx ? <ChevronUp size={18} className="text-emerald-600" /> : <ChevronDown size={18} />}
                </button>
                {openFaq === idx && (
                  <div className={`px-5 pb-5 text-sm border-t pt-3 ${darkMode ? 'border-slate-800' : 'border-emerald-100'} ${subTextClass}`}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
<footer
  className={`py-12 border-t transition-colors duration-300 ${
    darkMode
      ? 'bg-slate-950 border-slate-800'
      : 'bg-white border-emerald-100'
  }`}
>
  <div className="max-w-7xl mx-auto px-4 flex flex-col items-center text-center">
    <div className="flex items-center gap-2 mb-4">
      <div className="bg-emerald-600 text-white p-1.5 rounded-lg font-bold text-md">
        E
      </div>
      <span className="font-bold text-lg bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
        EduAUST
      </span>
    </div>

    <p className={`text-sm ${subTextClass}`}>
      Peer-to-peer learning right on campus.
    </p>

    <p className={`mt-6 text-xs ${subTextClass}`}>
      © 2026 EduAUST. All rights reserved.
    </p>
  </div>
</footer>
    </div>
  );
}