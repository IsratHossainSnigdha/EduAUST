import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Search,
  MessageSquare,
  Bell,
  Settings,
  HelpCircle,
  LogOut,
  ChevronDown,
  Plus,
  Users,
  UserPlus,
  ShieldCheck,
  Sun,
  Moon
} from 'lucide-react';
import { apiGet } from '../../lib/auth';

export default function TutorDashboard({ darkMode, toggleDarkMode }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenu, setActiveMenu] = useState('Dashboard');
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentRole, setCurrentRole] = useState(() => {
  return localStorage.getItem('eduAUST_role') || 'tutor';
});

  const bgClass = darkMode ? 'bg-[#0b0f19] text-slate-150' : 'bg-slate-50 text-slate-950';
  const sidebarBg = darkMode ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-100';
  const cardBg = darkMode ? 'bg-[#1f2937] border-slate-800' : 'bg-white border-slate-100';
  const inputBg = darkMode ? 'bg-[#111827] border-slate-700 text-white placeholder-slate-400' : 'bg-slate-50 border-slate-200 text-slate-900';

  const textPrimary = darkMode ? 'text-white font-extrabold' : 'text-slate-900 font-extrabold';
  const textSecondary = darkMode ? 'text-slate-200 font-medium' : 'text-slate-600 font-medium';

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/tutor-dashboard' },
    { name: 'Tuition Requests', icon: UserPlus, badge: 6, path: '/tutor-requests' },
    { name: 'Messages', icon: MessageSquare, badge: 3, path: '/messages' },
    { name: 'Notifications', icon: Bell, badge: unreadCount || undefined, path: '/notifications' },
    { name: 'Settings', icon: Settings, path: '/settings' },
    { name: 'Help & Support', icon: HelpCircle, path: '/support' },
  ];

  const handleNavigation = (itemName, itemPath) => {
    setActiveMenu(itemName);
    if (itemPath && itemPath !== '#') {
      navigate(itemPath);
    }
  };

 useEffect(() => {
  localStorage.setItem('eduAUST_role', currentRole);
}, [currentRole]);

  // Badge count for this dashboard only; the API reports each side separately.
  useEffect(() => {
    let cancelled = false;

    apiGet('/notifications/unread-count').then(({ ok, body }) => {
      if (!cancelled && ok) {
        setUnreadCount(body?.by_audience?.tutor ?? 0);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={`min-h-screen w-full font-sans antialiased flex transition-colors duration-300 ${bgClass}`}>
      
      {/* Sidebar */}
      <aside className={`w-64 shrink-0 flex flex-col justify-between p-6 border-r transition-colors duration-300 ${sidebarBg}`}>
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer mb-8" onClick={() => navigate('/')}>
            <div className="bg-emerald-600 text-white w-9 h-9 rounded-xl font-black text-lg flex items-center justify-center shadow-md shadow-emerald-500/20">E</div>
            <span className="text-xl font-black bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">EduAUST</span>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item.name, item.path)}
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
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120"
              alt="User"
              className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500/30"
            />
            <div>
              <h4 className={`text-xs ${textPrimary}`}>Nusrat Jahan </h4>
              <p className={`text-[10px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {currentRole === 'tutor' ? 'Tutor Dashboard' : 'Student Mode'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
  if (currentRole === 'tutor') {
    setCurrentRole('student');
    localStorage.setItem('eduAUST_role', 'student');
    navigate('/dashboard');
  } else {
    setCurrentRole('tutor');
    localStorage.setItem('eduAUST_role', 'tutor');
    navigate('/tutor-dashboard');
  }
}}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-2 text-xs font-bold transition"
          >
            {currentRole === 'tutor' ? 'Switch to Student Dashboard' : 'Switch to Tutor Dashboard'}
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

      {/* Main Content */}
      <main className="flex-grow p-6 lg:p-10 space-y-8 overflow-y-auto max-h-screen">
        
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative max-w-md w-full">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${darkMode ? 'text-slate-400' : 'text-slate-450'}`} size={16} />
            <input 
              type="text" 
              placeholder="Search students, subjects or requests..."
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
            <button
              onClick={() => navigate('/notifications')}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1f2937] text-slate-700 dark:text-white relative cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
              )}
            </button>
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-800">
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120" alt="Profile" className="w-9 h-9 rounded-full object-cover ring-2 ring-emerald-500/20" />
              <div className="hidden sm:block">
                <h5 className={`text-xs ${textPrimary}`}>Nusrat Jahan</h5>
                <p className={`text-[10px] ${darkMode ? 'text-slate-400 font-medium' : 'text-slate-500 font-medium'}`}>Tutor</p>
              </div>
              <ChevronDown size={14} className="text-slate-450 dark:text-slate-350" />
            </div>
          </div>
        </header>

      
        <div className="space-y-1"> 
          <h2 className={`text-2xl sm:text-3xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Let's Connect, Nusrat! 👋
          </h2>
          <p className={`text-xs sm:text-sm ${textSecondary}`}>Here's an overview of your tutoring activity.</p>
        </div>

      
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div 
            onClick={() => navigate('/tutor-requests')} 
            className={`p-6 rounded-2xl border flex items-center justify-between shadow-sm cursor-pointer hover:border-emerald-500/50 transition-all ${cardBg}`}
          >
            <div>
              <p className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Pending Requests</p>
              <h3 className={`text-3xl font-black mt-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>6</h3>
              <p className={`text-[11px] mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-400'}`}>New requests</p>
            </div>
            <div className="w-14 h-14 bg-emerald-500/10 text-emerald-600 rounded-2xl flex items-center justify-center text-xl font-bold">
              <UserPlus size={24} />
            </div>
          </div>

          <div className={`p-6 rounded-2xl border flex items-center justify-between shadow-sm ${cardBg}`}>
            <div>
              <p className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total Students</p>
              <h3 className={`text-3xl font-black mt-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>18</h3>
              <p className={`text-[11px] mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-400'}`}>Active students</p>
            </div>
            <div className="w-14 h-14 bg-emerald-500/10 text-emerald-600 rounded-2xl flex items-center justify-center text-xl font-bold">
              <Users size={24} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          
          <div className={`p-6 rounded-2xl border shadow-sm flex flex-col justify-between ${cardBg}`}>
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-sm font-black uppercase tracking-wider ${darkMode ? 'text-white' : 'text-slate-900'}`}>Recent Tuition Requests</h3>
                <button onClick={() => navigate('/tutor-requests')} className="text-xs font-bold text-emerald-500 hover:underline">View all</button>
              </div>

              <div className="space-y-3">
                {[
                  { subject: 'Data Structures', level: 'University Level', time: '2 hours ago', status: 'New' },
                  { subject: 'Discrete Mathematics', level: 'HSC 2nd Year', time: '5 hours ago', status: 'New' },
                  { subject: 'Algorithms', level: 'University Level', time: '1 day ago', status: 'Viewed' },
                ].map((req, idx) => (
                  <div key={idx} className={`flex items-center justify-between p-3.5 rounded-xl border transition-colors ${darkMode ? 'bg-slate-800/70 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs">
                        {req.subject.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className={`text-xs font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{req.subject}</h4>
                        <p className={`text-[10px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{req.level}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] block mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-400'}`}>{req.time}</span>
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded ${req.status === 'New' ? 'bg-amber-500/15 text-amber-500' : 'bg-slate-500/15 text-slate-400'}`}>
                        {req.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
              <button onClick={() => navigate('/tutor-requests')} className="text-xs font-bold text-emerald-500 hover:underline flex items-center justify-center gap-1 mx-auto">
                View all requests <Plus size={12} />
              </button>
            </div>
          </div>

          {/* My Students */}
          <div className={`p-6 rounded-2xl border shadow-sm flex flex-col justify-between ${cardBg}`}>
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-sm font-black uppercase tracking-wider ${darkMode ? 'text-white' : 'text-slate-900'}`}>My Students</h3>
                <button className="text-xs font-bold text-emerald-500 hover:underline">View all</button>
              </div>

              <div className="space-y-3">
                {[
                  { name: 'Saifur Rahman', details: 'CSE • 2nd Year', img: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces' },
                  { name: 'Meher Afroz', details: 'HSC • 1st Year', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces' },
                  { name: 'Rafi Ahmed', details: 'CSE • 3rd Year', img: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&h=100&fit=crop&crop=faces' },
                ].map((student, idx) => (
                  <div key={idx} className={`flex items-center justify-between p-3.5 rounded-xl border transition-colors ${darkMode ? 'bg-slate-800/70 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center gap-3">
                      <img src={student.img} className="w-10 h-10 rounded-full object-cover" alt={student.name} />
                      <div>
                        <h4 className={`text-xs font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{student.name}</h4>
                        <p className={`text-[10px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{student.details}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => navigate('/messages')}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${darkMode ? 'bg-slate-700 text-slate-300 hover:bg-emerald-600 hover:text-white' : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600'}`}
                    >
                      <MessageSquare size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        
        <div className={`p-4 rounded-2xl border flex items-center justify-between shadow-sm ${cardBg}`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <ShieldCheck size={16} />
            </div>
            <p className={`text-xs font-medium ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Keep your profile updated to attract more students.</p>
          </div>
          <button className="text-xs font-bold text-emerald-500 hover:underline">
            Update Profile &rarr;
          </button>
        </div>

      </main>
    </div>
  );
}