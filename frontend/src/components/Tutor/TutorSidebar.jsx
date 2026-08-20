import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  Bell,
  Settings,
  HelpCircle,
  LogOut,
  UserPlus,
} from 'lucide-react';

export default function TutorSidebar({
  darkMode,
  activeMenu,
  currentRole,
  setCurrentRole,
  handleNavigation,
}) {
  const navigate = useNavigate();

  const sidebarBg = darkMode
    ? 'bg-[#111827] border-slate-800'
    : 'bg-white border-slate-100';

  const textPrimary = darkMode
    ? 'text-white font-extrabold'
    : 'text-slate-900 font-extrabold';

  const menuItems = [
    {
      name: 'Dashboard',
      icon: LayoutDashboard,
      path: '/tutor-dashboard',
    },
    {
      name: 'Tuition Requests',
      icon: UserPlus,
      badge: 6,
      path: '/tutor-requests',
    },
    {
      name: 'Messages',
      icon: MessageSquare,
      badge: 3,
      path: '/messages',
    },
    {
      name: 'Notifications',
      icon: Bell,
      path: '/notifications',
    },
    {
      name: 'Settings',
      icon: Settings,
      path: '/settings',
    },
    {
      name: 'Help & Support',
      icon: HelpCircle,
      path: '/support',
    },
  ];

  return (
    <aside
      className={`w-64 shrink-0 flex flex-col justify-between p-6 border-r transition-colors duration-300 ${sidebarBg}`}
    >
      <div>
        {/* Logo */}
        <div
          className="flex items-center gap-3 cursor-pointer mb-8"
          onClick={() => navigate('/')}
        >
          <div className="bg-emerald-600 text-white w-9 h-9 rounded-xl font-black text-lg flex items-center justify-center shadow-md shadow-emerald-500/20">
            E
          </div>

          <span className="text-xl font-black bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
            EduAUST
          </span>
        </div>

        {/* Navigation */}
        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeMenu === item.name;

            return (
              <button
                key={item.name}
                onClick={() =>
                  handleNavigation(item.name, item.path)
                }
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold tracking-wide transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    size={16}
                    className={
                      isActive
                        ? 'text-white'
                        : 'text-slate-400 dark:text-slate-300'
                    }
                  />

                  <span>{item.name}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${
                      isActive
                        ? 'bg-white text-emerald-600'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User section */}
      <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80 space-y-4">
        <div className="flex items-center gap-3">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120"
            alt="User"
            className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500/30"
          />

          <div>
            <h4 className={`text-xs ${textPrimary}`}>
              Nusrat Jahan
            </h4>

            <p
              className={`text-[10px] ${
                darkMode
                  ? 'text-slate-400'
                  : 'text-slate-500'
              }`}
            >
              {currentRole === 'tutor'
                ? 'Tutor Dashboard'
                : 'Student Mode'}
            </p>
          </div>
        </div>

        {/* Switch dashboard */}
        <button
          onClick={() => {
            const nextRole =
              currentRole === 'tutor'
                ? 'student'
                : 'tutor';

            setCurrentRole(nextRole);
            localStorage.setItem(
              'eduAUST_role',
              nextRole
            );

            navigate(
              nextRole === 'student'
                ? '/dashboard'
                : '/tutor-dashboard'
            );
          }}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-2 text-xs font-bold transition"
        >
          {currentRole === 'tutor'
            ? 'Switch to Student Dashboard'
            : 'Switch to Tutor Dashboard'}
        </button>

        {/* Logout */}
        <button
          onClick={() => navigate('/login')}
          className="w-full border border-rose-500 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl py-2 text-xs font-bold transition flex items-center justify-center gap-2"
        >
          <LogOut size={14} />
          Logout
        </button>
      </div>
    </aside>
  );
}