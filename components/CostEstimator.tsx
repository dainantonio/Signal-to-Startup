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
      className="space-y-8"
    >
      <div className="flex items-end justify-between border-b-2 border-foreground pb-4">
        <h3 className="text-2xl font-serif italic tracking-tight">Startup Cost Estimator</h3>
        <div className="text-right">
          <div className="text-[10px] font-mono uppercase opacity-50">Total Capital Required</div>
          <div className="text-3xl font-bold font-mono">${totalCost.toLocaleString()}</div>
        </div>
      </div>

      <div className="space-y-1">
        {/* Table header */}
        <div className="grid grid-cols-12 px-4 py-2 bg-gray-100 font-mono text-[10px] uppercase tracking-widest opacity-50">
          <div className="col-span-6">Expense Item</div>
          <div className="col-span-2 text-center">Type</div>
          <div className="col-span-2 text-right">Cost</div>
          <div className="col-span-2 text-right">%</div>
        </div>

        {items.map((item, i) => {
          const percentage = totalCost > 0 ? (item.cost / totalCost) * 100 : 0;
          // Handle legacy items without type field
          const itemType = (item as { type?: string }).type ?? 'one-time';
          const notes = (item as { notes?: string }).notes;
          return (
            <div
              key={i}
              className="grid grid-cols-12 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors items-start"
            >
              <div className="col-span-6 pr-2">
                <p className="font-medium text-sm">{item.item}</p>
                {notes && (
                  <p className="text-[10px] text-gray-400 mt-0.5 leading-snug">{notes}</p>
                )}
              </div>
              <div className="col-span-2 flex items-center justify-center">
                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                  itemType === 'monthly'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {itemType === 'monthly' ? '/mo' : '1×'}
                </span>
              </div>
              <div className="col-span-2 text-right font-mono font-bold text-sm">
                ${item.cost.toLocaleString()}
              </div>
              <div className="col-span-2 flex flex-col items-end gap-1 pl-2">
                <span className="text-[10px] font-mono font-bold">{Math.round(percentage)}%</span>
                <div className="w-full max-w-[60px] h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-foreground" style={{ width: `${percentage}%` }} />
                </div>
              </div>
            </div>
          );
        })}

        {/* Total row */}
        <div className="grid grid-cols-12 px-4 pt-4 pb-2 font-semibold">
          <div className="col-span-8 text-sm text-gray-500 uppercase tracking-wide font-mono text-[11px]">
            Total estimate
          </div>
          <div className="col-span-2 text-right font-mono font-bold text-green-700">
            ${totalCost.toLocaleString()}
          </div>
          <div className="col-span-2" />
        </div>
      </div>

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
