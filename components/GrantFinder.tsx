import React from 'react';
import { motion } from 'motion/react';
import { Coins, Lightbulb } from 'lucide-react';
import { DeepDiveResult, MarketMode } from './types';
import { marketModeConfigs } from './MarketModeSelector';

interface GrantFinderProps {
  deepDiveResult: DeepDiveResult;
  selectedMode: MarketMode;
}

export const GrantFinder: React.FC<GrantFinderProps> = ({ deepDiveResult, selectedMode }) => {
  const modeConfig = marketModeConfigs[selectedMode];
  const hasModeSpecificGrants = selectedMode !== 'global' && modeConfig.grantSources.length > 0;

  return (
    <motion.div
      key="grants"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="flex items-center gap-4 border-b-2 border-foreground pb-4">
        <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
          <Coins className="w-6 h-6" />
        </div>
        <h3 className="text-2xl font-serif italic tracking-tight">Non-Dilutive Funding</h3>
      </div>

      {hasModeSpecificGrants && (
        <div className="bg-amber-50 border-2 border-foreground p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">{modeConfig.flag}</span>
            <h4 className="font-mono text-xs uppercase font-bold tracking-widest">
              Recommended for {modeConfig.label}:
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {modeConfig.grantSources.map((grant, i) => (
              <div key={`mode-${i}`} className="flex items-center gap-3 bg-white border border-foreground p-3 shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]">
                <div className="w-2 h-2 bg-amber-500 rounded-full" />
                <span className="text-[10px] font-mono uppercase font-bold">{grant}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {deepDiveResult.grants.map((grant, i) => (
          <div key={i} className="group relative bg-white border-2 border-foreground p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] transition-all">
            <div className="absolute -top-3 -right-3 bg-foreground text-background text-[10px] font-mono px-2 py-1 uppercase">
              Option {i + 1}
            </div>
            <h4 className="font-bold text-sm uppercase tracking-tight pr-4">{grant}</h4>
          </div>
        ))}
      </div>

      <div className="bg-gray-50 p-6 border-2 border-dashed border-foreground relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-[10px] font-mono uppercase font-bold mb-2 opacity-50">Expert Guidance</p>
          <p className="text-sm leading-relaxed italic font-serif">
            &quot;Check your local Small Business Development Center (SBDC) for specific regional variations of these grants. Many local municipalities offer &apos;micro-grants&apos; specifically for businesses with startup costs under $5,000.&quot;
          </p>
        </div>
        <Lightbulb className="absolute -bottom-4 -right-4 w-24 h-24 opacity-[0.03] rotate-12" />
      </div>
    </motion.div>
  );
};
