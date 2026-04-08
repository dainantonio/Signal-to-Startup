'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { ExternalLink, Zap } from 'lucide-react';
import { DeepDiveResult } from './types';

interface CostEstimatorProps {
  deepDiveResult: DeepDiveResult;
  marketMode?: string;
}

const LOCATION_MULTIPLIERS: Record<string, {
  label: string;
  multiplier: number;
  currency: string;
  symbol: string;
}> = {
  us:        { label: 'United States', multiplier: 1.0,  currency: 'USD', symbol: '$'  },
  uk:        { label: 'UK / Europe',   multiplier: 0.9,  currency: 'GBP', symbol: '£'  },
  caribbean: { label: 'Caribbean',     multiplier: 0.55, currency: 'JMD', symbol: 'J$' },
  africa:    { label: 'Africa',        multiplier: 0.35, currency: 'NGN', symbol: '₦'  },
  latam:     { label: 'Latin America', multiplier: 0.45, currency: 'USD', symbol: '$'  },
};

const LOCAL_RATES: Record<string, number> = {
  JMD: 157,
  NGN: 1580,
  GBP: 0.79,
  USD: 1,
};

const TEAM_MULTIPLIERS = {
  solo:  { label: 'Solo founder', multiplier: 1.0 },
  small: { label: '2–3 people',   multiplier: 1.6 },
  team:  { label: 'Team of 5+',   multiplier: 2.8 },
};

const TIMELINE_MULTIPLIERS = {
  lean:     { label: 'Lean (30 days)',      multiplier: 0.7 },
  standard: { label: 'Standard (90 days)',  multiplier: 1.0 },
  full:     { label: 'Full build (6 mo)',   multiplier: 1.8 },
};

const BUSINESS_MULTIPLIERS = {
  service: { label: 'Service business', multiplier: 0.7 },
  digital: { label: 'Digital / app',    multiplier: 1.2 },
  product: { label: 'Physical product', multiplier: 1.5 },
};

type TeamKey     = keyof typeof TEAM_MULTIPLIERS;
type TimelineKey = keyof typeof TIMELINE_MULTIPLIERS;
type BizKey      = keyof typeof BUSINESS_MULTIPLIERS;

export const CostEstimator: React.FC<CostEstimatorProps> = ({ deepDiveResult }) => {
  const items = deepDiveResult.cost_breakdown || [];

  const [location,     setLocation]     = useState('us');
  const [teamSize,     setTeamSize]     = useState<TeamKey>('solo');
  const [timeline,     setTimeline]     = useState<TimelineKey>('standard');
  const [businessType, setBusinessType] = useState<BizKey>('service');
  const [showBreakdown, setShowBreakdown] = useState(true);

  const locationConfig = LOCATION_MULTIPLIERS[location];
  const teamConfig     = TEAM_MULTIPLIERS[teamSize];
  const timelineConfig = TIMELINE_MULTIPLIERS[timeline];
  const businessConfig = BUSINESS_MULTIPLIERS[businessType];

  const combinedMultiplier = useMemo(
    () =>
      locationConfig.multiplier *
      teamConfig.multiplier *
      timelineConfig.multiplier *
      businessConfig.multiplier,
    [locationConfig, teamConfig, timelineConfig, businessConfig]
  );

  const adjustedItems = useMemo(() => {
    const localRate = LOCAL_RATES[locationConfig.currency] || 1;
    return items.map(item => {
      const baseCost   = (item as { cost?: number }).cost || 0;
      const adjusted   = Math.round(baseCost * combinedMultiplier);
      const localAmount =
        locationConfig.currency !== 'USD'
          ? Math.round(adjusted * localRate)
          : null;
      return { ...item, originalCost: baseCost, adjustedCost: adjusted, localAmount };
    });
  }, [items, combinedMultiplier, locationConfig]);

  const totalUSD = useMemo(
    () => adjustedItems.reduce((sum, i) => sum + i.adjustedCost, 0),
    [adjustedItems]
  );

  const originalTotal = useMemo(
    () => items.reduce((sum, i) => sum + ((i as { cost?: number }).cost || 0), 0),
    [items]
  );

  const localTotal =
    adjustedItems[0]?.localAmount !== null
      ? adjustedItems.reduce((sum, i) => sum + (i.localAmount || 0), 0)
      : null;

  const confidence = useMemo(() => {
    const deviation = Math.abs(combinedMultiplier - 1.0);
    if (deviation < 0.2) return 'High';
    if (deviation < 0.5) return 'Medium';
    return 'Estimate';
  }, [combinedMultiplier]);

  const confidenceColor = {
    High:     'text-green-600 bg-green-50 border-green-200',
    Medium:   'text-amber-600 bg-amber-50 border-amber-200',
    Estimate: 'text-gray-500 bg-gray-50 border-gray-200',
  }[confidence];

  function ToggleGroup<T extends string>({
    label,
    value,
    options,
    onChange,
  }: {
    label: string;
    value: T;
    options: Record<T, { label: string }>;
    onChange: (k: T) => void;
  }) {
    return (
      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-600">{label}</p>
        <div className="flex flex-wrap gap-2">
          {(Object.entries(options) as [T, { label: string }][]).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => onChange(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                value === key
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cfg.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Disclaimer */}
      <div className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
        <span className="text-gray-400 flex-shrink-0 mt-0.5">ℹ</span>
        <p className="text-xs text-gray-500 leading-relaxed">
          AI-estimated costs. Adjust the assumptions below to match your situation. Actual costs vary.
        </p>
      </div>

      {/* Assumption Controls */}
      <div className="space-y-4 p-4 bg-white border border-gray-200 rounded-xl">
        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
          Adjust your assumptions
        </p>

        {/* Location */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-600">📍 Your location</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(LOCATION_MULTIPLIERS).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setLocation(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  location === key
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cfg.label}
              </button>
            ))}
          </div>
        </div>

        <ToggleGroup
          label="👥 Team size"
          value={teamSize}
          options={TEAM_MULTIPLIERS}
          onChange={setTeamSize}
        />
        <ToggleGroup
          label="📅 Launch timeline"
          value={timeline}
          options={TIMELINE_MULTIPLIERS}
          onChange={setTimeline}
        />
        <ToggleGroup
          label="🏢 Business type"
          value={businessType}
          options={BUSINESS_MULTIPLIERS}
          onChange={setBusinessType}
        />
      </div>

      {/* Animated Total */}
      <motion.div
        key={totalUSD}
        initial={{ scale: 0.98, opacity: 0.8 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="p-5 bg-gray-900 text-white rounded-xl space-y-2"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">
              Estimated total
            </p>
            <p className="text-3xl font-bold font-mono mt-1">
              ${totalUSD.toLocaleString()}
            </p>
            {localTotal !== null && (
              <p className="text-sm text-gray-400 mt-0.5">
                ≈ {locationConfig.symbol}{localTotal.toLocaleString()} {locationConfig.currency}
              </p>
            )}
          </div>
          <div className="text-right space-y-1">
            <span className={`text-xs px-2 py-1 rounded-full border font-medium ${confidenceColor}`}>
              {confidence} confidence
            </span>
            {combinedMultiplier !== 1.0 && (
              <p className="text-xs text-gray-500 block mt-1">
                {combinedMultiplier < 1
                  ? `↓ ${Math.round((1 - combinedMultiplier) * 100)}% vs US baseline`
                  : `↑ ${Math.round((combinedMultiplier - 1) * 100)}% vs US baseline`}
              </p>
            )}
          </div>
        </div>
        {originalTotal !== totalUSD && (
          <p className="text-xs text-gray-500 border-t border-gray-700 pt-2 mt-2">
            Original AI estimate: ${originalTotal.toLocaleString()} · Adjusted for your assumptions
          </p>
        )}
      </motion.div>

      {/* Breakdown toggle */}
      <button
        onClick={() => setShowBreakdown(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
      >
        <span>{showBreakdown ? 'Hide' : 'Show'} cost breakdown</span>
        <span className="text-gray-400">{showBreakdown ? '↑' : '↓'}</span>
      </button>

      {/* Breakdown items */}
      {showBreakdown && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          {adjustedItems.map((item, i) => {
            const itemType  = (item as { type?: string }).type || 'one-time';
            const notes     = (item as { notes?: string }).notes;
            const sourceUrl = (item as { source_url?: string }).source_url;
            const pct = totalUSD > 0 ? Math.round((item.adjustedCost / totalUSD) * 100) : 0;

            return (
              <div
                key={i}
                className="flex items-start justify-between p-3 bg-white border border-gray-100 rounded-xl gap-3 hover:border-gray-200 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-gray-900 leading-snug">
                      {(item as { item?: string }).item}
                    </p>
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase flex-shrink-0 ${
                      itemType === 'monthly'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {itemType === 'monthly' ? '/mo' : '1×'}
                    </span>
                  </div>
                  {notes && (
                    <p className="text-[11px] text-gray-400 mt-1 leading-snug">{notes}</p>
                  )}
                  {sourceUrl && (
                    <a
                      href={sourceUrl.startsWith('http') ? sourceUrl : `https://${sourceUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-1.5 text-[10px] uppercase font-mono font-bold text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      View Source Pricing <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {/* Mini bar */}
                  <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden w-full max-w-[160px]">
                    <div
                      className="h-1 bg-gray-900 rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-mono font-bold text-sm text-gray-900">
                    ${item.adjustedCost.toLocaleString()}
                  </p>
                  {item.localAmount !== null && item.localAmount !== undefined && (
                    <p className="text-[10px] text-gray-400 font-mono">
                      {locationConfig.symbol}{item.localAmount.toLocaleString()}
                    </p>
                  )}
                  <p className="text-[10px] text-gray-400 font-mono">{pct}%</p>
                </div>
              </div>
            );
          })}
        </motion.div>
      )}

      {/* Lean strategy tip */}
      <div className="bg-emerald-50 border border-emerald-200 p-4 flex gap-4 items-start rounded-xl">
        <div className="p-2 bg-emerald-500 text-white rounded-lg flex-shrink-0">
          <Zap className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs font-mono uppercase font-bold text-emerald-900">Lean Strategy</h4>
          <p className="text-xs text-emerald-800 mt-1">
            Start with one-time costs only. Delay monthly expenses until you have paying customers.
            Switch to &ldquo;Lean (30 days)&rdquo; + &ldquo;Solo founder&rdquo; above to see your minimum viable budget.
          </p>
        </div>
      </div>
    </div>
  );
};
