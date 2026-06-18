'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, X } from 'lucide-react';
import { FeedSignal, SECTOR_CONFIGS } from './types';

interface FeedCompactViewProps {
  signals: FeedSignal[];
  fetchingFeed: boolean;
  multiSelectMode: boolean;
  selectedArticles: FeedSignal[];
  onSelectArticle: (sig: FeedSignal) => void;
  analyzingUrl: string | null;
  analyzeProgress: number;
  analyzeStage: string;
  onAnalyzeSignal: (sig: FeedSignal) => void;
  onCardCancel: () => void;
}

export const FeedCompactView: React.FC<FeedCompactViewProps> = ({
  signals,
  fetchingFeed,
  multiSelectMode,
  selectedArticles,
  onSelectArticle,
  analyzingUrl,
  analyzeProgress,
  analyzeStage,
  onAnalyzeSignal,
  onCardCancel,
}) => {
  if (fetchingFeed) {
    return (
      <div className="space-y-1">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="bg-slate-100 rounded h-6 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (signals.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        No signals found. Try widening your filters.
      </div>
    );
  }

  return (
    <div className="space-y-1 text-xs">
      <AnimatePresence>
        {signals.map((sig, i) => {
          const cfg = SECTOR_CONFIGS[sig.sector] ?? SECTOR_CONFIGS.markets;
          const key = sig.url ?? sig.title;
          const isAnalyzing = analyzingUrl === key;
          const isOtherAnalyzing = !!analyzingUrl && analyzingUrl !== key;

          return (
            <motion.div
              key={i}
              layout
              animate={{
                opacity: isOtherAnalyzing ? 0.3 : 1,
              }}
              transition={{ duration: 0.2 }}
              className={`relative transition-all duration-200 ${
                multiSelectMode
                  ? selectedArticles.some(a => a.url === key)
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200/50 hover:bg-slate-50 cursor-pointer'
                  : isOtherAnalyzing ? 'pointer-events-none opacity-40' :
                    isAnalyzing ? 'bg-slate-100 border-l-2 border-slate-900' : 'bg-white border border-slate-200/50 hover:bg-slate-50'
              }`}
            >
              {multiSelectMode ? (
                <button
                  type="button"
                  onClick={() => onSelectArticle(sig)}
                  className={`w-full text-left px-3 py-1.5 flex items-center gap-2 ${
                    selectedArticles.some(a => a.url === key) ? 'text-white' : ''
                  }`}
                >
                  <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all ${
                    selectedArticles.some(a => a.url === key)
                      ? 'bg-white border-white'
                      : 'border-gray-300'
                  }`}>
                    {selectedArticles.some(a => a.url === key) && (
                      <span className="text-slate-900 text-[10px] leading-none font-bold">✓</span>
                    )}
                  </div>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase flex-shrink-0 ${cfg.badgeBg} ${cfg.badgeText}`}>
                    {cfg.label.split(' ')[0]}
                  </span>
                  <span className="truncate font-medium">{sig.title}</span>
                  <span className={`ml-auto flex-shrink-0 font-bold ${
                    selectedArticles.some(a => a.url === key) ? 'text-white' : 'text-amber-700'
                  }`}>
                    {Math.min(sig.signalScore || 0, 99)}
                  </span>
                </button>
              ) : isAnalyzing ? (
                <div className="px-3 py-1.5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onCardCancel}
                    className="flex-shrink-0 text-gray-500 hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <Loader2 className="w-3 h-3 animate-spin flex-shrink-0" />
                  <span className="truncate flex-1">{sig.title}</span>
                  <span className="text-gray-500 flex-shrink-0">{analyzeProgress}%</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onAnalyzeSignal(sig)}
                  disabled={!!analyzingUrl}
                  className="w-full text-left px-3 py-1.5 flex items-center gap-2 disabled:opacity-50"
                >
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase flex-shrink-0 ${cfg.badgeBg} ${cfg.badgeText}`}>
                    {cfg.label.split(' ')[0]}
                  </span>
                  <span className="truncate flex-1 font-medium">{sig.title}</span>
                  {sig.isLocalSource && (
                    <span className="px-1 py-0.5 text-[8px] font-bold uppercase rounded bg-green-100 text-green-700 flex-shrink-0">
                      Local
                    </span>
                  )}
                  <span className="text-amber-700 font-bold flex-shrink-0">
                    ⚡{Math.min(sig.signalScore || 0, 99)}
                  </span>
                </button>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
