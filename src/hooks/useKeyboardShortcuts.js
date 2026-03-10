import { useEffect } from 'react';

function shouldIgnore(target) {
  if (!target) return false;
  const tag = target.tagName?.toLowerCase();
  return tag === 'input' || tag === 'textarea' || target.isContentEditable;
}

export function useKeyboardShortcuts(map) {
  useEffect(() => {
    const onKeyDown = (e) => {
      if (shouldIgnore(e.target)) return;
      const key = e.key.toLowerCase();
      const fn = map[key];
      if (!fn) return;
      e.preventDefault();
      fn();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [map]);
}
