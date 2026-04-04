import React from 'react';
import { motion } from 'motion/react';
import { ExternalLink, CheckCircle2, Lightbulb } from 'lucide-react';
import { DeepDiveResult, GrantItem, MarketMode } from './types';
import { marketModeConfigs } from './MarketModeSelector';

interface GrantFinderProps {
  deepDiveResult: DeepDiveResult;
  selectedMode: MarketMode;
}

export const GrantFinder: React.FC<GrantFinderProps> = ({ deepDiveResult, selectedMode }) => {
  const modeConfig = marketModeConfigs[selectedMode];
  const hasModeSpecificGrants = selectedMode !== 'global' && modeConfig.grantSources.length > 0;

  // Handle both legacy string[] and new GrantItem[] formats
  const grants = deepDiveResult.grants as (GrantItem | string)[];
  const isRichGrants = grants.length > 0 && typeof grants[0] === 'object';

  return (
    <motion.div
      key="grants"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <p className="text-xs text-gray-400 font-mono">
        Funding sources specific to this business type and location
      </p>

      {/* Region-specific grant sources banner */}
      {hasModeSpecificGrants && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">{modeConfig.flag}</span>
            <p className="text-xs font-mono uppercase font-bold tracking-widest text-amber-800">
              Key funding bodies for {modeConfig.label}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {modeConfig.grantSources.map((grant, i) => (
              <span
                key={i}
                className="px-3 py-1.5 bg-white border border-amber-200 rounded-lg text-xs font-mono font-bold text-amber-800"
              >
                {grant}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Grant cards */}
      {isRichGrants ? (
        <div className="space-y-4">
          {(grants as GrantItem[]).map((grant, i) => {
            const hasLink = grant.how_to_apply && (
              grant.how_to_apply.startsWith('http') ||
              grant.how_to_apply.startsWith('www')
            );
            const applyUrl = hasLink
              ? (grant.how_to_apply.startsWith('http') ? grant.how_to_apply : `https://${grant.how_to_apply}`)
              : null;

            return (
              <div
                key={i}
                className="bg-white border border-gray-200 rounded-xl p-5 space-y-3 hover:border-amber-300 hover:shadow-sm transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[9px] font-mono font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded uppercase">
                        Option {i + 1}
                      </span>
                      <span className="text-xs font-mono text-gray-400">{grant.organization}</span>
                    </div>
                    <h4 className="font-semibold text-sm text-gray-900">{grant.name}</h4>
                  </div>
                  <div className="flex-shrink-0 bg-green-50 border border-green-200 rounded-lg px-2.5 py-1.5 text-center">
                    <p className="text-[9px] font-mono text-green-600 uppercase">Amount</p>
                    <p className="text-xs font-bold text-green-800 whitespace-nowrap">{grant.amount}</p>
                  </div>
                </div>

                {/* Eligibility */}
                <div className="space-y-1.5">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-600 leading-relaxed">
                      <span className="font-semibold text-gray-700">Why you qualify: </span>
                      {grant.why_this_qualifies}
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] font-mono text-gray-400 mt-0.5 flex-shrink-0">WHO</span>
                    <p className="text-xs text-gray-500 leading-relaxed">{grant.who_qualifies}</p>
                  </div>
                </div>

                {/* Apply button */}
                <div className="pt-1">
                  {applyUrl ? (
                    <a
                      href={applyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-black text-white rounded-lg text-xs font-mono font-bold hover:bg-gray-800 transition-colors"
                    >
                      Apply / Learn more <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <p className="text-xs text-gray-500 italic">{grant.how_to_apply}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Legacy string[] fallback
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(grants as string[]).map((grant, i) => (
            <div
              key={i}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:border-amber-300 transition-colors"
            >
              <span className="text-[9px] font-mono font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded uppercase mb-2 inline-block">
                Option {i + 1}
              </span>
              <h4 className="font-semibold text-sm text-gray-900">{grant}</h4>
            </div>
          ))}
        </div>
      )}

      <div className="bg-gray-50 p-5 border border-dashed border-gray-300 rounded-xl flex gap-3">
        <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-gray-600 italic leading-relaxed">
          Check your local Small Business Development Center (SBDC) for regional variations.
          Many municipalities offer micro-grants for early-stage businesses that are not widely advertised.
        </p>
      </div>
    </motion.div>
  );
};
