'use client';

import React from 'react';
import { SessionProvider } from 'next-auth/react';
import { Provider as ReduxProvider } from 'react-redux';
import { store } from '@/store';
import QueryProvider from './QueryProvider';
import { ThemeProvider } from './ThemeProvider';
import { Toaster } from 'sonner';
import UserInitializer from './UserInitializer';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ReduxProvider store={store}>
      <SessionProvider>
        <QueryProvider>
          <UserInitializer>
            {children}
            <Toaster position="bottom-right" richColors closeButton />
          </UserInitializer>
        </QueryProvider>
      </SessionProvider>
    </ReduxProvider>
  );
}
