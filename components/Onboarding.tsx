'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MarketMode, SectorKey } from './types';
import { COUNTRY_CONTEXT } from '@/lib/rss-sources';
import Logo from './Logo';
import { auth, db, doc, setDoc } from '@/firebase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UserPreferences {
  marketMode: MarketMode;
  countryTag: string;
  sectors: SectorKey[];
  businessTypes: string[];
}

interface OnboardingProps {
  onComplete: (prefs: UserPreferences) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ALL_SECTORS: SectorKey[] = [
  'ai', 'policy', 'markets', 'funding',
  'sustainability', 'realestate', 'health', 'ai_intelligence'
];

const SECTOR_LABELS: Record<SectorKey, string> = {
  ai: 'AI & Tech',
  policy: 'Policy & Regulation',
  markets: 'Market Shifts',
  funding: 'Funding & Grants',
  sustainability: 'Sustainability',
  realestate: 'Real Estate',
  health: 'Health',
  ai_intelligence: 'AI Intelligence',
};

const SECTOR_ICONS: Record<SectorKey, string> = {
  ai: '🤖',
  policy: '📋',
  markets: '📈',
  funding: '💰',
  sustainability: '🌱',
  realestate: '🏠',
  health: '❤️',
  ai_intelligence: '🧠',
};

const BUSINESS_TYPES = [
  'Service business',
  'Product / retail',
  'Tech / app',
  'Food & beverage',
  'Consulting',
  'E-commerce',
  'Agriculture',
  'Tourism',
  'Healthcare',
  'Education',
  'Finance',
  'Creative / media',
];

const MARKETS: { id: MarketMode; flag: string; label: string; description: string }[] = [
  {
    id: 'global',
    flag: '🌐',
    label: 'Global / US',
    description: 'United States and worldwide. The largest market with the most signals.',
  },
  {
    id: 'caribbean',
    flag: '🌴',
    label: 'Caribbean',
    description: 'Jamaica, Trinidad, Barbados, Guyana and across the Caribbean.',
  },
  {
    id: 'africa',
    flag: '🌍',
    label: 'Africa',
    description: 'Nigeria, Ghana, Kenya, Rwanda and across the continent.',
  },
  {
    id: 'uk',
    flag: '🇬🇧',
    label: 'UK & Europe',
    description: 'United Kingdom and European markets.',
  },
  {
    id: 'latam',
    flag: '🌎',
    label: 'Latin America',
    description: 'Mexico, Brazil, Colombia, Chile, Argentina and across LatAm.',
  },
];

const COUNTRY_OPTIONS: Record<MarketMode, string[]> = {
  global: ['United States', 'Canada', 'Australia', 'Singapore', 'UAE', 'India'],
  caribbean: ['Jamaica', 'Trinidad', 'Barbados', 'Guyana', 'Haiti', 'Bahamas'],
  africa: ['Nigeria', 'Ghana', 'Kenya', 'South Africa', 'Rwanda', 'Ethiopia'],
  uk: ['United Kingdom', 'Ireland', 'Germany', 'France', 'Netherlands'],
  latam: ['Mexico', 'Brazil', 'Colombia', 'Argentina', 'Chile', 'Peru'],
};

function getCountryFlag(country: string): string {
  return COUNTRY_CONTEXT[country.toLowerCase()]?.flag ?? '🌍';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [marketMode, setMarketMode] = useState<MarketMode>('global');
  const [countryTag, setCountryTag] = useState('');
  const [sectors, setSectors] = useState<SectorKey[]>(ALL_SECTORS);
  const [businessTypes, setBusinessTypes] = useState<string[]>([]);

  const totalSteps = 3;

  const handleComplete = async () => {
    const prefs: UserPreferences = { marketMode, countryTag, sectors, businessTypes };
    localStorage.setItem('userPreferences', JSON.stringify(prefs));
    localStorage.setItem('onboardingComplete', 'true');

    // Also persist to Firestore so the agent can read preferences server-side
    try {
      const user = auth.currentUser;
      if (user) {
        await setDoc(doc(db, 'user_preferences', user.uid), {
          ...prefs,
          userId: user.uid,
          email: user.email,
          displayName: user.displayName,
          updatedAt: new Date().toISOString(),
          digestEnabled: true,
        });
        console.log('[ONBOARDING] Preferences saved to Firestore');
      }
    } catch (error) {
      console.warn('[ONBOARDING] Firestore save failed:', error);
      // Don't block — localStorage already saved
    }

    onComplete(prefs);
  };

  const toggleSector = (sector: SectorKey) => {
    setSectors(prev =>
      prev.includes(sector)
        ? prev.length > 1 ? prev.filter(s => s !== sector) : prev
        : [...prev, sector]
    );
  };

  const toggleBusinessType = (type: string) => {
    setBusinessTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">

      {/* Progress bar */}
      <div className="h-1 bg-gray-100">
        <motion.div
          className="h-full bg-black"
          animate={{ width: `${(step / totalSteps) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
        <Logo size="sm" showWordmark theme="light" />
        <span className="text-xs text-gray-400">{step} of {totalSteps}</span>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">

          {/* STEP 1 — Market */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
              className="px-4 py-8 max-w-lg mx-auto space-y-6"
            >
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                  Step 1 of 3
                </p>
                <h2 className="text-2xl font-bold text-gray-900">
                  Where are you building?
                </h2>
                <p className="text-sm text-gray-500 leading-relaxed">
                  We will tailor your signal feed and opportunity analysis to your market.
                </p>
              </div>

              <div className="space-y-3">
                {MARKETS.map(market => (
                  <button
                    key={market.id}
                    type="button"
                    onClick={() => { setMarketMode(market.id); setCountryTag(''); }}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                      marketMode === market.id
                        ? 'border-black bg-gray-50'
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <span className="text-3xl flex-shrink-0">{market.flag}</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{market.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{market.description}</p>
                    </div>
                    {marketMode === market.id && (
                      <span className="ml-auto text-black font-bold flex-shrink-0">✓</span>
                    )}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500">
                  Narrow to a specific country (optional)
                </p>
                <div className="flex flex-wrap gap-2">
                  {COUNTRY_OPTIONS[marketMode].map(country => {
                    const isSelected = countryTag === country;
                    return (
                      <button
                        key={country}
                        type="button"
                        onClick={() => setCountryTag(isSelected ? '' : country)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-black text-white border-black'
                            : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500'
                        }`}
                      >
                        <span>{getCountryFlag(country)}</span>
                        <span>{country}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2 — Sectors */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
              className="px-4 py-8 max-w-lg mx-auto space-y-6"
            >
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                  Step 2 of 3
                </p>
                <h2 className="text-2xl font-bold text-gray-900">
                  What signals interest you?
                </h2>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Your feed will prioritize these sectors. You can always change this later.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {ALL_SECTORS.map(sector => {
                  const isSelected = sectors.includes(sector);
                  return (
                    <button
                      key={sector}
                      type="button"
                      onClick={() => toggleSector(sector)}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                        isSelected
                          ? 'border-black bg-gray-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-xl flex-shrink-0">{SECTOR_ICONS[sector]}</span>
                      <span className="text-sm font-medium text-gray-800">
                        {SECTOR_LABELS[sector]}
                      </span>
                      <div className={`ml-auto w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        isSelected ? 'bg-black border-black' : 'border-gray-300'
                      }`}>
                        {isSelected && <span className="text-white text-xs">✓</span>}
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setSectors(ALL_SECTORS)}
                className="text-xs text-gray-400 underline hover:text-black transition-colors"
              >
                Select all
              </button>
            </motion.div>
          )}

          {/* STEP 3 — Business type */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
              className="px-4 py-8 max-w-lg mx-auto space-y-6"
            >
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                  Step 3 of 3
                </p>
                <h2 className="text-2xl font-bold text-gray-900">
                  What type of business interests you?
                </h2>
                <p className="text-sm text-gray-500 leading-relaxed">
                  We will highlight opportunities that match your preferred business model.
                  Skip if you are open to anything.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {BUSINESS_TYPES.map(type => {
                  const isSelected = businessTypes.includes(type);
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleBusinessType(type)}
                      className={`px-4 py-2 rounded-full border-2 text-sm font-medium transition-all ${
                        isSelected
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>

              {/* Preferences summary */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Your preferences
                </p>
                <div className="space-y-1">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Market:</span>{' '}
                    {MARKETS.find(m => m.id === marketMode)?.label}
                    {countryTag ? ` → ${countryTag}` : ''}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Sectors:</span>{' '}
                    {sectors.length === ALL_SECTORS.length
                      ? 'All sectors'
                      : sectors.map(s => SECTOR_LABELS[s]).join(', ')
                    }
                  </p>
                  {businessTypes.length > 0 && (
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Business types:</span>{' '}
                      {businessTypes.join(', ')}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Footer navigation */}
      <div className="flex-shrink-0 px-4 py-4 border-t border-gray-100 bg-white">
        <div className="max-w-lg mx-auto flex gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              className="px-5 py-3 border-2 border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:border-gray-400 transition-colors"
            >
              ← Back
            </button>
          )}
          {step < totalSteps ? (
            <button
              type="button"
              onClick={() => setStep(s => s + 1)}
              className="flex-1 py-3 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-900 transition-colors"
            >
              Continue →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleComplete}
              className="flex-1 py-3 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-900 transition-colors"
            >
              Take me to my feed →
            </button>
          )}
        </div>
        {step === 1 && (
          <button
            type="button"
            onClick={handleComplete}
            className="w-full mt-2 py-2 text-xs text-gray-400 hover:text-black transition-colors"
          >
            Skip setup — show me everything
          </button>
        )}
      </div>
    </div>
  );
}
