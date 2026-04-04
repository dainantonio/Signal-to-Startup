import React from 'react';
import { motion } from 'motion/react';
import { Zap } from 'lucide-react';
import { DeepDiveResult } from './types';

interface CostEstimatorProps {
  deepDiveResult: DeepDiveResult;
}

export const CostEstimator: React.FC<CostEstimatorProps> = ({ deepDiveResult }) => {
  const items = deepDiveResult.cost_breakdown;
  const totalCost = items.reduce((acc, curr) => acc + curr.cost, 0);

  return (
    <motion.div
      key="costs"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      {/* Total card */}
      <div className="bg-gray-900 text-white rounded-2xl px-6 py-5 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Total Capital Required</p>
          <p className="text-3xl font-bold font-mono mt-1">${totalCost.toLocaleString()}</p>
        </div>
        <div className="text-[10px] font-mono text-gray-400 text-right">
          <p>{items.filter(i => ((i as { type?: string }).type ?? 'one-time') === 'one-time').length} one-time</p>
          <p>{items.filter(i => ((i as { type?: string }).type ?? '') === 'monthly').length} monthly</p>
        </div>
      </div>

      {/* Item cards */}
      <div className="space-y-2">
        {items.map((item, i) => {
          const percentage = totalCost > 0 ? (item.cost / totalCost) * 100 : 0;
          const itemType = (item as { type?: string }).type ?? 'one-time';
          const notes = (item as { notes?: string }).notes;
          return (
            <div key={i} className="bg-gray-50 rounded-xl px-5 py-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-sm text-gray-900">{item.item}</p>
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
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-mono font-bold text-sm text-gray-900">${item.cost.toLocaleString()}</p>
                <p className="text-[10px] text-gray-400 font-mono">{Math.round(percentage)}%</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lean strategy box */}
      <div className="bg-emerald-50 border border-emerald-200 p-4 flex gap-4 items-start rounded-xl">
        <div className="p-2 bg-emerald-500 text-white rounded-lg flex-shrink-0">
          <Zap className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs font-mono uppercase font-bold text-emerald-900">Lean Strategy</h4>
          <p className="text-xs text-emerald-800 mt-1">
            Start with one-time costs only. Delay monthly expenses until you have paying customers.
            Many items can be free or reduced in the first 30 days.
          </p>
        </div>
      </div>
    </motion.div>
  );
};
