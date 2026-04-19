'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, MapPin, Zap, TrendingUp, Loader2, X, RefreshCw, Sparkles, FileUp, CheckCircle2, AlertCircle } from 'lucide-react';
import { MarketMode, FeedSignal, SectorKey, RecencyFilter, FeedFilters, SECTOR_CONFIGS } from './types';
import { LOADING_STAGE_LABELS } from './agent/useAgentAnalysis';
import { MarketModeSelector } from './MarketModeSelector';
import { COUNTRY_CONTEXT } from '@/lib/rss-sources';
import { auth, db, collection, addDoc } from '@/firebase';
import WatchButton from './WatchButton';

const capitalize = (s: string) => s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

const ALL_SECTORS: SectorKey[] = ['ai', 'policy', 'markets', 'funding', 'sustainability', 'realestate', 'health'];

const CARD_STAGES = [
  { progress: 15, label: 'Fetching article...', delay: 300 },
  { progress: 35, label: 'Reading signal...', delay: 1500 },
  { progress: 60, label: 'Finding opportunities...', delay: 3000 },
  { progress: 80, label: 'Scoring ideas...', delay: 5500 },
  { progress: 90, label: 'Almost done...', delay: 7500 },
];

interface SignalInputProps {
  input: string;
  setInput: (val: string) => void;
  urlInput: string;
  setUrlInput: (val: string) => void;
  fetchingUrl: boolean;
  fetchUrl: () => void;
  urlFetchStatus?: 'idle' | 'success' | 'error' | 'paywalled' | 'timeout';
  setUrlFetchStatus?: (s: 'idle' | 'success' | 'error' | 'paywalled' | 'timeout') => void;
  location: string;
  setLocation: (val: string) => void;
  focus: string;
  setFocus: (val: string) => void;
  loading: boolean;
  loadingStage?: number;
  loadingProgress?: number;
  result: unknown | null;
  analyzeSignal: (overrideInput?: string) => void;
  analyzeCompoundSignal: (articles: FeedSignal[]) => void;
  cancelAnalysis: () => void;
  selectedMode: MarketMode;
  setSelectedMode: (mode: MarketMode) => void;
  countryTags: string[];
  setCountryTags: (tags: string[]) => void;
  selectedSectors?: string[];
  user?: { uid: string; email?: string | null; displayName?: string | null } | null;
  login?: () => void;
}

export const SignalInput: React.FC<SignalInputProps> = ({
  input, setInput, urlInput, setUrlInput, fetchingUrl, fetchUrl,
  urlFetchStatus = 'idle', setUrlFetchStatus,
  location, setLocation, focus, setFocus, loading, loadingStage = 0, loadingProgress = 5,
  result, analyzeSignal, analyzeCompoundSignal, cancelAnalysis,
  countryTags, setCountryTags,
  selectedMode, setSelectedMode,
  selectedSectors = [],
  user,
  login,
}) => {
  const [inputMode, setInputMode] = useState<'paste' | 'feed' | 'reddit'>('paste');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfStatus, setPdfStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Card pop-out states
  const [analyzingUrl, setAnalyzingUrl] = useState<string | null>(null);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [analyzeStage, setAnalyzeStage] = useState('');
  const [successUrl, setSuccessUrl] = useState<string | null>(null);
  const prevLoadingRef = useRef(false);

  const uploadPdf = async (file: File) => {
    setPdfLoading(true);
    setPdfStatus(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/parse-pdf', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) {
        setPdfStatus({ type: 'error', message: data.error || 'Could not read PDF.' });
        return;
      }
      setInput(data.content);
      setPdfStatus({ type: 'success', message: 'PDF text extracted — ready to analyze' });
    } catch {
      setPdfStatus({ type: 'error', message: 'Failed to upload PDF. Please try again.' });
    } finally {
      setPdfLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Scroll textarea into view after successful URL fetch
  useEffect(() => {
    if (urlFetchStatus === 'success' && textareaRef.current) {
      setTimeout(() => textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
    }
  }, [urlFetchStatus]);

  const [signals, setSignals] = useState<FeedSignal[]>([]);
  const [redditSignals, setRedditSignals] = useState<FeedSignal[]>([]);
  const [feedMeta, setFeedMeta] = useState<{ total: number; duplicatesRemoved: number } | null>(null);
  const [fetchingFeed, setFetchingFeed] = useState(false);
  const [fetchingReddit, setFetchingReddit] = useState(false);
  const [articleNotice, setArticleNotice] = useState<string | null>(null);
  const [countryInput, setCountryInput] = useState('');
  const [showCountry, setShowCountry] = useState(false);
  const [lastFetchKey, setLastFetchKey] = useState('');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedArticles, setSelectedArticles] = useState<FeedSignal[]>([]);

  // Watchlist state
  const [watching, setWatching] = useState<string | null>(null);
  const [showWatchMenu, setShowWatchMenu] = useState<string | null>(null);

  // Close watch menu on outside click
  useEffect(() => {
    if (!showWatchMenu) return;
    const handleClickOutside = () => setShowWatchMenu(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showWatchMenu]);

  const addToWatchlist = async (article: FeedSignal, days: number) => {
    if (!auth.currentUser) {
      alert('Sign in to use watchlist');
      return;
    }
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + days);
      await addDoc(collection(db, 'signal_watchlist'), {
        userId: auth.currentUser.uid,
        seedSignal: {
          title: article.title,
          snippet: article.snippet || '',
          url: article.url,
          source: article.source,
          sector: article.sector,
          signalScore: article.signalScore || 50,
        },
        watchDays: days,
        expiresAt: expiresAt.toISOString(),
        createdAt: new Date().toISOString(),
        status: 'active',
        matchedSignals: [],
        convergenceScore: 0,
      });
      setWatching(article.url);
      setShowWatchMenu(null);
      setTimeout(() => setWatching(null), 3000);
    } catch (err) {
      console.error('Watch failed:', err);
    }
  };
  const [filters, setFilters] = useState<FeedFilters>(() => {
    try {
      const saved = localStorage.getItem('userPreferences');
      if (saved) {
        const prefs = JSON.parse(saved);
        if (prefs.sectors?.length) return { sectors: prefs.sectors, recency: '3d' };
      }
    } catch {}
    return { sectors: ALL_SECTORS, recency: '3d' };
  });

  const fetchKey = `${selectedMode}|${filters.sectors.join(',')}|${filters.recency}|${focus}|${countryTags.join(',')}`;

  const selectCountry = (raw: string) => {
    const tag = capitalize(raw.trim());
    if (!tag) return;
    setCountryTags([tag]);
    setCountryInput('');
    setShowCountry(false);
  };

  const countrySuggestions = countryInput.trim().length > 0
    ? Object.keys(COUNTRY_CONTEXT)
        .filter(k => k.includes(countryInput.toLowerCase()))
        .slice(0, 5)
    : [];

  const fetchFeed = useCallback(async (force = false) => {
    if (!force && fetchKey === lastFetchKey && signals.length > 0) return;
    setFetchingFeed(true);
    try {
      const params = new URLSearchParams({
        sectors: filters.sectors.join(','),
        region: selectedMode,
        niche: focus.trim(),
        recency: filters.recency,
        countryTags: countryTags.join(','),
      });
      const res = await fetch(`/api/live-feed?${params.toString()}`);
      if (!res.ok) throw new Error('Feed fetch failed');
      const data = await res.json();
      // Support both old array format and new { items, meta } format
      const raw: FeedSignal[] = Array.isArray(data) ? data : (data.items ?? []);
      const meta = Array.isArray(data) ? null : (data.meta ?? null);
      setSignals(raw);
      setFeedMeta(meta);
      setLastFetchKey(fetchKey);
    } catch (err) {
      console.error('Feed error:', err);
    } finally {
      setFetchingFeed(false);
    }
  }, [fetchKey, lastFetchKey, signals.length, filters, selectedMode, focus, countryTags]);

  useEffect(() => {
    if (inputMode === 'feed') fetchFeed();
  }, [inputMode, fetchKey]);

  const fetchRedditSignals = useCallback(async () => {
    setFetchingReddit(true);
    try {
      const res = await fetch(`/api/reddit-signals?market=${selectedMode}`);
      if (!res.ok) throw new Error('Reddit signal fetch failed');
      const data = await res.json();
      setRedditSignals(Array.isArray(data.signals) ? data.signals : []);
    } catch (err) {
      console.error('Reddit fetch failed:', err);
      setRedditSignals([]);
    } finally {
      setFetchingReddit(false);
    }
  }, [selectedMode]);

  useEffect(() => {
    if (inputMode === 'reddit') fetchRedditSignals();
  }, [inputMode, fetchRedditSignals]);

  // Progress animation for selected card
  useEffect(() => {
    if (!analyzingUrl) return;
    setAnalyzeProgress(0);
    setAnalyzeStage('Fetching article...');
    const timers = CARD_STAGES.map(({ progress, label, delay }) =>
      setTimeout(() => {
        setAnalyzeProgress(progress);
        setAnalyzeStage(label);
      }, delay)
    );
    return () => timers.forEach(clearTimeout);
  }, [analyzingUrl]);

  // Detect when analysis completes (loading true→false) → success flash then clear
  useEffect(() => {
    if (prevLoadingRef.current && !loading && analyzingUrl !== null) {
      setAnalyzeProgress(100);
      setSuccessUrl(analyzingUrl);
      const timer = setTimeout(() => {
        setAnalyzingUrl(null);
        setAnalyzeProgress(0);
        setAnalyzeStage('');
        setSuccessUrl(null);
      }, 600);
      return () => clearTimeout(timer);
    }
    prevLoadingRef.current = loading;
  }, [loading, analyzingUrl]);

  // Handle cache-hit: result set without loading ever becoming true
  const prevResultRef = useRef<typeof result>(result);
  useEffect(() => {
    if (prevResultRef.current !== result && result !== null && !loading && analyzingUrl !== null) {
      setSuccessUrl(analyzingUrl);
      const timer = setTimeout(() => {
        setAnalyzingUrl(null);
        setAnalyzeProgress(0);
        setAnalyzeStage('');
        setSuccessUrl(null);
      }, 600);
      prevResultRef.current = result;
      return () => clearTimeout(timer);
    }
    prevResultRef.current = result;
  }, [result, loading, analyzingUrl]);

  const timeAgo = (d: string) => {
    const h = Math.floor((Date.now() - new Date(d).getTime()) / 3600000);
    return h < 1 ? 'Just now' : h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
  };

  const onAnalyzeSignal = async (sig: FeedSignal) => {
    const key = sig.url ?? sig.title;
    if (analyzingUrl && analyzingUrl !== key) cancelAnalysis();
    setAnalyzingUrl(key);
    setAnalyzeProgress(0);
    setAnalyzeStage('Fetching article...');
    setArticleNotice(null);

    let text = '';
    if (sig.url && sig.url !== '#') {
      try {
        const res = await fetch(
          `/api/fetch-url?url=${encodeURIComponent(sig.url)}`,
          { signal: AbortSignal.timeout(9000) }
        );
        if (res.ok) {
          const data = await res.json();
          if (data.paywalled) {
            setArticleNotice('Paywalled — analyzing available summary');
          } else if (data.timedOut) {
            setArticleNotice('Slow load — using article summary');
          } else if (data.content && data.content.trim().length > 100) {
            text = data.content;
          } else {
            // Server responded but content too short — use snippet
            setArticleNotice('Analyzing available summary');
          }
        }
      } catch {
        // Network error or timeout — fall through to snippet
      }
    }

    // Final safety: always have something to analyze
    if (!text.trim()) {
      text = [sig.title, sig.snippet].filter(Boolean).join('\n\n');
      if (!articleNotice) setArticleNotice('Analyzing available summary');
    }

    // Last resort — should never happen given title always exists
    if (text.trim().length < 50) {
      text = sig.title;
    }

    analyzeSignal(text);
  };

  const handleCardCancel = () => {
    cancelAnalysis();
    setAnalyzingUrl(null);
    setAnalyzeProgress(0);
    setAnalyzeStage('');
    setSuccessUrl(null);
  };

  const toggleSector = (key: SectorKey) => {
    setFilters(prev => {
      const has = prev.sectors.includes(key);
      if (has && prev.sectors.length === 1) return prev;
      return { ...prev, sectors: has ? prev.sectors.filter(s => s !== key) : [...prev.sectors, key] };
    });
  };

  const SignalScoreBadge = ({ score, publishedAt }: { score?: number; publishedAt: string }) => {
    const time = timeAgo(publishedAt);
    if (!score || score < 40) {
      return <span className="text-[9px] font-mono text-muted">{time}</span>;
    }
    const cls = score >= 80
      ? 'bg-green-100 text-green-800 border border-green-200'
      : score >= 60
      ? 'bg-amber-100 text-amber-800 border border-amber-200'
      : 'bg-gray-100 text-gray-600 border border-gray-200';
    const icon = score >= 80 ? '🔥' : score >= 60 ? '⚡' : '';
    return (
      <span
        className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold tabular-nums ${cls}`}
        title="Signal strength — how likely this article contains a strong business opportunity"
      >
        {icon}{score}
      </span>
    );
  };

  return (
    <section id="step-1" className="scroll-mt-24 mb-12">
      {/* Feed header + tab bar */}
      <div style={{background:'white',borderBottom:'1px solid #e8e8e4',padding:'20px 24px 0'}}>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'20px'}}>
          <div>
            <h2 style={{fontSize:'18px',fontWeight:700,color:'#0a0a0a',letterSpacing:'-0.3px',marginBottom:'4px'}}>
              Market intelligence feed
            </h2>
            <p style={{fontSize:'12px',color:'#777',lineHeight:1.5}}>
              Signals scored by opportunity strength. Click any card to analyze.
            </p>
          </div>
          <div style={{display:'flex',gap:'24px',flexShrink:0}}>
            {[
              {num:'50',label:'Live signals'},
              {num:'87',label:'Top score today'},
              {num:'3',label:'Agents active'},
            ].map((s,i) => (
              <div key={i} style={{textAlign:'right'}}>
                <div style={{fontSize:'20px',fontWeight:700,color:'#0a0a0a',fontVariantNumeric:'tabular-nums',letterSpacing:'-0.5px'}}>{s.num}</div>
                <div style={{fontSize:'9px',color:'#bbb',letterSpacing:'1px',textTransform:'uppercase',marginTop:'2px'}}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{display:'flex',borderBottom:'1px solid #e8e8e4',marginBottom:'0',background:'white'}}>
          {[
            {mode:'feed',label:'News Feed',dot:'#22c55e'},
            {mode:'paste',label:'Paste / URL',dot:null},
            {mode:'reddit',label:'Reddit',dot:'#f97316'},
          ].map(tab => (
            <button
              key={tab.mode}
              type="button"
              onClick={() => setInputMode(tab.mode as 'feed'|'paste'|'reddit')}
              style={{
                padding:'12px 20px',fontSize:'12px',
                fontWeight: inputMode===tab.mode ? 600 : 500,
                color: inputMode===tab.mode ? '#0a0a0a' : '#999',
                border:'none',background:'transparent',cursor:'pointer',
                display:'flex',alignItems:'center',gap:'7px',
                borderBottom: inputMode===tab.mode ? '2px solid #0a0a0a' : '2px solid transparent',
                marginBottom:'-1px',
              }}>
              {tab.dot && (
                <span style={{width:'6px',height:'6px',borderRadius:'50%',background:inputMode===tab.mode ? tab.dot : '#ddd',flexShrink:0}}/>
              )}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {inputMode === 'paste' ? (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono uppercase tracking-widest text-muted font-bold">Paste an article URL</label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative group">
                <input
                  type="text"
                  value={urlInput}
                  onChange={e => { setUrlInput(e.target.value); if (setUrlFetchStatus) setUrlFetchStatus('idle'); }}
                  onKeyDown={e => { if (e.key === 'Enter' && urlInput.trim()) fetchUrl(); }}
                  placeholder="https://techcrunch.com/..."
                  className="w-full bg-white border border-border/10 rounded-xl p-4 pl-11 pr-10 focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none font-sans text-sm transition-all shadow-sm"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
                {urlInput && <button type="button" onClick={() => { setUrlInput(''); if (setUrlFetchStatus) setUrlFetchStatus('idle'); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"><X className="w-4 h-4" /></button>}
              </div>
              <button onClick={fetchUrl} disabled={fetchingUrl || !urlInput.trim()}
                className="bg-foreground text-background px-8 py-4 rounded-xl font-mono text-[11px] uppercase tracking-widest hover:bg-foreground/90 disabled:opacity-40 transition-all shadow-lg shadow-foreground/5 flex-shrink-0 flex items-center justify-center gap-2">
                {fetchingUrl ? <><Loader2 className="w-4 h-4 animate-spin" /> Fetching...</> : 'Fetch Article'}
              </button>
            </div>
            {/* URL fetch status */}
            {urlFetchStatus === 'success' && (
              <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                Article loaded — {input.length.toLocaleString()} characters — ready to analyze
              </div>
            )}
            {(urlFetchStatus === 'error' || urlFetchStatus === 'timeout') && (
              <div className="flex items-center gap-2 text-[11px] font-mono text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                Could not fetch this article — paste the text manually instead
              </div>
            )}
            {urlFetchStatus === 'paywalled' && (
              <div className="flex items-center gap-2 text-[11px] font-mono text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                This article is behind a paywall — paste the visible text manually
              </div>
            )}
            {/* PDF file upload */}
            <div className="flex items-center gap-3 flex-wrap">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) uploadPdf(f); }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={pdfLoading}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-border/10 rounded-xl text-[10px] font-mono uppercase tracking-widest font-bold text-muted hover:text-foreground hover:border-border/30 hover:bg-gray-50 disabled:opacity-40 transition-all shadow-sm"
              >
                {pdfLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileUp className="w-3.5 h-3.5" />}
                {pdfLoading ? 'Reading PDF...' : 'Upload PDF File'}
              </button>
              {pdfStatus && (
                <span className={`flex items-center gap-1.5 text-[10px] font-mono ${pdfStatus.type === 'success' ? 'text-secondary' : 'text-red-600'}`}>
                  {pdfStatus.type === 'success'
                    ? <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                    : <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />}
                  {pdfStatus.message}
                </span>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono uppercase tracking-widest text-muted font-bold">Or paste signal directly</label>
            <div className="relative group">
              <textarea ref={textareaRef} value={input} onChange={e => setInput(e.target.value)} placeholder="Paste a news article, policy update, or market signal here..."
                className="w-full h-48 md:h-64 bg-white border border-border/10 rounded-2xl p-6 focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none resize-none font-sans text-base leading-relaxed transition-all shadow-sm" />
              <div className="absolute bottom-4 right-4 text-primary/20 group-focus-within:text-primary/40 transition-colors"><Sparkles className="w-6 h-6" /></div>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[11px] font-mono text-muted">
                  <Loader2 className="w-4 h-4 animate-spin text-primary flex-shrink-0" />
                  <span className="transition-all duration-300">{LOADING_STAGE_LABELS[loadingStage] ?? LOADING_STAGE_LABELS[0]}</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); cancelAnalysis(); }}
                  aria-label="Cancel analysis"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-border/10 rounded-xl text-muted hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all text-[10px] font-mono uppercase tracking-wider shadow-sm flex-shrink-0"
                >
                  <X className="w-3 h-3" />
                  Cancel
                </button>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] font-mono text-muted/50 uppercase tracking-wider">
                <span>Reading</span>
                <span>Opportunities</span>
                <span>Scoring</span>
                <span>Done</span>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => analyzeSignal()}
              disabled={!input.trim()}
              className="w-full bg-primary text-white py-5 rounded-2xl font-mono text-sm uppercase tracking-widest hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 shadow-xl shadow-primary/20 active:scale-[0.98]"
            >
              <TrendingUp className="w-5 h-5" />
              Extract Opportunities
            </button>
          )}

          <details className="group rounded-2xl border border-border/10 bg-white">
            <summary className="cursor-pointer list-none px-4 py-3 text-[10px] font-mono uppercase tracking-widest font-bold text-muted flex items-center justify-between">
              Optional targeting filters
              <span className="text-xs transition-transform group-open:rotate-180">⌄</span>
            </summary>
            <div className="px-4 pb-4 space-y-4 border-t border-border/10">
              <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-muted font-bold">Location</label>
                  <div className="relative group">
                    <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Kingston, New York"
                      className="w-full bg-white border border-border/10 rounded-xl p-4 pl-11 focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none font-sans text-sm transition-all shadow-sm" />
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-muted font-bold">Niche / Focus</label>
                  <div className="relative group">
                    <input type="text" value={focus} onChange={e => setFocus(e.target.value)} placeholder="e.g. Vending, SaaS, Courier"
                      className="w-full bg-white border border-border/10 rounded-xl p-4 pl-11 focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none font-sans text-sm transition-all shadow-sm" />
                    <Zap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
                  </div>
                </div>
              </div>
              <MarketModeSelector selectedMode={selectedMode} onModeChange={setSelectedMode} />

              <div className="relative flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={countryInput}
                    onChange={e => { setCountryInput(e.target.value); setShowCountry(true); }}
                    onFocus={() => setShowCountry(true)}
                    onBlur={() => setTimeout(() => setShowCountry(false), 150)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') { e.preventDefault(); selectCountry(countrySuggestions[0] ?? countryInput); }
                      if (e.key === 'Escape') { setShowCountry(false); setCountryInput(''); }
                    }}
                    placeholder="Search by country or city... (e.g. Jamaica, Lagos, London)"
                    className="w-full bg-white border border-border/10 rounded-xl py-3 px-4 pl-10 focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none font-sans text-sm transition-all shadow-sm"
                  />
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
                  {showCountry && countrySuggestions.length > 0 && (
                    <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-border/10 rounded-xl shadow-xl overflow-hidden">
                      {countrySuggestions.map(key => {
                        const ctx = COUNTRY_CONTEXT[key];
                        return (
                          <button key={key} type="button" onMouseDown={() => selectCountry(key)}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 text-left transition-colors">
                            <span>{ctx.flag}</span>
                            <span className="font-medium">{capitalize(key)}</span>
                            <span className="text-[10px] font-mono text-muted ml-auto">{ctx.currency}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                {countryTags[0] && (() => {
                  const tag = countryTags[0];
                  const ctx = COUNTRY_CONTEXT[tag.toLowerCase()];
                  return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-primary/10 border border-primary/20 text-primary rounded-full text-[10px] font-mono font-bold flex-shrink-0 whitespace-nowrap">
                      {ctx?.flag ?? '🌍'} {tag}
                      <button type="button" onClick={() => setCountryTags([])} aria-label={`Remove ${tag}`} className="ml-0.5 hover:text-red-500 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })()}
              </div>
            </div>
          </details>
        </div>
      ) : inputMode === 'feed' ? (
        <div className="space-y-4">
          {/* Welcome banner — non-signed-in users only */}
          {!user && (
            <div className="mb-6 p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-2 leading-tight">
                Find your next business from today&apos;s news.
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed mb-4">
                We scan hundreds of signals daily and surface the ones worth building from — with a full plan, real costs, and funding sources for your market.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={login}
                  className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-700 transition-colors">
                  Sign in to analyze
                </button>
              </div>
            </div>
          )}

          {/* Slim filter bar */}
          {inputMode === 'feed' ? (() => {
            const countryTag = countryTags[0] ?? '';
            const hasActiveFilters =
              countryTags.length > 0 ||
              filters.sectors.length < ALL_SECTORS.length ||
              filters.recency !== '3d';
            return (
              <div className="flex items-center justify-between px-1 py-1">
                {/* Active filter summary */}
                <div className="flex items-center gap-2">
                  {countryTag && (
                    <span className="flex items-center gap-1 text-xs text-gray-600 font-medium">
                      {COUNTRY_CONTEXT[countryTag.toLowerCase()]?.flag ?? '🌍'} {countryTag}
                    </span>
                  )}
                  {filters.sectors.length < ALL_SECTORS.length && (
                    <span className="text-xs text-gray-500">
                      {filters.sectors.length} sectors
                    </span>
                  )}
                  {!countryTag && filters.sectors.length === ALL_SECTORS.length && (
                    <span className="text-xs text-gray-400">All signals</span>
                  )}
                </div>
                {/* Controls */}
                <div className="flex items-center gap-2">
                  {!fetchingFeed && signals.length > 0 && (
                    <span className="text-xs text-gray-400">{signals.length} signals</span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setMultiSelectMode(!multiSelectMode);
                      setSelectedArticles([]);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      multiSelectMode
                        ? 'bg-black text-white border-black'
                        : 'border-gray-200 text-gray-600 hover:border-black'
                    }`}
                  >
                    {multiSelectMode ? '✕ Cancel' : '⊕ Compare signals'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowFilterDrawer(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:border-gray-400 transition-colors"
                  >
                    ⚙ Filters
                    {hasActiveFilters && (
                      <span className="w-1.5 h-1.5 rounded-full bg-black" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => fetchFeed(true)}
                    disabled={fetchingFeed}
                    aria-label="Refresh feed"
                    className="p-1.5 text-gray-400 hover:text-black transition-colors"
                  >
                    <RefreshCw className={`w-4 h-4 ${fetchingFeed ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
            );
          })() : (
            <div className="flex items-center justify-between px-3 py-2 rounded-2xl border border-orange-100 bg-gradient-to-r from-orange-50/80 to-amber-50/70">
              <span className="text-xs font-medium text-orange-700">Community pain points and startup opportunities</span>
              <button
                type="button"
                onClick={fetchRedditSignals}
                disabled={fetchingReddit}
                aria-label="Refresh Reddit signals"
                className="p-2 rounded-xl border border-orange-200 bg-white text-orange-500 hover:text-orange-700 hover:border-orange-300 transition-all"
              >
                <RefreshCw className={`w-4 h-4 ${fetchingReddit ? 'animate-spin' : ''}`} />
              </button>
            </div>
          )}

          {/* Dedup count banner */}
          {inputMode === 'feed' && feedMeta && !fetchingFeed && (
            <div className="flex items-center gap-2 text-[10px] font-mono text-muted">
              <span className="w-1.5 h-1.5 bg-secondary rounded-full flex-shrink-0" />
              Showing {feedMeta.total} articles
              {feedMeta.duplicatesRemoved > 0 && (
                <span className="text-muted/60">· {feedMeta.duplicatesRemoved} duplicates removed</span>
              )}
            </div>
          )}

          {/* Country tag feed banner */}
          {inputMode === 'feed' && countryTags.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-mono">
              <span className="flex-shrink-0">{countryTags.map(t => COUNTRY_CONTEXT[t.toLowerCase()]?.flag ?? '🌍').join(' ')}</span>
              Showing {countryTags.join(' & ')}-relevant signals from all sources
            </div>
          )}

          {/* Article notice */}
          {articleNotice && (
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-[10px] font-mono ${articleNotice.startsWith('Full article') ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
              <Loader2 className="w-3 h-3 animate-spin flex-shrink-0" />
              {articleNotice}
            </div>
          )}

          {/* Sticky Compound Analysis Bar */}
          {inputMode === 'feed' && multiSelectMode && (
            <div className={`fixed bottom-0 left-0 right-0 z-[60] bg-white border-t border-gray-200 p-4 transition-all duration-300 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] ${
              selectedArticles.length > 0 ? 'translate-y-0' : 'translate-y-full'
            }`}>
              <div className="max-w-3xl mx-auto">
                {/* Selected signal pills */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedArticles.map((article) => (
                    <div key={article.url || article.title}
                      className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 rounded-full text-[10px] font-medium border border-gray-200">
                      <span className="text-gray-700 max-w-32 truncate">
                        {article.title}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedArticles(prev => prev.filter(a => (a.url || a.title) !== (article.url || article.title)));
                        }}
                        className="text-gray-400 hover:text-black ml-1"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                {/* Analyze button */}
                <button
                  type="button"
                  onClick={() => {
                    analyzeCompoundSignal(selectedArticles);
                    setMultiSelectMode(false);
                    setSelectedArticles([]);
                  }}
                  disabled={selectedArticles.length < 2}
                  className="w-full py-3 bg-black text-white rounded-xl text-xs font-bold uppercase tracking-widest disabled:opacity-40 hover:bg-gray-900 transition-colors flex items-center justify-center gap-2"
                >
                  {selectedArticles.length < 2
                    ? `Select ${2 - selectedArticles.length} more signal${selectedArticles.length === 1 ? '' : 's'} to compare`
                    : <>
                        <Sparkles className="w-4 h-4" />
                        Compound analysis — {selectedArticles.length} signals
                      </>
                  }
                </button>
                
                <p className="text-[10px] text-gray-400 text-center mt-2 font-mono uppercase tracking-tight">
                  Select 2-5 signals to find compound opportunities hidden across multiple stories
                </p>
              </div>
            </div>
          )}

          {/* Feed cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" style={{background:'#f8f8f6',padding:'20px 24px'}}>
            {fetchingFeed
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white border border-border/10 rounded-2xl p-5 space-y-3 animate-pulse shadow-sm">
                    <div className="flex gap-2"><div className="h-4 bg-gray-100 w-16 rounded-md" /><div className="h-4 bg-gray-100 w-10 rounded-md" /></div>
                    <div className="h-10 bg-gray-100 rounded-lg" />
                    <div className="h-8 bg-gray-100 rounded-lg" />
                    <div className="h-9 bg-gray-100 rounded-xl" />
                  </div>
                ))
              : (() => {
                  const displaySignals = selectedSectors.length > 0
                    ? signals.filter(s => selectedSectors.includes(s.sector))
                    : signals;
                  if (displaySignals.length === 0) {
                    return <div className="col-span-2 text-center py-16 text-muted font-mono text-xs uppercase tracking-widest">No signals found. Try widening your filters.</div>;
                  }
                  return displaySignals.map((sig, i) => {
                  const cfg = SECTOR_CONFIGS[sig.sector] ?? SECTOR_CONFIGS.markets;
                  const key = sig.url ?? sig.title;
                  const isAnalyzing = analyzingUrl === key;
                  const isSuccess = successUrl === key;
                  const isOtherAnalyzing = !!analyzingUrl && analyzingUrl !== key;

                  const isSelected = selectedArticles.some(a => (a.url || a.title) === (sig.url || sig.title));

                  return (
                    <motion.div
                      key={i}
                      layout
                      animate={{
                        scale: isAnalyzing ? 1.04 : 1,
                        boxShadow: isSuccess
                          ? '0 0 0 2px #22c55e, 0 20px 60px rgba(34,197,94,0.2)'
                          : isAnalyzing
                          ? '0 20px 60px rgba(0,0,0,0.2)'
                          : isSelected
                          ? '0 0 0 2px #000, 0 10px 30px rgba(0,0,0,0.1)'
                          : '0 1px 3px rgba(0,0,0,0.08)',
                      }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className={`relative ${isOtherAnalyzing ? 'pointer-events-none' : ''} ${isAnalyzing ? 'z-10' : ''}`}
                      style={{
                        background:'white',
                        border: isSelected
                          ? '2px solid #0a0a0a'
                          : isAnalyzing
                          ? '2px solid #3b82f6'
                          : '1px solid #e8e8e4',
                        borderRadius:'12px',
                        display:'flex',flexDirection:'column',
                        overflow:'hidden',
                        opacity: isOtherAnalyzing ? 0.4 : 1,
                        cursor: multiSelectMode ? 'pointer' : 'default',
                      }}
                      onClick={() => {
                        if (!multiSelectMode) return;
                        setSelectedArticles(prev => {
                          const alreadySelected = prev.some(a => (a.url || a.title) === (sig.url || sig.title));
                          if (alreadySelected) {
                            return prev.filter(a => (a.url || a.title) !== (sig.url || sig.title));
                          }
                          if (prev.length >= 5) return prev;
                          return [...prev, sig];
                        });
                      }}
                    >
                      {isAnalyzing ? (
                        /* ── ANALYZING STATE ── */
                        <div className="p-5 flex flex-col gap-3 flex-1">
                          {/* Header */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[9px] font-mono font-bold text-muted uppercase tracking-wider truncate max-w-[120px]">{sig.source}</span>
                            <span className={`px-2 py-0.5 text-[9px] font-mono uppercase font-bold rounded-md ${cfg.badgeBg} ${cfg.badgeText}`}>{cfg.label}</span>
                            {sig.isLocalSource && (
                              <span className="px-2 py-0.5 text-[9px] font-mono uppercase font-bold rounded-md bg-green-100 text-green-700">Local</span>
                            )}
                            <button
                              type="button"
                              onClick={handleCardCancel}
                              aria-label="Cancel analysis"
                              className="ml-auto flex items-center gap-1 text-[9px] font-mono text-muted hover:text-red-500 transition-colors flex-shrink-0"
                            >
                              <X className="w-3 h-3" /> Cancel
                            </button>
                          </div>

                          {/* Title — full */}
                          <p className="text-sm font-semibold leading-snug">{sig.title}</p>

                          {/* Snippet */}
                          <p className="text-xs text-muted leading-relaxed line-clamp-3">{sig.snippet}</p>

                          {/* Divider */}
                          <div className="border-t border-border/10" />

                          {/* Stage + percentage */}
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary flex-shrink-0" />
                            <span className="text-[11px] font-mono text-primary font-bold">{analyzeStage}</span>
                            <span className="ml-auto text-[10px] font-mono text-muted tabular-nums">{analyzeProgress}%</span>
                          </div>

                          {/* Inline progress bar */}
                          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <motion.div
                              className="h-full bg-primary"
                              style={{ borderRadius: '0 3px 3px 0' }}
                              animate={{ width: `${analyzeProgress}%` }}
                              transition={{ duration: 0.5, ease: 'easeOut' }}
                            />
                          </div>
                        </div>
                      ) : (
                        /* ── NORMAL STATE ── */
                        <div className="p-4 flex flex-col gap-3 flex-1 min-w-0">
                          {/* Meta row */}
                          <div className="flex items-center gap-2 min-w-0">
                            {multiSelectMode && (
                              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all flex-shrink-0 ${
                                isSelected ? 'bg-black border-black' : 'border-gray-300'
                              }`}>
                                {isSelected && <span className="text-white text-[10px]">✓</span>}
                              </div>
                            )}
                            <span style={{fontSize:'9px',fontWeight:700,color:'#aaa',letterSpacing:'0.8px',textTransform:'uppercase',maxWidth:'90px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flexShrink:0}}>
                              {sig.source}
                            </span>
                            <span style={{
                              fontSize:'9px',fontWeight:600,padding:'2px 7px',borderRadius:'4px',textTransform:'uppercase',flexShrink:0,
                              ...(cfg.label === 'Funding' || sig.sector === 'funding'
                                ? {background:'#f0fdf4',color:'#166534'}
                                : cfg.label === 'Policy' || sig.sector === 'policy'
                                ? {background:'#fefce8',color:'#854d0e'}
                                : cfg.label === 'AI & Tech' || sig.sector === 'ai'
                                ? {background:'#eff6ff',color:'#1e40af'}
                                : sig.isLocalSource
                                ? {background:'#e0f2fe',color:'#075985'}
                                : {background:'#faf5ff',color:'#6b21a8'}
                              ),
                            }}>
                              {sig.isLocalSource ? 'Local' : cfg.label}
                            </span>
                            <div style={{marginLeft:'auto',flexShrink:0,display:'flex',alignItems:'center',gap:'3px',padding:'2px 8px',border:'1px solid #fde68a',background:'#fffbeb',borderRadius:'6px'}}>
                              <span style={{fontSize:'9px',color:'#d97706'}}>⚡</span>
                              <span style={{fontSize:'11px',fontWeight:700,color:'#92400e',fontVariantNumeric:'tabular-nums'}}>
                                {Math.min(sig.signalScore||0,99)}
                              </span>
                            </div>
                          </div>
                          {/* Title */}
                          <h3 style={{fontSize:'12px',fontWeight:600,color:'#0a0a0a',lineHeight:1.45,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>
                            {(sig.title||'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'")}
                          </h3>
                          {/* Snippet */}
                          {(() => {
                            const clean=(sig.snippet||'')
                              .replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'")
                              .replace(/<[^>]+>/g,'').replace(/\[.*?\]/g,'').trim();
                            return clean.length > 20 ? (
                              <p style={{fontSize:'11px',color:'#777',lineHeight:1.55,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden',flex:1}}>
                                {clean.substring(0,160)}
                              </p>
                            ) : null;
                          })()}
                          {/* Actions */}
                          {!multiSelectMode && (
                            <div style={{display:'flex',gap:'8px'}}>
                              <button
                                type="button"
                                onClick={() => onAnalyzeSignal(sig)}
                                disabled={!!analyzingUrl}
                                style={{flex:1,height:'34px',background:'#0a0a0a',color:'white',border:'none',borderRadius:'8px',fontSize:'11px',fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'5px',opacity:analyzingUrl ? 0.4 : 1}}>
                                ⚡ Analyze
                              </button>
                              <WatchButton article={sig} />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Bottom-edge progress strip */}
                      <AnimatePresence>
                        {isAnalyzing && (
                          <motion.div
                            initial={{ width: '0%' }}
                            animate={{ width: `${analyzeProgress}%` }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                            className="absolute bottom-0 left-0 h-[3px] bg-primary"
                            style={{ borderRadius: '0 2px 2px 0' }}
                          />
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                  });
                })()
            }
          </div>

          {/* Filter drawer backdrop */}
          {inputMode === 'feed' && showFilterDrawer && (
            <div
              className="fixed inset-0 z-40 bg-black/20"
              onClick={() => setShowFilterDrawer(false)}
            />
          )}

          {/* Filter drawer panel */}
          {inputMode === 'feed' && (
          <div className={`fixed right-0 top-0 bottom-0 z-50 w-80 bg-white shadow-2xl transform transition-transform duration-300 flex flex-col ${showFilterDrawer ? 'translate-x-0' : 'translate-x-full'}`}>
            {/* Drawer header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-shrink-0">
              <h3 className="text-sm font-semibold">Feed filters</h3>
              <button
                type="button"
                onClick={() => setShowFilterDrawer(false)}
                className="text-gray-400 hover:text-black transition-colors text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {/* Drawer content */}
            <div className="overflow-y-auto flex-1 pb-20 space-y-6 p-4">

              {/* Market mode */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Market</p>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { id: 'global' as MarketMode, flag: '🌐', label: 'Global / US' },
                    { id: 'caribbean' as MarketMode, flag: '🌴', label: 'Caribbean' },
                    { id: 'africa' as MarketMode, flag: '🌍', label: 'Africa' },
                    { id: 'uk' as MarketMode, flag: '🇬🇧', label: 'UK & Europe' },
                    { id: 'latam' as MarketMode, flag: '🌎', label: 'Latin America' },
                  ]).map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMode(m.id)}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-all ${
                        selectedMode === m.id
                          ? 'border-black bg-gray-50 text-black'
                          : 'border-gray-200 text-gray-600 hover:border-gray-400'
                      }`}
                    >
                      <span>{m.flag}</span>
                      <span>{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Country */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Country</p>
                <div className="flex flex-wrap gap-2">
                  {['United States', 'Jamaica', 'Nigeria', 'Brazil', 'Mexico', 'Ghana', 'Kenya', 'United Kingdom', 'Colombia', 'India', 'Philippines', 'Singapore'].map(country => {
                    const isSelected = countryTags[0] === country;
                    return (
                      <button
                        key={country}
                        type="button"
                        onClick={() => setCountryTags(isSelected ? [] : [country])}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-black text-white border-black'
                            : 'border-gray-200 text-gray-600 hover:border-gray-400'
                        }`}
                      >
                        <span>{COUNTRY_CONTEXT[country.toLowerCase()]?.flag ?? '🌍'}</span>
                        <span>{country}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sectors */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Sectors</p>
                  <button
                    type="button"
                    onClick={() => setFilters(prev => ({ ...prev, sectors: ALL_SECTORS }))}
                    className="text-xs text-gray-400 underline hover:text-black"
                  >
                    Select all
                  </button>
                </div>
                <div className="space-y-1.5">
                  {ALL_SECTORS.map(sector => {
                    const cfg = SECTOR_CONFIGS[sector];
                    const isSelected = filters.sectors.includes(sector);
                    return (
                      <button
                        key={sector}
                        type="button"
                        onClick={() => toggleSector(sector)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-xs font-medium transition-all ${
                          isSelected
                            ? 'border-black bg-gray-50'
                            : 'border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        <span className={isSelected ? 'text-black' : ''}>{cfg.label}</span>
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                          isSelected ? 'bg-black border-black' : 'border-gray-300'
                        }`}>
                          {isSelected && <span className="text-white text-[9px]">✓</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time range */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Time range</p>
                <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                  {([
                    { value: '24h', label: 'Today' },
                    { value: '3d', label: '3 days' },
                    { value: '7d', label: '1 week' },
                  ] as { value: RecencyFilter; label: string }[]).map((opt, i) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFilters(prev => ({ ...prev, recency: opt.value }))}
                      className={`flex-1 py-2 text-xs font-medium transition-colors ${
                        i > 0 ? 'border-l border-gray-200' : ''
                      } ${
                        filters.recency === opt.value
                          ? 'bg-black text-white'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Drawer footer */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-white">
              <button
                type="button"
                onClick={() => { setShowFilterDrawer(false); fetchFeed(true); }}
                className="w-full py-3 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-900 transition-colors"
              >
                Apply filters
              </button>
            </div>
          </div>
          )}

        </div>
      ) : (
        /* ── REDDIT SIGNALS ── */
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <p className="text-xs text-gray-500">
              AI-analyzed Reddit posts — pain points, complaints &amp; workarounds turned into startup signals.
            </p>
            <button
              type="button"
              onClick={fetchRedditSignals}
              disabled={fetchingReddit}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${fetchingReddit ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {fetchingReddit
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-white border border-border/10 rounded-2xl p-5 space-y-3 animate-pulse">
                    <div className="h-4 bg-gray-100 w-24 rounded"/>
                    <div className="h-10 bg-gray-100 rounded"/>
                    <div className="h-16 bg-gray-100 rounded"/>
                    <div className="h-9 bg-gray-100 rounded-xl"/>
                  </div>
                ))
              : redditSignals.length === 0
              ? (
                  <div className="col-span-2 text-center py-12 space-y-3">
                    <div className="text-3xl">🟠</div>
                    <p className="text-sm font-semibold text-gray-700">Reddit signals loading</p>
                    <p className="text-xs text-gray-500 max-w-xs mx-auto">
                      Fetching hot posts from r/smallbusiness, r/Entrepreneur and more. This takes a few seconds.
                    </p>
                    <button
                      type="button"
                      onClick={fetchRedditSignals}
                      className="text-xs font-medium text-orange-600 hover:text-orange-700 underline"
                    >
                      Try again
                    </button>
                  </div>
                )
              : redditSignals.map((sig, i) => {
                  const meta = sig.redditMeta as { subreddit?: string; postType?: string; upvotes?: number; comments?: number; problem?: string; startupIdea?: string } | undefined;

                  const problemText = (meta?.problem || '')
                    .replace(/<[^>]+>/g, '').replace(/\[.*?\]/g, '').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim();
                  const displayProblem = problemText.length > 30
                    ? problemText.substring(0, 180)
                    : (sig.snippet as string || '').replace(/<[^>]+>/g, '').substring(0, 180);

                  return (
                    <div key={i} style={{background:'white',border:'1px solid #e8e8e4',borderRadius:'12px',display:'flex',flexDirection:'column',overflow:'hidden'}}>
                      <div style={{padding:'16px',display:'flex',flexDirection:'column',gap:'11px',flex:1,minWidth:0}}>
                        {/* Meta */}
                        <div style={{display:'flex',alignItems:'center',gap:'7px'}}>
                          <span style={{fontSize:'9px',fontWeight:700,color:'#9a3412',letterSpacing:'0.8px',textTransform:'uppercase',flexShrink:0}}>
                            r/{meta?.subreddit}
                          </span>
                          {meta?.postType && meta.postType !== 'Signal' && meta.postType !== 'Raw' && (
                            <span style={{fontSize:'9px',fontWeight:600,padding:'2px 7px',borderRadius:'4px',background:'#fff7ed',color:'#9a3412',textTransform:'uppercase'}}>
                              {meta.postType}
                            </span>
                          )}
                          <div style={{marginLeft:'auto',flexShrink:0,display:'flex',alignItems:'center',gap:'3px',padding:'2px 8px',border:'1px solid #fde68a',background:'#fffbeb',borderRadius:'6px'}}>
                            <span style={{fontSize:'9px',color:'#d97706'}}>⚡</span>
                            <span style={{fontSize:'11px',fontWeight:700,color:'#92400e',fontVariantNumeric:'tabular-nums'}}>
                              {Math.min(Number(sig.signalScore)||0,99)}
                            </span>
                          </div>
                        </div>

                        {/* Title */}
                        <h3 style={{fontSize:'12px',fontWeight:600,color:'#0a0a0a',lineHeight:1.45,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>
                          {String(sig.title||'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'")}
                        </h3>

                        {/* Problem */}
                        {(() => {
                          const prob=(meta?.problem||'').replace(/<[^>]+>/g,'').replace(/\[.*?\]/g,'').replace(/https?:\/\/\S+/g,'').trim();
                          return prob.length > 30 ? (
                            <div style={{background:'#f8f8f6',borderRadius:'8px',padding:'10px 12px',border:'1px solid #f0f0ee'}}>
                              <p style={{fontSize:'9px',fontWeight:700,color:'#bbb',letterSpacing:'1.5px',textTransform:'uppercase',marginBottom:'5px'}}>Problem signal</p>
                              <p style={{fontSize:'11px',color:'#555',lineHeight:1.55,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>
                                {prob.substring(0,180)}
                              </p>
                            </div>
                          ) : null;
                        })()}

                        {/* Engagement */}
                        {((meta?.upvotes??0)>0 || (meta?.comments??0)>0) && (
                          <div style={{display:'flex',gap:'12px',fontSize:'10px',color:'#bbb'}}>
                            {(meta?.upvotes??0)>0 && <span>▲ {Number(meta!.upvotes).toLocaleString()}</span>}
                            {(meta?.comments??0)>0 && <span>💬 {Number(meta!.comments).toLocaleString()}</span>}
                          </div>
                        )}

                        {/* Actions */}
                        <div style={{display:'flex',gap:'8px'}}>
                          <button
                            type="button"
                            disabled={!!analyzingUrl}
                            onClick={() => {
                              const text=`${sig.title}. ${meta?.problem??''}`;
                              setInput(text as string);
                              setAnalyzingUrl(String(sig.url ?? text));
                              analyzeSignal(text as string);
                            }}
                            style={{flex:1,height:'34px',background:'#0a0a0a',color:'white',border:'none',borderRadius:'8px',fontSize:'11px',fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'5px'}}>
                            ⚡ Analyze
                          </button>
                          <a
                            href={String(sig.url??'#')}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{height:'34px',padding:'0 12px',border:'1px solid #e8e8e4',background:'white',borderRadius:'8px',fontSize:'11px',color:'#666',display:'flex',alignItems:'center',textDecoration:'none'}}>
                            View
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })
            }
          </div>
        </div>
      )}

    </section>
  );
};
