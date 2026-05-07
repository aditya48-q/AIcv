import { useEffect, useState } from 'react';

export function useThemeMode() {
  const [mode, setMode] = useState<'dark' | 'ice'>('ice');

  useEffect(() => {
    document.documentElement.dataset.theme = mode;
  }, [mode]);

  return {
    mode,
    toggleMode: () => setMode((current) => (current === 'dark' ? 'ice' : 'dark')),
  };
}
