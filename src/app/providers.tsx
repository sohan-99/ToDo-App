'use client';

import { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { ThemeProvider } from 'next-themes';
import { SessionProvider } from 'next-auth/react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider refetchInterval={0} refetchOnWindowFocus={false}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <Provider store={store}>{children}</Provider>
      </ThemeProvider>
    </SessionProvider>
  );
}
