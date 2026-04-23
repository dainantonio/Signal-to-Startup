import React from 'react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import {
  RefreshCcw,
  X,
  Loader2,
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
import Link from 'next/link';
import { exportToPDF, PDFExportData } from '@/lib/pdf-export';
import { Opportunity, DeepDiveResult, MarketMode } from './types';
import { CostEstimator } from './CostEstimator';
import { GrantFinder } from './GrantFinder';
import { InvestorMatch } from './InvestorMatch';
import { Checklist } from './Checklist';
import { getLabels } from './utils/labels';
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
  cancelDeepDive: () => void;
  deepDiveLoading: boolean;
  deepDiveResult: DeepDiveResult | null;
  activeDeepDiveTab: 'plan' | 'costs' | 'grants' | 'checklist' | 'investors' | 'strategy';
  setActiveDeepDiveTab: (tab: 'plan' | 'costs' | 'grants' | 'checklist' | 'investors' | 'strategy') => void;
  generateDeepDive: (opp: Opportunity) => void;
  copyToClipboard: (text: string, id: string) => void;
  copied: string | null;
  selectedMode: MarketMode;
  readingLevel?: 'simple' | 'standard' | 'advanced';
}



export const DeepDiveModal: React.FC<DeepDiveModalProps> = ({
  selectedOpportunity,
  setSelectedOpportunity,
  cancelDeepDive,
  deepDiveLoading,
  deepDiveResult,
  activeDeepDiveTab,
  setActiveDeepDiveTab,
  generateDeepDive,
  copyToClipboard,
  copied,
  selectedMode,
  readingLevel = 'standard',
}) => {
  const labels = getLabels(readingLevel);
  const [isSaved, setIsSaved] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);

  const handleClose = React.useCallback(() => {
    // 1. Synchronously clear the URL param so the URL-sync effect
    //    cannot read a stale ?opp= value before the selectedOpportunity
    //    state update propagates.
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('opp');
      window.history.replaceState({}, '', url);
    } catch { /* ignore SSR */ }

    // 2. Abort any in-progress Gemini generation so it cannot
    //    set state after the modal is gone.
    cancelDeepDive();

    // 3. Close the modal.
    setSelectedOpportunity(null);
  }, [setSelectedOpportunity, cancelDeepDive]);

  // Escape key to close
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleClose]);
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

  React.useEffect(() => {
    if (selectedOpportunity && !deepDiveResult && !deepDiveLoading) {
      generateDeepDive(selectedOpportunity);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOpportunity]);

  const saveOpportunity = async () => {
    if (!selectedOpportunity || !auth.currentUser || !deepDiveResult) return;
    setSaving(true);
    try {
      const docRef = await addDoc(collection(db, 'saved_opportunities'), {
        userId: auth.currentUser.uid,
        opportunity: selectedOpportunity,
        deepDive: deepDiveResult,
        status: 'Saved',
        checklist: deepDiveResult.checklist.map(item => ({
        text: typeof item === 'string' ? item : (item as { title: string }).title,
        completed: false,
      })),
        savedAt: new Date().toISOString(),
        marketMode: selectedMode,
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
${deepDiveResult.checklist.map(item => `- [ ] ${typeof item === 'string' ? item : (item as { title: string }).title}`).join('\n')}

## Funding & Grants
${deepDiveResult.grants.map(g => typeof g === 'string' ? `- ${g}` : `- **${(g as { name: string }).name}** (${(g as { organization: string }).organization})`).join('\n')}

## Potential Investors
${deepDiveResult.investors.map(inv => `- **${inv.name}** (${inv.stage}): ${inv.focus}`).join('\n')}

---
*Generated via Signal to Startup*
    `;
    
    copyToClipboard(notionMarkdown, 'notion-export');
  };

  const handleExportPDF = async () => {
    if (!deepDiveResult || !selectedOpportunity) return;
    setExporting(true);
    try {
      const data: PDFExportData = {
        opportunityName: selectedOpportunity.name,
        marketMode: selectedMode,
        countryTag: undefined,
        businessPlan: deepDiveResult.business_plan || '',
        costBreakdown: (deepDiveResult.cost_breakdown || []).map(item => ({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          item: (item as any).item || '',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          cost: (item as any).cost || 0,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          type: (item as any).type || 'one-time',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          notes: (item as any).notes || undefined,
        })),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        grants: ((deepDiveResult.grants || []) as any[])
          .filter(g => g && typeof g === 'object')
          .map(g => ({
            name: g.name || '',
            organization: g.organization || '',
            amount: g.amount || '',
            why_this_qualifies: g.why_this_qualifies || '',
            how_to_apply: g.how_to_apply || '',
          })),
        checklist: (deepDiveResult.checklist || []).map(item => {
          if (!item) return { title: '', description: '', phase: 1, time_estimate: '' };
          if (typeof item === 'string') {
            return { title: item, description: '', phase: 1, time_estimate: '' };
          }
          return {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            title: (item as any).title || '',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            description: (item as any).description || '',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            phase: (item as any).phase || 1,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            time_estimate: (item as any).time_estimate || '',
          };
        }),
        investors: (deepDiveResult.investors || []).map(inv => ({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          name: (inv as any).name || '',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          focus: (inv as any).focus || '',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          stage: (inv as any).stage || '',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          website: (inv as any).website || undefined,
        })),
        strategyReport: deepDiveResult.strategy_report ? {
          executive_summary: deepDiveResult.strategy_report.executive_summary,
          pricing_strategy: deepDiveResult.strategy_report.pricing_strategy,
          go_to_market: deepDiveResult.strategy_report.go_to_market,
          competitive_positioning: {
            position: deepDiveResult.strategy_report.competitive_positioning.position,
            key_differentiators: deepDiveResult.strategy_report.competitive_positioning.key_differentiators,
            moat: deepDiveResult.strategy_report.competitive_positioning.moat,
          },
          success_metrics: deepDiveResult.strategy_report.success_metrics,
        } : undefined,
        generatedAt: new Date().toISOString(),
      };
      await exportToPDF(data);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const tabs: { id: 'plan' | 'costs' | 'grants' | 'checklist' | 'investors' | 'strategy'; label: string; icon: string }[] = [
    { id: 'plan', label: labels.businessPlan, icon: '📄' },
    { id: 'costs', label: labels.startupCosts, icon: '💰' },
    { id: 'grants', label: labels.fundingGrants, icon: '🏦' },
    { id: 'checklist', label: labels.checklist, icon: '✅' },
    { id: 'investors', label: labels.investorMatch, icon: '🤝' },
    { id: 'strategy', label: 'Strategy', icon: '🎯' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-end md:items-center justify-center p-0 md:p-8 no-print"
      onClick={handleClose}
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
        className="bg-background w-full max-w-6xl h-[92dvh] md:h-[85dvh] overflow-hidden rounded-t-2xl md:rounded-2xl border border-slate-200 flex flex-col modal-container shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header - Mobile First */}
        <div className="border-b border-border/10 p-3 md:p-6 flex items-center gap-2 md:gap-3 bg-white/80 backdrop-blur-md sticky top-0 z-20 no-print">
          <div className="flex-1 min-w-0 overflow-hidden">
            <h2 className="font-sans font-semibold text-sm md:text-base leading-snug truncate break-words">{selectedOpportunity.name}</h2>
            <p className="text-[10px] text-slate-400">Execution Suite</p>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center gap-2">
              {auth.currentUser && deepDiveResult && (
                !isSaved ? (
                  <button
                    onClick={saveOpportunity}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white hover:border-slate-300 rounded-lg text-xs font-semibold text-slate-700 transition-all"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Bookmark size={14} />}
                    {saving ? 'Saving...' : 'Save Opportunity'}
                  </button>
                ) : (
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold transition-all"
                  >
                    <BookmarkCheck size={14} />
                    View in Pipeline
                  </Link>
                )
              )}
              <button
                onClick={exportToNotion}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-gray-800 transition-all"
              >
                {copied === 'notion-export' ? <Check size={14} /> : <ExternalLink size={14} />}
                {copied === 'notion-export' ? 'Copied' : 'Copy for Notion'}
              </button>
              <button
                onClick={shareLink}
                className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white text-slate-600 rounded-lg text-xs font-semibold hover:border-slate-300 transition-all"
              >
                {copied === 'share-link' ? <Check size={14} /> : <Share2 size={14} />}
                {copied === 'share-link' ? 'Link Copied' : 'Share Link'}
              </button>
              <button
                onClick={handleExportPDF}
                disabled={exporting || !deepDiveResult}
                className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors text-muted disabled:opacity-40"
                aria-label="Export as PDF"
              >
                {exporting ? <Loader2 size={18} className="animate-spin text-gray-400" /> : <Download size={18} />}
              </button>
            </div>

            {/* Mobile Actions Menu */}
            <div className="lg:hidden relative">
              <button
                onClick={() => setShowActions(!showActions)}
                aria-label="More actions"
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
                        isSaved ? (
                          <Link
                            href="/dashboard"
                            onClick={() => setShowActions(false)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-xl text-xs font-medium transition-colors text-secondary"
                          >
                            <BookmarkCheck className="w-4 h-4" />
                            View in Pipeline
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={() => { saveOpportunity(); setShowActions(false); }}
                            disabled={saving}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-xl text-xs font-medium transition-colors"
                          >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bookmark className="w-4 h-4" />}
                            {saving ? 'Saving...' : 'Save Opportunity'}
                          </button>
                        )
                      )}
                      <button
                        type="button"
                        onClick={() => { exportToNotion(); setShowActions(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-xl text-xs font-medium transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Copy for Notion
                      </button>
                      <button
                        type="button"
                        onClick={() => { shareLink(); setShowActions(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-xl text-xs font-medium transition-colors"
                      >
                        <Share2 className="w-4 h-4" />
                        Share Link
                      </button>
                      <button
                        type="button"
                        onClick={() => { handleExportPDF(); setShowActions(false); }}
                        disabled={exporting || !deepDiveResult}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-xl text-xs font-medium transition-colors disabled:opacity-40"
                      >
                        {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        {exporting ? 'Exporting...' : 'Export PDF'}
                      </button>
                      <div className="h-px bg-border/5 my-1" />
                      <button
                        type="button"
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
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleClose(); }}
              aria-label="Close execution suite"
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

        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row min-h-0">
          {/* Tab bar — mobile: sticky horizontal scroll row; desktop: fixed sidebar */}
          <div className="flex-shrink-0 lg:flex-shrink-0 lg:w-72 border-b lg:border-b-0 lg:border-r border-border/10 bg-gray-50/50 no-print sidebar-tabs sticky top-0 z-10 lg:static lg:z-auto lg:overflow-y-auto overflow-x-auto">
            <div className="relative">
              <div className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible scrollbar-hide p-2 lg:p-4 gap-1 lg:gap-2 min-w-max lg:min-w-0">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveDeepDiveTab(tab.id)}
                    className={`flex-shrink-0 flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2.5 lg:py-3 text-xs font-semibold transition-all whitespace-nowrap ${
                      activeDeepDiveTab === tab.id
                        ? 'border-b-2 border-gray-900 text-gray-900 lg:border-b-0 lg:border-l-2 lg:border-gray-900 bg-white'
                        : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="flex-shrink-0 text-base leading-none">{tab.icon}</span>
                    <span>{tab.label}</span>
                    {activeDeepDiveTab === tab.id && <ChevronRight className="hidden lg:block w-4 h-4 ml-auto opacity-40" />}
                  </button>
                ))}
              </div>
              {/* Fade hint on mobile to indicate horizontal scroll */}
              <div className="absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-gray-50 to-transparent pointer-events-none lg:hidden" />
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-10 bg-white main-content min-h-0">
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
                    <h3 className="text-base font-sans font-semibold">Building your execution suite...</h3>
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
                      <div className="prose prose-slate prose-sm sm:prose-base max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-600 prose-li:text-gray-600 prose-strong:font-bold prose-strong:text-gray-900 leading-relaxed marker:text-gray-400">
                        <ReactMarkdown>
                          {deepDiveResult.business_plan}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}

                  {activeDeepDiveTab === 'costs' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="flex items-center gap-3 text-primary bg-primary/5 px-4 py-2 rounded-full w-fit">
                        <span className="text-base leading-none">💰</span>
                        <span className="text-xs font-semibold">Startup Cost Breakdown</span>
                      </div>
                      <CostEstimator deepDiveResult={deepDiveResult} />
                    </div>
                  )}

                  {activeDeepDiveTab === 'grants' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="flex items-center gap-3 text-primary bg-primary/5 px-4 py-2 rounded-full w-fit">
                        <span className="text-base leading-none">🏦</span>
                        <span className="text-xs font-semibold">Funding & Grant Opportunities</span>
                      </div>
                      <GrantFinder deepDiveResult={deepDiveResult} selectedMode={selectedMode} />
                    </div>
                  )}

                  {activeDeepDiveTab === 'checklist' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="flex items-center gap-3 text-primary bg-primary/5 px-4 py-2 rounded-full w-fit">
                        <span className="text-base leading-none">✅</span>
                        <span className="text-xs font-semibold">30-Day Execution Checklist</span>
                      </div>
                      <Checklist deepDiveResult={deepDiveResult} savedDocId={savedDocId} />
                    </div>
                  )}

                  {activeDeepDiveTab === 'investors' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="flex items-center gap-3 text-primary bg-primary/5 px-4 py-2 rounded-full w-fit">
                        <span className="text-base leading-none">🤝</span>
                        <span className="text-xs font-semibold">Potential Investor Match</span>
                      </div>
                      <InvestorMatch deepDiveResult={deepDiveResult} />
                    </div>
                  )}

                  {activeDeepDiveTab === 'strategy' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="flex items-center gap-3 text-primary bg-primary/5 px-4 py-2 rounded-full w-fit">
                        <span className="text-base leading-none">🎯</span>
                        <span className="text-xs font-semibold">Strategy Report</span>
                      </div>

                      {!deepDiveResult.strategy_report ? (
                        <div className="text-center py-12">
                          <p className="text-sm text-gray-500">Regenerate the execution suite to get your strategy report.</p>
                        </div>
                      ) : (
                        <>
                          {/* Executive Summary */}
                          <div className="p-4 bg-gray-50 rounded-xl">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Executive Summary</p>
                            <p className="text-sm text-gray-700 leading-relaxed">{deepDiveResult.strategy_report.executive_summary}</p>
                          </div>

                          {/* Pricing */}
                          <div className="space-y-3">
                            <p className="text-sm font-semibold text-gray-900">Pricing Strategy</p>
                            <p className="text-xs text-gray-500">Model: {deepDiveResult.strategy_report.pricing_strategy.model}</p>
                            <div className="grid grid-cols-1 gap-3">
                              {deepDiveResult.strategy_report.pricing_strategy.tiers.map((tier, i) => (
                                <div key={i} className="p-4 border border-gray-200 rounded-xl">
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-semibold text-gray-900">{tier.name}</p>
                                    <p className="text-sm font-bold text-green-700">{tier.price}</p>
                                  </div>
                                  <ul className="space-y-1">
                                    {tier.includes.map((item, j) => (
                                      <li key={j} className="text-xs text-gray-600 flex items-start gap-1.5">
                                        <span className="text-green-500 flex-shrink-0">✓</span>
                                        {item}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                            <p className="text-xs text-gray-500 italic leading-relaxed">{deepDiveResult.strategy_report.pricing_strategy.rationale}</p>
                          </div>

                          {/* Go to Market */}
                          <div className="space-y-3">
                            <p className="text-sm font-semibold text-gray-900">Go-to-Market Plan</p>
                            {[
                              { label: 'Phase 1', value: deepDiveResult.strategy_report.go_to_market.phase1, color: 'bg-blue-50 border-blue-200' },
                              { label: 'Phase 2', value: deepDiveResult.strategy_report.go_to_market.phase2, color: 'bg-purple-50 border-purple-200' },
                              { label: 'Phase 3', value: deepDiveResult.strategy_report.go_to_market.phase3, color: 'bg-green-50 border-green-200' },
                            ].map((phase, i) => (
                              <div key={i} className={`p-3 rounded-xl border ${phase.color}`}>
                                <p className="text-xs font-bold text-gray-700 mb-1">{phase.label}</p>
                                <p className="text-xs text-gray-600 leading-relaxed">{phase.value}</p>
                              </div>
                            ))}
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                              <p className="text-xs font-bold text-amber-800 mb-1">First 10 Customers</p>
                              <p className="text-xs text-amber-700 leading-relaxed">{deepDiveResult.strategy_report.go_to_market.first_customers}</p>
                            </div>
                          </div>

                          {/* Competitive Positioning */}
                          <div className="space-y-3">
                            <p className="text-sm font-semibold text-gray-900">Competitive Position</p>
                            <p className="text-xs text-gray-600 leading-relaxed">{deepDiveResult.strategy_report.competitive_positioning.position}</p>
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-gray-700">Key differentiators:</p>
                              {deepDiveResult.strategy_report.competitive_positioning.key_differentiators.map((d, i) => (
                                <div key={i} className="flex items-start gap-2 text-xs text-gray-600">
                                  <span className="text-blue-500 flex-shrink-0">→</span>
                                  {d}
                                </div>
                              ))}
                            </div>
                            <div className="p-3 bg-gray-50 rounded-xl">
                              <p className="text-xs font-medium text-gray-700 mb-1">Your moat:</p>
                              <p className="text-xs text-gray-600 leading-relaxed">{deepDiveResult.strategy_report.competitive_positioning.moat}</p>
                            </div>
                          </div>

                          {/* Success Metrics */}
                          <div className="space-y-2">
                            <p className="text-sm font-semibold text-gray-900">Success Metrics</p>
                            {deepDiveResult.strategy_report.success_metrics.map((metric, i) => (
                              <div key={i} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                                <span className="text-xs font-mono text-gray-400 flex-shrink-0 mt-0.5">{String(i + 1).padStart(2, '0')}</span>
                                <p className="text-xs text-gray-700 leading-relaxed">{metric}</p>
                              </div>
                            ))}
                          </div>

                          <div className="text-center pt-2">
                            <p className="text-xs text-gray-400">Export this report as PDF using the download button above</p>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center py-20 text-center space-y-6">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-4xl">
                    📄
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-base font-sans font-semibold">Ready to deep dive?</h3>
                    <p className="text-sm text-muted max-w-xs mx-auto">Generate a complete execution suite for this opportunity including a business plan, costs, and funding.</p>
                    <button
                      type="button"
                      onClick={() => generateDeepDive(selectedOpportunity)}
                      className="px-8 py-3 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition-all"
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
