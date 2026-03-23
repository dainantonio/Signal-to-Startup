'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, X, Zap, BarChart3, Rocket } from 'lucide-react';
import demoResultData from '../demo-result.json';
import { OpportunityCard } from './OpportunityCard';
import { AnalysisResult } from './types';

const demoResult = demoResultData as unknown as AnalysisResult;

const steps = [
  {
    icon: Zap,
    number: '01',
    title: 'Drop in a signal',
    body: 'Paste any news article, policy update, or market shift. Or pick from the Live Feed — real headlines updated every 30 minutes.',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  {
    icon: BarChart3,
    number: '02',
    title: 'Get scored opportunities',
    body: 'The AI extracts business ideas with a Money Score (0–100) based on ROI, speed to launch, local fit, and competition gap.',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
  },
  {
    icon: Rocket,
    number: '03',
    title: 'Build your execution plan',
    body: 'One tap generates a 30-day checklist, cost breakdown, grant finder, and investor matches. Save it to your pipeline and track progress.',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
];

interface OnboardingProps {
  onDismiss?: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onDismiss }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  const handleDismiss = () => {
    try { localStorage.setItem('s2s_onboarded', '1'); } catch {}
    onDismiss?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4 }}
      className="mt-8 mb-4"
    >
      {/* Step Walkthrough */}
      <div className="bg-white border-2 border-[#141414] shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#141414]/10">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-40">How it works</span>
          <button
            onClick={handleDismiss}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors opacity-40 hover:opacity-100"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Tabs */}
        <div className="flex border-b border-[#141414]/10">
          {steps.map((s, i) => (
            <button
              key={i}
              onClick={() => setActiveStep(i)}
              className={`flex-1 py-3 text-[10px] font-mono uppercase tracking-wider transition-all border-r last:border-r-0 border-[#141414]/10 ${
                activeStep === i
                  ? 'bg-[#141414] text-[#E4E3E0]'
                  : 'hover:bg-gray-50 opacity-50'
              }`}
            >
              {s.number}
            </button>
          ))}
        </div>

        {/* Step Content */}
        <div className="p-5 md:p-8">
          <AnimatePresence mode="wait">
            {steps.map((s, i) =>
              activeStep === i ? (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col md:flex-row md:items-start gap-5"
                >
                  <div className={`w-12 h-12 rounded-full ${s.bg} border ${s.border} flex items-center justify-center flex-shrink-0`}>
                    <s.icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                  <div className="space-y-2 flex-1">
                    <h3 className="font-serif italic text-xl md:text-2xl leading-tight">{s.title}</h3>
                    <p className="text-sm text-[#141414]/60 leading-relaxed">{s.body}</p>
                  </div>
                </motion.div>
              ) : null
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 pt-5 border-t border-[#141414]/10">
            <div className="flex gap-1.5">
              {steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveStep(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    activeStep === i ? 'bg-[#141414] w-5' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            {activeStep < steps.length - 1 ? (
              <button
                onClick={() => setActiveStep(i => i + 1)}
                className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider hover:opacity-60 transition-opacity"
              >
                Next <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => setShowPreview(v => !v)}
                className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-emerald-600 hover:opacity-70 transition-opacity"
              >
                {showPreview ? 'Hide example' : 'See example output'} <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Example Output — only shown when user requests it */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35 }}
            className="overflow-hidden"
          >
            <div className="pt-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-[#141414]/10" />
                <span className="text-[9px] font-mono uppercase tracking-[0.2em] opacity-30">Example output</span>
                <div className="h-px flex-1 bg-[#141414]/10" />
              </div>
              <div className="relative">
                <OpportunityCard
                  opp={demoResult.opportunities[0]}
                  index={0}
                  isBestIdea={false}
                  generateDeepDive={() => {}}
                  isReadOnly={true}
                />
              </div>
              <button
                onClick={handleDismiss}
                className="w-full py-3.5 bg-[#141414] text-[#E4E3E0] font-mono text-[11px] uppercase tracking-[0.2em] hover:bg-black transition-all shadow-[4px_4px_0px_0px_rgba(20,20,20,0.2)] active:translate-x-px active:translate-y-px active:shadow-none"
              >
                Got it — start analyzing
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick dismiss if no preview */}
      {!showPreview && (
        <div className="mt-3 text-center">
          <button
            onClick={handleDismiss}
            className="text-[10px] font-mono uppercase opacity-30 hover:opacity-60 transition-opacity tracking-wider"
          >
            Skip — I know what I'm doing
          </button>
        </div>
      )}
    </motion.div>
  );
};
