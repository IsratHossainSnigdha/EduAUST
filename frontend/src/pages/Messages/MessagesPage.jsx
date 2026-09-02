import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import { useNavigate } from 'react-router-dom';

import {
  LayoutDashboard,
  MessageSquare,
  Bell,
  Settings,
  LogOut,
  HelpCircle,
  Search,
} from 'lucide-react';

import {
  apiGet,
  apiPost,
  clearAuth,
  firstError,
  isUnauthenticated,
} from '../../lib/auth';

import ConversationList from '../../components/Messages/ConversationList';
import ChatHeader from '../../components/Messages/ChatHeader';
import MessageBubble from '../../components/Messages/MessageBubble';
import MessageComposer from '../../components/Messages/MessageComposer';
import MessagesHeader from '../../components/Messages/MessagesHeader';
import './MessagesPage.css';

export default function MessagesPage({
  darkMode,
  toggleDarkMode,
}) {
  const navigate = useNavigate();

  const [activeMenu, setActiveMenu] =
    useState('Messages');

  const [messageInput, setMessageInput] =
    useState('');

  const [searchQuery, setSearchQuery] =
    useState('');

  const messagesEndRef = useRef(null);

  const [selectedChat, setSelectedChat] =
    useState(null);

  const [conversations, setConversations] =
    useState([]);

  const [currentMessages, setCurrentMessages] =
    useState([]);

  const [unreadTotal, setUnreadTotal] =
    useState(0);

  const [loadingList, setLoadingList] =
    useState(true);

  const [loadingThread, setLoadingThread] =
    useState(false);

  const [sending, setSending] =
    useState(false);

  const [error, setError] =
    useState('');

  const endExpiredSession =
    useCallback(() => {
      clearAuth();
      navigate('/login');
    }, [navigate]);

  const loadConversations =
    useCallback(async () => {
      const { ok, body } =
        await apiGet('/conversations');

      if (!ok) {
        setLoadingList(false);

        if (isUnauthenticated(body)) {
          endExpiredSession();
          return;
        }

        setError(
          body?.message ||
            'Could not load conversations.'
        );

        return;
      }

      setConversations(body.data ?? []);
      setUnreadTotal(body.unread_total ?? 0);
      setLoadingList(false);
    }, [endExpiredSession]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (
      selectedChat === null &&
      conversations.length > 0
    ) {
      setSelectedChat(conversations[0].id);
    }
  }, [conversations, selectedChat]);

  useEffect(() => {
    if (!selectedChat) return;

    let cancelled = false;

    setLoadingThread(true);

    apiGet(
      `/conversations/${selectedChat}/messages`
    ).then(({ ok, body }) => {
      if (cancelled) return;

      if (!ok) {
        setCurrentMessages([]);
        setLoadingThread(false);

        if (isUnauthenticated(body)) {
          endExpiredSession();
          return;
        }

        setError(
          body?.message ||
            'Could not load this conversation.'
        );

        return;
      }

      setCurrentMessages(body.data ?? []);
      setLoadingThread(false);

      loadConversations();
    });

    return () => {
      cancelled = true;
    };
  }, [
    selectedChat,
    loadConversations,
    endExpiredSession,
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [currentMessages, selectedChat]);

  const handleSelectChat = (id) => {
    setSelectedChat(id);
    setError('');
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    const body = messageInput.trim();

    if (
      !body ||
      !selectedChat ||
      sending
    ) {
      return;
    }

    setSending(true);

    const {
      ok,
      body: response,
    } = await apiPost(
      `/conversations/${selectedChat}/messages`,
      {
        body,
      }
    );

    setSending(false);

    if (!ok) {
      if (isUnauthenticated(response)) {
        endExpiredSession();
        return;
      }

      setError(
        firstError(
          response,
          'Could not send your message.'
        )
      );

      return;
    }

    setCurrentMessages((previous) => [
      ...previous,
      response.data,
    ]);

    setMessageInput('');

    loadConversations();
  };

  const activeChatDetails =
    conversations.find(
      (conversation) =>
        conversation.id === selectedChat
    ) ?? null;

  const bgClass = darkMode
    ? 'bg-[#12161f] text-slate-100'
    : 'bg-[#f1f3f6] text-slate-900';

  const cardBg = darkMode
    ? 'bg-[#1e2533] border-slate-700/60'
    : 'bg-white border-slate-200 shadow-sm';

  return (
    <div
      className={`messages-container ${bgClass}`}
    >
      {/* Sidebar */}
      <aside
        className={`messages-sidebar ${
          darkMode
            ? 'bg-[#1a202c] border-slate-700/60'
            : 'bg-white border-slate-200 shadow-sm'
        }`}
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
            {[
              {
                name: 'Dashboard',
                icon: LayoutDashboard,
                path: '/dashboard',
              },
              {
                name: 'Find Tutors',
                icon: Search,
                path: '/find-tutors',
              },
              {
                name: 'Messages',
                icon: MessageSquare,
                badge:
                  unreadTotal || undefined,
                path: '/messages',
              },
              {
                name: 'Notifications',
                icon: Bell,
                badge: 3,
                path: '/notifications',
              },
              {
                name: 'Settings',
                icon: Settings,
                path: '#',
              },
              {
                name: 'Help & Support',
                icon: HelpCircle,
                path: '#',
              },
            ].map((item) => {
              const Icon = item.icon;

              const isActive =
                activeMenu === item.name;

              return (
                <button
                  key={item.name}
                  onClick={() => {
                    setActiveMenu(item.name);

                    if (
                      item.path !== '#'
                    ) {
                      navigate(item.path);
                    }
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

        {/* User section */}
        <div
          className={`pt-6 border-t ${
            darkMode
              ? 'border-slate-700/60'
              : 'border-slate-200'
          } space-y-4`}
        >
          <div className="flex items-center gap-3">
            <img
              src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120"
              alt="User"
              className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500/30"
            />

            <div>
              <h4
                className={`text-xs ${
                  darkMode
                    ? 'text-white font-extrabold'
                    : 'text-slate-900 font-extrabold'
                }`}
              >
                Ishrat Jahan Ifa
              </h4>

              <p
                className={`text-[10px] ${
                  darkMode
                    ? 'text-slate-400 font-semibold'
                    : 'text-slate-500 font-semibold'
                }`}
              >
                Student • CSE 3.1
              </p>
            </div>
          </div>

          <button
            onClick={() =>
              navigate('/tutor-dashboard')
            }
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

      {/* Main */}
      <main className="messages-main">
        <MessagesHeader
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
        />

        {/* Messaging layout */}
        <div
          className={`messages-layout-grid ${cardBg}`}
        >
          <ConversationList
            darkMode={darkMode}
            conversations={conversations}
            selectedChat={selectedChat}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSelectChat={handleSelectChat}
            loading={loadingList}
          />

          {/* Chat pane */}
          <div className="chat-pane-container bg-slate-50/50 dark:bg-[#1a2230]/40">
            <ChatHeader
              activeChat={activeChatDetails}
              darkMode={darkMode}
            />

            {/* Error */}
            {error && (
              <div className="p-3 text-xs font-semibold text-rose-500 border-b border-rose-500/30">
                {error}
              </div>
            )}

            {/* Messages */}
            <div className="chat-messages-container space-y-3">
              {loadingThread ? (
                <div className="text-center text-xs text-slate-400 py-8">
                  Loading messages…
                </div>
              ) : currentMessages.length ===
                0 ? (
                <div className="text-center text-xs text-slate-400 py-8">
                  No messages yet. Say hello to start
                  the conversation.
                </div>
              ) : (
                currentMessages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    darkMode={darkMode}
                  />
                ))
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Composer */}
            <MessageComposer
              darkMode={darkMode}
              messageInput={messageInput}
              setMessageInput={setMessageInput}
              onSubmit={handleSendMessage}
              sending={sending}
            />
          </div>
        </div>
      </main>
    </div>
  );
}