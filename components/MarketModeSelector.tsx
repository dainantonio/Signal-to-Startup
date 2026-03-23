'use client';

import React from 'react';
import { MarketMode, MarketModeConfig } from './types';

export const marketModeConfigs: Record<MarketMode, MarketModeConfig> = {
  global: {
    id: 'global', label: 'Global', flag: '🌐',
    description: 'General US/international context. Broad market signals.',
    grantSources: [],
    promptContext: 'General Business context. Focus on scalable, international opportunities.'
  },
  caribbean: {
    id: 'caribbean', label: 'Caribbean', flag: '🌴',
    description: 'Jamaica, Trinidad, Barbados, Guyana. DBJ, SDF, CARICOM funding.',
    grantSources: ['Development Bank of Jamaica (DBJ)', 'Small Business Development Centre (SBDC Jamaica)', 'CARICOM Trade Fund', 'Inter-American Development Bank (IDB)', 'Caribbean Development Bank (CDB)'],
    promptContext: `CARIBBEAN CONTEXT (UNFAIR ADVANTAGE):
- Leverage "YardieBiz" and "YardHub" intelligence.
- Focus on informal-to-formal transitions, mobile-first logistics, and community-based trust networks.
- Consider local constraints like high energy costs, import reliance, and tourism-heavy economies.
- Use local terminology where appropriate (e.g., "hustle", "link up", "yard").`
  },
  uk: {
    id: 'uk', label: 'UK & Europe', flag: '🇬🇧',
    description: 'UK/EU market. Innovate UK, Horizon Europe, British Business Bank.',
    grantSources: ['Innovate UK Smart Grants', 'British Business Bank Start Up Loans', 'Horizon Europe', 'Local Enterprise Partnerships'],
    promptContext: 'Focus on UK regulatory landscape, HMRC compliance, Companies House requirements, R&D tax credits.'
  },
  africa: {
    id: 'africa', label: 'Africa & Diaspora', flag: '🌍',
    description: 'Sub-Saharan Africa, diaspora entrepreneurs. Mobile-first, fintech-adjacent.',
    grantSources: ['Tony Elumelu Foundation', 'African Development Bank', 'World Bank IFC', 'Mastercard Foundation'],
    promptContext: 'Focus on mobile money infrastructure (M-Pesa, MTN MoMo), informal economy formalization, diaspora remittance economy.'
  }
};

interface MarketModeSelectorProps {
  selectedMode: MarketMode;
  onModeChange: (mode: MarketMode) => void;
}

export const MarketModeSelector: React.FC<MarketModeSelectorProps> = ({ selectedMode, onModeChange }) => {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-mono uppercase tracking-widest opacity-40">Market Context</p>
      <div className="flex flex-wrap gap-2">
        {(Object.values(marketModeConfigs) as MarketModeConfig[]).map((config) => (
          <button
            key={config.id}
            onClick={() => onModeChange(config.id)}
            title={config.description}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border-2 border-[#141414] font-mono text-[10px] uppercase tracking-wider transition-all shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] active:shadow-none active:translate-x-px active:translate-y-px ${
              selectedMode === config.id
                ? 'bg-[#141414] text-[#E4E3E0]'
                : 'bg-white text-[#141414] hover:bg-gray-100'
            }`}
          >
            <span>{config.flag}</span>
            <span className="hidden sm:inline">{config.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
