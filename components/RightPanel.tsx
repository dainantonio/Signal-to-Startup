'use client';

import React, { useEffect, useState } from 'react';
import { db, auth, collection, query, where, getDocs, orderBy, limit } from '@/firebase';
import { AnalysisResult } from './types';

interface RightPanelProps {
  result: AnalysisResult | null;
  readingLevel: 'simple' | 'standard' | 'advanced';
  onNextMoveDone: () => void;
}

export default function RightPanel({ result, onNextMoveDone }: RightPanelProps) {
  const [watchlist, setWatchlist] = useState<Record<string, unknown>[]>([]);
  const [nextMoveDone, setNextMoveDone] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;
    loadWatchlist();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadWatchlist = async () => {
    if (!auth.currentUser) return;
    try {
      const snap = await getDocs(
        query(
          collection(db, 'signal_watchlist'),
          where('userId', '==', auth.currentUser.uid),
          where('status', '==', 'active'),
          orderBy('createdAt', 'desc'),
          limit(5)
        )
      );
      setWatchlist(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Watchlist load:', err);
    }
  };

  return (
    <aside className="h-full bg-white border-l border-gray-100 overflow-y-auto flex flex-col gap-3 p-3">

      {/* Your Next Move */}
      {result?.today_action && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
          <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-2">
            {result.today_action_type === 'talk' ? '💬'
              : result.today_action_type === 'research' ? '🔍'
              : result.today_action_type === 'build' ? '🔨'
              : result.today_action_type === 'apply' ? '📝'
              : '🧪'
            } Your Next Move
          </p>
          <p className="text-xs text-gray-800 leading-relaxed mb-3">
            {result.today_action}
          </p>
          {!nextMoveDone ? (
            <button
              onClick={() => { setNextMoveDone(true); onNextMoveDone(); }}
              className="w-full py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors"
            >
              ✓ I did this
            </button>
          ) : (
            <p className="text-xs text-emerald-600 font-medium text-center">Nice work. Keep going. 🚀</p>
          )}
        </div>
      )}

      {/* Agent Status */}
      <div className="rounded-xl border border-gray-100 p-4">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">
          Agent Status
        </p>
        {[
          { name: 'Signal Monitor', time: 'Runs 7:00 AM', status: 'active' },
          { name: 'Opportunity Scout', time: 'Runs 8:00 AM', status: 'active' },
          { name: 'Signal Watcher', time: `${watchlist.length} watching`, status: watchlist.length > 0 ? 'watching' : 'idle' },
          { name: 'Daily Digest', time: 'Runs 9:00 AM', status: 'active' },
        ].map((agent, i) => (
          <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
            <div>
              <p className="text-xs font-medium text-gray-900">{agent.name}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{agent.time}</p>
            </div>
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
              agent.status === 'active' ? 'bg-green-400'
              : agent.status === 'watching' ? 'bg-amber-400'
              : 'bg-gray-200'
            }`} />
          </div>
        ))}
      </div>

      {/* Watchlist */}
      {watchlist.length > 0 && (
        <div className="rounded-xl border border-gray-100 p-4">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Watchlist
          </p>
          <div className="space-y-3">
            {watchlist.map((watch, i) => {
              const seed = watch.seedSignal as { title: string } | undefined;
              const expiresAt = watch.expiresAt as string | undefined;
              const convergenceScore = watch.convergenceScore as number | undefined;
              const daysLeft = expiresAt
                ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                : 0;
              return (
                <div key={i} className="pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                  <p className="text-xs font-medium text-gray-900 leading-snug mb-1.5">
                    {String(seed?.title ?? '').substring(0, 60)}{(seed?.title?.length ?? 0) > 60 ? '...' : ''}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400">{daysLeft}d left</span>
                    {convergenceScore && convergenceScore > 0 ? (
                      <span className="text-[10px] font-bold text-amber-600">{convergenceScore}% match</span>
                    ) : (
                      <span className="text-[10px] text-gray-400">watching</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!result?.today_action && watchlist.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8 px-4">
          <p className="text-2xl mb-2">⚡</p>
          <p className="text-xs font-medium text-gray-700 mb-1">Run an analysis</p>
          <p className="text-xs text-gray-400 leading-relaxed">
            Your next move and agent status will appear here
          </p>
        </div>
      )}
    </aside>
  );
}
