import React, { useRef } from 'react';
import { Search } from 'lucide-react';

import HeaderActions from '../HeaderActions';
import { useSlashToFocus } from '../../lib/useSlashToFocus';

/*
 * The header most signed-in pages share: an optional search box on the left,
 * and the standard controls and account menu on the right.
 *
 * The controls used to be drawn here by hand, with a messages badge that was
 * the number 2 typed into the markup and a bell that trusted whatever count a
 * page chose to pass it. They come from HeaderActions now, which reads the
 * real counts itself.
 */
export default function TutorHeader({
  darkMode,
  toggleDarkMode,
  searchQuery = '',
  setSearchQuery = () => {},
  showSearch = true,
  searchPlaceholder = 'Search students, subjects or requests...',
}) {
  const searchRef = useRef(null);

  useSlashToFocus(searchRef, showSearch);

  const inputBg = darkMode
    ? 'bg-[#111827] border-slate-700 text-white placeholder-slate-400'
    : 'bg-slate-50 border-slate-200 text-slate-900';

  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      {showSearch && (
        <div className="relative max-w-md w-full">
          <Search
            aria-hidden="true"
            className={`absolute left-4 top-1/2 -translate-y-1/2 ${
              darkMode ? 'text-slate-400' : 'text-slate-500'
            }`}
            size={16}
          />

          <input
            ref={searchRef}
            type="search"
            aria-label="Search"
            aria-keyshortcuts="/"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-11 pr-12 py-2.5 rounded-2xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all ${inputBg}`}
          />

          {/* The shortcut is real now: "/" focuses this box. */}
          <kbd
            aria-hidden="true"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded"
          >
            /
          </kbd>
        </div>
      )}

      <div className={showSearch ? 'self-end md:self-auto' : 'self-end ml-auto'}>
        <HeaderActions darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      </div>
    </header>
  );
}
