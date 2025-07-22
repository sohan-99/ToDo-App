import './globals.css';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { Providers } from './providers';
import Header from '@/components/Header';
import { Toaster } from '@/components/ui/Toaster';
export const metadata: Metadata = {
  title: 'TaskMaster - Manage Your Tasks',
  description: 'A simple task management application',
};
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1">{children}</main>
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
