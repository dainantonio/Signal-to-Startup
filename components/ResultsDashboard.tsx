'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Share2, Twitter, Linkedin, AlertTriangle, Users, ChevronRight, Link as LinkIcon, Check, TrendingUp, Zap, Sparkles, ArrowRight } from 'lucide-react';
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
      className="space-y-12"
    >
      {/* Analysis Summary */}
      <section id="step-2" className="scroll-mt-24">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 rounded-xl bg-foreground text-background flex items-center justify-center font-mono text-sm font-bold flex-shrink-0 shadow-lg shadow-foreground/10">02</div>
          <div className="flex-grow">
            <h2 className="text-2xl font-serif italic font-bold">Market Intelligence</h2>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted">Deep analysis of the signal</p>
          </div>
        </div>

        {/* Trend headline */}
        <div className="bg-white border border-border/10 p-6 md:p-10 rounded-3xl shadow-sm mb-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
            <TrendingUp className="w-48 h-48 -mr-12 -mt-12" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-primary mb-4">
              <Sparkles className="w-4 h-4" />
              <span className="text-[10px] font-mono uppercase font-bold tracking-widest">Emerging Trend Identified</span>
            </div>
            <h3 className="text-3xl md:text-5xl font-serif italic tracking-tight leading-tight mb-6 text-foreground">
              {result.trend}
            </h3>
            <p className="text-lg md:text-xl text-muted leading-relaxed max-w-4xl font-medium">{result.summary}</p>
          </div>
        </div>

        {/* Affected groups + Problems */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-border/10 p-6 md:p-8 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
            <h4 className="text-[10px] font-mono uppercase font-bold tracking-widest flex items-center gap-2 text-primary mb-5">
              <Users className="w-4 h-4" /> Impacted Groups
            </h4>
            <div className="flex flex-wrap gap-2">
              {result.affected_groups.map((g, i) => (
                <span key={i} className="px-3 py-1.5 bg-primary/5 border border-primary/10 text-primary text-[10px] font-mono uppercase font-bold rounded-lg">
                  {g}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white border border-border/10 p-6 md:p-8 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
            <h4 className="text-[10px] font-mono uppercase font-bold tracking-widest flex items-center gap-2 text-accent mb-5">
              <AlertTriangle className="w-4 h-4" /> Market Friction & Problems
            </h4>
            <ul className="space-y-3">
              {result.problems.map((p, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-muted font-medium">
                  <span className="mt-1.5 w-1.5 h-1.5 bg-accent rounded-full flex-shrink-0" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Opportunity Matrix */}
      <section id="step-3" className="scroll-mt-24">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-foreground text-background flex items-center justify-center font-mono text-sm font-bold flex-shrink-0 shadow-lg shadow-foreground/10">03</div>
            <div className="flex-grow">
              <h2 className="text-2xl font-serif italic font-bold">
                Opportunity Matrix <span className="text-base opacity-40 font-sans font-normal not-italic ml-2">({filteredOpportunities.length})</span>
              </h2>
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted">Actionable business models</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 overflow-x-auto pb-2 sm:pb-0 flex-shrink-0 no-scrollbar">
            <div className="flex bg-white border border-border/10 p-1 rounded-xl shadow-sm flex-shrink-0">
              {[
                { id: 'top', label: 'ROI' },
                { id: 'hot', label: 'Urgent' },
                { id: 'fast', label: 'Fast' },
              ].map(t => (
                <button key={t.id} onClick={() => setFilterType(t.id as any)}
                  className={`px-4 py-2 rounded-lg text-[10px] font-mono uppercase font-bold tracking-wider transition-all duration-200 ${filterType === t.id ? 'bg-foreground text-background shadow-lg shadow-foreground/5' : 'text-muted hover:text-foreground hover:bg-gray-50'}`}>
                  {t.label}
                </button>
              ))}
            </div>

            <button onClick={() => setGrantOnly(!grantOnly)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all duration-200 flex-shrink-0 text-[10px] font-mono uppercase font-bold tracking-wider ${grantOnly ? 'bg-secondary text-white border-secondary shadow-lg shadow-secondary/20' : 'bg-white border-border/10 text-muted hover:text-foreground hover:bg-gray-50 shadow-sm'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${grantOnly ? 'bg-white animate-pulse' : 'bg-gray-300'}`} />
              Grant Eligible
            </button>
          </div>
        </div>

        {filteredOpportunities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOpportunities.map((opp, i) => (
              <OpportunityCard
                key={i} opp={opp} index={i}
                isBestIdea={opp.name === result.best_idea.name}
                generateDeepDive={generateDeepDive}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border border-dashed border-border/20 bg-white rounded-3xl">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-muted/30">
              <Search className="w-8 h-8" />
            </div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted">No opportunities match the current filter</p>
          </div>
        )}
      </section>

      {/* Execution CTA */}
      <section id="step-4" className="scroll-mt-24 bg-foreground text-background p-8 md:p-12 rounded-[2.5rem] shadow-2xl shadow-foreground/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.05]">
          <Zap className="w-64 h-64 -mr-16 -mt-16" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-10 h-10 rounded-xl bg-background text-foreground flex items-center justify-center font-mono text-sm font-bold flex-shrink-0">04</div>
            <div className="flex-grow">
              <h2 className="text-2xl md:text-4xl font-serif italic font-bold tracking-tight">Strategic Execution</h2>
              <p className="text-[10px] font-mono uppercase tracking-widest opacity-40">Recommended path to launch</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 text-primary-foreground rounded-full text-[10px] font-mono uppercase font-bold tracking-widest">
                <Sparkles className="w-3 h-3" /> Best Path Forward
              </div>
              <h3 className="text-3xl md:text-4xl font-serif italic font-bold leading-tight">{result.best_idea.name}</h3>
              <p className="text-lg opacity-70 leading-relaxed font-medium">{result.best_idea.reason}</p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-4">
                <div className="space-y-1">
                  <p className="text-[9px] font-mono uppercase opacity-40 tracking-widest">Est. Cost</p>
                  <p className="text-xl font-serif italic text-secondary">{result.best_idea.cost_estimate}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-mono uppercase opacity-40 tracking-widest">Launch Speed</p>
                  <p className="text-xl font-serif italic">{result.best_idea.speed_rating}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-mono uppercase opacity-40 tracking-widest">Avg. Cost</p>
                  <p className="text-base font-mono font-bold">{avgCost}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-mono uppercase opacity-40 tracking-widest">Avg. Speed</p>
                  <p className="text-base font-mono font-bold">{avgSpeed}</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-3xl space-y-6">
                <p className="text-[10px] font-mono uppercase opacity-40 tracking-widest">Immediate First Steps</p>
                <ol className="space-y-5">
                  {result.best_idea.first_steps.map((step, i) => (
                    <li key={i} className="flex gap-4 text-base">
                      <span className="font-serif italic text-2xl opacity-30 leading-none flex-shrink-0">0{i + 1}</span>
                      <span className="leading-snug opacity-90 font-medium">{step}</span>
                    </li>
                  ))}
                </ol>
                <button
                  onClick={() => { const top = filteredOpportunities[0]; if (top) generateDeepDive(top); }}
                  className="w-full bg-background text-foreground py-5 rounded-2xl font-mono text-xs uppercase tracking-widest font-bold hover:bg-white transition-all flex items-center justify-center gap-3 group shadow-xl shadow-black/20"
                >
                  Start Execution Suite <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>

          {/* Share bar */}
          <div className="flex flex-wrap items-center gap-6 mt-12 pt-8 border-t border-white/10">
            <span className="text-[10px] font-mono uppercase opacity-30 flex items-center gap-2 tracking-widest"><Share2 className="w-4 h-4" /> Share Intelligence</span>
            <div className="flex items-center gap-4">
              <button onClick={copyLink} className="flex items-center gap-2 text-[10px] font-mono uppercase font-bold opacity-50 hover:opacity-100 transition-all hover:translate-y-[-1px]">
                {copied ? <><Check className="w-4 h-4 text-secondary" />Copied</> : <><LinkIcon className="w-4 h-4" />Copy Link</>}
              </button>
              <button onClick={shareOnTwitter} className="flex items-center gap-2 text-[10px] font-mono uppercase font-bold opacity-50 hover:opacity-100 transition-all hover:translate-y-[-1px]">
                <Twitter className="w-4 h-4" />Twitter
              </button>
              <button onClick={shareOnLinkedIn} className="flex items-center gap-2 text-[10px] font-mono uppercase font-bold opacity-50 hover:opacity-100 transition-all hover:translate-y-[-1px]">
                <Linkedin className="w-4 h-4" />LinkedIn
              </button>
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
};
