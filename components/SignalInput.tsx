'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Lightbulb, MapPin, Zap, TrendingUp, Loader2, X, RefreshCw, Sparkles, FileUp, CheckCircle2, AlertCircle } from 'lucide-react';
import { MarketMode, FeedSignal, SectorKey, RecencyFilter, FeedFilters, SECTOR_CONFIGS } from './types';
import { LOADING_STAGE_LABELS } from './agent/useAgentAnalysis';
import { MarketModeSelector } from './MarketModeSelector';
import { COUNTRY_CONTEXT } from '@/lib/rss-sources';

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
  location: string;
  setLocation: (val: string) => void;
  focus: string;
  setFocus: (val: string) => void;
  loading: boolean;
  loadingStage?: number;
  loadingProgress?: number;
  result: unknown | null;
  analyzeSignal: (overrideInput?: string) => void;
  cancelAnalysis: () => void;
  exampleSignals: { label: string; text: string; location: string; focus: string }[];
  selectedMode: MarketMode;
  setSelectedMode: (mode: MarketMode) => void;
  countryTags: string[];
  setCountryTags: (tags: string[]) => void;
}

export const SignalInput: React.FC<SignalInputProps> = ({
  input, setInput, urlInput, setUrlInput, fetchingUrl, fetchUrl,
  location, setLocation, focus, setFocus, loading, loadingStage = 0, loadingProgress = 5,
  result, analyzeSignal, cancelAnalysis,
  countryTags, setCountryTags,
  exampleSignals, selectedMode, setSelectedMode,
}) => {
  const [inputMode, setInputMode] = useState<'paste' | 'feed'>('paste');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfStatus, setPdfStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const [signals, setSignals] = useState<FeedSignal[]>([]);
  const [feedMeta, setFeedMeta] = useState<{ total: number; duplicatesRemoved: number } | null>(null);
  const [fetchingFeed, setFetchingFeed] = useState(false);
  const [articleNotice, setArticleNotice] = useState<string | null>(null);
  const [countryInput, setCountryInput] = useState('');
  const [showCountry, setShowCountry] = useState(false);
  const [lastFetchKey, setLastFetchKey] = useState('');
  const [filters, setFilters] = useState<FeedFilters>({ sectors: ALL_SECTORS, recency: '3d' });

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
      <div className="flex w-full bg-white border border-border/10 p-1 rounded-2xl shadow-sm mb-6">
        <button onClick={() => setInputMode('paste')} className={`flex-1 py-3 rounded-xl font-mono text-[11px] uppercase tracking-wider transition-all duration-200 ${inputMode === 'paste' ? 'bg-foreground text-background shadow-lg shadow-foreground/10' : 'text-muted hover:text-foreground hover:bg-gray-50'}`}>
          Paste Signal
        </button>
        <button onClick={() => setInputMode('feed')} className={`flex-1 py-3 rounded-xl font-mono text-[11px] uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 ${inputMode === 'feed' ? 'bg-foreground text-background shadow-lg shadow-foreground/10' : 'text-muted hover:text-foreground hover:bg-gray-50'}`}>
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${inputMode === 'feed' ? 'bg-red-400 animate-pulse' : 'bg-gray-300'}`} />
          Live Feed
        </button>
      </div>

      {inputMode === 'paste' ? (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono uppercase tracking-widest text-muted font-bold">Import from URL or PDF</label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative group">
                <input type="text" value={urlInput} onChange={e => setUrlInput(e.target.value)} placeholder="Paste a URL or PDF link to fetch content..."
                  className="w-full bg-white border border-border/10 rounded-xl p-4 pl-11 pr-10 focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none font-sans text-sm transition-all shadow-sm" />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
                {urlInput && <button type="button" onClick={() => setUrlInput('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"><X className="w-4 h-4" /></button>}
              </div>
              <button onClick={fetchUrl} disabled={fetchingUrl || !urlInput.trim()}
                className="bg-foreground text-background px-8 py-4 rounded-xl font-mono text-[11px] uppercase tracking-widest hover:bg-foreground/90 disabled:opacity-40 transition-all shadow-lg shadow-foreground/5 flex-shrink-0 flex items-center justify-center gap-2">
                {fetchingUrl ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Fetch Content'}
              </button>
            </div>
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
              <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Paste a news article, policy update, or market signal here..."
                className="w-full h-48 md:h-64 bg-white border border-border/10 rounded-2xl p-6 focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none resize-none font-sans text-base leading-relaxed transition-all shadow-sm" />
              <div className="absolute bottom-4 right-4 text-primary/20 group-focus-within:text-primary/40 transition-colors"><Sparkles className="w-6 h-6" /></div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[10px] font-mono uppercase text-muted flex items-center gap-1.5 w-full mb-1"><Lightbulb className="w-3 h-3" /> Try an example:</span>
            {exampleSignals.map((sig, i) => (
              <button key={i} onClick={() => { setInput(sig.text); setLocation(sig.location); setFocus(sig.focus); }}
                className="px-4 py-2 bg-white border border-border/10 rounded-lg text-[10px] font-mono uppercase text-muted hover:text-foreground hover:border-border/30 hover:bg-gray-50 transition-all shadow-sm active:scale-95">
                {sig.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Sector chips */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-muted tracking-widest">Filter by sector</span>
              <button onClick={() => setFilters(prev => ({ ...prev, sectors: prev.sectors.length === ALL_SECTORS.length ? ['ai'] : ALL_SECTORS }))}
                className="text-[10px] font-mono uppercase text-primary hover:opacity-70 transition-opacity">
                {filters.sectors.length === ALL_SECTORS.length ? 'Deselect all' : 'Select all'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {ALL_SECTORS.map(key => {
                const cfg = SECTOR_CONFIGS[key];
                const active = filters.sectors.includes(key);
                return (
                  <button key={key} onClick={() => toggleSector(key)}
                    className={`px-3 py-1.5 rounded-full font-mono text-[10px] uppercase tracking-wider font-bold border transition-all duration-200 ${active ? `${cfg.badgeBg} ${cfg.badgeText} border-transparent shadow-sm` : 'bg-white text-muted border-border/10 hover:border-border/30 hover:bg-gray-50'}`}>
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recency + refresh */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex bg-white border border-border/10 rounded-xl p-0.5 shadow-sm">
              {(['24h', '3d', '7d'] as RecencyFilter[]).map(r => (
                <button key={r} onClick={() => setFilters(prev => ({ ...prev, recency: r }))}
                  className={`px-3 py-1.5 rounded-lg font-mono text-[10px] uppercase tracking-wider transition-all ${filters.recency === r ? 'bg-foreground text-background shadow-sm' : 'text-muted hover:text-foreground hover:bg-gray-50'}`}>
                  {r === '24h' ? 'Today' : r === '3d' ? '3 Days' : '1 Week'}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-muted flex items-center gap-2">
                <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                {selectedMode !== 'global' ? `${selectedMode} signals` : 'Global'}
              </span>
              <button onClick={() => fetchFeed(true)} disabled={fetchingFeed} aria-label="Refresh feed"
                className="p-2 hover:bg-white border border-transparent hover:border-border/10 rounded-lg transition-all text-muted hover:text-foreground">
                <RefreshCw className={`w-4 h-4 ${fetchingFeed ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Dedup count banner */}
          {feedMeta && !fetchingFeed && (
            <div className="flex items-center gap-2 text-[10px] font-mono text-muted">
              <span className="w-1.5 h-1.5 bg-secondary rounded-full flex-shrink-0" />
              Showing {feedMeta.total} articles
              {feedMeta.duplicatesRemoved > 0 && (
                <span className="text-muted/60">· {feedMeta.duplicatesRemoved} duplicates removed</span>
              )}
            </div>
          )}

          {/* Country tag feed banner */}
          {countryTags.length > 0 && (
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

          {/* Feed cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {fetchingFeed
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white border border-border/10 rounded-2xl p-5 space-y-3 animate-pulse shadow-sm">
                    <div className="flex gap-2"><div className="h-4 bg-gray-100 w-16 rounded-md" /><div className="h-4 bg-gray-100 w-10 rounded-md" /></div>
                    <div className="h-10 bg-gray-100 rounded-lg" />
                    <div className="h-8 bg-gray-100 rounded-lg" />
                    <div className="h-9 bg-gray-100 rounded-xl" />
                  </div>
                ))
              : signals.length === 0
              ? <div className="col-span-2 text-center py-16 text-muted font-mono text-xs uppercase tracking-widest">No signals found. Try widening your filters.</div>
              : signals.map((sig, i) => {
                  const cfg = SECTOR_CONFIGS[sig.sector] ?? SECTOR_CONFIGS.markets;
                  const key = sig.url ?? sig.title;
                  const isAnalyzing = analyzingUrl === key;
                  const isSuccess = successUrl === key;
                  const isOtherAnalyzing = !!analyzingUrl && analyzingUrl !== key;

                  return (
                    <motion.div
                      key={i}
                      layout
                      animate={{
                        scale: isAnalyzing ? 1.04 : isOtherAnalyzing ? 0.96 : 1,
                        opacity: isOtherAnalyzing ? 0.4 : 1,
                        filter: isOtherAnalyzing ? 'blur(2px)' : 'blur(0px)',
                        boxShadow: isSuccess
                          ? '0 0 0 2px #22c55e, 0 20px 60px rgba(34,197,94,0.2)'
                          : isAnalyzing
                          ? '0 20px 60px rgba(0,0,0,0.2)'
                          : '0 1px 3px rgba(0,0,0,0.08)',
                      }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className={`relative bg-white border rounded-2xl flex flex-col overflow-hidden border-l-4 ${cfg.borderColor} ${
                        isOtherAnalyzing ? 'pointer-events-none' : ''
                      } ${isAnalyzing ? 'z-10 ring-2 ring-blue-400 ring-offset-2' : ''}`}
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
                        <div className="p-5 flex flex-col gap-3">
                          {/* Header row */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[9px] font-mono font-bold text-muted uppercase tracking-wider truncate">{sig.source}</span>
                            <span className={`px-2 py-0.5 text-[9px] font-mono uppercase font-bold rounded-md ${cfg.badgeBg} ${cfg.badgeText}`}>{cfg.label}</span>
                            {sig.isLocalSource && (
                              <span className="px-2 py-0.5 text-[9px] font-mono uppercase font-bold rounded-md bg-green-100 text-green-700">Local</span>
                            )}
                            {sig.isGlobalMention && (
                              <span className="px-2 py-0.5 text-[9px] font-mono uppercase font-bold rounded-md bg-blue-100 text-blue-700">Global mention</span>
                            )}
                            <div className="ml-auto flex items-center gap-1.5 flex-shrink-0">
                              <SignalScoreBadge score={sig.signalScore} publishedAt={sig.publishedAt} />
                              {sig.url && sig.url !== '#' && (
                                <a href={sig.url} target="_blank" rel="noopener noreferrer" aria-label={`Read full article: ${sig.title}`} className="text-[9px] font-mono text-primary hover:underline" onClick={e => e.stopPropagation()}>↗</a>
                              )}
                            </div>
                          </div>
                          {/* Title */}
                          <p className="text-sm font-semibold leading-snug line-clamp-2">{sig.title}</p>
                          {/* Snippet */}
                          <p className="text-xs text-muted leading-relaxed line-clamp-2 flex-1">{sig.snippet}</p>
                          {/* Analyze button */}
                          <button
                            type="button"
                            onClick={() => onAnalyzeSignal(sig)}
                            disabled={!!analyzingUrl}
                            aria-label={`Analyze: ${sig.title}`}
                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-foreground text-background rounded-xl font-mono text-[10px] uppercase tracking-widest hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                          >
                            <Zap className="w-3.5 h-3.5" />Analyze
                          </button>
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
                })
            }
          </div>
        </div>
      )}

      <div id="analyze-actions" className="mt-8 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        {/* Country search — single line */}
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
      </div>
    </section>
  );
};
