'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Share2, Twitter, Linkedin, AlertTriangle, Users, ChevronRight, Link as LinkIcon, Check, Zap } from 'lucide-react';
import { AnalysisResult, Opportunity } from './types';
import { OpportunityCard } from './OpportunityCard';

interface ResultsDashboardProps {
  result: AnalysisResult;
  filteredOpportunities: Opportunity[];
  filterType: 'top' | 'hot' | 'fast';
  setFilterType: (type: 'top' | 'hot' | 'fast') => void;
  grantOnly: boolean;
  setGrantOnly: (val: boolean) => void;
  generateDeepDive: (opp: Opportunity) => void;
  shareOnTwitter: () => void;
  shareOnLinkedIn: () => void;
  minScore?: number;
  setMinScore?: (score: number) => void;
  maxCost?: number;
  setMaxCost?: (val: number) => void;
  countryTags?: string[];
  isAgentResult?: boolean;
  readingLevel?: 'simple' | 'standard' | 'advanced';
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({
  result, filteredOpportunities, filterType, setFilterType,
  grantOnly, setGrantOnly, generateDeepDive, shareOnTwitter, shareOnLinkedIn,
  readingLevel = 'standard'
}) => {
  const [copied, setCopied] = useState(false);
  const isSimple = readingLevel === 'simple';
  const displayOpportunities = isSimple ? filteredOpportunities.slice(0, 1) : filteredOpportunities;

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
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
          <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">02</div>
          <h2 className="text-xl font-bold text-gray-900">Analysis</h2>
        </div>

        {/* Trend headline */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 md:p-8 shadow-sm mb-4">
          <h3 className="text-2xl md:text-4xl font-bold tracking-tight leading-tight mb-4 border-b border-slate-100 pb-4 text-gray-900">
            {result.trend}
          </h3>
          <p className="text-base text-gray-600 leading-relaxed">{result.summary}</p>
        </div>

        {/* Affected groups + Problems */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h4 className="text-xs font-semibold text-indigo-600 uppercase flex items-center gap-2 mb-3">
              <Users className="w-3.5 h-3.5" /> Impacted Groups
            </h4>
            <div className="flex flex-wrap gap-2">
              {result.affected_groups.map((g, i) => (
                <span key={i} className="px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-800 text-xs font-semibold rounded-md">
                  {g}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h4 className="text-xs font-semibold text-amber-600 uppercase flex items-center gap-2 mb-3">
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
            <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">03</div>
            <h2 className="text-xl font-bold text-gray-900">
              Opportunities <span className="text-sm font-normal text-slate-400">({filteredOpportunities.length})</span>
            </h2>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 flex-shrink-0">
            <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-white flex-shrink-0">
              {[
                { id: 'top', label: 'ROI' },
                { id: 'hot', label: 'Urgent' },
                { id: 'fast', label: 'Fast' },
              ].map(t => (
                <button key={t.id} onClick={() => setFilterType(t.id as 'top' | 'hot' | 'fast')}
                  className={`px-4 py-2 text-xs font-semibold transition-all border-r border-slate-200 last:border-r-0 ${filterType === t.id ? 'bg-gray-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                  {t.label}
                </button>
              ))}
            </div>

            <button onClick={() => setGrantOnly(!grantOnly)}
              className={`flex items-center gap-1.5 px-3 py-2 border rounded-lg text-xs font-semibold transition-all flex-shrink-0 ${grantOnly ? 'bg-emerald-600 text-white border-emerald-600' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${grantOnly ? 'bg-white' : 'bg-slate-300'}`} />
              Grant
            </button>
          </div>
        </div>

        {displayOpportunities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayOpportunities.map((opp, i) => (
              <OpportunityCard
                key={i} opp={opp} index={i}
                isBestIdea={opp.name === result.best_idea.name}
                generateDeepDive={generateDeepDive}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border border-dashed border-slate-200 bg-white rounded-xl">
            <p className="text-xs font-semibold text-slate-400 uppercase">No opportunities match the current filter</p>
          </div>
        )}
      </section>

      {/* Execution CTA */}
      <section id="step-4" className="scroll-mt-24 bg-gray-900 text-white p-6 md:p-10 rounded-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">04</div>
          <h2 className="text-xl md:text-3xl font-bold">Execute</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="space-y-4">
            <h3 className="text-xl font-bold leading-snug">{result.best_idea.name}</h3>
            <p className="text-sm text-white/60 leading-relaxed">{result.best_idea.reason}</p>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <p className="text-[9px] font-semibold text-white/40 uppercase mb-1">Est. Cost</p>
                <p className="text-lg font-bold text-emerald-400">{result.best_idea.cost_estimate}</p>
              </div>
              <div>
                <p className="text-[9px] font-semibold text-white/40 uppercase mb-1">Launch Speed</p>
                <p className="text-lg font-bold">{result.best_idea.speed_rating}</p>
              </div>
              <div>
                <p className="text-[9px] font-semibold text-white/40 uppercase mb-1">Avg. Cost</p>
                <p className="text-base font-semibold">{avgCost}</p>
              </div>
              <div>
                <p className="text-[9px] font-semibold text-white/40 uppercase mb-1">Avg. Speed</p>
                <p className="text-base font-semibold">{avgSpeed}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
              <p className="text-xs font-semibold text-white/40 uppercase">First steps</p>
              <ol className="space-y-3">
                {result.best_idea.first_steps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="text-base font-bold text-white/20 leading-none flex-shrink-0">0{i + 1}</span>
                    <span className="leading-snug text-white/80">{step}</span>
                  </li>
                ))}
              </ol>
              <button
                onClick={() => { const top = filteredOpportunities[0]; if (top) generateDeepDive(top); }}
                className="w-full bg-white text-gray-900 py-3 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-all flex items-center justify-center gap-2 group"
              >
                Start Execution Suite <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Share bar */}
        <div className="flex flex-wrap items-center gap-4 mt-6 pt-5 border-t border-white/10">
          <span className="text-xs font-semibold text-white/30 flex items-center gap-2"><Share2 className="w-3.5 h-3.5" /> Share</span>
          <button onClick={copyLink} className="flex items-center gap-1.5 text-xs font-semibold text-white/50 hover:text-white transition-colors">
            {copied ? <><Check className="w-3.5 h-3.5 text-emerald-400" />Copied</> : <><LinkIcon className="w-3.5 h-3.5" />Copy Link</>}
          </button>
          <button onClick={shareOnTwitter} className="flex items-center gap-1.5 text-xs font-semibold text-white/50 hover:text-white transition-colors">
            <Twitter className="w-3.5 h-3.5" />Twitter
          </button>
          <button onClick={shareOnLinkedIn} className="flex items-center gap-1.5 text-xs font-semibold text-white/50 hover:text-white transition-colors">
            <Linkedin className="w-3.5 h-3.5" />LinkedIn
          </button>
        </div>
      </section>
    </motion.div>
  );
};
