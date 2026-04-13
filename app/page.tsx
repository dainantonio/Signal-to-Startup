'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, getRedirectResult } from 'firebase/auth';
import { auth } from '@/firebase';
import dynamic from 'next/dynamic';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import LandingPage from '@/components/LandingPage';

const TrendIntelligenceAgent = dynamic(
  () => import('@/components/agent/TrendIntelligenceAgentNewsroom'),
  { ssr: false },
);

export default function Home() {
  const [authState, setAuthState] = useState<
    'loading' | 'authenticated' | 'unauthenticated'
  >('loading');

  useEffect(() => {
    // Handle OAuth redirect callback first (fixes mobile sign-in loop)
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          console.log('Redirect sign-in successful:', result.user.email);
        } else {
          console.log('No redirect result found');
        }
      })
      .catch((err: { code?: string }) => {
        if (err?.code !== 'auth/cancelled-popup-request') {
          console.error('Redirect auth error:', err);
        }
      });

    // Then listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, user => {
      console.log('Auth state changed:', user ? `authenticated (${user.email})` : 'unauthenticated');
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
