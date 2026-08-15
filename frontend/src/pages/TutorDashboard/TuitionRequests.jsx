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
  UserPlus,
  ShieldCheck,
  Sun,
  Moon,
  BookOpen,
  Check,
  Info,
  Layers,
  Cpu,
  Terminal,
  Atom,
  FunctionSquare,
  Database
} from 'lucide-react';

// Base initial requests data with icon mapping identifiers
const initialRequests = [
  {
    id: 1,
    name: 'Saifur Rahman',
    email: 'saifur.rahman@aust.edu',
    subject: 'Data Structures',
    level: 'University Level',
    description: 'Need help understanding linked lists, stacks, queues and time complexity.',
    time: '2 hours ago',
    status: 'New',
    initials: 'SA',
    icon: Layers,
    iconColor: 'text-indigo-500 bg-indigo-500/10'
  },
  {
    id: 2,
    name: 'Meher Afroz',
    email: 'meher.afroz@aust.edu',
    subject: 'Discrete Mathematics',
    level: 'University Level',
    description: 'Need help with relations, functions and proof techniques.',
    time: '5 hours ago',
    status: 'New',
    initials: 'AF',
    icon: FunctionSquare,
    iconColor: 'text-purple-500 bg-purple-500/10'
  },
  {
    id: 3,
    name: 'Rafi Ahmed',
    email: 'rafi.ahmed@aust.edu',
    subject: 'C Programming',
    level: 'University Level',
    description: 'Having trouble in pointers and function implementation.',
    time: '1 day ago',
    status: 'New',
    initials: 'RA',
    icon: Terminal,
    iconColor: 'text-emerald-500 bg-emerald-500/10'
  },
  {
    id: 4,
    name: 'Tasnim Anika',
    email: 'tasnim.anika@aust.edu',
    subject: 'Physics',
    level: 'University Level',
    description: 'Need concept clearing on mechanics (Newton’s laws and friction).',
    time: '2 days ago',
    status: 'Viewed',
    initials: 'TA',
    icon: Atom,
    iconColor: 'text-cyan-500 bg-cyan-500/10'
  },
  {
    id: 5,
    name: 'Mahin Jannat',
    email: 'mahin.jannat@aust.edu',
    subject: 'Calculus',
    level: 'University Level',
    description: 'Help needed with differentiation and integration techniques.',
    time: '3 days ago',
    status: 'Viewed',
    initials: 'MJ',
    icon: Cpu,
    iconColor: 'text-amber-500 bg-amber-500/10'
  },
  {
    id: 6,
    name: 'Hasibur Rahman',
    email: 'hasib.rahman@aust.edu',
    subject: 'Database Systems',
    level: 'University Level',
    description: 'Need help with ER diagrams and normalization.',
    time: '5 days ago',
    status: 'Accepted',
    initials: 'HR',
    icon: Database,
    iconColor: 'text-rose-500 bg-rose-500/10'
  }
];

export default function TuitionRequestsPage({ darkMode, toggleDarkMode }) {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState('Tuition Requests');
  const [currentRole, setCurrentRole] = useState('tutor');

  // State initialization with localStorage status sync
  const [requests, setRequests] = useState(() => {
    try {
      const savedStatuses = localStorage.getItem('eduAust_requestStatuses');
      if (savedStatuses) {
        const statuses = JSON.parse(savedStatuses);
        return initialRequests.map(req => 
          statuses[req.id] ? { ...req, status: statuses[req.id] } : req
        );
      }
    } catch (e) {
      console.error("Failed to load request statuses from localStorage", e);
    }
    return initialRequests;
  });

  // Handle Accept action and persist only status mapping
  const handleAccept = (id) => {
    setRequests(prev => {
      const updated = prev.map(req => req.id === id ? { ...req, status: 'Accepted' } : req);
      const statusMap = updated.reduce((acc, curr) => ({ ...acc, [curr.id]: curr.status }), {});
      localStorage.setItem('eduAust_requestStatuses', JSON.stringify(statusMap));
      return updated;
    });
  };

  const bgClass = darkMode ? 'bg-[#0b0f19] text-slate-150' : 'bg-slate-50 text-slate-950';
  const sidebarBg = darkMode ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-100';
  const cardBg = darkMode ? 'bg-[#1f2937] border-slate-800' : 'bg-white border-slate-100';

  const textPrimary = darkMode ? 'text-white font-extrabold' : 'text-slate-900 font-extrabold';
  const textSecondary = darkMode ? 'text-slate-200 font-medium' : 'text-slate-600 font-medium';

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/tutor-dashboard' },
    { name: 'Tuition Requests', icon: UserPlus, badge: 6, path: '/tutor-requests' },
    { name: 'Messages', icon: MessageSquare, badge: 3, path: '/messages' },
        { name: 'Notifications', icon: Bell, badge: 3, path: '/notifications' }, 
    { name: 'Settings', icon: Settings, path: '/settings' },
    { name: 'Help & Support', icon: HelpCircle, path: '/support' },
  ];

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
                  onClick={() => {
                    setActiveMenu(item.name);
                    navigate(item.path);
                  }}
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

        {/* User Profile & Footer Actions */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80 space-y-4">
          <div className="flex items-center gap-3">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120"
              alt="User"
              className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500/30"
            />
            <div>
              <h4 className={`text-xs ${textPrimary}`}>Nusrat Jahan</h4>
              <p className={`text-[10px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {currentRole === 'tutor' ? 'Tutor Dashboard' : 'Student Mode'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (currentRole === 'tutor') {
                setCurrentRole('student');
                navigate('/dashboard');
              } else {
                setCurrentRole('tutor');
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

      {/* Main Content Area */}
      <main className="flex-grow p-6 lg:p-10 space-y-8 overflow-y-auto max-h-screen">
        
        {/* Top Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-end gap-4">
          <div className="flex items-center gap-4">
            <button onClick={toggleDarkMode} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1f2937] text-slate-700 dark:text-white transition-all">
              {darkMode ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
            </button>
            <button className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1f2937] text-slate-700 dark:text-white relative">
              <Bell size={16} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
            </button>
            <button onClick={() => navigate('/messages')} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1f2937] text-slate-700 dark:text-white relative">
              <MessageSquare size={16} />
              <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">2</span>
            </button>
            <button onClick={() => navigate('/settings')} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1f2937] text-slate-700 dark:text-white">
              <Settings size={16} />
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

        {/* Page Title Section */}
        <div className="space-y-1"> 
          <h2 className={`text-2xl sm:text-3xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Tuition Requests
          </h2>
          <p className={`text-xs sm:text-sm ${textSecondary}`}>Students are looking for help. Review and respond to their requests.</p>
        </div>

        {/* Requests List Card Container */}
        <div className={`p-6 rounded-2xl border shadow-sm space-y-4 ${cardBg}`}>
          {requests.map((req) => {
            const SubjectIcon = req.icon;
            return (
              <div 
                key={req.id} 
                className={`flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border transition-colors gap-4 ${
                  darkMode ? 'bg-slate-800/70 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              >
                {/* Student Info */}
                <div className="flex items-start md:items-center gap-3.5 min-w-[240px]">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
                    {req.initials}
                  </div>
                  <div>
                    <h4 className={`text-xs font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{req.name}</h4>
                    <p className={`text-[10px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{req.email}</p>
                  </div>
                </div>

                {/* Subject & Description */}
                <div className="flex-grow space-y-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shadow-sm ${req.iconColor}`}>
                      <SubjectIcon size={14} />
                    </div>
                    <h5 className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{req.subject}</h5>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-700'}`}>
                      {req.level}
                    </span>
                  </div>
                  <p className={`text-[11px] ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    {req.description}
                  </p>
                </div>

                {/* Status, Time & Actions */}
                <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200 dark:border-slate-700">
                  <div className="text-left md:text-right">
                    <span className={`text-[10px] block mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-400'}`}>{req.time}</span>
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded ${
                      req.status === 'New' 
                        ? 'bg-amber-500/15 text-amber-500' 
                        : req.status === 'Accepted'
                        ? 'bg-emerald-500/15 text-emerald-500'
                        : 'bg-slate-500/15 text-slate-400'
                    }`}>
                      {req.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition ${
                      darkMode ? 'border-slate-600 hover:bg-slate-700 text-slate-200' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                    }`}>
                      View Details
                    </button>
                    {req.status !== 'Accepted' ? (
                      <button 
                        onClick={() => handleAccept(req.id)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm"
                      >
                        Accept
                      </button>
                    ) : (
                      <button disabled className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-500 text-xs font-bold cursor-not-allowed flex items-center gap-1">
                        <Check size={12} /> Accepted
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Banner Notice */}
        <div className={`p-4 rounded-2xl border flex items-center gap-3 shadow-sm ${cardBg}`}>
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <Info size={16} />
          </div>
          <p className={`text-xs font-medium ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            Responding quickly to requests improves your visibility and gets you more students.
          </p>
        </div>

      </main>
    </div>
  );
}