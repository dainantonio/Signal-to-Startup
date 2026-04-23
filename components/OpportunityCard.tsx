'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import { Opportunity } from './types';

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
  opp, index, isBestIdea, generateDeepDive, isReadOnly = false,
}) => {
  const score = Math.round(opp.money_score);
  const scoreColor = score >= 70 ? 'text-emerald-600' : score >= 50 ? 'text-amber-600' : 'text-slate-400';
  const scoreBg = score >= 70 ? 'bg-emerald-50 border-emerald-200' : score >= 50 ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200';

  const priorityColors: Record<string, string> = {
    High:   'bg-indigo-50 text-indigo-700 border-indigo-200',
    Medium: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Low:    'bg-slate-100 text-slate-500 border-slate-200',
  };
  const priorityCls = priorityColors[opp.priority] ?? priorityColors.Low;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      className={`bg-white flex flex-col relative overflow-hidden rounded-xl shadow-sm transition-shadow hover:shadow-md ${
        isBestIdea ? 'border-2 border-emerald-500' : 'border border-slate-200'
      }`}
    >
      <div className="p-5 flex flex-col flex-1 gap-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${priorityCls}`}>
                {opp.priority}
              </span>
              {isBestIdea && (
                <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  Top Pick
                </span>
              )}
            </div>
            <h4 className="font-sans font-bold text-lg leading-snug text-gray-900">{opp.name}</h4>
          </div>

          {/* Score badge */}
          <div className={`flex-shrink-0 flex flex-col items-center border px-3 py-2 rounded-lg min-w-[52px] ${scoreBg}`}>
            <span className="text-[9px] font-semibold text-slate-500 uppercase leading-none mb-1">Score</span>
            <span className={`text-xl font-bold leading-none ${scoreColor}`}>{score}</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm font-sans leading-relaxed text-gray-600">{opp.description}</p>

        {/* Score bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Money Score</span>
            <span className="text-[10px] font-semibold text-slate-600">{score}/100</span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${opp.money_score}%` }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: index * 0.06 }}
              className={`h-full rounded-full ${score >= 70 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-400' : 'bg-slate-300'}`}
            />
          </div>
        </div>

        {/* Key stats */}
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100">
          <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-center">
            <p className="text-[9px] font-semibold text-slate-400 uppercase mb-1">Cost</p>
            <p className="text-xs font-bold text-slate-700">${opp.startup_cost.toLocaleString()}</p>
          </div>
          <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-center">
            <p className="text-[9px] font-semibold text-slate-400 uppercase mb-1">Speed</p>
            <p className="text-xs font-bold text-slate-700">{opp.speed_to_launch}/10</p>
          </div>
          <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-center">
            <p className="text-[9px] font-semibold text-slate-400 uppercase mb-1">Ease</p>
            <p className="text-xs font-bold text-slate-700">{10 - opp.difficulty}/10</p>
          </div>
        </div>

        {/* Target customer */}
        <div>
          <p className="text-[9px] font-semibold text-slate-400 uppercase mb-1">Target Customer</p>
          <p className="text-xs font-sans font-medium text-gray-700 leading-snug">{opp.target_customer}</p>
        </div>

        {/* CTA */}
        {isReadOnly ? (
          <Link
            href="/"
            className="mt-auto w-full bg-gray-900 text-white h-11 rounded-lg text-sm font-semibold transition-colors hover:bg-gray-800 flex items-center justify-center gap-2"
          >
            Run your own analysis →
          </Link>
        ) : (
          <button
            onClick={() => generateDeepDive(opp)}
            className="mt-auto w-full bg-gray-900 text-white h-11 rounded-lg text-sm font-semibold transition-colors hover:bg-gray-800 flex items-center justify-center gap-2 group"
          >
            Generate Execution Suite
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>
    </motion.div>
  );
};
