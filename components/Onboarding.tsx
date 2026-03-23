'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, Zap, Target, ArrowRight, ShieldCheck, BarChart3 } from 'lucide-react';

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
      <section className="relative overflow-hidden rounded-2xl border border-[#141414]/10 bg-[#f9f9f9] p-8 md:p-12">
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

          {/* Mock Opportunity Card */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-tr from-emerald-500/10 to-transparent blur-2xl rounded-full opacity-50"></div>
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="relative bg-white border border-[#141414] p-6 shadow-2xl rotate-1 hover:rotate-0 transition-transform duration-500"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-mono uppercase tracking-widest opacity-40">Sample Opportunity</p>
                  <h4 className="text-2xl font-serif italic">Micro-SaaS for Local Artisans</h4>
                </div>
                <div className="bg-[#141414] text-white px-3 py-1 text-[10px] font-mono uppercase">94 Score</div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-3 bg-stone-50 border border-[#141414]/5">
                  <p className="text-[9px] font-mono uppercase opacity-40 mb-1">Setup Cost</p>
                  <p className="font-mono text-sm tracking-tighter">$450</p>
                </div>
                <div className="p-3 bg-stone-50 border border-[#141414]/5">
                  <p className="text-[9px] font-mono uppercase opacity-40 mb-1">Difficulty</p>
                  <p className="font-mono text-sm tracking-tighter">Low (2/10)</p>
                </div>
              </div>

              <div className="space-y-3 mb-8">
                <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[85%]"></div>
                </div>
                <p className="text-xs text-[#141414]/60 italic">&quot;High demand for digital inventory management in rural craft markets.&quot;</p>
              </div>

              <button className="w-full py-3 border border-[#141414] font-mono text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#141414] hover:text-white transition-colors group">
                Deep Dive Analysis <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};
