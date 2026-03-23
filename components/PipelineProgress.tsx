'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, Search, BarChart3, Target, Rocket } from 'lucide-react';

interface PipelineProgressProps {
  currentStep: number;
  steps: { id: number; label: string; icon: any }[];
}

export const PipelineProgress: React.FC<PipelineProgressProps> = ({ currentStep, steps }) => {
  return (
    <div className="sticky top-4 z-40 mb-8">
      <div className="bg-white/80 backdrop-blur-md border border-[#141414] p-2 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] max-w-fit mx-auto">
        <div className="flex items-center gap-1 md:gap-4 px-2">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep >= step.id;
            const isCurrent = currentStep === step.id;

            return (
              <React.Fragment key={step.id}>
                <div className="flex items-center gap-2 group relative">
                  <div 
                    className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-500 ${
                      isActive 
                        ? 'bg-[#141414] border-[#141414] text-[#E4E3E0]' 
                        : 'bg-white border-gray-200 text-gray-400'
                    } ${isCurrent ? 'ring-2 ring-offset-2 ring-[#141414]' : ''}`}
                  >
                    {isActive && currentStep > step.id ? (
                      <Check size={14} />
                    ) : (
                      <Icon size={14} />
                    )}
                  </div>
                  <span className={`hidden md:block text-[10px] font-mono uppercase tracking-widest transition-opacity duration-500 ${
                    isActive ? 'opacity-100 font-bold' : 'opacity-30'
                  }`}>
                    {step.label}
                  </span>
                  
                  {/* Tooltip for mobile */}
                  <div className="md:hidden absolute -bottom-8 left-1/2 -translate-x-1/2 bg-[#141414] text-[#E4E3E0] text-[8px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {step.label}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-[1px] w-4 md:w-8 transition-colors duration-500 ${
                    currentStep > step.id ? 'bg-[#141414]' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
