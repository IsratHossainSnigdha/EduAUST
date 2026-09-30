import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import ConversationItem from './ConversationItem';

/*
 * The list of people this account can talk to, filterable by where each one
 * stands. A tutor with a full inbox can jump to just the students waiting on
 * an answer; a student can see which tutors have opened up.
 */
const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'waiting', label: 'Waiting' },
  { key: 'new', label: 'New' },
];

function statusOf(c) {
  if (c.request_status === 'accepted' || (!c.locked && c.conversation_id)) return 'active';
  if (c.request_status === 'pending') return 'waiting';
  if (c.request_status === 'declined') return 'declined';

  return 'new';
}

export default function ConversationList({
  darkMode,
  conversations,
  selectedChat,
  searchQuery,
  setSearchQuery,
  onSelectChat,
  loading,
  currentRole = 'student',
  onOpenProfile,
}) {
  const [filter, setFilter] = useState('all');

  // How many sit in each bucket, so the chips can carry a count and empty
  // buckets can be dimmed rather than leading to a blank list.
  const counts = useMemo(() => {
    const c = { all: conversations.length, active: 0, waiting: 0, new: 0, declined: 0 };
    conversations.forEach((conv) => {
      c[statusOf(conv)] += 1;
    });

    return c;
  }, [conversations]);

  const filtered = useMemo(() => {
    const term = searchQuery.toLowerCase();

    return conversations.filter((conversation) => {
      const name = conversation.participant?.name ?? '';
      const department = conversation.participant?.department ?? '';

      const matchesSearch =
        name.toLowerCase().includes(term) || department.toLowerCase().includes(term);

      const matchesFilter = filter === 'all' || statusOf(conversation) === filter;

      return matchesSearch && matchesFilter;
    });
  }, [conversations, searchQuery, filter]);

  const emptyMessage =
    conversations.length === 0
      ? currentRole === 'tutor'
        ? 'No students yet. When a student sends you a request, they appear here.'
        : 'No tutors yet. Find a tutor and send a request to start chatting.'
      : 'No conversations match this filter.';

  return (
    <div
      className={`md:col-span-5 lg:col-span-4 border-r flex flex-col h-full ${
        darkMode ? 'border-slate-800' : 'border-slate-100'
      }`}
    >
      {/* Search + filters */}
      <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 space-y-2.5 shrink-0">
        <div className="flex items-center justify-between">
          <h3
            className={`text-[11px] font-black uppercase tracking-wider ${
              darkMode ? 'text-slate-300' : 'text-slate-500'
            }`}
          >
            Conversations
          </h3>
          <span className={`text-[10px] font-bold ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            {counts.all}
          </span>
        </div>

        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
            darkMode
              ? 'bg-slate-900 border-slate-700 text-white'
              : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}
        >
          <Search size={13} className="text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages..."
            className="bg-transparent border-none outline-none text-xs w-full"
          />
        </div>

        {/* Status filter chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {FILTERS.map((f) => {
            const active = filter === f.key;
            const count = counts[f.key];

            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full transition ${
                  active
                    ? 'bg-emerald-600 text-white'
                    : darkMode
                    ? 'bg-slate-800 text-slate-300 hover:text-white'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                {f.label}
                {f.key !== 'all' && count > 0 && (
                  <span className={active ? 'ml-1 opacity-80' : 'ml-1 opacity-60'}>{count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-grow overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
        {loading ? (
          <div className="p-6 text-center text-xs text-slate-400">Loading conversations…</div>
        ) : filtered.length > 0 ? (
          filtered.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              selected={selectedChat === conversation.id}
              darkMode={darkMode}
              onClick={() => onSelectChat(conversation)}
              onOpenProfile={onOpenProfile}
            />
          ))
        ) : (
          <div className="p-8 text-center text-xs text-slate-400 leading-relaxed">{emptyMessage}</div>
        )}
      </div>
    </div>
  );
}
