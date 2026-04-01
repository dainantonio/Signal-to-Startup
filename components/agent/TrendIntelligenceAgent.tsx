'use client';

import React, { useState, useCallback } from 'react';
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
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { MarketMode } from '../types';
import { COUNTRY_CONTEXT } from '@/lib/rss-sources';
import { SignalInput } from '../SignalInput';
import { marketModeConfigs } from '../MarketModeSelector';
import { ResultsDashboard } from '../ResultsDashboard';
import { DeepDiveModal } from '../DeepDiveModal';
import Onboarding, { UserPreferences } from '../Onboarding';
import { PipelineProgress } from '../PipelineProgress';
import { Search, BarChart3, Target, Rocket } from 'lucide-react';
import { useAgentAuth } from './useAgentAuth';
import { useAgentAnalysis } from './useAgentAnalysis';
import { ValidateMode } from '../ValidateMode';
import Logo from '../Logo';
import NotificationBell from '../NotificationBell';
import { auth, db, doc, setDoc } from '@/firebase';

type AppMode = 'discover' | 'validate';

export default function TrendIntelligenceAgent() {
  const { user, login, logout, loginError } = useAgentAuth();

  const [appMode, setAppMode] = useState<AppMode>('discover');
  const [showHistory, setShowHistory] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try { return localStorage.getItem('onboardingComplete') !== 'true'; } catch { return true; }
  });
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [hasLastResult, setHasLastResult] = useState(() => {
    try { return !!sessionStorage.getItem('s2s_lastResult'); } catch { return false; }
  });
  const [selectedMode, setSelectedMode] = useState<MarketMode>('global');
  const [isAgentResult, setIsAgentResult] = useState(false);
  const [hasSeenShareHint, setHasSeenShareHint] = useState(() => {
    try { return localStorage.getItem('seenShareHint') === 'true'; } catch { return false; }
  });
  const [countryTags, setCountryTags] = useState<string[]>(() => {
    try { const s = localStorage.getItem('s2s_country_tags'); return s ? JSON.parse(s) : []; } catch { return []; }
  });

  // Persist country tags
  React.useEffect(() => {
    try { localStorage.setItem('s2s_country_tags', JSON.stringify(countryTags)); } catch {}
  }, [countryTags]);

  // Sync preference changes to Firestore so the agent can read them
  const syncPrefsToFirestore = useCallback(
    async (updates: Record<string, unknown>) => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        await setDoc(
          doc(db, 'user_preferences', user.uid),
          { ...updates, userId: user.uid, updatedAt: new Date().toISOString() },
          { merge: true }
        );
      } catch {
        // Non-blocking — localStorage is the source of truth for the UI
      }
    },
    []
  );

  // Clear country tags when market mode changes
  const handleSetSelectedMode = (mode: MarketMode) => {
    setSelectedMode(mode);
    setCountryTags([]);
    syncPrefsToFirestore({ marketMode: mode, countryTag: '' });
  };

  // Auto-switch market mode when a country is selected
  const handleSetCountryTags = useCallback(
    (tags: string[]) => {
      setCountryTags(tags);
      let newMode: MarketMode | undefined;
      if (tags.length > 0) {
        const ctx = COUNTRY_CONTEXT[tags[0].toLowerCase()];
        if (ctx && ctx.region !== 'global') {
          newMode = ctx.region as MarketMode;
          setSelectedMode(newMode);
        }
      }
      syncPrefsToFirestore({
        countryTag: tags[0] ?? '',
        ...(newMode ? { marketMode: newMode } : {}),
      });
    },
    [syncPrefsToFirestore]
  );

  // Load saved preferences on mount
  React.useEffect(() => {
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
    // sectors saved to localStorage by Onboarding; SignalInput reads on mount
  };

  const analysis = useAgentAnalysis(user, selectedMode, countryTags);

  // FIX 2: Back to feed
  const handleBackToFeed = useCallback(() => {
    setShowCancelConfirm(false);
    analysis.cancelAnalysis();
    analysis.setResult(null);
    setIsAgentResult(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [analysis]);

  const handleBackOrCancel = useCallback(() => {
    if (analysis.loading && analysis.loadingProgress >= 80) {
      setShowCancelConfirm(true);
    } else {
      handleBackToFeed();
    }
  }, [analysis, handleBackToFeed]);

  // Escape key — only affects page-level state (not the deep dive modal,
  // which manages its own Escape handler internally).
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // If deep dive modal is open, let its own handler deal with it
        if (analysis.selectedOpportunity) return;
        if (showCancelConfirm) { setShowCancelConfirm(false); return; }
        if (analysis.result || analysis.loading) handleBackOrCancel();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [analysis.selectedOpportunity, analysis.result, analysis.loading, showCancelConfirm, handleBackOrCancel]);

  // FIX 3: Save result to sessionStorage whenever it changes
  React.useEffect(() => {
    if (analysis.result) {
      try { sessionStorage.setItem('s2s_lastResult', JSON.stringify(analysis.result)); } catch {}
      setHasLastResult(false); // user is viewing it — hide banner
    }
  }, [analysis.result]);

  // Pick up pre-analyzed opportunity from agent (via dashboard "View Opportunity")
  React.useEffect(() => {
    try {
      const raw = sessionStorage.getItem('agentOpportunity');
      if (!raw) return;
      sessionStorage.removeItem('agentOpportunity');
      const result = JSON.parse(raw);
      setTimeout(() => {
        analysis.setResult(result);
        setIsAgentResult(true);
      }, 300);
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pick up shared article from /share page and auto-analyze
  React.useEffect(() => {
    try {
      const raw = sessionStorage.getItem('sharedArticle');
      if (!raw) return;
      sessionStorage.removeItem('sharedArticle');
      const article = JSON.parse(raw) as { url: string; title: string; text: string };
      const textToAnalyze = (article.text && article.text.trim().length > 50)
        ? article.text
        : article.url;
      // Small delay so the page is mounted before analysis starts
      setTimeout(() => {
        analysis.analyzeSignal(textToAnalyze);
      }, 300);
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pipelineSteps = [
    { id: 1, label: 'Ingestion', icon: Search },
    { id: 2, label: 'Analysis', icon: BarChart3 },
    { id: 3, label: 'Matrix', icon: Target },
    { id: 4, label: 'Execution', icon: Rocket },
  ];

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  // Sync selected opportunity with URL for shareability.
  // NOTE: intentionally only depends on analysis.result — do NOT add
  // analysis.selectedOpportunity here.  If we did, closing the modal
  // (selectedOpportunity → null) would re-fire this effect while ?opp
  // is still in the URL (the clear effect runs after), causing an
  // instant re-open of the execution suite.
  React.useEffect(() => {
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

  React.useEffect(() => {
    const url = new URL(window.location.href);
    if (analysis.selectedOpportunity) {
      url.searchParams.set('opp', analysis.selectedOpportunity.name);
    } else {
      url.searchParams.delete('opp');
    }
    window.history.replaceState({}, '', url);
  }, [analysis.selectedOpportunity]);

  // Auto-scroll to results when they first appear
  const prevResultRef = React.useRef<typeof analysis.result>(null);
  React.useEffect(() => {
    if (!prevResultRef.current && analysis.result) {
      console.log('[11] result became non-null — scrolling to results');
      setTimeout(() => {
        const el = document.getElementById('step-2');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          console.log('[12] scrolled to #step-2');
        } else {
          console.warn('[12] #step-2 not found in DOM');
        }
      }, 150);
    }
    if (prevResultRef.current && !analysis.result) {
      console.log('[DEBUG] result was cleared — something set it to null');
    }
    prevResultRef.current = analysis.result;
  }, [analysis.result]);

  // Scroll listener for pipeline progress
  React.useEffect(() => {
    const handleScroll = () => {
      const steps = [1, 2, 3, 4];
      for (const step of [...steps].reverse()) {
        const el = document.getElementById(`step-${step}`);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 150) {
            setCurrentStep(step);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Show onboarding for new users before the main app
  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen-safe bg-background text-foreground p-4 md:p-8 font-sans selection:bg-primary/20">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-8 md:mb-12 border-b border-border/10 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <Logo size="lg" showWordmark showSubbrand theme="light" />
            <p className="text-xs md:text-sm uppercase tracking-widest text-muted font-medium max-w-xl leading-relaxed">
              Turn news, policy, and market signals into actionable business opportunities.
            </p>
          </div>
          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono bg-secondary/10 text-secondary px-3 py-1.5 rounded-full border border-secondary/20">
              <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-pulse" />
              LIVE FEED ACTIVE
            </div>

            {user ? (
              <div className="flex items-center gap-2">
                <NotificationBell />
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  aria-expanded={showHistory}
                  aria-label="Toggle analysis history"
                  className="flex items-center gap-2 px-3 py-2 bg-white border border-border/10 hover:border-border/30 hover:bg-gray-50 transition-all shadow-sm rounded-lg relative group"
                >
                  <History className="w-4 h-4 text-muted group-hover:text-foreground transition-colors" />
                  <span className="text-[10px] font-mono uppercase font-bold hidden sm:inline">History ({analysis.history.length})</span>
                </button>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-3 py-2 bg-white border border-border/10 hover:border-border/30 hover:bg-gray-50 transition-all shadow-sm rounded-lg group"
                  title="Your Pipeline"
                >
                  <LayoutDashboard className="w-4 h-4 text-muted group-hover:text-foreground transition-colors" />
                  <span className="text-[10px] font-mono uppercase font-bold hidden sm:inline">Pipeline</span>
                </Link>
                <div className="flex items-center gap-2 bg-white border border-border/10 px-3 py-2 shadow-sm rounded-lg">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <UserIcon className="w-3 h-3" />
                  </div>
                  <span className="text-[10px] font-mono uppercase font-bold hidden sm:inline">{user.displayName?.split(' ')[0]}</span>
                  <button onClick={logout} aria-label="Sign out" className="ml-1 text-muted hover:text-red-500 transition-colors">
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem('onboardingComplete');
                    localStorage.removeItem('userPreferences');
                    window.location.reload();
                  }}
                  className="text-xs text-gray-400 hover:text-black transition-colors hidden sm:block"
                >
                  Reset preferences
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  aria-expanded={showHistory}
                  aria-label="Toggle analysis history"
                  className="p-2.5 bg-white border border-border/10 hover:bg-gray-50 rounded-lg transition-all shadow-sm"
                >
                  <History className="w-5 h-5 text-muted" />
                </button>
                <div className="flex flex-col items-end gap-1">
                  <button
                    onClick={login}
                    className="flex items-center gap-2 bg-foreground text-background px-5 py-2.5 text-[10px] font-mono uppercase tracking-widest hover:bg-foreground/90 transition-all shadow-lg shadow-foreground/10 rounded-lg"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    Login to Save
                  </button>
                  {loginError && (
                    <p className="text-[10px] font-mono text-red-500">{loginError}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* History Panel */}
        <AnimatePresence>
          {showHistory && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowHistory(false)}
                className="fixed inset-0 bg-[#141414]/40 backdrop-blur-sm z-50"
              />

              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed right-0 top-0 bottom-0 w-full md:w-96 bg-background border-l border-border/10 z-50 flex flex-col shadow-2xl"
              >
                <div className="p-6 border-b border-border/10 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                      <History className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-mono uppercase font-bold tracking-widest">Intelligence History</h3>
                  </div>
                  <button
                    onClick={() => setShowHistory(false)}
                    aria-label="Close history panel"
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-grow overflow-y-auto p-6 space-y-4">
                  {!user ? (
                    <div className="bg-white border border-border/10 p-8 text-center space-y-6 rounded-2xl shadow-sm">
                      <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mx-auto">
                        <LogIn className="w-8 h-8 text-primary" />
                      </div>
                      <div className="space-y-2">
                        <p className="font-serif italic text-xl font-bold">Sign in to save history</p>
                        <p className="text-xs text-muted leading-relaxed">Keep track of your market signals and execution plans across sessions.</p>
                      </div>
                      <button
                        onClick={login}
                        className="w-full flex items-center justify-center gap-2 bg-foreground text-background px-4 py-3.5 text-[10px] font-mono uppercase tracking-widest hover:bg-foreground/90 transition-all rounded-xl shadow-lg shadow-foreground/10"
                      >
                        <Globe className="w-4 h-4" />
                        Sign in with Google
                      </button>
                      {loginError && (
                        <p className="text-[10px] font-mono text-red-500 text-center">{loginError}</p>
                      )}
                    </div>
                  ) : analysis.history.length > 0 ? (
                    analysis.history.map((item) => (
                      <div
                        key={item.id}
                        className="group relative bg-white border border-border/10 p-5 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer rounded-xl"
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
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono uppercase font-bold text-primary bg-primary/5 px-2 py-0.5 rounded">
                              {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Unknown'}
                            </span>
                            {item.marketMode && (
                              <span className="text-xs bg-gray-50 px-2 py-0.5 rounded border border-border/5" title={marketModeConfigs[item.marketMode].label}>
                                {marketModeConfigs[item.marketMode].flag} {marketModeConfigs[item.marketMode].label}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              analysis.deleteAnalysis(item.id);
                            }}
                            aria-label="Delete analysis"
                            className="text-muted hover:text-red-500 transition-colors p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <h4 className="text-sm font-serif italic font-bold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                          {item.trend}
                        </h4>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-20 opacity-30">
                      <History className="w-16 h-16 mx-auto mb-4 opacity-20" />
                      <p className="text-[10px] font-mono uppercase tracking-widest">No intelligence logs found</p>
                    </div>
                  )}
                </div>

                {user && (
                  <div className="p-6 border-t border-border/10 bg-white/80 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {user.displayName?.[0] || 'U'}
                      </div>
                      <div className="flex-grow">
                        <p className="text-xs font-mono uppercase font-bold leading-none mb-1">{user.displayName}</p>
                        <p className="text-[10px] font-mono text-muted truncate">{user.email}</p>
                      </div>
                      <button onClick={logout} aria-label="Sign out" className="p-2.5 hover:bg-red-50 text-muted hover:text-red-500 rounded-xl transition-colors">
                        <LogOut className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* App mode toggle */}
        <div className="flex rounded-xl border border-gray-200 p-1 bg-gray-50 w-fit mx-auto mb-6">
          {(['discover', 'validate'] as AppMode[]).map(mode => (
            <button
              key={mode}
              type="button"
              onClick={() => setAppMode(mode)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                appMode === mode
                  ? 'bg-white text-black shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {mode === 'discover' ? '🔍 Discover' : '💡 Validate'}
            </button>
          ))}
        </div>

        {appMode === 'validate' && (
          <ValidateMode
            selectedMode={selectedMode}
            countryTag={countryTags[0] ?? ''}
          />
        )}

        {appMode === 'discover' && analysis.result && (
          <PipelineProgress currentStep={currentStep} steps={pipelineSteps} />
        )}

        {appMode === 'discover' && <>

        {/* FIX 3: Resume banner */}
        {hasLastResult && !analysis.result && !analysis.loading && (
          <div className="flex items-center gap-3 px-5 py-3 mb-6 bg-blue-50 border border-blue-200 rounded-2xl text-sm">
            <span className="text-blue-700 font-medium flex-1">↩ You have an unsaved analysis from this session</span>
            <button
              onClick={() => {
                try {
                  const saved = sessionStorage.getItem('s2s_lastResult');
                  if (saved) analysis.setResult(JSON.parse(saved));
                } catch {}
                setHasLastResult(false);
              }}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-mono uppercase tracking-wide hover:bg-blue-700 transition-colors"
            >
              View results
            </button>
            <button
              onClick={() => {
                try { sessionStorage.removeItem('s2s_lastResult'); } catch {}
                setHasLastResult(false);
              }}
              className="p-1.5 text-blue-400 hover:text-blue-700 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Share hint — shown once to teach Web Share Target */}
        {!hasSeenShareHint && (
          <div className="mb-4 p-3 bg-blue-50 rounded-xl border border-blue-200 flex items-start gap-3">
            <span className="text-lg flex-shrink-0">💡</span>
            <div className="flex-1">
              <p className="text-xs font-medium text-blue-800 mb-0.5">
                Share any article directly to this app
              </p>
              <p className="text-xs text-blue-600 leading-relaxed">
                On Android, tap Share → Signal to Startup to analyze it instantly.
                On iOS, copy the URL and paste it in the Paste Signal tab.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setHasSeenShareHint(true);
                try { localStorage.setItem('seenShareHint', 'true'); } catch {}
              }}
              className="text-blue-400 hover:text-blue-600 flex-shrink-0 text-lg leading-none"
            >
              ×
            </button>
          </div>
        )}

        <SignalInput
          input={analysis.input}
          setInput={analysis.setInput}
          urlInput={analysis.urlInput}
          setUrlInput={analysis.setUrlInput}
          fetchingUrl={analysis.fetchingUrl}
          fetchUrl={analysis.fetchUrl}
          urlFetchStatus={analysis.urlFetchStatus}
          setUrlFetchStatus={analysis.setUrlFetchStatus}
          location={analysis.location}
          setLocation={analysis.setLocation}
          focus={analysis.focus}
          setFocus={analysis.setFocus}
          loading={analysis.loading}
          loadingStage={analysis.loadingStage}
          loadingProgress={analysis.loadingProgress}
          result={analysis.result}
          analyzeSignal={analysis.analyzeSignal}
          cancelAnalysis={analysis.cancelAnalysis}
          selectedMode={selectedMode}
          setSelectedMode={handleSetSelectedMode}
          countryTags={countryTags}
          setCountryTags={handleSetCountryTags}
        />

        {/* Results Section */}
        <AnimatePresence mode="wait">
          {analysis.error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-8 font-mono text-sm"
            >
              {analysis.error}
            </motion.div>
          )}

          {analysis.result && (
            <>
              {/* FIX 2: Sticky back button */}
              <div className="sticky top-4 z-40 flex justify-start mb-6">
                <button
                  type="button"
                  onClick={handleBackToFeed}
                  className="flex items-center gap-2 min-h-10 px-4 py-2 bg-white border border-border/10 hover:border-border/30 hover:bg-gray-50 rounded-xl shadow-md text-[11px] font-mono uppercase tracking-widest text-muted hover:text-foreground transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Feed
                </button>
              </div>
            </>
          )}
          {analysis.result && (
            <ResultsDashboard
              result={analysis.result}
              filteredOpportunities={analysis.filteredOpportunities}
              filterType={analysis.filterType}
              setFilterType={analysis.setFilterType}
              grantOnly={analysis.grantOnly}
              setGrantOnly={analysis.setGrantOnly}
              generateDeepDive={analysis.generateDeepDive}
              shareOnTwitter={analysis.shareOnTwitter}
              shareOnLinkedIn={analysis.shareOnLinkedIn}
              countryTags={countryTags}
              isAgentResult={isAgentResult}
            />
          )}
        </AnimatePresence>

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
              copyToClipboard={copyToClipboard}
              copied={copied}
              selectedMode={selectedMode}
            />
          )}
        </AnimatePresence>

        {/* FIX 2: Cancel confirm modal */}
        <AnimatePresence>
          {showCancelConfirm && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowCancelConfirm(false)}
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 space-y-5"
              >
                <p className="font-serif italic text-xl font-bold">Analysis almost done</p>
                <p className="text-sm text-muted leading-relaxed">Results are nearly ready. Are you sure you want to cancel?</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCancelConfirm(false)}
                    className="flex-1 py-3 bg-foreground text-background rounded-xl font-mono text-[10px] uppercase tracking-widest hover:bg-foreground/90 transition-all"
                  >
                    Wait for results
                  </button>
                  <button
                    onClick={handleBackToFeed}
                    className="flex-1 py-3 bg-white border border-border/10 text-muted rounded-xl font-mono text-[10px] uppercase tracking-widest hover:text-red-500 hover:border-red-200 transition-all"
                  >
                    Cancel anyway
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Footer Info */}
        {!analysis.result && !analysis.loading && (
          <footer className="mt-24 border-t border-[#141414] pt-8 grid grid-cols-1 md:grid-cols-3 gap-8 opacity-40">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest mb-2">System Status</p>
              <p className="text-xs">All intelligence modules operational. Monitoring global signals 24/7.</p>
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest mb-2">Methodology</p>
              <p className="text-xs">First-principles thinking applied to market inefficiencies and regulatory shifts.</p>
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest mb-2">Disclaimer</p>
              <p className="text-xs">Analysis is for informational purposes. Execution risk is inherent in all ventures.</p>
            </div>
          </footer>
        )}

        </> /* end appMode === 'discover' */}
      </div>
    </div>
  );
}
