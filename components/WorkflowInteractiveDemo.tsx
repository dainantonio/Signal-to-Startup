import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, CheckSquare, Rocket, Play, CheckCircle2, ArrowRight, Loader2, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';

export const WorkflowInteractiveDemo = () => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isGenerating, setIsGenerating] = useState(false);

  const fireConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#10b981', '#3b82f6', '#f59e0b']
    });
  };

  const handleTaskClick = () => {
    fireConfetti();
    setTimeout(() => {
      setStep(3);
    }, 1200);
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setStep(4);
    }, 1500);
  };

  const reset = () => setStep(1);

  return (
    <div className="w-full max-w-4xl mx-auto rounded-[2.5rem] border border-gray-200 bg-white/50 backdrop-blur-3xl shadow-xl shadow-black/5 overflow-hidden flex flex-col md:flex-row relative z-20">
      
      {/* Sidebar Navigation (Mock) */}
      <div className="w-full md:w-64 bg-gray-50/80 border-b md:border-b-0 md:border-r border-gray-200 p-6 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible no-scrollbar">
        <div className="hidden md:block mb-8 px-2">
          <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center">
             <Zap className="w-4 h-4 text-white" />
          </div>
        </div>
        
        <button 
          onClick={() => setStep(1)} 
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all whitespace-nowrap ${step === 1 ? 'bg-white shadow-sm border border-gray-200 text-black' : 'text-gray-500 hover:bg-gray-100'}`}
        >
          <Sparkles className={`w-4 h-4 ${step === 1 ? 'text-indigo-500' : ''}`} />
          1. Signal Found
        </button>
        
        <button 
          onClick={() => setStep(2)} 
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all whitespace-nowrap ${step === 2 ? 'bg-white shadow-sm border border-gray-200 text-black' : 'text-gray-500 hover:bg-gray-100'}`}
        >
          <CheckSquare className={`w-4 h-4 ${step === 2 ? 'text-emerald-500' : ''}`} />
          2. Take Action
        </button>
        
        <button 
          onClick={() => setStep(3)} 
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all whitespace-nowrap ${step === 3 || step === 4 ? 'bg-white shadow-sm border border-gray-200 text-black' : 'text-gray-500 hover:bg-gray-100'}`}
        >
          <Rocket className={`w-4 h-4 ${step === 3 || step === 4 ? 'text-rose-500' : ''}`} />
          3. Auto-Launch
        </button>

        {step === 4 && (
          <button onClick={reset} className="mt-auto hidden md:flex items-center justify-center gap-2 text-xs font-semibold text-gray-400 hover:text-black py-4">
            Reset Demo
          </button>
        )}
      </div>

      {/* Main Interactive Area */}
      <div className="flex-1 bg-white p-8 md:p-12 min-h-[400px] flex flex-col justify-center relative overflow-hidden">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: Discovery */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="space-y-2 mb-8">
                <div className="inline-flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full mb-2">
                  <Sparkles className="w-3 h-3" /> Agent Alert
                </div>
                <h2 className="text-2xl font-bold font-serif italic text-gray-900">Found a highly lucrative signal.</h2>
                <p className="text-sm text-gray-500">I analyzed 50+ articles while you slept and found a massive gap in B2B supply chain tools.</p>
              </div>

              <div className="p-6 border border-gray-200 rounded-3xl hover:border-indigo-400 hover:bg-indigo-50/50 transition-all cursor-pointer group shadow-sm hover:shadow-md" onClick={() => setStep(2)}>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">WhatsApp Supply Chain CRM</h3>
                  <span className="text-xs font-bold font-mono bg-indigo-500 text-white px-2 py-1 rounded-md shadow-sm">SCORE: 92</span>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed mb-6">Create a simple CRM that operates entirely within WhatsApp for informal vendors to track inventory and send invoices.</p>
                <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                  <span className="text-xs font-bold text-gray-400 flex items-center gap-2 group-hover:text-indigo-500 transition-colors">
                    Click to analyze <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Action Checklists */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold font-serif italic text-gray-900">The Execution Plan</h2>
                <p className="text-sm text-gray-500">Stop researching. Start building momentum right now with a single click.</p>
              </div>

              <div className="space-y-3">
                <div className="p-4 border border-gray-200 rounded-2xl flex items-start gap-4">
                  <div className="mt-0.5"><CheckCircle2 className="w-5 h-5 text-emerald-500" /></div>
                  <div>
                    <h4 className="font-bold text-gray-900 line-through opacity-50 text-sm">Read the business plan & target demographics</h4>
                    <p className="text-xs text-gray-400 mt-1">Completed yesterday</p>
                  </div>
                </div>

                <div 
                  onClick={handleTaskClick}
                  className="p-5 border-2 border-emerald-500 rounded-2xl flex items-start gap-4 shadow-lg shadow-emerald-500/10 cursor-pointer bg-white group hover:scale-[1.02] transition-transform relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-emerald-500/5 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300" />
                  <div className="mt-0.5 relative z-10"><div className="w-5 h-5 border-2 border-emerald-500 rounded flex items-center justify-center group-hover:bg-emerald-500 transition-colors"><CheckSquare className="w-3 h-3 opacity-0 group-hover:opacity-100 text-white" /></div></div>
                  <div className="relative z-10 w-full">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-bold text-gray-900 text-sm">Design the minimum viable Waitlist landing page.</h4>
                      <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">Your Next Move</span>
                    </div>
                    <p className="text-xs text-gray-500 max-w-sm">Click this card when you have completed this step to claim your Founder XP and build your streak!</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: AI Generator */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col items-center justify-center text-center space-y-8 h-full min-h-[300px]">
              <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center">
                <Rocket className="w-10 h-10 text-rose-500" />
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl font-bold font-serif italic text-gray-900">Let the AI do the heavy lifting.</h2>
                <p className="text-sm text-gray-500 max-w-xs mx-auto leading-relaxed">Instantly convert your business plan into a public, high-converting Waitlist page to capture leads immediately.</p>
              </div>
              <button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-8 py-4 bg-rose-500 text-white rounded-2xl font-bold uppercase tracking-widest text-[11px] shadow-xl shadow-rose-500/30 hover:bg-rose-600 transition-all hover:scale-105 disabled:opacity-50 disabled:scale-100 flex items-center gap-3"
              >
                {isGenerating ? <><Loader2 className="w-4 h-4 animate-spin" /> Distilling Plan...</> : <><Play className="w-4 h-4 fill-current" /> Generate Launchpad</>}
              </button>
            </motion.div>
          )}

          {/* STEP 4: Live Result */}
          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-0 bg-gray-900 overflow-hidden rounded-[2.5rem] rounded-l-none border-l border-gray-800">
              
              <div className="absolute top-0 inset-x-0 h-12 bg-white/5 border-b border-white/10 flex items-center px-4 gap-2">
                <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500/50"/><div className="w-3 h-3 rounded-full bg-amber-500/50"/><div className="w-3 h-3 rounded-full bg-emerald-500/50"/></div>
                <div className="ml-4 px-3 py-1 rounded bg-black/40 text-[10px] text-gray-400 font-mono flex-1 text-center truncate">signal-to-startup.vercel.app/launchpad/whatsapp-crm</div>
              </div>

              <div className="pt-24 px-8 text-center text-white h-full relative">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 bg-indigo-500/30 rounded-full blur-[80px]" />
                <div className="relative z-10">
                  <span className="inline-block py-1 px-3 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold mb-6 ring-1 ring-indigo-500/30 uppercase tracking-widest">
                    SMB Supply Chain Chaos
                  </span>
                  <h1 className="text-4xl font-black tracking-tighter mb-4 leading-tight">Simplify your inventory<br/>right on WhatsApp.</h1>
                  <p className="text-sm text-gray-400 max-w-sm mx-auto mb-8 font-medium">Stop using pen and paper. Track stock, send invoices, and delight customers within the chat app they already use.</p>
                  
                  <div className="flex p-1 bg-white/10 border border-white/20 rounded-full max-w-sm mx-auto backdrop-blur-md">
                    <input type="email" placeholder="Enter your email" disabled className="flex-grow px-4 bg-transparent outline-none text-white placeholder:text-gray-500 text-sm" />
                    <button disabled className="px-4 py-2 bg-indigo-500 text-white rounded-full text-xs font-bold">Join Waitlist</button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};
