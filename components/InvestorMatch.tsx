import React from 'react';
import { motion } from 'motion/react';
import { Users, Target, ArrowUpRight } from 'lucide-react';
import { DeepDiveResult } from './types';
import { getInvestorUrl } from '@/lib/investor-directory';

interface InvestorMatchProps {
  deepDiveResult: DeepDiveResult;
}

export const InvestorMatch: React.FC<InvestorMatchProps> = ({ deepDiveResult }) => {
  return (
    <motion.div
      key="investors"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="flex items-center gap-4 border-b-2 border-foreground pb-4">
        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
          <Users className="w-6 h-6" />
        </div>
        <h3 className="text-2xl font-serif italic tracking-tight">Investor Matchmaking</h3>
      </div>

      <div className="space-y-4">
        {deepDiveResult.investors.map((investor, i) => (
          <div key={i} className="bg-white border-2 border-foreground p-6 hover:bg-gray-50 transition-all group">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-grow">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-bold text-lg uppercase tracking-tight">{investor.name}</h4>
                  <span className="text-[10px] font-mono bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded uppercase font-bold">
                    {investor.stage}
                  </span>
                </div>
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <Target className="w-4 h-4 mt-0.5 flex-shrink-0 opacity-40" />
                  <p>{investor.focus}</p>
                </div>
              </div>
              <a
                href={investor.website || getInvestorUrl(investor.name)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-2 text-[10px] font-mono uppercase font-bold border border-foreground px-4 py-2 hover:bg-foreground hover:text-background transition-all self-start md:self-center"
              >
                View Thesis
                <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-xl">
        <h4 className="text-xs font-mono uppercase font-bold text-indigo-900 mb-2">Pitching Strategy</h4>
        <p className="text-xs text-indigo-800 leading-relaxed">
          Focus your pitch on the specific signal that triggered this opportunity. Investors in this stage prioritize founders who have identified a clear, time-sensitive market gap created by policy or tech shifts.
        </p>
      </div>
    </motion.div>
  );
};
