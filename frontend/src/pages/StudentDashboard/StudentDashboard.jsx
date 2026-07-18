import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Search,
  Heart,
  GitPullRequest,
  MessageSquare,
  Bell,
  Settings,
  HelpCircle,
  LogOut,
  ChevronDown,
  Plus,
  ArrowRight,
  BookOpen,
  Sun,
  Moon,
} from 'lucide-react';

export default function StudentDashboard({ darkMode, toggleDarkMode }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenu, setActiveMenu] = useState('Dashboard');
  const [currentRole, setCurrentRole] = useState('student');

  const bgClass = darkMode ? 'bg-[#0b0f19] text-slate-150' : 'bg-slate-50 text-slate-950';
  const sidebarBg = darkMode ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-100';
  const cardBg = darkMode ? 'bg-[#1f2937] border-slate-800' : 'bg-white border-slate-100';
  const inputBg = darkMode ? 'bg-[#111827] border-slate-700 text-white placeholder-slate-400' : 'bg-slate-50 border-slate-200 text-slate-900';

  const textPrimary = darkMode ? 'text-white font-extrabold' : 'text-slate-900 font-extrabold';
  const textSecondary = darkMode ? 'text-slate-200 font-medium' : 'text-slate-600 font-medium';
  const textMuted = darkMode ? 'text-slate-350 font-medium' : 'text-slate-500 font-medium';

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Find Tutors', icon: Search },
    { name: 'Saved Tutors', icon: Heart },
    { name: 'My Requests', icon: GitPullRequest },
    { name: 'Messages', icon: MessageSquare, badge: 3 },
    { name: 'Notifications', icon: Bell, badge: 2 },
    { name: 'Settings', icon: Settings },
    { name: 'Help & Support', icon: HelpCircle },
  ];

  return (
    <div className={`min-h-screen w-full font-sans antialiased flex transition-colors duration-300 ${bgClass}`}>
      
      <aside className={`w-64 shrink-0 flex flex-col justify-between p-6 border-r transition-colors duration-300 ${sidebarBg}`}>
        <div className="space-y-8">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
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
                  onClick={() => setActiveMenu(item.name)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold tracking-wide transition-all ${
                    isActive 
                      ? 'bg-emerald-600 text-white dark:bg-emerald-600 dark:text-white shadow-md' 
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} className={isActive ? 'text-white' : 'text-slate-400 dark:text-slate-300'} />
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

        <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80 space-y-4">
          <div className="flex items-center gap-3">
            <img
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120"
              alt="User"
              className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500/30"
            />
            <div>
              <h4 className={`text-xs ${textPrimary}`}>Ishrat Jahan Ifa</h4>
              <p className={`text-[10px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {currentRole === 'student' ? 'Student • CSE 3.1' : 'Tutor Mode'}
              </p>
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
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-2 text-xs font-bold transition"
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
          <div className="relative max-w-md w-full">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${darkMode ? 'text-slate-400' : 'text-slate-450'}`} size={16} />
            <input 
              type="text" 
              placeholder="Search by course, subject, or tutor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-11 pr-12 py-2.5 rounded-2xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all ${inputBg}`}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">⌘ /</span>
          </div>

          <div className="flex items-center gap-4 self-end md:self-auto">
            <button onClick={toggleDarkMode} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1f2937] text-slate-700 dark:text-white transition-all">
              {darkMode ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
            </button>
            <button className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1f2937] text-slate-700 dark:text-white relative">
              <Bell size={16} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
            </button>
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-800">
              <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120" alt="Profile" className="w-9 h-9 rounded-full object-cover ring-2 ring-emerald-500/20" />
              <div className="hidden sm:block">
                <h5 className={`text-xs ${textPrimary}`}>Ishrat Jahan Ifa</h5>
                <p className={`text-[10px] ${darkMode ? 'text-slate-400 font-medium' : 'text-slate-500 font-medium'}`}>CSE • Semester 3.1</p>
              </div>
              <ChevronDown size={14} className="text-slate-450 dark:text-slate-350" />
            </div>
            <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold transition text-xs shadow-lg shadow-emerald-500/10 flex items-center gap-1.5">
              <Plus size={14} /> Find Tutor
            </button>
          </div>
        </header>

        <div className="space-y-1">
          <h1 className={`text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Let's Connect, Ishrat! <span className="animate-bounce">👋</span>
          </h1>
          <p className={`text-xs sm:text-sm ${textSecondary}`}>Find the right tutor and ace your studies.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {[
            { title: 'Find Tutor', desc: 'Search by course or subject', icon: Search, color: 'text-blue-500 bg-blue-500/10 border-blue-500/15' },
            { title: 'Saved Tutors', desc: 'View your saved tutor list', icon: Heart, color: 'text-pink-500 bg-pink-500/10 border-pink-500/15' },
            { title: 'My Requests', desc: 'Check the status of your requests', icon: GitPullRequest, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/15', badge: 2 },
            { title: 'Messages', desc: 'Chat with active tutors', icon: MessageSquare, color: 'text-violet-500 bg-violet-500/10 border-violet-500/15', badge: 3 }
          ].map((card, idx) => {
            const Icon = card.icon;
            return (
              <div key={idx} className={`p-5 rounded-2xl border transition-all duration-300 ${cardBg} hover:-translate-y-1 hover:shadow-lg relative group cursor-pointer`}>
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-xl border ${card.color}`}>
                    <Icon size={18} />
                  </div>
                  {card.badge && (
                    <span className="bg-emerald-600 text-white text-[9px] px-2 py-0.5 rounded-full font-black">{card.badge}</span>
                  )}
                </div>
                <div className="mt-4 space-y-1">
                  <h3 className={`text-sm font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>{card.title}</h3>
                  <p className={`text-[11px] font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{card.desc}</p>
                </div>
                <div className="absolute bottom-5 right-5 text-slate-400 group-hover:text-emerald-500 transition-colors">
                  <ArrowRight size={14} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="space-y-6">
            <div className={`p-5 rounded-2xl border ${cardBg} space-y-4`}>
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-300">
                  Recent Tutor Requests
                </h3>
                <button className="text-[11px] font-bold text-emerald-500 dark:text-emerald-400 hover:underline">
                  View All
                </button>
              </div>

              <div className="space-y-3">
                {[
                  {
                    subject: 'Data Structures',
                    time: 'Requested 2 hours ago',
                    status: 'Waiting',
                    statusColor: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/10',
                  },
                  {
                    subject: 'Discrete Mathematics',
                    time: 'Requested yesterday',
                    status: 'Accepted',
                    statusColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/10',
                  },
                ].map((req, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-colors ${darkMode ? 'bg-slate-800/70 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
                        <BookOpen size={14} />
                      </div>

                      <div>
                        <h4 className={`text-xs font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                          {req.subject}
                        </h4>

                        <p className={`text-[10px] ${textMuted}`}>
                          {req.time}
                        </p>
                      </div>
                    </div>

                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded border ${req.statusColor}`}>
                      {req.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}