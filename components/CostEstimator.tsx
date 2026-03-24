import React from 'react';
import { motion } from 'motion/react';
import { Zap } from 'lucide-react';
import { DeepDiveResult } from './types';

interface CostEstimatorProps {
  deepDiveResult: DeepDiveResult;
}

export const CostEstimator: React.FC<CostEstimatorProps> = ({ deepDiveResult }) => {
  return (
    <motion.div
      key="costs"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      {(() => {
        const totalCost = deepDiveResult.cost_breakdown.reduce((acc, curr) => acc + curr.cost, 0);
        return (
          <>
            <div className="flex items-end justify-between border-b-2 border-[#141414] pb-4">
              <h3 className="text-2xl font-serif italic tracking-tight">Startup Cost Estimator</h3>
              <div className="text-right">
                <div className="text-[10px] font-mono uppercase opacity-50">Total Capital Required</div>
                <div className="text-3xl font-bold font-mono">${totalCost.toLocaleString()}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-1">
              <div className="grid grid-cols-4 px-4 py-2 bg-gray-100 font-mono text-[10px] uppercase tracking-widest opacity-50">
                <div className="col-span-2">Expense Item</div>
                <div className="text-right">Amount</div>
                <div className="text-right">Intensity</div>
              </div>
              {deepDiveResult.cost_breakdown.map((item, i) => {
                const percentage = (item.cost / totalCost) * 100;
                return (
                  <div key={i} className="grid grid-cols-4 px-4 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors items-center">
                    <div className="col-span-2 font-medium text-sm">{item.item}</div>
                    <div className="text-right font-mono font-bold">${item.cost.toLocaleString()}</div>
                    <div className="flex flex-col items-end gap-1 pl-4">
                      <div className="text-[10px] font-mono font-bold">{Math.round(percentage)}%</div>
                      <div className="w-full max-w-[80px] h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-foreground"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        );
      })()}

      <div className="bg-emerald-50 border border-emerald-200 p-4 flex gap-4 items-start">
        <div className="p-2 bg-emerald-500 text-white rounded-lg">
          <Zap className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs font-mono uppercase font-bold text-emerald-900">Lean Strategy</h4>
          <p className="text-xs text-emerald-800 mt-1">This budget is optimized for a 7-day MVP launch. Avoid scaling until first revenue is captured.</p>
        </div>
      </div>
    </motion.div>
  );
};
