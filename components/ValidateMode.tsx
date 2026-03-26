'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from '@google/genai';
import { MarketMode } from './types';
import { COUNTRY_CONTEXT, getCountryConfig } from '@/lib/rss-sources';
import { auth, db, addDoc, collection } from '@/firebase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ValidateStep = 'input' | 'extracting' | 'signals' | 'analyzing' | 'results';

interface ValidationResult {
  validation_score: number;
  verdict: 'Strong Signal' | 'Moderate Signal' | 'Weak Signal' | 'Counter Signal';
  verdict_reason: string;
  supporting_evidence: string[];
  risk_factors: string[];
  market_timing: 'Perfect timing' | 'Good timing' | 'Early' | 'Late to market';
  timing_reason: string;
  recommended_pivot: string | null;
  ideal_customer: string;
  competitive_gap: string;
  first_move: string[];
  signal_sources: string[];
}

interface ScoredSignal {
  title: string;
  snippet: string;
  url: string;
  source: string;
  sector: string;
  relevanceScore: number;
  signalType: 'SUPPORTING' | 'RISK' | 'NEUTRAL';
  matchedKeywords: string[];
}

interface ValidateModeProps {
  selectedMode: MarketMode;
  countryTag: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildCountryBlock(countryTag: string): string {
  if (!countryTag) return '';
  const ctx = COUNTRY_CONTEXT[countryTag.toLowerCase()];
  if (!ctx) return '';
  return `Local currency: ${ctx.currency}. Consider local infrastructure, banking access, and market realities specific to ${countryTag}.`;
}

const SUPPORTING_WORDS = [
  'growth', 'demand', 'surge', 'opportunity', 'funding', 'investment',
  'shortage', 'expanding', 'launches', 'new market', 'billion', 'million',
  'raises', 'backed', 'record', 'booming', 'accelerating',
];
const RISK_WORDS = [
  'competition', 'saturated', 'declining', 'threat', 'challenge',
  'incumbent', 'dominant', 'barriers', 'struggles', 'fails', 'shutdown', 'bankrupt',
];

function classifySignal(text: string): 'SUPPORTING' | 'RISK' | 'NEUTRAL' {
  const lower = text.toLowerCase();
  if (RISK_WORDS.some(w => lower.includes(w))) return 'RISK';
  if (SUPPORTING_WORDS.some(w => lower.includes(w))) return 'SUPPORTING';
  return 'NEUTRAL';
}

function EXAMPLE_IDEAS(mode: MarketMode, countryTag: string): string[] {
  const tag = countryTag?.toLowerCase();
  if (tag === 'jamaica' || tag === 'trinidad' || tag === 'barbados' || mode === 'caribbean') {
    return [
      'I want to start a solar panel installation service targeting rural homeowners in Jamaica who are dealing with frequent JPS power outages and high electricity bills. I would offer affordable payment plans and handle everything from permits to installation.',
      'I want to launch a WhatsApp-based ordering system for food vendors and higglers in Kingston markets to accept digital payments and manage orders from customers more efficiently.',
      'I want to create a tourism experience booking platform connecting small tour operators in Montego Bay with international visitors looking for authentic local experiences beyond the typical resort packages.',
    ];
  }
  if (mode === 'africa' || tag === 'nigeria' || tag === 'ghana' || tag === 'kenya') {
    return [
      'I want to start a mobile money agent training business helping informal traders in Lagos accept digital payments and manage their finances using existing fintech infrastructure.',
      'I want to launch a last-mile delivery service for e-commerce businesses in Accra using motorcycle couriers with real-time tracking via WhatsApp updates.',
    ];
  }
  if (mode === 'uk') {
    return [
      'I want to start an AI automation consulting service for small UK businesses that want to reduce administrative costs but don\'t know where to start with tools like Make, Zapier, or custom GPTs.',
      'I want to launch a hyperlocal delivery cooperative for independent retailers in London competing with Amazon same-day delivery.',
    ];
  }
  return [
    'I want to start an AI automation consulting service for small businesses that want to reduce administrative costs but don\'t know where to start with tools like Make, Zapier, or custom workflows.',
    'I want to launch a subscription box service for Caribbean food products targeting the diaspora market in the United States and Canada.',
  ];
}

function exportValidation(
  result: ValidationResult,
  ideaText: string,
  signals: ScoredSignal[],
  countryTag: string,
) {
  const sep = '─'.repeat(50);
  const lines = [
    'SIGNAL TO STARTUP — IDEA VALIDATION REPORT',
    `Generated: ${new Date().toLocaleDateString()}`,
    sep,
    '',
    'YOUR IDEA:',
    ideaText,
    '',
    countryTag ? `Market: ${countryTag}` : '',
    '',
    sep,
    `VALIDATION SCORE: ${result.validation_score}/100`,
    `VERDICT: ${result.verdict}`,
    '',
    result.verdict_reason,
    '',
    sep,
    'SUPPORTING EVIDENCE:',
    ...result.supporting_evidence.map(e => `✓ ${e}`),
    '',
    'RISK FACTORS:',
    ...result.risk_factors.map(r => `⚠ ${r}`),
    '',
    sep,
    `MARKET TIMING: ${result.market_timing}`,
    result.timing_reason,
    '',
    `IDEAL CUSTOMER: ${result.ideal_customer}`,
    '',
    `COMPETITIVE GAP: ${result.competitive_gap}`,
    '',
    result.recommended_pivot ? `RECOMMENDED PIVOT: ${result.recommended_pivot}` : '',
    '',
    sep,
    'YOUR FIRST MOVES:',
    ...result.first_move.map((m, i) => `${i + 1}. ${m}`),
    '',
    sep,
    'SIGNALS USED:',
    ...signals.map(s => `[${s.signalType}] ${s.title}`),
    '',
    sep,
    'signal-to-startup.vercel.app',
    'Powered by EntrepAIneur',
  ].filter(l => l !== undefined);

  const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `validation-${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function IdeaInputScreen({
  ideaText,
  setIdeaText,
  selectedMode,
  countryTag,
  onSubmit,
}: {
  ideaText: string;
  setIdeaText: (v: string) => void;
  selectedMode: MarketMode;
  countryTag: string;
  onSubmit: () => void;
}) {
  const isReady = ideaText.trim().length > 50;
  const countryConfig = getCountryConfig(countryTag);
  const examples = EXAMPLE_IDEAS(selectedMode, countryTag);

  return (
    <motion.div
      key="input"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6 py-4"
    >
      <div>
        <h2 className="text-xl font-semibold">Describe your business idea</h2>
        <p className="text-sm text-gray-500 mt-1">
          Be specific — include what you sell, who you serve, and where. The more
          detail you give, the better the market signals we can find.
        </p>
      </div>

      <div className="relative">
        <textarea
          value={ideaText}
          onChange={e => setIdeaText(e.target.value)}
          placeholder="e.g. I want to start a solar panel installation service targeting rural homeowners in Jamaica who are dealing with frequent JPS outages. I would offer affordable payment plans and handle everything from permits to installation..."
          maxLength={1000}
          rows={8}
          className="w-full p-4 rounded-xl border border-gray-200 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-black resize-none"
        />
        <span className="absolute bottom-3 right-3 text-xs text-gray-400">
          {ideaText.length}/1000
        </span>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
          Need inspiration? Try one of these:
        </p>
        <div className="flex flex-col gap-2">
          {examples.map((example, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIdeaText(example)}
              className="text-left text-xs text-gray-600 px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200"
            >
              {example.substring(0, 100)}...
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span>Validating for:</span>
        <span className="px-2 py-0.5 bg-gray-100 rounded-full font-medium">{selectedMode}</span>
        {countryConfig && (
          <span className="px-2 py-0.5 bg-gray-100 rounded-full font-medium">
            {countryConfig.flag} {countryConfig.name}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={!isReady}
        className="w-full py-3 bg-black text-white rounded-xl text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-900 transition-colors"
      >
        🔍 Find Market Signals
      </button>
    </motion.div>
  );
}

function ExtractingScreen() {
  return (
    <motion.div
      key="extracting"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center py-20 space-y-4"
    >
      <div className="w-12 h-12 border-2 border-black border-t-transparent rounded-full animate-spin" />
      <p className="text-sm font-medium">Extracting keywords from your idea...</p>
      <p className="text-xs text-gray-400">Searching for relevant market signals</p>
    </motion.div>
  );
}

function AnalyzingScreen() {
  return (
    <motion.div
      key="analyzing"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center py-20 space-y-4"
    >
      <div className="w-12 h-12 border-2 border-black border-t-transparent rounded-full animate-spin" />
      <p className="text-sm font-medium">Validating your idea...</p>
      <p className="text-xs text-gray-400">Analyzing market signals against your concept</p>
    </motion.div>
  );
}

function SignalsScreen({
  signals,
  keywords,
  selectedSignals,
  setSelectedSignals,
  onValidate,
  onBack,
  relaxedResults,
  showRefinement,
  refinementSuggestions,
  refining,
  onGetRefinements,
  onApplyRefinement,
}: {
  signals: ScoredSignal[];
  keywords: string[];
  selectedSignals: string[];
  setSelectedSignals: React.Dispatch<React.SetStateAction<string[]>>;
  onValidate: () => void;
  onBack: () => void;
  relaxedResults: boolean;
  showRefinement: boolean;
  refinementSuggestions: string[];
  refining: boolean;
  onGetRefinements: () => void;
  onApplyRefinement: (idea: string) => void;
}) {
  const supporting = signals.filter(s => s.signalType === 'SUPPORTING');
  const risks = signals.filter(s => s.signalType === 'RISK');
  const neutral = signals.filter(s => s.signalType === 'NEUTRAL');

  const toggleSignal = (url: string) => {
    setSelectedSignals(prev =>
      prev.includes(url)
        ? prev.filter(u => u !== url)
        : prev.length < 6
        ? [...prev, url]
        : prev,
    );
  };

  return (
    <motion.div
      key="signals"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      className="space-y-5 py-4"
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-gray-500 hover:text-black transition-colors"
        >
          ←
        </button>
        <div>
          <h2 className="text-lg font-semibold">Market signals found</h2>
          <p className="text-xs text-gray-500">
            {signals.length} signals · {supporting.length} supporting · {risks.length} risks ·{' '}
            {neutral.length} neutral
          </p>
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Searched for</p>
        <div className="flex flex-wrap gap-1.5">
          {keywords.map(k => (
            <span
              key={k}
              className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-200"
            >
              {k}
            </span>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        {[
          { count: supporting.length, label: 'Supporting', bg: 'bg-green-50 border-green-200', text: 'text-green-700', sub: 'text-green-600' },
          { count: risks.length, label: 'Risks', bg: 'bg-red-50 border-red-200', text: 'text-red-700', sub: 'text-red-600' },
          { count: neutral.length, label: 'Neutral', bg: 'bg-gray-50 border-gray-200', text: 'text-gray-700', sub: 'text-gray-500' },
        ].map(({ count, label, bg, text, sub }) => (
          <div key={label} className={`flex-1 p-3 ${bg} rounded-lg border text-center`}>
            <div className={`text-lg font-bold ${text}`}>{count}</div>
            <div className={`text-xs ${sub}`}>{label}</div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500">
        Select up to 6 signals to include in your validation. Top 3 pre-selected.
      </p>

      <div className="space-y-3">
        {signals.map(signal => {
          const isSelected = selectedSignals.includes(signal.url);
          const colorMap = {
            SUPPORTING: { card: 'border-green-300 bg-green-50', badge: 'bg-green-100 text-green-800' },
            RISK: { card: 'border-red-300 bg-red-50', badge: 'bg-red-100 text-red-800' },
            NEUTRAL: { card: 'border-gray-200 bg-white', badge: 'bg-gray-100 text-gray-700' },
          }[signal.signalType];

          return (
            <button
              key={signal.url}
              type="button"
              onClick={() => toggleSignal(signal.url)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                isSelected ? 'border-black bg-white shadow-sm' : `${colorMap.card} opacity-80`
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${colorMap.badge}`}>
                    {signal.signalType}
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono uppercase">
                    {signal.source}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500">
                    {signal.relevanceScore}% match
                  </span>
                  <div
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'bg-black border-black' : 'border-gray-300'
                    }`}
                  >
                    {isSelected && <span className="text-white text-[10px]">✓</span>}
                  </div>
                </div>
              </div>

              <p className="text-sm font-medium leading-snug mb-1">{signal.title}</p>

              {signal.snippet && (
                <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                  {signal.snippet}
                </p>
              )}

              {signal.matchedKeywords.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {signal.matchedKeywords.slice(0, 3).map(k => (
                    <span
                      key={k}
                      className="text-[9px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full"
                    >
                      {k}
                    </span>
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Refinement panel — shown when signals are scarce or results were relaxed */}
      {(signals.length < 4 || relaxedResults) && !refining && (
        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-3">
          <div className="flex items-start gap-2">
            <span className="text-amber-500 text-lg flex-shrink-0">💡</span>
            <div>
              <p className="text-sm font-medium text-amber-800">
                {signals.length === 0
                  ? 'No signals found for this idea'
                  : signals.length < 4
                  ? 'Few signals found for this idea'
                  : 'Results are broadly matched'}
              </p>
              <p className="text-xs text-amber-600 mt-0.5 leading-relaxed">
                Try refining your idea with more specific industry terms, target market,
                or geographic context to find stronger market signals.
              </p>
            </div>
          </div>

          {!showRefinement && (
            <button
              type="button"
              onClick={onGetRefinements}
              disabled={refining}
              className="w-full py-2.5 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              ✨ Help me refine this idea
            </button>
          )}

          {showRefinement && refinementSuggestions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-amber-700 uppercase tracking-wide">
                Try one of these refined versions:
              </p>
              {refinementSuggestions.map((suggestion, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onApplyRefinement(suggestion)}
                  className="w-full text-left p-3 bg-white rounded-lg border border-amber-200 text-sm text-gray-700 leading-relaxed hover:border-amber-400 hover:bg-amber-50 transition-all"
                >
                  <span className="text-amber-500 font-medium text-xs block mb-1">
                    Refinement {i + 1}
                  </span>
                  {suggestion}
                </button>
              ))}
              <button
                type="button"
                onClick={onBack}
                className="w-full py-2 text-xs text-amber-600 hover:text-amber-800"
              >
                ← Edit my idea manually instead
              </button>
            </div>
          )}
        </div>
      )}

      {refining && (
        <div className="flex items-center justify-center gap-3 py-6 text-amber-600">
          <span className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Generating refinements...</span>
        </div>
      )}

      {signals.length === 0 && !refining && !showRefinement && (
        <div className="text-center py-6 space-y-3">
          <div className="text-3xl">🔍</div>
          <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">
            No articles matched your keywords in the current feed. Try refining above or check back later.
          </p>
        </div>
      )}

      {signals.length > 0 && (
        <button
          type="button"
          onClick={onValidate}
          disabled={selectedSignals.length === 0}
          className="w-full py-3 bg-black text-white rounded-xl text-sm font-medium disabled:opacity-40 hover:bg-gray-900 transition-colors sticky bottom-4"
        >
          ⚡ Validate My Idea ({selectedSignals.length} signals selected)
        </button>
      )}
    </motion.div>
  );
}

function ValidationResults({
  result,
  ideaText,
  countryTag,
  signals,
  onRefine,
  onReset,
}: {
  result: ValidationResult;
  ideaText: string;
  selectedMode: MarketMode;
  countryTag: string;
  signals: ScoredSignal[];
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

  const timingBadge =
    result.market_timing === 'Perfect timing' ? 'bg-green-100 text-green-800' :
    result.market_timing === 'Good timing' ? 'bg-blue-100 text-blue-800' :
    result.market_timing === 'Early' ? 'bg-amber-100 text-amber-800' :
    'bg-red-100 text-red-800';

  return (
    <motion.div
      key="results"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-5 py-4"
    >
      {/* Score header */}
      <div className={`p-6 rounded-2xl border-2 text-center ${scoreBg}`}>
        <div className={`text-6xl font-bold ${scoreColor} mb-1`}>
          {result.validation_score}
        </div>
        <div className={`text-lg font-semibold ${scoreColor} mb-2`}>
          {result.verdict}
        </div>
        <p className="text-sm text-gray-600 leading-relaxed max-w-sm mx-auto">
          {result.verdict_reason}
        </p>
      </div>

      {/* Idea summary */}
      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
        <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">Your idea</p>
        <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">{ideaText}</p>
        {countryConfig && (
          <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
            <span>{countryConfig.flag}</span>
            <span>Validated for {countryConfig.name}</span>
          </div>
        )}
      </div>

      {/* Evidence */}
      <div className="p-4 bg-green-50 rounded-xl border border-green-200">
        <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-3">
          ✓ Supporting evidence
        </p>
        <ul className="space-y-2">
          {result.supporting_evidence.map((e, i) => (
            <li key={i} className="text-sm text-green-800 leading-relaxed flex gap-2">
              <span className="text-green-500 flex-shrink-0 mt-0.5">•</span>
              {e}
            </li>
          ))}
        </ul>
      </div>

      {result.risk_factors.length > 0 && (
        <div className="p-4 bg-red-50 rounded-xl border border-red-200">
          <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-3">
            ⚠ Risk factors
          </p>
          <ul className="space-y-2">
            {result.risk_factors.map((r, i) => (
              <li key={i} className="text-sm text-red-800 leading-relaxed flex gap-2">
                <span className="text-red-400 flex-shrink-0 mt-0.5">•</span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Timing + positioning */}
      <div className="p-4 rounded-xl border border-gray-200 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Market timing
          </p>
          <span className={`text-xs font-medium px-3 py-1 rounded-full ${timingBadge}`}>
            {result.market_timing}
          </span>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">{result.timing_reason}</p>

        <div className="pt-3 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Ideal customer
          </p>
          <p className="text-sm text-gray-700">{result.ideal_customer}</p>
        </div>

        <div className="pt-3 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Competitive gap
          </p>
          <p className="text-sm text-gray-700">{result.competitive_gap}</p>
        </div>
      </div>

      {result.recommended_pivot && (
        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">
            💡 Recommended pivot
          </p>
          <p className="text-sm text-amber-800 leading-relaxed">{result.recommended_pivot}</p>
        </div>
      )}

      {/* First moves */}
      <div className="p-4 rounded-xl border border-gray-200">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Your first moves
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

      {/* Signal sources */}
      {signals.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">
            Signals used in validation
          </p>
          <div className="space-y-1">
            {signals.map(s => (
              <div key={s.url} className="flex items-center gap-2 text-xs text-gray-500">
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    s.signalType === 'SUPPORTING'
                      ? 'bg-green-500'
                      : s.signalType === 'RISK'
                      ? 'bg-red-500'
                      : 'bg-gray-400'
                  }`}
                />
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-black hover:underline line-clamp-1"
                >
                  {s.title}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3 pt-2">
        <button
          type="button"
          onClick={() => exportValidation(result, ideaText, signals, countryTag)}
          className="w-full py-3 border-2 border-black text-black rounded-xl text-sm font-medium hover:bg-black hover:text-white transition-colors"
        >
          ⬇ Download Validation Report
        </button>
        <button
          type="button"
          onClick={onRefine}
          className="w-full py-2 text-sm text-gray-500 hover:text-black transition-colors"
        >
          🔄 Refine my idea
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

export const ValidateMode: React.FC<ValidateModeProps> = ({ selectedMode, countryTag }) => {
  const [step, setStep] = useState<ValidateStep>('input');
  const [ideaText, setIdeaText] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [signals, setSignals] = useState<ScoredSignal[]>([]);
  const [selectedSignals, setSelectedSignals] = useState<string[]>([]);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [error, setError] = useState('');
  const [relaxedResults, setRelaxedResults] = useState(false);
  const [showRefinement, setShowRefinement] = useState(false);
  const [refinementSuggestions, setRefinementSuggestions] = useState<string[]>([]);
  const [refining, setRefining] = useState(false);
  const cancelledRef = useRef(false);

  const genAI = () =>
    new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY! });

  const getRefinementSuggestions = async () => {
    setRefining(true);
    try {
      const response = await genAI().models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
          role: 'user',
          parts: [{
            text: `An entrepreneur described this business idea but we could not find strong market signals for it. Help them refine it to be more specific and searchable.

ORIGINAL IDEA: "${ideaText}"
KEYWORDS WE TRIED: ${keywords.join(', ')}
SIGNALS FOUND: ${signals.length}
MARKET: ${selectedMode}
${countryTag ? `COUNTRY: ${countryTag}` : ''}

Provide 3 refined versions of their idea that:
1. Are more specific about the problem solved
2. Use industry terminology that appears in news
3. Reference current market trends
4. Are grounded in the ${countryTag || selectedMode} market context

Return ONLY a valid JSON array of 3 strings. No markdown. No backticks. No explanation.
Example: ["refined idea 1", "refined idea 2", "refined idea 3"]`,
          }],
        }],
        config: { maxOutputTokens: 800 },
      });
      const raw = response.text ?? '';
      const arrayMatch = raw.match(/\[[\s\S]*?\]/);
      const suggestions: string[] = arrayMatch ? JSON.parse(arrayMatch[0]) : [];
      setRefinementSuggestions(suggestions);
      setShowRefinement(true);
    } catch (err) {
      console.error('Refinement failed:', err);
    } finally {
      setRefining(false);
    }
  };

  const handleFindSignals = async (ideaOverride?: string) => {
    setStep('extracting');
    setError('');
    setRelaxedResults(false);
    setShowRefinement(false);
    setRefinementSuggestions([]);
    if (ideaOverride) setIdeaText(ideaOverride);
    cancelledRef.current = false;

    try {
      // Step A: Extract keywords using Gemini
      // Ask for single-word or short (2-word max) terms so they match news headlines
      const kwResponse = await genAI().models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Extract 15 diverse search keywords and phrases from this business idea to find relevant news articles. Include:
- Core product/service terms
- Industry category terms
- Target market descriptors
- Geographic terms if mentioned
- Problem/pain point terms
- Broader related industry terms
- Trend terms related to this space
- Economic/market terms

IMPORTANT: Also include BROADER related terms. For example if the idea is about Caribbean food subscription boxes, also include terms like "food delivery", "specialty food", "ethnic food", "diaspora market", "direct to consumer", "food ecommerce", "meal kit".

Return ONLY a valid JSON array of strings. No markdown. No backticks. No explanation.
Example format: ["term1", "term2", "term3"]

Business idea: "${ideaOverride || ideaText}"`,
              },
            ],
          },
        ],
        config: { maxOutputTokens: 500 },
      });

      if (cancelledRef.current) return;

      const kwText = kwResponse.text ?? '';
      console.log('[VALIDATE] raw keyword response:', kwText);
      let extractedKeywords: string[] = [];
      try {
        // Robustly extract JSON array — find [...] regardless of surrounding markdown
        const arrayMatch = kwText.match(/\[[\s\S]*?\]/);
        const jsonToParse = arrayMatch ? arrayMatch[0] : kwText.replace(/```json|```/gi, '').trim();
        const parsed = JSON.parse(jsonToParse);
        extractedKeywords = (Array.isArray(parsed) ? parsed.flat() : [])
          .map((k: unknown) => String(k).replace(/`/g, '').trim())
          .filter((k: string) => k.length > 2 && !k.startsWith('`'));
      } catch {
        // Fallback: split on common delimiters, strip markdown artifacts
        extractedKeywords = kwText
          .replace(/```json|```/gi, '')
          .split(/[,\n"[\]]+/)
          .map(k => k.replace(/`/g, '').trim())
          .filter(k => k.length > 3 && k.length < 40 && !k.startsWith('{'));
      }
      // Final safety — strip any remaining backtick artifacts
      extractedKeywords = extractedKeywords.map(k => k.replace(/`/g, '').trim()).filter(k => k.length > 2);
      // Ensure we always have at least a few keywords derived from the idea itself
      if (extractedKeywords.length < 3) {
        const fallback = (ideaOverride || ideaText).toLowerCase()
          .replace(/[^a-z\s]/g, ' ')
          .split(/\s+/)
          .filter(w => w.length > 4)
          .slice(0, 8);
        extractedKeywords = [...new Set([...extractedKeywords, ...fallback])];
      }
      setKeywords(extractedKeywords);
      console.log('[VALIDATE] clean keywords:', extractedKeywords);

      // Step B: Fetch via dedicated validate-feed endpoint (all markets, keyword-scored server-side)
      const params = new URLSearchParams({
        keywords: extractedKeywords.join(','),
        region: selectedMode,
        countryTag: countryTag || '',
      });

      const feedRes = await fetch(`/api/validate-feed?${params.toString()}`);
      if (cancelledRef.current) return;

      const feedData = await feedRes.json();
      const scored: ScoredSignal[] = feedData.items || [];
      if (feedData.relaxed) setRelaxedResults(true);

      console.log('[VALIDATE] scored articles:', scored.length);
      console.log('[VALIDATE] relevance scores:', scored.slice(0, 5).map((a: ScoredSignal) => ({
        title: a.title.substring(0, 50),
        score: a.relevanceScore,
        hits: a.matchedKeywords,
      })));

      if (cancelledRef.current) return;

      setSignals(scored);
      setSelectedSignals(scored.slice(0, 3).map(s => s.url));
      setStep('signals');
    } catch (err) {
      if (cancelledRef.current) return;
      console.error('Signal search failed:', err);
      setError('Failed to find signals. Please try again.');
      setStep('input');
    }
  };

  const handleValidate = async () => {
    setStep('analyzing');
    cancelledRef.current = false;

    const selectedArticles = signals.filter(s => selectedSignals.includes(s.url));
    const countryBlock = buildCountryBlock(countryTag);

    try {
      const validationResponse = await genAI().models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `You are a startup market validator for underserved entrepreneurs. Analyze whether market evidence supports or challenges this business idea.

ENTREPRENEUR'S IDEA:
"${ideaText}"

MARKET CONTEXT: ${selectedMode}
${countryTag ? `TARGET COUNTRY/REGION: ${countryTag}` : ''}
${countryBlock}

MARKET SIGNALS FOUND (${selectedArticles.length}):
${selectedArticles.map((a, i) => `${i + 1}. [${a.signalType}] ${a.title}: ${a.snippet}`).join('\n')}

Return ONLY a JSON object. No markdown. No other text:
{
  "validation_score": number 0-100,
  "verdict": "Strong Signal" | "Moderate Signal" | "Weak Signal" | "Counter Signal",
  "verdict_reason": "2-3 sentence explanation",
  "supporting_evidence": ["string", "string", "string"],
  "risk_factors": ["string", "string"],
  "market_timing": "Perfect timing" | "Good timing" | "Early" | "Late to market",
  "timing_reason": "1-2 sentence explanation",
  "recommended_pivot": "string or null",
  "ideal_customer": "specific customer description",
  "competitive_gap": "what gap exists to fill",
  "first_move": ["action 1", "action 2", "action 3"],
  "signal_sources": ["article title 1", "article title 2"]
}`,
              },
            ],
          },
        ],
        config: { maxOutputTokens: 1500 },
      });

      if (cancelledRef.current) return;

      const raw = validationResponse.text ?? '';
      const parsed: ValidationResult = JSON.parse(raw.replace(/```json|```/g, '').trim());

      if (cancelledRef.current) return;

      setResult(parsed);
      setStep('results');

      // Save to Firestore silently
      if (auth.currentUser) {
        addDoc(collection(db, 'idea_validations'), {
          userId: auth.currentUser.uid,
          idea: ideaText,
          keywords,
          marketMode: selectedMode,
          countryTag: countryTag || null,
          validationScore: parsed.validation_score,
          verdict: parsed.verdict,
          result: parsed,
          signalCount: selectedSignals.length,
          createdAt: new Date().toISOString(),
        }).catch(err => console.warn('Validation save failed:', err));
      }
    } catch (err) {
      if (cancelledRef.current) return;
      console.error('Validation failed:', err);
      setError('Validation failed. Please try again.');
      setStep('signals');
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
            selectedMode={selectedMode}
            countryTag={countryTag}
            onSubmit={handleFindSignals}
          />
        )}
        {step === 'extracting' && <ExtractingScreen />}
        {step === 'signals' && (
          <SignalsScreen
            signals={signals}
            keywords={keywords}
            selectedSignals={selectedSignals}
            setSelectedSignals={setSelectedSignals}
            onValidate={handleValidate}
            onBack={() => setStep('input')}
            relaxedResults={relaxedResults}
            showRefinement={showRefinement}
            refinementSuggestions={refinementSuggestions}
            refining={refining}
            onGetRefinements={getRefinementSuggestions}
            onApplyRefinement={(idea) => handleFindSignals(idea)}
          />
        )}
        {step === 'analyzing' && <AnalyzingScreen />}
        {step === 'results' && result && (
          <ValidationResults
            result={result}
            ideaText={ideaText}
            selectedMode={selectedMode}
            countryTag={countryTag}
            signals={signals.filter(s => selectedSignals.includes(s.url))}
            onRefine={() => setStep('input')}
            onReset={() => {
              setStep('input');
              setIdeaText('');
              setKeywords([]);
              setSignals([]);
              setSelectedSignals([]);
              setResult(null);
              setError('');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
