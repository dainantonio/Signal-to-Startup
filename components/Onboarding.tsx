'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Lightbulb, Zap, Target, ArrowRight, ShieldCheck, BarChart3 } from 'lucide-react';
import demoResultData from '../demo-result.json';
import { OpportunityCard } from './OpportunityCard';
import { AnalysisResult } from './types';

const demoResult = demoResultData as unknown as AnalysisResult;

export const Onboarding = () => {
  return (
    <div className="mt-16 space-y-24">
      {/* How it Works Section */}
      <section>
        <div className="flex items-center gap-4 mb-12">
          <div className="h-[1px] flex-grow bg-[#141414] opacity-10"></div>
          <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-40">Intelligence Protocol</h2>
          <div className="h-[1px] flex-grow bg-[#141414] opacity-10"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <div className="w-8 h-8 rounded-full border border-[#141414] flex items-center justify-center font-mono text-xs">01</div>
            <h3 className="font-serif italic text-xl">Signal Ingestion</h3>
            <p className="text-sm text-[#141414]/60 leading-relaxed">
              Input a market signal, regulatory shift, or emerging trend. Our agent parses the underlying inefficiency.
            </p>
          </div>
          <div className="space-y-4">
            <div className="w-8 h-8 rounded-full border border-[#141414] flex items-center justify-center font-mono text-xs">02</div>
            <h3 className="font-serif italic text-xl">Opportunity Synthesis</h3>
            <p className="text-sm text-[#141414]/60 leading-relaxed">
              We cross-reference the signal with low-cost execution models to generate high-probability business ventures.
            </p>
          </div>
          <div className="space-y-4">
            <div className="w-8 h-8 rounded-full border border-[#141414] flex items-center justify-center font-mono text-xs">03</div>
            <h3 className="font-serif italic text-xl">Execution Blueprint</h3>
            <p className="text-sm text-[#141414]/60 leading-relaxed">
              Get a full 30-day launch sequence, cost breakdown, and investor matches for your selected opportunity.
            </p>
          </div>
        </div>
      </section>

      {/* Preview Section */}
      <section className="relative overflow-hidden border-2 border-[#141414] bg-white p-8 md:p-12 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Target size={200} />
        </div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-mono uppercase tracking-wider">
              <Zap size={12} /> Live Intelligence Preview
            </div>
            <h2 className="text-4xl md:text-5xl font-serif italic leading-tight">
              Turn abstract trends into <span className="text-emerald-600">concrete ventures.</span>
            </h2>
            <p className="text-lg text-[#141414]/60">
              Stop guessing. Use first-principles analysis to find market gaps that others miss.
            </p>
            
            <div className="space-y-4 pt-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 text-emerald-600"><ShieldCheck size={18} /></div>
                <div>
                  <p className="font-medium">Validated Models</p>
                  <p className="text-sm text-[#141414]/50">Every result is vetted for low-cost feasibility.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 text-emerald-600"><BarChart3 size={18} /></div>
                <div>
                  <p className="font-medium">Data-Driven Scoring</p>
                  <p className="text-sm text-[#141414]/50">Objective metrics for scalability and difficulty.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Real Opportunity Card Preview */}
          <div className="relative">
            <div className="absolute -top-4 left-4 z-20 bg-[#141414] text-[#E4E3E0] px-3 py-1 text-[9px] font-mono uppercase tracking-widest font-bold shadow-[2px_2px_0px_0px_rgba(20,20,20,0.2)]">
              Example Output
            </div>
            <OpportunityCard 
              opp={demoResult.opportunities[0]} 
              index={0} 
              isBestIdea={false} 
              generateDeepDive={() => {}} 
              isReadOnly={true}
            />
          </div>
        </div>
      </section>
    </div>
  );
};
