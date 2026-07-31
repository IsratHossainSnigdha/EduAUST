import React, { useState, useRef, useEffect } from 'react';
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
  CheckCheck
} from 'lucide-react';

export default function MessagesPage({ darkMode, toggleDarkMode }) {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState('Messages');
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const messagesEndRef = useRef(null);


  const [selectedChat, setSelectedChat] = useState(() => {
    const saved = localStorage.getItem('eduAust_selectedChat');
    return saved ? JSON.parse(saved) : 1;
  });

  const [conversations, setConversations] = useState(() => {
    const saved = localStorage.getItem('eduAust_conversations');
    return saved ? JSON.parse(saved) : [
      {
        id: 1,
        name: 'Fahim Rahman',
        role: 'CSE, AUST • Data Structures, Algorithms',
        rating: '4.9',
        lastMessage: 'Sure! How about Wednesday evening at 7 PM?',
        time: '10:30 AM',
        unread: 2,
        online: true,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120'
      },
      {
        id: 2,
        name: 'Sadia Tasnim',
        role: 'EEE, AUST • Calculus, Physics',
        rating: '4.8',
        lastMessage: 'Sounds good! I’ll send the meeting link.',
        time: 'Yesterday',
        unread: 1,
        online: false,
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120'
      },
      {
        id: 3,
        name: 'Raihan Ahmed',
        role: 'ME, AUST • Mechanics',
        rating: '4.7',
        lastMessage: 'You: Okay, thank you!',
        time: 'Mon',
        unread: 0,
        online: true,
        avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=120'
      },
      {
        id: 4,
        name: 'Nusrat Jahan',
        role: 'CSE, AUST • Database Systems',
        rating: '5.0',
        lastMessage: 'Can we reschedule to tomorrow?',
        time: 'Mon',
        unread: 1,
        online: false,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120'
      },
      {
        id: 5,
        name: 'Tanvir Hasan',
        role: 'CE, AUST • Physics, Mathematics',
        rating: '4.6',
        lastMessage: 'Thanks! I will check it out.',
        time: '18 May',
        unread: 0,
        online: true,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120'
      }
    ];
  });


  const [chatMessages, setChatMessages] = useState(() => {
    const saved = localStorage.getItem('eduAust_chatMessages');
    return saved ? JSON.parse(saved) : {
      1: [
        { id: 1, sender: 'them', text: 'Hi Israt! I’m happy to see you’re interested in my tutoring.', time: '10:28 AM', dateLabel: 'Today', seen: true },
        { id: 2, sender: 'me', text: 'Hi Fahim! Yes, I need help with Data Structures. Are you available this week?', time: '10:29 AM', dateLabel: 'Today', seen: true },
        { id: 3, sender: 'them', text: 'Yes, I’m available on weekdays after 6 PM. Which time works best for you?', time: '10:29 AM', dateLabel: 'Today', seen: true },
        { id: 4, sender: 'me', text: 'How about Wednesday evening at 7 PM?', time: '10:30 AM', dateLabel: 'Today', seen: true },
        { id: 5, sender: 'them', text: 'Sure! How about Wednesday evening at 7 PM?', time: '10:30 AM', dateLabel: 'Today', seen: true }
      ],
      2: [
        { id: 1, sender: 'them', text: 'Hello! Let me know if you need help with Calculus.', time: 'Yesterday', dateLabel: 'Yesterday', seen: true },
        { id: 2, sender: 'me', text: 'Sure! I need help with integration.', time: 'Yesterday', dateLabel: 'Yesterday', seen: true },
        { id: 3, sender: 'them', text: 'Sounds good! I’ll send the meeting link.', time: 'Yesterday', dateLabel: 'Yesterday', seen: true }
      ],
      3: [
        { id: 1, sender: 'me', text: 'Okay, thank you!', time: 'Mon', dateLabel: 'Monday', seen: false }
      ],
      4: [
        { id: 1, sender: 'them', text: 'Can we reschedule to tomorrow?', time: 'Mon', dateLabel: 'Monday', seen: true }
      ],
      5: [
        { id: 1, sender: 'them', text: 'Thanks! I will check it out.', time: '18 May', dateLabel: '18 May', seen: true }
      ]
    };
  });

 
  useEffect(() => {
    localStorage.setItem('eduAust_selectedChat', JSON.stringify(selectedChat));
  }, [selectedChat]);

  
  useEffect(() => {
    localStorage.setItem('eduAust_conversations', JSON.stringify(conversations));
  }, [conversations]);


  useEffect(() => {
    localStorage.setItem('eduAust_chatMessages', JSON.stringify(chatMessages));
  }, [chatMessages]);

  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, selectedChat]);

  const bgClass = darkMode ? 'bg-[#0b0f19] text-slate-150' : 'bg-slate-50 text-slate-950';
  const sidebarBg = darkMode ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-100';
  const cardBg = darkMode ? 'bg-[#1f2937] border-slate-800' : 'bg-white border-slate-100';
  const textPrimary = darkMode ? 'text-white font-extrabold' : 'text-slate-900 font-extrabold';
  const textSecondary = darkMode ? 'text-slate-200 font-medium' : 'text-slate-600 font-medium';

  const menuItems = [
    { name: 'Home', icon: Home, path: '/dashboard' },
    { name: 'Find Tutors', icon: Search, path: '/find-tutors' },
    { name: 'Messages', icon: MessageSquare, badge: 2, path: '/messages' },
    { name: 'My Requests', icon: UserPlus, path: '/my-requests' },
    { name: 'Settings', icon: Settings, path: '/settings' },
  ];

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSelectChat = (id) => {
    setSelectedChat(id);
    setConversations(prev =>
      prev.map(conv => conv.id === id ? { ...conv, unread: 0 } : conv)
    );

    setChatMessages(prev => {
      const targetConv = conversations.find(c => c.id === id);
      const isUserOnline = targetConv ? targetConv.online : false;

      const messages = prev[id] || [];
      const updatedMessages = messages.map(msg => 
        (msg.sender === 'me' && isUserOnline) ? { ...msg, seen: true } : msg
      );
      return { ...prev, [id]: updatedMessages };
    });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    const newMessage = {
      id: Date.now(),
      sender: 'me',
      text: messageInput,
      time: getCurrentTime(),
      dateLabel: 'Today',
      seen: false 
    };

    setChatMessages(prev => ({
      ...prev,
      [selectedChat]: [...(prev[selectedChat] || []), newMessage]
    }));

    setConversations(prev => {
      const currentConv = prev.find(conv => conv.id === selectedChat);
      if (!currentConv) return prev;

      const updatedConv = {
        ...currentConv,
        lastMessage: `You: ${messageInput}`,
        time: getCurrentTime(),
        unread: 0
      };

      const otherConvs = prev.filter(conv => conv.id !== selectedChat);
      return [updatedConv, ...otherConvs];
    });

    setMessageInput('');

    
    const currentConv = conversations.find(c => c.id === selectedChat);
    if (currentConv && currentConv.online) {
      setTimeout(() => {
        setChatMessages(prev => {
          const currentMsgs = prev[selectedChat] || [];
          const updated = currentMsgs.map(msg => 
            msg.id === newMessage.id ? { ...msg, seen: true } : msg
          );
          return { ...prev, [selectedChat]: updated };
        });
      }, 2000);
    }
  };


  const filteredConversations = conversations.filter(conv => 
    conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeChatDetails = conversations.find(c => c.id === selectedChat) || conversations[0];
  const currentMessages = chatMessages[selectedChat] || [];

  return (
    <div className={`min-h-screen w-full font-sans antialiased flex transition-colors duration-300 overflow-hidden ${bgClass}`}>
      
      {/* Sidebar */}
      <aside className={`w-64 shrink-0 flex flex-col p-5 border-r transition-colors duration-300 ${sidebarBg}`}>
        <div>
          <div className="flex items-center gap-3 cursor-pointer mb-6" onClick={() => navigate('/')}>
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
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all ${
                    isActive 
                      ? 'bg-emerald-600 text-white shadow-md' 
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
              {filteredConversations.length > 0 ? (
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
                      <img src={item.avatar} alt={item.name} className="w-10 h-10 rounded-full object-cover" />
                      {item.online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />}
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h4 className={`text-xs truncate ${
                          selectedChat === item.id
                            ? (darkMode ? 'font-black text-emerald-400' : 'font-black text-emerald-700')
                            : (item.unread > 0 
                                ? (darkMode ? 'font-black text-white' : 'font-black text-slate-900') 
                                : (darkMode ? 'font-semibold text-slate-200' : 'font-medium text-slate-700'))
                        }`}>
                          {item.name}
                        </h4>
                        <span className={`text-[10px] shrink-0 font-medium ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}>{item.time}</span>
                      </div>
                      <p className={`text-[11px] truncate ${
                        item.unread > 0 
                          ? (darkMode ? 'font-bold text-slate-100' : 'font-bold text-slate-900') 
                          : (darkMode ? 'font-normal text-slate-400' : 'font-normal text-slate-500')
                      }`}>
                        {item.lastMessage}
                      </p>
                    </div>
                    {item.unread > 0 && (
                      <span className="w-4.5 h-4.5 rounded-full bg-emerald-600 text-white text-[9px] font-black flex items-center justify-center shrink-0">
                        {item.unread}
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
            <div className={`p-3.5 border-b flex items-center justify-between shrink-0 ${darkMode ? 'border-slate-800 bg-[#1f2937]' : 'border-slate-100 bg-white'}`}>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img src={activeChatDetails.avatar} alt="Active User" className="w-9 h-9 rounded-full object-cover" />
                  {activeChatDetails.online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className={`text-xs font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{activeChatDetails.name}</h4>
                    <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-600 px-1.5 py-0.2 rounded text-[10px] font-bold">
                      <Star size={10} className="fill-emerald-500" /> {activeChatDetails.rating}
                    </span>
                  </div>
                  <p className={`text-[10px] ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}>
                    {activeChatDetails.role} • {activeChatDetails.online ? <span className="text-emerald-500 font-bold">Online</span> : <span className="text-slate-400 font-normal">Offline</span>}
                  </p>
                </div>
              </div>
            </div>

            
            <div className="flex-grow p-4 overflow-y-auto space-y-3">
              {currentMessages.map((msg, index) => {
                const showDateBadge = index === 0 || currentMessages[index - 1].dateLabel !== msg.dateLabel;

                return (
                  <React.Fragment key={msg.id}>
                    {showDateBadge && (
                      <div className="text-center my-2">
                        <span className={`text-[10px] px-3 py-1 rounded-full font-bold shadow-sm ${
                          darkMode ? 'bg-slate-800 text-slate-200 border border-slate-700' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {msg.dateLabel}
                        </span>
                      </div>
                    )}
                    <div className={`flex flex-col ${msg.sender === 'me' ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-md p-3 rounded-2xl text-xs leading-relaxed ${
                        msg.sender === 'me' 
                          ? 'bg-emerald-600 text-white rounded-br-none shadow-sm' 
                          : (darkMode ? 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700/80 shadow-sm' : 'bg-white text-slate-800 rounded-bl-none shadow-sm border border-slate-100')
                      }`}>
                        {msg.text}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <span className={`text-[10px] font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}>{msg.time}</span>
                        {msg.sender === 'me' && (
                          <CheckCheck size={12} className={msg.seen ? 'text-emerald-500' : 'text-slate-400'} />
                        )}
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
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