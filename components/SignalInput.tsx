import React from 'react';
import { Search, Lightbulb, MapPin, Zap, TrendingUp, Loader2 } from 'lucide-react';

interface SignalInputProps {
  input: string;
  setInput: (val: string) => void;
  location: string;
  setLocation: (val: string) => void;
  focus: string;
  setFocus: (val: string) => void;
  loading: boolean;
  analyzeSignal: () => void;
  exampleSignals: { label: string; text: string; location: string; focus: string }[];
}

export const SignalInput: React.FC<SignalInputProps> = ({
  input,
  setInput,
  location,
  setLocation,
  focus,
  setFocus,
  loading,
  analyzeSignal,
  exampleSignals
}) => {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-[#141414] text-[#E4E3E0] flex items-center justify-center font-mono text-xs">01</div>
          <h2 className="text-2xl font-serif italic border-b border-[#141414] pb-2 flex-grow">Signal Ingestion</h2>
        </div>
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste news article, policy update, or market summary here..."
            className="w-full h-48 bg-white border-2 border-[#141414] p-4 focus:outline-none focus:ring-0 focus:border-black transition-all resize-none font-mono text-sm shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]"
          />
          <div className="absolute bottom-4 right-4 opacity-30">
            <Search className="w-6 h-6" />
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
        
        <div className="flex flex-col md:flex-row gap-4 mt-6">
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
    </section>
  );
};
