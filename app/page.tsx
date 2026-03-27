'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/firebase';
import dynamic from 'next/dynamic';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import LandingPage from '@/components/LandingPage';

const TrendIntelligenceAgent = dynamic(
  () => import('@/components/agent/TrendIntelligenceAgent'),
  { ssr: false },
);

export default function Home() {
  const [authState, setAuthState] = useState<
    'loading' | 'authenticated' | 'unauthenticated'
  >('loading');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setAuthState(user ? 'authenticated' : 'unauthenticated');
    });
    return () => unsubscribe();
  }, []);

  if (authState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (authState === 'authenticated') {
    return (
      <main>
        <ErrorBoundary>
          <TrendIntelligenceAgent />
        </ErrorBoundary>
      </main>
    );
  }

  return <LandingPage />;
}
