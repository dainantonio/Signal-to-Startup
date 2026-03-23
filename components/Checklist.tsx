import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';
import { DeepDiveResult } from './types';

interface ChecklistProps {
  deepDiveResult: DeepDiveResult;
}

export const Checklist: React.FC<ChecklistProps> = ({ deepDiveResult }) => {
  return (
    <motion.div
      key="checklist"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="border-b-2 border-[#141414] pb-4">
        <h3 className="text-2xl font-serif italic tracking-tight">30-Day Launch Sequence</h3>
        <p className="text-[10px] font-mono uppercase opacity-50 mt-1">From Signal to First Dollar</p>
      </div>

      <div className="relative space-y-12 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
        {deepDiveResult.checklist.map((step, i) => (
          <div key={i} className="relative flex gap-8 group">
            <div className="relative z-10 flex-shrink-0 w-10 h-10 rounded-full bg-white border-2 border-[#141414] flex items-center justify-center font-bold font-serif italic text-lg group-hover:bg-[#141414] group-hover:text-[#E4E3E0] transition-all">
              {i + 1}
            </div>
            <div className="flex-grow pt-1.5">
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm font-medium leading-relaxed pr-8">{step}</p>
                <div className="flex-shrink-0 p-1.5 bg-gray-50 border border-gray-200 rounded-lg opacity-20 group-hover:opacity-100 transition-opacity">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
              </div>
              <div className="mt-4 h-px bg-gray-100 w-full" />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#141414] text-[#E4E3E0] p-8 text-center relative overflow-hidden">
        <div className="relative z-10">
          <h4 className="text-xl font-serif italic mb-2 tracking-tight">Ready to execute?</h4>
          <p className="text-xs font-mono uppercase tracking-[0.2em] opacity-60 mb-6">Day 31 starts with your first customer.</p>
          <button className="bg-[#E4E3E0] text-[#141414] px-8 py-3 text-[10px] font-mono uppercase tracking-widest font-bold hover:bg-white transition-all">
            Download PDF Checklist
          </button>
        </div>
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_#fff_1px,_transparent_1px)] bg-[length:20px_20px]" />
        </div>
      </div>
    </motion.div>
  );
};
