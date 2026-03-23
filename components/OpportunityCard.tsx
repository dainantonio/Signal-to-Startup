import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import { Opportunity } from './types';

interface OpportunityCardProps {
  opp: Opportunity;
  index: number;
  isBestIdea: boolean;
  generateDeepDive: (opp: Opportunity) => void;
}

export const OpportunityCard: React.FC<OpportunityCardProps> = ({
  opp,
  index,
  isBestIdea,
  generateDeepDive
}) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -5 }}
      className={`bg-white border border-[#141414] p-6 flex flex-col h-full ${isBestIdea ? 'ring-2 ring-[#141414] ring-offset-4' : ''}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-col">
          <h4 className="font-bold text-xl uppercase tracking-tighter flex items-center gap-2">
            {opp.name}
            {isBestIdea && <span className="text-[10px] bg-[#141414] text-[#E4E3E0] px-1 py-0.5 rounded">← 👀 YOU</span>}
          </h4>
          <div className="flex gap-2 mt-1">
            <span className="text-[8px] font-mono bg-[#141414] text-[#E4E3E0] px-1.5 py-0.5 uppercase font-bold">
              {opp.status}
            </span>
            <span className={`text-[8px] font-mono px-1.5 py-0.5 uppercase font-bold border ${
              opp.priority === 'High' ? 'bg-red-100 text-red-800 border-red-200' :
              opp.priority === 'Medium' ? 'bg-amber-100 text-amber-800 border-amber-200' :
              'bg-slate-100 text-slate-800 border-slate-200'
            }`}>
              {opp.priority} Priority
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="bg-[#141414] text-[#E4E3E0] text-[10px] px-2 py-0.5 font-mono mb-1">
            OPP_{index + 1}
          </div>
          <div className="flex flex-col items-center bg-amber-50 border border-amber-200 px-2 py-1 rounded">
            <span className="text-[8px] font-mono uppercase text-amber-800 font-bold leading-none mb-0.5">Money Score</span>
            <span className="text-lg font-bold text-amber-900 leading-none">{Math.round(opp.money_score)}</span>
          </div>
        </div>
      </div>
      <p className="text-sm mb-6 flex-grow">{opp.description}</p>
      
      <div className="space-y-4 pt-4 border-t border-[#141414] border-dashed">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] uppercase opacity-50 font-mono mb-1">Target Customer</p>
            <p className="text-xs font-bold">{opp.target_customer}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase opacity-50 font-mono mb-1">Est. Startup Cost</p>
            <p className="text-xs font-bold text-emerald-600">${opp.startup_cost.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-y-4 gap-x-6 pt-4">
          {[
            { label: 'Speed', value: opp.speed_to_launch },
            { label: 'ROI', value: opp.roi_potential },
            { label: 'Urgency', value: opp.urgency },
            { label: 'Local Fit', value: opp.local_fit },
            { label: 'Gap', value: opp.competition_gap },
            { label: 'Ease', value: 10 - opp.difficulty },
          ].map((metric) => (
            <div key={metric.label} className="space-y-1.5">
              <div className="flex justify-between items-end">
                <p className="text-[10px] uppercase opacity-50 font-mono leading-none">{metric.label}</p>
                <p className="text-[10px] font-mono font-bold leading-none">{metric.value}/10</p>
              </div>
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${metric.value * 10}%` }}
                  transition={{ duration: 1, delay: 0.2 + index * 0.1 }}
                  className={`h-full ${
                    metric.value >= 8 ? 'bg-emerald-500' : 
                    metric.value >= 5 ? 'bg-[#141414]' : 
                    'bg-amber-500'
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <button 
        onClick={() => generateDeepDive(opp)}
        className="mt-6 w-full border border-[#141414] py-3 text-[10px] font-mono uppercase tracking-widest hover:bg-[#141414] hover:text-[#E4E3E0] transition-all flex items-center justify-center gap-2 group"
      >
        Generate Execution Suite
        <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
      </button>
    </motion.div>
  );
};
