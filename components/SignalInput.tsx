'use client';

import React, { useState, useEffect } from 'react';
import { Search, Lightbulb, MapPin, Zap, TrendingUp, Loader2, X, RefreshCw, Sparkles } from 'lucide-react';
import { MarketMode } from './types';
import { MarketModeSelector } from './MarketModeSelector';

interface Signal {
  title: string;
  source: string;
  publishedAt: string;
  url: string;
  category: 'Tech' | 'Policy' | 'Markets';
  snippet: string;
}

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
  const [signals, setSignals] = useState<Signal[]>([]);
  const [fetchingFeed, setFetchingFeed] = useState(false);

  const fetchFeed = async () => {
    setFetchingFeed(true);
    try {
      const res = await fetch('/api/live-feed');
      if (!res.ok) throw new Error('Failed');
      setSignals(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setFetchingFeed(false);
    }
  };

  useEffect(() => {
    if (inputMode === 'feed' && signals.length === 0) fetchFeed();
  }, [inputMode]);

  const timeAgo = (d: string) => {
    const h = Math.floor((Date.now() - new Date(d).getTime()) / 3600000);
    return h < 1 ? 'Just now' : h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
  };

  const onAnalyzeSignal = (sig: Signal) => {
    setInput(`${sig.title}\n\n${sig.snippet}`);
    setInputMode('paste');
    setTimeout(() => document.getElementById('analyze-actions')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
  };

  const catStyle: Record<string, string> = {
    Tech: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    Policy: 'bg-amber-50 text-amber-700 border-amber-100',
    Markets: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  };

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
        <button
          onClick={() => setInputMode('paste')}
          className={`flex-1 py-3 rounded-xl font-mono text-[11px] uppercase tracking-wider transition-all duration-200 ${inputMode === 'paste' ? 'bg-foreground text-background shadow-lg shadow-foreground/10' : 'text-muted hover:text-foreground hover:bg-gray-50'}`}
        >Paste Signal</button>
        <button
          onClick={() => setInputMode('feed')}
          className={`flex-1 py-3 rounded-xl font-mono text-[11px] uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 ${inputMode === 'feed' ? 'bg-foreground text-background shadow-lg shadow-foreground/10' : 'text-muted hover:text-foreground hover:bg-gray-50'}`}
        >
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${inputMode === 'feed' ? 'bg-red-400 animate-pulse' : 'bg-gray-300'}`} />
          Live Feed
        </button>
      </div>

      {inputMode === 'paste' ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative group">
              <input
                type="text" value={urlInput} onChange={e => setUrlInput(e.target.value)}
                placeholder="Paste a URL to fetch content..."
                className="w-full bg-white border border-border/10 rounded-xl p-4 pl-11 pr-10 focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none font-sans text-sm transition-all shadow-sm"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
              {urlInput && <button onClick={() => setUrlInput('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"><X className="w-4 h-4" /></button>}
            </div>
            <button onClick={fetchUrl} disabled={fetchingUrl || !urlInput.trim()}
              className="bg-foreground text-background px-8 py-4 rounded-xl font-mono text-[11px] uppercase tracking-widest hover:bg-foreground/90 disabled:opacity-40 transition-all shadow-lg shadow-foreground/5 flex-shrink-0 flex items-center justify-center gap-2">
              {fetchingUrl ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Fetch Content'}
            </button>
          </div>

          <div className="relative group">
            <textarea
              value={input} onChange={e => setInput(e.target.value)}
              placeholder="Paste a news article, policy update, or market signal here..."
              className="w-full h-48 md:h-64 bg-white border border-border/10 rounded-2xl p-6 focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none resize-none font-sans text-base leading-relaxed transition-all shadow-sm"
            />
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
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <span className="text-[10px] font-mono uppercase text-muted flex items-center gap-2">
              <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />Real-time market signals
            </span>
            <button onClick={fetchFeed} disabled={fetchingFeed} className="p-2 hover:bg-white border border-transparent hover:border-border/10 rounded-lg transition-all text-muted hover:text-foreground">
              <RefreshCw className={`w-4 h-4 ${fetchingFeed ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fetchingFeed
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-white border border-border/10 rounded-2xl p-6 space-y-4 animate-pulse shadow-sm">
                    <div className="h-4 bg-gray-100 w-20 rounded-lg" /><div className="h-12 bg-gray-100 rounded-xl" /><div className="h-4 bg-gray-100 w-32 rounded-lg" />
                  </div>
                ))
              : signals.map((sig, i) => (
                  <div key={i} className="group bg-white border border-border/10 rounded-2xl p-6 flex flex-col gap-4 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300">
                    <div className="flex justify-between items-start gap-2">
                      <span className={`px-2.5 py-1 text-[9px] font-mono uppercase font-bold border rounded-md ${catStyle[sig.category]}`}>{sig.category}</span>
                      <span className="text-[9px] font-mono text-muted flex-shrink-0">{timeAgo(sig.publishedAt)}</span>
                    </div>
                    <p className="text-lg font-serif italic font-bold leading-tight group-hover:text-primary transition-colors">{sig.title.length > 80 ? `${sig.title.substring(0, 80)}...` : sig.title}</p>
                    <p className="text-[10px] font-mono text-muted truncate">Source: {sig.source}</p>
                    <button onClick={() => onAnalyzeSignal(sig)}
                      className="w-full py-3 bg-foreground text-background rounded-xl font-mono text-[10px] uppercase tracking-widest hover:bg-foreground/90 transition-all mt-auto shadow-lg shadow-foreground/5">
                      Analyze Signal →
                    </button>
                  </div>
                ))}
          </div>
        </div>
      )}

      <div id="analyze-actions" className="mt-8 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative group">
            <input type="text" value={location} onChange={e => setLocation(e.target.value)}
              placeholder="Location (e.g. Kingston, New York)"
              className="w-full bg-white border border-border/10 rounded-xl p-4 pl-11 focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none font-sans text-sm transition-all shadow-sm" />
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
          </div>
          <div className="relative group">
            <input type="text" value={focus} onChange={e => setFocus(e.target.value)}
              placeholder="Niche (e.g. Vending, SaaS, Courier)"
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
