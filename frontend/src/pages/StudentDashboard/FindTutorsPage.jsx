import React, { useState } from 'react';
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

export default function FindTutorsPage({ darkMode, toggleDarkMode }) {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState('Find Tutors');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [currentRole, setCurrentRole] = useState('student');
  const [currentPage, setCurrentPage] = useState(1);

  
  const tutors = [
    {
      id: 1,
      name: 'Nusrat Jahan',
      role: 'Computer Science & Engineering',
      university: 'AUST',
      students: 28,
      experience: '3+ Years',
      hourlyRate: '৳500/hr',
      subjects: ['Data Structures', 'C Programming', 'Algorithms'],
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
      badge: 'Top Rated'
    },
    {
      id: 2,
      name: 'Saifur Rahman',
      role: 'Electrical & Electronic Engineering',
      university: 'AUST',
      students: 22,
      experience: '2+ Years',
      hourlyRate: '৳450/hr',
      subjects: ['Physics', 'Calculus', 'Circuit Analysis'],
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
      badge: 'Expert'
    },
    {
      id: 3,
      name: 'Meher Afroz',
      role: 'Department of Mathematics',
      university: 'AUST',
      students: 40,
      experience: '3+ Years',
      hourlyRate: '৳600/hr',
      subjects: ['Discrete Mathematics', 'Calculus', 'Linear Algebra'],
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
      badge: 'Super Tutor'
    },
    {
      id: 4,
      name: 'Rafi Ahmed',
      role: 'Software Engineering',
      university: 'AUST',
      students: 18,
      experience: '2+ Years',
      hourlyRate: '৳400/hr',
      subjects: ['Database Systems', 'Web Development', 'C Programming'],
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120',
      badge: 'Active'
    }
  ];

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
    setSelectedSubject('All');
  };

  
  const filteredTutors = tutors.filter((tutor) => {
    const matchesSearch = tutor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tutor.subjects.some(sub => sub.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSubject = selectedSubject === 'All' || tutor.subjects.includes(selectedSubject);
    return matchesSearch && matchesSubject;
  });

  return (
    <div className={`min-h-screen w-full font-sans antialiased flex transition-colors duration-300 ${bgClass}`}>
      
      
      <aside className={`w-64 shrink-0 flex flex-col justify-between p-6 border-r transition-colors duration-300 ${sidebarBg}`}>
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

      
      <main className="flex-grow p-6 lg:p-10 space-y-8 overflow-y-auto max-h-screen">
        
        
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className={`text-2xl sm:text-3xl font-black tracking-tight ${textPrimary}`}>Find Expert Tutors</h2>
            <p className={`text-xs sm:text-sm ${textSecondary}`}>Browse verified AUST tutors and book your session today.</p>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={toggleDarkMode} className={`p-2.5 rounded-xl border transition-all ${darkMode ? 'border-slate-700 bg-[#1e2533] text-white' : 'border-slate-300 bg-white text-slate-700 shadow-sm'}`}>
              {darkMode ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
            </button>
            <button className={`p-2.5 rounded-xl border relative ${darkMode ? 'border-slate-700 bg-[#1e2533] text-white' : 'border-slate-300 bg-white text-slate-700 shadow-sm'}`}>
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

        
        <div className={`p-4 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm ${cardBg}`}>
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
          
          
          <div className={`p-6 rounded-2xl border space-y-6 h-fit shadow-sm ${cardBg}`}>
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
                value={selectedSubject} 
                onChange={(e) => setSelectedSubject(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-xs outline-none font-medium ${
                  darkMode ? 'bg-[#12161f] border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <option value="All">All Subjects</option>
                <option value="Data Structures">Data Structures</option>
                <option value="C Programming">C Programming</option>
                <option value="Calculus">Calculus</option>
                <option value="Discrete Mathematics">Discrete Mathematics</option>
              </select>
            </div>

            <button className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-sm">
              Apply Filters
            </button>
          </div>

          
          <div className="lg:col-span-3 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredTutors.length > 0 ? (
                filteredTutors.map((tutor) => (
                  <div key={tutor.id} className={`p-6 rounded-2xl border shadow-sm flex flex-col justify-between space-y-4 transition hover:border-emerald-500/50 ${cardBg}`}>
                    
                    {/* Header info */}
                    <div className="flex items-start gap-4">
                      <img src={tutor.avatar} alt={tutor.name} className="w-14 h-14 rounded-2xl object-cover ring-2 ring-emerald-500/20 shrink-0" />
                      <div className="space-y-1 flex-grow">
                        <div className="flex items-center justify-between">
                          <h4 className={`text-sm font-black ${textPrimary}`}>{tutor.name}</h4>
                          <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-500">
                            {tutor.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-600 font-bold">{tutor.role}</p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <span className="flex items-center gap-1"><MapPin size={12} /> {tutor.university}</span>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className={`grid grid-cols-3 p-3 rounded-xl border text-center ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-slate-50 border-slate-200/80'}`}>
                      <div>
                        <p className="text-[10px] text-slate-400 font-medium">Experience</p>
                        <p className={`text-xs font-bold ${textPrimary}`}>{tutor.experience}</p>
                      </div>
                      <div className="border-x border-slate-200 dark:border-slate-700">
                        <p className="text-[10px] text-slate-400 font-medium">Students</p>
                        <p className={`text-xs font-bold ${textPrimary}`}>{tutor.students}+</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-medium">Rate</p>
                        <p className="text-xs font-bold text-emerald-500">{tutor.hourlyRate}</p>
                      </div>
                    </div>

                    
                    <div className="flex flex-wrap gap-1.5">
                      {tutor.subjects.map((sub, idx) => (
                        <span key={idx} className={`text-[10px] px-2.5 py-1 rounded-lg font-medium ${
                          darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {sub}
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
                      <button className={`px-4 py-2 border rounded-xl text-xs font-bold transition ${
                        darkMode ? 'border-slate-700 hover:bg-slate-800 text-slate-200' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                      }`}>
                        View Profile
                      </button>
                    </div>

                  </div>
                ))
              ) : (
                <div className={`col-span-2 p-12 text-center rounded-2xl border ${cardBg}`}>
                  <Search size={40} className="mx-auto text-slate-400 mb-3 opacity-50" />
                  <h4 className={`text-sm font-bold ${textPrimary}`}>No tutors found</h4>
                  <p className={`text-xs mt-1 ${textSecondary}`}>Try adjusting your search query or filter options.</p>
                </div>
              )}
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}