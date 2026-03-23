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
}

export const OpportunityCard: React.FC<OpportunityCardProps> = ({
  opp, index, isBestIdea, generateDeepDive, isReadOnly = false
}) => {
  const colors = {
    High:   { bg: 'bg-indigo-50',  text: 'text-indigo-900',  border: 'border-indigo-200',  accent: 'bg-indigo-600',  light: 'bg-indigo-100',  ring: 'ring-indigo-500' },
    Medium: { bg: 'bg-emerald-50', text: 'text-emerald-900', border: 'border-emerald-200', accent: 'bg-emerald-600', light: 'bg-emerald-100', ring: 'ring-emerald-500' },
    Low:    { bg: 'bg-slate-50',   text: 'text-slate-900',   border: 'border-slate-200',   accent: 'bg-slate-500',   light: 'bg-slate-100',   ring: 'ring-slate-400'  },
  }[opp.priority as 'High' | 'Medium' | 'Low'] ?? {
    bg: 'bg-gray-50', text: 'text-gray-900', border: 'border-gray-200', accent: 'bg-gray-600', light: 'bg-gray-100', ring: 'ring-gray-400'
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      className={`bg-white border-2 border-[#141414] flex flex-col relative overflow-hidden shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] ${isBestIdea ? `ring-2 ${colors.ring} ring-offset-2` : ''}`}
    >
      {/* Priority strip */}
      <div className={`h-1.5 w-full ${colors.accent} flex-shrink-0`} />

      <div className="p-5 flex flex-col flex-1 gap-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              <span className={`text-[9px] font-mono px-1.5 py-0.5 uppercase font-bold border ${colors.light} ${colors.text} ${colors.border}`}>
                {opp.priority}
              </span>
              {isBestIdea && (
                <span className="text-[9px] font-mono uppercase font-bold text-indigo-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse" />
                  Top Pick
                </span>
              )}
            </div>
            <h4 className="font-serif italic text-xl md:text-2xl tracking-tight leading-tight">{opp.name}</h4>
          </div>

          {/* Money Score */}
          <div className={`flex-shrink-0 flex flex-col items-center ${colors.bg} border ${colors.border} px-3 py-2 rounded-sm min-w-[56px]`}>
            <span className={`text-[8px] font-mono uppercase ${colors.text} font-bold leading-none mb-1`}>Score</span>
            <span className={`text-xl font-bold ${colors.text} leading-none font-serif italic`}>{Math.round(opp.money_score)}</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm font-sans leading-relaxed text-gray-600">{opp.description}</p>

        {/* Money Score bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono uppercase opacity-50">Money Score</span>
            <span className="text-[10px] font-mono font-bold">{Math.round(opp.money_score)}/100</span>
          </div>
          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${opp.money_score}%` }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: index * 0.06 }}
              className={`h-full ${colors.accent}`}
            />
          </div>
        </div>

        {/* Key stats row */}
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-dashed border-[#141414]/20">
          <div className={`${colors.bg} border ${colors.border} p-2.5 rounded-sm text-center`}>
            <p className="text-[8px] font-mono uppercase opacity-50 mb-1">Cost</p>
            <p className={`text-xs font-bold font-mono ${colors.text}`}>${opp.startup_cost.toLocaleString()}</p>
          </div>
          <div className="bg-gray-50 border border-gray-100 p-2.5 rounded-sm text-center">
            <p className="text-[8px] font-mono uppercase opacity-50 mb-1">Speed</p>
            <p className="text-xs font-bold font-mono">{opp.speed_to_launch}/10</p>
          </div>
          <div className="bg-gray-50 border border-gray-100 p-2.5 rounded-sm text-center">
            <p className="text-[8px] font-mono uppercase opacity-50 mb-1">Ease</p>
            <p className="text-xs font-bold font-mono">{10 - opp.difficulty}/10</p>
          </div>
        </div>

        {/* Target customer */}
        <div>
          <p className="text-[9px] font-mono uppercase opacity-40 mb-1">Target Customer</p>
          <p className="text-xs font-sans font-medium text-gray-700 leading-snug">{opp.target_customer}</p>
        </div>

        {/* CTA */}
        {isReadOnly ? (
          <Link
            href="/"
            className={`mt-auto w-full ${colors.accent} text-white py-3.5 text-[10px] font-mono uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_rgba(20,20,20,0.3)] hover:shadow-none hover:translate-x-px hover:translate-y-px`}
          >
            Run your own analysis →
          </Link>
        ) : (
          <button
            onClick={() => generateDeepDive(opp)}
            className={`mt-auto w-full ${colors.accent} text-white py-3.5 text-[10px] font-mono uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_rgba(20,20,20,0.3)] hover:shadow-none hover:translate-x-px hover:translate-y-px group`}
          >
            Generate Execution Suite
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>
    </motion.div>
  );
};
