'use client';

import { Toaster as SonnerToaster } from 'sonner';
import { useTheme } from 'next-themes';

export function Toaster() {
  const { theme } = useTheme();

  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        style: {
          background: theme === 'dark' ? '#333' : '#fff',
          color: theme === 'dark' ? '#fff' : '#333',
        },
      }}
    />
  );
}
