'use client';

import dynamic from 'next/dynamic';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const TrendIntelligenceAgent = dynamic(() => import('@/components/agent/TrendIntelligenceAgent'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen-safe bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <div className="w-16 h-16 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
        <p className="text-[10px] font-mono uppercase font-bold tracking-widest text-muted">Loading...</p>
      </div>
    </div>
  ),
});

export default function Home() {
  return (
    <main>
      <ErrorBoundary>
        <TrendIntelligenceAgent />
      </ErrorBoundary>
    </main>
  );
}
