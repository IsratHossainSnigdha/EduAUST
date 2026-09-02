import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  Bell,
  Settings,
  HelpCircle,
  LogOut,
  ChevronDown,
  Search,
  Sun,
  Moon,
  Filter,
  Star,
  BookOpen,
  MapPin,
  Users,
  Award,
  RotateCcw,
  Check,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { apiGet, clearAuth } from '../../lib/auth';
import './FindTutorsPage.css';

// Filter panel defaults; '' means "no filter applied".
const EMPTY_FILTERS = {
  subject_id: '',
  department_id: '',
  language: '',
  min_experience: '',
  min_students: '',
};

const SORT_OPTIONS = [
  { value: 'students', label: 'Most students' },
  { value: 'experience', label: 'Most experienced' },
  { value: 'rate_asc', label: 'Lowest rate' },
  { value: 'rate_desc', label: 'Highest rate' },
  { value: 'newest', label: 'Newest' },
];

const PER_PAGE = 6;
const SEARCH_DEBOUNCE_MS = 300;

export default function FindTutorsPage({ darkMode, toggleDarkMode }) {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState('Find Tutors');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentRole, setCurrentRole] = useState('student');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter panel state. `applied` is what the API is actually queried with, so
  // editing a dropdown does not refetch until Apply Filters is pressed.
  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const [applied, setApplied] = useState(EMPTY_FILTERS);
  const [sort, setSort] = useState('students');

  // Options for the dropdowns, and the listing itself.
  const [options, setOptions] = useState({ subjects: [], departments: [], languages: [] });
  const [tutors, setTutors] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load the dropdown options once.
  useEffect(() => {
    let cancelled = false;

    apiGet('/tutors/filters').then(({ ok, body }) => {
      if (!cancelled && ok) {
        setOptions({
          subjects: body.subjects ?? [],
          departments: body.departments ?? [],
          languages: body.languages ?? [],
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // Refetch whenever the applied filters, sort, page or search term change.
  // The search term is debounced so typing does not fire a request per key.
  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(async () => {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({ sort, page: currentPage, per_page: PER_PAGE });
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      Object.entries(applied).forEach(([key, value]) => {
        if (value !== '') params.set(key, value);
      });

      const { ok, body } = await apiGet(`/tutors?${params}`);
      if (cancelled) return;

      if (!ok) {
        setTutors([]);
        setLoading(false);

        // An expired or missing token is the common case here: access tokens
        // only live an hour. Send the user to sign in rather than leaving them
        // staring at an empty list.
        if (body?.message === 'Unauthenticated.') {
          clearAuth();
          navigate('/login');
          return;
        }

        setError(body?.message || 'Could not load tutors.');
        return;
      }

      setTutors(body.data ?? []);
      setMeta(body.meta ?? { current_page: 1, last_page: 1, total: 0 });
      setLoading(false);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, applied, sort, currentPage, navigate]);

  // Changing what is being searched or filtered invalidates the current page.
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, applied, sort]);

  const bgClass = darkMode ? 'bg-[#12161f] text-slate-100' : 'bg-[#f1f3f6] text-slate-900';
  const sidebarBg = darkMode ? 'bg-[#1a202c] border-slate-700/60' : 'bg-white border-slate-200 shadow-sm';
  const cardBg = darkMode ? 'bg-[#1e2533] border-slate-700/60' : 'bg-white border-slate-200 shadow-sm';
  const textPrimary = darkMode ? 'text-white font-extrabold' : 'text-slate-900 font-extrabold';
  const textSecondary = darkMode ? 'text-slate-300 font-medium' : 'text-slate-700 font-medium';

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Find Tutors', icon: Search, path: '/find-tutors' },
    { name: 'Messages', icon: MessageSquare, badge: 2, path: '/messages' },
    { name: 'Notifications', icon: Bell, badge: 3, path: '/notifications' },
    { name: 'Settings', icon: Settings, path: '/settings' },
    { name: 'Help & Support', icon: HelpCircle, path: '/support' },
  ];

  const handleResetFilters = () => {
    setSearchQuery('');
    setDraft(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
    setSort('students');
  };

  const setDraftField = (field, value) => setDraft((prev) => ({ ...prev, [field]: value }));

  // Selects share the same look; kept here so the panel stays readable.
  const selectClass = `find-tutors-select ${
    darkMode ? 'bg-[#12161f] border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'
  }`;

  return (
    <div className={`find-tutors-container font-sans antialiased transition-colors duration-300 ${bgClass}`}>
      
      <aside className={`find-tutors-sidebar ${sidebarBg}`}>
        <div>
          
          <div className="flex items-center gap-3 cursor-pointer mb-8" onClick={() => navigate('/')}>
            <div className="bg-emerald-600 text-white w-9 h-9 rounded-xl font-black text-lg flex items-center justify-center shadow-md shadow-emerald-500/20">E</div>
            <span className="text-xl font-black bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">EduAUST</span>
          </div>

          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    setActiveMenu(item.name);
                    navigate(item.path);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold tracking-wide transition-all ${
                    isActive 
                      ? 'bg-emerald-600 text-white shadow-md' 
                      : darkMode 
                        ? 'text-slate-300 hover:text-white hover:bg-slate-800' 
                        : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} className={isActive ? 'text-white' : darkMode ? 'text-slate-400' : 'text-slate-500 hover:text-slate-950'} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${
                      isActive ? 'bg-white text-emerald-600' : 'bg-emerald-600 text-white'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
        
        <div className={`pt-6 border-t ${darkMode ? 'border-slate-700/60' : 'border-slate-200'} space-y-4`}>
          <div className="flex items-center gap-3">
            <img
              src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120"
              alt="User"
              className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500/30"
            />
            <div>
              <h4 className={`text-xs ${textPrimary}`}>Ishrat Jahan Ifa</h4>
              <p className={`text-[10px] ${darkMode ? 'text-slate-400 font-semibold' : 'text-slate-500 font-semibold'}`}>Student.CSE 3.1</p>
            </div>
          </div>
          
          <button
            onClick={() => {
              if (currentRole === 'student') {
                setCurrentRole('tutor');
                navigate('/tutor-dashboard');
              } else {
                setCurrentRole('student');
                navigate('/dashboard');
              }
            }}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-2 text-xs font-bold transition shadow-sm"
          >
            {currentRole === 'student' ? 'Switch to Tutor Dashboard' : 'Switch to Student Dashboard'}
          </button>

          <button
            onClick={() => navigate('/login')}
            className="w-full border border-rose-500 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl py-2 text-xs font-bold transition flex items-center justify-center gap-2"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </aside>

      <main className="find-tutors-main space-y-8">
        
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className={`text-2xl sm:text-3xl font-black tracking-tight ${textPrimary}`}>Find Expert Tutors</h2>
            <p className={`text-xs sm:text-sm ${textSecondary}`}>Browse verified AUST tutors and book your session today.</p>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={toggleDarkMode} className={`p-2.5 rounded-xl border transition-all ${darkMode ? 'border-slate-700 bg-[#1e2533] text-white' : 'border-slate-300 bg-white text-slate-700 shadow-sm'}`}>
              {darkMode ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
            </button>
            <button
              onClick={() => navigate('/notifications')}
              className={`p-2.5 rounded-xl border relative cursor-pointer transition ${darkMode ? 'border-slate-700 bg-[#1e2533] text-white hover:bg-slate-800' : 'border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-100'}`}
            >
              <Bell size={16} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
            </button>
            <div className={`flex items-center gap-3 pl-3 border-l ${darkMode ? 'border-slate-700' : 'border-slate-300'}`}>
              <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120" alt="Profile" className="w-9 h-9 rounded-full object-cover ring-2 ring-emerald-500/20" />
              <div className="hidden sm:block">
                <h5 className={`text-xs ${textPrimary}`}>Ishrat Jahan Ifa</h5>
                <p className={`text-[10px] ${darkMode ? 'text-slate-400 font-semibold' : 'text-slate-500 font-semibold'}`}>Student.CSE 3.1</p>
              </div>
            </div>
          </div>
        </header>

        <div className={`find-tutors-card flex flex-col md:flex-row items-center justify-between gap-4 ${cardBg}`}>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border w-full md:w-96 ${darkMode ? 'bg-[#12161f] border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}>
            <Search size={16} className="text-slate-400 shrink-0" />
            <input 
              type="text" 
              placeholder="Search by name or subject..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-xs w-full text-slate-900 dark:text-white placeholder-slate-400 font-medium"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          <div className={`find-tutors-card space-y-6 h-fit ${cardBg}`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-emerald-500" />
                <h3 className={`text-xs font-bold ${textPrimary}`}>Filter Tutors</h3>
              </div>
              <button 
                onClick={handleResetFilters}
                className="text-[10px] text-emerald-500 hover:underline flex items-center gap-1 font-semibold"
              >
                <RotateCcw size={12} /> Reset
              </button>
            </div>

            <div className="space-y-2">
              <label className={`text-xs font-bold ${textPrimary}`}>Subject</label>
              <select
                value={draft.subject_id}
                onChange={(e) => setDraftField('subject_id', e.target.value)}
                className={selectClass}
              >
                <option value="">All Subjects</option>
                {options.subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className={`text-xs font-bold ${textPrimary}`}>Department</label>
              <select
                value={draft.department_id}
                onChange={(e) => setDraftField('department_id', e.target.value)}
                className={selectClass}
              >
                <option value="">All Departments</option>
                {options.departments.map((department) => (
                  <option key={department.id} value={department.id}>{department.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className={`text-xs font-bold ${textPrimary}`}>Language</label>
              <select
                value={draft.language}
                onChange={(e) => setDraftField('language', e.target.value)}
                className={selectClass}
              >
                <option value="">Any Language</option>
                {options.languages.map((language) => (
                  <option key={language} value={language}>{language}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className={`text-xs font-bold ${textPrimary}`}>Minimum Experience</label>
              <select
                value={draft.min_experience}
                onChange={(e) => setDraftField('min_experience', e.target.value)}
                className={selectClass}
              >
                <option value="">Any Experience</option>
                <option value="1">1+ Years</option>
                <option value="2">2+ Years</option>
                <option value="3">3+ Years</option>
                <option value="5">5+ Years</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className={`text-xs font-bold ${textPrimary}`}>Minimum Students Taught</label>
              <select
                value={draft.min_students}
                onChange={(e) => setDraftField('min_students', e.target.value)}
                className={selectClass}
              >
                <option value="">Any Number</option>
                <option value="10">10+</option>
                <option value="25">25+</option>
                <option value="50">50+</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className={`text-xs font-bold ${textPrimary}`}>Sort By</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className={selectClass}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setApplied(draft)}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              Apply Filters
            </button>
          </div>

          <div className="lg:col-span-3 space-y-6">
            {error && (
              <div className={`find-tutors-card border-rose-500/40 text-rose-500 text-xs font-semibold ${cardBg}`}>
                {error}
              </div>
            )}

            {!loading && !error && (
              <p className={`text-xs ${textSecondary}`}>
                {meta.total} tutor{meta.total === 1 ? '' : 's'} found
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {loading ? (
                <div className={`find-tutors-card col-span-2 p-12 text-center ${cardBg}`}>
                  <Search size={40} className="mx-auto text-slate-400 mb-3 opacity-50 animate-pulse" />
                  <h4 className={`text-sm font-bold ${textPrimary}`}>Loading tutors…</h4>
                </div>
              ) : tutors.length > 0 ? (
                tutors.map((tutor) => (
                  <div key={tutor.id} className={`find-tutors-card flex flex-col justify-between space-y-4 transition hover:border-emerald-500/50 ${cardBg}`}>

                    <div className="flex items-start gap-4">
                      {tutor.avatar ? (
                        <img src={tutor.avatar} alt={tutor.name} className="w-14 h-14 rounded-2xl object-cover ring-2 ring-emerald-500/20 shrink-0" />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl shrink-0 bg-emerald-600 text-white flex items-center justify-center text-lg font-black ring-2 ring-emerald-500/20">
                          {tutor.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="space-y-1 flex-grow">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className={`text-sm font-black ${textPrimary}`}>{tutor.name}</h4>
                          <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-500 shrink-0">
                            {tutor.experience_years}+ yrs
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-600 font-bold">{tutor.headline}</p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <span className="flex items-center gap-1"><MapPin size={12} /> {tutor.department ?? 'AUST'}</span>
                        </div>
                      </div>
                    </div>

                    <div className={`grid grid-cols-3 p-3 rounded-xl border text-center ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-slate-50 border-slate-200/80'}`}>
                      <div>
                        <p className="text-[10px] text-slate-400 font-medium">Experience</p>
                        <p className={`text-xs font-bold ${textPrimary}`}>{tutor.experience_years}+ Years</p>
                      </div>
                      <div className="border-x border-slate-200 dark:border-slate-700">
                        <p className="text-[10px] text-slate-400 font-medium">Students</p>
                        <p className={`text-xs font-bold ${textPrimary}`}>{tutor.student_count}+</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-medium">Rate</p>
                        <p className="text-xs font-bold text-emerald-500">৳{tutor.hourly_rate}/hr</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {tutor.subjects.map((subject) => (
                        <span key={subject.id} className={`text-[10px] px-2.5 py-1 rounded-lg font-medium ${
                          darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {subject.name}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        onClick={() => navigate('/messages')}
                        className="flex-grow py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
                      >
                        <MessageSquare size={14} /> Message Tutor
                      </button>
                    </div>

                  </div>
                ))
              ) : (
                <div className={`find-tutors-card col-span-2 p-12 text-center ${cardBg}`}>
                  <Search size={40} className="mx-auto text-slate-400 mb-3 opacity-50" />
                  <h4 className={`text-sm font-bold ${textPrimary}`}>No tutors found</h4>
                  <p className={`text-xs mt-1 ${textSecondary}`}>Try adjusting your search query or filter options.</p>
                </div>
              )}
            </div>

            {meta.last_page > 1 && (
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={meta.current_page <= 1}
                  className={`p-2 rounded-xl border transition disabled:opacity-40 disabled:cursor-not-allowed ${
                    darkMode ? 'border-slate-700 hover:bg-slate-800 text-slate-200' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <ChevronLeft size={16} />
                </button>

                <span className={`text-xs font-bold ${textSecondary}`}>
                  Page {meta.current_page} of {meta.last_page}
                </span>

                <button
                  onClick={() => setCurrentPage((page) => Math.min(meta.last_page, page + 1))}
                  disabled={meta.current_page >= meta.last_page}
                  className={`p-2 rounded-xl border transition disabled:opacity-40 disabled:cursor-not-allowed ${
                    darkMode ? 'border-slate-700 hover:bg-slate-800 text-slate-200' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

          </div>

        </div>

      </main>
    </div>
  );
}