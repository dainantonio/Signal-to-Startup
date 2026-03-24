'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { ChevronRight, Sparkles, Target, Zap, Coins } from 'lucide-react';
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
    High:   { bg: 'bg-emerald-50',  text: 'text-emerald-700',  border: 'border-emerald-200',  accent: 'bg-emerald-500',  light: 'bg-emerald-50',  ring: 'ring-emerald-200' },
    Medium: { bg: 'bg-amber-50',    text: 'text-amber-700',    border: 'border-amber-200',    accent: 'bg-amber-500',    light: 'bg-amber-50',    ring: 'ring-amber-200'  },
    Low:    { bg: 'bg-gray-50',     text: 'text-gray-500',     border: 'border-gray-200',     accent: 'bg-gray-400',     light: 'bg-gray-100',    ring: 'ring-gray-200'   },
  }[opp.priority as 'High' | 'Medium' | 'Low'] ?? {
    bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200', accent: 'bg-gray-400', light: 'bg-gray-100', ring: 'ring-gray-200'
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className={`group bg-white border border-border/10 flex flex-col relative overflow-hidden rounded-3xl shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 ${isBestIdea ? `ring-2 ${colors.ring} ring-offset-4` : ''}`}
    >
      {/* Best Idea Badge */}
      {isBestIdea && (
        <div className="absolute top-4 right-4 z-10">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-primary text-white rounded-full text-[9px] font-mono uppercase font-bold shadow-lg shadow-primary/20">
            <Sparkles className="w-3 h-3" />
            Top Pick
          </div>
        </div>
      )}

      <div className="p-6 md:p-8 flex flex-col flex-1 gap-6">
        {/* Header row */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className={`text-[9px] font-mono px-2 py-0.5 uppercase font-bold rounded-md border ${colors.light} ${colors.text} ${colors.border}`}>
              {opp.priority} Priority
            </span>
            {opp.grant_eligible && (
              <span className="text-[9px] font-mono px-2 py-0.5 uppercase font-bold rounded-md border border-secondary/20 bg-secondary/5 text-secondary flex items-center gap-1">
                <Coins className="w-3 h-3" />
                Grant Eligible
              </span>
            )}
          </div>
          <h4 className="font-serif italic text-2xl md:text-3xl tracking-tight leading-tight group-hover:text-primary transition-colors">{opp.name}</h4>
        </div>

        {/* Description */}
        <p className="text-sm font-medium leading-relaxed text-muted line-clamp-3">{opp.description}</p>

        {/* Money Score Section */}
        <div className="space-y-3 bg-gray-50/50 p-4 rounded-2xl border border-border/5">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <p className="text-[9px] font-mono uppercase text-muted tracking-widest">Money Score</p>
              <p className="text-2xl font-serif italic font-bold leading-none">{Math.round(opp.money_score)}<span className="text-xs font-sans font-normal opacity-30 ml-1">/100</span></p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-mono uppercase text-muted tracking-widest mb-1">ROI Potential</p>
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className={`w-1.5 h-3 rounded-full ${i < Math.round(opp.roi_potential / 2) ? colors.accent : 'bg-gray-200'}`} />
                ))}
              </div>
            </div>
          </div>
          <div className="h-1.5 w-full bg-gray-200/50 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${opp.money_score}%` }}
              transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: index * 0.1 }}
              className={`h-full ${colors.accent} shadow-[0_0_10px_rgba(0,0,0,0.1)]`}
            />
          </div>
        </div>

        {/* Key stats row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted">
              <Coins className="w-3 h-3" />
              <p className="text-[8px] font-mono uppercase tracking-widest">Cost</p>
            </div>
            <p className="text-sm font-bold font-mono">${opp.startup_cost.toLocaleString()}</p>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-1 text-muted">
              <Zap className="w-3 h-3" />
              <p className="text-[8px] font-mono uppercase tracking-widest">Speed</p>
            </div>
            <div className="flex gap-0.5">
              {[...Array(10)].map((_, i) => (
                <div key={i} className={`h-2 flex-1 rounded-sm ${i < opp.speed_to_launch ? colors.accent : 'bg-gray-200'}`} />
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-1 text-muted">
              <Target className="w-3 h-3" />
              <p className="text-[8px] font-mono uppercase tracking-widest">Ease</p>
            </div>
            <div className="flex gap-0.5">
              {[...Array(10)].map((_, i) => (
                <div key={i} className={`h-2 flex-1 rounded-sm ${i < (10 - opp.difficulty) ? colors.accent : 'bg-gray-200'}`} />
              ))}
            </div>
          </div>
        </div>

        {/* Target customer */}
        <div className="pt-4 border-t border-border/5">
          <p className="text-[9px] font-mono uppercase text-muted tracking-widest mb-2">Target Customer</p>
          <p className="text-xs font-medium text-foreground leading-snug">{opp.target_customer}</p>
        </div>

        {/* CTA */}
        {isReadOnly ? (
          <Link
            href="/"
            className="mt-auto w-full bg-foreground text-background py-4 rounded-2xl text-[10px] font-mono uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-foreground/5 hover:bg-foreground/90"
          >
            Run Analysis →
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => generateDeepDive(opp)}
            className={`mt-auto w-full ${colors.accent} text-white py-4 rounded-2xl text-[10px] font-mono uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-2 shadow-xl ${colors.ring.replace('ring-', 'shadow-')} hover:scale-[1.02] active:scale-[0.98] group`}
          >
            Generate Execution Suite
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        )}
      </div>
    </motion.div>
  );
};
