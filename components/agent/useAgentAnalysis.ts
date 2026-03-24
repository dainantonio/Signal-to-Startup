'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { Opportunity, AnalysisResult, DeepDiveResult, MarketMode } from '../types';
import { marketModeConfigs } from '../MarketModeSelector';
import {
  db,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  deleteDoc,
  doc,
  FirebaseUser,
} from '../../firebase';

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

export function useAgentAnalysis(user: FirebaseUser | null, selectedMode: MarketMode) {
  const [history, setHistory] = useState<(AnalysisResult & { id: string })[]>([]);
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

  useEffect(() => {
    if (user) {
      loadHistory(user.uid);
    } else {
      setHistory([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadHistory = async (uid: string) => {
    try {
      const q = query(
        collection(db, 'analyses'),
        where('userId', '==', uid),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as (AnalysisResult & { id: string })[];
      setHistory(docs);
    } catch (err) {
      console.error('Failed to load analysis history:', err);
    }
  };

  const deleteAnalysis = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'analyses', id));
      setHistory(prev => prev.filter(a => a.id !== id));
      if (result && (result as AnalysisResult & { id: string }).id === id) {
        setResult(null);
      }
    } catch (err) {
      console.error('Failed to delete analysis:', err);
    }
  };

  const fetchUrl = async () => {
    if (!urlInput.trim()) return;
    setFetchingUrl(true);
    try {
      const response = await fetch(`/api/fetch-url?url=${encodeURIComponent(urlInput)}`);
      if (!response.ok) throw new Error('Failed to fetch URL');
      const data = await response.json();
      setInput(data.content);
      setUrlInput('');
    } catch (err) {
      console.error(err);
      setError('Failed to fetch content from URL. Please ensure it\'s a public page.');
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
      const model = 'gemini-2.5-flash';

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
        Think: "What can someone start THIS WEEK?"
      `;

      const response = await genAI.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema,
        },
      });

      if (response.text) {
        const parsedResult = JSON.parse(response.text);

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
              marketMode: selectedMode,
            });
            savedId = docRef.id;
            loadHistory(user.uid);
          } catch (err) {
            console.error('Failed to save analysis to Firestore:', err);
          }
        }

        setResult({ ...parsedResult, id: savedId });
      } else {
        throw new Error('No response from AI');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to analyze signal. Please check your input and try again.');
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
      const model = 'gemini-2.5-flash';

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
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: deepDiveSchema,
        },
      });

      if (response.text) {
        setDeepDiveResult(JSON.parse(response.text));
      }
    } catch (err) {
      console.error(err);
      setError('Failed to generate execution plan.');
    } finally {
      setDeepDiveLoading(false);
    }
  }, [location]);

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
      filtered.sort((a, b) => (b.urgency * 10 + b.money_score) - (a.urgency * 10 + a.money_score));
    } else if (filterType === 'fast') {
      filtered.sort((a, b) => b.speed_to_launch - a.speed_to_launch);
    }

    return filtered;
  }, [result, filterType, minScore, grantOnly, maxCost]);

  const shareOnTwitter = () => {
    if (!result) return;
    const text = `AI Trend Intelligence: ${result.trend}\nBest Idea: ${result.best_idea.name}\n\nAnalyzed via AI Trend Intelligence Agent`;
    const url = (result as AnalysisResult & { id: string }).id
      ? `${window.location.origin}/analysis/${(result as AnalysisResult & { id: string }).id}`
      : window.location.href;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  };

  const shareOnLinkedIn = () => {
    if (!result) return;
    const url = (result as AnalysisResult & { id: string }).id
      ? `${window.location.origin}/analysis/${(result as AnalysisResult & { id: string }).id}`
      : window.location.href;
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
  };

  return {
    history,
    input, setInput,
    urlInput, setUrlInput,
    fetchingUrl, fetchUrl,
    location, setLocation,
    focus, setFocus,
    loading,
    result, setResult,
    error,
    filterType, setFilterType,
    minScore, setMinScore,
    grantOnly, setGrantOnly,
    maxCost, setMaxCost,
    selectedOpportunity, setSelectedOpportunity,
    deepDiveResult,
    deepDiveLoading,
    activeDeepDiveTab, setActiveDeepDiveTab,
    analyzeSignal,
    generateDeepDive,
    deleteAnalysis,
    filteredOpportunities,
    shareOnTwitter,
    shareOnLinkedIn,
  };
}
