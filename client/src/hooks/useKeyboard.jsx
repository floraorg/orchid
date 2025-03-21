import { useEffect } from 'react';

export function useKeyboard(shortcuts) {
  const parseShortcut = (shortcut) => {
    const parts = shortcut.toLowerCase().split(' ');
    const key = parts.pop();
    const modifiers = parts; 
    return { modifiers, key };
  };

  useEffect(() => {
    const parsedShortcuts = Object.entries(shortcuts).map(([shortcut, callback]) => ({
      ...parseShortcut(shortcut),
      callback,
    }));

    const handleKeyDown = (event) => {
      for (const shortcut of parsedShortcuts) {
        const { modifiers, key, callback } = shortcut;
        const isMatch = modifiers.every((mod) => event[`${mod}Key`]) && event.key.toLowerCase() === key;
        if (isMatch) {
          event.preventDefault();
          callback();
          break; 
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts]); 
}