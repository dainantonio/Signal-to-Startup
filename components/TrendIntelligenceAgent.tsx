'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  Globe,
  TrendingUp,
  History,
  LogIn,
  LogOut,
  X,
  User as UserIcon,
  Link as LinkIcon,
  Trash2,
  ExternalLink,
  LayoutDashboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { Opportunity, AnalysisResult, DeepDiveResult, MarketMode } from './types';
import { SignalInput } from './SignalInput';
import { marketModeConfigs } from './MarketModeSelector';
import { ResultsDashboard } from './ResultsDashboard';
import { DeepDiveModal } from './DeepDiveModal';
import { Onboarding } from './Onboarding';
import { PipelineProgress } from './PipelineProgress';
import { Search, BarChart3, Target, Rocket } from 'lucide-react';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  deleteDoc, 
  doc, 
  FirebaseUser,
  handleFirestoreError,
  OperationType
} from '../firebase';

// Define the response schema for Gemini
const responseSchema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING, description: "Briefly summarize the key event or change in 2–3 sentences." },
    trend: { type: Type.STRING, description: "What broader trend does this represent?" },
    affected_groups: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "List the groups impacted (Businesses, Consumers, Government, Specific industries)."
    },
    problems: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "What NEW problems are created because of this change? (Friction, Inefficiency, Confusion, Compliance burden, Urgency)."
    },
    opportunities: { 
      type: Type.ARRAY, 
      items: { 
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          target_customer: { type: Type.STRING },
          why_now: { type: Type.STRING },
          monetization: { type: Type.STRING },
          pricing_model: { type: Type.STRING },
          status: { type: Type.STRING, description: "Always set to 'New' for initial discovery." },
          priority: { type: Type.STRING, description: "High, Medium, or Low based on ROI and speed to launch." },
          startup_cost: { type: Type.INTEGER, description: "Estimated startup cost in USD. MUST be under 2000." },
          grant_eligible: { type: Type.BOOLEAN, description: "Whether this idea could qualify for local/federal government funding or grants." },
          speed_to_launch: { type: Type.INTEGER, description: "1-10 scale" },
          difficulty: { type: Type.INTEGER, description: "1-10 scale" },
          roi_potential: { type: Type.INTEGER, description: "1-10 scale" },
          urgency: { type: Type.INTEGER, description: "1-10 scale" },
          local_fit: { type: Type.INTEGER, description: "1-10 scale" },
          competition_gap: { type: Type.INTEGER, description: "1-10 scale" },
          money_score: { type: Type.NUMBER, description: "Calculated: ((ROI * 0.30) + (Speed * 0.20) + ((10 - Difficulty) * 0.15) + (Urgency * 0.15) + (Local Fit * 0.10) + (Competition Gap * 0.10)) * 10" }
        },
        required: ["name", "description", "target_customer", "why_now", "monetization", "pricing_model", "status", "priority", "startup_cost", "grant_eligible", "speed_to_launch", "difficulty", "roi_potential", "urgency", "local_fit", "competition_gap", "money_score"]
      }
    },
    best_idea: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        reason: { type: Type.STRING },
        who_should_build: { type: Type.STRING },
        cost_estimate: { type: Type.STRING, description: "Estimated startup cost in USD (e.g., '$500 - $1,200')." },
        speed_rating: { type: Type.STRING, description: "Speed rating (e.g., 'Fast', 'Medium', 'Slow')." },
        first_steps: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING },
          description: "First 3 steps to launch within 7 days."
        }
      },
      required: ["name", "reason", "who_should_build", "cost_estimate", "speed_rating", "first_steps"]
    }
  },
  required: ["summary", "trend", "affected_groups", "problems", "opportunities", "best_idea"]
};

const deepDiveSchema = {
  type: Type.OBJECT,
  properties: {
    business_plan: { type: Type.STRING, description: "Detailed 1-page business plan in Markdown format." },
    cost_breakdown: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          item: { type: Type.STRING },
          cost: { type: Type.INTEGER, description: "Estimated cost in USD." }
        },
        required: ["item", "cost"]
      }
    },
    grants: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of specific grant types or funding sources (e.g., 'SBA 7(a) Loan', 'USDA Rural Development Grant')."
    },
    checklist: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "A step-by-step execution checklist for the first 30 days."
    },
    investors: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Name of the VC firm, angel network, or investor group." },
          focus: { type: Type.STRING, description: "Why they are a match (e.g., 'Focuses on early-stage ag-tech')." },
          stage: { type: Type.STRING, description: "Typical investment stage (e.g., 'Seed', 'Pre-seed', 'Angel')." }
        },
        required: ["name", "focus", "stage"]
      },
      description: "List of 3-5 potential investors or VC firms that align with this niche."
    }
  },
  required: ["business_plan", "cost_breakdown", "grants", "checklist", "investors"]
};

export default function TrendIntelligenceAgent() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [history, setHistory] = useState<(AnalysisResult & { id: string })[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [input, setInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [fetchingUrl, setFetchingUrl] = useState(false);
  const [location, setLocation] = useState('');
  const [focus, setFocus] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'top' | 'hot' | 'fast'>('top');
  const [minScore, setMinScore] = useState(0);
  const [grantOnly, setGrantOnly] = useState(false);
  const [maxCost, setMaxCost] = useState(2000);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [deepDiveResult, setDeepDiveResult] = useState<DeepDiveResult | null>(null);
  const [deepDiveLoading, setDeepDiveLoading] = useState(false);
  const [activeDeepDiveTab, setActiveDeepDiveTab] = useState<'plan' | 'costs' | 'grants' | 'checklist' | 'investors'>('plan');
  const [copied, setCopied] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try { return !localStorage.getItem('s2s_onboarded'); } catch { return true; }
  });
  const [selectedMode, setSelectedMode] = useState<MarketMode>('global');

  // Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        loadHistory(user.uid);
      } else {
        setHistory([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadHistory = async (uid: string) => {
    try {
      const q = query(
        collection(db, 'analyses'),
        where('userId', '==', uid),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as (AnalysisResult & { id: string })[];
      setHistory(docs);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'analyses');
    }
  };

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Login failed", err);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const deleteAnalysis = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'analyses', id));
      setHistory(prev => prev.filter(a => a.id !== id));
      if (result && (result as any).id === id) {
        setResult(null);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `analyses/${id}`);
    }
  };

  const fetchUrl = async () => {
    if (!urlInput.trim()) return;
    setFetchingUrl(true);
    try {
      const response = await fetch(`/api/fetch-url?url=${encodeURIComponent(urlInput)}`);
      if (!response.ok) throw new Error("Failed to fetch URL");
      const data = await response.json();
      setInput(data.content);
      setUrlInput('');
    } catch (err) {
      console.error(err);
      setError("Failed to fetch content from URL. Please ensure it's a public page.");
    } finally {
      setFetchingUrl(false);
    }
  };

  const analyzeSignal = async () => {
    if (!input.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const genAI = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY! });
      const model = "gemini-2.5-flash";
      
      const prompt = `
        You are an AI Trend Intelligence Agent.
        Your job is to analyze news articles, policy updates, and market signals to identify actionable business and product opportunities.
        You think like a startup founder, investor, and operator focused on execution.

        INPUT:
        ${input}

        LOCATION:
        ${location || 'United States'}

        FOCUS/NICHE:
        ${focus || 'General Business'}

        RULES:
        - Be specific, not generic
        - Avoid vague startup ideas
        - ALL ideas MUST be low-cost startups.
        - Set 'status' to 'New' for all new opportunities.
        - Assign a 'priority' (High, Medium, Low) based on the balance of ROI potential vs. difficulty.
        - Identify if an idea is likely to qualify for government funding or grants (e.g., sustainability, rural development, small business support).
        - Prioritize ideas that can be launched quickly
        - Favor underserved or overlooked markets
        - Highlight opportunities that small operators can execute
        - Tailor at least 2 ideas to the provided location (${location || 'United States'})
        - Heavily weight opportunities toward the specified focus: ${focus || 'General Business'}
        - For 'best_idea', provide a realistic 'cost_estimate' and 'speed_rating' (Fast, Medium, Slow).
        
        MARKET CONTEXT:
        ${marketModeConfigs[selectedMode].promptContext}

        STEP 10: MONEY SCORE & BENCHMARKING
        For each opportunity:
        - Rate (1-10):
          - ROI Potential (30%)
          - Speed to Launch (20%)
          - Difficulty (15%) - Note: Easier (lower difficulty) = higher score in formula
          - Urgency (15%)
          - Local Fit (10%)
          - Competition Gap (10%)
        - Calculate Money Score (0-100) using:
          Money Score = ((ROI * 0.30) + (Speed * 0.20) + ((10 - Difficulty) * 0.15) + (Urgency * 0.15) + (Local Fit * 0.10) + (Competition Gap * 0.10)) * 10
        - Return the final score as 'money_score'.
        - BENCHMARK: In the 'description', briefly mention how this score compares to real-world sector averages (e.g., "This 72 is significantly higher than the 45 average for local retail due to low overhead").

        TONE:
        Clear, sharp, and execution-focused.
        Think: “What can someone start THIS WEEK?”
      `;

      const response = await genAI.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
        },
      });

      if (response.text) {
        const parsedResult = JSON.parse(response.text);
        
        // Save to Firebase if user is logged in
        let savedId = '';
        if (user) {
          try {
            const docRef = await addDoc(collection(db, 'analyses'), {
              userId: user.uid,
              signal: input,
              trend: parsedResult.trend,
              summary: parsedResult.summary,
              affected_groups: parsedResult.affected_groups,
              problems: parsedResult.problems,
              opportunities: parsedResult.opportunities,
              best_idea: parsedResult.best_idea,
              createdAt: new Date().toISOString(),
              marketMode: selectedMode
            });
            savedId = docRef.id;
            loadHistory(user.uid);
          } catch (err) {
            handleFirestoreError(err, OperationType.CREATE, 'analyses');
          }
        }

        setResult({ ...parsedResult, id: savedId });
      } else {
        throw new Error("No response from AI");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to analyze signal. Please check your input and try again.");
    } finally {
      setLoading(false);
    }
  };

  const generateDeepDive = useCallback(async (opp: Opportunity) => {
    setSelectedOpportunity(opp);
    setDeepDiveLoading(true);
    setDeepDiveResult(null);
    setActiveDeepDiveTab('plan');
    
    try {
      const genAI = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY! });
      const model = "gemini-2.5-flash";
      
      const prompt = `
        You are an AI Business Advisor.
        Generate a detailed execution plan for the following business opportunity.
        
        OPPORTUNITY:
        Name: ${opp.name}
        Description: ${opp.description}
        Target Customer: ${opp.target_customer}
        Monetization: ${opp.monetization}
        Location Context: ${location || 'General'}
        
        TASKS:
        1. Create a professional 1-page business plan (Executive Summary, Market Analysis, Operations, Revenue Model).
        2. Provide a granular startup cost breakdown (focus on low-cost execution).
        3. Identify 3-5 specific grant types or funding sources this business could qualify for.
        4. Create a 30-day execution checklist.
        5. Identify 3-5 specific venture capital firms, angel networks, or investor groups that specialize in this niche or stage.
        
        TONE: Professional, encouraging, and highly practical.
      `;

      const response = await genAI.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: deepDiveSchema,
        },
      });

      if (response.text) {
        setDeepDiveResult(JSON.parse(response.text));
      }
    } catch (err) {
      console.error(err);
      setError("Failed to generate execution plan.");
    } finally {
      setDeepDiveLoading(false);
    }
  }, [location]);

  const pipelineSteps = [
    { id: 1, label: 'Ingestion', icon: Search },
    { id: 2, label: 'Analysis', icon: BarChart3 },
    { id: 3, label: 'Matrix', icon: Target },
    { id: 4, label: 'Execution', icon: Rocket },
  ];

  // Sync selected opportunity with URL for shareability
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oppName = params.get('opp');
    if (oppName && result && !selectedOpportunity) {
      const opp = result.opportunities.find(o => o.name === oppName);
      if (opp) {
        setSelectedOpportunity(opp);
        generateDeepDive(opp);
      }
    }
  }, [result, generateDeepDive, selectedOpportunity]);

  React.useEffect(() => {
    const url = new URL(window.location.href);
    if (selectedOpportunity) {
      url.searchParams.set('opp', selectedOpportunity.name);
    } else {
      url.searchParams.delete('opp');
    }
    window.history.replaceState({}, '', url);
  }, [selectedOpportunity]);

  // Scroll listener for pipeline progress
  React.useEffect(() => {
    const handleScroll = () => {
      const steps = [1, 2, 3, 4];
      for (const step of steps.reverse()) {
        const el = document.getElementById(`step-${step}`);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 150) {
            setCurrentStep(step);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const exampleSignals = [
    {
      label: "Rural Policy",
      text: "New federal initiative announced to subsidize high-speed satellite internet for rural farming communities in the Midwest. $500M allocated for infrastructure and local tech support training.",
      location: "Midwest, USA",
      focus: "Tech Support"
    },
    {
      label: "Green Energy",
      text: "City council passes mandate requiring all commercial buildings over 10,000 sq ft to install EV charging stations by 2027. Rebates available for early adopters who install before 2025.",
      location: "California",
      focus: "Installation"
    },
    {
      label: "Micro-Logistics",
      text: "Major e-commerce platform opening 50 new 'last-mile' micro-fulfillment centers in dense urban areas. Seeking local partners for bicycle and electric scooter delivery fleets.",
      location: "London, UK",
      focus: "Delivery"
    }
  ];

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const filteredOpportunities = useMemo(() => {
    if (!result) return [];
    
    let filtered = [...result.opportunities].filter(opp => 
      opp.money_score >= minScore && 
      (!grantOnly || opp.grant_eligible) &&
      opp.startup_cost <= maxCost
    );
    
    if (filterType === 'top') {
      filtered.sort((a, b) => b.money_score - a.money_score);
    } else if (filterType === 'hot') {
      // Hot = High Urgency + High Money Score
      filtered.sort((a, b) => (b.urgency * 10 + b.money_score) - (a.urgency * 10 + a.money_score));
    } else if (filterType === 'fast') {
      filtered.sort((a, b) => b.speed_to_launch - a.speed_to_launch);
    }
    
    return filtered;
  }, [result, filterType, minScore, grantOnly, maxCost]);

  const shareOnTwitter = () => {
    if (!result) return;
    const text = `AI Trend Intelligence: ${result.trend}\nBest Idea: ${result.best_idea.name}\n\nAnalyzed via AI Trend Intelligence Agent`;
    const url = result.id ? `${window.location.origin}/analysis/${result.id}` : window.location.href;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  };

  const shareOnLinkedIn = () => {
    if (!result) return;
    const url = result.id ? `${window.location.origin}/analysis/${result.id}` : window.location.href;
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-12 border-b border-[#141414] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter uppercase italic font-serif">
              Signal to Startup
            </h1>
            <p className="text-sm uppercase tracking-widest opacity-60 mt-2">
              Turn news, policy, and market signals into actionable, low-cost business opportunities.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-mono bg-[#141414] text-[#E4E3E0] px-3 py-1 rounded-full">
              <Globe className="w-3 h-3" />
              LIVE FEED ACTIVE
            </div>
            
            {user ? (
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#141414] hover:bg-gray-50 transition-all shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] relative group"
                  title="History"
                >
                  <History className="w-4 h-4" />
                  <span className="text-[10px] font-mono uppercase font-bold">History ({history.length})</span>
                </button>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#141414] hover:bg-gray-50 transition-all shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]"
                  title="Your Pipeline"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="text-[10px] font-mono uppercase font-bold">Pipeline</span>
                </Link>
                <div className="flex items-center gap-2 bg-white border border-[#141414] px-3 py-1 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]">
                  <UserIcon className="w-3 h-3" />
                  <span className="text-[10px] font-mono uppercase font-bold">{user.displayName?.split(' ')[0]}</span>
                  <button onClick={logout} className="ml-2 hover:text-red-500">
                    <LogOut className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowHistory(!showHistory)}
                  className="p-2 hover:bg-[#141414]/5 rounded-full transition-colors"
                  title="History"
                >
                  <History className="w-5 h-5" />
                </button>
                <button 
                  onClick={login}
                  className="flex items-center gap-2 bg-[#141414] text-[#E4E3E0] px-4 py-2 text-[10px] font-mono uppercase tracking-widest hover:bg-[#333] transition-all shadow-[4px_4px_0px_0px_rgba(20,20,20,0.2)]"
                >
                  <LogIn className="w-3 h-3" />
                  Login to Save
                </button>
              </div>
            )}
          </div>
        </header>

        {/* History Panel */}
        <AnimatePresence>
          {showHistory && (
            <>
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowHistory(false)}
                className="fixed inset-0 bg-[#141414]/40 backdrop-blur-sm z-50"
              />
              
              {/* Sidebar / Bottom Sheet */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed right-0 top-0 bottom-0 w-full md:w-80 bg-[#E4E3E0] border-l-2 border-[#141414] z-50 flex flex-col shadow-[-10px_0px_30px_rgba(0,0,0,0.1)]"
              >
                <div className="p-6 border-b border-[#141414] flex items-center justify-between bg-white">
                  <h3 className="text-sm font-mono uppercase font-bold tracking-widest">Intelligence History</h3>
                  <button 
                    onClick={() => setShowHistory(false)} 
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex-grow overflow-y-auto p-4 space-y-3">
                  {!user ? (
                    <div className="bg-white border-2 border-[#141414] p-6 text-center space-y-4 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
                      <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mx-auto">
                        <LogIn className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div className="space-y-2">
                        <p className="font-serif italic text-lg">Sign in to save history</p>
                        <p className="text-[10px] font-mono uppercase opacity-50">Keep track of your market signals and execution plans across sessions.</p>
                      </div>
                      <button 
                        onClick={login}
                        className="w-full flex items-center justify-center gap-2 bg-[#141414] text-[#E4E3E0] px-4 py-3 text-[10px] font-mono uppercase tracking-widest hover:bg-[#333] transition-all"
                      >
                        <Globe className="w-3 h-3" />
                        Sign in with Google
                      </button>
                    </div>
                  ) : history.length > 0 ? (
                    history.map((item) => (
                      <div 
                        key={item.id} 
                        className="group relative bg-white border border-[#141414] p-4 hover:shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] transition-all cursor-pointer" 
                        onClick={() => {
                          setResult(item);
                          if (item.marketMode) {
                            setSelectedMode(item.marketMode);
                          }
                          setShowHistory(false);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-mono uppercase font-bold text-indigo-600">
                              {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Unknown'}
                            </span>
                            {item.marketMode && (
                              <span className="text-xs" title={marketModeConfigs[item.marketMode].label}>
                                {marketModeConfigs[item.marketMode].flag}
                              </span>
                            )}
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteAnalysis(item.id);
                            }}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <h4 className="text-xs font-serif italic font-bold leading-tight line-clamp-2">
                          {item.trend.length > 60 ? `${item.trend.substring(0, 60)}...` : item.trend}
                        </h4>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-20 opacity-30">
                      <History className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p className="text-[10px] font-mono uppercase tracking-widest">No intelligence logs found</p>
                    </div>
                  )}
                </div>
                
                {user && (
                  <div className="p-4 border-t border-[#141414] bg-white">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                        {user.displayName?.[0] || 'U'}
                      </div>
                      <div className="flex-grow">
                        <p className="text-[10px] font-mono uppercase font-bold leading-none">{user.displayName}</p>
                        <p className="text-[8px] font-mono opacity-40 truncate">{user.email}</p>
                      </div>
                      <button onClick={logout} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-colors">
                        <LogOut className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {result && (
          <PipelineProgress currentStep={currentStep} steps={pipelineSteps} />
        )}

        <SignalInput 
          input={input}
          setInput={setInput}
          urlInput={urlInput}
          setUrlInput={setUrlInput}
          fetchingUrl={fetchingUrl}
          fetchUrl={fetchUrl}
          location={location}
          setLocation={setLocation}
          focus={focus}
          setFocus={setFocus}
          loading={loading}
          analyzeSignal={analyzeSignal}
          exampleSignals={exampleSignals}
          selectedMode={selectedMode}
          setSelectedMode={setSelectedMode}
        />

        {/* Results Section */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-8 font-mono text-sm"
            >
              {error}
            </motion.div>
          )}

          {!result && !loading && !error && showOnboarding && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <Onboarding onDismiss={() => setShowOnboarding(false)} />
            </motion.div>
          )}

          {result && (
            <ResultsDashboard 
              result={result}
              filteredOpportunities={filteredOpportunities}
              filterType={filterType}
              setFilterType={setFilterType}
              minScore={minScore}
              setMinScore={setMinScore}
              grantOnly={grantOnly}
              setGrantOnly={setGrantOnly}
              maxCost={maxCost}
              setMaxCost={setMaxCost}
              generateDeepDive={generateDeepDive}
              shareOnTwitter={shareOnTwitter}
              shareOnLinkedIn={shareOnLinkedIn}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {selectedOpportunity && (
        <DeepDiveModal 
          selectedOpportunity={selectedOpportunity}
          setSelectedOpportunity={setSelectedOpportunity}
          deepDiveLoading={deepDiveLoading}
          deepDiveResult={deepDiveResult}
          activeDeepDiveTab={activeDeepDiveTab}
          setActiveDeepDiveTab={setActiveDeepDiveTab}
          generateDeepDive={generateDeepDive}
          copyToClipboard={copyToClipboard}
          copied={copied}
          selectedMode={selectedMode}
        />
          )}
        </AnimatePresence>

        {/* Footer Info */}
        {!result && !loading && (
          <footer className="mt-24 border-t border-[#141414] pt-8 grid grid-cols-1 md:grid-cols-3 gap-8 opacity-40">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest mb-2">System Status</p>
              <p className="text-xs">All intelligence modules operational. Monitoring global signals 24/7.</p>
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest mb-2">Methodology</p>
              <p className="text-xs">First-principles thinking applied to market inefficiencies and regulatory shifts.</p>
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest mb-2">Disclaimer</p>
              <p className="text-xs">Analysis is for informational purposes. Execution risk is inherent in all ventures.</p>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}
