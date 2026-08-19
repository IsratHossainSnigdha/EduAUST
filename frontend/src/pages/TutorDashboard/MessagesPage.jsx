import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  Bell,
  Settings,
  LogOut,
  ChevronDown,
  UserPlus,
  Home,
  Search,
  Sun,
  Moon,
  Star,
  SlidersHorizontal,
  Paperclip,
  Smile,
  Send,
  CheckCheck,
  HelpCircle,
  
} from 'lucide-react';
import { apiGet, apiPost, clearAuth, firstError, isUnauthenticated } from '../../lib/auth';

export default function MessagesPage({ darkMode, toggleDarkMode }) {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState('Messages');
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const messagesEndRef = useRef(null);


  const [selectedChat, setSelectedChat] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [currentMessages, setCurrentMessages] = useState([]);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  // A 401 that survived the automatic token refresh means the session is
  // genuinely over, so every call site ends it the same way rather than
  // printing "Unauthenticated." into the error banner.
  const endExpiredSession = useCallback(() => {
    clearAuth();
    navigate('/login');
  }, [navigate]);

  // Load the conversation list. Also re-run after opening or sending, since
  // both change the previews and the unread counts.
  const loadConversations = useCallback(async () => {
    const { ok, body } = await apiGet('/conversations');

    if (!ok) {
      setLoadingList(false);
      if (isUnauthenticated(body)) {
        endExpiredSession();
        return;
      }
      setError(body?.message || 'Could not load conversations.');
      return;
    }

    setConversations(body.data ?? []);
    setUnreadTotal(body.unread_total ?? 0);
    setLoadingList(false);
  }, [endExpiredSession]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Open the first thread once the list arrives so the pane is never blank.
  useEffect(() => {
    if (selectedChat === null && conversations.length > 0) {
      setSelectedChat(conversations[0].id);
    }
  }, [conversations, selectedChat]);

  // Fetching a thread also marks it read on the server.
  useEffect(() => {
    if (!selectedChat) return;

    let cancelled = false;
    setLoadingThread(true);

    apiGet(`/conversations/${selectedChat}/messages`).then(({ ok, body }) => {
      if (cancelled) return;

      if (!ok) {
        setCurrentMessages([]);
        setLoadingThread(false);
        if (isUnauthenticated(body)) {
          endExpiredSession();
          return;
        }
        setError(body?.message || 'Could not load this conversation.');
        return;
      }

      setCurrentMessages(body.data ?? []);
      setLoadingThread(false);
      // Reading the thread clears its unread pill and the sidebar badge.
      loadConversations();
    });

    return () => {
      cancelled = true;
    };
  }, [selectedChat, loadConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages, selectedChat]);

  const bgClass = darkMode
  ? 'bg-[#12161f] text-slate-100'
  : 'bg-[#f1f3f6] text-slate-900';

const sidebarBg = darkMode
  ? 'bg-[#1a202c] border-slate-700/60'
  : 'bg-white border-slate-200 shadow-sm';

const cardBg = darkMode
  ? 'bg-[#1e2533] border-slate-700/60'
  : 'bg-white border-slate-200 shadow-sm';
  const textPrimary = darkMode ? 'text-white font-extrabold' : 'text-slate-900 font-extrabold';
  const textSecondary = darkMode ? 'text-slate-200 font-medium' : 'text-slate-600 font-medium';

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Find Tutors', icon: Search, path: '/find-tutors' },
    { name: 'Messages', icon: MessageSquare, badge: unreadTotal || undefined, path: '/messages' },
    { name: 'Notifications', icon: Bell, badge: 3, path: '/notifications' }, 
    { name: 'Settings', icon: Settings, path: '#' },
    { name: 'Help & Support', icon: HelpCircle, path: '#' },
  ];

  const handleSelectChat = (id) => {
    setSelectedChat(id);
    setError('');
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    const body = messageInput.trim();
    if (!body || !selectedChat || sending) return;

    setSending(true);
    const { ok, body: response } = await apiPost(`/conversations/${selectedChat}/messages`, { body });
    setSending(false);

    if (!ok) {
      if (isUnauthenticated(response)) {
        endExpiredSession();
        return;
      }
      setError(firstError(response, 'Could not send your message.'));
      return;
    }

    // Append the message the server actually stored rather than a local copy,
    // so ids and timestamps match what a reload would show.
    setCurrentMessages((prev) => [...prev, response.data]);
    setMessageInput('');
    loadConversations();
  };

  const filteredConversations = conversations.filter((conv) => {
    const name = conv.participant?.name ?? '';
    const department = conv.participant?.department ?? '';
    const term = searchQuery.toLowerCase();
    return name.toLowerCase().includes(term) || department.toLowerCase().includes(term);
  });

  const activeChatDetails = conversations.find((c) => c.id === selectedChat) ?? null;

  return (
    <div className={`min-h-screen w-full font-sans antialiased flex transition-colors duration-300 overflow-hidden ${bgClass}`}>
      
      {/* Sidebar */}
      <aside className={`w-64 shrink-0 flex flex-col justify-between p-6 border-r transition-colors duration-300 ${sidebarBg}`}>
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
            onClick={() => {
              setActiveMenu(item.name);
              if (item.path !== '#') navigate(item.path);
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
              <Icon
                size={16}
                className={
                  isActive
                    ? 'text-white'
                    : darkMode
                    ? 'text-slate-400'
                    : 'text-slate-500'
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

  {/* Bottom User Section */}
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
          Student • CSE 3.1
        </p>
      </div>
    </div>

    <button
      onClick={() => navigate('/tutor-dashboard')}
      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-2 text-xs font-bold transition shadow-sm"
    >
      Switch to Tutor Dashboard
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
      <main className="flex-grow flex flex-col h-screen p-4 lg:p-6 overflow-hidden space-y-4">
        
        {/* Top Header */}
        <header className="flex items-center justify-between shrink-0">
          <div>
            <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Messages
            </h2>
            <p className={`text-xs ${textSecondary}`}>Chat with tutors and manage your conversations.</p>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={toggleDarkMode} className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1f2937] text-slate-700 dark:text-white transition-all">
              {darkMode ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} />}
            </button>
            <button className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1f2937] text-slate-700 dark:text-white relative">
              <Bell size={15} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
            </button>

            <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200 dark:border-slate-800">
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120" alt="Profile" className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-500/20" />
              <div className="hidden sm:block">
                <h5 className={`text-xs ${textPrimary}`}>Ishrat Jahan Ifa</h5>
                <p className={`text-[10px] ${darkMode ? 'text-slate-400 font-medium' : 'text-slate-500 font-medium'}`}>Student</p>
              </div>
              <ChevronDown size={13} className="text-slate-400" />
            </div>
          </div>
        </header>

        {/* Messaging Layout Container */}
        <div className={`rounded-2xl border grid grid-cols-1 md:grid-cols-12 overflow-hidden shadow-sm h-[calc(100vh-110px)] ${cardBg}`}>
          
          {/* Left Column: Conversations List */}
          <div className={`md:col-span-5 lg:col-span-4 border-r flex flex-col h-full ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
            <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 space-y-2.5 shrink-0">
              <h3 className={`text-[11px] font-black uppercase tracking-wider ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}>Conversations</h3>
              <div className="flex items-center gap-2">
                <div className={`flex-grow flex items-center gap-2 px-3 py-1.5 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
                  <Search size={13} className="text-slate-400" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search messages..." 
                    className="bg-transparent border-none outline-none text-xs w-full" 
                  />
                </div>
                <button className={`p-2 rounded-xl border ${darkMode ? 'border-slate-700 bg-slate-900 text-slate-300' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
                  <SlidersHorizontal size={13} />
                </button>
              </div>
            </div>

            
            <div className="flex-grow overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
              {loadingList ? (
                <div className="p-6 text-center text-xs text-slate-400">Loading conversations…</div>
              ) : filteredConversations.length > 0 ? (
                filteredConversations.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectChat(item.id)}
                    className={`p-3.5 flex items-center gap-3 cursor-pointer transition-all ${
                      selectedChat === item.id
                        ? (darkMode ? 'bg-slate-800 border-l-4 border-emerald-500 shadow-inner' : 'bg-emerald-50/80 border-l-4 border-emerald-600')
                        : (darkMode ? 'hover:bg-slate-800/40 border-l-4 border-transparent' : 'hover:bg-slate-50 border-l-4 border-transparent')
                    }`}
                  >
                    <div className="relative shrink-0">
                      {item.participant?.avatar ? (
                        <img src={item.participant.avatar} alt={item.participant?.name} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-black">
                          {(item.participant?.name ?? '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h4 className={`text-xs truncate ${
                          selectedChat === item.id
                            ? (darkMode ? 'font-black text-emerald-400' : 'font-black text-emerald-700')
                            : (item.unread_count > 0
                                ? (darkMode ? 'font-black text-white' : 'font-black text-slate-900')
                                : (darkMode ? 'font-semibold text-slate-200' : 'font-medium text-slate-700'))
                        }`}>
                          {item.participant?.name ?? 'Unknown'}
                        </h4>
                        <span className={`text-[10px] shrink-0 font-medium ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}>
                          {item.last_message?.time ?? ''}
                        </span>
                      </div>
                      <p className={`text-[11px] truncate ${
                        item.unread_count > 0
                          ? (darkMode ? 'font-bold text-slate-100' : 'font-bold text-slate-900')
                          : (darkMode ? 'font-normal text-slate-400' : 'font-normal text-slate-500')
                      }`}>
                        {item.last_message
                          ? `${item.last_message.sent_by_me ? 'You: ' : ''}${item.last_message.body}`
                          : 'No messages yet'}
                      </p>
                    </div>
                    {item.unread_count > 0 && (
                      <span className="w-4.5 h-4.5 rounded-full bg-emerald-600 text-white text-[9px] font-black flex items-center justify-center shrink-0 px-1.5">
                        {item.unread_count}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-slate-400">No conversations found</div>
              )}
            </div>
          </div>


          <div className="md:col-span-7 lg:col-span-8 flex flex-col h-full bg-slate-50/50 dark:bg-[#1a2230]/40 overflow-hidden">

            {/* Chat Header */}
            {activeChatDetails && (
              <div className={`p-3.5 border-b flex items-center justify-between shrink-0 ${darkMode ? 'border-slate-800 bg-[#1f2937]' : 'border-slate-100 bg-white'}`}>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {activeChatDetails.participant?.avatar ? (
                      <img src={activeChatDetails.participant.avatar} alt="Active User" className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-black">
                        {(activeChatDetails.participant?.name ?? '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className={`text-xs font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      {activeChatDetails.participant?.name ?? 'Unknown'}
                    </h4>
                    <p className={`text-[10px] ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}>
                      {activeChatDetails.participant?.department ?? 'AUST'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 text-xs font-semibold text-rose-500 border-b border-rose-500/30">{error}</div>
            )}

            <div className="flex-grow p-4 overflow-y-auto space-y-3">
              {loadingThread ? (
                <div className="text-center text-xs text-slate-400 py-8">Loading messages…</div>
              ) : currentMessages.length === 0 ? (
                <div className="text-center text-xs text-slate-400 py-8">
                  No messages yet. Say hello to start the conversation.
                </div>
              ) : (
                currentMessages.map((msg) => (
                  <div key={msg.id} className={`flex flex-col ${msg.sent_by_me ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-md p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap break-words ${
                      msg.sent_by_me
                        ? 'bg-emerald-600 text-white rounded-br-none shadow-sm'
                        : (darkMode ? 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700/80 shadow-sm' : 'bg-white text-slate-800 rounded-bl-none shadow-sm border border-slate-100')
                    }`}>
                      {msg.body}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <span className={`text-[10px] font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}>{msg.time}</span>
                      {msg.sent_by_me && (
                        <CheckCheck size={12} className={msg.read ? 'text-emerald-500' : 'text-slate-400'} />
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            
            <form onSubmit={handleSendMessage} className={`p-3 border-t flex items-center gap-2 shrink-0 ${darkMode ? 'border-slate-800 bg-[#1f2937]' : 'border-slate-100 bg-white'}`}>
              <button type="button" className="text-slate-400 hover:text-emerald-600 transition">
                <Paperclip size={16} />
              </button>
              <div className={`flex-grow flex items-center gap-2 px-3.5 py-2 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
                <input 
                  type="text" 
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type a message..." 
                  className="bg-transparent border-none outline-none text-xs w-full"
                />
                <button type="button" className="text-slate-400 hover:text-emerald-600 transition">
                  <Smile size={16} />
                </button>
              </div>
              <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-xl transition shadow-md shadow-emerald-500/20">
                <Send size={15} />
              </button>
            </form>

          </div>

        </div>

      </main>
    </div>
  );
}