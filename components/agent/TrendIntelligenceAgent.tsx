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
  ArrowLeft,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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
import LeftSidebar from '../LeftSidebar';
import RightPanel from '../RightPanel';
import { auth, db, doc, setDoc, getDoc, getDocs, query, where, collection } from '@/firebase';

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
  const [readingLevel] = useState<'simple' | 'standard' | 'advanced'>(() => {
    try { return (localStorage.getItem('s2s_reading_level') as 'simple' | 'standard' | 'advanced') || 'standard'; } catch { return 'standard'; }
  });
  const [watchlistCount, setWatchlistCount] = useState(0);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);

  const toggleSector = useCallback((sector: string) => {
    setSelectedSectors(prev =>
      prev.includes(sector) ? prev.filter(s => s !== sector) : [...prev, sector]
    );
  }, []);

  // Persist country tags
  React.useEffect(() => {
    try { localStorage.setItem('s2s_country_tags', JSON.stringify(countryTags)); } catch {}
  }, [countryTags]);

  // Load watchlist count for sidebar badge
  React.useEffect(() => {
    if (!user) return;
    getDocs(query(
      collection(db, 'signal_watchlist'),
      where('userId', '==', user.uid),
      where('status', '==', 'active')
    )).then(snap => setWatchlistCount(snap.size)).catch(() => {});
  }, [user]);

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

  const analysis = useAgentAnalysis(user, selectedMode, countryTags, readingLevel);

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
        if (showCancelConfirm) { setShowCancelConfirm(false); return; }
        if (analysis.result || analysis.loading) handleBackOrCancel();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [analysis.result, analysis.loading, showCancelConfirm, handleBackOrCancel]);

  // FIX 3: Save result to sessionStorage whenever it changes
  React.useEffect(() => {
    if (analysis.result) {
      try { sessionStorage.setItem('s2s_lastResult', JSON.stringify(analysis.result)); } catch {}
      setHasLastResult(false); // user is viewing it — hide banner
    }
  }, [analysis.result]);

  // Pick up pre-analyzed opportunity from agent (via dashboard "View Opportunity")
  React.useEffect(() => {
    const oppId = sessionStorage.getItem('agentOpportunityId');
    const signalTitle = sessionStorage.getItem('agentSignalTitle');
    if (!oppId) return;
    sessionStorage.removeItem('agentOpportunityId');
    sessionStorage.removeItem('agentSignalTitle');
    const load = async () => {
      try {
        const { doc, getDoc, db } = await import('@/firebase');
        const oppDoc = await getDoc(doc(db, 'agent_opportunities', oppId));
        if (oppDoc.exists()) {
          const data = oppDoc.data();
          analysis.setResult(data.result);
          setIsAgentResult(true);
        } else {
          console.error('[AGENT] Opportunity not found:', oppId);
        }
      } catch (e) {
        console.error('[AGENT] Failed to load opportunity:', e);
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Deep link from digest email: ?opportunity=<opportunityId>
  React.useEffect(() => {
    if (!user) return;

    const params = new URLSearchParams(window.location.search);
    const opportunityId = params.get('opportunity');
    if (!opportunityId) return;

    // Clear the URL param immediately
    const url = new URL(window.location.href);
    url.searchParams.delete('opportunity');
    window.history.replaceState({}, '', url);

    const loadOpportunity = async () => {
      try {
        const oppDoc = await getDoc(doc(db, 'agent_opportunities', opportunityId));
        if (oppDoc.exists()) {
          const data = oppDoc.data();
          analysis.setResult(data.result);
          setIsAgentResult(true);
        }
      } catch (err) {
        console.error('[AGENT] Failed to load opportunity from URL:', err);
      }
    };

    loadOpportunity();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Compound analysis triggered from Watchlist dashboard tab
  React.useEffect(() => {
    if (!user) return;
    const stored = sessionStorage.getItem('compoundArticles');
    if (!stored) return;
    try {
      sessionStorage.removeItem('compoundArticles');
      const articles = JSON.parse(stored);
      if (Array.isArray(articles) && articles.length >= 2) {
        analysis.analyzeCompoundSignal(articles);
      }
    } catch (err) {
      console.error('[AGENT] Compound from watchlist failed:', err);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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
    if (oppName && analysis.result) {
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
    <div className="min-h-screen bg-gray-50 selection:bg-primary/20">

      {/* ── Compact header ── */}
      <header className="sticky top-0 z-50 h-[52px] bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-5">
        <Logo size="sm" showWordmark showSubbrand={false} theme="light" />
        <div className="flex items-center gap-2">
          <NotificationBell />
          <button
            onClick={() => setShowHistory(!showHistory)}
            aria-label="Toggle analysis history"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            History
            <span className="text-gray-400 font-mono text-xs ml-1">({analysis.history.length})</span>
          </button>
          {user ? (
            <button
              onClick={logout}
              title={`${user.email} — click to sign out`}
              className="w-7 h-7 rounded-full bg-gray-900 text-white text-xs font-medium flex items-center justify-center hover:bg-gray-700 transition-colors"
            >
              {(user.email?.[0] ?? user.displayName?.[0] ?? 'U').toUpperCase()}
            </button>
          ) : (
            <div className="flex flex-col items-end">
              <button
                onClick={login}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-700 transition-colors"
              >
                <LogIn className="w-3 h-3" />
                Sign in
              </button>
              {loginError && <p className="text-[10px] font-mono text-red-500">{loginError}</p>}
            </div>
          )}
        </div>
      </header>

      {/* ── History panel (fixed overlay — lives outside grid) ── */}
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
                <button onClick={() => setShowHistory(false)} aria-label="Close history" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
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
                    <button onClick={login} className="w-full flex items-center justify-center gap-2 bg-foreground text-background px-4 py-3.5 text-[10px] font-mono uppercase tracking-widest hover:bg-foreground/90 transition-all rounded-xl shadow-lg shadow-foreground/10">
                      <Globe className="w-4 h-4" />
                      Sign in with Google
                    </button>
                    {loginError && <p className="text-[10px] font-mono text-red-500 text-center">{loginError}</p>}
                  </div>
                ) : analysis.history.length > 0 ? (
                  analysis.history.map((item) => (
                    <div
                      key={item.id}
                      className="group relative bg-white border border-border/10 p-5 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer rounded-xl"
                      onClick={() => {
                        analysis.setResult(item);
                        if (item.marketMode) setSelectedMode(item.marketMode);
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
                        <button onClick={(e) => { e.stopPropagation(); if (item.id) analysis.deleteAnalysis(item.id); }} aria-label="Delete analysis" className="text-muted hover:text-red-500 transition-colors p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <h4 className="text-sm font-serif italic font-bold leading-snug group-hover:text-primary transition-colors line-clamp-2">{item.trend}</h4>
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

      {/* ── 3-column body ── */}
      <div>
        {/* LEFT SIDEBAR — fixed, desktop only */}
        <aside className="hidden md:block" style={{
          position: 'fixed',
          left: 0,
          top: '52px',
          width: '200px',
          height: 'calc(100vh - 52px)',
          background: 'white',
          borderRight: '0.5px solid #e5e7eb',
          overflowY: 'auto',
          zIndex: 40,
          padding: '12px 8px',
        }}>
          <p style={{fontSize:'9px',fontWeight:600,color:'#9ca3af',letterSpacing:'1.5px',textTransform:'uppercase',padding:'4px 8px 8px',margin:0}}>Market</p>
          {([
            {id:'global',flag:'🌎',label:'Global / US'},
            {id:'caribbean',flag:'🌴',label:'Caribbean'},
            {id:'africa',flag:'🌍',label:'Africa'},
            {id:'uk',flag:'🇬🇧',label:'UK'},
            {id:'latam',flag:'🌎',label:'Latin America'},
          ] as {id:string;flag:string;label:string}[]).map(m => (
            <button key={m.id} onClick={() => handleSetSelectedMode(m.id as MarketMode)} style={{width:'100%',display:'flex',alignItems:'center',gap:'8px',padding:'7px 10px',borderRadius:'8px',border:'none',background:selectedMode===m.id?'#111':'transparent',color:selectedMode===m.id?'white':'#374151',fontSize:'12px',fontWeight:500,cursor:'pointer',marginBottom:'2px',textAlign:'left'}}>
              <span style={{fontSize:'13px'}}>{m.flag}</span>{m.label}
            </button>
          ))}
          <div style={{borderTop:'0.5px solid #f3f4f6',margin:'8px 0'}}/>
          <p style={{fontSize:'9px',fontWeight:600,color:'#9ca3af',letterSpacing:'1.5px',textTransform:'uppercase',padding:'4px 8px 8px',margin:0}}>Sectors</p>
          {([
            {id:'ai',icon:'🤖',label:'AI & Tech'},
            {id:'markets',icon:'📈',label:'Markets'},
            {id:'funding',icon:'💰',label:'Funding'},
            {id:'policy',icon:'📋',label:'Policy'},
            {id:'retail',icon:'🛍',label:'Retail'},
            {id:'food',icon:'🍽',label:'Food & Bev'},
            {id:'workforce',icon:'👷',label:'Workforce'},
            {id:'agriculture',icon:'🌾',label:'Agriculture'},
            {id:'tourism',icon:'✈️',label:'Tourism'},
            {id:'remittances',icon:'💸',label:'Remittances'},
            {id:'realestate',icon:'🏠',label:'Real Estate'},
            {id:'health',icon:'🏥',label:'Health'},
          ] as {id:string;icon:string;label:string}[]).map(s => (
            <button key={s.id} onClick={() => toggleSector(s.id)} style={{width:'100%',display:'flex',alignItems:'center',gap:'8px',padding:'6px 10px',borderRadius:'8px',border:'none',background:selectedSectors.includes(s.id)?'#f3f4f6':'transparent',color:selectedSectors.includes(s.id)?'#111':'#6b7280',fontSize:'11px',fontWeight:500,cursor:'pointer',marginBottom:'1px',textAlign:'left'}}>
              <span style={{fontSize:'12px'}}>{s.icon}</span>{s.label}
            </button>
          ))}
          <div style={{borderTop:'0.5px solid #f3f4f6',margin:'8px 0'}}/>
          <p style={{fontSize:'9px',fontWeight:600,color:'#9ca3af',letterSpacing:'1.5px',textTransform:'uppercase',padding:'4px 8px 8px',margin:0}}>Tools</p>
          <button onClick={() => window.location.href='/dashboard'} style={{width:'100%',display:'flex',alignItems:'center',gap:'8px',padding:'7px 10px',borderRadius:'8px',border:'none',background:'transparent',color:'#374151',fontSize:'12px',fontWeight:500,cursor:'pointer',textAlign:'left',marginBottom:'2px'}}>
            <span style={{fontSize:'13px'}}>📊</span>Dashboard
          </button>
          <button onClick={() => window.location.href='/dashboard?tab=watchlist'} style={{width:'100%',display:'flex',alignItems:'center',gap:'8px',padding:'7px 10px',borderRadius:'8px',border:'none',background:'transparent',color:'#374151',fontSize:'12px',fontWeight:500,cursor:'pointer',textAlign:'left'}}>
            <span style={{fontSize:'13px'}}>👓</span>Watchlist
            {watchlistCount > 0 && <span style={{marginLeft:'auto',fontSize:'10px',fontWeight:700,padding:'2px 6px',background:'#fef3c7',color:'#92400e',borderRadius:'999px'}}>{watchlistCount}</span>}
          </button>
        </aside>

        {/* MAIN CONTENT — always visible */}
        <main className="md:ml-[200px] md:mr-[240px]">
          <div className="max-w-4xl mx-auto px-4 md:px-6 py-6">

            {/* App mode toggle */}
            <div className="flex rounded-xl border border-gray-200 p-1 bg-gray-50 w-fit mx-auto mb-6">
              {(['discover', 'validate'] as AppMode[]).map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setAppMode(mode)}
                  className={`px-5 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                    appMode === mode ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {mode === 'discover' ? '🔍 Discover' : '💡 Validate'}
                </button>
              ))}
            </div>

            {appMode === 'validate' && (
              <ValidateMode selectedMode={selectedMode} countryTag={countryTags[0] ?? ''} />
            )}

            {appMode === 'discover' && analysis.result && (
              <PipelineProgress currentStep={currentStep} steps={pipelineSteps} />
            )}

            {appMode === 'discover' && <>

              {/* Resume banner */}
              {hasLastResult && !analysis.result && !analysis.loading && (
                <div className="flex items-center gap-3 px-5 py-3 mb-6 bg-blue-50 border border-blue-200 rounded-2xl text-sm">
                  <span className="text-blue-700 font-medium flex-1">↩ You have an unsaved analysis from this session</span>
                  <button
                    onClick={() => {
                      try { const saved = sessionStorage.getItem('s2s_lastResult'); if (saved) analysis.setResult(JSON.parse(saved)); } catch {}
                      setHasLastResult(false);
                    }}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-mono uppercase tracking-wide hover:bg-blue-700 transition-colors"
                  >
                    View results
                  </button>
                  <button onClick={() => { try { sessionStorage.removeItem('s2s_lastResult'); } catch {} setHasLastResult(false); }} className="p-1.5 text-blue-400 hover:text-blue-700 transition-colors" aria-label="Dismiss">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Share hint */}
              {!hasSeenShareHint && (
                <div className="mb-4 p-3 bg-blue-50 rounded-xl border border-blue-200 flex items-start gap-3">
                  <span className="text-lg flex-shrink-0">💡</span>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-blue-800 mb-0.5">Share any article directly to this app</p>
                    <p className="text-xs text-blue-600 leading-relaxed">On Android, tap Share → Signal to Startup to analyze it instantly. On iOS, copy the URL and paste it in the Paste Signal tab.</p>
                  </div>
                  <button type="button" onClick={() => { setHasSeenShareHint(true); try { localStorage.setItem('seenShareHint', 'true'); } catch {} }} className="text-blue-400 hover:text-blue-600 flex-shrink-0 text-lg leading-none">×</button>
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
                analyzeCompoundSignal={analysis.analyzeCompoundSignal}
                cancelAnalysis={analysis.cancelAnalysis}
                selectedMode={selectedMode}
                setSelectedMode={handleSetSelectedMode}
                countryTags={countryTags}
                setCountryTags={handleSetCountryTags}
                selectedSectors={selectedSectors}
              />

              {/* Results */}
              <AnimatePresence mode="wait">
                {analysis.error && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-8 font-mono text-sm">
                    {analysis.error}
                  </motion.div>
                )}
                {analysis.result && (
                  <>
                    <div className="sticky top-4 z-40 flex justify-start mb-6">
                      <button type="button" onClick={handleBackToFeed} className="flex items-center gap-2 min-h-10 px-4 py-2 bg-white border border-border/10 hover:border-border/30 hover:bg-gray-50 rounded-xl shadow-md text-[11px] font-mono uppercase tracking-widest text-muted hover:text-foreground transition-all">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Feed
                      </button>
                    </div>
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
                      readingLevel={readingLevel}
                    />
                  </>
                )}
              </AnimatePresence>

              {/* Footer */}
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

            </> /* end appMode === discover */}
          </div>
        </main>

        {/* RIGHT PANEL — fixed, desktop only */}
        <aside className="hidden md:block" style={{position:'fixed',right:0,top:'52px',width:'240px',height:'calc(100vh - 52px)',background:'white',borderLeft:'0.5px solid #e5e7eb',overflowY:'auto',zIndex:40,padding:'12px',display:'flex',flexDirection:'column',gap:'12px'}}>
          {analysis.result?.today_action && (
            <div style={{background:'#f0fdf4',border:'0.5px solid #86efac',borderRadius:'12px',padding:'14px'}}>
              <p style={{fontSize:'9px',fontWeight:700,color:'#15803d',letterSpacing:'1.5px',textTransform:'uppercase',marginBottom:'8px',margin:'0 0 8px'}}>Your Next Move</p>
              <p style={{fontSize:'12px',color:'#166534',lineHeight:1.6,marginBottom:'12px',margin:'0 0 12px'}}>{analysis.result.today_action}</p>
              <button style={{width:'100%',padding:'8px',background:'#15803d',color:'white',border:'none',borderRadius:'8px',fontSize:'11px',fontWeight:600,cursor:'pointer'}}>✓ I did this</button>
            </div>
          )}
          <div style={{border:'0.5px solid #e5e7eb',borderRadius:'12px',padding:'14px'}}>
            <p style={{fontSize:'9px',fontWeight:700,color:'#9ca3af',letterSpacing:'1.5px',textTransform:'uppercase',marginBottom:'12px',margin:'0 0 12px'}}>Agent Status</p>
            {[
              {name:'Signal Monitor',time:'7:00 AM UTC'},
              {name:'Opportunity Scout',time:'8:00 AM UTC'},
              {name:'Signal Watcher',time:'8:00 AM UTC'},
              {name:'Daily Digest',time:'9:00 AM UTC'},
            ].map((a,i) => (
              <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 0',borderBottom:i<3?'0.5px solid #f9fafb':'none'}}>
                <div>
                  <p style={{fontSize:'12px',fontWeight:500,color:'#111',margin:0}}>{a.name}</p>
                  <p style={{fontSize:'10px',color:'#9ca3af',margin:'2px 0 0'}}>{a.time}</p>
                </div>
                <div style={{width:'7px',height:'7px',borderRadius:'50%',background:'#22c55e',flexShrink:0}}/>
              </div>
            ))}
          </div>
          {!analysis.result?.today_action && (
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center',padding:'32px 16px',flex:1}}>
              <p style={{fontSize:'24px',marginBottom:'8px'}}>⚡</p>
              <p style={{fontSize:'12px',fontWeight:500,color:'#374151',marginBottom:'4px'}}>Run an analysis</p>
              <p style={{fontSize:'11px',color:'#9ca3af',lineHeight:1.5}}>Your next move and agent status will appear here</p>
            </div>
          )}
        </aside>
      </div>

      {/* ── Modals (fixed — outside grid, visible on all screen sizes) ── */}
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

      <AnimatePresence>
        {showCancelConfirm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCancelConfirm(false)} className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.15 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 space-y-5">
              <p className="font-serif italic text-xl font-bold">Analysis almost done</p>
              <p className="text-sm text-muted leading-relaxed">Results are nearly ready. Are you sure you want to cancel?</p>
              <div className="flex gap-3">
                <button onClick={() => setShowCancelConfirm(false)} className="flex-1 py-3 bg-foreground text-background rounded-xl font-mono text-[10px] uppercase tracking-widest hover:bg-foreground/90 transition-all">Wait for results</button>
                <button onClick={handleBackToFeed} className="flex-1 py-3 bg-white border border-border/10 text-muted rounded-xl font-mono text-[10px] uppercase tracking-widest hover:text-red-500 hover:border-red-200 transition-all">Cancel anyway</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
