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
  opp,
  index,
  isBestIdea,
  generateDeepDive,
  isReadOnly = false
}) => {
  const priorityColors = {
    High: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-900',
      border: 'border-indigo-200',
      accent: 'bg-indigo-600',
      light: 'bg-indigo-100',
      ring: 'ring-indigo-600'
    },
    Medium: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-900',
      border: 'border-emerald-200',
      accent: 'bg-emerald-600',
      light: 'bg-emerald-100',
      ring: 'ring-emerald-600'
    },
    Low: {
      bg: 'bg-slate-50',
      text: 'text-slate-900',
      border: 'border-slate-200',
      accent: 'bg-slate-600',
      light: 'bg-slate-100',
      ring: 'ring-slate-600'
    }
  }[opp.priority as 'High' | 'Medium' | 'Low'] || {
    bg: 'bg-gray-50',
    text: 'text-gray-900',
    border: 'border-gray-200',
    accent: 'bg-gray-600',
    light: 'bg-gray-100',
    ring: 'ring-gray-600'
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -5 }}
      className={`bg-white border-2 border-[#141414] p-6 flex flex-col h-full relative overflow-hidden shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] transition-all hover:shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] ${isBestIdea ? `ring-2 ${priorityColors.ring} ring-offset-4` : ''}`}
    >
      {/* Priority Indicator Strip */}
      <div className={`absolute top-0 left-0 w-full h-1.5 ${priorityColors.accent}`} />

      <div className="flex justify-between items-start mb-6">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] font-mono bg-[#141414] text-[#E4E3E0] px-1.5 py-0.5 uppercase font-bold tracking-tighter">
              {opp.status}
            </span>
            <span className={`text-[9px] font-mono px-1.5 py-0.5 uppercase font-bold border ${priorityColors.light} ${priorityColors.text} ${priorityColors.border}`}>
              {opp.priority} Priority
            </span>
          </div>
          <h4 className="font-serif italic text-2xl tracking-tighter leading-none mt-1">
            {opp.name}
          </h4>
          {isBestIdea && (
            <span className="text-[9px] font-mono uppercase font-bold text-indigo-600 mt-1 flex items-center gap-1">
              <span className="w-1 h-1 bg-indigo-600 rounded-full animate-pulse" />
              Top Recommendation
            </span>
          )}
        </div>
        <div className="flex flex-col items-end">
          <div className="text-[9px] font-mono uppercase opacity-40 mb-1">
            ID_{index + 1}
          </div>
        </div>
      </div>

      <p className="text-sm font-sans leading-relaxed text-gray-700 mb-8 flex-grow">
        {opp.description}
      </p>
      
      <div className="space-y-6 pt-5 border-t border-[#141414] border-dashed">
        {/* Primary Metric: Money Score */}
        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <p className="text-[10px] uppercase font-mono font-bold tracking-widest text-indigo-600">Money Score</p>
            <p className="text-sm font-mono font-bold leading-none text-indigo-600">{Math.round(opp.money_score)}/100</p>
          </div>
          <div className="h-3 w-full bg-indigo-50 rounded-full overflow-hidden border border-indigo-100">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${opp.money_score}%` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="h-full bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.3)]"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-gray-50 border border-gray-100 rounded-sm">
            <p className="text-[9px] uppercase opacity-50 font-mono mb-1 tracking-widest">Target Customer</p>
            <p className="text-xs font-bold font-sans">{opp.target_customer}</p>
          </div>
          <div className={`p-3 ${priorityColors.bg} border ${priorityColors.border} rounded-sm`}>
            <p className="text-[9px] uppercase opacity-50 font-mono mb-1 tracking-widest">Est. Startup Cost</p>
            <p className={`text-xs font-bold font-sans ${priorityColors.text}`}>${opp.startup_cost.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-y-5 gap-x-8 pt-2">
          {[
            { label: 'Speed to Launch', value: opp.speed_to_launch },
            { label: 'Ease', value: 10 - opp.difficulty },
          ].map((metric) => (
            <div key={metric.label} className="space-y-2">
              <div className="flex justify-between items-end">
                <p className="text-[9px] uppercase opacity-40 font-mono leading-none tracking-wider">{metric.label}</p>
                <p className="text-[10px] font-mono font-bold leading-none">{metric.value}/10</p>
              </div>
              <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${metric.value * 10}%` }}
                  transition={{ duration: 1, delay: 0.2 + index * 0.1 }}
                  className={`h-full ${priorityColors.accent}`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {isReadOnly ? (
        <Link 
          href="/"
          className={`mt-8 w-full border-2 border-[#141414] py-4 text-[10px] font-mono uppercase tracking-[0.2em] font-bold transition-all flex items-center justify-center gap-3 group shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 ${priorityColors.accent} text-white border-none text-center`}
        >
          Run your own analysis →
        </Link>
      ) : (
        <button 
          onClick={() => generateDeepDive(opp)}
          className={`mt-8 w-full border-2 border-[#141414] py-4 text-[10px] font-mono uppercase tracking-[0.2em] font-bold transition-all flex items-center justify-center gap-3 group shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 ${priorityColors.accent} text-white border-none`}
        >
          Generate Execution Suite
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      )}
    </motion.div>
  );
};
