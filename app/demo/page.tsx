'use client';

import { useRouter } from 'next/navigation';
import { auth, googleProvider, signInWithPopup, signInWithRedirect } from '@/firebase';
import DemoMode from '@/components/DemoMode';

export default function DemoPage() {
  const router = useRouter();

  const handleSignUp = async () => {
    try {
      const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
      if (isMobile) {
        await signInWithRedirect(auth, googleProvider);
      } else {
        await signInWithPopup(auth, googleProvider);
        router.push('/');
      }
    } catch (err: any) {
      if (err?.code === 'auth/cancelled-popup-request') return;
      if (err?.code === 'auth/popup-closed-by-user') return;
      console.error('Sign in failed:', err);
    }
  };

  return <DemoMode onSignUp={handleSignUp} onBack={() => router.push('/')} />;
}
