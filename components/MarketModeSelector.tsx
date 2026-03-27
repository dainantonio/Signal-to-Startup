'use client';

import React from 'react';
import { MarketMode, MarketModeConfig } from './types';

export const marketModeConfigs: Record<MarketMode, MarketModeConfig> = {
  global: {
    id: 'global', label: 'Global / US', flag: '🌐',
    description: 'United States and worldwide markets. Broad signals.',
    grantSources: ['Small Business Administration (SBA)', 'SBIR/STTR Federal Grants', 'Angel Capital Association', 'National Venture Capital Association'],
    promptContext: 'Focus on US market dynamics, scalable business models, and international opportunities. Reference SBA programs where relevant.'
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
  africa: {
    id: 'africa', label: 'Africa', flag: '🌍',
    description: 'Sub-Saharan Africa, diaspora entrepreneurs. Mobile-first, fintech-adjacent.',
    grantSources: ['Tony Elumelu Foundation', 'African Development Bank', 'World Bank IFC', 'Mastercard Foundation', 'Bank of Industry (BOI) Nigeria'],
    promptContext: 'Focus on mobile money infrastructure (M-Pesa, MTN MoMo), informal economy formalization, diaspora remittance economy, and leapfrog technology adoption.'
  },
  uk: {
    id: 'uk', label: 'UK & Europe', flag: '🇬🇧',
    description: 'UK/EU market. Innovate UK, Horizon Europe, British Business Bank.',
    grantSources: ['Innovate UK Smart Grants', 'British Business Bank Start Up Loans', 'Horizon Europe', 'Local Enterprise Partnerships', "Prince's Trust Enterprise Programme"],
    promptContext: 'Focus on UK regulatory landscape, HMRC compliance, Companies House requirements, R&D tax credits, and EU market access.'
  },
  latam: {
    id: 'latam', label: 'Latin America', flag: '🌎',
    description: 'Mexico, Brazil, Colombia, Argentina. IDB, BNDES, Endeavor ecosystem.',
    grantSources: ['Inter-American Development Bank (IDB)', 'BNDES (Brazil Development Bank)', 'iNNpulsa Colombia', 'INADEM Mexico', 'Endeavor Network', 'CORFO Chile'],
    promptContext: `LATIN AMERICA CONTEXT:
- Focus on Spanish and Portuguese speaking markets
- Consider informal economy and cash-based transactions
- Mobile-first population with growing fintech adoption
- Reference IDB and local development bank programs
- Consider remittance corridors from US diaspora
- Account for regulatory variation between countries
- Strong e-commerce and logistics growth sector`
  },
};

interface MarketModeSelectorProps {
  selectedMode: MarketMode;
  onModeChange: (mode: MarketMode) => void;
}

export const MarketModeSelector: React.FC<MarketModeSelectorProps> = ({ selectedMode, onModeChange }) => {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted font-bold">Select Market</p>
      <div className="flex flex-wrap gap-2">
        {(Object.values(marketModeConfigs) as MarketModeConfig[]).map((config) => (
          <button
            key={config.id}
            type="button"
            onClick={() => onModeChange(config.id)}
            aria-pressed={selectedMode === config.id}
            title={config.description}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border-2 border-foreground font-mono text-[10px] uppercase tracking-wider transition-all shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] active:shadow-none active:translate-x-px active:translate-y-px ${
              selectedMode === config.id
                ? 'bg-foreground text-background'
                : 'bg-white text-foreground hover:bg-gray-100'
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
