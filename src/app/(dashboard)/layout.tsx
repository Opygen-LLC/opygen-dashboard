'use client';

import React from 'react';
import { useSession } from 'next-auth/react';

export default function RootDashboardLayout({ children }: { children: React.ReactNode }) {
  const { status } = useSession();

  if (status === 'loading') {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
