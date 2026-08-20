import React from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import ConversationItem from './ConversationItem';

export default function ConversationList({
  darkMode,
  conversations,
  selectedChat,
  searchQuery,
  setSearchQuery,
  onSelectChat,
  loading,
}) {
  const filteredConversations =
    conversations.filter((conversation) => {
      const name =
        conversation.participant?.name ?? '';

      const department =
        conversation.participant?.department ?? '';

      const term = searchQuery.toLowerCase();

      return (
        name.toLowerCase().includes(term) ||
        department.toLowerCase().includes(term)
      );
    });

  return (
    <div
      className={`md:col-span-5 lg:col-span-4 border-r flex flex-col h-full ${
        darkMode
          ? 'border-slate-800'
          : 'border-slate-100'
      }`}
    >
      {/* Search header */}
      <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 space-y-2.5 shrink-0">
        <h3
          className={`text-[11px] font-black uppercase tracking-wider ${
            darkMode
              ? 'text-slate-300'
              : 'text-slate-500'
          }`}
        >
          Conversations
        </h3>

        <div className="flex items-center gap-2">
          <div
            className={`flex-grow flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
              darkMode
                ? 'bg-slate-900 border-slate-700 text-white'
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <Search
              size={13}
              className="text-slate-400"
            />

            <input
              type="text"
              value={searchQuery}
              onChange={(e) =>
                setSearchQuery(e.target.value)
              }
              placeholder="Search messages..."
              className="bg-transparent border-none outline-none text-xs w-full"
            />
          </div>

          <button
            type="button"
            className={`p-2 rounded-xl border ${
              darkMode
                ? 'border-slate-700 bg-slate-900 text-slate-300'
                : 'border-slate-200 bg-slate-50 text-slate-600'
            }`}
          >
            <SlidersHorizontal size={13} />
          </button>
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-grow overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
        {loading ? (
          <div className="p-6 text-center text-xs text-slate-400">
            Loading conversations…
          </div>
        ) : filteredConversations.length > 0 ? (
          filteredConversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              selected={
                selectedChat === conversation.id
              }
              darkMode={darkMode}
              onClick={() =>
                onSelectChat(conversation.id)
              }
            />
          ))
        ) : (
          <div className="p-6 text-center text-xs text-slate-400">
            No conversations found
          </div>
        )}
      </div>
    </div>
  );
}