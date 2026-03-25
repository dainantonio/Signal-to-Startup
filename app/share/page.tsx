'use client';

import { Suspense } from 'react';
import SharePageInner from './SharePageInner';

export default function SharePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white">
          <div className="w-10 h-10 border-2 border-black border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-medium">Loading...</p>
        </div>
      }
    >
      <SharePageInner />
    </Suspense>
  );
}
