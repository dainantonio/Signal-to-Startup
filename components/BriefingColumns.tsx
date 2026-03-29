'use client';

import React from 'react';
import { Users, AlertTriangle, TrendingUp, Lightbulb } from 'lucide-react';
import { AnalysisResult } from './types';

interface BriefingColumnsProps {
  result: AnalysisResult;
}

export const BriefingColumns: React.FC<BriefingColumnsProps> = ({ result }) => {
  return (
    <section id="step-2" className="scroll-mt-24 mb-16">
      {/* Section Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-serif font-bold text-gray-900 mb-2">
          Intelligence Briefing
        </h2>
        <p className="text-base text-gray-600">
          Key findings from market signal analysis
        </p>
      </div>

      {/* Two Equal Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT COLUMN: Emerging Trend + Evidence */}
        <div className="space-y-6">
          {/* Emerging Trend */}
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm min-h-[400px] flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Emerging Trend
                </h3>
              </div>
            </div>

            <div className="flex-1">
              <h4 className="text-2xl font-serif font-bold text-gray-900 mb-6 leading-tight">
                {result.trend}
              </h4>
              <div className="prose prose-sm max-w-none">
                <p className="text-base text-gray-700 leading-relaxed">
                  {result.summary}
                </p>
              </div>
            </div>
          </div>

          {/* Evidence Snippets */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Key Evidence
              </h3>
            </div>

            <div className="space-y-4">
              {result.problems.slice(0, 3).map((problem, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white border border-gray-300 flex items-center justify-center mt-0.5">
                    <span className="text-xs font-semibold text-gray-600">{i + 1}</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed flex-1">
                    {problem}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Impacted Groups + Frictions */}
        <div className="space-y-6">
          {/* Impacted Groups */}
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm min-h-[250px]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Impacted Groups
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {result.affected_groups.map((group, i) => (
                <div
                  key={i}
                  className="px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl"
                >
                  <p className="text-sm font-medium text-blue-900">
                    {group}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Market Friction & Problems */}
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm min-h-[250px]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Market Friction
              </h3>
            </div>

            <div className="space-y-4">
              {result.problems.map((problem, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex-shrink-0 w-2 h-2 rounded-full bg-amber-500 mt-2" />
                  <p className="text-sm text-gray-700 leading-relaxed flex-1">
                    {problem}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
