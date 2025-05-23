'use client';

import useUserStore from '@/store/userStore';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const DashboardPage = () => {
  const userData = useUserStore((state) => state.userData);
  const router = useRouter();

  useEffect(() => {
    if (!userData) {
      router.push('/');
    }
  }, [userData, router]);

  return (
    <div>
      <h1>User Data Dashboard</h1>
      {userData ? (
        <pre>{JSON.stringify(userData, null, 2)}</pre>
      ) : (
        <p>No user data available.</p>
      )}
    </div>
  );
};

export default DashboardPage;