'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, X, ExternalLink } from 'lucide-react';
import { FeedSignal, SECTOR_CONFIGS } from './types';

interface FeedListViewProps {
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

export const FeedListView: React.FC<FeedListViewProps> = ({
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
  const timeAgo = (d: string) => {
    const h = Math.floor((Date.now() - new Date(d).getTime()) / 3600000);
    return h < 1 ? 'Just now' : h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
  };

  if (fetchingFeed) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="bg-gradient-to-r from-white to-slate-50/50 border border-slate-200/50 rounded-lg px-4 py-3 flex items-center gap-3 animate-pulse"
          >
            <div className="h-4 bg-slate-100 w-12 rounded" />
            <div className="h-4 bg-slate-100 flex-1 rounded" />
            <div className="h-4 bg-slate-100 w-16 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (signals.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 text-sm">
        No signals found. Try widening your filters.
      </div>
    );
  }

  return (
    <div className="space-y-2">
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
                opacity: isOtherAnalyzing ? 0.4 : 1,
                filter: isOtherAnalyzing ? 'blur(0.5px)' : 'blur(0px)',
              }}
              transition={{ duration: 0.2 }}
              className={`relative bg-gradient-to-r from-white to-slate-50/50 rounded-lg border transition-all duration-200 ${
                multiSelectMode
                  ? selectedArticles.some(a => a.url === key)
                    ? 'border-2 border-slate-900 shadow-md'
                    : 'border border-slate-200/50 hover:border-slate-400 cursor-pointer'
                  : isOtherAnalyzing ? 'pointer-events-none border-slate-200/50' :
                    isAnalyzing ? 'border border-slate-200/50 ring-2 ring-slate-900/20 shadow-md' : 'border border-slate-200/50 shadow-sm hover:shadow-md'
              }`}
            >
              {multiSelectMode ? (
                <button
                  type="button"
                  onClick={() => onSelectArticle(sig)}
                  className="w-full text-left px-4 py-3 flex items-center gap-3"
                >
                  <div className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                    selectedArticles.some(a => a.url === key)
                      ? 'bg-black border-black'
                      : 'border-gray-300'
                  }`}>
                    {selectedArticles.some(a => a.url === key) && (
                      <span className="text-white text-xs leading-none">✓</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 text-[9px] font-mono uppercase font-bold rounded ${cfg.badgeBg} ${cfg.badgeText}`}>
                        {cfg.label}
                      </span>
                      <span className="text-xs text-gray-500 font-medium">{sig.source}</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 line-clamp-1">{sig.title}</p>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 border border-amber-200 rounded text-amber-700 flex-shrink-0">
                    <span className="text-amber-500 text-[9px]">⚡</span>
                    <span className="text-[10px] font-bold font-mono">{Math.min(sig.signalScore || 0, 99)}</span>
                  </div>
                </button>
              ) : isAnalyzing ? (
                <div className="px-4 py-3 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onCardCancel}
                    className="flex-shrink-0 text-gray-500 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 line-clamp-1">{sig.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Loader2 className="w-3 h-3 animate-spin text-black flex-shrink-0" />
                      <span className="text-xs text-gray-600">{analyzeStage}</span>
                      <span className="text-xs text-gray-400 ml-auto">{analyzeProgress}%</span>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onAnalyzeSignal(sig)}
                  disabled={!!analyzingUrl}
                  className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-100/50 transition-colors disabled:opacity-50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 text-[9px] font-mono uppercase font-bold rounded ${cfg.badgeBg} ${cfg.badgeText}`}>
                        {cfg.label}
                      </span>
                      <span className="text-xs text-gray-500 font-medium">{sig.source}</span>
                      {sig.isLocalSource && (
                        <span className="px-1.5 py-0.5 text-[9px] font-mono uppercase font-bold rounded bg-green-100 text-green-700">
                          Local
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-gray-900 line-clamp-1">{sig.title}</p>
                    <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{sig.snippet}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 border border-amber-200 rounded text-amber-700">
                      <span className="text-amber-500 text-[9px]">⚡</span>
                      <span className="text-[10px] font-bold font-mono">{Math.min(sig.signalScore || 0, 99)}</span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                  </div>
                </button>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
