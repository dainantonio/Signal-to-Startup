'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Search, BarChart3, Grid3x3, Rocket, Check } from 'lucide-react';

interface Step {
  id: number;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface WorkflowStepperProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
}

const STEPS: Step[] = [
  { id: 1, label: 'Signal', icon: Search },
  { id: 2, label: 'Trend', icon: BarChart3 },
  { id: 3, label: 'Opportunities', icon: Grid3x3 },
  { id: 4, label: 'Execution', icon: Rocket },
];

export const WorkflowStepper: React.FC<WorkflowStepperProps> = ({ currentStep, onStepClick }) => {
  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      <div className="relative flex items-center justify-between">
        {/* Progress line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200" />
        <motion.div
          className="absolute top-5 left-0 h-0.5 bg-black"
          initial={{ width: '0%' }}
          animate={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />

        {/* Steps */}
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;
          const isClickable = onStepClick && (isCompleted || isActive);

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => isClickable && onStepClick(step.id)}
                disabled={!isClickable}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isActive
                    ? 'bg-black text-white ring-4 ring-black/10 scale-110'
                    : isCompleted
                    ? 'bg-black text-white hover:scale-105'
                    : 'bg-white border-2 border-gray-200 text-gray-400'
                } ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </button>
              <span
                className={`text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive ? 'text-black font-semibold' : isCompleted ? 'text-gray-700' : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
