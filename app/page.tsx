'use client';

import dynamic from 'next/dynamic';

const TrendIntelligenceAgent = dynamic(() => import('@/components/TrendIntelligenceAgent'), {
  ssr: false,
});

export default function Home() {
  return (
    <main>
      <TrendIntelligenceAgent />
    </main>
  );
}
