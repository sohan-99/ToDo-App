'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const router = useRouter();

  // Redirect to signin page by default
  useEffect(() => {
    router.replace('/auth/signin');
  }, [router]);

  return null;
}
