import { useCurrentUser } from '../../lib/useCurrentUser';
import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { buildDashboardMenu } from '../../lib/dashboardMenu';

import {
  LogOut,
} from 'lucide-react';

import {
  apiDelete,
  apiGet,
  apiPost,
  clearAuth,
  firstError,
  isUnauthenticated,
} from '../../lib/auth';

import { useRole, setRole, STUDENT, TUTOR } from '../../lib/useRole';
import ConversationList from '../../components/Messages/ConversationList';
import ChatHeader from '../../components/Messages/ChatHeader';
import MessageBubble from '../../components/Messages/MessageBubble';
import MessageComposer from '../../components/Messages/MessageComposer';
import RequestPanel from '../../components/Messages/RequestPanel';
import ProfileModal from '../../components/Messages/ProfileModal';
import UserAvatar from '../../components/UserAvatar';
import MessagesHeader from '../../components/Messages/MessagesHeader';
import './MessagesPage.css';

export default function MessagesPage({
  darkMode,
  toggleDarkMode,
}) {
  const navigate = useNavigate();
  const { user: currentUser } = useCurrentUser();
  // Whose chat list this is: a tutor sees the students who approached them.
  const { role: currentRole } = useRole();

  const [activeMenu, setActiveMenu] =
    useState('Messages');

  const [messageInput, setMessageInput] =
    useState('');

  const [searchQuery, setSearchQuery] =
    useState('');

  const messagesEndRef = useRef(null);

  // The locked contact whose request form is open, if any.
  const [requesting, setRequesting] = useState(null);

  // A tutor's teaching counts, for the summary strip above the chat list.
  const [teachStats, setTeachStats] = useState(null);

  // Whose profile is open, if any — set by tapping an avatar.
  const [profileUserId, setProfileUserId] = useState(null);

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
      // Every tutor appears here, not just the ones already talking: locked
      // entries show who is available and what is still needed to reach them.
      // The role decides whose list this is — a tutor sees the students who
      // approached them, a student the tutors they can reach — and the server
      // returns it already ordered: working with, then waiting, then the rest.
      const { ok, body } =
        await apiGet(`/conversations/contacts?role=${currentRole === 'tutor' ? 'tutor' : 'student'}`);

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

      const contacts = (body.data ?? []).map((contact) => ({
        // Locked contacts have no thread yet, so the row is keyed by person.
        id: contact.conversation_id ?? `user:${contact.user_id}`,
        conversation_id: contact.conversation_id,
        user_id: contact.user_id,
        locked: contact.locked,
        // null, 'pending', 'accepted' or 'declined' — what the row offers
        // depends on it: ask, wait, or open the thread.
        request_status: contact.request_status ?? null,
        request_id: contact.request_id ?? null,
        is_tutor: contact.is_tutor,
        participant: {
          id: contact.user_id,
          name: contact.name,
          avatar: contact.avatar,
          department: contact.department,
          headline: contact.headline,
        },
        last_message: contact.last_message,
        last_message_at: contact.last_message_at,
        unread_count: contact.unread_count ?? 0,
      }));

      setConversations(contacts);
      setUnreadTotal(
        contacts.reduce((total, c) => total + (c.unread_count ?? 0), 0)
      );
      setLoadingList(false);
    }, [endExpiredSession, currentRole]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // The teaching counts are a tutor-only concern; refetched after the contact
  // list changes so removing a student updates the strip.
  useEffect(() => {
    if (currentRole !== 'tutor') {
      setTeachStats(null);

      return undefined;
    }

    let cancelled = false;

    apiGet('/tutor/dashboard').then(({ ok, body }) => {
      if (!cancelled && ok) setTeachStats(body?.stats ?? null);
    });

    return () => {
      cancelled = true;
    };
  }, [currentRole, conversations]);

  useEffect(() => {
    if (
      selectedChat === null &&
      conversations.length > 0
    ) {
      // Only an unlocked thread can be opened automatically.
      const first = conversations.find((c) => !c.locked && c.conversation_id);
      if (first) setSelectedChat(first.conversation_id);
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

  const handleSelectChat = async (contact) => {
    setError('');

    // A tutor who has not accepted cannot be messaged yet, but the student is
    // right here wanting to talk to them — so the panel offers the request
    // rather than only explaining why the thread is shut.
    if (contact.locked) {
      setSelectedChat(null);
      setRequesting(contact);

      return;
    }

    setRequesting(null);

    if (contact.conversation_id) {
      setSelectedChat(contact.conversation_id);

      return;
    }

    // Unlocked but never opened: create the thread on first click.
    const { ok, body } = await apiPost('/conversations', {
      user_id: contact.user_id,
    });

    if (!ok) {
      setError(body?.message || 'Could not open that conversation.');

      return;
    }

    setSelectedChat(body?.data?.id ?? null);
    loadConversations();
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

  // A tutor ending an arrangement with a student they currently teach. The
  // student stays in the list (the thread and its history remain) but stops
  // being someone the tutor is teaching.
  const handleRemoveStudent = async (contact) => {
    if (!contact?.request_id) return;

    const { ok, body } = await apiDelete(`/tuition-requests/${contact.request_id}`);

    if (!ok) {
      setError(firstError(body, 'Could not remove that student.'));

      return;
    }

    loadConversations();
  };

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

          {/* Navigation
              The entries come from the one shared list, so this page cannot
              drift from the others the way it did when every page kept its
              own copy. */}
          <nav className="space-y-1.5">
            {buildDashboardMenu({
              role: currentRole,
              badges: { messages: unreadTotal, notifications: unreadTotal },
            }).map((item) => {
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
            <UserAvatar user={currentUser} size={40} />

            <div>
              <h4
                className={`text-xs ${
                  darkMode
                    ? 'text-white font-extrabold'
                    : 'text-slate-900 font-extrabold'
                }`}
              >
                {currentUser?.name || 'Loading…'}
              </h4>

              <p
                className={`text-[10px] ${
                  darkMode
                    ? 'text-slate-400 font-semibold'
                    : 'text-slate-500 font-semibold'
                }`}
              >
                {/* The active dashboard, not just what the account can be:
                    a tutor working in tutor mode reads "Tutor" here. */}
                {currentRole === 'tutor'
                  ? 'Tutor'
                  : ['Student', currentUser?.department, currentUser?.semester]
                      .filter(Boolean)
                      .join(' · ')}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              // From tutor mode the switch goes back to the student side;
              // from student mode it goes to the tutor dashboard, or to sign
              // up as a tutor when the account does not tutor yet.
              if (currentRole === 'tutor') {
                setRole(STUDENT);
                navigate('/dashboard');
              } else if (currentUser?.isTutor) {
                setRole(TUTOR);
                navigate('/tutor-dashboard');
              } else {
                navigate('/become-a-tutor');
              }
            }}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-2 text-xs font-bold transition shadow-sm"
          >
            {currentRole === 'tutor'
              ? 'Switch to Student Dashboard'
              : currentUser?.isTutor
                ? 'Switch to Tutor Dashboard'
                : 'Become a Tutor'}
          </button>

          <button
            onClick={() => { clearAuth(); navigate('/login', { replace: true }); }}
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
          currentRole={currentRole}
        />

        {/* A tutor's teaching at a glance: who they are teaching now, and how
            many they have taught in total. */}
        {currentRole === 'tutor' && teachStats && (
          <div className="flex items-center gap-3">
            <div
              className={`flex-1 rounded-2xl border px-4 py-3 ${
                darkMode ? 'bg-[#1f2937] border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Currently teaching
              </p>
              <p className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {teachStats.currently_teaching ?? 0}
              </p>
            </div>

            <div
              className={`flex-1 rounded-2xl border px-4 py-3 ${
                darkMode ? 'bg-[#1f2937] border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Students taught
              </p>
              <p className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {teachStats.students_taught ?? 0}
              </p>
            </div>
          </div>
        )}

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
            currentRole={currentRole}
            onOpenProfile={setProfileUserId}
          />

          {/* Chat pane */}
          <div className="chat-pane-container bg-slate-50/50 dark:bg-[#1a2230]/40">
            <ChatHeader
              activeChat={activeChatDetails}
              darkMode={darkMode}
              currentRole={currentRole}
              onRemoveStudent={handleRemoveStudent}
              onOpenProfile={setProfileUserId}
            />

            {/* Error */}
            {error && (
              <div className="p-3 text-xs font-semibold text-rose-500 border-b border-rose-500/30">
                {error}
              </div>
            )}

            {/* A locked tutor: ask them here rather than sending the student
                off to the listing to find the same person again. */}
            {requesting ? (
              <RequestPanel
                darkMode={darkMode}
                contact={requesting}
                onSent={() => {
                  setRequesting((c) => (c ? { ...c, request_status: 'pending' } : c));
                  loadConversations();
                }}
              />
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      </main>

      {/* Tapping an avatar opens the other person's profile, and — where the
          two have worked together — the rating form, either direction. */}
      <ProfileModal
        darkMode={darkMode}
        userId={profileUserId}
        onClose={() => setProfileUserId(null)}
        onReviewed={loadConversations}
      />
    </div>
  );
}