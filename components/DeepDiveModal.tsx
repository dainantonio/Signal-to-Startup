import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  RefreshCcw, 
  X, 
  Loader2, 
  FileText, 
  Calculator, 
  Coins, 
  CheckSquare, 
  Users, 
  Check, 
  Copy 
} from 'lucide-react';
import Markdown from 'react-markdown';
import { Opportunity, DeepDiveResult } from './types';
import { CostEstimator } from './CostEstimator';
import { GrantFinder } from './GrantFinder';
import { InvestorMatch } from './InvestorMatch';
import { Checklist } from './Checklist';

interface DeepDiveModalProps {
  selectedOpportunity: Opportunity | null;
  setSelectedOpportunity: (opp: Opportunity | null) => void;
  deepDiveLoading: boolean;
  deepDiveResult: DeepDiveResult | null;
  activeDeepDiveTab: 'plan' | 'costs' | 'grants' | 'checklist' | 'investors';
  setActiveDeepDiveTab: (tab: 'plan' | 'costs' | 'grants' | 'checklist' | 'investors') => void;
  generateDeepDive: (opp: Opportunity) => void;
  copyToClipboard: (text: string, id: string) => void;
  copied: string | null;
}

export const DeepDiveModal: React.FC<DeepDiveModalProps> = ({
  selectedOpportunity,
  setSelectedOpportunity,
  deepDiveLoading,
  deepDiveResult,
  activeDeepDiveTab,
  setActiveDeepDiveTab,
  generateDeepDive,
  copyToClipboard,
  copied
}) => {
  if (!selectedOpportunity) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[#141414]/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-8"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-[#E4E3E0] w-full max-w-5xl max-h-[90vh] overflow-hidden border border-[#141414] flex flex-col"
      >
        {/* Modal Header */}
        <div className="border-b-2 border-[#141414] p-6 flex items-center justify-between bg-white">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSelectedOpportunity(null)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Back to list"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-2xl font-serif italic uppercase tracking-tighter">{selectedOpportunity.name}</h2>
              <p className="text-[10px] font-mono uppercase opacity-50">Execution Suite & Strategy</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => generateDeepDive(selectedOpportunity)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-[#141414]"
              title="Regenerate"
            >
              <RefreshCcw className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setSelectedOpportunity(null)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-grow overflow-y-auto p-6 md:p-10 bg-[#F5F5F0]">
          {deepDiveLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-6">
              <div className="relative">
                <Loader2 className="w-16 h-16 animate-spin text-[#141414] opacity-20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2 h-2 bg-[#141414] rounded-full animate-ping" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <p className="font-mono text-xs uppercase tracking-[0.3em] animate-pulse">Consulting AI Advisor...</p>
                <p className="text-[10px] font-mono opacity-40 uppercase">Mapping market gaps and cost structures</p>
              </div>
            </div>
          ) : deepDiveResult ? (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
              {/* Sidebar Tabs */}
              <div className="lg:col-span-1 space-y-3">
                <div className="bg-white border-2 border-[#141414] p-4 mb-4 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
                  <div className="text-[10px] font-mono uppercase opacity-50 mb-2">Opportunity Score</div>
                  <div className="text-3xl font-bold font-serif italic">{Math.round(selectedOpportunity.money_score)}/100</div>
                </div>
                
                <button 
                  onClick={() => setActiveDeepDiveTab('plan')}
                  className={`w-full flex items-center gap-3 px-4 py-4 text-xs font-mono uppercase tracking-widest border-2 border-[#141414] transition-all shadow-[4px_4px_0px_0px_rgba(20,20,20,0.1)] active:shadow-none active:translate-x-1 active:translate-y-1 ${activeDeepDiveTab === 'plan' ? 'bg-[#141414] text-[#E4E3E0] shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]' : 'bg-white hover:bg-gray-50'}`}
                >
                  <FileText className="w-4 h-4" />
                  Business Plan
                </button>
                <button 
                  onClick={() => setActiveDeepDiveTab('costs')}
                  className={`w-full flex items-center gap-3 px-4 py-4 text-xs font-mono uppercase tracking-widest border-2 border-[#141414] transition-all shadow-[4px_4px_0px_0px_rgba(20,20,20,0.1)] active:shadow-none active:translate-x-1 active:translate-y-1 ${activeDeepDiveTab === 'costs' ? 'bg-[#141414] text-[#E4E3E0] shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]' : 'bg-white hover:bg-gray-50'}`}
                >
                  <Calculator className="w-4 h-4" />
                  Cost Estimator
                </button>
                <button 
                  onClick={() => setActiveDeepDiveTab('grants')}
                  className={`w-full flex items-center gap-3 px-4 py-4 text-xs font-mono uppercase tracking-widest border-2 border-[#141414] transition-all shadow-[4px_4px_0px_0px_rgba(20,20,20,0.1)] active:shadow-none active:translate-x-1 active:translate-y-1 ${activeDeepDiveTab === 'grants' ? 'bg-[#141414] text-[#E4E3E0] shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]' : 'bg-white hover:bg-gray-50'}`}
                >
                  <Coins className="w-4 h-4" />
                  Grant Finder
                </button>
                <button 
                  onClick={() => setActiveDeepDiveTab('checklist')}
                  className={`w-full flex items-center gap-3 px-4 py-4 text-xs font-mono uppercase tracking-widest border-2 border-[#141414] transition-all shadow-[4px_4px_0px_0px_rgba(20,20,20,0.1)] active:shadow-none active:translate-x-1 active:translate-y-1 ${activeDeepDiveTab === 'checklist' ? 'bg-[#141414] text-[#E4E3E0] shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]' : 'bg-white hover:bg-gray-50'}`}
                >
                  <CheckSquare className="w-4 h-4" />
                  Checklist
                </button>
                <button 
                  onClick={() => setActiveDeepDiveTab('investors')}
                  className={`w-full flex items-center gap-3 px-4 py-4 text-xs font-mono uppercase tracking-widest border-2 border-[#141414] transition-all shadow-[4px_4px_0px_0px_rgba(20,20,20,0.1)] active:shadow-none active:translate-x-1 active:translate-y-1 ${activeDeepDiveTab === 'investors' ? 'bg-[#141414] text-[#E4E3E0] shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]' : 'bg-white hover:bg-gray-50'}`}
                >
                  <Users className="w-4 h-4" />
                  Investor Match
                </button>
              </div>

              {/* Main Content Area */}
              <div className="lg:col-span-3 bg-white border-2 border-[#141414] p-8 md:p-12 min-h-[500px] shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] relative">
                <div className="absolute top-4 right-4">
                  <button
                    onClick={() => {
                      let text = "";
                      if (activeDeepDiveTab === 'plan') text = deepDiveResult.business_plan;
                      if (activeDeepDiveTab === 'costs') text = deepDiveResult.cost_breakdown.map(c => `${c.item}: $${c.cost}`).join('\n');
                      if (activeDeepDiveTab === 'grants') text = deepDiveResult.grants.join('\n');
                      if (activeDeepDiveTab === 'checklist') text = deepDiveResult.checklist.join('\n');
                      if (activeDeepDiveTab === 'investors') text = deepDiveResult.investors.map(inv => `${inv.name} (${inv.stage}): ${inv.focus}`).join('\n');
                      copyToClipboard(text, activeDeepDiveTab);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-[#141414] text-[10px] font-mono uppercase hover:bg-[#141414] hover:text-[#E4E3E0] transition-all"
                  >
                    {copied === activeDeepDiveTab ? (
                      <><Check className="w-3 h-3" /> Copied</>
                    ) : (
                      <><Copy className="w-3 h-3" /> Copy Text</>
                    )}
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {activeDeepDiveTab === 'plan' && (
                    <motion.div
                      key="plan"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-8"
                    >
                      <div className="bg-[#141414] text-[#E4E3E0] p-6 border-l-8 border-emerald-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
                        <h3 className="text-xs font-mono uppercase tracking-[0.3em] mb-2 opacity-60 text-emerald-400">Executive Summary</h3>
                        <p className="font-serif italic text-lg leading-relaxed">
                          {selectedOpportunity.description}
                        </p>
                      </div>
                      
                      <div className="prose prose-sm max-w-none font-serif prose-headings:font-serif prose-headings:italic prose-headings:tracking-tight prose-p:leading-relaxed prose-headings:border-b prose-headings:border-gray-100 prose-headings:pb-2">
                        <Markdown>{deepDiveResult.business_plan}</Markdown>
                      </div>
                    </motion.div>
                  )}

                  {activeDeepDiveTab === 'costs' && (
                    <CostEstimator deepDiveResult={deepDiveResult} />
                  )}

                  {activeDeepDiveTab === 'grants' && (
                    <GrantFinder deepDiveResult={deepDiveResult} />
                  )}

                  {activeDeepDiveTab === 'checklist' && (
                    <Checklist deepDiveResult={deepDiveResult} />
                  )}

                  {activeDeepDiveTab === 'investors' && (
                    <InvestorMatch deepDiveResult={deepDiveResult} />
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : null}
        </div>
      </motion.div>
    </motion.div>
  );
};
