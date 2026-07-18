'use client';

import React from 'react';
import { SessionProvider } from 'next-auth/react';
import QueryProvider from './QueryProvider';
import { ThemeProvider } from './ThemeProvider';
import { Toaster } from 'sonner';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <QueryProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster position="bottom-right" richColors closeButton />
        </ThemeProvider>
      </QueryProvider>
    </SessionProvider>
  );
}
