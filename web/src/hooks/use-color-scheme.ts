import { useSyncExternalStore } from 'react';

const darkQuery = '(prefers-color-scheme: dark)';

const subscribe = (onChange: () => void) => {
  const media = window.matchMedia(darkQuery);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
};

export const useColorScheme = (): 'light' | 'dark' =>
  useSyncExternalStore(
    subscribe,
    () => (window.matchMedia(darkQuery).matches ? 'dark' : 'light'),
    () => 'light'
  );
