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
  ExternalLink,
  MoreVertical,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import Markdown from 'react-markdown';
import Link from 'next/link';
import { Opportunity, DeepDiveResult, MarketMode } from './types';
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
  selectedMode: MarketMode;
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
  copied,
  selectedMode
}) => {
  const [isSaved, setIsSaved] = React.useState(false);
  const [savedDocId, setSavedDocId] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [showActions, setShowActions] = React.useState(false);

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
      console.error('Failed to save opportunity:', err);
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

  const tabs = [
    { id: 'plan', label: 'Business Plan', icon: FileText },
    { id: 'costs', label: 'Startup Costs', icon: Calculator },
    { id: 'grants', label: 'Funding & Grants', icon: Coins },
    { id: 'checklist', label: '30-Day Checklist', icon: CheckSquare },
    { id: 'investors', label: 'Investor Match', icon: Users },
  ] as const;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-foreground/40 backdrop-blur-md z-50 flex items-end md:items-center justify-center p-0 md:p-8 no-print"
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
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="bg-background w-full max-w-6xl h-[92dvh] md:h-[85dvh] overflow-hidden rounded-t-3xl md:rounded-3xl border border-border/10 flex flex-col modal-container shadow-2xl"
      >
        {/* Modal Header */}
        <div className="border-b border-border/10 p-4 md:p-6 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-20 no-print">
          <div className="flex items-center gap-3 md:gap-4">
            <button 
              onClick={() => setSelectedOpportunity(null)}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              title="Back to list"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-lg md:text-2xl font-serif italic font-bold tracking-tight line-clamp-1">{selectedOpportunity.name}</h2>
              <p className="text-[10px] font-mono uppercase text-muted tracking-widest">Execution Suite</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center gap-2">
              {auth.currentUser && deepDiveResult && (
                !isSaved ? (
                  <button
                    onClick={saveOpportunity}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white border border-border/10 hover:border-border/30 rounded-xl text-[10px] font-mono uppercase font-bold transition-all shadow-sm"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Bookmark size={14} />}
                    {saving ? 'Saving...' : 'Save Opportunity'}
                  </button>
                ) : (
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-white rounded-xl text-[10px] font-mono uppercase font-bold transition-all shadow-lg shadow-secondary/20"
                  >
                    <BookmarkCheck size={14} />
                    View in Pipeline
                  </Link>
                )
              )}
              <button
                onClick={exportToNotion}
                className="flex items-center gap-2 px-4 py-2.5 bg-foreground text-background rounded-xl text-[10px] font-mono uppercase font-bold hover:bg-foreground/90 transition-all shadow-lg shadow-foreground/10"
              >
                {copied === 'notion-export' ? <Check size={14} /> : <ExternalLink size={14} />}
                {copied === 'notion-export' ? 'Copied' : 'Export to Notion'}
              </button>
              <button
                onClick={shareLink}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary/5 border border-primary/10 text-primary rounded-xl text-[10px] font-mono uppercase font-bold hover:bg-primary/10 transition-all"
              >
                {copied === 'share-link' ? <Check size={14} /> : <Share2 size={14} />}
                {copied === 'share-link' ? 'Link Copied' : 'Share Link'}
              </button>
              <button
                onClick={exportToPDF}
                className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors text-muted"
                title="Export PDF"
              >
                <Download size={18} />
              </button>
            </div>

            {/* Mobile Actions Menu */}
            <div className="lg:hidden relative">
              <button 
                onClick={() => setShowActions(!showActions)}
                className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              
              <AnimatePresence>
                {showActions && (
                  <>
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowActions(false)}
                      className="fixed inset-0 z-30"
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      className="absolute right-0 mt-2 w-56 bg-white border border-border/10 rounded-2xl shadow-2xl z-40 p-2 overflow-hidden"
                    >
                      {auth.currentUser && deepDiveResult && (
                        <button
                          onClick={() => { saveOpportunity(); setShowActions(false); }}
                          disabled={saving}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-xl text-xs font-medium transition-colors"
                        >
                          {isSaved ? <BookmarkCheck className="w-4 h-4 text-secondary" /> : <Bookmark className="w-4 h-4" />}
                          {isSaved ? 'Saved to Pipeline' : 'Save Opportunity'}
                        </button>
                      )}
                      <button
                        onClick={() => { exportToNotion(); setShowActions(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-xl text-xs font-medium transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Export to Notion
                      </button>
                      <button
                        onClick={() => { shareLink(); setShowActions(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-xl text-xs font-medium transition-colors"
                      >
                        <Share2 className="w-4 h-4" />
                        Share Link
                      </button>
                      <button
                        onClick={() => { exportToPDF(); setShowActions(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-xl text-xs font-medium transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Export PDF
                      </button>
                      <div className="h-px bg-border/5 my-1" />
                      <button
                        onClick={() => { generateDeepDive(selectedOpportunity); setShowActions(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-xl text-xs font-medium transition-colors text-primary"
                      >
                        <RefreshCcw className="w-4 h-4" />
                        Regenerate Plan
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={() => setSelectedOpportunity(null)}
              className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Print Header */}
        <div className="hidden print-only p-8 border-b-4 border-black mb-8">
          <h1 className="text-4xl font-serif italic font-bold mb-2">Signal to Startup: Execution Report</h1>
          <p className="text-xl font-bold uppercase tracking-widest">{selectedOpportunity.name}</p>
          <p className="text-sm opacity-60 mt-4">Generated on {new Date().toLocaleDateString()}</p>
        </div>

        <div className="flex-grow overflow-hidden flex flex-col lg:flex-row">
          {/* Sidebar Tabs */}
          <div className="lg:w-72 border-r border-border/10 bg-gray-50/50 overflow-x-auto lg:overflow-y-auto no-print sidebar-tabs">
            <div className="flex lg:flex-col p-3 lg:p-4 gap-2 min-w-max lg:min-w-0">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveDeepDiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-bold transition-all ${
                    activeDeepDiveTab === tab.id 
                      ? 'bg-white text-primary shadow-md shadow-primary/5 border border-primary/10' 
                      : 'text-muted hover:text-foreground hover:bg-white/50'
                  }`}
                >
                  <tab.icon className={`w-4 h-4 ${activeDeepDiveTab === tab.id ? 'text-primary' : 'text-muted'}`} />
                  <span className="whitespace-nowrap">{tab.label}</span>
                  {activeDeepDiveTab === tab.id && <ChevronRight className="hidden lg:block w-4 h-4 ml-auto opacity-40" />}
                </button>
              ))}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-grow overflow-y-auto p-6 md:p-10 bg-white main-content">
            <AnimatePresence mode="wait">
              {deepDiveLoading ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col items-center justify-center py-20 text-center space-y-6"
                >
                  <div className="relative">
                    <div className="w-20 h-20 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <TrendingUp className="w-8 h-8 text-primary animate-pulse" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-serif italic font-bold">Building your execution suite...</h3>
                    <p className="text-sm text-muted max-w-xs mx-auto">Gemini is analyzing market data, estimating costs, and finding funding sources.</p>
                  </div>
                </motion.div>
              ) : deepDiveResult ? (
                <motion.div
                  key="content"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="max-w-3xl mx-auto"
                >
                  {activeDeepDiveTab === 'plan' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="flex items-center gap-3 text-primary bg-primary/5 px-4 py-2 rounded-full w-fit">
                        <FileText className="w-4 h-4" />
                        <span className="text-[10px] font-mono uppercase font-bold tracking-widest">Strategic Business Plan</span>
                      </div>
                      <div className="prose prose-slate prose-headings:font-serif prose-headings:italic prose-headings:tracking-tight prose-p:leading-relaxed prose-p:text-gray-600 max-w-none">
                        <Markdown>{deepDiveResult.business_plan}</Markdown>
                      </div>
                    </div>
                  )}

                  {activeDeepDiveTab === 'costs' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="flex items-center gap-3 text-primary bg-primary/5 px-4 py-2 rounded-full w-fit">
                        <Calculator className="w-4 h-4" />
                        <span className="text-[10px] font-mono uppercase font-bold tracking-widest">Startup Cost Breakdown</span>
                      </div>
                      <CostEstimator deepDiveResult={deepDiveResult} />
                    </div>
                  )}

                  {activeDeepDiveTab === 'grants' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="flex items-center gap-3 text-primary bg-primary/5 px-4 py-2 rounded-full w-fit">
                        <Coins className="w-4 h-4" />
                        <span className="text-[10px] font-mono uppercase font-bold tracking-widest">Funding & Grant Opportunities</span>
                      </div>
                      <GrantFinder deepDiveResult={deepDiveResult} selectedMode={selectedMode} />
                    </div>
                  )}

                  {activeDeepDiveTab === 'checklist' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="flex items-center gap-3 text-primary bg-primary/5 px-4 py-2 rounded-full w-fit">
                        <CheckSquare className="w-4 h-4" />
                        <span className="text-[10px] font-mono uppercase font-bold tracking-widest">30-Day Execution Checklist</span>
                      </div>
                      <Checklist deepDiveResult={deepDiveResult} savedDocId={savedDocId} />
                    </div>
                  )}

                  {activeDeepDiveTab === 'investors' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="flex items-center gap-3 text-primary bg-primary/5 px-4 py-2 rounded-full w-fit">
                        <Users className="w-4 h-4" />
                        <span className="text-[10px] font-mono uppercase font-bold tracking-widest">Potential Investor Match</span>
                      </div>
                      <InvestorMatch deepDiveResult={deepDiveResult} />
                    </div>
                  )}
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center py-20 text-center space-y-6">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-muted">
                    <FileText className="w-10 h-10" />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xl font-serif italic font-bold">Ready to deep dive?</h3>
                    <p className="text-sm text-muted max-w-xs mx-auto">Generate a complete execution suite for this opportunity including a business plan, costs, and funding.</p>
                    <button
                      onClick={() => generateDeepDive(selectedOpportunity)}
                      className="px-8 py-4 bg-primary text-white rounded-2xl font-mono text-xs uppercase font-bold tracking-widest hover:bg-primary/90 transition-all shadow-xl shadow-primary/20"
                    >
                      Generate Execution Suite
                    </button>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
