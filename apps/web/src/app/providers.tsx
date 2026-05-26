'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { useState, useEffect, createContext, useContext } from 'react';

const ThemeContext = createContext<{ theme: string; setTheme: (t: string) => void }>({
  theme: 'light',
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState('light');

  useEffect(() => {
    const stored = localStorage.getItem('petid-theme') ?? 'light';
    setThemeState(stored);
    document.documentElement.classList.toggle('dark', stored === 'dark');
  }, []);

  const setTheme = (t: string) => {
    setThemeState(t);
    localStorage.setItem('petid-theme', t);
    document.documentElement.classList.toggle('dark', t === 'dark');
  };

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, retry: 1 } } }),
  );

  return (
    <ThemeProvider>
      <SessionProvider>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
