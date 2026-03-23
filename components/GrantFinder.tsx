import React from 'react';
import { motion } from 'motion/react';
import { Coins, Check, Lightbulb } from 'lucide-react';
import { DeepDiveResult } from './types';

interface GrantFinderProps {
  deepDiveResult: DeepDiveResult;
}

export const GrantFinder: React.FC<GrantFinderProps> = ({ deepDiveResult }) => {
  return (
    <motion.div
      key="grants"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="flex items-center gap-4 border-b-2 border-[#141414] pb-4">
        <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
          <Coins className="w-6 h-6" />
        </div>
        <h3 className="text-2xl font-serif italic tracking-tight">Non-Dilutive Funding</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {deepDiveResult.grants.map((grant, i) => (
          <div key={i} className="group relative bg-white border-2 border-[#141414] p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] transition-all">
            <div className="absolute -top-3 -right-3 bg-[#141414] text-[#E4E3E0] text-[10px] font-mono px-2 py-1 uppercase">
              Option {i + 1}
            </div>
            <h4 className="font-bold text-sm uppercase tracking-tight mb-3 pr-4">{grant}</h4>
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase text-emerald-600 font-bold">
              <Check className="w-3 h-3" />
              High Eligibility
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gray-50 p-6 border-2 border-dashed border-[#141414] relative overflow-hidden">
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
