'use client';

import { useRouter } from 'next/navigation';
import { auth, googleProvider, signInWithPopup } from '@/firebase';
import DemoMode from '@/components/DemoMode';

export default function DemoPage() {
  const router = useRouter();

  const handleSignUp = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      router.push('/');
    } catch (err) {
      console.error('Sign in failed:', err);
    }
  };

  return <DemoMode onSignUp={handleSignUp} onBack={() => router.push('/')} />;
}
