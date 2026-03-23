import React from 'react';
import { motion } from 'motion/react';
import { Share2, Twitter, Linkedin, AlertTriangle, Lightbulb, Trophy, Users, ChevronRight } from 'lucide-react';
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
      <section id="step-2" className="scroll-mt-24 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white border-2 border-[#141414] p-8 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-[#141414] text-[#E4E3E0] flex items-center justify-center font-mono text-xs">02</div>
            <h3 className="text-sm font-mono uppercase tracking-[0.3em]">Signal Analysis</h3>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tighter uppercase italic mb-6 leading-none">
            {result.trend}
          </h2>
          <p className="text-lg font-serif leading-relaxed mb-8 opacity-80">
            {result.summary}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-[#141414] border-dashed">
            <div>
              <h4 className="text-[10px] font-mono uppercase opacity-50 mb-4 flex items-center gap-2">
                <Users className="w-3 h-3" /> Impacted Groups
              </h4>
              <div className="flex flex-wrap gap-2">
                {result.affected_groups.map((group, i) => (
                  <span key={i} className="px-2 py-1 bg-gray-100 border border-[#141414] text-[10px] font-mono uppercase">
                    {group}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-[10px] font-mono uppercase opacity-50 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-3 h-3" /> New Problems
              </h4>
              <ul className="space-y-2">
                {result.problems.map((problem, i) => (
                  <li key={i} className="text-xs font-medium flex gap-2">
                    <span className="text-red-500">→</span> {problem}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-[#141414] text-[#E4E3E0] p-8 flex flex-col justify-between shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)]">
          <div>
            <div className="flex items-center gap-2 mb-8 opacity-60">
              <Lightbulb className="w-4 h-4" />
              <span className="text-[10px] font-mono uppercase tracking-widest">Agent Recommendation</span>
            </div>
            <h3 className="text-xs font-mono uppercase tracking-[0.3em] mb-4 text-emerald-400">Primary Opportunity</h3>
            <h2 className="text-4xl font-bold tracking-tighter uppercase italic leading-none mb-6">
              {result.best_idea.name}
            </h2>
          </div>
          <div className="space-y-6">
            <div className="border-l-2 border-emerald-500 pl-4 py-1">
              <p className="text-sm font-serif italic leading-relaxed opacity-80">
                &quot;{result.best_idea.reason}&quot;
              </p>
            </div>
            <div className="bg-white/5 p-4 border border-white/10">
              <p className="text-[10px] font-mono uppercase opacity-50 mb-1">Execution Speed</p>
              <p className="text-lg font-bold text-emerald-400">{result.best_idea.speed_rating}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Layer 03: Opportunity Matrix */}
      <section id="step-3" className="scroll-mt-24 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#141414] text-[#E4E3E0] flex items-center justify-center font-mono text-xs">03</div>
            <h2 className="text-2xl font-serif italic border-b border-[#141414] pb-2">Opportunity Matrix</h2>
          </div>
          
          <div className="flex flex-wrap items-center gap-6 bg-white border border-[#141414] p-3 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
            <div className="flex items-center gap-2 border-r border-gray-200 pr-4">
              <button 
                onClick={() => setFilterType('top')}
                className={`px-3 py-1 text-[10px] font-mono uppercase transition-all ${filterType === 'top' ? 'bg-[#141414] text-[#E4E3E0]' : 'hover:bg-gray-100'}`}
              >
                Money Score
              </button>
              <button 
                onClick={() => setFilterType('hot')}
                className={`px-3 py-1 text-[10px] font-mono uppercase transition-all ${filterType === 'hot' ? 'bg-[#141414] text-[#E4E3E0]' : 'hover:bg-gray-100'}`}
              >
                Hot This Week
              </button>
              <button 
                onClick={() => setFilterType('fast')}
                className={`px-3 py-1 text-[10px] font-mono uppercase transition-all ${filterType === 'fast' ? 'bg-[#141414] text-[#E4E3E0]' : 'hover:bg-gray-100'}`}
              >
                Fastest to Launch
              </button>
            </div>

            <div className="flex items-center gap-4">
              {/* Score Filter */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase opacity-50">Min Score:</span>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={minScore} 
                  onChange={(e) => setMinScore(parseInt(e.target.value))}
                  className="w-24 accent-[#141414]"
                />
                <span className="text-[10px] font-mono font-bold w-6">{minScore}</span>
              </div>

              {/* Cost Filter */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase opacity-50">Max Cost:</span>
                <input 
                  type="range" 
                  min="0" 
                  max="2000" 
                  step="100"
                  value={maxCost} 
                  onChange={(e) => setMaxCost(parseInt(e.target.value))}
                  className="w-24 accent-[#141414]"
                />
                <span className="text-[10px] font-mono font-bold w-12">${maxCost}</span>
              </div>

              {/* Grant Filter */}
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative">
                  <input 
                    type="checkbox" 
                    checked={grantOnly} 
                    onChange={(e) => setGrantOnly(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-8 h-4 bg-gray-200 rounded-full transition-colors ${grantOnly ? 'bg-emerald-500' : ''}`} />
                  <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${grantOnly ? 'translate-x-4' : ''}`} />
                </div>
                <span className="text-[10px] font-mono uppercase opacity-50 group-hover:opacity-100 transition-opacity">Grant Only</span>
              </label>
            </div>
          </div>
        </div>

        {filteredOpportunities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          <div className="text-center py-20 border border-dashed border-[#141414] opacity-50">
            <p className="font-mono text-sm uppercase">No opportunities match the current filter.</p>
          </div>
        )}
      </section>

      {/* Layer 4: Execution Layer */}
      <section id="step-4" className="scroll-mt-24 bg-[#141414] text-[#E4E3E0] p-8 md:p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Trophy className="w-48 h-48" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-[#E4E3E0] text-[#141414] w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs">
              04
            </div>
            <h3 className="text-sm font-mono uppercase tracking-[0.3em]">🚀 Take Action</h3>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-4xl md:text-6xl font-bold tracking-tighter uppercase italic mb-6">
                {result.best_idea.name}
              </h2>
              <p className="text-lg opacity-80 font-serif leading-relaxed mb-8">
                {result.best_idea.reason}
              </p>
              
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <p className="text-[10px] uppercase opacity-50 font-mono mb-1">Cost Estimate</p>
                  <p className="text-xl font-bold text-emerald-400">{result.best_idea.cost_estimate}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase opacity-50 font-mono mb-1">Speed Rating</p>
                  <p className="text-xl font-bold">{result.best_idea.speed_rating}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#E4E3E0] flex items-center justify-center text-[#141414]">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] uppercase opacity-50 font-mono">Who should build it</p>
                  <p className="font-bold">{result.best_idea.who_should_build}</p>
                </div>
              </div>

              <button 
                onClick={() => {
                  const bestOpp = result.opportunities.find(o => o.name === result.best_idea.name);
                  if (bestOpp) generateDeepDive(bestOpp);
                }}
                className="mt-8 bg-[#E4E3E0] text-[#141414] px-8 py-4 text-xs font-mono uppercase tracking-widest hover:bg-white transition-all flex items-center gap-3 border border-transparent hover:border-[#E4E3E0]"
              >
                Generate Full Execution Suite
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="bg-[#E4E3E0] text-[#141414] p-8">
              <h4 className="text-xs font-mono uppercase tracking-widest mb-6 border-b border-[#141414] pb-2">
                Steps to Launch
              </h4>
              <ul className="space-y-6">
                {result.best_idea.first_steps.map((step, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="text-2xl font-bold font-serif italic">0{i+1}</span>
                    <p className="text-sm font-medium">{step}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
};
