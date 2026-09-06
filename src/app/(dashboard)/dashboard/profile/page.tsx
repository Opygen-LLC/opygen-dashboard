import React, { Suspense } from 'react';
import UserProfileView from '@/components/dashboard/UserProfileView';
import { Loading } from '@/components/ui/Loading';

export default function MemberProfilePage() {
  return (
    <Suspense fallback={<Loading variant="page" />}>
      <UserProfileView />
    </Suspense>
  );
}
