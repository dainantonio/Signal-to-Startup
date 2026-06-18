'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, getRedirectResult, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { auth } from '@/firebase';
import dynamic from 'next/dynamic';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import LandingPage from '@/components/LandingPage';
import Logo from '@/components/Logo';

const TrendIntelligenceAgent = dynamic(
  () => import('@/components/agent/TrendIntelligenceAgentNewsroom'),
  { ssr: false },
);

function LoadingScreen() {
  const [dots, setDots] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setDots(d => (d + 1) % 4), 400);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#F7F7F5', gap: '20px',
    }}>
      <Logo size="md" showWordmark theme="light" />
      <div style={{ display: 'flex', gap: '5px', alignItems: 'center', height: '12px' }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width: '5px', height: '5px', borderRadius: '50%',
            background: '#0a0a0a',
            opacity: dots === i ? 1 : 0.15,
            transition: 'opacity 0.2s',
          }} />
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [authState, setAuthState] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  useEffect(() => {
    setPersistence(auth, browserLocalPersistence)
      .then(() => getRedirectResult(auth))
      .then((result) => {
        if (result?.user) console.log('Redirect sign-in successful:', result.user.email);
        else console.log('No redirect result found');
      })
      .catch((err: { code?: string }) => {
        if (err?.code === 'auth/unauthorized-domain') {
          console.error('Unauthorized domain for Firebase auth.', window.location.hostname);
        }
        if (err?.code !== 'auth/cancelled-popup-request') {
          console.error('Redirect auth error:', err);
        }
      });

    const unsubscribe = onAuthStateChanged(auth, user => {
      setAuthState(user ? 'authenticated' : 'unauthenticated');
    });
    return () => unsubscribe();
  }, []);

  if (authState === 'loading') return <LoadingScreen />;

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
