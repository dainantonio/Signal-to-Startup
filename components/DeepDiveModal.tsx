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
  Copy,
  Share2,
  Download,
  Bookmark,
  BookmarkCheck,
  ExternalLink
} from 'lucide-react';
import Markdown from 'react-markdown';
import { Opportunity, DeepDiveResult } from './types';
import { CostEstimator } from './CostEstimator';
import { GrantFinder } from './GrantFinder';
import { InvestorMatch } from './InvestorMatch';
import { Checklist } from './Checklist';
import { 
  auth, 
  db, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  doc, 
  handleFirestoreError, 
  OperationType 
} from '../firebase';

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
  const [isSaved, setIsSaved] = React.useState(false);
  const [savedDocId, setSavedDocId] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const checkIfSaved = React.useCallback(async () => {
    if (!selectedOpportunity || !auth.currentUser) return;
    try {
      const q = query(
        collection(db, 'saved_opportunities'),
        where('userId', '==', auth.currentUser.uid),
        where('opportunity.name', '==', selectedOpportunity.name)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        setIsSaved(true);
        setSavedDocId(querySnapshot.docs[0].id);
      } else {
        setIsSaved(false);
        setSavedDocId(null);
      }
    } catch (err) {
      console.error("Error checking saved status", err);
    }
  }, [selectedOpportunity]);

  React.useEffect(() => {
    if (selectedOpportunity && auth.currentUser) {
      checkIfSaved();
    }
  }, [selectedOpportunity, checkIfSaved]);

  const saveOpportunity = async () => {
    if (!selectedOpportunity || !auth.currentUser || !deepDiveResult) return;
    setSaving(true);
    try {
      const docRef = await addDoc(collection(db, 'saved_opportunities'), {
        userId: auth.currentUser.uid,
        opportunity: selectedOpportunity,
        deepDive: deepDiveResult,
        status: 'Saved',
        checklist: deepDiveResult.checklist.map(item => ({ text: item, completed: false })),
        savedAt: new Date().toISOString()
      });
      setIsSaved(true);
      setSavedDocId(docRef.id);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'saved_opportunities');
    } finally {
      setSaving(false);
    }
  };

  if (!selectedOpportunity) return null;

  const shareLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('opp', selectedOpportunity.name);
    copyToClipboard(url.toString(), 'share-link');
  };

  const exportToNotion = () => {
    if (!deepDiveResult) return;
    
    const notionMarkdown = `
# ${selectedOpportunity.name} - Execution Plan

## Executive Summary
${selectedOpportunity.description}

## Business Plan
${deepDiveResult.business_plan}

## Startup Costs
${deepDiveResult.cost_breakdown.map(c => `- [ ] ${c.item}: **$${c.cost}**`).join('\n')}

## 30-Day Checklist
${deepDiveResult.checklist.map(item => `- [ ] ${item}`).join('\n')}

## Funding & Grants
${deepDiveResult.grants.map(g => `- ${g}`).join('\n')}

## Potential Investors
${deepDiveResult.investors.map(inv => `- **${inv.name}** (${inv.stage}): ${inv.focus}`).join('\n')}

---
*Generated via AI Trend Intelligence Agent*
    `;
    
    copyToClipboard(notionMarkdown, 'notion-export');
  };

  const exportToPDF = () => {
    window.print();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[#141414]/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-8 no-print"
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: white !important; color: black !important; padding: 0 !important; margin: 0 !important; }
          .modal-container { 
            position: absolute !important; 
            top: 0 !important;
            left: 0 !important;
            width: 100% !important; 
            max-width: none !important; 
            height: auto !important; 
            max-height: none !important; 
            overflow: visible !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
          }
          .modal-content { overflow: visible !important; height: auto !important; padding: 2rem !important; }
          .sidebar-tabs { display: none !important; }
          .main-content { width: 100% !important; border: none !important; box-shadow: none !important; padding: 0 !important; }
          .copy-button { display: none !important; }
          .print-report-header { margin-bottom: 2rem; border-bottom: 2px solid #141414; padding-bottom: 1rem; }
          .print-section { margin-bottom: 3rem; page-break-inside: avoid; }
          .print-section-title { font-size: 1.5rem; font-weight: bold; font-style: italic; border-bottom: 1px solid #eee; margin-bottom: 1rem; padding-bottom: 0.5rem; }
        }
        @media screen {
          .print-only { display: none !important; }
        }
      `}} />
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-[#E4E3E0] w-full max-w-5xl max-h-[90vh] overflow-hidden border border-[#141414] flex flex-col modal-container"
      >
        {/* Modal Header */}
        <div className="border-b-2 border-[#141414] p-6 flex items-center justify-between bg-white no-print">
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
            {auth.currentUser && deepDiveResult && (
              <button
                onClick={saveOpportunity}
                disabled={isSaved || saving}
                className={`flex items-center gap-2 px-3 py-1.5 border text-[10px] font-mono uppercase transition-all ${isSaved ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-white border-[#141414] hover:bg-gray-50'}`}
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : (isSaved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />)}
                {isSaved ? 'Saved to Dashboard' : 'Save Opportunity'}
              </button>
            )}
            <button
              onClick={exportToNotion}
              className="flex items-center gap-2 px-3 py-1.5 bg-black text-white border border-black text-[10px] font-mono uppercase hover:bg-gray-800 transition-all"
              title="Copy for Notion"
            >
              {copied === 'notion-export' ? <Check size={14} /> : <ExternalLink size={14} />}
              {copied === 'notion-export' ? 'Copied for Notion' : 'Export to Notion'}
            </button>
            <button
              onClick={shareLink}
              className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-mono uppercase hover:bg-emerald-100 transition-all"
              title="Copy Shareable Link"
            >
              {copied === 'share-link' ? <Check size={14} /> : <Share2 size={14} />}
              {copied === 'share-link' ? 'Link Copied' : 'Share Link'}
            </button>
            <button
              onClick={exportToPDF}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-mono uppercase hover:bg-blue-100 transition-all"
              title="Export to PDF"
            >
              <Download size={14} />
              Export PDF
            </button>
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

        {/* Print Header (Only visible when printing) */}
        <div className="hidden print-only p-8 border-b-4 border-black mb-8">
          <h1 className="text-4xl font-serif italic uppercase mb-2">Signal to Startup: Execution Report</h1>
          <h2 className="text-2xl font-bold uppercase tracking-tighter">{selectedOpportunity.name}</h2>
          <p className="text-xs font-mono uppercase opacity-60 mt-4">Generated via AI Trend Intelligence Agent • {new Date().toLocaleDateString()}</p>
        </div>

        {/* Modal Content */}
        <div className="flex-grow overflow-y-auto p-6 md:p-10 bg-[#F5F5F0] modal-content">
          {deepDiveLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-6 no-print">
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
              <div className="lg:col-span-1 space-y-3 sidebar-tabs">
                <div className="bg-white border-2 border-[#141414] p-4 mb-4 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
                  <div className="text-[10px] font-mono uppercase opacity-50 mb-2">Opportunity Score</div>
                  <div className="text-3xl font-bold font-serif italic mb-4">{Math.round(selectedOpportunity.money_score)}/100</div>
                  
                  <div className="space-y-3 pt-4 border-t border-gray-100">
                    <p className="text-[10px] font-mono uppercase font-bold tracking-widest mb-2">Detailed Metrics</p>
                    {[
                      { label: 'ROI', value: selectedOpportunity.roi_potential },
                      { label: 'Urgency', value: selectedOpportunity.urgency },
                      { label: 'Local Fit', value: selectedOpportunity.local_fit },
                      { label: 'Gap', value: selectedOpportunity.competition_gap },
                      { label: 'Speed', value: selectedOpportunity.speed_to_launch },
                      { label: 'Ease', value: 10 - selectedOpportunity.difficulty },
                    ].map((metric) => (
                      <div key={metric.label} className="space-y-1">
                        <div className="flex justify-between items-end">
                          <p className="text-[8px] uppercase opacity-50 font-mono leading-none">{metric.label}</p>
                          <p className="text-[8px] font-mono font-bold leading-none">{metric.value}/10</p>
                        </div>
                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${metric.value * 10}%` }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className="h-full bg-[#141414]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
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
              <div className="lg:col-span-3 bg-white border-2 border-[#141414] p-8 md:p-12 min-h-[500px] shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] relative main-content">
                <div className="absolute top-4 right-4 no-print">
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
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-[#141414] text-[10px] font-mono uppercase hover:bg-[#141414] hover:text-[#E4E3E0] transition-all copy-button"
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
                    <Checklist 
                      deepDiveResult={deepDiveResult} 
                      savedDocId={savedDocId}
                    />
                  )}

                  {activeDeepDiveTab === 'investors' && (
                    <InvestorMatch deepDiveResult={deepDiveResult} />
                  )}
                </AnimatePresence>
              </div>

              {/* Print-Only Full Report */}
              <div className="print-only w-full">
                <div className="print-report-header">
                  <h1 className="text-4xl font-bold font-serif italic uppercase tracking-tighter">Execution Suite: {selectedOpportunity.name}</h1>
                  <p className="text-sm font-mono uppercase tracking-widest opacity-60 mt-2">Intelligence Report • {new Date().toLocaleDateString()}</p>
                  <div className="mt-4 flex items-center gap-4">
                    <div className="px-4 py-2 bg-[#141414] text-white text-xl font-bold font-serif italic">
                      Money Score: {Math.round(selectedOpportunity.money_score)}/100
                    </div>
                  </div>
                </div>

                <div className="print-section">
                  <h2 className="print-section-title">01. Executive Summary</h2>
                  <p className="font-serif italic text-lg leading-relaxed mb-4">{selectedOpportunity.description}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm font-mono uppercase">
                    <div className="p-4 border border-gray-200">
                      <div className="opacity-60 mb-1">Target Customer</div>
                      <div className="font-bold">{selectedOpportunity.target_customer}</div>
                    </div>
                    <div className="p-4 border border-gray-200">
                      <div className="opacity-60 mb-1">Monetization</div>
                      <div className="font-bold">{selectedOpportunity.monetization}</div>
                    </div>
                  </div>
                </div>

                <div className="print-section">
                  <h2 className="print-section-title">02. Detailed Business Plan</h2>
                  <div className="prose prose-sm max-w-none font-serif">
                    <Markdown>{deepDiveResult.business_plan}</Markdown>
                  </div>
                </div>

                <div className="print-section">
                  <h2 className="print-section-title">03. Startup Cost Estimator</h2>
                  <CostEstimator deepDiveResult={deepDiveResult} />
                </div>

                <div className="print-section">
                  <h2 className="print-section-title">04. Grant & Funding Opportunities</h2>
                  <GrantFinder deepDiveResult={deepDiveResult} />
                </div>

                <div className="print-section">
                  <h2 className="print-section-title">05. 30-Day Execution Checklist</h2>
                  <Checklist deepDiveResult={deepDiveResult} />
                </div>

                <div className="print-section">
                  <h2 className="print-section-title">06. Investor Matchmaking</h2>
                  <InvestorMatch deepDiveResult={deepDiveResult} />
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </motion.div>
    </motion.div>
  );
};
