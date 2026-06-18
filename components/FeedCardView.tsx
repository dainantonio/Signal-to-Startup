'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, X } from 'lucide-react';
import { FeedSignal, SECTOR_CONFIGS } from './types';
import WatchButton from './WatchButton';

interface FeedCardViewProps {
  signals: FeedSignal[];
  fetchingFeed: boolean;
  multiSelectMode: boolean;
  selectedArticles: FeedSignal[];
  onSelectArticle: (sig: FeedSignal) => void;
  analyzingUrl: string | null;
  analyzeProgress: number;
  analyzeStage: string;
  successUrl: string | null;
  onAnalyzeSignal: (sig: FeedSignal) => void;
  onCardCancel: () => void;
}

export const FeedCardView: React.FC<FeedCardViewProps> = ({
  signals,
  fetchingFeed,
  multiSelectMode,
  selectedArticles,
  onSelectArticle,
  analyzingUrl,
  analyzeProgress,
  analyzeStage,
  successUrl,
  onAnalyzeSignal,
  onCardCancel,
}) => {
  const timeAgo = (d: string) => {
    const h = Math.floor((Date.now() - new Date(d).getTime()) / 3600000);
    return h < 1 ? 'Just now' : h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
  };

  if (fetchingFeed) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-gradient-to-br from-white to-slate-50/50 border border-slate-200/50 rounded-2xl p-5 space-y-3 animate-pulse shadow-sm backdrop-blur-sm"
          >
            <div className="flex gap-2">
              <div className="h-4 bg-slate-100 w-16 rounded-md" />
              <div className="h-4 bg-slate-100 w-10 rounded-md" />
            </div>
            <div className="h-12 bg-slate-100 rounded-lg" />
            <div className="h-8 bg-slate-100 rounded-lg" />
            <div className="h-10 bg-slate-100 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (signals.length === 0) {
    return (
      <div className="col-span-full text-center py-16 text-gray-500 text-sm">
        No signals found. Try widening your filters.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <AnimatePresence>
        {signals.map((sig, i) => {
          const cfg = SECTOR_CONFIGS[sig.sector] ?? SECTOR_CONFIGS.markets;
          const key = sig.url ?? sig.title;
          const isAnalyzing = analyzingUrl === key;
          const isSuccess = successUrl === key;
          const isOtherAnalyzing = !!analyzingUrl && analyzingUrl !== key;

          return (
            <motion.div
              key={i}
              layout
              animate={{
                scale: isAnalyzing ? 1.02 : isOtherAnalyzing ? 0.97 : 1,
                opacity: isOtherAnalyzing ? 0.5 : 1,
                filter: isOtherAnalyzing ? 'blur(1px)' : 'blur(0px)',
              }}
              transition={{ duration: 0.2 }}
              className={`relative bg-gradient-to-br from-white to-slate-50/50 rounded-2xl flex flex-col overflow-hidden transition-all duration-200 ${
                multiSelectMode
                  ? selectedArticles.some(a => a.url === key)
                    ? 'border-2 border-slate-900 shadow-lg'
                    : 'border-2 border-slate-200/50 hover:border-slate-400 cursor-pointer'
                  : isOtherAnalyzing ? 'pointer-events-none border border-slate-200/50' :
                    isAnalyzing ? 'border border-slate-200/50 ring-2 ring-slate-900/20 shadow-xl' : 'border border-slate-200/50 shadow-sm hover:shadow-lg backdrop-blur-sm'
              }`}
            >
              {multiSelectMode ? (
                /* Multi-select card */
                <button
                  type="button"
                  onClick={() => onSelectArticle(sig)}
                  className="w-full text-left p-5 flex flex-col gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                      selectedArticles.some(a => a.url === key)
                        ? 'bg-black border-black'
                        : 'border-gray-300'
                    }`}>
                      {selectedArticles.some(a => a.url === key) && (
                        <span className="text-white text-xs leading-none">✓</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-semibold text-gray-500 uppercase truncate">
                          {sig.source}
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-md ${cfg.badgeBg} ${cfg.badgeText}`}>
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-sm font-semibold leading-snug line-clamp-2 text-gray-900">{sig.title}</p>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-1">{sig.snippet}</p>
                    </div>
                  </div>
                </button>
              ) : isAnalyzing ? (
                <div className="p-5 flex flex-col gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-gray-500 uppercase truncate">
                      {sig.source}
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-md ${cfg.badgeBg} ${cfg.badgeText}`}>
                      {cfg.label}
                    </span>
                    <button
                      type="button"
                      onClick={onCardCancel}
                      className="ml-auto flex items-center gap-1 text-xs text-gray-500 hover:text-red-500"
                    >
                      <X className="w-3 h-3" /> Cancel
                    </button>
                  </div>
                  <p className="text-sm font-semibold leading-snug">{sig.title}</p>
                  <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">{sig.snippet}</p>
                  <div className="border-t border-gray-100 pt-3" />
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span className="text-xs font-semibold text-black">{analyzeStage}</span>
                    <span className="ml-auto text-xs text-gray-500">{analyzeProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <motion.div
                      className="h-full bg-black"
                      animate={{ width: `${analyzeProgress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              ) : (
                <div className="p-4 flex flex-col gap-3 flex-1">
                  {/* Meta row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-wider">
                      {sig.source}
                    </span>
                    <span className={`px-2 py-0.5 text-[9px] font-mono uppercase font-bold rounded-md ${cfg.badgeBg} ${cfg.badgeText}`}>
                      {cfg.label}
                    </span>
                    {sig.isLocalSource && (
                      <span className="px-2 py-0.5 text-[9px] font-mono uppercase font-bold rounded-md bg-green-100 text-green-700">
                        Local
                      </span>
                    )}
                    {/* Score — right aligned */}
                    <div className="ml-auto flex items-center gap-1 px-2 py-0.5 bg-amber-50 border border-amber-200 rounded-lg">
                      <span className="text-amber-500 text-[9px]">⚡</span>
                      <span className="text-[10px] font-bold font-mono text-amber-700">
                        {Math.min(sig.signalScore || 0, 99)}
                      </span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">
                    {sig.title}
                  </h3>

                  {/* Snippet */}
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 flex-1">
                    {sig.snippet}
                  </p>

                  {/* Action buttons */}
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => onAnalyzeSignal(sig)}
                      disabled={!!analyzingUrl}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-gray-700 disabled:opacity-40 transition-colors"
                    >
                      ⚡ Analyze
                    </button>
                    <WatchButton article={sig} />
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
