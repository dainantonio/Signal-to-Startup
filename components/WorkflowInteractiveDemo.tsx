import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Rocket, 
  Play, 
  ArrowRight, 
  Loader2, 
  Zap, 
  Newspaper,
  TrendingUp,
  FileText,
  Target,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  Clock
} from 'lucide-react';
import confetti from 'canvas-confetti';

const MOCK_ARTICLES = [
  { source: 'TechCrunch', title: 'The rise of specialized AI agents in logistics.', category: 'AI & TECH', badge: 'bg-indigo-100 text-indigo-700' },
  { source: 'Reuters', title: 'Global supply chains shifting to hyper-local hubs.', category: 'MARKETS', badge: 'bg-emerald-100 text-emerald-700' },
  { source: 'World Economic Forum', title: 'Sustainability becomes core requirement for EU exports.', category: 'POLICY', badge: 'bg-amber-100 text-amber-700' },
];

const MOCK_OPPORTUNITIES = [
  { name: 'Hyper-Local Logistics Hub', score: 94, cost: '$2-5k', speed: 'Fast', icon: '📦' },
  { name: 'AI Supply Chain Scout', score: 88, cost: '$500+', speed: 'Medium', icon: '🔍' },
  { name: 'Sustainable Labeling SaaS', score: 82, cost: '$1k+', speed: 'Fast', icon: '🏷️' },
];

export const WorkflowInteractiveDemo = () => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStage, setLoadingStage] = useState('');

  const fireConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444']
    });
  };

  const handleAnalyze = () => {
    setStep(2);
    setLoadingProgress(0);
    const stages = [
      { p: 20, l: 'Reading signal...' },
      { p: 45, l: 'Identifying market gaps...' },
      { p: 75, l: 'Scoring opportunities...' },
      { p: 100, l: 'Analysis complete!' },
    ];
    
    stages.forEach((s, i) => {
      setTimeout(() => {
        setLoadingProgress(s.p);
        setLoadingStage(s.l);
        if (i === stages.length - 1) {
          setTimeout(() => setStep(3), 800);
        }
      }, (i + 1) * 1000);
    });
  };

  const handleDeepDive = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setStep(4);
      fireConfetti();
    }, 2000);
  };

  const reset = () => {
    setStep(1);
    setLoadingProgress(0);
    setLoadingStage('');
  };

  return (
    <div className="w-full max-w-5xl mx-auto rounded-[2.5rem] border border-gray-200 bg-white/60 backdrop-blur-3xl shadow-2xl shadow-black/5 overflow-hidden flex flex-col md:flex-row relative z-20">
      
      {/* Sidebar Navigation */}
      <div className="w-full md:w-72 bg-gray-50/80 border-b md:border-b-0 md:border-r border-gray-200 p-6 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible no-scrollbar">
        <div className="hidden md:block mb-8 px-2">
          <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center shadow-lg shadow-black/20">
             <Zap className="w-5 h-5 text-white" />
          </div>
        </div>
        
        {[
          { id: 1, label: 'Signal Feed', icon: Newspaper, color: 'text-blue-500' },
          { id: 2, label: 'Deep Analysis', icon: TrendingUp, color: 'text-indigo-500' },
          { id: 3, label: 'Opportunities', icon: Target, color: 'text-emerald-500' },
          { id: 4, label: 'Execution', icon: ShieldCheck, color: 'text-rose-500' },
        ].map((s) => {
          const Icon = s.icon;
          const isActive = step === s.id;
          const isCompleted = step > s.id;
          return (
            <button 
              key={s.id}
              onClick={() => step > s.id && setStep(s.id as any)} 
              disabled={step < s.id}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all whitespace-nowrap ${
                isActive 
                  ? 'bg-white shadow-md border border-gray-100 text-black translate-x-1' 
                  : isCompleted 
                  ? 'text-gray-900 hover:bg-white/50' 
                  : 'text-gray-400 opacity-50 cursor-not-allowed'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? s.color : isCompleted ? 'text-black' : ''}`} />
              <span className="flex-1 text-left">{s.id}. {s.label}</span>
              {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
            </button>
          );
        })}

        {step === 4 && (
          <button 
            onClick={reset} 
            className="mt-auto hidden md:flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest font-black text-gray-400 hover:text-black py-4 transition-colors"
          >
            <Zap className="w-3 h-3" /> Restart Journey
          </button>
        )}
      </div>

      {/* Main Interactive Area */}
      <div className="flex-1 bg-white/40 p-8 md:p-12 min-h-[460px] flex flex-col justify-center relative overflow-hidden">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: Discovery Feed */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -40 }} className="space-y-6">
              <div className="space-y-2 mb-8">
                <div className="inline-flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full mb-2">
                  <Sparkles className="w-3 h-3" /> Real-Time Signal Feed
                </div>
                <h2 className="text-3xl font-bold font-serif italic text-gray-900 leading-tight">Your market never sleeps.<br />Neither does Scouting.</h2>
                <p className="text-sm text-gray-500 max-w-md">Gemini monitors 100+ RSS sources globally. Find a signal that peaks your interest.</p>
              </div>

              <div className="grid gap-3">
                {MOCK_ARTICLES.map((article, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-5 border border-gray-100 rounded-2xl bg-white shadow-sm hover:shadow-xl hover:border-black/10 transition-all cursor-pointer group flex items-start gap-4 relative overflow-hidden"
                    onClick={handleAnalyze}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-[10px] font-black text-gray-400 uppercase">{article.source}</span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${article.badge}`}>{article.category}</span>
                      </div>
                      <h3 className="font-bold text-gray-900 group-hover:text-black transition-colors text-sm">{article.title}</h3>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div className="absolute bottom-0 left-0 h-1 bg-black w-0 group-hover:w-full transition-all duration-500" />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 2: Analysis Animation */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center text-center space-y-8">
              <div className="relative">
                <div className="w-24 h-24 border-4 border-indigo-50 rounded-full flex items-center justify-center">
                  <div className="absolute inset-0 border-t-4 border-black rounded-full animate-spin" />
                  <TrendingUp className="w-8 h-8 text-black" />
                </div>
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl font-bold font-serif italic text-gray-900">{loadingStage}</h2>
                <p className="text-sm text-gray-500 max-w-xs mx-auto">Distilling signal into actionable startup business models...</p>
              </div>
              <div className="w-full max-w-xs space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase text-gray-400 tracking-tighter">
                  <span>Logic Processor</span>
                  <span>{loadingProgress}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200 p-0.5">
                  <motion.div 
                    className="h-full bg-black rounded-full shadow-[0_0_10px_rgba(0,0,0,0.2)]"
                    animate={{ width: `${loadingProgress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Opportunity Matrix */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 1.05 }} className="space-y-6">
              <div className="space-y-2 mb-6">
                <div className="inline-flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full mb-2">
                  <TrendingUp className="w-3 h-3" /> Synthesis Analysis Result
                </div>
                <h2 className="text-3xl font-bold font-serif italic text-gray-900">3 Validated Opportunities.</h2>
                <p className="text-sm text-gray-500">I found 3 distinct ways to monetize this shift. Select the one that matches your goals.</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {MOCK_OPPORTUNITIES.map((opp, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={handleDeepDive}
                    className={`p-4 border rounded-[1.5rem] bg-white transition-all cursor-pointer group shadow-sm hover:shadow-xl relative overflow-hidden ${i === 0 ? 'border-emerald-200 ring-2 ring-emerald-50' : 'border-gray-100'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-2xl w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center group-hover:scale-110 transition-transform">{opp.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                           <h4 className="font-bold text-gray-900 text-sm group-hover:text-emerald-600 transition-colors">{opp.name}</h4>
                           <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full shadow-sm">Score: {opp.score}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 overflow-hidden">
                           <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase"><DollarSign className="w-3 h-3" /> {opp.cost}</div>
                           <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase"><Clock className="w-3 h-3" /> {opp.speed}</div>
                           <div className="ml-auto text-[10px] font-black text-gray-900 group-hover:mr-2 transition-all">Build it <ArrowRight className="inline w-3 h-3" /></div>
                        </div>
                      </div>
                    </div>
                    {i === 0 && <div className="absolute top-0 right-0 p-1 px-2 bg-emerald-500 text-white text-[8px] font-black rounded-bl-xl shadow-lg">HIGH-ROI TARGET</div>}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 4: Execution Suite */}
          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
              <div className="flex items-center justify-between flex-wrap gap-4 mb-2">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-rose-600 bg-rose-50 px-3 py-1 rounded-full mb-1">
                    <ShieldCheck className="w-3 h-3" /> Execution Blueprint Ready
                  </div>
                  <h2 className="text-3xl font-bold font-serif italic text-gray-900 leading-tight">Hyper-Local Logistics Hub</h2>
                </div>
                <button className="px-6 py-3 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-black/20 hover:scale-105 active:scale-95 transition-all">
                  Launch Business
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100 relative">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-2"><FileText className="w-3 h-3" /> 01. The Problem</p>
                    <p className="text-xs text-gray-600 leading-relaxed italic">Fragile international supply chains are failing small vendors in the Caribbean and Africa.</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-2"><Sparkles className="w-3 h-3" /> 02. The Solution</p>
                    <p className="text-xs text-gray-600 leading-relaxed font-semibold">Decentralized hyper-local sourcing network utilizing solar-powered mobile containers.</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-2 bg-emerald-500/10 text-emerald-600 rounded-bl-xl"><DollarSign className="w-4 h-4" /></div>
                     <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Startup Capital</p>
                     <p className="text-2xl font-black text-gray-900 tracking-tighter">$2,450 <span className="text-[10px] text-gray-400 font-bold uppercase">JMD Extrapolated</span></p>
                     <div className="h-1 bg-emerald-100 w-full mt-3 rounded-full overflow-hidden">
                       <motion.div initial={{ width: 0 }} animate={{ width: '40%' }} className="h-full bg-emerald-500" />
                     </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 p-3 bg-white rounded-xl border border-gray-100 text-center">
                      <p className="text-[8px] font-black text-gray-400 uppercase">Speed</p>
                      <p className="text-xs font-bold text-gray-900">12 Days</p>
                    </div>
                    <div className="flex-1 p-3 bg-white rounded-xl border border-gray-100 text-center">
                      <p className="text-[8px] font-black text-gray-400 uppercase">Difficulty</p>
                      <p className="text-xs font-bold text-gray-900 text-amber-600">Medium</p>
                    </div>
                  </div>
                </div>
                
                {/* Floaties */}
                <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 4 }} className="absolute -bottom-4 -left-4 p-3 bg-white shadow-xl rounded-2xl border border-gray-100 flex items-center gap-2 z-10 scale-90 md:scale-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-[10px] font-bold text-gray-600">Local Grant Found (DBJ)</span>
                </motion.div>
                <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 3, delay: 1 }} className="absolute -top-4 -right-2 p-3 bg-black text-white shadow-xl rounded-2xl border border-white/10 flex items-center gap-2 z-10 scale-90 md:scale-100">
                  <Play className="w-3 h-3 fill-rose-500 text-rose-500" />
                  <span className="text-[10px] font-bold">Watch Video Pitch</span>
                </motion.div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};
