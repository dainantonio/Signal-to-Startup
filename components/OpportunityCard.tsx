'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { ChevronRight, Sparkles, Target, Zap, Coins } from 'lucide-react';
import { Opportunity } from './types';
import { getLabels } from './utils/labels';

interface OpportunityCardProps {
  opp: Opportunity;
  index: number;
  isBestIdea: boolean;
  generateDeepDive: (opp: Opportunity) => void;
  isReadOnly?: boolean;
  countryTags?: string[];
  readingLevel?: 'simple' | 'standard' | 'advanced';
}

export const OpportunityCard: React.FC<OpportunityCardProps> = ({
  opp, index, isBestIdea, generateDeepDive, isReadOnly = false, countryTags = [], readingLevel = 'standard'
}) => {
  const labels = getLabels(readingLevel);
  const colors = {
    High:   { badge: 'bg-emerald-100 text-emerald-800', accent: 'bg-emerald-500' },
    Medium: { badge: 'bg-amber-100 text-amber-800',     accent: 'bg-amber-500'   },
    Low:    { badge: 'bg-gray-100 text-gray-700',       accent: 'bg-gray-400'    },
  }[opp.priority as 'High' | 'Medium' | 'Low'] ?? {
    badge: 'bg-gray-100 text-gray-700', accent: 'bg-gray-400',
  };

  // Determine edition label (like newspaper section tags)
  const getEditionLabel = () => {
    if (opp.money_score >= 80) return { text: 'ROI', color: 'bg-emerald-600' };
    if (opp.speed_to_launch >= 8) return { text: 'Fast', color: 'bg-blue-600' };
    if (opp.urgency >= 8) return { text: 'Urgent', color: 'bg-red-600' };
    return null;
  };

  const editionLabel = getEditionLabel();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className={`group bg-white border flex flex-col relative overflow-hidden rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 ${isBestIdea ? 'border-emerald-200 ring-2 ring-emerald-300' : 'border-gray-200 hover:border-gray-300'}`}
    >
      {/* Edition Label (top-left like newspaper section tag) */}
      {editionLabel && (
        <div className="absolute top-0 left-0 z-10">
          <div className={`${editionLabel.color} text-white px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-br-lg`}>
            {editionLabel.text}
          </div>
        </div>
      )}

      {/* Best Idea Badge */}
      {isBestIdea && (
        <div className="absolute top-3 right-3 z-10">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white rounded-lg text-xs font-semibold shadow-lg">
            <Sparkles className="w-3.5 h-3.5" />
            Top Pick
          </div>
        </div>
      )}

      <div className="p-4 md:p-6 flex flex-col flex-1">
        {/* Header - cleaner, mobile responsive */}
        <div className="mb-4 pt-2">
          <h4 className="text-lg md:text-xl font-serif font-bold text-gray-900 leading-tight mb-3 break-words hyphens-auto">
            {opp.name}
          </h4>
          <p className="text-sm text-gray-600 leading-relaxed break-words">
            {opp.description}
          </p>
        </div>

        {/* Metadata chips - mobile friendly */}
        <div className="flex flex-wrap gap-2 mb-6">
          {opp.grant_eligible && (
            <span className="text-xs px-2.5 py-1 rounded-md font-medium bg-green-50 text-green-700 border border-green-200 whitespace-nowrap">
              Grant Eligible
            </span>
          )}
          {countryTags.length > 0 && opp.local_fit >= 7 && (
            <span className="text-xs px-2.5 py-1 rounded-md font-medium bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
              Local Fit {opp.local_fit}/10
            </span>
          )}
        </div>

        {/* Key metrics */}
        {readingLevel === 'simple' ? (
          <div className="mb-6 pb-6 border-b border-gray-100 space-y-1.5">
            <p className="text-sm text-gray-700">
              <span className="font-medium text-gray-500">Startup cost:</span>{' '}
              <span className="font-bold">${opp.startup_cost.toLocaleString()}</span>
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-medium text-gray-500">Time to launch:</span>{' '}
              <span className="font-bold">
                {opp.speed_to_launch >= 8 ? 'Fast (1–2 weeks)'
                  : opp.speed_to_launch >= 6 ? 'Medium (2–4 weeks)'
                  : 'Slow (1–3 months)'}
              </span>
            </p>
          </div>
        ) : labels.metricsVisible ? (
          <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6 pb-6 border-b border-gray-100">
            <div className="min-w-0">
              <p className="text-xs text-gray-500 mb-1 font-medium truncate">Cost</p>
              <p className="text-sm md:text-base font-bold text-gray-900 truncate">
                ${opp.startup_cost.toLocaleString()}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 mb-1 font-medium truncate">Speed</p>
              <p className="text-sm md:text-base font-bold text-gray-900">
                {opp.speed_to_launch}/10
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 mb-1 font-medium truncate">ROI</p>
              <p className="text-sm md:text-base font-bold text-gray-900">
                {Math.round(opp.money_score)}
              </p>
            </div>
          </div>
        ) : null}

        {/* Target customer - mobile responsive */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
            Target
          </p>
          <p className="text-sm text-gray-700 leading-snug break-words">
            {opp.target_customer}
          </p>
        </div>

        {/* Compound Advantage */}
        {opp.compound_advantage && (
          <div className="mb-6 p-3 bg-purple-50 border border-purple-100 rounded-xl">
            <p className="text-[10px] font-bold text-purple-700 mb-1 uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" /> Compound Advantage
            </p>
            <p className="text-xs text-purple-900 leading-relaxed italic">
              {opp.compound_advantage}
            </p>
          </div>
        )}

        {/* Spacer to push CTA to bottom */}
        <div className="flex-1" />

        {/* Fixed CTA at bottom - consistent height across all cards */}
        {isReadOnly ? (
          <Link
            href="/"
            className="w-full bg-black text-white py-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 hover:bg-gray-800 shadow-sm"
          >
            Run Analysis
            <ChevronRight className="w-4 h-4" />
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => generateDeepDive(opp)}
            className="w-full bg-black text-white py-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 hover:bg-gray-800 active:scale-[0.98] shadow-sm"
          >
            {labels.deepDiveButton}
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
};
