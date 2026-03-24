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
- Default parish context: Kingston, St. Andrew, St. James, and Manchester represent the primary urban and semi-urban markets. Tailor at least 2 ideas to these parishes, accounting for their distinct consumer bases (urban professionals in Kingston/St. Andrew, tourism in St. James, inland SMEs in Manchester).
- Informal sector framing: A significant portion of economic activity flows through market vendors, higglers, corner shops, and informal service providers. Prioritize ideas that serve or formalize this segment — tools for inventory tracking, mobile payments, bulk-buying cooperatives, or digital storefronts for informal traders are high-fit.
- DBJ grant eligibility pre-screening: For each opportunity marked grant_eligible, assess whether it meets DBJ criteria: job creation potential, innovation component, rural/underserved market focus, or agri-business linkage. Flag ideas that would qualify for DBJ's Business Recovery and Stimulus Programme or the CARICOM Trade Fund.
- Comparable platforms: Reference YardHub (Jamaican marketplace/logistics layer) and YardieBiz (informal business directory and B2B network) when assessing competitive landscape. Identify whitespace these platforms have not yet captured — especially last-mile delivery, vendor financing, and skills-based gig matching.
- Consider local constraints: high energy costs (favour solar-adjacent or low-power models), import reliance (favour locally-sourced or digital products), tourism-heavy economies (seasonal demand, foreign-currency revenue), and mobile-first infrastructure (WhatsApp-native tools, USSD fallbacks).
- Use local terminology where appropriate (e.g., "hustle", "link up", "yard", "higgler", "corner shop").`
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
