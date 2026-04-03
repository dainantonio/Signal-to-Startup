'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowRight } from 'lucide-react';
import { AnalysisResult, Opportunity } from './types';
import { BriefingColumns } from './BriefingColumns';
import { OpportunityCard } from './OpportunityCard';

interface AnalysisResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: AnalysisResult | null;
  generateDeepDive: (opp: Opportunity) => void;
  sourceTitle?: string;
  isAgentResult?: boolean;
}

export const AnalysisResultModal: React.FC<AnalysisResultModalProps> = ({
  isOpen,
  onClose,
  result,
  generateDeepDive,
  sourceTitle,
  isAgentResult = false,
}) => {
  if (!result) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 md:inset-4 md:top-20 z-50 bg-white rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] md:max-h-none"
          >
            {/* Header */}
            <div className="flex-shrink-0 bg-gradient-to-r from-gray-900 to-gray-800 text-white px-4 md:px-8 py-4 md:py-6 flex items-center justify-between border-b border-gray-700">
              <div className="flex-1 min-w-0 pr-4">
                <h2 className="text-lg md:text-2xl font-serif font-bold mb-1 truncate">
                  Analysis Results
                </h2>
                {sourceTitle && (
                  <p className="text-xs md:text-sm text-gray-300 truncate">
                    Source: {sourceTitle}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="flex-shrink-0 p-2 hover:bg-white/10 rounded-full transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {isAgentResult && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-purple-50 border-b border-purple-200">
                  <span className="text-lg">🤖</span>
                  <div>
                    <p className="text-xs font-semibold text-purple-800">Discovered by your agent</p>
                    <p className="text-xs text-purple-600">Pre-analyzed while you were away</p>
                  </div>
                </div>
              )}
              {result.isCompound && (
                <div className="px-4 py-3 bg-indigo-50 border-b border-indigo-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">🔗</span>
                      <span className="text-xs font-semibold text-indigo-800 uppercase tracking-wide">
                        Compound signal — {result.sourceCount} sources
                      </span>
                    </div>
                    {result.convergence_score != null && (
                      <span className={`text-sm font-bold ${
                        result.convergence_score >= 80 ? 'text-green-600'
                        : result.convergence_score >= 60 ? 'text-amber-600'
                        : 'text-gray-600'
                      }`}>
                        {result.convergence_score}% convergence
                      </span>
                    )}
                  </div>
                  {result.signal_connections && result.signal_connections.length > 0 && (
                    <div className="space-y-1">
                      {result.signal_connections.map((conn, i) => (
                        <p key={i} className="text-xs text-indigo-700 flex items-start gap-1.5">
                          <span className="flex-shrink-0 mt-0.5">↗</span>{conn}
                        </p>
                      ))}
                    </div>
                  )}
                  {result.sources && result.sources.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {result.sources.map((s, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">
                          {s.source}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="p-4 md:p-8 space-y-6 md:space-y-12">
                {/* Briefing Columns - Mobile Stacked */}
                <section>
                  <h3 className="text-xl md:text-2xl font-serif font-bold text-gray-900 mb-4 md:mb-6 px-2">
                    Intelligence Briefing
                  </h3>

                  {/* Mobile: Stacked, Desktop: 2 Columns */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                    {/* Trend */}
                    <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl p-4 md:p-6 shadow-sm">
                      <div className="flex items-center gap-2 mb-3 md:mb-4">
                        <h4 className="text-xs md:text-sm font-semibold text-gray-500 uppercase tracking-wide">
                          {result.isCompound ? 'Compound Trend' : 'Emerging Trend'}
                        </h4>
                      </div>
                      <h5 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4 leading-snug break-words">
                        {result.isCompound ? (result.compound_trend || result.trend) : result.trend}
                      </h5>
                      <p className="text-sm md:text-base text-gray-700 leading-relaxed break-words">
                        {result.summary}
                      </p>
                    </div>

                    {/* Impacted Groups */}
                    <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-2xl p-4 md:p-6 shadow-sm">
                      <div className="flex items-center gap-2 mb-3 md:mb-4">
                        <div className="w-4 h-4 md:w-5 md:h-5 bg-blue-600 rounded-full" />
                        <h4 className="text-xs md:text-sm font-semibold text-gray-500 uppercase tracking-wide">
                          Impacted Groups
                        </h4>
                      </div>
                      <div className="space-y-2">
                        {result.affected_groups.map((group, i) => (
                          <div
                            key={i}
                            className="px-3 md:px-4 py-2 md:py-3 bg-blue-100 border border-blue-200 rounded-xl"
                          >
                            <p className="text-xs md:text-sm font-medium text-blue-900 break-words">
                              {group}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Opportunities - Mobile Friendly Grid */}
                <section>
                  <h3 className="text-xl md:text-2xl font-serif font-bold text-gray-900 mb-4 md:mb-6 px-2">
                    Top Opportunities
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {result.opportunities.slice(0, 6).map((opp, i) => (
                      <OpportunityCard
                        key={i}
                        opp={opp}
                        index={i}
                        isBestIdea={opp.name === result.best_idea.name}
                        generateDeepDive={generateDeepDive}
                      />
                    ))}
                  </div>
                </section>

                {/* Next Steps */}
                <section className="bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-xl">
                  <div className="flex items-center gap-3 mb-4 md:mb-6">
                    <h3 className="text-xl md:text-2xl font-serif font-bold">
                      Recommended Next Steps
                    </h3>
                  </div>
                  <h4 className="text-base md:text-lg font-semibold mb-3 md:mb-4 break-words">
                    {result.best_idea.name}
                  </h4>
                  <p className="text-sm md:text-base text-gray-300 leading-relaxed mb-4 md:mb-6 break-words">
                    {result.best_idea.reason}
                  </p>
                  <div className="space-y-2 md:space-y-3">
                    {result.best_idea.first_steps.slice(0, 3).map((step, i) => (
                      <div key={i} className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold">
                          {i + 1}
                        </span>
                        <p className="text-sm md:text-base text-gray-200 leading-relaxed break-words flex-1">
                          {step}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>

            {/* Footer Actions - Mobile Friendly */}
            <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50 px-4 md:px-8 py-4 md:py-6">
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all order-2 sm:order-1"
                >
                  Back to Feed
                </button>
                <button
                  onClick={() => {
                    const top = result.opportunities[0];
                    if (top) {
                      generateDeepDive(top);
                      onClose();
                    }
                  }}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-all order-1 sm:order-2"
                >
                  View Top Opportunity
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
