'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, TrendingUp, Zap } from 'lucide-react';
import { FeedSignal, SECTOR_CONFIGS } from './types';

interface DailyBriefProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalyzeSignal: (sig: FeedSignal) => void;
}

export const DailyBrief: React.FC<DailyBriefProps> = ({ isOpen, onClose, onAnalyzeSignal }) => {
  const [topSignals, setTopSignals] = useState<FeedSignal[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch on open
  useEffect(() => {
    if (isOpen && topSignals.length === 0) {
      fetchTopSignals();
    }
  }, [isOpen]);

  // Fetch top signals
  const fetchTopSignals = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/live-feed?recency=24h&sectors=ai,policy,markets,funding&limit=5');
      if (res.ok) {
        const data = await res.json();
        const signals: FeedSignal[] = Array.isArray(data) ? data : data.items ?? [];
        // Sort by signal score and take top 5
        const sorted = signals
          .filter(s => s.signalScore && s.signalScore >= 60)
          .sort((a, b) => (b.signalScore || 0) - (a.signalScore || 0))
          .slice(0, 5);
        setTopSignals(sorted);
      }
    } catch (err) {
      console.error('Failed to fetch daily brief:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = () => {
    try {
      const today = new Date().toDateString();
      localStorage.setItem('dailyBriefLastCheck', today);
    } catch {}
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => onClose()}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Bell className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-serif font-bold">Daily Brief</h2>
                    <p className="text-sm text-blue-100">Top signals you may have missed today</p>
                  </div>
                </div>
                <button
                  onClick={() => onClose()}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="overflow-y-auto max-h-[calc(80vh-200px)] p-8">
                {loading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="bg-gray-50 rounded-2xl p-5 space-y-3 animate-pulse">
                        <div className="h-4 bg-gray-200 w-3/4 rounded" />
                        <div className="h-3 bg-gray-200 w-full rounded" />
                        <div className="h-3 bg-gray-200 w-5/6 rounded" />
                      </div>
                    ))}
                  </div>
                ) : topSignals.length > 0 ? (
                  <div className="space-y-4">
                    {topSignals.map((sig, i) => {
                      const cfg = SECTOR_CONFIGS[sig.sector] ?? SECTOR_CONFIGS.markets;
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="bg-white border-2 border-gray-100 hover:border-blue-200 rounded-2xl p-5 space-y-3 group cursor-pointer transition-all"
                          onClick={() => {
                            onAnalyzeSignal(sig);
                            markAsRead();
                          }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-semibold text-gray-500 uppercase">
                                  {sig.source}
                                </span>
                                <span
                                  className={`px-2 py-0.5 text-xs font-semibold rounded-md ${cfg.badgeBg} ${cfg.badgeText}`}
                                >
                                  {cfg.label}
                                </span>
                                {sig.signalScore && sig.signalScore >= 80 && (
                                  <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-md bg-red-100 text-red-800">
                                    <TrendingUp className="w-3 h-3" />
                                    Hot
                                  </span>
                                )}
                              </div>
                              <h3 className="text-base font-semibold text-gray-900 leading-snug mb-2 group-hover:text-blue-600 transition-colors">
                                {sig.title}
                              </h3>
                              <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                                {sig.snippet}
                              </p>
                            </div>
                            <div className="flex-shrink-0">
                              {sig.signalScore && (
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                                  {sig.signalScore}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                            <Zap className="w-4 h-4 text-blue-600" />
                            <span className="text-xs font-medium text-blue-600">
                              Click to analyze
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No high-priority signals found today</p>
                    <p className="text-sm text-gray-400 mt-2">Check back tomorrow for updates</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 px-8 py-5 bg-gray-50 flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {topSignals.length} signals · Last 24 hours
                </span>
                <button
                  onClick={markAsRead}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all"
                >
                  Mark as Read
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
  );
};
