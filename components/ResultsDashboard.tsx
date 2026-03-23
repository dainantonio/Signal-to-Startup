'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Share2, Twitter, Linkedin, AlertTriangle, Users, ChevronRight, Link as LinkIcon, Check, TrendingUp, Zap } from 'lucide-react';
import { AnalysisResult, Opportunity } from './types';
import { OpportunityCard } from './OpportunityCard';

interface ResultsDashboardProps {
  result: AnalysisResult;
  filteredOpportunities: Opportunity[];
  filterType: 'top' | 'hot' | 'fast';
  setFilterType: (type: 'top' | 'hot' | 'fast') => void;
  minScore: number;
  setMinScore: (score: number) => void;
  grantOnly: boolean;
  setGrantOnly: (val: boolean) => void;
  maxCost: number;
  setMaxCost: (val: number) => void;
  generateDeepDive: (opp: Opportunity) => void;
  shareOnTwitter: () => void;
  shareOnLinkedIn: () => void;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({
  result, filteredOpportunities, filterType, setFilterType,
  grantOnly, setGrantOnly, generateDeepDive, shareOnTwitter, shareOnLinkedIn
}) => {
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    const url = result.id ? `${window.location.origin}/analysis/${result.id}` : window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const avgCost = filteredOpportunities.length > 0
    ? `$${Math.round(filteredOpportunities.reduce((a, c) => a + c.startup_cost, 0) / filteredOpportunities.length).toLocaleString()}`
    : '—';

  const avgSpeedVal = filteredOpportunities.length > 0
    ? filteredOpportunities.reduce((a, c) => a + c.speed_to_launch, 0) / filteredOpportunities.length
    : null;

  const avgSpeed = avgSpeedVal === null ? '—'
    : Math.round(avgSpeedVal) >= 9 ? 'Under 7 days'
    : Math.round(avgSpeedVal) >= 7 ? '7–14 days'
    : Math.round(avgSpeedVal) >= 4 ? '2–3 weeks'
    : '30+ days';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      {/* Analysis Summary */}
      <section id="step-2" className="scroll-mt-24">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-full bg-[#141414] text-[#E4E3E0] flex items-center justify-center font-mono text-xs flex-shrink-0">02</div>
          <h2 className="text-2xl font-serif italic border-b border-[#141414] pb-2 flex-grow">Analysis</h2>
        </div>

        {/* Trend headline */}
        <div className="bg-white border-2 border-[#141414] p-5 md:p-8 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] mb-4">
          <h3 className="text-3xl md:text-5xl font-serif italic tracking-tight leading-tight mb-4 border-b border-[#141414]/20 pb-4">
            {result.trend}
          </h3>
          <p className="text-base md:text-lg text-gray-700 leading-relaxed">{result.summary}</p>
        </div>

        {/* Affected groups + Problems — stacked on mobile, side by side on md+ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border-2 border-[#141414] p-5 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]">
            <h4 className="text-[10px] font-mono uppercase font-bold tracking-widest flex items-center gap-2 text-indigo-600 mb-3">
              <Users className="w-3.5 h-3.5" /> Impacted Groups
            </h4>
            <div className="flex flex-wrap gap-2">
              {result.affected_groups.map((g, i) => (
                <span key={i} className="px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-900 text-[10px] font-mono uppercase font-bold rounded-sm">
                  {g}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white border-2 border-[#141414] p-5 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]">
            <h4 className="text-[10px] font-mono uppercase font-bold tracking-widest flex items-center gap-2 text-amber-600 mb-3">
              <AlertTriangle className="w-3.5 h-3.5" /> New Problems
            </h4>
            <ul className="space-y-2">
              {result.problems.map((p, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                  <span className="mt-2 w-1.5 h-1.5 bg-amber-400 rounded-full flex-shrink-0" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Opportunity Matrix */}
      <section id="step-3" className="scroll-mt-24">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#141414] text-[#E4E3E0] flex items-center justify-center font-mono text-xs flex-shrink-0">03</div>
            <h2 className="text-2xl font-serif italic border-b border-[#141414] pb-2 flex-grow">
              Opportunities <span className="text-base opacity-40 font-sans font-normal not-italic">({filteredOpportunities.length})</span>
            </h2>
          </div>

          {/* Filters — scrollable row on mobile */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 flex-shrink-0">
            <div className="flex bg-white border-2 border-[#141414] p-0.5 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] flex-shrink-0">
              {[
                { id: 'top', label: 'ROI' },
                { id: 'hot', label: 'Urgent' },
                { id: 'fast', label: 'Fast' },
              ].map(t => (
                <button key={t.id} onClick={() => setFilterType(t.id as any)}
                  className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider transition-all ${filterType === t.id ? 'bg-[#141414] text-white' : 'hover:bg-gray-100'}`}>
                  {t.label}
                </button>
              ))}
            </div>

            <button onClick={() => setGrantOnly(!grantOnly)}
              className={`flex items-center gap-1.5 px-3 py-1.5 border-2 border-[#141414] text-[10px] font-mono uppercase tracking-wider transition-all flex-shrink-0 ${grantOnly ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-white hover:bg-gray-50'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${grantOnly ? 'bg-white' : 'bg-gray-400'}`} />
              Grant
            </button>
          </div>
        </div>

        {filteredOpportunities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredOpportunities.map((opp, i) => (
              <OpportunityCard
                key={i} opp={opp} index={i}
                isBestIdea={opp.name === result.best_idea.name}
                generateDeepDive={generateDeepDive}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed border-[#141414]/20 bg-white">
            <p className="font-mono text-xs uppercase tracking-widest opacity-30">No opportunities match the current filter</p>
          </div>
        )}
      </section>

      {/* Execution CTA */}
      <section id="step-4" className="scroll-mt-24 bg-[#141414] text-[#E4E3E0] p-6 md:p-10 shadow-[6px_6px_0px_0px_rgba(20,20,20,0.2)]">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-full bg-[#E4E3E0] text-[#141414] flex items-center justify-center font-mono text-xs flex-shrink-0">04</div>
          <h2 className="text-2xl md:text-4xl font-serif italic tracking-tight">Execute</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="space-y-4">
            <h3 className="text-xl md:text-2xl font-serif italic leading-snug">{result.best_idea.name}</h3>
            <p className="text-sm opacity-60 leading-relaxed">{result.best_idea.reason}</p>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <p className="text-[9px] font-mono uppercase opacity-40 mb-1">Est. Cost</p>
                <p className="text-lg font-serif italic text-emerald-400">{result.best_idea.cost_estimate}</p>
              </div>
              <div>
                <p className="text-[9px] font-mono uppercase opacity-40 mb-1">Launch Speed</p>
                <p className="text-lg font-serif italic">{result.best_idea.speed_rating}</p>
              </div>
              <div>
                <p className="text-[9px] font-mono uppercase opacity-40 mb-1">Avg. Cost</p>
                <p className="text-base font-mono">{avgCost}</p>
              </div>
              <div>
                <p className="text-[9px] font-mono uppercase opacity-40 mb-1">Avg. Speed</p>
                <p className="text-base font-mono">{avgSpeed}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white/5 border border-white/10 p-5 space-y-4">
              <p className="text-[10px] font-mono uppercase opacity-40">First steps</p>
              <ol className="space-y-3">
                {result.best_idea.first_steps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="font-serif italic text-xl opacity-30 leading-none flex-shrink-0">0{i + 1}</span>
                    <span className="leading-snug opacity-80">{step}</span>
                  </li>
                ))}
              </ol>
              <button
                onClick={() => { const top = filteredOpportunities[0]; if (top) generateDeepDive(top); }}
                className="w-full bg-[#E4E3E0] text-[#141414] py-4 text-[11px] font-mono uppercase tracking-widest font-bold hover:bg-white transition-all flex items-center justify-center gap-2 group"
              >
                Start Execution Suite <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Share bar */}
        <div className="flex flex-wrap items-center gap-4 mt-6 pt-5 border-t border-white/10">
          <span className="text-[10px] font-mono uppercase opacity-30 flex items-center gap-2"><Share2 className="w-3.5 h-3.5" /> Share</span>
          <button onClick={copyLink} className="flex items-center gap-1.5 text-[10px] font-mono uppercase opacity-50 hover:opacity-100 transition-opacity">
            {copied ? <><Check className="w-3.5 h-3.5 text-emerald-400" />Copied</> : <><LinkIcon className="w-3.5 h-3.5" />Copy Link</>}
          </button>
          <button onClick={shareOnTwitter} className="flex items-center gap-1.5 text-[10px] font-mono uppercase opacity-50 hover:opacity-100 transition-opacity">
            <Twitter className="w-3.5 h-3.5" />Twitter
          </button>
          <button onClick={shareOnLinkedIn} className="flex items-center gap-1.5 text-[10px] font-mono uppercase opacity-50 hover:opacity-100 transition-opacity">
            <Linkedin className="w-3.5 h-3.5" />LinkedIn
          </button>
        </div>
      </section>
    </motion.div>
  );
};
