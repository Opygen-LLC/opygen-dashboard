'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useAppDispatch, useAppSelector } from '@/store';
import { setUserProfile } from '@/store/userSlice';

export default function UserInitializer({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const dispatch = useAppDispatch();
  const isInitialized = useAppSelector((state) => state.user.isInitialized);

  useEffect(() => {
    // Only fetch if we have an active session and haven't initialized yet
    if (status === 'authenticated' && session?.user?.id && !isInitialized) {
      const fetchProfile = async () => {
        try {
          const res = await fetch('/api/users/profile');
          if (res.ok) {
            const data = await res.json();
            // Data returned is the user object directly from GET /api/users/profile
            dispatch(setUserProfile({
              id: data._id,
              name: data.name,
              email: data.email,
              avatarUrl: data.avatarUrl,
              mobileNumber: data.mobileNumber,
              role: data.role,
              balance: data.balance,
              status: data.status,
            }));
          }
        } catch (error) {
          console.error('Failed to initialize user profile from DB:', error);
        }
      };

      fetchProfile();
    }
  }, [status, session?.user?.id, isInitialized, dispatch]);

  return <>{children}</>;
}
