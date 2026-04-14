'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from '@google/genai';
import { X, Send, Sparkles } from 'lucide-react';
import { AnalysisResult, FeedSignal } from './types';
import { auth } from '@/firebase';

interface SignalGuideProps {
  currentSignal?: FeedSignal | null;
  currentResult?: AnalysisResult | null;
  selectedMode?: string;
  appMode?: string;
  lastAction?: 'analyzed' | 'validated' | 'saved' | 'viewed_feed' | 'idle' | null;
}

interface GuideMessage {
  id: string;
  role: 'guide' | 'user';
  text: string;
  type?: 'proactive' | 'response' | 'suggestion' | 'alert';
  timestamp: Date;
}

const GUIDE_SYSTEM_PROMPT = `You are the Signal Guide — an autonomous market intelligence agent inside Signal to Startup.

Your personality:
- Direct and sharp. Never vague.
- Think like a seasoned entrepreneur who has seen hundreds of markets.
- You spot patterns others miss.
- You tell people what they need to hear, not what they want to hear.
- You are brief. 2-3 sentences max unless asked to expand.
- You never use filler phrases like "Great question!" or "Certainly!"

Your job:
- Watch what the user is looking at
- Proactively surface the most important insight they might be missing
- Connect this signal to broader trends
- Suggest the single most valuable next action
- Flag risks or timing issues

When you speak up proactively:
- Start with the insight, not the context
- Be specific. Name numbers, markets, companies when relevant.
- End with one clear action suggestion.

When answering questions:
- Answer directly
- Add context only if it changes the answer
- Never hedge excessively`;

const QUICK_ACTIONS = [
  'What should I build this week?',
  'What signal should I analyze first?',
  'Is this a good time to start?',
  'What market fits my skills?',
];

export default function SignalGuide({
  currentSignal,
  currentResult,
  selectedMode = 'global',
  appMode = 'discover',
  lastAction = 'idle',
}: SignalGuideProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<GuideMessage[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [hasSomethingToSay, setHasSomethingToSay] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevResultRef = useRef<string>('');
  const prevSignalRef = useRef<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const generateProactiveMessage = useCallback(async (context: string, triggerType: string) => {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) return;

    setIsThinking(true);
    setHasSomethingToSay(true);

    try {
      const genAI = new GoogleGenAI({ apiKey });
      const response = await genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
          role: 'user',
          parts: [{
            text: `${GUIDE_SYSTEM_PROMPT}

CURRENT CONTEXT:
${context}

TRIGGER: ${triggerType}

Generate a SHORT proactive insight (2-3 sentences max).
Start with the most important thing the user should know RIGHT NOW.
End with one specific action.
Be direct. No fluff.`,
          }],
        }],
      });

      const text = response.text?.trim();
      if (!text) return;

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'guide',
        text,
        type: 'proactive',
        timestamp: new Date(),
      }]);
    } catch (err) {
      console.error('[GUIDE] Proactive message failed:', err);
    } finally {
      setIsThinking(false);
    }
  }, []);

  // React when user gets an analysis result
  useEffect(() => {
    if (!currentResult) return;
    const resultKey = currentResult.trend;
    if (prevResultRef.current === resultKey) return;
    prevResultRef.current = resultKey;

    const context = `User just analyzed a signal.
Result trend: ${currentResult.trend}
Market: ${selectedMode}
Top opportunity: ${currentResult.opportunities?.[0]?.name ?? 'N/A'}
Best idea: ${currentResult.best_idea?.name ?? 'N/A'}
Today's action: ${currentResult.today_action ?? 'N/A'}
AI verdict: ${currentResult.ai_verdict ?? 'N/A'}
Money score: ${currentResult.opportunities?.[0]?.money_score ?? 'N/A'}`;

    generateProactiveMessage(context, 'user_analyzed_signal');
  }, [currentResult, selectedMode, generateProactiveMessage]);

  // React when user browses a high-value feed signal
  useEffect(() => {
    if (!currentSignal || lastAction !== 'viewed_feed') return;
    const signalKey = currentSignal.url;
    if (prevSignalRef.current === signalKey) return;
    prevSignalRef.current = signalKey || '';
    if ((currentSignal.signalScore || 0) < 75) return;

    const context = `User is browsing the signal feed.
High-score signal spotted: "${currentSignal.title}"
Source: ${currentSignal.source}
Sector: ${currentSignal.sector}
Score: ${currentSignal.signalScore}
Market: ${selectedMode}
Snippet: ${currentSignal.snippet?.substring(0, 200) ?? ''}`;

    generateProactiveMessage(context, 'high_value_signal_in_feed');
  }, [currentSignal, lastAction, selectedMode, generateProactiveMessage]);

  // Greet on first open
  useEffect(() => {
    if (!isOpen || hasGreeted) return;
    setHasGreeted(true);
    const name = auth.currentUser?.displayName?.split(' ')?.[0] || null;
    const greeting = name
      ? `Hey ${name}. I'm watching the signals. Ask me anything or I'll speak up when something matters.`
      : `I'm watching the signals. Ask me anything or I'll speak up when something important comes through.`;

    setMessages(prev => prev.length === 0 ? [{
      id: 'greeting',
      role: 'guide',
      text: greeting,
      type: 'response',
      timestamp: new Date(),
    }] : prev);
  }, [isOpen, hasGreeted]);

  const handleSend = async () => {
    if (!input.trim() || isThinking) return;

    const question = input.trim();
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'user',
      text: question,
      timestamp: new Date(),
    }]);
    setInput('');
    setIsThinking(true);

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error('No API key');

      const genAI = new GoogleGenAI({ apiKey });

      const context = `Current market: ${selectedMode}
App mode: ${appMode}
${currentResult ? `Last analysis:
  Trend: ${currentResult.trend}
  Best idea: ${currentResult.best_idea?.name ?? 'N/A'}
  Today's action: ${currentResult.today_action ?? 'N/A'}
  Top opportunity: ${currentResult.opportunities?.[0]?.name ?? 'N/A'}` : 'No analysis done yet.'}
${currentSignal ? `Current signal: ${currentSignal.title}
Score: ${currentSignal.signalScore}` : ''}

Conversation so far:
${messages.slice(-4).map(m => `${m.role === 'guide' ? 'Guide' : 'User'}: ${m.text}`).join('\n')}`;

      const response = await genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
          role: 'user',
          parts: [{
            text: `${GUIDE_SYSTEM_PROMPT}

CONTEXT:
${context}

USER QUESTION: ${question}

Answer directly. 2-4 sentences unless the question genuinely needs more.
Be specific to their context.`,
          }],
        }],
      });

      const text = response.text?.trim();
      if (!text) return;

      setMessages(prev => [...prev, {
        id: Date.now().toString() + '_resp',
        role: 'guide',
        text,
        type: 'response',
        timestamp: new Date(),
      }]);
    } catch (err) {
      console.error('[GUIDE] Send failed:', err);
      setMessages(prev => [...prev, {
        id: Date.now().toString() + '_err',
        role: 'guide',
        text: 'Something went wrong. Try again.',
        type: 'response',
        timestamp: new Date(),
      }]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-2">

      {/* Expanded panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="w-[340px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
            style={{ maxHeight: 'calc(100vh - 100px)' }}
          >
            {/* Header */}
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100 bg-gray-950 rounded-t-2xl flex-shrink-0">
              <div className="w-7 h-7 bg-white/10 rounded-full flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white">Signal Guide</p>
                <p className="text-[10px] text-gray-400">AI market intelligence</p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-gray-400 hover:text-white transition-colors rounded-lg"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
              {messages.length === 0 && !isThinking && (
                <div className="space-y-2 pt-2">
                  <p className="text-[10px] font-mono uppercase text-gray-400 tracking-widest px-1">
                    Quick questions
                  </p>
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action}
                      type="button"
                      onClick={() => {
                        setInput(action);
                        inputRef.current?.focus();
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-xs text-gray-700 transition-colors border border-gray-100 hover:border-gray-200"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'guide' && (
                    <div className="w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 mr-2">
                      <Sparkles className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[82%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-gray-900 text-white rounded-br-sm'
                        : msg.type === 'proactive'
                        ? 'bg-amber-50 text-gray-800 border border-amber-200 rounded-bl-sm'
                        : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                    }`}
                  >
                    {msg.type === 'proactive' && (
                      <span className="text-[9px] font-mono font-bold text-amber-600 uppercase tracking-widest block mb-1">
                        ⚡ Signal insight
                      </span>
                    )}
                    {msg.text}
                  </div>
                </div>
              ))}

              {isThinking && (
                <div className="flex justify-start">
                  <div className="w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 mr-2">
                    <Sparkles className="w-2.5 h-2.5 text-white" />
                  </div>
                  <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-3 py-2.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl border border-gray-200 px-3 py-2 focus-within:border-gray-400 transition-colors">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask the guide..."
                  disabled={isThinking}
                  className="flex-1 bg-transparent text-xs text-gray-800 placeholder-gray-400 outline-none disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!input.trim() || isThinking}
                  className="w-6 h-6 bg-gray-900 text-white rounded-lg flex items-center justify-center disabled:opacity-30 hover:bg-gray-700 transition-colors flex-shrink-0"
                  aria-label="Send"
                >
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating trigger button */}
      <motion.button
        type="button"
        onClick={() => {
          setIsOpen(prev => !prev);
          if (hasSomethingToSay) setHasSomethingToSay(false);
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-12 h-12 bg-gray-950 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-800 transition-colors relative"
        aria-label="Signal Guide"
      >
        <Sparkles className="w-5 h-5" />
        {/* Pulsing dot when there's something to say */}
        {hasSomethingToSay && !isOpen && (
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-amber-400 rounded-full border-2 border-white">
            <span className="absolute inset-0 rounded-full bg-amber-400 animate-ping" />
          </span>
        )}
      </motion.button>

    </div>
  );
}
