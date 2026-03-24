'use client';

import dynamic from 'next/dynamic';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const TrendIntelligenceAgent = dynamic(() => import('@/components/agent/TrendIntelligenceAgent'), {
  ssr: false,
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
