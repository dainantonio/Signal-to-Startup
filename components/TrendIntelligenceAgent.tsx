'use client';

import React, { useState, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  Search, 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  Lightbulb, 
  DollarSign, 
  Zap, 
  Trophy, 
  ArrowRight,
  Loader2,
  Globe,
  MapPin,
  Share2,
  Twitter,
  Linkedin,
  FileText,
  Calculator,
  Coins,
  CheckSquare,
  X,
  ChevronRight,
  Copy,
  Check,
  RefreshCcw,
  ArrowLeft
} from 'lucide-react';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';

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

interface Opportunity {
  name: string;
  description: string;
  target_customer: string;
  why_now: string;
  monetization: string;
  pricing_model: string;
  status: string;
  priority: 'High' | 'Medium' | 'Low';
  startup_cost: number;
  grant_eligible: boolean;
  speed_to_launch: number;
  difficulty: number;
  roi_potential: number;
  urgency: number;
  local_fit: number;
  competition_gap: number;
  money_score: number;
}

interface AnalysisResult {
  summary: string;
  trend: string;
  affected_groups: string[];
  problems: string[];
  opportunities: Opportunity[];
  best_idea: {
    name: string;
    reason: string;
    who_should_build: string;
    cost_estimate: string;
    speed_rating: string;
    first_steps: string[];
  };
}

interface DeepDiveResult {
  business_plan: string;
  cost_breakdown: { item: string; cost: number }[];
  grants: string[];
  checklist: string[];
  investors: { name: string; focus: string; stage: string }[];
}

export default function TrendIntelligenceAgent() {
  const [input, setInput] = useState('');
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
    const url = window.location.href;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  };

  const shareOnLinkedIn = () => {
    if (!result) return;
    const url = window.location.href;
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
  };

  const analyzeSignal = async () => {
    if (!input.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const genAI = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY! });
      const model = "gemini-3-flash-preview";
      
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
        
        STEP 10: MONEY SCORE
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
        setResult(parsedResult);
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

  const generateDeepDive = async (opp: Opportunity) => {
    setSelectedOpportunity(opp);
    setDeepDiveLoading(true);
    setDeepDiveResult(null);
    setActiveDeepDiveTab('plan');
    
    try {
      const genAI = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY! });
      const model = "gemini-3-flash-preview";
      
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
          <div className="flex items-center gap-2 text-xs font-mono bg-[#141414] text-[#E4E3E0] px-3 py-1 rounded-full">
            <Globe className="w-3 h-3" />
            LIVE FEED ACTIVE
          </div>
        </header>

        {/* Layer 01: Signal Ingestion */}
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

          {result && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="space-y-12"
            >
              {/* Share Bar */}
              <div className="flex items-center justify-between border-b border-[#141414] pb-4">
                <div className="flex items-center gap-2">
                  <Share2 className="w-4 h-4" />
                  <span className="text-xs font-mono uppercase tracking-widest opacity-60">Share Insights</span>
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={shareOnTwitter}
                    className="flex items-center gap-2 text-xs font-mono uppercase hover:underline"
                  >
                    <Twitter className="w-4 h-4" />
                    Twitter
                  </button>
                  <button 
                    onClick={shareOnLinkedIn}
                    className="flex items-center gap-2 text-xs font-mono uppercase hover:underline"
                  >
                    <Linkedin className="w-4 h-4" />
                    LinkedIn
                  </button>
                </div>
              </div>

              {/* Layer 2: AI Interpretation */}
              <div className="flex flex-col items-center gap-4">
                <div className="w-full bg-white border border-[#141414] p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 opacity-10">
                    <TrendingUp className="w-24 h-24" />
                  </div>
                  <h3 className="text-xs font-mono uppercase tracking-widest opacity-50 mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#141414] text-[#E4E3E0] flex items-center justify-center text-[8px]">02</span>
                    📰 Signal Detected
                  </h3>
                  <p className="text-lg font-serif leading-relaxed italic">
                    “{result.summary}”
                  </p>
                </div>
                <div className="text-2xl opacity-30">⬇️</div>
              </div>

              {/* Layer 3: Problem Detection */}
              <div className="flex flex-col items-center gap-4">
                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="border border-[#141414] p-6 bg-white">
                    <h3 className="text-xs font-mono uppercase tracking-widest opacity-50 mb-6 flex items-center gap-2">
                      <Users className="w-3 h-3" /> Affected Groups
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {result.affected_groups.map((group, i) => (
                        <span key={i} className="bg-white border border-[#141414] px-3 py-1 text-xs font-mono uppercase">
                          {group}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="border border-[#141414] p-6 bg-white">
                    <h3 className="text-xs font-mono uppercase tracking-widest opacity-50 mb-6 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#141414] text-[#E4E3E0] flex items-center justify-center text-[8px]">03</span>
                      ⚠️ Problems
                    </h3>
                    <ul className="space-y-3">
                      {result.problems.map((problem, i) => (
                        <li key={i} className="flex gap-3 text-sm">
                          <span className="font-bold font-mono">[{i+1}]</span>
                          <span>{problem}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="text-2xl opacity-30">⬇️</div>
              </div>

              {/* Layer 4: Opportunity Generation ⭐ */}
              <div className="flex flex-col items-center gap-4">
                <div className="w-full">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-[#141414] pb-4">
                    <h2 className="text-2xl font-serif italic flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-[#141414] text-[#E4E3E0] flex items-center justify-center font-mono text-xs">04</span>
                      💡 Opportunities
                    </h2>
                    
                    <div className="flex flex-wrap items-center gap-4">
                      {/* View Selector */}
                      <div className="flex bg-gray-100 p-1 rounded border border-[#141414]">
                        <button 
                          onClick={() => setFilterType('top')}
                          className={`px-3 py-1 text-[10px] font-mono uppercase transition-colors ${filterType === 'top' ? 'bg-[#141414] text-[#E4E3E0]' : 'hover:bg-gray-200'}`}
                        >
                          Top Opportunities
                        </button>
                        <button 
                          onClick={() => setFilterType('hot')}
                          className={`px-3 py-1 text-[10px] font-mono uppercase transition-colors ${filterType === 'hot' ? 'bg-[#141414] text-[#E4E3E0]' : 'hover:bg-gray-200'}`}
                        >
                          🔥 Hot This Week
                        </button>
                        <button 
                          onClick={() => setFilterType('fast')}
                          className={`px-3 py-1 text-[10px] font-mono uppercase transition-colors ${filterType === 'fast' ? 'bg-[#141414] text-[#E4E3E0]' : 'hover:bg-gray-200'}`}
                        >
                          🚀 Fastest to Launch
                        </button>
                      </div>

                      {/* Score Filter */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase opacity-50">Min Score:</span>
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          value={minScore} 
                          onChange={(e) => setMinScore(parseInt(e.target.value))}
                          className="w-24 accent-[#141414]"
                        />
                        <span className="text-[10px] font-mono font-bold w-6">{minScore}</span>
                      </div>

                      {/* Cost Filter */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase opacity-50">Max Cost:</span>
                        <input 
                          type="range" 
                          min="0" 
                          max="2000" 
                          step="100"
                          value={maxCost} 
                          onChange={(e) => setMaxCost(parseInt(e.target.value))}
                          className="w-24 accent-[#141414]"
                        />
                        <span className="text-[10px] font-mono font-bold w-12">${maxCost}</span>
                      </div>

                      {/* Grant Filter */}
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <div className="relative">
                          <input 
                            type="checkbox" 
                            checked={grantOnly} 
                            onChange={(e) => setGrantOnly(e.target.checked)}
                            className="sr-only"
                          />
                          <div className={`w-8 h-4 bg-gray-200 rounded-full transition-colors ${grantOnly ? 'bg-emerald-500' : ''}`} />
                          <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${grantOnly ? 'translate-x-4' : ''}`} />
                        </div>
                        <span className="text-[10px] font-mono uppercase opacity-50 group-hover:opacity-100 transition-opacity">Grant Only</span>
                      </label>
                    </div>
                  </div>

                  {filteredOpportunities.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredOpportunities.map((opp, i) => {
                        const isBestIdea = opp.name === result.best_idea.name;
                        return (
                          <motion.div
                            key={i}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ y: -5 }}
                            className={`bg-white border border-[#141414] p-6 flex flex-col h-full ${isBestIdea ? 'ring-2 ring-[#141414] ring-offset-4' : ''}`}
                          >
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex flex-col">
                              <h4 className="font-bold text-xl uppercase tracking-tighter flex items-center gap-2">
                                {opp.name}
                                {isBestIdea && <span className="text-[10px] bg-[#141414] text-[#E4E3E0] px-1 py-0.5 rounded">← 👀 YOU</span>}
                              </h4>
                              <div className="flex gap-2 mt-1">
                                <span className="text-[8px] font-mono bg-[#141414] text-[#E4E3E0] px-1.5 py-0.5 uppercase font-bold">
                                  {opp.status}
                                </span>
                                <span className={`text-[8px] font-mono px-1.5 py-0.5 uppercase font-bold border ${
                                  opp.priority === 'High' ? 'bg-red-100 text-red-800 border-red-200' :
                                  opp.priority === 'Medium' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                                  'bg-slate-100 text-slate-800 border-slate-200'
                                }`}>
                                  {opp.priority} Priority
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end">
                              <div className="bg-[#141414] text-[#E4E3E0] text-[10px] px-2 py-0.5 font-mono mb-1">
                                OPP_{i+1}
                              </div>
                              <div className="flex flex-col items-center bg-amber-50 border border-amber-200 px-2 py-1 rounded">
                                <span className="text-[8px] font-mono uppercase text-amber-800 font-bold leading-none mb-0.5">Money Score</span>
                                <span className="text-lg font-bold text-amber-900 leading-none">{Math.round(opp.money_score)}</span>
                              </div>
                            </div>
                          </div>
                          <p className="text-sm mb-6 flex-grow">{opp.description}</p>
                          
                          <div className="space-y-4 pt-4 border-t border-[#141414] border-dashed">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-[10px] uppercase opacity-50 font-mono mb-1">Target Customer</p>
                                <p className="text-xs font-bold">{opp.target_customer}</p>
                              </div>
                              <div>
                                <p className="text-[10px] uppercase opacity-50 font-mono mb-1">Est. Startup Cost</p>
                                <p className="text-xs font-bold text-emerald-600">${opp.startup_cost.toLocaleString()}</p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-y-3 gap-x-2 pt-2">
                              <div className="text-center">
                                <p className="text-[8px] uppercase opacity-50 font-mono mb-1">Speed</p>
                                <div className="flex justify-center gap-0.5">
                                  {[...Array(10)].map((_, j) => (
                                    <div key={j} className={`w-1 h-2 ${j < opp.speed_to_launch ? 'bg-[#141414]' : 'bg-gray-200'}`} />
                                  ))}
                                </div>
                              </div>
                              <div className="text-center">
                                <p className="text-[8px] uppercase opacity-50 font-mono mb-1">ROI</p>
                                <div className="flex justify-center gap-0.5">
                                  {[...Array(10)].map((_, j) => (
                                    <div key={j} className={`w-1 h-2 ${j < opp.roi_potential ? 'bg-[#141414]' : 'bg-gray-200'}`} />
                                  ))}
                                </div>
                              </div>
                              <div className="text-center">
                                <p className="text-[8px] uppercase opacity-50 font-mono mb-1">Urgency</p>
                                <div className="flex justify-center gap-0.5">
                                  {[...Array(10)].map((_, j) => (
                                    <div key={j} className={`w-1 h-2 ${j < opp.urgency ? 'bg-[#141414]' : 'bg-gray-200'}`} />
                                  ))}
                                </div>
                              </div>
                              <div className="text-center">
                                <p className="text-[8px] uppercase opacity-50 font-mono mb-1">Local Fit</p>
                                <div className="flex justify-center gap-0.5">
                                  {[...Array(10)].map((_, j) => (
                                    <div key={j} className={`w-1 h-2 ${j < opp.local_fit ? 'bg-[#141414]' : 'bg-gray-200'}`} />
                                  ))}
                                </div>
                              </div>
                              <div className="text-center">
                                <p className="text-[8px] uppercase opacity-50 font-mono mb-1">Gap</p>
                                <div className="flex justify-center gap-0.5">
                                  {[...Array(10)].map((_, j) => (
                                    <div key={j} className={`w-1 h-2 ${j < opp.competition_gap ? 'bg-[#141414]' : 'bg-gray-200'}`} />
                                  ))}
                                </div>
                              </div>
                              <div className="text-center">
                                <p className="text-[8px] uppercase opacity-50 font-mono mb-1">Ease</p>
                                <div className="flex justify-center gap-0.5">
                                  {[...Array(10)].map((_, j) => (
                                    <div key={j} className={`w-1 h-2 ${j < (10 - opp.difficulty) ? 'bg-[#141414]' : 'bg-gray-200'}`} />
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <button 
                            onClick={() => generateDeepDive(opp)}
                            className="mt-6 w-full border border-[#141414] py-3 text-[10px] font-mono uppercase tracking-widest hover:bg-[#141414] hover:text-[#E4E3E0] transition-all flex items-center justify-center gap-2 group"
                          >
                            Generate Execution Suite
                            <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>
                  ) : (
                    <div className="text-center py-20 border border-dashed border-[#141414] opacity-50">
                      <p className="font-mono text-sm uppercase">No opportunities match the current filter.</p>
                    </div>
                  )}
                </div>
                <div className="text-2xl opacity-30">⬇️</div>
              </div>

              {/* Layer 5: Execution Layer */}
              <div className="bg-[#141414] text-[#E4E3E0] p-8 md:p-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Trophy className="w-48 h-48" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-[#E4E3E0] text-[#141414] w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs">
                      05
                    </div>
                    <h3 className="text-sm font-mono uppercase tracking-[0.3em]">🚀 Take Action</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div>
                      <h2 className="text-4xl md:text-6xl font-bold tracking-tighter uppercase italic mb-6">
                        {result.best_idea.name}
                      </h2>
                      <p className="text-lg opacity-80 font-serif leading-relaxed mb-8">
                        {result.best_idea.reason}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-8 mb-8">
                        <div>
                          <p className="text-[10px] uppercase opacity-50 font-mono mb-1">Cost Estimate</p>
                          <p className="text-xl font-bold text-emerald-400">{result.best_idea.cost_estimate}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase opacity-50 font-mono mb-1">Speed Rating</p>
                          <p className="text-xl font-bold">{result.best_idea.speed_rating}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-[#E4E3E0] flex items-center justify-center text-[#141414]">
                          <Users className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase opacity-50 font-mono">Who should build it</p>
                          <p className="font-bold">{result.best_idea.who_should_build}</p>
                        </div>
                      </div>

                      <button 
                        onClick={() => {
                          const bestOpp = result.opportunities.find(o => o.name === result.best_idea.name);
                          if (bestOpp) generateDeepDive(bestOpp);
                        }}
                        className="mt-8 bg-[#E4E3E0] text-[#141414] px-8 py-4 text-xs font-mono uppercase tracking-widest hover:bg-white transition-all flex items-center gap-3 border border-transparent hover:border-[#E4E3E0]"
                      >
                        Generate Full Execution Suite
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="bg-[#E4E3E0] text-[#141414] p-8">
                      <h4 className="text-xs font-mono uppercase tracking-widest mb-6 border-b border-[#141414] pb-2">
                        Steps to Launch
                      </h4>
                      <ul className="space-y-6">
                        {result.best_idea.first_steps.map((step, i) => (
                          <li key={i} className="flex gap-4">
                            <span className="text-2xl font-bold font-serif italic">0{i+1}</span>
                            <p className="text-sm font-medium">{step}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Deep Dive Modal */}
        <AnimatePresence>
          {selectedOpportunity && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#141414]/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-8"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-[#E4E3E0] w-full max-w-5xl max-h-[90vh] overflow-hidden border border-[#141414] flex flex-col"
              >
                {/* Modal Header */}
                <div className="border-b-2 border-[#141414] p-6 flex items-center justify-between bg-white">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setSelectedOpportunity(null)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                      title="Back to list"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                      <h2 className="text-2xl font-serif italic uppercase tracking-tighter">{selectedOpportunity.name}</h2>
                      <p className="text-[10px] font-mono uppercase opacity-50">Execution Suite & Strategy</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => generateDeepDive(selectedOpportunity)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors text-[#141414]"
                      title="Regenerate"
                    >
                      <RefreshCcw className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setSelectedOpportunity(null)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Modal Content */}
                <div className="flex-grow overflow-y-auto p-6 md:p-10 bg-[#F5F5F0]">
                  {deepDiveLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-6">
                      <div className="relative">
                        <Loader2 className="w-16 h-16 animate-spin text-[#141414] opacity-20" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-2 h-2 bg-[#141414] rounded-full animate-ping" />
                        </div>
                      </div>
                      <div className="text-center space-y-2">
                        <p className="font-mono text-xs uppercase tracking-[0.3em] animate-pulse">Consulting AI Advisor...</p>
                        <p className="text-[10px] font-mono opacity-40 uppercase">Mapping market gaps and cost structures</p>
                      </div>
                    </div>
                  ) : deepDiveResult ? (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
                      {/* Sidebar Tabs */}
                      <div className="lg:col-span-1 space-y-3">
                        <div className="bg-white border-2 border-[#141414] p-4 mb-4 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
                          <div className="text-[10px] font-mono uppercase opacity-50 mb-2">Opportunity Score</div>
                          <div className="text-3xl font-bold font-serif italic">{Math.round(selectedOpportunity.money_score)}/100</div>
                        </div>
                        
                        <button 
                          onClick={() => setActiveDeepDiveTab('plan')}
                          className={`w-full flex items-center gap-3 px-4 py-4 text-xs font-mono uppercase tracking-widest border-2 border-[#141414] transition-all shadow-[4px_4px_0px_0px_rgba(20,20,20,0.1)] active:shadow-none active:translate-x-1 active:translate-y-1 ${activeDeepDiveTab === 'plan' ? 'bg-[#141414] text-[#E4E3E0] shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]' : 'bg-white hover:bg-gray-50'}`}
                        >
                          <FileText className="w-4 h-4" />
                          Business Plan
                        </button>
                        <button 
                          onClick={() => setActiveDeepDiveTab('costs')}
                          className={`w-full flex items-center gap-3 px-4 py-4 text-xs font-mono uppercase tracking-widest border-2 border-[#141414] transition-all shadow-[4px_4px_0px_0px_rgba(20,20,20,0.1)] active:shadow-none active:translate-x-1 active:translate-y-1 ${activeDeepDiveTab === 'costs' ? 'bg-[#141414] text-[#E4E3E0] shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]' : 'bg-white hover:bg-gray-50'}`}
                        >
                          <Calculator className="w-4 h-4" />
                          Cost Estimator
                        </button>
                        <button 
                          onClick={() => setActiveDeepDiveTab('grants')}
                          className={`w-full flex items-center gap-3 px-4 py-4 text-xs font-mono uppercase tracking-widest border-2 border-[#141414] transition-all shadow-[4px_4px_0px_0px_rgba(20,20,20,0.1)] active:shadow-none active:translate-x-1 active:translate-y-1 ${activeDeepDiveTab === 'grants' ? 'bg-[#141414] text-[#E4E3E0] shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]' : 'bg-white hover:bg-gray-50'}`}
                        >
                          <Coins className="w-4 h-4" />
                          Grant Finder
                        </button>
                        <button 
                          onClick={() => setActiveDeepDiveTab('checklist')}
                          className={`w-full flex items-center gap-3 px-4 py-4 text-xs font-mono uppercase tracking-widest border-2 border-[#141414] transition-all shadow-[4px_4px_0px_0px_rgba(20,20,20,0.1)] active:shadow-none active:translate-x-1 active:translate-y-1 ${activeDeepDiveTab === 'checklist' ? 'bg-[#141414] text-[#E4E3E0] shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]' : 'bg-white hover:bg-gray-50'}`}
                        >
                          <CheckSquare className="w-4 h-4" />
                          Checklist
                        </button>
                        <button 
                          onClick={() => setActiveDeepDiveTab('investors')}
                          className={`w-full flex items-center gap-3 px-4 py-4 text-xs font-mono uppercase tracking-widest border-2 border-[#141414] transition-all shadow-[4px_4px_0px_0px_rgba(20,20,20,0.1)] active:shadow-none active:translate-x-1 active:translate-y-1 ${activeDeepDiveTab === 'investors' ? 'bg-[#141414] text-[#E4E3E0] shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]' : 'bg-white hover:bg-gray-50'}`}
                        >
                          <Users className="w-4 h-4" />
                          Investor Match
                        </button>
                      </div>

                      {/* Main Content Area */}
                      <div className="lg:col-span-3 bg-white border-2 border-[#141414] p-8 md:p-12 min-h-[500px] shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] relative">
                        <div className="absolute top-4 right-4">
                          <button
                            onClick={() => {
                              let text = "";
                              if (activeDeepDiveTab === 'plan') text = deepDiveResult.business_plan;
                              if (activeDeepDiveTab === 'costs') text = deepDiveResult.cost_breakdown.map(c => `${c.item}: $${c.cost}`).join('\n');
                              if (activeDeepDiveTab === 'grants') text = deepDiveResult.grants.join('\n');
                              if (activeDeepDiveTab === 'checklist') text = deepDiveResult.checklist.join('\n');
                              if (activeDeepDiveTab === 'investors') text = deepDiveResult.investors.map(inv => `${inv.name} (${inv.stage}): ${inv.focus}`).join('\n');
                              copyToClipboard(text, activeDeepDiveTab);
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-[#141414] text-[10px] font-mono uppercase hover:bg-[#141414] hover:text-[#E4E3E0] transition-all"
                          >
                            {copied === activeDeepDiveTab ? (
                              <><Check className="w-3 h-3" /> Copied</>
                            ) : (
                              <><Copy className="w-3 h-3" /> Copy Text</>
                            )}
                          </button>
                        </div>

                        <AnimatePresence mode="wait">
                          {activeDeepDiveTab === 'plan' && (
                            <motion.div
                              key="plan"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="space-y-8"
                            >
                              <div className="bg-[#141414] text-[#E4E3E0] p-6 border-l-8 border-emerald-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
                                <h3 className="text-xs font-mono uppercase tracking-[0.3em] mb-2 opacity-60 text-emerald-400">Executive Summary</h3>
                                <p className="font-serif italic text-lg leading-relaxed">
                                  {selectedOpportunity.description}
                                </p>
                              </div>
                              
                              <div className="prose prose-sm max-w-none font-serif prose-headings:font-serif prose-headings:italic prose-headings:tracking-tight prose-p:leading-relaxed prose-headings:border-b prose-headings:border-gray-100 prose-headings:pb-2">
                                <Markdown>{deepDiveResult.business_plan}</Markdown>
                              </div>
                            </motion.div>
                          )}

                          {activeDeepDiveTab === 'costs' && (
                            <motion.div
                              key="costs"
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -20 }}
                              className="space-y-8"
                            >
                              {(() => {
                                const totalCost = deepDiveResult.cost_breakdown.reduce((acc, curr) => acc + curr.cost, 0);
                                return (
                                  <>
                                    <div className="flex items-end justify-between border-b-2 border-[#141414] pb-4">
                                      <h3 className="text-2xl font-serif italic tracking-tight">Startup Cost Estimator</h3>
                                      <div className="text-right">
                                        <div className="text-[10px] font-mono uppercase opacity-50">Total Capital Required</div>
                                        <div className="text-3xl font-bold font-mono">${totalCost}</div>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-1">
                                      <div className="grid grid-cols-4 px-4 py-2 bg-gray-100 font-mono text-[10px] uppercase tracking-widest opacity-50">
                                        <div className="col-span-2">Expense Item</div>
                                        <div className="text-right">Amount</div>
                                        <div className="text-right">Intensity</div>
                                      </div>
                                      {deepDiveResult.cost_breakdown.map((item, i) => {
                                        const percentage = (item.cost / totalCost) * 100;
                                        return (
                                          <div key={i} className="grid grid-cols-4 px-4 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors items-center">
                                            <div className="col-span-2 font-medium text-sm">{item.item}</div>
                                            <div className="text-right font-mono font-bold">${item.cost}</div>
                                            <div className="flex flex-col items-end gap-1 pl-4">
                                              <div className="text-[10px] font-mono font-bold">{Math.round(percentage)}%</div>
                                              <div className="w-full max-w-[80px] h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div 
                                                  className="h-full bg-[#141414]" 
                                                  style={{ width: `${percentage}%` }}
                                                />
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </>
                                );
                              })()}

                              <div className="bg-emerald-50 border border-emerald-200 p-4 flex gap-4 items-start">
                                <div className="p-2 bg-emerald-500 text-white rounded-lg">
                                  <Zap className="w-4 h-4" />
                                </div>
                                <div>
                                  <h4 className="text-xs font-mono uppercase font-bold text-emerald-900">Lean Strategy</h4>
                                  <p className="text-xs text-emerald-800 mt-1">This budget is optimized for a 7-day MVP launch. Avoid scaling until first revenue is captured.</p>
                                </div>
                              </div>
                            </motion.div>
                          )}

                          {activeDeepDiveTab === 'grants' && (
                            <motion.div
                              key="grants"
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -20 }}
                              className="space-y-8"
                            >
                              <div className="flex items-center gap-4 border-b-2 border-[#141414] pb-4">
                                <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
                                  <Coins className="w-6 h-6" />
                                </div>
                                <h3 className="text-2xl font-serif italic tracking-tight">Non-Dilutive Funding</h3>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {deepDiveResult.grants.map((grant, i) => (
                                  <div key={i} className="group relative bg-white border-2 border-[#141414] p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] transition-all">
                                    <div className="absolute -top-3 -right-3 bg-[#141414] text-[#E4E3E0] text-[10px] font-mono px-2 py-1 uppercase">
                                      Option {i + 1}
                                    </div>
                                    <h4 className="font-bold text-sm uppercase tracking-tight mb-3 pr-4">{grant}</h4>
                                    <div className="flex items-center gap-2 text-[10px] font-mono uppercase text-emerald-600 font-bold">
                                      <Check className="w-3 h-3" />
                                      High Eligibility
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <div className="bg-gray-50 p-6 border-2 border-dashed border-[#141414] relative overflow-hidden">
                                <div className="relative z-10">
                                  <p className="text-[10px] font-mono uppercase font-bold mb-2 opacity-50">Expert Guidance</p>
                                  <p className="text-sm leading-relaxed italic font-serif">
                                    &quot;Check your local Small Business Development Center (SBDC) for specific regional variations of these grants. Many local municipalities offer &apos;micro-grants&apos; specifically for businesses with startup costs under $5,000.&quot;
                                  </p>
                                </div>
                                <Lightbulb className="absolute -bottom-4 -right-4 w-24 h-24 opacity-[0.03] rotate-12" />
                              </div>
                            </motion.div>
                          )}

                          {activeDeepDiveTab === 'checklist' && (
                            <motion.div
                              key="checklist"
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -20 }}
                              className="space-y-8"
                            >
                              <div className="border-b-2 border-[#141414] pb-4">
                                <h3 className="text-2xl font-serif italic tracking-tight">30-Day Launch Sequence</h3>
                                <p className="text-[10px] font-mono uppercase opacity-50 mt-1">From Signal to First Dollar</p>
                              </div>

                              <div className="relative space-y-12 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                                {deepDiveResult.checklist.map((step, i) => (
                                  <div key={i} className="relative flex items-start gap-8 group">
                                    <div className="relative z-10 flex-shrink-0 w-10 h-10 bg-white border-2 border-[#141414] flex items-center justify-center font-serif italic font-bold text-xl group-hover:bg-[#141414] group-hover:text-white transition-all">
                                      {String(i + 1).padStart(2, '0')}
                                    </div>
                                    <div className="pt-1">
                                      <p className="text-base leading-snug font-medium group-hover:text-black transition-colors">{step}</p>
                                      <div className="mt-2 flex items-center gap-4 text-[10px] font-mono uppercase opacity-30">
                                        <span>Estimated: 2-3 Days</span>
                                        <span>•</span>
                                        <span>Priority: Critical</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}

                          {activeDeepDiveTab === 'investors' && (
                            <motion.div
                              key="investors"
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -20 }}
                              className="space-y-8"
                            >
                              <div className="border-b-2 border-[#141414] pb-4">
                                <h3 className="text-2xl font-serif italic tracking-tight">Investor Matchmaking</h3>
                                <p className="text-[10px] font-mono uppercase opacity-50 mt-1">Strategic Capital Alignment</p>
                              </div>

                              <div className="grid grid-cols-1 gap-6">
                                {deepDiveResult.investors.map((inv, i) => (
                                  <div key={i} className="group relative bg-white border-2 border-[#141414] p-8 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[12px_12px_0px_0px_rgba(20,20,20,1)] transition-all">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                      <div>
                                        <h4 className="font-bold text-xl uppercase tracking-tighter">{inv.name}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                          <span className="bg-black text-white text-[9px] font-mono px-2 py-0.5 uppercase tracking-widest">
                                            {inv.stage}
                                          </span>
                                          <span className="text-[10px] font-mono uppercase opacity-40">Niche Specialist</span>
                                        </div>
                                      </div>
                                      <div className="flex flex-col items-end">
                                        <div className="text-[9px] font-mono uppercase opacity-50 mb-1">Strategic Fit</div>
                                        <div className="flex gap-1">
                                          {[1, 2, 3, 4, 5].map((star) => (
                                            <div key={star} className={`w-3 h-3 rounded-full ${star <= 4 ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="bg-gray-50 p-4 border-l-4 border-[#141414]">
                                      <p className="text-sm italic font-serif leading-relaxed">&quot;{inv.focus}&quot;</p>
                                    </div>

                                    <div className="mt-6 flex items-center justify-between">
                                      <div className="flex items-center gap-2 text-[10px] font-mono uppercase opacity-40">
                                        <TrendingUp className="w-3 h-3" />
                                        High Conviction Match
                                      </div>
                                      <button className="text-[10px] font-mono uppercase font-bold underline underline-offset-4 hover:text-emerald-600 transition-colors">
                                        View Portfolio
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <div className="bg-[#141414] text-[#E4E3E0] p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="p-2 bg-blue-500 text-white rounded-lg">
                                    <Share2 className="w-4 h-4" />
                                  </div>
                                  <h4 className="text-xs font-mono uppercase font-bold tracking-widest">Outreach Strategy</h4>
                                </div>
                                <p className="text-sm font-serif italic leading-relaxed opacity-80">
                                  When reaching out, focus on the &quot;Why Now&quot; and the specific market signal that triggered this opportunity. Investors love data-backed timing and lean operators who understand their local context.
                                </p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Modal Footer */}
                <div className="border-t border-[#141414] p-4 bg-gray-50 flex justify-center">
                  <p className="text-[10px] font-mono uppercase tracking-widest opacity-40">
                    AI Business Advisor • Execution Suite v1.0 • Built for Small Operators
                  </p>
                </div>
              </motion.div>
            </motion.div>
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
