'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from '@google/genai';
import { MarketMode } from './types';
import { getCountryConfig } from '@/lib/rss-sources';
import { auth, db, addDoc, collection } from '@/firebase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ValidateStep = 'input' | 'analyzing' | 'results';

interface ValidationResult {
  validation_score: number;
  verdict: 'Strong Signal' | 'Moderate Signal' | 'Weak Signal' | 'Counter Signal';
  verdict_reason: string;
  market_overview: string;
  local_policy: string;
  supporting_evidence: string[];
  risk_factors: string[];
  market_timing: 'Perfect timing' | 'Good timing' | 'Early' | 'Late to market';
  timing_reason: string;
  funding_sources: { name: string; description: string; url: string }[];
  ideal_customer: string;
  competitive_landscape: string;
  recommended_pivot: string;
  first_move: string[];
  estimated_startup_cost: {
    low: number;
    high: number;
    local_low: string;
    local_high: string;
    notes: string;
  };
}

interface ValidateModeProps {
  selectedMode: MarketMode;
  countryTag: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sanitize(str: string): string {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[*#`_~]/g, '').replace(/\s+/g, ' ').trim();
}

function sanitizeArray(arr: unknown): string[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((s): s is string => typeof s === 'string' && s.length > 0)
    .map(sanitize)
    .filter(s => s.length > 0);
}

function exportValidation(
  result: ValidationResult,
  ideaText: string,
  countryTag: string,
) {
  const sep = '='.repeat(50);
  const lines = [
    'SIGNAL TO STARTUP',
    'BUSINESS IDEA VALIDATION REPORT',
    `Generated: ${new Date().toLocaleDateString()}`,
    `Country: ${countryTag}`,
    sep,
    '',
    'YOUR IDEA',
    ideaText,
    '',
    sep,
    `VALIDATION SCORE: ${result.validation_score}/100`,
    `VERDICT: ${result.verdict}`,
    '',
    result.verdict_reason,
    '',
    sep,
    'MARKET OVERVIEW',
    result.market_overview,
    '',
    sep,
    'LOCAL POLICY AND REGULATIONS',
    result.local_policy,
    '',
    sep,
    'SUPPORTING FACTORS',
    ...result.supporting_evidence.map((e, i) => `${i + 1}. ${e}`),
    '',
    'RISK FACTORS',
    ...result.risk_factors.map((r, i) => `${i + 1}. ${r}`),
    '',
    sep,
    `MARKET TIMING: ${result.market_timing}`,
    result.timing_reason,
    '',
    sep,
    'FUNDING SOURCES',
    ...result.funding_sources.map(
      f => `${f.name}\n   ${f.description}${f.url ? '\n   ' + f.url : ''}`,
    ),
    '',
    sep,
    'STARTUP COST ESTIMATE',
    `USD: $${result.estimated_startup_cost.low.toLocaleString()} - $${result.estimated_startup_cost.high.toLocaleString()}`,
    result.estimated_startup_cost.local_low
      ? `Local: ${result.estimated_startup_cost.local_low} - ${result.estimated_startup_cost.local_high}`
      : '',
    result.estimated_startup_cost.notes,
    '',
    sep,
    'IDEAL CUSTOMER',
    result.ideal_customer,
    '',
    'COMPETITIVE LANDSCAPE',
    result.competitive_landscape,
    '',
    result.recommended_pivot ? `RECOMMENDED PIVOT\n${result.recommended_pivot}` : '',
    '',
    sep,
    'YOUR FIRST 3 MOVES',
    ...result.first_move.map((m, i) => `${i + 1}. ${m}`),
    '',
    sep,
    'signal-to-startup.vercel.app',
    'Powered by EntrepAIneur',
  ].filter(l => l !== undefined && l !== null);

  const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `validation-${countryTag.replace(/\s/g, '-').toLowerCase()}-${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Country list for selector
// ---------------------------------------------------------------------------

const PRESET_COUNTRIES = [
  'Jamaica', 'Trinidad', 'Barbados', 'Guyana',
  'Nigeria', 'Ghana', 'Kenya',
  'United States', 'United Kingdom',
];

const BUSINESS_TYPES = [
  'Service business', 'Product / retail', 'Tech / app',
  'Food & beverage', 'Consulting', 'E-commerce',
  'Agriculture', 'Tourism', 'Healthcare', 'Education',
];

// ---------------------------------------------------------------------------
// IdeaInputScreen
// ---------------------------------------------------------------------------

function IdeaInputScreen({
  ideaText,
  setIdeaText,
  localCountry,
  setLocalCountry,
  onSubmit,
}: {
  ideaText: string;
  setIdeaText: (v: string) => void;
  localCountry: string;
  setLocalCountry: (v: string) => void;
  onSubmit: () => void;
}) {
  const isReady = ideaText.trim().length > 30;
  const countryConfig = localCountry ? getCountryConfig(localCountry) : null;
  const isPreset = PRESET_COUNTRIES.map(c => c.toLowerCase()).includes(localCountry.toLowerCase());

  return (
    <motion.div
      key="input"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-5 py-4 max-w-xl mx-auto"
    >
      <div>
        <h2 className="text-lg font-semibold">Validate your business idea</h2>
        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
          Describe your idea in detail. Include what you sell, who you serve, and where.
          Select your country for local policy, market conditions, and funding sources.
        </p>
      </div>

      {/* Country selector */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Your target country <span className="text-red-400">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {PRESET_COUNTRIES.map(country => {
            const cfg = getCountryConfig(country);
            const isSelected = localCountry.toLowerCase() === country.toLowerCase();
            return (
              <button
                key={country}
                type="button"
                onClick={() => setLocalCountry(isSelected ? '' : country)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500'
                }`}
              >
                <span>{cfg?.flag ?? '🌍'}</span>
                <span>{country}</span>
              </button>
            );
          })}
        </div>
        <input
          type="text"
          placeholder="Or type any country..."
          value={isPreset ? '' : localCountry}
          onChange={e => setLocalCountry(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
        />
      </div>

      {/* Business type chips */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Business type
        </label>
        <div className="flex flex-wrap gap-2">
          {BUSINESS_TYPES.map(type => (
            <button
              key={type}
              type="button"
              onClick={() => {
                if (!ideaText.toLowerCase().includes(type.toLowerCase())) {
                  setIdeaText(ideaText ? `${ideaText} (${type})` : type);
                }
              }}
              className="px-3 py-1.5 rounded-full border border-gray-200 text-xs text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-all"
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Idea textarea */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Describe your idea <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <textarea
            value={ideaText}
            onChange={e => setIdeaText(e.target.value)}
            placeholder={
              localCountry
                ? `e.g. I want to open a financial consulting business in ${localCountry} targeting small business owners who need help with taxes, bookkeeping, and accessing government grants...`
                : 'Describe your business idea in detail. What do you sell? Who are your customers? What problem does it solve?'
            }
            maxLength={1000}
            rows={6}
            className="w-full p-4 rounded-xl border border-gray-200 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-black resize-none"
          />
          <span className="absolute bottom-3 right-3 text-xs text-gray-400">
            {ideaText.length}/1000
          </span>
        </div>
      </div>

      {/* What you will get */}
      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          Your validation report will include
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[
            'Validation score 0-100',
            'Market timing assessment',
            'Local policy and regulations',
            'Available grants and funding',
            'Target customer profile',
            'Competitive landscape',
            'Risk factors',
            'First 3 action steps',
          ].map(item => (
            <div key={item} className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className="text-green-500 flex-shrink-0">✓</span>
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Country context preview */}
      {countryConfig && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <span className="text-xl">{countryConfig.flag}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-blue-800">
              Validating for {countryConfig.name}
            </p>
            <p className="text-xs text-blue-600">
              Currency: {countryConfig.currency} · Region: {countryConfig.region}
            </p>
          </div>
        </div>
      )}

      {/* Submit */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={!isReady || !localCountry}
        className="w-full py-3.5 bg-black text-white rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-900 transition-colors"
      >
        {!localCountry
          ? 'Select a country to continue'
          : !isReady
          ? 'Describe your idea to continue'
          : `Validate for ${localCountry} →`}
      </button>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// AnalyzingScreen
// ---------------------------------------------------------------------------

function AnalyzingScreen({ countryTag }: { countryTag: string }) {
  const [stage, setStage] = useState(0);
  const stages = [
    `Researching ${countryTag || 'local'} market conditions...`,
    'Checking local policies and regulations...',
    'Identifying funding sources...',
    'Assessing competitive landscape...',
    'Calculating validation score...',
    'Preparing your report...',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStage(s => Math.min(s + 1, stages.length - 1));
    }, 3000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      key="analyzing"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center py-20 space-y-6 max-w-xs mx-auto text-center"
    >
      <div className="w-12 h-12 border-2 border-black border-t-transparent rounded-full animate-spin" />
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-800">{stages[stage]}</p>
        <p className="text-xs text-gray-400">This takes about 15-20 seconds</p>
      </div>
      <div className="flex gap-1.5">
        {stages.map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all duration-500 ${
              i <= stage ? 'w-6 bg-black' : 'w-2 bg-gray-200'
            }`}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// ValidationResults
// ---------------------------------------------------------------------------

function ValidationResults({
  result,
  ideaText,
  countryTag,
  onRefine,
  onReset,
}: {
  result: ValidationResult;
  ideaText: string;
  countryTag: string;
  onRefine: () => void;
  onReset: () => void;
}) {
  const countryConfig = getCountryConfig(countryTag);

  const scoreColor =
    result.validation_score >= 80 ? 'text-green-600' :
    result.validation_score >= 60 ? 'text-amber-600' :
    result.validation_score >= 40 ? 'text-gray-600' :
    'text-red-600';

  const scoreBg =
    result.validation_score >= 80 ? 'bg-green-50 border-green-200' :
    result.validation_score >= 60 ? 'bg-amber-50 border-amber-200' :
    result.validation_score >= 40 ? 'bg-gray-50 border-gray-200' :
    'bg-red-50 border-red-200';

  return (
    <motion.div
      key="results"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4 py-4 max-w-xl mx-auto"
    >
      {/* Score card */}
      <div className={`p-6 rounded-2xl border-2 text-center ${scoreBg}`}>
        <div className={`text-5xl font-bold ${scoreColor} mb-1`}>
          {result.validation_score}
          <span className="text-2xl font-normal opacity-50">/100</span>
        </div>
        <div className={`text-base font-semibold ${scoreColor} mb-3`}>
          {result.verdict}
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">{result.verdict_reason}</p>
        {countryConfig && (
          <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-gray-500">
            <span>{countryConfig.flag}</span>
            <span>Validated for {countryConfig.name}</span>
          </div>
        )}
      </div>

      {/* Market overview */}
      <div className="p-4 rounded-xl border border-gray-200 space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Market overview in {countryTag}
        </p>
        <p className="text-sm text-gray-700 leading-relaxed">{result.market_overview}</p>
      </div>

      {/* Local policy */}
      <div className="p-4 rounded-xl border border-blue-200 bg-blue-50 space-y-2">
        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
          Local policy and regulations
        </p>
        <p className="text-sm text-blue-900 leading-relaxed">{result.local_policy}</p>
      </div>

      {/* Supporting evidence */}
      {result.supporting_evidence.length > 0 && (
        <div className="p-4 rounded-xl border border-green-200 bg-green-50 space-y-2">
          <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">
            Supporting factors
          </p>
          <ol className="space-y-2">
            {result.supporting_evidence.map((e, i) => (
              <li key={i} className="flex gap-2 text-sm text-green-900 leading-relaxed">
                <span className="text-green-500 font-medium flex-shrink-0">{i + 1}.</span>
                {e}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Risk factors */}
      {result.risk_factors.length > 0 && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 space-y-2">
          <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">
            Risk factors
          </p>
          <ol className="space-y-2">
            {result.risk_factors.map((r, i) => (
              <li key={i} className="flex gap-2 text-sm text-red-900 leading-relaxed">
                <span className="text-red-400 font-medium flex-shrink-0">{i + 1}.</span>
                {r}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Market timing */}
      <div className="p-4 rounded-xl border border-gray-200 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Market timing
          </p>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
            result.market_timing === 'Perfect timing' ? 'bg-green-100 text-green-800' :
            result.market_timing === 'Good timing' ? 'bg-blue-100 text-blue-800' :
            result.market_timing === 'Early' ? 'bg-amber-100 text-amber-800' :
            'bg-red-100 text-red-800'
          }`}>
            {result.market_timing}
          </span>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">{result.timing_reason}</p>
      </div>

      {/* Funding sources */}
      {result.funding_sources?.length > 0 && (
        <div className="p-4 rounded-xl border border-gray-200 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Funding sources in {countryTag}
          </p>
          <div className="space-y-3">
            {result.funding_sources.map((f, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded-lg space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-gray-800">{f.name}</p>
                  {f.url && (
                    <a
                      href={f.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline flex-shrink-0"
                    >
                      Visit
                    </a>
                  )}
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Startup cost */}
      {result.estimated_startup_cost && (
        <div className="p-4 rounded-xl border border-gray-200 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Estimated startup cost
          </p>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold text-gray-800">
              ${result.estimated_startup_cost.low.toLocaleString()} –
              ${result.estimated_startup_cost.high.toLocaleString()}
            </span>
            <span className="text-xs text-gray-400 mb-1">USD</span>
          </div>
          {result.estimated_startup_cost.local_low && (
            <p className="text-sm text-gray-500">
              {result.estimated_startup_cost.local_low} –{' '}
              {result.estimated_startup_cost.local_high}{' '}
              {getCountryConfig(countryTag)?.currency ?? ''}
            </p>
          )}
          <p className="text-xs text-gray-500 leading-relaxed">
            {result.estimated_startup_cost.notes}
          </p>
        </div>
      )}

      {/* Ideal customer */}
      <div className="p-4 rounded-xl border border-gray-200 space-y-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Ideal customer in {countryTag}
        </p>
        <p className="text-sm text-gray-700 leading-relaxed">{result.ideal_customer}</p>
      </div>

      {/* Competitive landscape */}
      <div className="p-4 rounded-xl border border-gray-200 space-y-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Competitive landscape
        </p>
        <p className="text-sm text-gray-700 leading-relaxed">{result.competitive_landscape}</p>
      </div>

      {/* Recommended pivot */}
      {result.recommended_pivot && (
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 space-y-1">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
            Recommended pivot
          </p>
          <p className="text-sm text-amber-900 leading-relaxed">{result.recommended_pivot}</p>
        </div>
      )}

      {/* First moves */}
      <div className="p-4 rounded-xl border border-gray-200 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Your first 3 moves in {countryTag}
        </p>
        <ol className="space-y-3">
          {result.first_move.map((move, i) => (
            <li key={i} className="flex gap-3 text-sm text-gray-700 leading-relaxed">
              <span className="flex-shrink-0 w-6 h-6 bg-black text-white rounded-full text-xs flex items-center justify-center font-medium">
                {i + 1}
              </span>
              {move}
            </li>
          ))}
        </ol>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 pt-2 pb-8">
        <button
          type="button"
          onClick={() => exportValidation(result, ideaText, countryTag)}
          className="w-full py-3 border-2 border-black text-black rounded-xl text-sm font-medium hover:bg-black hover:text-white transition-colors"
        >
          Download Validation Report
        </button>
        <button
          type="button"
          onClick={onRefine}
          className="w-full py-2.5 text-sm text-gray-500 hover:text-black transition-colors"
        >
          Refine my idea
        </button>
        <button
          type="button"
          onClick={onReset}
          className="w-full py-2 text-sm text-gray-400 hover:text-black transition-colors"
        >
          Start over
        </button>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export const ValidateMode: React.FC<ValidateModeProps> = ({ selectedMode, countryTag: propCountryTag }) => {
  const [step, setStep] = useState<ValidateStep>('input');
  const [ideaText, setIdeaText] = useState('');
  const [localCountry, setLocalCountry] = useState(propCountryTag || '');
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  // Sync if parent country changes and user hasn't set their own
  useEffect(() => {
    if (propCountryTag && !localCountry) setLocalCountry(propCountryTag);
  }, [propCountryTag, localCountry]);

  const genAI = () =>
    new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY! });

  const handleValidate = async () => {
    setStep('analyzing');
    setError('');
    abortRef.current = new AbortController();

    const countryConfig = localCountry ? getCountryConfig(localCountry) : null;
    const currency = countryConfig?.currency ?? 'USD';
    const region = countryConfig?.region ?? selectedMode;

    try {
      const response = await genAI().models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
          role: 'user',
          parts: [{
            text: `You are a business validation expert specializing in emerging and developing markets. Validate this business idea thoroughly.

BUSINESS IDEA:
"${ideaText}"

TARGET COUNTRY: ${localCountry}
MARKET REGION: ${region}
LOCAL CURRENCY: ${currency}

Provide a thorough validation covering:
1. Whether this business is viable in ${localCountry}
2. Specific local policies and regulations that apply to this type of business
3. Real market conditions in ${localCountry} for this industry
4. Specific funding sources available in ${localCountry} for this idea
5. Who the ideal local customer actually is
6. What competition looks like locally
7. Key risks specific to ${localCountry}
8. Concrete first steps for THIS country

CRITICAL FORMATTING RULES:
- Use plain English only
- No markdown syntax
- No asterisks, hashes, backticks, or symbols of any kind
- Write in clean paragraphs and numbered lists only
- All currency in local currency (${currency}) AND USD
- Be specific to ${localCountry} — not generic advice

Return ONLY this JSON object. No text before or after. No markdown:
{
  "validation_score": a number between 0 and 100,
  "verdict": exactly one of: "Strong Signal" or "Moderate Signal" or "Weak Signal" or "Counter Signal",
  "verdict_reason": "2 to 3 plain sentences explaining the score. No symbols.",
  "market_overview": "3 to 4 sentences about current market conditions in ${localCountry} for this type of business. Be specific.",
  "local_policy": "2 to 3 sentences about specific regulations, licenses, or permits required in ${localCountry} for this business.",
  "supporting_evidence": [
    "Plain sentence about market support factor 1",
    "Plain sentence about market support factor 2",
    "Plain sentence about market support factor 3"
  ],
  "risk_factors": [
    "Plain sentence about risk 1",
    "Plain sentence about risk 2"
  ],
  "market_timing": exactly one of: "Perfect timing" or "Good timing" or "Early" or "Late to market",
  "timing_reason": "1 to 2 plain sentences.",
  "funding_sources": [
    {
      "name": "Name of grant or loan program in ${localCountry}",
      "description": "Plain sentence about what it offers and eligibility",
      "url": "official website URL or empty string"
    }
  ],
  "ideal_customer": "Specific description of the ideal customer in ${localCountry}.",
  "competitive_landscape": "2 sentences about competition in ${localCountry}.",
  "recommended_pivot": "One sentence pivot suggestion or empty string if not needed",
  "first_move": [
    "Specific action step 1 for ${localCountry}",
    "Specific action step 2 for ${localCountry}",
    "Specific action step 3 for ${localCountry}"
  ],
  "estimated_startup_cost": {
    "low": a number in USD,
    "high": a number in USD,
    "local_low": "amount in ${currency}",
    "local_high": "amount in ${currency}",
    "notes": "Plain sentence about what costs to expect"
  }
}`,
          }],
        }],
        config: { maxOutputTokens: 2000 },
      });

      const rawText = response.text ?? '';
      console.log('[VALIDATE] raw response preview:', rawText.substring(0, 200));

      let parsed: ValidationResult | null = null;

      // Try 1: direct parse
      try {
        parsed = JSON.parse(rawText.trim());
      } catch { /* fall through */ }

      // Try 2: find JSON object in response
      if (!parsed) {
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try { parsed = JSON.parse(jsonMatch[0]); } catch { /* fall through */ }
        }
      }

      if (!parsed) throw new Error('Could not parse validation response');

      // Sanitize all text fields
      parsed.verdict_reason = sanitize(parsed.verdict_reason);
      parsed.market_overview = sanitize(parsed.market_overview);
      parsed.local_policy = sanitize(parsed.local_policy);
      parsed.timing_reason = sanitize(parsed.timing_reason);
      parsed.ideal_customer = sanitize(parsed.ideal_customer);
      parsed.competitive_landscape = sanitize(parsed.competitive_landscape);
      parsed.recommended_pivot = sanitize(parsed.recommended_pivot ?? '');
      parsed.supporting_evidence = sanitizeArray(parsed.supporting_evidence);
      parsed.risk_factors = sanitizeArray(parsed.risk_factors);
      parsed.first_move = sanitizeArray(parsed.first_move);
      if (Array.isArray(parsed.funding_sources)) {
        parsed.funding_sources = parsed.funding_sources.map(f => ({
          name: sanitize(f.name ?? ''),
          description: sanitize(f.description ?? ''),
          url: typeof f.url === 'string' ? f.url.trim() : '',
        }));
      } else {
        parsed.funding_sources = [];
      }

      setResult(parsed);
      setStep('results');

      // Save to Firestore silently
      if (auth.currentUser) {
        addDoc(collection(db, 'idea_validations'), {
          userId: auth.currentUser.uid,
          idea: ideaText,
          countryTag: localCountry || null,
          marketMode: selectedMode,
          validationScore: parsed.validation_score,
          verdict: parsed.verdict,
          result: parsed,
          createdAt: new Date().toISOString(),
        }).catch(err => console.warn('Validation save failed:', err));
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      console.error('[VALIDATE] failed:', err);
      setError('Validation failed. Please try again.');
      setStep('input');
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}
      <AnimatePresence mode="wait">
        {step === 'input' && (
          <IdeaInputScreen
            ideaText={ideaText}
            setIdeaText={setIdeaText}
            localCountry={localCountry}
            setLocalCountry={setLocalCountry}
            onSubmit={handleValidate}
          />
        )}
        {step === 'analyzing' && <AnalyzingScreen countryTag={localCountry} />}
        {step === 'results' && result && (
          <ValidationResults
            result={result}
            ideaText={ideaText}
            countryTag={localCountry}
            onRefine={() => setStep('input')}
            onReset={() => {
              setStep('input');
              setIdeaText('');
              setResult(null);
              setError('');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
