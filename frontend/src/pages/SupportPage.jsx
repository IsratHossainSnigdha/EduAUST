import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  LifeBuoy,
  Mail,
  MessageSquare,
  Moon,
  Search,
  Send,
  Sun,
  UserCheck,
  Users,
} from 'lucide-react';
import { isAuthenticated } from '../lib/auth';
import TutorSidebar from '../components/Tutor/TutorSidebar';
import './SupportPage.css';

/*
 * Help & Support.
 *
 * The sidebar has linked here since the dashboards were built, at a page that
 * only ever said "coming soon". This is that page: the questions students and
 * tutors actually hit, searchable, plus where to reach a human.
 */
const CATEGORIES = [
  {
    icon: UserCheck,
    title: 'Getting started',
    description: 'Signing up, verifying your AUST email, and completing your profile.',
    tag: 'account',
  },
  {
    icon: Users,
    title: 'Finding a tutor',
    description: 'Browsing tutors, sending a request, and saving tutors for later.',
    tag: 'requests',
  },
  {
    icon: MessageSquare,
    title: 'Messaging',
    description: 'When chat unlocks, and how conversations work.',
    tag: 'messaging',
  },
  {
    icon: BookOpen,
    title: 'Becoming a tutor',
    description: 'Creating a tutor profile and answering requests.',
    tag: 'tutoring',
  },
];

const FAQS = [
  {
    tag: 'account',
    q: 'Which email can I sign up with?',
    a: 'Only an AUST institutional address — the one that ends in @aust.edu. Your student ID and department are read from the address itself, so a name.dept.id@aust.edu address fills those in for you.',
  },
  {
    tag: 'account',
    q: 'I signed up with Google. Can I also set a password?',
    a: 'Yes. Open Settings → Account and add a password. From then on either way signs you in, and you can link or unlink Google whenever you like — as long as one way in always remains.',
  },
  {
    tag: 'requests',
    q: 'How do I ask a tutor for help?',
    a: 'Open Find Tutors, pick someone, and send a tuition request — or send it straight from the chat when you open a tutor who has not accepted you yet. You can also save tutors to a shortlist and ask them later.',
  },
  {
    tag: 'messaging',
    q: 'Why can I not message a tutor yet?',
    a: 'Messaging is earned, not assumed: a chat opens once a tutor accepts your tuition request. Until then the tutor shows as locked in your chat list, with the request form in place of the conversation.',
  },
  {
    tag: 'messaging',
    q: 'How is my chat list ordered?',
    a: 'The tutors you are already working with come first, then the ones still deciding on your request, then everyone else. A tutor sees the students who approached them the same way — accepted first, then waiting.',
  },
  {
    tag: 'tutoring',
    q: 'How do I become a tutor?',
    a: 'Open Become a Tutor from your dashboard and create a tutor profile — your subjects, experience and a short bio. Your account keeps its student side too; you switch between the two dashboards from the sidebar.',
  },
  {
    tag: 'tutoring',
    q: 'When can a student rate me?',
    a: 'A student can leave a rating once you have accepted their request and taught them. Your average and every review show on your dashboard and on your card in the listing.',
  },
  {
    tag: 'requests',
    q: 'Can I change or withdraw a review I left?',
    a: 'Yes. Your reviews live on your student dashboard, where you can edit the rating and comment or remove the review entirely.',
  },
];

export default function SupportPage({ darkMode, toggleDarkMode, currentRole = 'student', setCurrentRole }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [openFaq, setOpenFaq] = useState(null);
  const [activeTag, setActiveTag] = useState(null);

  // Signed-in users get the app sidebar so Support sits inside the product;
  // a signed-out visitor arriving from the landing page gets the standalone
  // top bar instead.
  const signedIn = isAuthenticated();

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();

    return FAQS.filter((faq) => {
      if (activeTag && faq.tag !== activeTag) return false;
      if (!term) return true;

      return faq.q.toLowerCase().includes(term) || faq.a.toLowerCase().includes(term);
    });
  }, [query, activeTag]);

  const containerBg = darkMode ? 'bg-[#0b0f19] text-slate-100' : 'bg-slate-50 text-slate-900';
  const navBg = darkMode ? 'bg-[#0b0f19]/80 border-slate-800' : 'bg-white/80 border-slate-200';
  const cardBg = darkMode ? 'bg-[#1f2937] border-slate-800' : 'bg-white border-slate-200';
  const inputBg = darkMode
    ? 'bg-[#111827] border-slate-700 text-white placeholder-slate-500'
    : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400';
  const muted = darkMode ? 'text-slate-400' : 'text-slate-500';
  const heading = darkMode ? 'text-white' : 'text-slate-900';

  // Where "back" goes depends on whether they are signed in.
  const goBack = () => navigate(isAuthenticated() ? '/dashboard' : '/');

  const content = (
    <>

      {/* Top bar. Signed in, the sidebar carries the logo and navigation, so
          this shrinks to just the theme toggle; signed out, it is the full
          standalone bar with logo and a way back. */}
      <nav className={`support-navbar ${navBg}`}>
        <div className={`${signedIn ? 'px-6' : 'max-w-5xl mx-auto px-6'} py-4 flex items-center justify-between`}>
          {signedIn ? (
            <span className={`text-sm font-black ${heading}`}>Help &amp; Support</span>
          ) : (
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
              <div className="support-logo-badge">E</div>
              <span className="support-logo-text">EduAUST</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleDarkMode}
              aria-label="Toggle theme"
              className={`support-icon-btn ${darkMode ? 'border-slate-700 text-amber-400' : 'border-slate-200 text-slate-600'}`}
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {!signedIn && (
              <button
                type="button"
                onClick={goBack}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition"
              >
                <ArrowLeft size={14} /> Back
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="max-w-5xl mx-auto px-6 pt-12 pb-8 text-center">
        <span className="support-hero-badge">
          <LifeBuoy size={13} /> Help & Support
        </span>

        <h1 className={`text-3xl sm:text-4xl font-black tracking-tight ${heading}`}>
          How can we help?
        </h1>
        <p className={`text-sm mt-3 max-w-xl mx-auto ${muted}`}>
          Search the questions students and tutors ask most, or reach out and we will get back to you.
        </p>

        <div className="relative max-w-xl mx-auto mt-8">
          <Search size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 ${muted}`} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search help articles…"
            className={`support-search-input ${inputBg}`}
          />
        </div>
      </header>

      {/* Category cards */}
      <section className="max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {CATEGORIES.map((category) => {
            const Icon = category.icon;
            const active = activeTag === category.tag;

            return (
              <button
                key={category.title}
                type="button"
                onClick={() => setActiveTag(active ? null : category.tag)}
                className={`support-category-card ${cardBg} ${
                  active ? 'ring-2 ring-emerald-500' : ''
                } hover:-translate-y-0.5 hover:shadow-md`}
              >
                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
                  <Icon size={20} />
                </div>
                <div>
                  <h3 className={`text-sm font-extrabold ${heading}`}>{category.title}</h3>
                  <p className={`text-xs mt-1 ${muted}`}>{category.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* FAQ */}
      <section className="support-faq-section mt-12">
        <div className="max-w-3xl mx-auto px-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-lg font-black ${heading}`}>
              {activeTag ? 'Related questions' : 'Frequently asked'}
            </h2>

            {activeTag && (
              <button
                type="button"
                onClick={() => setActiveTag(null)}
                className="text-xs font-bold text-emerald-500 hover:text-emerald-400"
              >
                Show all
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <p className={`text-xs font-semibold text-center py-8 ${muted}`}>
              No articles match “{query}”. Try a different word, or reach us below.
            </p>
          ) : (
            <div className="space-y-3">
              {filtered.map((faq) => {
                const open = openFaq === faq.q;

                return (
                  <div key={faq.q} className={`support-faq-item ${cardBg}`}>
                    <button
                      type="button"
                      onClick={() => setOpenFaq(open ? null : faq.q)}
                      className="w-full flex items-center justify-between gap-4 p-4 text-left"
                    >
                      <span className={`text-xs sm:text-sm font-bold ${heading}`}>{faq.q}</span>
                      <ChevronDown
                        size={16}
                        className={`shrink-0 transition-transform ${muted} ${open ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {open && (
                      <p className={`px-4 pb-4 text-xs leading-relaxed ${muted}`}>{faq.a}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Contact */}
      <section className="max-w-3xl mx-auto px-6 pb-4">
        <div className={`rounded-2xl border p-6 text-center ${cardBg}`}>
          <Mail size={22} className="mx-auto text-emerald-500 mb-3" />
          <h3 className={`text-sm font-black ${heading}`}>Still need help?</h3>
          <p className={`text-xs mt-2 ${muted}`}>
            Email us and we will get back to you as soon as we can.
          </p>

          <a
            href="mailto:support@eduaust.app?subject=EduAUST%20support"
            className="inline-flex items-center gap-2 mt-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition"
          >
            <Send size={14} /> Contact support
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className={`support-footer ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
        <div className={`max-w-5xl mx-auto px-6 text-center text-xs ${muted}`}>
          EduAUST — peer tutoring for AUST students.
        </div>
      </footer>

    </>
  );

  // Signed in: the app sidebar beside a scrollable content column. Signed out:
  // the standalone page as it was.
  if (signedIn) {
    return (
      <div className={`min-h-screen w-full flex ${containerBg}`}>
        <TutorSidebar
          darkMode={darkMode}
          activeMenu="Help & Support"
          currentRole={currentRole}
          setCurrentRole={setCurrentRole}
          handleNavigation={(itemName, itemPath) => {
            if (itemPath && itemPath !== '#') {
              navigate(itemPath);
            }
          }}
        />

        <main className="flex-grow overflow-y-auto max-h-screen">{content}</main>
      </div>
    );
  }

  return <div className={`support-container ${containerBg}`}>{content}</div>;
}
