import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Share2, Twitter, Linkedin, AlertTriangle, Lightbulb, Trophy, Users, ChevronRight, Link as LinkIcon, Check } from 'lucide-react';
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
  result,
  filteredOpportunities,
  filterType,
  setFilterType,
  minScore,
  setMinScore,
  grantOnly,
  setGrantOnly,
  maxCost,
  setMaxCost,
  generateDeepDive,
  shareOnTwitter,
  shareOnLinkedIn
}) => {
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    const url = result.id ? `${window.location.origin}/analysis/${result.id}` : window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const avgCost = filteredOpportunities.length > 0
    ? `$${Math.round(filteredOpportunities.reduce((acc, curr) => acc + curr.startup_cost, 0) / filteredOpportunities.length).toLocaleString()}`
    : '—';

  const avgSpeedVal = filteredOpportunities.length > 0
    ? filteredOpportunities.reduce((acc, curr) => acc + curr.speed_to_launch, 0) / filteredOpportunities.length
    : null;

  let avgSpeed = '—';
  if (avgSpeedVal !== null) {
    const s = Math.round(avgSpeedVal);
    if (s >= 9) avgSpeed = "Under 7 Days";
    else if (s >= 7) avgSpeed = "7-14 Days";
    else if (s >= 4) avgSpeed = "2-3 Weeks";
    else avgSpeed = "30+ Days";
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-12"
    >
      {/* Share Bar */}
      <div className="flex items-center justify-between border-b border-[#141414] pb-4">
        <div className="flex items-center gap-2">
          <Share2 className="w-4 h-4" />
          <span className="text-xs font-mono uppercase tracking-widest opacity-60">Share Insights</span>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={copyLink}
            className="flex items-center gap-2 text-xs font-mono uppercase hover:underline min-w-[100px]"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-500" />
                Copied!
              </>
            ) : (
              <>
                <LinkIcon className="w-4 h-4" />
                Copy Link
              </>
            )}
          </button>
          <button 
            onClick={shareOnTwitter}
            className="flex items-center gap-2 text-xs font-mono uppercase hover:underline"
          >
            <Twitter className="w-4 h-4" />
            Twitter
          </button>
          <button 
            onClick={shareOnLinkedIn}
            className="flex items-center gap-2 text-xs font-mono uppercase hover:underline"
          >
            <Linkedin className="w-4 h-4" />
            LinkedIn
          </button>
        </div>
      </div>

      {/* Layer 2: Analysis Summary */}
      <section id="step-2" className="scroll-mt-24 grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 bg-white border-2 border-[#141414] p-10 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] relative overflow-hidden">
          {/* Background Accent */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 opacity-50" />
          
          <div className="flex items-center gap-4 mb-8">
            <div className="w-10 h-10 rounded-full bg-[#141414] text-[#E4E3E0] flex items-center justify-center font-mono text-sm font-bold">02</div>
            <div className="flex flex-col">
              <h3 className="text-[10px] font-mono uppercase tracking-[0.4em] opacity-50">Intelligence Protocol</h3>
              <p className="text-xs font-mono uppercase font-bold tracking-widest">Signal Analysis & Synthesis</p>
            </div>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-serif italic tracking-tighter mb-8 leading-[0.9] border-b-2 border-[#141414] pb-6">
            {result.trend}
          </h2>
          
          <div className="space-y-6">
            <p className="text-xl font-sans leading-relaxed text-gray-800 font-medium">
              {result.summary}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-10 border-t border-[#141414] border-dashed">
              <div className="space-y-5">
                <h4 className="text-[10px] font-mono uppercase font-bold tracking-[0.2em] flex items-center gap-2 text-indigo-600">
                  <Users className="w-4 h-4" /> Impacted Groups
                </h4>
                <div className="flex flex-wrap gap-2">
                  {result.affected_groups.map((group, i) => (
                    <span key={i} className="px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-900 text-[10px] font-mono uppercase font-bold rounded-sm">
                      {group}
                    </span>
                  ))}
                </div>
              </div>
              <div className="space-y-5">
                <h4 className="text-[10px] font-mono uppercase font-bold tracking-[0.2em] flex items-center gap-2 text-amber-600">
                  <AlertTriangle className="w-4 h-4" /> New Problems
                </h4>
                <ul className="space-y-3">
                  {result.problems.map((problem, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm font-sans leading-tight text-gray-700">
                      <span className="mt-1.5 w-1.5 h-1.5 bg-amber-500 rounded-full flex-shrink-0" />
                      {problem}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-8">
          <div className="bg-[#141414] text-[#E4E3E0] p-8 shadow-[8px_8px_0px_0px_rgba(20,20,20,0.2)]">
            <h3 className="text-[10px] font-mono uppercase tracking-[0.3em] mb-6 opacity-60">Strategic Outlook</h3>
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <Lightbulb className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase opacity-50 mb-1">Primary Opportunity</p>
                  <p className="text-sm font-serif italic leading-snug">{result.best_idea.name}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-indigo-500/20 rounded-lg">
                  <Trophy className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase opacity-50 mb-1">Market Gap</p>
                  <p className="text-sm font-serif italic leading-snug">High demand for low-cost execution in {result.trend}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white border-2 border-[#141414] p-8 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]">
            <h3 className="text-[10px] font-mono uppercase tracking-[0.3em] mb-4 opacity-50">Intelligence Score</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-serif italic tracking-tighter">
                {Math.round(result.opportunities.reduce((acc, curr) => acc + curr.money_score, 0) / result.opportunities.length)}
              </span>
              <span className="text-sm font-mono uppercase opacity-40">/100</span>
            </div>
            <p className="text-[10px] font-mono uppercase mt-4 leading-relaxed opacity-60">
              Average opportunity viability across all discovered signals.
            </p>
          </div>
        </div>
      </section>

      {/* Layer 03: Opportunity Matrix */}
      <section id="step-3" className="scroll-mt-24 space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-2 border-[#141414] pb-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#141414] text-[#E4E3E0] flex items-center justify-center font-mono text-sm font-bold">03</div>
            <div className="flex flex-col">
              <h3 className="text-[10px] font-mono uppercase tracking-[0.4em] opacity-50">Market Intelligence</h3>
              <h2 className="text-3xl md:text-5xl font-serif italic tracking-tighter leading-none">Opportunity Matrix</h2>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-6 bg-white border-2 border-[#141414] p-3 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono uppercase font-bold opacity-40">Sort By</span>
              <div className="flex bg-gray-100 p-1 rounded-sm">
                {[
                  { id: 'top', label: 'ROI' },
                  { id: 'hot', label: 'Urgency' },
                  { id: 'fast', label: 'Speed' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setFilterType(t.id as any)}
                    className={`px-3 py-1 text-[10px] font-mono uppercase transition-all rounded-sm ${filterType === t.id ? 'bg-[#141414] text-white' : 'hover:bg-gray-200'}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-6 w-px bg-gray-200 mx-2" />
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono uppercase font-bold opacity-40">Grant Only</span>
              <button 
                onClick={() => setGrantOnly(!grantOnly)}
                className={`w-10 h-5 rounded-full transition-colors relative border border-[#141414] ${grantOnly ? 'bg-emerald-500' : 'bg-gray-200'}`}
              >
                <div className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full transition-all ${grantOnly ? 'left-5.5' : 'left-0.5'}`} />
              </button>
            </div>
          </div>
        </div>

        {filteredOpportunities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredOpportunities.map((opp, i) => (
              <OpportunityCard 
                key={i}
                opp={opp}
                index={i}
                isBestIdea={opp.name === result.best_idea.name}
                generateDeepDive={generateDeepDive}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border-2 border-dashed border-[#141414] bg-white/50">
            <p className="font-mono text-xs uppercase tracking-[0.3em] opacity-40">No opportunities match the current filter.</p>
          </div>
        )}
      </section>

      {/* Layer 4: Execution Layer */}
      <section id="step-4" className="scroll-mt-24 bg-[#141414] text-[#E4E3E0] p-12 md:p-20 shadow-[12px_12px_0px_0px_rgba(20,20,20,0.2)] relative overflow-hidden">
        {/* Background Graphic */}
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
          <div className="w-full h-full border-l border-b border-white/20 transform -skew-x-12 translate-x-1/2" />
        </div>
        
        <div className="relative z-10 max-w-4xl">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 rounded-full bg-white text-[#141414] flex items-center justify-center font-mono text-lg font-bold">04</div>
            <div className="flex flex-col">
              <h3 className="text-[10px] font-mono uppercase tracking-[0.5em] opacity-40">Strategic Execution</h3>
              <h2 className="text-4xl md:text-7xl font-serif italic tracking-tighter leading-none">The Execution Layer</h2>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <p className="text-2xl md:text-3xl font-serif italic leading-tight text-white">
                &quot;The best time to build was yesterday. The second best time is right now.&quot;
              </p>
              <p className="text-lg font-sans opacity-60 leading-relaxed">
                We&apos;ve identified {filteredOpportunities.length} high-viability opportunities. Select any card above to generate a full execution suite including business plans, cost breakdowns, and investor matching.
              </p>
              <div className="flex flex-wrap gap-6 pt-6">
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono uppercase opacity-40 mb-1">Avg. Cost</span>
                  <span className="text-2xl font-serif italic">{avgCost}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono uppercase opacity-40 mb-1">Avg. Speed</span>
                  <span className="text-2xl font-serif italic">{avgSpeed}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white/5 border border-white/10 p-10 backdrop-blur-sm">
              <h4 className="text-xs font-mono uppercase tracking-widest mb-8 flex items-center gap-3">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                Ready for Deployment
              </h4>
              <div className="space-y-6">
                <div className="p-4 bg-white/5 border border-white/10 rounded-sm">
                  <h5 className="text-[10px] font-mono uppercase opacity-40 mb-2">Recommended First Step</h5>
                  <p className="text-sm font-sans font-medium">Generate the 30-day checklist for your top opportunity.</p>
                </div>
                <button 
                  onClick={() => {
                    const topOpp = filteredOpportunities[0];
                    if (topOpp) generateDeepDive(topOpp);
                  }}
                  className="w-full bg-white text-[#141414] py-5 text-xs font-mono uppercase tracking-[0.3em] font-bold hover:bg-emerald-400 transition-all flex items-center justify-center gap-3 group"
                >
                  Start Execution
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
};
