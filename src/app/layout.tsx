'use client'

import './globals.css'
import { ReactNode } from 'react'
import { Provider } from 'react-redux'
import { store } from '@/store'
import { ThemeProvider } from 'next-themes'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Provider store={store}>{children}</Provider>
        </ThemeProvider>
      </body>
    </html>
  )
}
