'use client';

import React, { useState, useEffect } from 'react';
import { Search, Lightbulb, MapPin, Zap, TrendingUp, Loader2, X, RefreshCw } from 'lucide-react';
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
    Tech: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    Policy: 'bg-amber-50 text-amber-700 border-amber-200',
    Markets: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  return (
    <section id="step-1" className="scroll-mt-24 mb-10">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-full bg-[#141414] text-[#E4E3E0] flex items-center justify-center font-mono text-xs flex-shrink-0">01</div>
        <h2 className="text-2xl font-serif italic border-b border-[#141414] pb-2 flex-grow">Signal Ingestion</h2>
      </div>

      <div className="flex w-full bg-white border-2 border-[#141414] shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] mb-4">
        <button
          onClick={() => setInputMode('paste')}
          className={`flex-1 py-2.5 font-mono text-[11px] uppercase tracking-wider transition-all ${inputMode === 'paste' ? 'bg-[#141414] text-[#E4E3E0]' : 'hover:bg-gray-50'}`}
        >Paste Signal</button>
        <button
          onClick={() => setInputMode('feed')}
          className={`flex-1 py-2.5 font-mono text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${inputMode === 'feed' ? 'bg-[#141414] text-[#E4E3E0]' : 'hover:bg-gray-50'}`}
        >
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${inputMode === 'feed' ? 'bg-red-400 animate-pulse' : 'bg-gray-300'}`} />
          Live Feed
        </button>
      </div>

      {inputMode === 'paste' ? (
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text" value={urlInput} onChange={e => setUrlInput(e.target.value)}
                placeholder="Or paste a URL to fetch content..."
                className="w-full bg-white border-2 border-[#141414] p-3 pl-9 pr-8 focus:outline-none font-mono text-sm shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 opacity-40" />
              {urlInput && <button onClick={() => setUrlInput('')} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-30 hover:opacity-80"><X className="w-3.5 h-3.5" /></button>}
            </div>
            <button onClick={fetchUrl} disabled={fetchingUrl || !urlInput.trim()}
              className="bg-[#141414] text-[#E4E3E0] px-5 py-3 font-mono text-[11px] uppercase tracking-widest hover:bg-black disabled:opacity-40 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] flex-shrink-0">
              {fetchingUrl ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Fetch'}
            </button>
          </div>

          <div className="relative">
            <textarea
              value={input} onChange={e => setInput(e.target.value)}
              placeholder="Paste a news article, policy update, or market signal here..."
              className="w-full h-44 md:h-56 bg-white border-2 border-[#141414] p-4 focus:outline-none resize-none font-mono text-sm leading-relaxed shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]"
            />
            <div className="absolute bottom-3 right-3 opacity-20"><Zap className="w-5 h-5" /></div>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[10px] font-mono uppercase opacity-40 flex items-center gap-1 w-full"><Lightbulb className="w-3 h-3" /> Try an example:</span>
            {exampleSignals.map((sig, i) => (
              <button key={i} onClick={() => { setInput(sig.text); setLocation(sig.location); setFocus(sig.focus); }}
                className="px-3 py-1.5 bg-white border border-[#141414] text-[10px] font-mono uppercase hover:bg-[#141414] hover:text-[#E4E3E0] transition-all shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] active:shadow-none active:translate-x-px active:translate-y-px">
                {sig.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono uppercase opacity-40 flex items-center gap-2">
              <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />Real-time signals
            </span>
            <button onClick={fetchFeed} disabled={fetchingFeed} className="p-2 hover:bg-white border border-transparent hover:border-[#141414] rounded transition-all">
              <RefreshCw className={`w-4 h-4 ${fetchingFeed ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {fetchingFeed
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-white border-2 border-[#141414] p-4 space-y-3 animate-pulse">
                    <div className="h-3 bg-gray-200 w-16 rounded" /><div className="h-10 bg-gray-200 rounded" /><div className="h-3 bg-gray-200 w-24 rounded" />
                  </div>
                ))
              : signals.map((sig, i) => (
                  <div key={i} className="bg-white border-2 border-[#141414] p-4 flex flex-col gap-3 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] hover:shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] transition-all">
                    <div className="flex justify-between items-start gap-2">
                      <span className={`px-2 py-0.5 text-[9px] font-mono uppercase font-bold border ${catStyle[sig.category]}`}>{sig.category}</span>
                      <span className="text-[9px] font-mono opacity-30 flex-shrink-0">{timeAgo(sig.publishedAt)}</span>
                    </div>
                    <p className="text-sm font-serif italic font-bold leading-snug">{sig.title.length > 80 ? `${sig.title.substring(0, 80)}...` : sig.title}</p>
                    <p className="text-[10px] font-mono opacity-50 truncate">Source: {sig.source}</p>
                    <button onClick={() => onAnalyzeSignal(sig)}
                      className="w-full py-2.5 bg-[#141414] text-[#E4E3E0] font-mono text-[10px] uppercase tracking-wider hover:bg-black transition-all mt-auto">
                      Analyze →
                    </button>
                  </div>
                ))}
          </div>
        </div>
      )}

      <div id="analyze-actions" className="mt-5 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <input type="text" value={location} onChange={e => setLocation(e.target.value)}
              placeholder="Location (e.g. Kingston, New York)"
              className="w-full bg-white border-2 border-[#141414] p-3 pl-9 focus:outline-none font-mono text-sm shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]" />
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 opacity-40" />
          </div>
          <div className="relative">
            <input type="text" value={focus} onChange={e => setFocus(e.target.value)}
              placeholder="Niche (e.g. Vending, SaaS, Courier)"
              className="w-full bg-white border-2 border-[#141414] p-3 pl-9 focus:outline-none font-mono text-sm shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]" />
            <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 opacity-40" />
          </div>
        </div>

        <MarketModeSelector selectedMode={selectedMode} onModeChange={setSelectedMode} />

        <button onClick={analyzeSignal} disabled={loading || !input.trim()}
          className="w-full bg-[#141414] text-[#E4E3E0] py-4 font-mono text-sm uppercase tracking-widest hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 shadow-[4px_4px_0px_0px_rgba(20,20,20,0.3)] active:translate-x-px active:translate-y-px active:shadow-none">
          {loading ? (<><Loader2 className="w-4 h-4 animate-spin" />Analyzing...</>) : (<><TrendingUp className="w-4 h-4" />Extract Opportunities</>)}
        </button>
      </div>
    </section>
  );
};
