'use client';

import React, { useState } from 'react';
import { Grid3x3, SlidersHorizontal } from 'lucide-react';
import { AnalysisResult, Opportunity } from './types';
import { OpportunityCard } from './OpportunityCard';

interface OpportunityGridProps {
  result: AnalysisResult;
  filteredOpportunities: Opportunity[];
  filterType: 'top' | 'hot' | 'fast';
  setFilterType: (type: 'top' | 'hot' | 'fast') => void;
  grantOnly: boolean;
  setGrantOnly: (val: boolean) => void;
  generateDeepDive: (opp: Opportunity) => void;
  countryTags?: string[];
}

export const OpportunityGrid: React.FC<OpportunityGridProps> = ({
  result,
  filteredOpportunities,
  filterType,
  setFilterType,
  grantOnly,
  setGrantOnly,
  generateDeepDive,
  countryTags = [],
}) => {
  return (
    <section id="step-3" className="scroll-mt-24 mb-16">
      {/* Section Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="text-3xl font-serif font-bold text-gray-900 mb-2">
            Opportunity Pages
          </h2>
          <p className="text-base text-gray-600">
            {filteredOpportunities.length} actionable opportunities identified
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 border border-gray-200 rounded-xl p-1">
            {[
              { id: 'top', label: 'ROI' },
              { id: 'hot', label: 'Urgent' },
              { id: 'fast', label: 'Fast' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filterType === f.id
                    ? 'bg-white text-black shadow-sm'
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setGrantOnly(!grantOnly)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
              grantOnly
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            {grantOnly && <span className="w-2 h-2 bg-white rounded-full animate-pulse" />}
            Grant Only
          </button>
        </div>
      </div>

      {/* Opportunity Cards Grid */}
      {filteredOpportunities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOpportunities.map((opp, i) => (
            <OpportunityCard
              key={i}
              opp={opp}
              index={i}
              isBestIdea={opp.name === result.best_idea.name}
              generateDeepDive={generateDeepDive}
              countryTags={countryTags}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 border-2 border-dashed border-gray-200 bg-gray-50 rounded-3xl">
          <Grid3x3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-sm font-medium text-gray-500">
            No opportunities match the current filters
          </p>
        </div>
      )}
    </section>
  );
};
