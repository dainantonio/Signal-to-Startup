'use client';

import React, { useState } from 'react';
import {
  Globe,
  TrendingUp,
  History,
  LogIn,
  LogOut,
  X,
  User as UserIcon,
  Trash2,
  LayoutDashboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { MarketMode } from '../types';
import { SignalInput } from '../SignalInput';
import { marketModeConfigs } from '../MarketModeSelector';
import { ResultsDashboard } from '../ResultsDashboard';
import { DeepDiveModal } from '../DeepDiveModal';
import { Onboarding } from '../Onboarding';
import { PipelineProgress } from '../PipelineProgress';
import { Search, BarChart3, Target, Rocket } from 'lucide-react';
import { useAgentAuth } from './useAgentAuth';
import { useAgentAnalysis } from './useAgentAnalysis';

export default function TrendIntelligenceAgent() {
  const { user, login, logout } = useAgentAuth();

  const [showHistory, setShowHistory] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try { return !localStorage.getItem('s2s_onboarded'); } catch { return true; }
  });
  const [selectedMode, setSelectedMode] = useState<MarketMode>('global');

  const analysis = useAgentAnalysis(user, selectedMode);

  const pipelineSteps = [
    { id: 1, label: 'Ingestion', icon: Search },
    { id: 2, label: 'Analysis', icon: BarChart3 },
    { id: 3, label: 'Matrix', icon: Target },
    { id: 4, label: 'Execution', icon: Rocket },
  ];

  const exampleSignals = [
    {
      label: 'Rural Policy',
      text: 'New federal initiative announced to subsidize high-speed satellite internet for rural farming communities in the Midwest. $500M allocated for infrastructure and local tech support training.',
      location: 'Midwest, USA',
      focus: 'Tech Support'
    },
    {
      label: 'Green Energy',
      text: 'City council passes mandate requiring all commercial buildings over 10,000 sq ft to install EV charging stations by 2027. Rebates available for early adopters who install before 2025.',
      location: 'California',
      focus: 'Installation'
    },
    {
      label: 'Micro-Logistics',
      text: "Major e-commerce platform opening 50 new 'last-mile' micro-fulfillment centers in dense urban areas. Seeking local partners for bicycle and electric scooter delivery fleets.",
      location: 'London, UK',
      focus: 'Delivery'
    }
  ];

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  // Sync selected opportunity with URL for shareability
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oppName = params.get('opp');
    if (oppName && analysis.result && !analysis.selectedOpportunity) {
      const opp = analysis.result.opportunities.find(o => o.name === oppName);
      if (opp) {
        analysis.generateDeepDive(opp);
      }
    }
  }, [analysis.result, analysis.generateDeepDive, analysis.selectedOpportunity]);

  React.useEffect(() => {
    const url = new URL(window.location.href);
    if (analysis.selectedOpportunity) {
      url.searchParams.set('opp', analysis.selectedOpportunity.name);
    } else {
      url.searchParams.delete('opp');
    }
    window.history.replaceState({}, '', url);
  }, [analysis.selectedOpportunity]);

  // Scroll listener for pipeline progress
  React.useEffect(() => {
    const handleScroll = () => {
      const steps = [1, 2, 3, 4];
      for (const step of steps.reverse()) {
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

  return (
    <div className="min-h-screen-safe bg-background text-foreground p-4 md:p-8 font-sans selection:bg-primary/20">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-8 md:mb-12 border-b border-border/10 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tighter uppercase italic font-serif">
                Signal to Startup
              </h1>
            </div>
            <p className="text-xs md:text-sm uppercase tracking-widest text-muted font-medium max-w-xl leading-relaxed">
              Turn news, policy, and market signals into actionable, low-cost business opportunities.
            </p>
          </div>
          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono bg-secondary/10 text-secondary px-3 py-1.5 rounded-full border border-secondary/20">
              <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-pulse" />
              LIVE FEED ACTIVE
            </div>

            {user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex items-center gap-2 px-3 py-2 bg-white border border-border/10 hover:border-border/30 hover:bg-gray-50 transition-all shadow-sm rounded-lg relative group"
                  title="History"
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
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="p-2.5 bg-white border border-border/10 hover:bg-gray-50 rounded-lg transition-all shadow-sm"
                  title="History"
                >
                  <History className="w-5 h-5 text-muted" />
                </button>
                <button
                  onClick={login}
                  className="flex items-center gap-2 bg-foreground text-background px-5 py-2.5 text-[10px] font-mono uppercase tracking-widest hover:bg-foreground/90 transition-all shadow-lg shadow-foreground/10 rounded-lg"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Login to Save
                </button>
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

        {analysis.result && (
          <PipelineProgress currentStep={currentStep} steps={pipelineSteps} />
        )}

        <SignalInput
          input={analysis.input}
          setInput={analysis.setInput}
          urlInput={analysis.urlInput}
          setUrlInput={analysis.setUrlInput}
          fetchingUrl={analysis.fetchingUrl}
          fetchUrl={analysis.fetchUrl}
          location={analysis.location}
          setLocation={analysis.setLocation}
          focus={analysis.focus}
          setFocus={analysis.setFocus}
          loading={analysis.loading}
          analyzeSignal={analysis.analyzeSignal}
          exampleSignals={exampleSignals}
          selectedMode={selectedMode}
          setSelectedMode={setSelectedMode}
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

          {!analysis.result && !analysis.loading && !analysis.error && showOnboarding && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <Onboarding onDismiss={() => setShowOnboarding(false)} />
            </motion.div>
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
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {analysis.selectedOpportunity && (
            <DeepDiveModal
              selectedOpportunity={analysis.selectedOpportunity}
              setSelectedOpportunity={analysis.setSelectedOpportunity}
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
      </div>
    </div>
  );
}
