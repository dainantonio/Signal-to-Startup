import React, { useState, useEffect } from 'react';
import { Search, Lightbulb, MapPin, Zap, TrendingUp, Loader2, X, RefreshCw, Radio } from 'lucide-react';
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
  input,
  setInput,
  urlInput,
  setUrlInput,
  fetchingUrl,
  fetchUrl,
  location,
  setLocation,
  focus,
  setFocus,
  loading,
  analyzeSignal,
  exampleSignals,
  selectedMode,
  setSelectedMode
}) => {
  const [inputMode, setInputMode] = useState<'paste' | 'feed'>('paste');
  const [signals, setSignals] = useState<Signal[]>([]);
  const [fetchingFeed, setFetchingFeed] = useState(false);

  const fetchFeed = async () => {
    setFetchingFeed(true);
    try {
      const response = await fetch('/api/live-feed');
      if (!response.ok) throw new Error('Failed to fetch feed');
      const data = await response.json();
      setSignals(data);
    } catch (err) {
      console.error('Error fetching live feed:', err);
    } finally {
      setFetchingFeed(false);
    }
  };

  useEffect(() => {
    if (inputMode === 'feed' && signals.length === 0) {
      fetchFeed();
    }
  }, [inputMode]);

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInMs = now.getTime() - past.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours === 1) return '1h ago';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const handleAnalyzeSignal = (signal: Signal) => {
    setInput(`${signal.title}\n\n${signal.snippet}`);
    setInputMode('paste');
    // Scroll to the analyze button area
    const analyzeBtn = document.getElementById('analyze-actions');
    if (analyzeBtn) {
      analyzeBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <section id="step-1" className="scroll-mt-24 grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
      <div className="lg:col-span-2 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#141414] text-[#E4E3E0] flex items-center justify-center font-mono text-xs">01</div>
            <h2 className="text-2xl font-serif italic border-b border-[#141414] pb-2 flex-grow">Signal Ingestion</h2>
          </div>
          
          {/* Tab Toggle */}
          <div className="flex bg-white border-2 border-[#141414] p-1 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]">
            <button
              onClick={() => setInputMode('paste')}
              className={`px-4 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-all ${
                inputMode === 'paste' ? 'bg-[#141414] text-[#E4E3E0]' : 'hover:bg-gray-100'
              }`}
            >
              Paste Signal
            </button>
            <button
              onClick={() => setInputMode('feed')}
              className={`px-4 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-all flex items-center gap-2 ${
                inputMode === 'feed' ? 'bg-[#141414] text-[#E4E3E0]' : 'hover:bg-gray-100'
              }`}
            >
              <Radio className={`w-3 h-3 ${inputMode === 'feed' ? 'animate-pulse' : ''}`} />
              Live Feed
            </button>
          </div>
        </div>

        {inputMode === 'paste' ? (
          <>
            {/* URL Fetcher */}
            <div className="flex gap-2 mb-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="Or paste a URL to fetch content (e.g. news article)..."
                  className="w-full bg-white border-2 border-[#141414] p-3 pl-10 pr-10 focus:outline-none font-mono text-sm shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
                {urlInput && (
                  <button 
                    onClick={() => setUrlInput('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 opacity-30 hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                onClick={fetchUrl}
                disabled={fetchingUrl || !urlInput.trim()}
                className="bg-[#141414] text-[#E4E3E0] px-6 py-3 font-mono text-[10px] uppercase tracking-widest hover:bg-black disabled:opacity-50 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]"
              >
                {fetchingUrl ? <Loader2 className="w-4 h-4 animate-spin" /> : "Fetch"}
              </button>
            </div>

            <div className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste news article, policy update, or market summary here..."
                className="w-full h-64 bg-white border-2 border-[#141414] p-4 focus:outline-none focus:ring-0 focus:border-black transition-all resize-none font-mono text-sm leading-relaxed shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]"
              />
              <div className="absolute bottom-4 right-4 opacity-30">
                <Zap className="w-6 h-6" />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <span className="text-[10px] font-mono uppercase opacity-50 w-full mb-1 flex items-center gap-1">
                <Lightbulb className="w-3 h-3" /> Try an example signal:
              </span>
              {exampleSignals.map((sig, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setInput(sig.text);
                    setLocation(sig.location);
                    setFocus(sig.focus);
                  }}
                  className="px-3 py-1 bg-white border border-[#141414] text-[10px] font-mono uppercase hover:bg-[#141414] hover:text-[#E4E3E0] transition-all shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] active:shadow-none active:translate-x-[1px] active:translate-y-[1px]"
                >
                  {sig.label}
                </button>
              ))}
            </div>
          </>
        ) : (
          /* Live Feed UI */
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono uppercase opacity-50 flex items-center gap-2">
                <Radio className="w-3 h-3 text-red-500 animate-pulse" />
                Real-time signals from global markets
              </span>
              <button 
                onClick={fetchFeed}
                disabled={fetchingFeed}
                className="p-2 hover:bg-white border border-transparent hover:border-[#141414] transition-all"
              >
                <RefreshCw className={`w-4 h-4 ${fetchingFeed ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fetchingFeed ? (
                /* Loading Skeletons */
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-white border-2 border-[#141414] p-4 space-y-3 animate-pulse shadow-[4px_4px_0px_0px_rgba(20,20,20,0.1)]">
                    <div className="h-4 bg-gray-200 w-20 rounded" />
                    <div className="h-12 bg-gray-200 w-full rounded" />
                    <div className="flex justify-between">
                      <div className="h-3 bg-gray-200 w-24 rounded" />
                      <div className="h-3 bg-gray-200 w-12 rounded" />
                    </div>
                  </div>
                ))
              ) : (
                signals.map((sig, i) => (
                  <div key={i} className="bg-white border-2 border-[#141414] p-4 flex flex-col justify-between hover:shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] transition-all group shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className={`px-2 py-0.5 text-[9px] font-mono uppercase font-bold border border-[#141414] ${
                          sig.category === 'Tech' ? 'bg-indigo-100 text-indigo-700' :
                          sig.category === 'Policy' ? 'bg-amber-100 text-amber-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>
                          {sig.category}
                        </span>
                        <span className="text-[9px] font-mono opacity-40 uppercase">{getTimeAgo(sig.publishedAt)}</span>
                      </div>
                      <h4 className="text-sm font-serif italic font-bold leading-tight mb-2 group-hover:underline">
                        {sig.title.length > 80 ? `${sig.title.substring(0, 80)}...` : sig.title}
                      </h4>
                      <p className="text-[10px] font-mono opacity-60 mb-4">Source: {sig.source}</p>
                    </div>
                    <button
                      onClick={() => handleAnalyzeSignal(sig)}
                      className="w-full py-2 bg-[#141414] text-[#E4E3E0] font-mono text-[10px] uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2"
                    >
                      Analyze This Signal →
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        
        <div id="analyze-actions" className="flex flex-col md:flex-row gap-4 mt-6">
          <div className="flex-1 relative">
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location (e.g. New York, London, Tokyo)"
              className="w-full bg-white border-2 border-[#141414] p-3 pl-10 focus:outline-none font-mono text-sm shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]"
            />
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
          </div>
          <div className="flex-1 relative">
            <input
              type="text"
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              placeholder="Focus/Niche (e.g. Vending, Courier, SaaS)"
              className="w-full bg-white border-2 border-[#141414] p-3 pl-10 focus:outline-none font-mono text-sm shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]"
            />
            <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
          </div>
          <button
            onClick={analyzeSignal}
            disabled={loading || !input.trim()}
            className="bg-[#141414] text-[#E4E3E0] px-8 py-3 font-mono text-sm uppercase tracking-widest hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] active:translate-x-1 active:translate-y-1 active:shadow-none"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4" />
                Extract Opportunities
              </>
            )}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white border border-[#141414] p-6 space-y-4">
          <h3 className="font-serif italic text-xl border-b border-[#141414] pb-2">Agent Directives</h3>
          <ul className="space-y-3 text-sm font-mono">
            <li className="flex gap-2">
              <span className="text-[#141414] font-bold">01</span>
              <span>Identify regulatory & tech shifts</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[#141414] font-bold">02</span>
              <span>Focus on execution speed</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[#141414] font-bold">03</span>
              <span>Target underserved markets</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[#141414] font-bold">04</span>
              <span>Monetization-first thinking</span>
            </li>
          </ul>
        </div>

        <div className="bg-white border border-[#141414] p-6 space-y-4">
          <h3 className="font-serif italic text-xl border-b border-[#141414] pb-2">Market Mode</h3>
          <MarketModeSelector selectedMode={selectedMode} onModeChange={setSelectedMode} />
          <p className="text-[10px] font-mono opacity-60 leading-relaxed">
            Switching modes adjusts the AI's strategic context and recommended funding sources.
          </p>
        </div>
      </div>
    </section>
  );
};
