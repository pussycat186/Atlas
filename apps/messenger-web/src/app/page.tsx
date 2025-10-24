'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user has completed onboarding
    const hasOnboarded = localStorage.getItem('atlas_onboarded');
    
    if (!hasOnboarded) {
      router.push('/onboarding');
    } else {
      router.push('/chats');
    }
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Atlas Messenger</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Đang tải...</p>
      </div>
    </div>
  );
}
