'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Loader2,
  X,
  FileUp,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
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

const capitalize = (s: string) => s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
const ALL_SECTORS: SectorKey[] = ['ai', 'policy', 'markets', 'funding', 'sustainability', 'realestate', 'health'];

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
  countryTags: string[];
  setCountryTags: (tags: string[]) => void;
  onQuickEdit?: () => void;
  showQuickEdit?: boolean;
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
  countryTags,
  setCountryTags,
  onQuickEdit,
  showQuickEdit = false,
}) => {
  const [inputMode, setInputMode] = useState<'paste' | 'feed'>('paste');
  const [showSettings, setShowSettings] = useState(false);
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

  useEffect(() => {
    if (inputMode === 'feed') fetchFeed();
  }, [inputMode, fetchKey, fetchFeed]);

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
      <div className="flex bg-white border border-gray-200 rounded-2xl p-1.5 mb-6 shadow-sm w-fit mx-auto">
        <button
          onClick={() => setInputMode('paste')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
            inputMode === 'paste'
              ? 'bg-black text-white shadow-lg'
              : 'text-gray-600 hover:text-black hover:bg-gray-50'
          }`}
        >
          <Edit3 className="w-4 h-4" />
          Paste Signal
        </button>
        <button
          onClick={() => setInputMode('feed')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
            inputMode === 'feed'
              ? 'bg-black text-white shadow-lg'
              : 'text-gray-600 hover:text-black hover:bg-gray-50'
          }`}
        >
          <Newspaper className="w-4 h-4" />
          Newsroom Feed
          {inputMode === 'feed' && (
            <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
          )}
        </button>
      </div>

      {inputMode === 'paste' ? (
        /* PASTE MODE */
        <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="border-b border-gray-100 px-8 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-serif font-bold text-gray-900 mb-1">Signal Desk</h2>
                <p className="text-sm text-gray-500">Paste your market signal to extract opportunities</p>
              </div>
              <Sparkles className="w-6 h-6 text-gray-300" />
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
                className="w-full h-64 bg-gray-50 border-0 rounded-2xl p-6 focus:ring-2 focus:ring-black focus:bg-white outline-none resize-none font-sans text-base leading-relaxed transition-all"
              />
              <div className="absolute bottom-6 right-6 text-gray-200">
                <Sparkles className="w-6 h-6" />
              </div>
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
                className="w-full bg-black text-white py-5 rounded-2xl text-base font-semibold hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 shadow-lg active:scale-[0.98]"
              >
                <Sparkles className="w-5 h-5" />
                Extract Opportunities
              </button>
            )}

            <div className="border-t border-gray-100 pt-6">
              <button
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                className="w-full flex items-center justify-between text-sm font-medium text-gray-600 hover:text-black transition-colors"
              >
                <span>Desk Settings</span>
                {showSettings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showSettings && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-6 space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
                        Location
                      </label>
                      <input
                        type="text"
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                        placeholder="e.g. Kingston, New York"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-black focus:bg-white outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
                        Focus / Niche
                      </label>
                      <input
                        type="text"
                        value={focus}
                        onChange={e => setFocus(e.target.value)}
                        placeholder="e.g. SaaS, Healthcare"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-black focus:bg-white outline-none transition-all"
                      />
                    </div>
                  </div>

                  <MarketModeSelector selectedMode={selectedMode} onModeChange={setSelectedMode} />
                </motion.div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* FEED MODE */
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-white border border-gray-200 rounded-2xl px-6 py-4 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <Newspaper className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-600">
                  {fetchingFeed ? 'Loading...' : `${signals.length} signals`}
                </span>
                {feedMeta && feedMeta.duplicatesRemoved > 0 && (
                  <span className="text-xs text-gray-400">
                    · {feedMeta.duplicatesRemoved} duplicates removed
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowFilterDrawer(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:border-gray-400 transition-colors"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filters
                  {(countryTags.length > 0 || filters.sectors.length < ALL_SECTORS.length) && (
                    <span className="w-2 h-2 rounded-full bg-black" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => fetchFeed(true)}
                  disabled={fetchingFeed}
                  className="p-2 text-gray-400 hover:text-black transition-colors"
                >
                  <RefreshCw className={`w-5 h-5 ${fetchingFeed ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Feed Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fetchingFeed
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3 animate-pulse shadow-sm"
                  >
                    <div className="flex gap-2">
                      <div className="h-4 bg-gray-100 w-16 rounded-md" />
                      <div className="h-4 bg-gray-100 w-10 rounded-md" />
                    </div>
                    <div className="h-12 bg-gray-100 rounded-lg" />
                    <div className="h-8 bg-gray-100 rounded-lg" />
                    <div className="h-10 bg-gray-100 rounded-xl" />
                  </div>
                ))
              : signals.length === 0
              ? <div className="col-span-full text-center py-16 text-gray-500 text-sm">
                  No signals found. Try widening your filters.
                </div>
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
                        scale: isAnalyzing ? 1.02 : isOtherAnalyzing ? 0.97 : 1,
                        opacity: isOtherAnalyzing ? 0.5 : 1,
                        filter: isOtherAnalyzing ? 'blur(1px)' : 'blur(0px)',
                      }}
                      transition={{ duration: 0.2 }}
                      className={`relative bg-white border rounded-2xl flex flex-col overflow-hidden border-l-4 ${
                        cfg.borderColor
                      } ${isOtherAnalyzing ? 'pointer-events-none' : ''} ${
                        isAnalyzing ? 'ring-2 ring-black shadow-xl' : 'shadow-sm hover:shadow-md'
                      } transition-all`}
                    >
                      {isAnalyzing ? (
                        <div className="p-5 flex flex-col gap-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-gray-500 uppercase truncate">
                              {sig.source}
                            </span>
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-md ${cfg.badgeBg} ${cfg.badgeText}`}>
                              {cfg.label}
                            </span>
                            <button
                              type="button"
                              onClick={handleCardCancel}
                              className="ml-auto flex items-center gap-1 text-xs text-gray-500 hover:text-red-500"
                            >
                              <X className="w-3 h-3" /> Cancel
                            </button>
                          </div>
                          <p className="text-sm font-semibold leading-snug">{sig.title}</p>
                          <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">{sig.snippet}</p>
                          <div className="border-t border-gray-100 pt-3" />
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-black" />
                            <span className="text-xs font-semibold text-black">{analyzeStage}</span>
                            <span className="ml-auto text-xs text-gray-500">{analyzeProgress}%</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <motion.div
                              className="h-full bg-black"
                              animate={{ width: `${analyzeProgress}%` }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="p-5 flex flex-col gap-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-gray-500 uppercase truncate">
                              {sig.source}
                            </span>
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-md ${cfg.badgeBg} ${cfg.badgeText}`}>
                              {cfg.label}
                            </span>
                            {sig.isLocalSource && (
                              <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-green-100 text-green-700">
                                Local
                              </span>
                            )}
                            <div className="ml-auto">
                              <SignalScoreBadge score={sig.signalScore} publishedAt={sig.publishedAt} />
                            </div>
                          </div>
                          <p className="text-sm font-semibold leading-snug line-clamp-2">{sig.title}</p>
                          <p className="text-xs text-gray-600 leading-relaxed line-clamp-2 flex-1">
                            {sig.snippet}
                          </p>
                          <button
                            type="button"
                            onClick={() => onAnalyzeSignal(sig)}
                            disabled={!!analyzingUrl}
                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-black text-white rounded-xl text-xs font-semibold hover:bg-gray-800 disabled:opacity-50 transition-all shadow-sm"
                          >
                            <Zap className="w-4 h-4" />
                            Analyze
                          </button>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
          </div>

          {/* Filter Drawer */}
          {showFilterDrawer && (
            <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setShowFilterDrawer(false)} />
          )}

          <div
            className={`fixed right-0 top-0 bottom-0 z-50 w-80 bg-white shadow-2xl transform transition-transform duration-300 flex flex-col ${
              showFilterDrawer ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold">Feed Filters</h3>
              <button onClick={() => setShowFilterDrawer(false)} className="text-gray-400 hover:text-black">
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-4 space-y-6">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Market</p>
                <MarketModeSelector selectedMode={selectedMode} onModeChange={setSelectedMode} />
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

            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowFilterDrawer(false);
                  fetchFeed(true);
                }}
                className="w-full py-3 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-900"
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
