'use client';

import { useState } from 'react';
import { auth, db, addDoc, collection } from '@/firebase';
import type { FeedSignal } from './types';

interface WatchButtonProps {
  article: FeedSignal;
}

export default function WatchButton({ article }: WatchButtonProps) {
  const [added, setAdded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const watch = async (days: number) => {
    if (!auth.currentUser) {
      alert('Sign in to use watchlist');
      return;
    }
    try {
      const exp = new Date();
      exp.setDate(exp.getDate() + days);
      await addDoc(collection(db, 'signal_watchlist'), {
        userId: auth.currentUser.uid,
        seedSignal: {
          title: article.title,
          snippet: article.snippet || '',
          url: article.url,
          source: article.source,
          sector: article.sector,
          signalScore: article.signalScore || 50,
        },
        watchDays: days,
        expiresAt: exp.toISOString(),
        createdAt: new Date().toISOString(),
        status: 'active',
        matchedSignals: [],
        convergenceScore: 0,
      });
      setAdded(true);
      setShowMenu(false);
    } catch (err) {
      console.error('Watch failed:', err);
    }
  };

  if (added) {
    return (
      <span className="inline-flex items-center justify-center px-3 py-2 rounded-xl border border-amber-200 text-xs font-semibold text-amber-700 bg-amber-50 whitespace-nowrap shadow-sm">
        Watching ✓
      </span>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setShowMenu(!showMenu);
        }}
        className="inline-flex items-center justify-center min-h-10 px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:border-amber-400 hover:text-amber-700 bg-white transition-all whitespace-nowrap shadow-sm hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
      >
        Watch
      </button>

      {showMenu && (
        <div className="absolute bottom-full right-0 mb-2 w-48 max-w-[85vw] bg-white border border-gray-200 rounded-2xl shadow-xl p-2 z-50">
          <p className="text-xs font-semibold text-gray-600 px-2 py-1.5">Watch for how long?</p>
          {[3, 5, 7, 14].map(days => (
            <button
              key={days}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                watch(days);
              }}
              className="w-full text-left px-3 py-2.5 text-xs text-gray-700 hover:bg-amber-50 hover:text-amber-700 rounded-xl transition-colors flex items-center justify-between"
            >
              <span>{days} days</span>
              {days === 7 && (
                <span className="text-amber-500">recommended</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
