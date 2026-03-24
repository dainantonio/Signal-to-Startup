'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';

interface PipelineProgressProps {
  currentStep: number;
  steps: { id: number; label: string; icon: any }[];
}

export const PipelineProgress: React.FC<PipelineProgressProps> = ({ currentStep, steps }) => {
  return (
    <div className="sticky top-4 z-40 mb-10">
      <div className="bg-white/80 backdrop-blur-xl border border-border/10 p-2 rounded-2xl shadow-2xl shadow-black/5 max-w-fit mx-auto">
        <div className="flex items-center gap-1 md:gap-4 px-2">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep >= step.id;
            const isCurrent = currentStep === step.id;

            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center gap-1 md:flex-row md:items-center md:gap-3">
                  <div
                    aria-label={`Step ${step.id}: ${step.label}${isActive && currentStep > step.id ? ' (completed)' : isCurrent ? ' (current)' : ''}`}
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-500 ${
                      isActive
                        ? 'bg-foreground border-foreground text-background shadow-lg shadow-foreground/10'
                        : 'bg-white border-border/10 text-muted'
                    } ${isCurrent ? 'ring-2 ring-offset-2 ring-primary/50' : ''}`}
                  >
                    {isActive && currentStep > step.id ? (
                      <Check size={16} strokeWidth={3} />
                    ) : (
                      <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                    )}
                  </div>
                  {/* Label: always visible on mobile (below icon), inline on md+ */}
                  <div className="flex flex-col items-center md:items-start">
                    <span className={`hidden md:block text-[8px] font-mono uppercase tracking-widest transition-opacity duration-500 ${
                      isActive ? 'opacity-40 font-bold' : 'opacity-20'
                    }`}>
                      Step 0{step.id}
                    </span>
                    <span className={`text-[8px] md:text-[10px] font-mono uppercase tracking-widest transition-opacity duration-500 ${
                      isActive ? 'opacity-100 font-bold' : 'opacity-30'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className="flex items-center px-1">
                    <div className={`h-[2px] w-4 md:w-8 rounded-full transition-all duration-700 ${
                      currentStep > step.id ? 'bg-primary shadow-[0_0_8px_rgba(79,70,229,0.4)]' : 'bg-gray-100'
                    }`} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
