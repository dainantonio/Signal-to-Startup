'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Lightbulb, MapPin, Zap, TrendingUp, Loader2, X, RefreshCw, Sparkles } from 'lucide-react';
import { MarketMode, FeedSignal, SectorKey, RecencyFilter, FeedFilters, SECTOR_CONFIGS } from './types';
import { MarketModeSelector } from './MarketModeSelector';

const ALL_SECTORS: SectorKey[] = ['ai', 'policy', 'markets', 'funding', 'sustainability', 'realestate', 'health'];

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
  analyzeSignal: () => void;
  exampleSignals: { label: string; text: string; location: string; focus: string }[];
  selectedMode: MarketMode;
  setSelectedMode: (mode: MarketMode) => void;
}

export const SignalInput: React.FC<SignalInputProps> = ({
  input, setInput, urlInput, setUrlInput, fetchingUrl, fetchUrl,
  location, setLocation, focus, setFocus, loading, analyzeSignal,
  exampleSignals, selectedMode, setSelectedMode,
}) => {
  const [inputMode, setInputMode] = useState<'paste' | 'feed'>('paste');
  const [signals, setSignals] = useState<FeedSignal[]>([]);
  const [fetchingFeed, setFetchingFeed] = useState(false);
  const [lastFetchKey, setLastFetchKey] = useState('');
  const [filters, setFilters] = useState<FeedFilters>({ sectors: ALL_SECTORS, recency: '3d' });

  const fetchKey = `${selectedMode}|${filters.sectors.join(',')}|${filters.recency}|${focus}`;

  const fetchFeed = useCallback(async (force = false) => {
    if (!force && fetchKey === lastFetchKey && signals.length > 0) return;
    setFetchingFeed(true);
    try {
      const params = new URLSearchParams({
        sectors: filters.sectors.join(','),
        region: selectedMode,
        niche: focus.trim(),
        recency: filters.recency,
      });
      const res = await fetch(`/api/live-feed?${params.toString()}`);
      if (!res.ok) throw new Error('Feed fetch failed');
      setSignals(await res.json());
      setLastFetchKey(fetchKey);
    } catch (err) {
      console.error('Feed error:', err);
    } finally {
      setFetchingFeed(false);
    }
  }, [fetchKey, lastFetchKey, signals.length, filters, selectedMode, focus]);

  useEffect(() => {
    if (inputMode === 'feed') fetchFeed();
  }, [inputMode, fetchKey]);

  const timeAgo = (d: string) => {
    const h = Math.floor((Date.now() - new Date(d).getTime()) / 3600000);
    return h < 1 ? 'Just now' : h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
  };

  const onAnalyzeSignal = (sig: FeedSignal) => {
    setInput(`${sig.title}\n\n${sig.snippet}`);
    setInputMode('paste');
    setTimeout(() => document.getElementById('analyze-actions')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
  };

  const toggleSector = (key: SectorKey) => {
    setFilters(prev => {
      const has = prev.sectors.includes(key);
      if (has && prev.sectors.length === 1) return prev;
      return { ...prev, sectors: has ? prev.sectors.filter(s => s !== key) : [...prev.sectors, key] };
    });
  };

  const StrengthDots = ({ strength }: { strength: number }) => (
    <div className="flex gap-0.5 items-center" title={`Signal strength: ${strength}/5`}>
      {[1,2,3,4,5].map(i => (
        <div key={i} className={`w-1 h-2.5 rounded-full ${i <= strength ? 'bg-primary' : 'bg-gray-200'}`} />
      ))}
    </div>
  );

  return (
    <section id="step-1" className="scroll-mt-24 mb-12">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-10 h-10 rounded-xl bg-foreground text-background flex items-center justify-center font-mono text-sm font-bold flex-shrink-0 shadow-lg shadow-foreground/10">01</div>
        <div className="flex-grow">
          <h2 className="text-2xl font-serif italic font-bold">Signal Ingestion</h2>
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted">Identify the market shift</p>
        </div>
      </div>

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
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative group">
              <input type="text" value={urlInput} onChange={e => setUrlInput(e.target.value)} placeholder="Paste a URL to fetch content..."
                className="w-full bg-white border border-border/10 rounded-xl p-4 pl-11 pr-10 focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none font-sans text-sm transition-all shadow-sm" />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
              {urlInput && <button onClick={() => setUrlInput('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"><X className="w-4 h-4" /></button>}
            </div>
            <button onClick={fetchUrl} disabled={fetchingUrl || !urlInput.trim()}
              className="bg-foreground text-background px-8 py-4 rounded-xl font-mono text-[11px] uppercase tracking-widest hover:bg-foreground/90 disabled:opacity-40 transition-all shadow-lg shadow-foreground/5 flex-shrink-0 flex items-center justify-center gap-2">
              {fetchingUrl ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Fetch Content'}
            </button>
          </div>
          <div className="relative group">
            <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Paste a news article, policy update, or market signal here..."
              className="w-full h-48 md:h-64 bg-white border border-border/10 rounded-2xl p-6 focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none resize-none font-sans text-base leading-relaxed transition-all shadow-sm" />
            <div className="absolute bottom-4 right-4 text-primary/20 group-focus-within:text-primary/40 transition-colors"><Sparkles className="w-6 h-6" /></div>
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
              <button onClick={() => fetchFeed(true)} disabled={fetchingFeed}
                className="p-2 hover:bg-white border border-transparent hover:border-border/10 rounded-lg transition-all text-muted hover:text-foreground" title="Refresh">
                <RefreshCw className={`w-4 h-4 ${fetchingFeed ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Feed cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fetchingFeed
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white border border-border/10 rounded-2xl p-6 space-y-4 animate-pulse shadow-sm">
                    <div className="h-4 bg-gray-100 w-20 rounded-lg" /><div className="h-14 bg-gray-100 rounded-xl" /><div className="h-4 bg-gray-100 w-32 rounded-lg" /><div className="h-10 bg-gray-100 rounded-xl" />
                  </div>
                ))
              : signals.length === 0
              ? <div className="col-span-2 text-center py-16 text-muted font-mono text-xs uppercase tracking-widest">No signals found. Try widening your filters.</div>
              : signals.map((sig, i) => {
                  const cfg = SECTOR_CONFIGS[sig.sector] ?? SECTOR_CONFIGS.markets;
                  return (
                    <div key={i} className={`group bg-white border border-border/10 rounded-2xl p-5 flex flex-col gap-4 shadow-sm hover:shadow-md transition-all duration-300 border-l-4 ${cfg.borderColor}`}>
                      <div className="flex justify-between items-start gap-2">
                        <span className={`px-2.5 py-1 text-[9px] font-mono uppercase font-bold rounded-md ${cfg.badgeBg} ${cfg.badgeText}`}>{cfg.label}</span>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <StrengthDots strength={sig.strength} />
                          <span className="text-[9px] font-mono text-muted">{timeAgo(sig.publishedAt)}</span>
                        </div>
                      </div>
                      <p className="text-base font-serif italic font-bold leading-snug">
                        {sig.title.length > 90 ? `${sig.title.substring(0, 90)}...` : sig.title}
                      </p>
                      <p className="text-xs text-muted leading-relaxed line-clamp-2">{sig.snippet}</p>
                      <div className="flex items-center justify-between gap-3 mt-auto">
                        <span className="text-[9px] font-mono text-muted truncate">
                          {sig.source}
                          {sig.url && sig.url !== '#' && (
                            <a href={sig.url} target="_blank" rel="noopener noreferrer" className="ml-2 text-primary hover:underline" onClick={e => e.stopPropagation()}>↗</a>
                          )}
                        </span>
                        <button onClick={() => onAnalyzeSignal(sig)}
                          className="flex-shrink-0 px-4 py-2 bg-foreground text-background rounded-xl font-mono text-[9px] uppercase tracking-widest hover:bg-foreground/90 transition-all shadow-sm">
                          Analyze →
                        </button>
                      </div>
                    </div>
                  );
                })
            }
          </div>
        </div>
      )}

      <div id="analyze-actions" className="mt-8 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative group">
            <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="Location (e.g. Kingston, New York)"
              className="w-full bg-white border border-border/10 rounded-xl p-4 pl-11 focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none font-sans text-sm transition-all shadow-sm" />
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
          </div>
          <div className="relative group">
            <input type="text" value={focus} onChange={e => setFocus(e.target.value)} placeholder="Niche (e.g. Vending, SaaS, Courier)"
              className="w-full bg-white border border-border/10 rounded-xl p-4 pl-11 focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none font-sans text-sm transition-all shadow-sm" />
            <Zap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
          </div>
        </div>
        <MarketModeSelector selectedMode={selectedMode} onModeChange={setSelectedMode} />
        <button onClick={analyzeSignal} disabled={loading || !input.trim()}
          className="w-full bg-primary text-white py-5 rounded-2xl font-mono text-sm uppercase tracking-widest hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 shadow-xl shadow-primary/20 active:scale-[0.98]">
          {loading ? (<><Loader2 className="w-5 h-5 animate-spin" />Analyzing Signal...</>) : (<><TrendingUp className="w-5 h-5" />Extract Opportunities</>)}
        </button>
      </div>
    </section>
  );
};
