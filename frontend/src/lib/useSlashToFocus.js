import { useEffect } from 'react';

/*
 * Press "/" anywhere on the page to jump to its search box.
 *
 * Both search boxes displayed a "⌘ /" hint and nothing listened for it, so
 * the shortcut they advertised did nothing. It is plain "/" here, the way
 * GitHub and YouTube do it, which also works on the Windows machines most
 * students use rather than only on a Mac.
 */
export function useSlashToFocus(inputRef, enabled = true) {
  useEffect(() => {
    if (!enabled) return undefined;

    const onKeyDown = (event) => {
      if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return;

      // Typing a slash into a field must still type a slash.
      const target = event.target;
      const tag = target?.tagName;

      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        target?.isContentEditable
      ) {
        return;
      }

      if (!inputRef.current) return;

      event.preventDefault();
      inputRef.current.focus();
      inputRef.current.select();
    };

    document.addEventListener('keydown', onKeyDown);

    return () => document.removeEventListener('keydown', onKeyDown);
  }, [inputRef, enabled]);
}
