'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, X, Zap, BarChart3, Rocket, Sparkles } from 'lucide-react';
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
    color: 'text-accent',
    bg: 'bg-accent/5',
    border: 'border-accent/10',
  },
  {
    icon: BarChart3,
    number: '02',
    title: 'Get scored opportunities',
    body: 'The AI extracts business ideas with a Money Score (0–100) based on ROI, speed to launch, local fit, and competition gap.',
    color: 'text-primary',
    bg: 'bg-primary/5',
    border: 'border-primary/10',
  },
  {
    icon: Rocket,
    number: '03',
    title: 'Build your execution plan',
    body: 'One tap generates a 30-day checklist, cost breakdown, grant finder, and investor matches. Save it to your pipeline and track progress.',
    color: 'text-secondary',
    bg: 'bg-secondary/5',
    border: 'border-secondary/10',
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
      className="mt-8 mb-8"
    >
      {/* Step Walkthrough */}
      <div className="bg-white border border-border/10 rounded-3xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/5 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted font-bold">Platform Guide</span>
          </div>
          <button
            onClick={handleDismiss}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-muted hover:text-foreground"
            aria-label="Dismiss platform guide"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Tabs */}
        <div className="flex border-b border-border/5 p-1 bg-gray-50/30">
          {steps.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveStep(i)}
              aria-selected={activeStep === i}
              role="tab"
              className={`flex-1 py-3 rounded-xl text-[10px] font-mono uppercase tracking-widest transition-all duration-200 font-bold ${
                activeStep === i
                  ? 'bg-white text-foreground shadow-sm border border-border/5'
                  : 'text-muted hover:text-foreground hover:bg-white/50'
              }`}
            >
              Step {s.number}
            </button>
          ))}
        </div>

        {/* Step Content */}
        <div className="p-6 md:p-10">
          <AnimatePresence mode="wait">
            {steps.map((s, i) =>
              activeStep === i ? (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="flex flex-col md:flex-row md:items-center gap-6 md:gap-10"
                >
                  <div className={`w-16 h-16 rounded-2xl ${s.bg} border ${s.border} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                    <s.icon className={`w-7 h-7 ${s.color}`} />
                  </div>
                  <div className="space-y-3 flex-1">
                    <h3 className="font-serif italic text-2xl md:text-3xl leading-tight tracking-tight">{s.title}</h3>
                    <p className="text-base text-muted leading-relaxed font-medium">{s.body}</p>
                  </div>
                </motion.div>
              ) : null
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-10 pt-6 border-t border-border/5">
            <div className="flex gap-2">
              {steps.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setActiveStep(i)}
                  aria-label={`Go to step ${i + 1}: ${s.title}`}
                  aria-current={activeStep === i ? 'step' : undefined}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    activeStep === i ? 'bg-primary w-8' : 'bg-gray-200 w-2'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-4">
              {activeStep < steps.length - 1 ? (
                <button
                  onClick={() => setActiveStep(i => i + 1)}
                  className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest font-bold text-foreground hover:text-primary transition-colors group"
                >
                  Next Step <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              ) : (
                <button
                  onClick={() => setShowPreview(v => !v)}
                  className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest font-bold text-secondary hover:opacity-70 transition-opacity group"
                >
                  {showPreview ? 'Hide Preview' : 'See Example Output'} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Example Output */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-border/5" />
                <span className="text-[9px] font-mono uppercase tracking-widest text-muted font-bold">Interactive Preview</span>
                <div className="h-px flex-1 bg-border/5" />
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
                className="w-full py-5 bg-foreground text-background rounded-2xl font-mono text-[11px] uppercase tracking-widest font-bold hover:bg-foreground/90 transition-all shadow-xl shadow-foreground/10 active:scale-[0.98]"
              >
                Got it — Start Analyzing
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick dismiss */}
      {!showPreview && (
        <div className="mt-4 text-center">
          <button
            onClick={handleDismiss}
            className="text-[10px] font-mono uppercase text-muted hover:text-foreground transition-colors tracking-widest font-bold"
          >
            Skip Walkthrough
          </button>
        </div>
      )}
    </motion.div>
  );
};
