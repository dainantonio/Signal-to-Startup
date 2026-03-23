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
        
        <div className="grid grid-cols-3 gap-y-3 gap-x-2 pt-2">
          <div className="text-center">
            <p className="text-[8px] uppercase opacity-50 font-mono mb-1">Speed</p>
            <div className="flex justify-center gap-0.5">
              {[...Array(10)].map((_, j) => (
                <div key={j} className={`w-1 h-2 ${j < opp.speed_to_launch ? 'bg-[#141414]' : 'bg-gray-200'}`} />
              ))}
            </div>
          </div>
          <div className="text-center">
            <p className="text-[8px] uppercase opacity-50 font-mono mb-1">ROI</p>
            <div className="flex justify-center gap-0.5">
              {[...Array(10)].map((_, j) => (
                <div key={j} className={`w-1 h-2 ${j < opp.roi_potential ? 'bg-[#141414]' : 'bg-gray-200'}`} />
              ))}
            </div>
          </div>
          <div className="text-center">
            <p className="text-[8px] uppercase opacity-50 font-mono mb-1">Urgency</p>
            <div className="flex justify-center gap-0.5">
              {[...Array(10)].map((_, j) => (
                <div key={j} className={`w-1 h-2 ${j < opp.urgency ? 'bg-[#141414]' : 'bg-gray-200'}`} />
              ))}
            </div>
          </div>
          <div className="text-center">
            <p className="text-[8px] uppercase opacity-50 font-mono mb-1">Local Fit</p>
            <div className="flex justify-center gap-0.5">
              {[...Array(10)].map((_, j) => (
                <div key={j} className={`w-1 h-2 ${j < opp.local_fit ? 'bg-[#141414]' : 'bg-gray-200'}`} />
              ))}
            </div>
          </div>
          <div className="text-center">
            <p className="text-[8px] uppercase opacity-50 font-mono mb-1">Gap</p>
            <div className="flex justify-center gap-0.5">
              {[...Array(10)].map((_, j) => (
                <div key={j} className={`w-1 h-2 ${j < opp.competition_gap ? 'bg-[#141414]' : 'bg-gray-200'}`} />
              ))}
            </div>
          </div>
          <div className="text-center">
            <p className="text-[8px] uppercase opacity-50 font-mono mb-1">Ease</p>
            <div className="flex justify-center gap-0.5">
              {[...Array(10)].map((_, j) => (
                <div key={j} className={`w-1 h-2 ${j < (10 - opp.difficulty) ? 'bg-[#141414]' : 'bg-gray-200'}`} />
              ))}
            </div>
          </div>
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
