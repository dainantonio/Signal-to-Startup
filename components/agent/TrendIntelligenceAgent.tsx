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
import { Opportunity, AnalysisResult, DeepDiveResult, MarketMode } from '../types';
import { SignalInput } from '../SignalInput';
import { marketModeConfigs } from '../MarketModeSelector';
import { ResultsDashboard } from '../ResultsDashboard';
import { DeepDiveModal } from '../DeepDiveModal';
import Onboarding from '../Onboarding';
import { PipelineProgress } from '../PipelineProgress';
import Logo from '../Logo';
import LeftSidebar from '../LeftSidebar';
import NotificationBell from '../NotificationBell';
import SignalGuide from '../SignalGuide';
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
} from '../../firebase';

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
  const [activeDeepDiveTab, setActiveDeepDiveTab] = useState<'plan' | 'costs' | 'grants' | 'checklist' | 'investors' | 'strategy'>('plan');
  const [copied, setCopied] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedMode, setSelectedMode] = useState<MarketMode>('global');
  const [countryTags, setCountryTags] = useState<string[]>([]);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const toggleSector = useCallback((s: string) => {
    setSelectedSectors(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  }, []);

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
    <div style={{display:'flex', flexDirection:'column', minHeight:'100vh', background:'#f8fafc'}}>

      {/* ── History overlay (fixed, outside flex body) ── */}
      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.3)', backdropFilter:'blur(4px)', zIndex:60}}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{position:'fixed', right:0, top:0, bottom:0, width:'320px', background:'white', borderLeft:'1px solid #e2e8f0', zIndex:61, display:'flex', flexDirection:'column', boxShadow:'-8px 0 24px rgba(0,0,0,0.08)'}}
            >
              <div style={{padding:'16px 20px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                <h3 style={{fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'2px', color:'#475569'}}>History</h3>
                <button onClick={() => setShowHistory(false)} style={{padding:'4px', borderRadius:'6px', color:'#94a3b8', cursor:'pointer', background:'none', border:'none'}}>
                  <X size={16} />
                </button>
              </div>
              <div style={{flexGrow:1, overflowY:'auto', padding:'12px'}}>
                {!user ? (
                  <div style={{textAlign:'center', padding:'32px 16px'}}>
                    <LogIn size={32} style={{margin:'0 auto 12px', color:'#94a3b8'}} />
                    <p style={{fontSize:'13px', color:'#64748b', marginBottom:'12px'}}>Sign in to save history</p>
                    <button onClick={login} style={{width:'100%', padding:'10px', background:'#0f172a', color:'white', borderRadius:'10px', fontSize:'12px', fontWeight:600, cursor:'pointer', border:'none'}}>
                      Sign in with Google
                    </button>
                  </div>
                ) : history.length > 0 ? (
                  history.map((item) => (
                    <div
                      key={item.id}
                      style={{padding:'12px', borderRadius:'10px', border:'1px solid #f1f5f9', marginBottom:'8px', cursor:'pointer', background:'white'}}
                      onClick={() => { setResult(item); if (item.marketMode) setSelectedMode(item.marketMode); setShowHistory(false); }}
                    >
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'4px'}}>
                        <span style={{fontSize:'9px', fontWeight:700, color:'#6366f1', textTransform:'uppercase', letterSpacing:'1px'}}>
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Unknown'}
                        </span>
                        <button onClick={(e) => { e.stopPropagation(); deleteAnalysis(item.id); }} style={{background:'none', border:'none', cursor:'pointer', color:'#94a3b8', padding:'2px'}}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <p style={{fontSize:'12px', fontWeight:600, color:'#1e293b', lineHeight:1.4, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden'}}>
                        {item.trend}
                      </p>
                    </div>
                  ))
                ) : (
                  <div style={{textAlign:'center', padding:'40px 16px', color:'#94a3b8'}}>
                    <History size={32} style={{margin:'0 auto 8px', opacity:0.4}} />
                    <p style={{fontSize:'11px'}}>No history yet</p>
                  </div>
                )}
              </div>
              {user && (
                <div style={{padding:'12px 16px', borderTop:'1px solid #f1f5f9', display:'flex', alignItems:'center', gap:'10px'}}>
                  <div style={{width:'32px', height:'32px', borderRadius:'50%', background:'#e0e7ff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:700, color:'#4f46e5', flexShrink:0}}>
                    {user.displayName?.[0] || 'U'}
                  </div>
                  <div style={{flex:1, minWidth:0}}>
                    <p style={{fontSize:'11px', fontWeight:600, color:'#1e293b', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{user.displayName}</p>
                    <p style={{fontSize:'9px', color:'#94a3b8', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{user.email}</p>
                  </div>
                  <button onClick={logout} style={{background:'none', border:'none', cursor:'pointer', color:'#94a3b8', padding:'4px'}}>
                    <LogOut size={14} />
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <header style={{position:'sticky', top:0, zIndex:50, height:'52px', background:'white', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 16px', flexShrink:0}}>
        <Logo size="sm" showWordmark showSubbrand={false} theme="light" />
        <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
          <NotificationBell />
          <button
            onClick={() => setShowHistory(!showHistory)}
            style={{display:'flex', alignItems:'center', gap:'6px', padding:'6px 10px', borderRadius:'8px', border:'1px solid #e2e8f0', background:'white', cursor:'pointer', fontSize:'11px', fontWeight:600, color:'#475569'}}
          >
            <History size={14} />
            <span className="hidden sm:inline">History</span>
            {history.length > 0 && (
              <span style={{background:'#6366f1', color:'white', borderRadius:'999px', fontSize:'9px', fontWeight:700, padding:'1px 5px'}}>{history.length}</span>
            )}
          </button>
          {user ? (
            <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
              <Link href="/dashboard" style={{display:'flex', alignItems:'center', gap:'6px', padding:'6px 10px', borderRadius:'8px', border:'1px solid #e2e8f0', background:'white', textDecoration:'none', fontSize:'11px', fontWeight:600, color:'#475569'}}>
                <LayoutDashboard size={14} />
                <span className="hidden sm:inline">Pipeline</span>
              </Link>
              <button
                onClick={logout}
                style={{display:'flex', alignItems:'center', gap:'6px', padding:'6px 10px', borderRadius:'8px', border:'1px solid #e2e8f0', background:'white', cursor:'pointer', fontSize:'11px', fontWeight:600, color:'#475569'}}
                title={user.displayName || 'Signed in'}
              >
                <div style={{width:'22px', height:'22px', borderRadius:'50%', background:'#e0e7ff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:700, color:'#4f46e5'}}>
                  {user.displayName?.[0] || 'U'}
                </div>
                <LogOut size={12} />
              </button>
            </div>
          ) : (
            <button
              onClick={login}
              style={{display:'flex', alignItems:'center', gap:'6px', padding:'7px 14px', borderRadius:'8px', background:'#0f172a', color:'white', cursor:'pointer', fontSize:'11px', fontWeight:600, border:'none'}}
            >
              <LogIn size={13} />
              Sign in
            </button>
          )}
        </div>
      </header>

      {/* ── Body row ── */}
      <div style={{display:'flex', flex:1, overflow:'hidden'}}>

        {/* Left sidebar */}
        <div
          style={{width:'220px', flexShrink:0, background:'white', borderRight:'1px solid #f1f5f9', overflowY:'auto'}}
          className="hidden md:flex flex-col"
        >
          <LeftSidebar
            selectedMode={selectedMode}
            setSelectedMode={setSelectedMode}
            selectedSectors={selectedSectors}
            toggleSector={toggleSector}
            onValidate={() => {}}
            onDashboard={() => { window.location.href = '/dashboard'; }}
            watchlistCount={0}
          />
        </div>

        {/* Main content */}
        <div style={{flex:1, overflowY:'auto', overflowX:'hidden', background:'#f8fafc'}}>
          <div style={{maxWidth:'896px', margin:'0 auto', padding:'24px 16px 96px'}}>

            {result && <PipelineProgress currentStep={currentStep} steps={pipelineSteps} />}

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
              result={result}
              analyzeSignal={analyzeSignal}
              analyzeCompoundSignal={() => {}}
              cancelAnalysis={() => {}}
              selectedMode={selectedMode}
              setSelectedMode={setSelectedMode}
              countryTags={countryTags}
              setCountryTags={setCountryTags}
              user={user}
              login={login}
            />

            {/* Results */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{background:'#fee2e2', border:'1px solid #fca5a5', color:'#dc2626', padding:'12px 16px', borderRadius:'10px', marginBottom:'24px', fontSize:'13px'}}
                >
                  {error}
                </motion.div>
              )}

              {!result && !loading && !error && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                >
                  <Onboarding onComplete={() => {}} />
                </motion.div>
              )}

              {result && (
                <ResultsDashboard
                  result={result}
                  filteredOpportunities={filteredOpportunities}
                  filterType={filterType}
                  setFilterType={setFilterType}
                  grantOnly={grantOnly}
                  setGrantOnly={setGrantOnly}
                  generateDeepDive={generateDeepDive}
                  shareOnTwitter={shareOnTwitter}
                  shareOnLinkedIn={shareOnLinkedIn}
                />
              )}
            </AnimatePresence>

            {/* Deep dive modal */}
            <AnimatePresence>
              {selectedOpportunity && (
                <DeepDiveModal
                  selectedOpportunity={selectedOpportunity}
                  setSelectedOpportunity={setSelectedOpportunity}
                  cancelDeepDive={() => { setSelectedOpportunity(null); setDeepDiveResult(null); }}
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

          </div>
        </div>

        {/* Right panel */}
        <div
          style={{width:'240px', flexShrink:0, background:'white', borderLeft:'1px solid #f1f5f9', overflowY:'auto', padding:'16px 12px'}}
          className="hidden md:block"
        >
          <p style={{fontSize:'9px', fontWeight:700, color:'#94a3b8', letterSpacing:'2px', textTransform:'uppercase', marginBottom:'12px'}}>Agent Status</p>
          {[
            { icon:'📡', label:'Signal Feed', status:'Live', color:'#10b981' },
            { icon:'🤖', label:'AI Analysis', status:'Ready', color:'#6366f1' },
            { icon:'🌎', label:'Market Intel', status:'Active', color:'#f59e0b' },
            { icon:'💡', label:'Opportunity Engine', status:'Online', color:'#10b981' },
          ].map((row, i) => (
            <div key={i} style={{display:'flex', alignItems:'center', gap:'8px', padding:'8px', borderRadius:'8px', marginBottom:'4px', background:'#f8fafc'}}>
              <span style={{fontSize:'14px'}}>{row.icon}</span>
              <div style={{flex:1, minWidth:0}}>
                <p style={{fontSize:'10px', fontWeight:600, color:'#475569', lineHeight:1.2}}>{row.label}</p>
              </div>
              <span style={{fontSize:'8px', fontWeight:700, color:row.color, textTransform:'uppercase', letterSpacing:'0.5px'}}>{row.status}</span>
            </div>
          ))}

          {result && (
            <>
              <div style={{height:'1px', background:'#f1f5f9', margin:'16px 0'}} />
              <p style={{fontSize:'9px', fontWeight:700, color:'#94a3b8', letterSpacing:'2px', textTransform:'uppercase', marginBottom:'8px'}}>Last Analysis</p>
              <p style={{fontSize:'11px', color:'#475569', lineHeight:1.5, display:'-webkit-box', WebkitLineClamp:4, WebkitBoxOrient:'vertical', overflow:'hidden'}}>
                {result.trend}
              </p>
              <p style={{fontSize:'9px', color:'#94a3b8', marginTop:'6px'}}>{result.opportunities?.length ?? 0} opportunities found</p>
            </>
          )}
        </div>

      </div>

      {/* ── Mobile bottom nav ── */}
      <nav style={{position:'fixed', bottom:0, left:0, right:0, zIndex:50, background:'white', borderTop:'1px solid #f1f5f9', alignItems:'center'}} className="flex md:hidden">
        {[
          { icon:'📰', label:'Feed', action: () => {} },
          { icon:'✏️', label:'Paste', action: () => {} },
          { icon:'👽', label:'Reddit', action: () => {} },
          { icon:'📊', label:'Dashboard', action: () => { window.location.href = '/dashboard'; } },
        ].map((item, i) => (
          <button
            key={i}
            onClick={item.action}
            style={{flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'8px 0', background:'none', border:'none', cursor:'pointer', gap:'2px'}}
          >
            <span style={{fontSize:'18px'}}>{item.icon}</span>
            <span style={{fontSize:'9px', fontWeight:500, color:'#64748b'}}>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* ── SignalGuide ── */}
      <SignalGuide
        currentResult={result}
        selectedMode={selectedMode}
        lastAction={result ? 'analyzed' : 'idle'}
      />

    </div>
  );
}
