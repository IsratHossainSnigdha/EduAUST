import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  Bell,
  Settings,
  HelpCircle,
  LogOut,
  Search,
  Sun,
  Moon,
  CheckCheck,
  Calendar,
  BookOpen,
  DollarSign,
  UserCheck,
  AlertCircle,
  Trash2,
  Filter
} from 'lucide-react';

export default function NotificationsPage({ darkMode, toggleDarkMode }) {
  const navigate = useNavigate();
const location = useLocation();
  const [activeMenu, setActiveMenu] = useState('Notifications');
  const [currentRole, setCurrentRole] = useState(() => {
  return localStorage.getItem('eduAUST_role') || 'student';
});
  const [activeTab, setActiveTab] = useState('All');

  // Sample Notifications Data with LocalStorage persistence (Without Booking & Payment)
  const [notifications, setNotifications] = useState(() => {
    const savedNotifications = localStorage.getItem('eduAust_notifications_v2');
    if (savedNotifications) {
      try {
        const parsed = JSON.parse(savedNotifications);
        return parsed.map(item => {
          let iconComponent = Calendar;
          if (item.type === 'message') iconComponent = MessageSquare;
          else if (item.type === 'system' && item.title.includes('Verification')) iconComponent = UserCheck;
          else if (item.type === 'system') iconComponent = AlertCircle;
          
          return { ...item, icon: iconComponent };
        });
      } catch (e) {
        console.error("Failed to parse notifications from localStorage", e);
      }
    }
    return [
      {
        id: 1,
        title: 'New Message Received',
        description: 'Saifur Rahman sent you a message regarding the upcoming Physics assignment doubts.',
        time: '1 hour ago',
        type: 'message',
        unread: true,
        icon: MessageSquare,
        color: 'text-sky-500 bg-sky-500/15'
      },
      {
        id: 2,
        title: 'Tutor Verification Complete',
        description: 'Your profile has been reviewed and verified successfully as an expert tutor.',
        time: '2 days ago',
        type: 'system',
        unread: false,
        icon: UserCheck,
        color: 'text-teal-500 bg-teal-500/15'
      },
      {
        id: 3,
        title: 'System Maintenance Notice',
        description: 'EduAUST portal will undergo scheduled maintenance this Friday from 1:00 AM to 3:00 AM.',
        time: '3 days ago',
        type: 'system',
        unread: false,
        icon: AlertCircle,
        color: 'text-rose-500 bg-rose-500/15'
      }
    ];
  });

  useEffect(() => {
  localStorage.setItem('eduAUST_role', currentRole);
}, [currentRole]);

  // Save to localStorage whenever notifications state changes
  useEffect(() => {
    const dataToStore = notifications.map(({ icon, ...rest }) => rest);
    localStorage.setItem('eduAust_notifications_v2', JSON.stringify(dataToStore));
  }, [notifications]);

  const bgClass = darkMode ? 'bg-[#12161f] text-slate-100' : 'bg-[#f1f3f6] text-slate-900';
  const sidebarBg = darkMode ? 'bg-[#1a202c] border-slate-700/60' : 'bg-white border-slate-200 shadow-sm';
  const cardBg = darkMode ? 'bg-[#1e2533] border-slate-700/60' : 'bg-white border-slate-200 shadow-sm';
  const textPrimary = darkMode ? 'text-white font-extrabold' : 'text-slate-900 font-extrabold';
  const textSecondary = darkMode ? 'text-slate-300 font-medium' : 'text-slate-700 font-medium';

  const menuItems = [
  {
    name: 'Dashboard',
    icon: LayoutDashboard,
    path: currentRole === 'tutor' ? '/tutor-dashboard' : '/dashboard'
  },
  ...(currentRole === 'student'
    ? [{ name: 'Find Tutors', icon: Search, path: '/find-tutors' }]
    : [{ name: 'Tuition Requests', icon: BookOpen, badge: 6, path: '/tutor-requests' }]),
  { name: 'Messages', icon: MessageSquare, badge: 2, path: '/messages' },
  { name: 'Notifications', icon: Bell, badge: 3, path: '/notifications' },
  { name: 'Settings', icon: Settings, path: '/settings' },
  { name: 'Help & Support', icon: HelpCircle, path: '/support' },
];

  // Mark all as read handler
  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(item => ({ ...item, unread: false })));
  };

  // Clear all notifications
  const handleClearAll = () => {
    setNotifications([]);
  };

  // Filter notifications based on active tab
  const filteredNotifications = notifications.filter(item => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Unread') return item.unread;
    if (activeTab === 'Bookings') return item.type === 'booking';
    if (activeTab === 'Messages') return item.type === 'message';
    return true;
  });

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
        
        {/* User Profile & Logout */}
        <div className={`pt-6 border-t ${darkMode ? 'border-slate-700/60' : 'border-slate-200'} space-y-4`}>
          <div className="flex items-center gap-3">
            <img
              src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120"
              alt="User"
              className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500/30"
            />
            <div>
              <h4 className={`text-xs ${textPrimary}`}>Ishrat Jahan Ifa</h4>
             <p className={`text-[10px] ${darkMode ? 'text-slate-400 font-semibold' : 'text-slate-500 font-semibold'}`}>
  {currentRole === 'student'
    ? 'Student • CSE 3.1'
    : 'Tutor'}
</p>
            </div>
          </div>
          
          <button
  onClick={() => {
    if (currentRole === 'student') {
      setCurrentRole('tutor');
      localStorage.setItem('eduAUST_role', 'tutor');
      navigate('/tutor-dashboard');
    } else {
      setCurrentRole('student');
      localStorage.setItem('eduAUST_role', 'student');
      navigate('/dashboard');
    }
  }}
  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-2 text-xs font-bold transition shadow-sm"
>
  {currentRole === 'student'
    ? 'Switch to Tutor Dashboard'
    : 'Switch to Student Dashboard'}
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
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className={`text-2xl sm:text-3xl font-black tracking-tight ${textPrimary}`}>Notifications</h2>
            <p className={`text-xs sm:text-sm ${textSecondary}`}>Stay updated with your latest tutoring sessions, messages, and alerts.</p>
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
               <p className={`text-[10px] ${darkMode ? 'text-slate-400 font-semibold' : 'text-slate-500 font-semibold'}`}>
  {currentRole === 'student'
    ? 'Student • CSE 3.1'
    : 'Tutor Dashboard'}
</p>
              </div>
            </div>
          </div>
        </header>

        {/* Toolbar & Action Buttons */}
        <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm ${cardBg}`}>
          
          {/* Notification Categories / Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {['All', 'Unread', 'Bookings', 'Messages'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === tab
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : darkMode
                      ? 'bg-[#12161f] text-slate-300 hover:bg-slate-800'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Action Triggers */}
          <div className="flex items-center gap-3">
            <button 
              onClick={handleMarkAllAsRead}
              className={`px-3.5 py-2 border rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                darkMode ? 'border-slate-700 hover:bg-slate-800 text-slate-200' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <CheckCheck size={14} className="text-emerald-500" />
              Mark all as read
            </button>
            <button 
              onClick={handleClearAll}
              className={`px-3.5 py-2 border border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5`}
            >
              <Trash2 size={14} />
              Clear All
            </button>
          </div>

        </div>

        {/* Notifications List Section */}
        <div className="space-y-4">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((item) => {
              const Icon = item.icon;
              return (
                <div 
                  key={item.id} 
                  className={`p-5 rounded-2xl border transition flex items-start gap-4 shadow-sm ${cardBg} ${
                    item.unread ? (darkMode ? 'border-emerald-500/40 bg-[#1e2533]' : 'border-emerald-500/40 bg-emerald-50/30') : ''
                  }`}
                >
                  {/* Icon */}
                  <div className={`p-3 rounded-2xl shrink-0 ${item.color}`}>
                    <Icon size={20} />
                  </div>

                  {/* Content */}
                  <div className="flex-grow space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h4 className={`text-sm ${textPrimary}`}>{item.title}</h4>
                        {item.unread && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        )}
                      </div>
                      <span className={`text-[10px] ${darkMode ? 'text-slate-400 font-medium' : 'text-slate-500 font-medium'}`}>
                        {item.time}
                      </span>
                    </div>
                    <p className={`text-xs ${textSecondary}`}>
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className={`p-12 text-center rounded-2xl border ${cardBg}`}>
              <Bell size={40} className="mx-auto text-slate-400 mb-3 opacity-50" />
              <h4 className={`text-sm font-bold ${textPrimary}`}>No notifications found</h4>
              <p className={`text-xs mt-1 ${textSecondary}`}>You're all caught up! Check back later for updates.</p>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}