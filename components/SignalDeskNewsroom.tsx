'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Loader2,
  X,
  FileUp,
  CheckCircle2,
  AlertCircle,

  Edit3,
  Zap,
  RefreshCw,
  Newspaper,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { MarketMode, FeedSignal, SectorKey, RecencyFilter, FeedFilters, SECTOR_CONFIGS } from './types';
import { LOADING_STAGE_LABELS } from './agent/useAgentAnalysis';
import { MarketModeSelector } from './MarketModeSelector';
import { COUNTRY_CONTEXT } from '@/lib/rss-sources';
import WatchButton from './WatchButton';
import { FeedViewSelector, type FeedViewMode } from './FeedViewSelector';
import { FeedCardView } from './FeedCardView';
import { FeedListView } from './FeedListView';
import { FeedCompactView } from './FeedCompactView';

const capitalize = (s: string) => s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
const ALL_SECTORS: SectorKey[] = ['ai', 'policy', 'markets', 'funding', 'sustainability', 'realestate', 'health', 'ai_intelligence'];

const CARD_STAGES = [
  { progress: 15, label: 'Fetching article...', delay: 300 },
  { progress: 35, label: 'Reading signal...', delay: 1500 },
  { progress: 60, label: 'Finding opportunities...', delay: 3000 },
  { progress: 80, label: 'Scoring ideas...', delay: 5500 },
  { progress: 90, label: 'Almost done...', delay: 7500 },
];

interface SignalDeskNewsroomProps {
  input: string;
  setInput: (val: string) => void;
  location: string;
  setLocation: (val: string) => void;
  focus: string;
  setFocus: (val: string) => void;
  loading: boolean;
  loadingStage?: number;
  loadingProgress?: number;
  analyzeSignal: (overrideInput?: string, sourceTitle?: string) => void;
  cancelAnalysis: () => void;
  selectedMode: MarketMode;
  setSelectedMode: (mode: MarketMode) => void;
  readingLevel: 'simple' | 'standard' | 'advanced';
  setReadingLevel: (level: 'simple' | 'standard' | 'advanced') => void;
  countryTags: string[];
  setCountryTags: (tags: string[]) => void;
  onQuickEdit?: () => void;
  showQuickEdit?: boolean;
  onCompoundAnalysis?: (articles: FeedSignal[]) => void;
}

export const SignalDeskNewsroom: React.FC<SignalDeskNewsroomProps> = ({
  input,
  setInput,
  location,
  setLocation,
  focus,
  setFocus,
  loading,
  loadingStage = 0,
  loadingProgress = 5,
  analyzeSignal,
  cancelAnalysis,
  selectedMode,
  setSelectedMode,
  readingLevel,
  setReadingLevel,
  countryTags,
  setCountryTags,
  onQuickEdit,
  showQuickEdit = false,
  onCompoundAnalysis,
}) => {
  const [inputMode, setInputMode] = useState<'paste' | 'feed' | 'reddit'>('feed');
  const [feedView, setFeedView] = useState<FeedViewMode>(() => {
    try {
      return (localStorage.getItem('s2s_feed_view') as FeedViewMode) || 'card';
    } catch {
      return 'card';
    }
  });
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedArticles, setSelectedArticles] = useState<FeedSignal[]>([]);

  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfStatus, setPdfStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Feed states
  const [signals, setSignals] = useState<FeedSignal[]>([]);
  const [feedMeta, setFeedMeta] = useState<{ total: number; duplicatesRemoved: number } | null>(null);
  const [fetchingFeed, setFetchingFeed] = useState(false);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [lastFetchKey, setLastFetchKey] = useState('');
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

  const [redditSignals, setRedditSignals] = useState<FeedSignal[]>([]);
  const [fetchingReddit, setFetchingReddit] = useState(false);
  const [redditError, setRedditError] = useState<string | null>(null);
  const [redditMeta, setRedditMeta] = useState<{ postCount?: number; rawFallback?: boolean } | null>(null);
  const [showRawReddit, setShowRawReddit] = useState(false);

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
      setPdfStatus({ type: 'success', message: 'PDF extracted successfully' });
    } catch {
      setPdfStatus({ type: 'error', message: 'Failed to upload PDF' });
    } finally {
      setPdfLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const fetchKey = `${selectedMode}|${filters.sectors.join(',')}|${filters.recency}|${focus}|${countryTags.join(',')}`;

  const fetchFeed = useCallback(
    async (force = false) => {
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
        const raw: FeedSignal[] = Array.isArray(data) ? data : data.items ?? [];
        const meta = Array.isArray(data) ? null : data.meta ?? null;
        setSignals(raw);
        setFeedMeta(meta);
        setLastFetchKey(fetchKey);
      } catch (err) {
        console.error('Feed error:', err);
      } finally {
        setFetchingFeed(false);
      }
    },
    [fetchKey, lastFetchKey, signals.length, filters, selectedMode, focus, countryTags]
  );

  // Persist feed view preference
  useEffect(() => {
    try {
      localStorage.setItem('s2s_feed_view', feedView);
    } catch {}
  }, [feedView]);

  useEffect(() => {
    if (inputMode === 'feed') fetchFeed();
  }, [inputMode, fetchKey, fetchFeed]);

  useEffect(() => {
    if (inputMode !== 'reddit') return;
    const fetchReddit = async () => {
      setFetchingReddit(true);
      setRedditError(null);
      try {
        const res = await fetch(`/api/reddit-signals?market=${selectedMode}`);
        const data = await res.json();
        if (!res.ok || data?.error) {
          const message = data?.error || 'Failed to load Reddit signals';
          setRedditSignals([]);
          setRedditMeta(null);
          setRedditError(message);
          console.error('Reddit fetch failed:', message);
          return;
        }
        setRedditSignals(data.signals || []);
        setRedditMeta({ postCount: data?.meta?.postCount, rawFallback: data?.meta?.rawFallback });
      } catch (err) {
        setRedditError('Failed to load Reddit signals');
        setRedditSignals([]);
        setRedditMeta(null);
        console.error('Reddit fetch failed:', err);
      } finally {
        setFetchingReddit(false);
      }
    };

    fetchReddit();
  }, [inputMode, selectedMode]);

  const fetchRawReddit = async () => {
    setFetchingReddit(true);
    setRedditError(null);
    try {
      const res = await fetch(`/api/reddit-signals?market=${selectedMode}&raw=true`);
      const data = await res.json();
      if (!res.ok || data?.error) {
        const message = data?.error || 'Failed to load raw Reddit posts';
        setRedditSignals([]);
        setRedditMeta(null);
        setRedditError(message);
        console.error('Raw Reddit fetch failed:', message);
        return;
      }
      setRedditSignals(data.signals || []);
      setRedditMeta({ postCount: data?.meta?.postCount, rawFallback: true });
    } catch (err) {
      setRedditError('Failed to load raw Reddit posts');
      setRedditSignals([]);
      setRedditMeta(null);
      console.error('Raw Reddit fetch failed:', err);
    } finally {
      setFetchingReddit(false);
    }
  };

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

  // Detect when analysis completes
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

  const onAnalyzeSignal = async (sig: FeedSignal) => {
    const key = sig.url ?? sig.title;
    if (analyzingUrl && analyzingUrl !== key) cancelAnalysis();
    setAnalyzingUrl(key);
    setAnalyzeProgress(0);
    setAnalyzeStage('Fetching article...');

    let text = '';
    if (sig.url && sig.url !== '#') {
      try {
        const res = await fetch(`/api/fetch-url?url=${encodeURIComponent(sig.url)}`, {
          signal: AbortSignal.timeout(9000),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.content && data.content.trim().length > 100) {
            text = data.content;
          }
        }
      } catch {}
    }

    if (!text.trim()) {
      text = [sig.title, sig.snippet].filter(Boolean).join('\n\n');
    }

    if (text.trim().length < 50) {
      text = sig.title;
    }

    // Pass the article title as sourceTitle
    analyzeSignal(text, sig.title);
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

  const timeAgo = (d: string) => {
    const h = Math.floor((Date.now() - new Date(d).getTime()) / 3600000);
    return h < 1 ? 'Just now' : h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
  };

  const SignalScoreBadge = ({ score, publishedAt }: { score?: number; publishedAt: string }) => {
    const time = timeAgo(publishedAt);
    if (!score || score < 40) {
      return <span className="text-xs text-gray-500">{time}</span>;
    }
    const cls =
      score >= 80
        ? 'bg-green-100 text-green-800 border border-green-200'
        : score >= 60
        ? 'bg-amber-100 text-amber-800 border border-amber-200'
        : 'bg-gray-100 text-gray-600 border border-gray-200';
    const icon = score >= 80 ? '🔥' : score >= 60 ? '⚡' : '';
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${cls}`}>
        {icon}
        {score}
      </span>
    );
  };

  return (
    <section id="step-1" className="scroll-mt-24 mb-16">
      {/* Mode Toggle */}
      <div className="flex bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200/50 rounded-2xl p-1.5 mb-8 shadow-sm w-fit mx-auto backdrop-blur-sm">
        <button
          onClick={() => { setInputMode('feed'); setMultiSelectMode(false); setSelectedArticles([]); }}
          className={`flex items-center gap-3 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
            inputMode === 'feed'
              ? 'bg-gradient-to-r from-slate-900 to-slate-700 text-white shadow-lg'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
          }`}
        >
          <Newspaper className="w-4 h-4" />
          Newsroom Feed
          {inputMode === 'feed' && (
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          )}
        </button>
        <button
          onClick={() => { setInputMode('reddit'); setMultiSelectMode(false); setSelectedArticles([]); setShowRawReddit(false); }}
          className={`flex items-center gap-3 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
            inputMode === 'reddit'
              ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg'
              : 'text-slate-600 hover:text-orange-600 hover:bg-white/80'
          }`}
        >
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
            inputMode === 'reddit' ? 'bg-orange-400 animate-pulse' : 'bg-slate-300'
          }`} />
          Reddit Signals
        </button>
        <button
          onClick={() => { setInputMode('paste'); setMultiSelectMode(false); setSelectedArticles([]); }}
          className={`flex items-center gap-3 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
            inputMode === 'paste'
              ? 'bg-gradient-to-r from-slate-900 to-slate-700 text-white shadow-lg'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
          }`}
        >
          <Edit3 className="w-4 h-4" />
          Paste Signal
        </button>
      </div>

      {inputMode === 'paste' ? (
        /* PASTE MODE */
        <div className="bg-gradient-to-br from-white to-slate-50/50 border border-slate-200/50 rounded-3xl shadow-sm overflow-hidden backdrop-blur-sm">
          <div className="border-b border-slate-200/50 px-8 py-6 bg-white/80">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-1">Signal Desk</h2>
                <p className="text-sm text-slate-600">Paste your market signal to extract opportunities</p>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-6">
            {showQuickEdit && onQuickEdit && (
              <button
                onClick={onQuickEdit}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-black transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                Quick edit & rerun
              </button>
            )}

            <div className="relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Paste a news article, policy update, or market signal here..."
                className="w-full h-64 bg-slate-50/50 border border-slate-200/50 rounded-2xl p-6 focus:ring-2 focus:ring-slate-900/20 focus:bg-white outline-none resize-none font-sans text-base leading-relaxed transition-all duration-200 shadow-inner"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) uploadPdf(f);
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={pdfLoading}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-200 hover:border-gray-300 disabled:opacity-50 transition-all"
              >
                {pdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
                {pdfLoading ? 'Reading PDF...' : 'Upload PDF'}
              </button>
              {pdfStatus && (
                <span
                  className={`flex items-center gap-2 text-sm ${
                    pdfStatus.type === 'success' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {pdfStatus.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  {pdfStatus.message}
                </span>
              )}
            </div>

            {loading ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-black" />
                    <span className="text-sm font-medium text-gray-700">
                      {LOADING_STAGE_LABELS[loadingStage] ?? 'Processing...'}
                    </span>
                  </div>
                  <button
                    onClick={cancelAnalysis}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="h-full bg-black rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: `${loadingProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => analyzeSignal()}
                disabled={!input.trim()}
                className="w-full bg-gradient-to-r from-slate-900 to-slate-700 text-white py-5 rounded-2xl text-base font-semibold hover:from-slate-800 hover:to-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl active:scale-[0.98]"
              >
                <Zap className="w-5 h-5" />
                Extract Opportunities
              </button>
            )}

            <div className="border-t border-slate-200/50 pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-2 uppercase tracking-wide">
                    Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="e.g. Kingston, New York"
                    className="w-full bg-slate-50/50 border border-slate-200/50 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-slate-900/20 focus:bg-white outline-none transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-2 uppercase tracking-wide">
                    Focus / Niche
                  </label>
                  <input
                    type="text"
                    value={focus}
                    onChange={e => setFocus(e.target.value)}
                    placeholder="e.g. SaaS, Healthcare"
                    className="w-full bg-slate-50/50 border border-slate-200/50 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-slate-900/20 focus:bg-white outline-none transition-all duration-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-2 uppercase tracking-wide">
                    Market Region
                  </label>
                  <MarketModeSelector selectedMode={selectedMode} onModeChange={setSelectedMode} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-2 uppercase tracking-wide">
                    Reading Mode
                  </label>
                  <div className="flex rounded-xl border border-slate-200/50 overflow-hidden h-11 bg-slate-50/50">
                    {([
                      { value: 'simple', label: 'Simple' },
                      { value: 'standard', label: 'Standard' },
                      { value: 'advanced', label: 'Detailed' },
                    ] as { value: 'simple' | 'standard' | 'advanced'; label: string }[]).map((opt, i) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setReadingLevel(opt.value)}
                        className={`flex-1 py-2 text-xs font-medium transition-all duration-200 ${
                          i > 0 ? 'border-l border-slate-200/50' : ''
                        } ${readingLevel === opt.value ? 'bg-gradient-to-r from-slate-900 to-slate-700 text-white' : 'text-slate-600 hover:bg-white/80'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* FEED MODE */
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-gradient-to-r from-white to-slate-50/50 border border-slate-200/50 rounded-2xl px-6 py-4 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <Newspaper className="w-5 h-5 text-slate-400" />
                <span className="text-sm font-medium text-slate-600">
                  {fetchingFeed ? 'Loading...' : `${signals.length} signals`}
                </span>
                {feedMeta && feedMeta.duplicatesRemoved > 0 && (
                  <span className="text-xs text-slate-400">
                    · {feedMeta.duplicatesRemoved} duplicates removed
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <FeedViewSelector currentView={feedView} onViewChange={setFeedView} />
                <button
                  type="button"
                  onClick={() => {
                    setMultiSelectMode(!multiSelectMode);
                    setSelectedArticles([]);
                  }}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-xs font-semibold transition-all duration-200 ${
                    multiSelectMode
                      ? 'bg-gradient-to-r from-slate-900 to-slate-700 text-white border-slate-900 shadow-sm'
                      : 'border-slate-200/50 text-slate-600 hover:border-slate-400 hover:bg-white/80'
                  }`}
                >
                  {multiSelectMode ? '✕ Cancel' : '⊕ Compare'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowFilterDrawer(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200/50 text-sm font-medium text-slate-600 hover:border-slate-400 hover:bg-white/80 transition-all duration-200"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filters
                  {(countryTags.length > 0 || filters.sectors.length < ALL_SECTORS.length) && (
                    <span className="w-2 h-2 rounded-full bg-slate-900" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => fetchFeed(true)}
                  disabled={fetchingFeed}
                  className="p-2 text-slate-400 hover:text-slate-600 transition-colors duration-200"
                >
                  <RefreshCw className={`w-5 h-5 ${fetchingFeed ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Feed Cards - View Selector */}
          {inputMode === 'reddit' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {redditError ? (
                <div className="col-span-full text-center py-16 text-sm text-red-500">
                  {redditError}
                </div>
              ) : fetchingReddit ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-white border border-border/10 rounded-2xl p-5 space-y-3 animate-pulse"
                  >
                    <div className="h-4 bg-gray-100 w-24 rounded" />
                    <div className="h-10 bg-gray-100 rounded" />
                    <div className="h-16 bg-gray-100 rounded" />
                    <div className="h-9 bg-gray-100 rounded-xl" />
                  </div>
                ))
              ) : redditSignals.length === 0 ? (
                <div className="col-span-full text-center py-16 text-gray-500 text-sm">
                  <p>No Reddit signals found. Try again or select a different market.</p>
                  {redditMeta?.postCount !== undefined && (
                    <p className="mt-2 text-xs text-gray-400">
                      Fetched {redditMeta.postCount} Reddit posts{redditMeta.rawFallback ? ' (raw fallback mode)' : ''}.
                    </p>
                  )}
                  {redditMeta?.postCount === 0 && (
                    <p className="mt-2 text-xs text-gray-400">
                      No Reddit posts passed the filters. Try lowering thresholds or adding more subreddits.
                    </p>
                  )}
                  <button
                    onClick={() => fetchRawReddit()}
                    disabled={fetchingReddit}
                    className="mt-4 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium hover:bg-orange-200 disabled:opacity-50 transition-colors"
                  >
                    {fetchingReddit ? 'Loading...' : 'Show Raw Reddit Posts'}
                  </button>
                </div>
              ) : redditSignals.map((sig, i) => {
                const meta = sig.redditMeta;
                return (
                  <div
                    key={i}
                    className="bg-white border border-orange-100 rounded-2xl flex flex-col overflow-hidden hover:border-orange-200 hover:shadow-md transition-all"
                  >
                    <div className="p-4 flex flex-col gap-3 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[9px] font-mono font-bold text-orange-400 uppercase tracking-wider">
                          r/{meta?.subreddit || 'reddit'}
                        </span>
                        <span className="px-2 py-0.5 text-[9px] font-mono uppercase font-bold rounded-md bg-orange-50 text-orange-600">
                          {meta?.postType || 'Signal'}
                        </span>
                        <div className="ml-auto flex items-center gap-1 px-2 py-0.5 bg-amber-50 border border-amber-200 rounded-lg">
                          <span className="text-amber-500 text-[9px]">⚡</span>
                          <span className="text-[10px] font-bold font-mono text-amber-700">
                            {Math.min(sig.signalScore || 0, 99)}
                          </span>
                        </div>
                      </div>

                      <h3 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">
                        {sig.title}
                      </h3>

                      <div className="bg-orange-50 rounded-xl p-3">
                        <p className="text-[9px] font-bold text-orange-600 uppercase tracking-widest mb-1">
                          Problem identified
                        </p>
                        <p className="text-xs text-gray-700 leading-relaxed">
                          {meta?.problem || sig.snippet}
                        </p>
                      </div>

                      <div className="bg-emerald-50 rounded-xl p-3">
                        <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mb-1">
                          Startup opportunity
                        </p>
                        <p className="text-xs text-gray-700 leading-relaxed">
                          {meta?.startupIdea || 'No opportunity extracted yet.'}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 text-[10px] text-gray-400">
                        <span>▲ {meta?.upvotes?.toLocaleString() ?? 0} upvotes</span>
                        <span>💬 {meta?.comments?.toLocaleString() ?? 0} comments</span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const signalText = `${sig.title}. ${meta?.problem || sig.snippet}. Startup idea: ${meta?.startupIdea || ''}`;
                            analyzeSignal(signalText, sig.title);
                          }}
                          disabled={!!analyzingUrl}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-orange-600 text-white rounded-xl text-xs font-semibold hover:bg-orange-700 disabled:opacity-40 transition-colors"
                        >
                          ⚡ Analyze
                        </button>
                        <WatchButton article={sig} />
                      </div>
                    </div>
                  </div>
                );
              })
            }
            </div>
          ) : feedView === 'list' ? (
            <FeedListView
              signals={signals}
              fetchingFeed={fetchingFeed}
              multiSelectMode={multiSelectMode}
              selectedArticles={selectedArticles}
              onSelectArticle={(sig) => {
                setSelectedArticles(prev => {
                  const isSelected = prev.some(a => a.url === (sig.url ?? sig.title));
                  if (isSelected) return prev.filter(a => a.url !== (sig.url ?? sig.title));
                  if (prev.length >= 5) return prev;
                  return [...prev, sig];
                });
              }}
              analyzingUrl={analyzingUrl}
              analyzeProgress={analyzeProgress}
              analyzeStage={analyzeStage}
              onAnalyzeSignal={onAnalyzeSignal}
              onCardCancel={handleCardCancel}
            />
          ) : feedView === 'compact' ? (
            <FeedCompactView
              signals={signals}
              fetchingFeed={fetchingFeed}
              multiSelectMode={multiSelectMode}
              selectedArticles={selectedArticles}
              onSelectArticle={(sig) => {
                setSelectedArticles(prev => {
                  const isSelected = prev.some(a => a.url === (sig.url ?? sig.title));
                  if (isSelected) return prev.filter(a => a.url !== (sig.url ?? sig.title));
                  if (prev.length >= 5) return prev;
                  return [...prev, sig];
                });
              }}
              analyzingUrl={analyzingUrl}
              analyzeProgress={analyzeProgress}
              analyzeStage={analyzeStage}
              onAnalyzeSignal={onAnalyzeSignal}
              onCardCancel={handleCardCancel}
            />
          ) : (
            <FeedCardView
              signals={signals}
              fetchingFeed={fetchingFeed}
              multiSelectMode={multiSelectMode}
              selectedArticles={selectedArticles}
              onSelectArticle={(sig) => {
                setSelectedArticles(prev => {
                  const isSelected = prev.some(a => a.url === (sig.url ?? sig.title));
                  if (isSelected) return prev.filter(a => a.url !== (sig.url ?? sig.title));
                  if (prev.length >= 5) return prev;
                  return [...prev, sig];
                });
              }}
              analyzingUrl={analyzingUrl}
              analyzeProgress={analyzeProgress}
              analyzeStage={analyzeStage}
              successUrl={successUrl}
              onAnalyzeSignal={onAnalyzeSignal}
              onCardCancel={handleCardCancel}
            />
          )}

          {/* Sticky Compound Analysis Bar */}          {/* Sticky Compound Analysis Bar */}
          {multiSelectMode && (
            <div className={`fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-white to-slate-50/50 border-t border-slate-200/50 shadow-2xl transition-transform duration-300 backdrop-blur-sm ${
              selectedArticles.length > 0 ? 'translate-y-0' : 'translate-y-full'
            }`}>
              <div className="max-w-3xl mx-auto px-4 py-4">
                {selectedArticles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedArticles.map(article => (
                      <div key={article.url} className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 rounded-full text-xs">
                        <span className="font-medium text-gray-700 max-w-[140px] truncate">{article.title}</span>
                        <button
                          type="button"
                          onClick={() => setSelectedArticles(prev => prev.filter(a => a.url !== article.url))}
                          className="text-gray-400 hover:text-black flex-shrink-0"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (onCompoundAnalysis && selectedArticles.length >= 2) {
                      onCompoundAnalysis(selectedArticles);
                      setMultiSelectMode(false);
                      setSelectedArticles([]);
                    }
                  }}
                  disabled={selectedArticles.length < 2}
                  className="w-full py-3 bg-black text-white rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-gray-900 transition-colors"
                >
                  {selectedArticles.length < 2
                    ? `Select ${2 - selectedArticles.length} more signal${selectedArticles.length === 1 ? '' : 's'} to compare`
                    : `⚡ Compound analysis — ${selectedArticles.length} signals`
                  }
                </button>
                <p className="text-xs text-gray-400 text-center mt-2">
                  Select 2–5 signals · Find hidden compound opportunities
                </p>
              </div>
            </div>
          )}

          {/* Filter Drawer */}
          {showFilterDrawer && (
            <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setShowFilterDrawer(false)} />
          )}

          <div
            className={`fixed right-0 top-0 bottom-0 z-50 w-80 bg-gradient-to-br from-white to-slate-50/50 shadow-2xl transform transition-transform duration-300 flex flex-col border-l border-slate-200/50 backdrop-blur-sm ${
              showFilterDrawer ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-200/50 bg-white/80">
              <h3 className="text-sm font-semibold text-slate-900">Feed Filters</h3>
              <button onClick={() => setShowFilterDrawer(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-4 space-y-6">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Market</p>
                <MarketModeSelector selectedMode={selectedMode} onModeChange={setSelectedMode} />
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Reading Mode</p>
                <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                  {([
                    { value: 'simple', label: 'Simple' },
                    { value: 'standard', label: 'Standard' },
                    { value: 'advanced', label: 'Detailed' },
                  ] as { value: 'simple' | 'standard' | 'advanced'; label: string }[]).map((opt, i) => (
                    <button
                      key={opt.value}
                      onClick={() => setReadingLevel(opt.value)}
                      className={`flex-1 py-2 text-xs font-medium ${
                        i > 0 ? 'border-l border-gray-200' : ''
                      } ${readingLevel === opt.value ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Sectors</p>
                <div className="space-y-1.5">
                  {ALL_SECTORS.map(sector => {
                    const cfg = SECTOR_CONFIGS[sector];
                    const isSelected = filters.sectors.includes(sector);
                    return (
                      <button
                        key={sector}
                        onClick={() => toggleSector(sector)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-xs font-medium transition-all ${
                          isSelected ? 'border-black bg-gray-50' : 'border-gray-200 text-gray-500'
                        }`}
                      >
                        <span>{cfg.label}</span>
                        <div
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                            isSelected ? 'bg-black border-black' : 'border-gray-300'
                          }`}
                        >
                          {isSelected && <span className="text-white text-xs">✓</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Time Range</p>
                <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                  {([
                    { value: '24h', label: 'Today' },
                    { value: '3d', label: '3 days' },
                    { value: '7d', label: '1 week' },
                  ] as { value: RecencyFilter; label: string }[]).map((opt, i) => (
                    <button
                      key={opt.value}
                      onClick={() => setFilters(prev => ({ ...prev, recency: opt.value }))}
                      className={`flex-1 py-2 text-xs font-medium ${
                        i > 0 ? 'border-l border-gray-200' : ''
                      } ${filters.recency === opt.value ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200/50 bg-white/80">
              <button
                onClick={() => {
                  setShowFilterDrawer(false);
                  fetchFeed(true);
                }}
                className="w-full py-3 bg-gradient-to-r from-slate-900 to-slate-700 text-white rounded-xl text-sm font-semibold hover:from-slate-800 hover:to-slate-600 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
