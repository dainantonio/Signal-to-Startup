'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Globe,
  History,
  LogIn,
  LogOut,
  X,
  User as UserIcon,
  Trash2,
  LayoutDashboard,
  ArrowLeft,
  Sparkles,
  RefreshCw,
  Bell,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { MarketMode } from '../types';
import { COUNTRY_CONTEXT } from '@/lib/rss-sources';
import { marketModeConfigs } from '../MarketModeSelector';
import { DeepDiveModal } from '../DeepDiveModal';
import Onboarding, { UserPreferences } from '../Onboarding';
import { useAgentAuth } from './useAgentAuth';
import { useAgentAnalysis } from './useAgentAnalysis';
import Logo from '../Logo';

// New newsroom components
import { WorkflowStepper } from '../WorkflowStepper';
import { SignalDeskNewsroom } from '../SignalDeskNewsroom';
import { BriefingColumns } from '../BriefingColumns';
import { OpportunityGrid } from '../OpportunityGrid';
import { StickyActionBar } from '../StickyActionBar';
import { DailyBrief } from '../DailyBrief';
import { AnalysisResultModal } from '../AnalysisResultModal';

export default function TrendIntelligenceAgentNewsroom() {
  const { user, login, logout, loginError } = useAgentAuth();

  const [showHistory, setShowHistory] = useState(false);
  const [showDailyBrief, setShowDailyBrief] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [modalSourceTitle, setModalSourceTitle] = useState<string>('');
  const [isAgentModal, setIsAgentModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try {
      return localStorage.getItem('onboardingComplete') !== 'true';
    } catch {
      return true;
    }
  });
  const [selectedMode, setSelectedMode] = useState<MarketMode>('global');
  const [countryTags, setCountryTags] = useState<string[]>(() => {
    try {
      const s = localStorage.getItem('s2s_country_tags');
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  });

  // Persist country tags
  useEffect(() => {
    try {
      localStorage.setItem('s2s_country_tags', JSON.stringify(countryTags));
    } catch {}
  }, [countryTags]);

  // Clear country tags when market mode changes
  const handleSetSelectedMode = (mode: MarketMode) => {
    setSelectedMode(mode);
    setCountryTags([]);
  };

  // Auto-switch market mode when a country is selected
  const handleSetCountryTags = useCallback((tags: string[]) => {
    setCountryTags(tags);
    if (tags.length > 0) {
      const ctx = COUNTRY_CONTEXT[tags[0].toLowerCase()];
      if (ctx && ctx.region !== 'global') {
        setSelectedMode(ctx.region as MarketMode);
      }
    }
  }, []);

  // Load saved preferences on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('userPreferences');
      if (saved) {
        const prefs: UserPreferences = JSON.parse(saved);
        if (prefs.marketMode) setSelectedMode(prefs.marketMode);
        if (prefs.countryTag) handleSetCountryTags([prefs.countryTag]);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOnboardingComplete = (prefs: UserPreferences) => {
    setShowOnboarding(false);
    if (prefs.marketMode) setSelectedMode(prefs.marketMode);
    if (prefs.countryTag) handleSetCountryTags([prefs.countryTag]);
  };

  const analysis = useAgentAnalysis(user, selectedMode, countryTags);

  // Pick up pre-analyzed opportunity from agent (via dashboard "View Opportunity")
  useEffect(() => {
    if (!user) return;
    const oppId = sessionStorage.getItem('agentOpportunityId');
    const signalTitle = sessionStorage.getItem('agentSignalTitle');
    if (!oppId) return;
    sessionStorage.removeItem('agentOpportunityId');
    sessionStorage.removeItem('agentSignalTitle');
    const loadOpportunity = async () => {
      try {
        const { doc, getDoc, db } = await import('@/firebase');
        const oppDoc = await getDoc(doc(db, 'agent_opportunities', oppId));
        if (oppDoc.exists()) {
          const data = oppDoc.data();
          analysis.setResult(data.result);
          setModalSourceTitle(signalTitle || data.signalTitle || 'Agent discovered signal');
          setIsAgentModal(true);
          setShowAnalysisModal(true);
        } else {
          console.error('[AGENT] Opportunity not found:', oppId);
        }
      } catch (err) {
        console.error('[AGENT] Failed to load opportunity:', err);
      }
    };
    loadOpportunity();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Auto-open modal when analysis completes from feed
  const prevResultRef = React.useRef(analysis.result);
  useEffect(() => {
    if (!prevResultRef.current && analysis.result && modalSourceTitle) {
      setIsAgentModal(false);
      setShowAnalysisModal(true);
    }
    prevResultRef.current = analysis.result;
  }, [analysis.result, modalSourceTitle]);

  // Handle analysis from feed with modal
  const handleAnalyzeFromFeed = useCallback((text: string, title: string) => {
    setModalSourceTitle(title);
    analysis.analyzeSignal(text);
  }, [analysis]);

  // Handle compound multi-signal analysis
  const handleCompoundAnalysis = useCallback((articles: import('../types').FeedSignal[]) => {
    const title = `Compound signal — ${articles.length} sources`;
    setModalSourceTitle(title);
    setIsAgentModal(false);
    analysis.analyzeCompoundSignal(articles);
  }, [analysis]);

  // Back to feed
  const handleBackToFeed = useCallback(() => {
    analysis.cancelAnalysis();
    analysis.setResult(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [analysis]);

  // Regenerate analysis
  const handleRegenerate = useCallback(() => {
    if (analysis.input) {
      analysis.analyzeSignal(analysis.input);
    }
  }, [analysis]);

  // Scroll listener for workflow stepper
  useEffect(() => {
    const handleScroll = () => {
      const steps = [1, 2, 3, 4];
      for (const step of [...steps].reverse()) {
        const el = document.getElementById(`step-${step}`);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 200) {
            setCurrentStep(step);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Sync selected opportunity with URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oppName = params.get('opp');
    if (oppName && analysis.result && !analysis.selectedOpportunity) {
      const opp = analysis.result.opportunities.find(o => o.name === oppName);
      if (opp) {
        analysis.generateDeepDive(opp);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysis.result]);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (analysis.selectedOpportunity) {
      url.searchParams.set('opp', analysis.selectedOpportunity.name);
    } else {
      url.searchParams.delete('opp');
    }
    window.history.replaceState({}, '', url);
  }, [analysis.selectedOpportunity]);

  // Show onboarding for new users
  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-12 w-full">
        {/* Header */}
        <header className="mb-8 md:mb-12 pb-6 md:pb-8 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-4 lg:gap-6">
            <div className="w-full lg:w-auto">
              <Logo size="lg" showWordmark showSubbrand theme="light" />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              {user ? (
                <>
                  <button
                    onClick={() => setShowDailyBrief(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition-all text-sm relative"
                  >
                    <Bell className="w-4 h-4" />
                    <span className="font-medium hidden sm:inline">Daily Brief</span>
                    {(() => {
                      try {
                        const lastCheck = localStorage.getItem('dailyBriefLastCheck');
                        return lastCheck !== new Date().toDateString();
                      } catch {
                        return false;
                      }
                    })() && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                    )}
                  </button>
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 hover:border-gray-300 rounded-xl transition-all text-sm"
                  >
                    <History className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-gray-700 hidden sm:inline">History</span>
                    {analysis.history.length > 0 && (
                      <span className="text-xs text-gray-400">({analysis.history.length})</span>
                    )}
                  </button>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 hover:border-gray-300 rounded-xl transition-all text-sm"
                  >
                    <LayoutDashboard className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-gray-700 hidden sm:inline">Dashboard</span>
                  </Link>
                  {user.email === 'dain.russell@gmail.com' && (
                    <Link
                      href="/admin"
                      className="px-3 py-2 bg-white border border-gray-200 hover:border-gray-300 rounded-xl transition-all text-sm font-medium text-gray-600"
                    >
                      Admin
                    </Link>
                  )}
                  <div className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-2 rounded-xl">
                    <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                      <UserIcon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 hidden sm:block max-w-[80px] truncate">
                      {user.displayName?.split(' ')[0]}
                    </span>
                    <button
                      onClick={logout}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      title="Sign out"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="p-2 bg-white border border-gray-200 hover:border-gray-300 rounded-xl transition-all"
                  >
                    <History className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    onClick={login}
                    className="flex items-center justify-center gap-2 bg-black text-white px-4 py-2 text-sm font-medium hover:bg-gray-800 transition-all rounded-xl flex-1 sm:flex-initial"
                  >
                    <LogIn className="w-4 h-4" />
                    <span className="whitespace-nowrap">Sign in</span>
                  </button>
                  {loginError && <p className="text-sm text-red-500 w-full sm:w-auto">{loginError}</p>}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Workflow Stepper - Always visible when result exists */}
        {analysis.result && <WorkflowStepper currentStep={currentStep} />}


        {/* Signal Desk */}
        <SignalDeskNewsroom
          input={analysis.input}
          setInput={analysis.setInput}
          location={analysis.location}
          setLocation={analysis.setLocation}
          focus={analysis.focus}
          setFocus={analysis.setFocus}
          loading={analysis.loading}
          loadingStage={analysis.loadingStage}
          loadingProgress={analysis.loadingProgress}
          analyzeSignal={(text?: string, title?: string) => {
            if (title) {
              handleAnalyzeFromFeed(text || '', title);
            } else {
              setModalSourceTitle('');
              analysis.analyzeSignal(text);
            }
          }}
          cancelAnalysis={analysis.cancelAnalysis}
          selectedMode={selectedMode}
          setSelectedMode={handleSetSelectedMode}
          countryTags={countryTags}
          setCountryTags={handleSetCountryTags}
          showQuickEdit={!!analysis.result}
          onQuickEdit={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onCompoundAnalysis={handleCompoundAnalysis}
        />

        {/* Analysis Result Modal - Auto-opens from feed */}
        <AnalysisResultModal
          isOpen={showAnalysisModal}
          onClose={() => {
            setShowAnalysisModal(false);
            setModalSourceTitle('');
            setIsAgentModal(false);
          }}
          result={analysis.result}
          generateDeepDive={analysis.generateDeepDive}
          sourceTitle={modalSourceTitle}
          isAgentResult={isAgentModal}
        />

        {/* Daily Brief - Controlled from header */}
        {showDailyBrief && (
          <DailyBrief
            isOpen={showDailyBrief}
            onClose={() => setShowDailyBrief(false)}
            onAnalyzeSignal={(sig) => {
              const text = [sig.title, sig.snippet].filter(Boolean).join('\n\n');
              analysis.analyzeSignal(text);
              setShowDailyBrief(false);
            }}
          />
        )}

        {/* Results Section */}
        <AnimatePresence mode="wait">
          {analysis.error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl mb-8 text-sm"
            >
              {analysis.error}
            </motion.div>
          )}

          {analysis.result && (
            <>
              {/* Briefing Columns */}
              <BriefingColumns result={analysis.result} />

              {/* Opportunity Grid */}
              <OpportunityGrid
                result={analysis.result}
                filteredOpportunities={analysis.filteredOpportunities}
                filterType={analysis.filterType}
                setFilterType={analysis.setFilterType}
                grantOnly={analysis.grantOnly}
                setGrantOnly={analysis.setGrantOnly}
                generateDeepDive={analysis.generateDeepDive}
                countryTags={countryTags}
              />

              {/* Execution Summary (Step 4) */}
              <section id="step-4" className="scroll-mt-24 mb-16">
                <div className="bg-black text-white p-12 rounded-3xl shadow-2xl">
                  <div className="flex items-center gap-3 mb-6">
                    <Sparkles className="w-6 h-6" />
                    <h2 className="text-2xl font-serif font-bold">Next Steps</h2>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div>
                      <h3 className="text-xl font-semibold mb-4">
                        {analysis.result.best_idea.name}
                      </h3>
                      <p className="text-gray-300 leading-relaxed mb-6">
                        {analysis.result.best_idea.reason}
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">
                            Est. Cost
                          </p>
                          <p className="text-lg font-semibold">
                            {analysis.result.best_idea.cost_estimate}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">
                            Speed
                          </p>
                          <p className="text-lg font-semibold">
                            {analysis.result.best_idea.speed_rating}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-4 uppercase tracking-wide">
                        Immediate Actions
                      </p>
                      <ol className="space-y-4">
                        {analysis.result.best_idea.first_steps.map((step, i) => (
                          <li key={i} className="flex gap-4">
                            <span className="text-gray-500 font-mono text-sm pt-0.5">
                              {String(i + 1).padStart(2, '0')}
                            </span>
                            <span className="text-gray-200 leading-relaxed">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}
        </AnimatePresence>

        {/* Sticky Action Bar */}
        {analysis.result && (
          <StickyActionBar
            onExtract={() => analysis.analyzeSignal()}
            onRegenerate={handleRegenerate}
            showRegenerate={!analysis.loading}
            loading={analysis.loading}
            extractLabel={analysis.loading ? 'Processing...' : 'Extract'}
          />
        )}

        {/* Deep Dive Modal */}
        <AnimatePresence>
          {analysis.selectedOpportunity && (
            <DeepDiveModal
              selectedOpportunity={analysis.selectedOpportunity}
              setSelectedOpportunity={analysis.setSelectedOpportunity}
              cancelDeepDive={analysis.cancelDeepDive}
              deepDiveLoading={analysis.deepDiveLoading}
              deepDiveResult={analysis.deepDiveResult}
              activeDeepDiveTab={analysis.activeDeepDiveTab}
              setActiveDeepDiveTab={analysis.setActiveDeepDiveTab}
              generateDeepDive={analysis.generateDeepDive}
              copyToClipboard={(text: string, id: string) => {
                navigator.clipboard.writeText(text);
                setCopied(id);
                setTimeout(() => setCopied(null), 2000);
              }}
              copied={copied}
              selectedMode={selectedMode}
            />
          )}
        </AnimatePresence>

        {/* History Panel */}
        <AnimatePresence>
          {showHistory && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowHistory(false)}
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
              />

              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed right-0 top-0 bottom-0 w-full md:w-96 bg-white border-l border-gray-200 z-50 flex flex-col shadow-2xl"
              >
                <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-white">
                  <h3 className="text-lg font-semibold">Analysis History</h3>
                  <button
                    onClick={() => setShowHistory(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-grow overflow-y-auto p-6 space-y-4">
                  {!user ? (
                    <div className="bg-gray-50 border border-gray-200 p-8 text-center space-y-6 rounded-2xl">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                        <LogIn className="w-8 h-8 text-gray-400" />
                      </div>
                      <div className="space-y-2">
                        <p className="font-serif text-xl font-bold">Sign in to save history</p>
                        <p className="text-sm text-gray-600">
                          Keep track of your analyses across sessions
                        </p>
                      </div>
                      <button
                        onClick={login}
                        className="w-full flex items-center justify-center gap-2 bg-black text-white px-4 py-3.5 text-sm font-medium hover:bg-gray-800 transition-all rounded-xl shadow-lg"
                      >
                        <Globe className="w-4 h-4" />
                        Sign in with Google
                      </button>
                      {loginError && <p className="text-sm text-red-500 text-center">{loginError}</p>}
                    </div>
                  ) : analysis.history.length > 0 ? (
                    analysis.history.map(item => (
                      <div
                        key={item.id}
                        className="group bg-white border border-gray-200 p-5 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer rounded-xl"
                        onClick={() => {
                          analysis.setResult(item);
                          if (item.marketMode) {
                            setSelectedMode(item.marketMode);
                          }
                          setShowHistory(false);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-xs font-medium text-gray-500">
                            {item.createdAt
                              ? new Date(item.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : 'Unknown'}
                          </span>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              analysis.deleteAnalysis(item.id);
                            }}
                            className="text-gray-400 hover:text-red-500 transition-colors p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <h4 className="text-sm font-semibold leading-snug group-hover:text-black transition-colors line-clamp-2">
                          {item.trend}
                        </h4>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-20 opacity-30">
                      <History className="w-16 h-16 mx-auto mb-4 opacity-20" />
                      <p className="text-sm text-gray-500">No analyses found</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
