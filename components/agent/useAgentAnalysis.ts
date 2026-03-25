'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { Opportunity, AnalysisResult, DeepDiveResult, MarketMode } from '../types';
import { marketModeConfigs } from '../MarketModeSelector';
import { COUNTRY_CONTEXT } from '../../lib/rss-sources';
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

// ---------------------------------------------------------------------------
// Session cache (max 10 entries, keyed by sanitized input)
// ---------------------------------------------------------------------------
const analysisCache = new Map<string, AnalysisResult>();
const MAX_CACHE_SIZE = 10;

function sanitizeInput(raw: string): string {
  return raw
    .replace(/https?:\/\/\S+/g, '')      // strip URLs
    .replace(/\S+@\S+\.\S+/g, '')        // strip emails
    .replace(/\s+/g, ' ')               // collapse whitespace
    .trim()
    .slice(0, 2000);                     // cap at 2000 chars
}

// ---------------------------------------------------------------------------
// Country context prompt builder
// ---------------------------------------------------------------------------

function buildCountryPrompt(countryTags: string[]): string {
  if (!countryTags.length) return '';

  return countryTags.map(tag => {
    const ctx = COUNTRY_CONTEXT[tag.toLowerCase()];
    if (!ctx) return '';

    const base = `
COUNTRY CONTEXT — ${tag.toUpperCase()}:
You are analyzing this signal specifically for small business opportunities in ${tag}.
Tailor every opportunity to the following local realities:
- Local currency is ${ctx.currency} — express all startup costs in BOTH USD and ${ctx.currency}
- Focus on problems that exist specifically in this market
- Consider local infrastructure constraints (power, internet, logistics, banking access)
- Identify which opportunities can be started informally (no company registration required to begin)
- Flag which grants or funding sources are available specifically in ${tag}
- Use language and examples that resonate locally
- Target customers must be described in local context (e.g. "market vendors in Kingston" not just "small businesses")`;

    const extras: Record<string, string> = {
      jamaica: `
FOR JAMAICA SPECIFICALLY:
- Reference DBJ (Development Bank of Jamaica) loans for qualifying ventures
- Reference JBDC (Jamaica Business Development Corporation) for business support services
- Reference MSME policy incentives under the Jamaica MSME & Entrepreneurship Policy
- Consider remittance economy opportunities (Jamaica receives ~$3B USD/year in remittances)
- Consider tourism-adjacent business models given Jamaica's 4M+ annual tourist visits
- Reference HEART/NSTA Trust for workforce training opportunities
- Consider Jamaica's creative economy (music, film, fashion exports)`,
      nigeria: `
FOR NIGERIA SPECIFICALLY:
- Reference CBN (Central Bank of Nigeria) SME funding schemes
- Reference SMEDAN (Small and Medium Enterprises Development Agency of Nigeria)
- Consider fintech and mobile money given Nigeria's large unbanked population
- Reference Lagos, Abuja, and Port Harcourt as key commercial centers
- Consider informal sector integration strategies`,
      ghana: `
FOR GHANA SPECIFICALLY:
- Reference NBSSI (National Board for Small Scale Industries) support
- Reference Ghana Export Promotion Authority for export-oriented ideas
- Consider mobile money ecosystem (MTN MoMo widely used)`,
      kenya: `
FOR KENYA SPECIFICALLY:
- Reference Kenya Industrial Estates (KIE) for SME support
- Reference M-Pesa ecosystem for mobile payment integration
- Consider Nairobi as East Africa's tech hub (Silicon Savannah)`,
    };

    return base + (extras[tag.toLowerCase()] ?? '');
  }).filter(Boolean).join('\n\n');
}

// ---------------------------------------------------------------------------
// Loading stage labels
// ---------------------------------------------------------------------------
export const LOADING_STAGE_LABELS = [
  'Reading signal...',
  'Identifying opportunities...',
  'Scoring and ranking...',
  'Done',
] as const;

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
          stage: { type: Type.STRING, description: "Typical investment stage (e.g., 'Seed', 'Pre-seed', 'Angel')." },
          website: { type: Type.STRING, description: "The investor's actual homepage URL (e.g., 'https://www.sequoiacap.com'). If unknown, leave empty string." }
        },
        required: ["name", "focus", "stage", "website"]
      },
      description: "List of 3-5 potential investors or VC firms that align with this niche."
    }
  },
  required: ["business_plan", "cost_breakdown", "grants", "checklist", "investors"]
};

export function useAgentAnalysis(user: FirebaseUser | null, selectedMode: MarketMode, countryTags: string[] = []) {
  const [history, setHistory] = useState<(AnalysisResult & { id: string })[]>([]);
  const [input, setInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [fetchingUrl, setFetchingUrl] = useState(false);
  const [location, setLocation] = useState('');
  const [focus, setFocus] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'top' | 'hot' | 'fast'>('top');
  const [minScore, setMinScore] = useState(0);
  const [grantOnly, setGrantOnly] = useState(false);
  const [maxCost, setMaxCost] = useState(2000);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [deepDiveResult, setDeepDiveResult] = useState<DeepDiveResult | null>(null);
  const [deepDiveLoading, setDeepDiveLoading] = useState(false);
  const [activeDeepDiveTab, setActiveDeepDiveTab] = useState<'plan' | 'costs' | 'grants' | 'checklist' | 'investors'>('plan');
  const deepDiveCache = useRef<Map<string, DeepDiveResult>>(new Map());
  // Ref-based cancellation flag — avoids async state race after modal close
  const deepDiveCancelledRef = useRef(false);

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

  const cancelAnalysis = () => {
    abortControllerRef.current?.abort();
    setLoading(false);
    // Do NOT clear result — keep existing results visible after cancel
  };

  const analyzeSignal = async (overrideInput?: string) => {
    console.log('[1] analyzeSignal called');

    const rawText = overrideInput ?? input;

    // [CHECK] Input validation
    if (!rawText || rawText.trim().length < 10) {
      console.error('[FAIL] Input text is empty or too short:', rawText?.length ?? 0, 'chars');
      setError('No article text to analyze. Please try another article.');
      return;
    }
    console.log('[2] input text length:', rawText.length);

    if (overrideInput) setInput(overrideInput);

    const signalText = sanitizeInput(rawText);
    console.log('[2b] sanitized text length:', signalText.length);

    // Trim to first 1500 chars — the signal is always at the opening of an article
    const trimmedForGemini = signalText.trim().substring(0, 1500).replace(/\s+/g, ' ');

    // [CHECK] API key
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      console.error('[FAIL] NEXT_PUBLIC_GEMINI_API_KEY is not set');
      setError('Gemini API key not configured. Check your environment variables.');
      return;
    }
    console.log('[KEY] Gemini API key present:', true);

    // Return cached result — cycle loading true→false so card pop-out clears
    if (analysisCache.has(signalText)) {
      console.log('[CACHE HIT] returning cached result');
      setLoading(true);
      setResult(analysisCache.get(signalText)!);
      // requestAnimationFrame ensures loading=true commits before false,
      // triggering the prevLoadingRef transition detector in SignalInput
      requestAnimationFrame(() => setLoading(false));
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const { signal } = controller;

    setLoading(true);
    setError(null);
    setLoadingStage(0);
    setLoadingProgress(5);

    // Smooth progress bar — advances every 400ms regardless of actual API progress
    const progressInterval = setInterval(() => {
      setLoadingProgress(p => Math.min(p + 2, 90));
    }, 400);

    try {
      const genAI = new GoogleGenAI({ apiKey });
      const model = 'gemini-2.5-flash';
      console.log('[3] calling Gemini API with model:', model);
      console.log('[ABORT] signal aborted at start:', signal.aborted);

      const prompt = `
        You are an AI Trend Intelligence Agent.
        Your job is to analyze news articles, policy updates, and market signals to identify actionable business and product opportunities.
        You think like a startup founder, investor, and operator focused on execution.

        INPUT:
        ${trimmedForGemini}

        LOCATION:
        ${location || 'United States'}

        FOCUS/NICHE:
        ${focus || 'General Business'}

        RULES:
        - Return exactly 3 opportunities maximum, prioritized by money_score.
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

        MONEY SCORE & BENCHMARKING
        For each opportunity, rate 1-10 and calculate:
        Money Score = ((ROI * 0.30) + (Speed * 0.20) + ((10 - Difficulty) * 0.15) + (Urgency * 0.15) + (Local Fit * 0.10) + (Competition Gap * 0.10)) * 10
        Return as 'money_score'. In 'description', briefly compare to real-world sector averages.

        TONE: Clear, sharp, execution-focused. Think: "What can someone start THIS WEEK?"

        ${buildCountryPrompt(countryTags)}
      `;

      const responseStream = await genAI.models.generateContentStream({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema,
          maxOutputTokens: 8192,
        },
      });
      console.log('[4] Gemini stream opened');

      let accumulated = '';
      let chunksReceived = 0;
      let localStage = 0;

      // Stage label timing (0-2s, 2-5s, 5-8s, 8s+)
      const stageTimers = [
        setTimeout(() => { setLoadingStage(0); }, 0),
        setTimeout(() => { setLoadingStage(1); }, 2000),
        setTimeout(() => { setLoadingStage(2); }, 5000),
      ];

      for await (const chunk of responseStream) {
        if (signal.aborted) {
          stageTimers.forEach(clearTimeout);
          console.log('[ABORT] signal aborted mid-stream, exiting');
          return;
        }
        const text = chunk.text ?? '';
        accumulated += text;
        chunksReceived++;

        if (chunksReceived === 1 && localStage === 0) {
          console.log('[4a] first chunk received, text length:', text.length);
          localStage = 1;
        } else if (accumulated.length > 400 && localStage === 1) {
          localStage = 2;
        }
      }
      stageTimers.forEach(clearTimeout);

      console.log('[4b] stream complete. chunks:', chunksReceived, 'accumulated length:', accumulated.length);

      // Bail cleanly if cancelled after stream ends
      if (signal.aborted) {
        console.log('[ABORT] signal aborted after stream, exiting');
        return;
      }

      if (!accumulated.trim()) {
        console.error('[FAIL] Gemini returned empty response after', chunksReceived, 'chunks');
        throw new Error('Gemini returned an empty response. This can happen with structured output — please try again.');
      }

      clearInterval(progressInterval);
      setLoadingProgress(95);
      console.log('[5] parsing response, first 200 chars:', accumulated.slice(0, 200));

      let parsedResult: AnalysisResult;
      try {
        parsedResult = JSON.parse(accumulated);
      } catch (parseErr) {
        console.error('[FAIL] JSON parse failed:', parseErr);
        console.error('[RAW RESPONSE]', accumulated.slice(0, 500));
        throw new Error('The AI returned an incomplete response. Please try again.');
      }
      console.log('[6] parsed result — trend:', parsedResult?.trend, '| opportunities:', parsedResult?.opportunities?.length);

      // Evict oldest cache entry if at capacity
      if (analysisCache.size >= MAX_CACHE_SIZE) {
        const firstKey = analysisCache.keys().next().value;
        if (firstKey !== undefined) analysisCache.delete(firstKey);
      }
      analysisCache.set(signalText, parsedResult);

      let savedId = '';
      if (user) {
        console.log('[7] saving to Firestore...');
        try {
          const docRef = await addDoc(collection(db, 'analyses'), {
            userId: user.uid,
            signal: signalText,
            trend: parsedResult.trend,
            summary: parsedResult.summary,
            affected_groups: parsedResult.affected_groups,
            problems: parsedResult.problems,
            opportunities: parsedResult.opportunities,
            best_idea: parsedResult.best_idea,
            createdAt: new Date().toISOString(),
            marketMode: selectedMode,
            countryTag: countryTags.length > 0 ? countryTags.join(',') : null,
          });
          savedId = docRef.id;
          console.log('[8] Firestore save complete, id:', savedId);
          loadHistory(user.uid);
        } catch (firestoreErr) {
          // Firestore failure must NOT prevent results from showing
          console.warn('[FIRESTORE] Save failed, continuing without save:', firestoreErr);
        }
      }

      if (signal.aborted) {
        console.log('[ABORT] signal aborted before setResult, exiting');
        return;
      }

      console.log('[9] setting result state...');
      setLoadingStage(3);
      clearInterval(progressInterval);
      setLoadingProgress(100);
      setResult({ ...parsedResult, id: savedId });
      console.log('[10] result set — analysis complete');
      console.log('[10b] opportunities count:', parsedResult?.opportunities?.length, '| trend:', parsedResult?.trend?.slice(0, 60));

    } catch (err: unknown) {
      // Always log — never silently swallow errors
      console.error('[ANALYSIS FAILED]', err);
      console.error('[ERROR TYPE]', typeof err);
      console.error('[ERROR MESSAGE]', err instanceof Error ? err.message : String(err));
      console.error('[ERROR STACK]', err instanceof Error ? err.stack : 'no stack');

      if (!signal.aborted) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('resource_exhausted')) {
          setError('API quota exceeded. Please try again tomorrow or upgrade your Gemini API plan at ai.google.dev.');
        } else {
          setError(err instanceof Error ? err.message : 'Failed to analyze signal. Please check your input and try again.');
        }
      }
    } finally {
      // ALWAYS clear loading state — never leave the UI stuck
      clearInterval(progressInterval);
      console.log('[FINALLY] clearing loading. aborted:', signal.aborted);
      setLoading(false);
    }
  };

  const cancelDeepDive = useCallback(() => {
    deepDiveCancelledRef.current = true;
    setDeepDiveLoading(false);
    setDeepDiveResult(null);
  }, []);

  const generateDeepDive = useCallback(async (opp: Opportunity) => {
    // Reset cancellation flag — this is a fresh generation
    deepDiveCancelledRef.current = false;

    setSelectedOpportunity(opp);
    setActiveDeepDiveTab('plan');

    // Return cached result instantly
    const cacheKey = opp.name;
    if (deepDiveCache.current.has(cacheKey)) {
      if (!deepDiveCancelledRef.current) {
        setDeepDiveResult(deepDiveCache.current.get(cacheKey)!);
        setDeepDiveLoading(false);
      }
      return;
    }

    setDeepDiveLoading(true);
    setDeepDiveResult(null);

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
           For each investor, include their actual homepage URL in the 'website' field if you know it with confidence (e.g., Sequoia = https://www.sequoiacap.com, a16z = https://a16z.com).
           If you are not certain of their URL, leave website as an empty string — do not guess.

        TONE: Professional, encouraging, and highly practical.
        Be concise — each field should be 1-2 sentences. Do not over-explain.
      `;

      const response = await genAI.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: deepDiveSchema,
          maxOutputTokens: 2000,
        },
      });

      if (response.text && !deepDiveCancelledRef.current) {
        const parsed: DeepDiveResult = JSON.parse(response.text);
        // Cache so re-opens are instant (even if this call was for a closed modal)
        if (deepDiveCache.current.size >= 5) {
          const firstKey = deepDiveCache.current.keys().next().value;
          if (firstKey !== undefined) deepDiveCache.current.delete(firstKey);
        }
        deepDiveCache.current.set(cacheKey, parsed);
        // Only update UI state if modal is still open
        if (!deepDiveCancelledRef.current) {
          setDeepDiveResult(parsed);
        }
      }
    } catch (err: unknown) {
      if (deepDiveCancelledRef.current) return; // Swallow errors from cancelled calls
      console.error(err);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('resource_exhausted')) {
        setError('API quota exceeded. You\'ve hit the free-tier daily limit. Please try again tomorrow or upgrade your Gemini API plan at ai.google.dev.');
      } else {
        setError('Failed to generate execution plan.');
      }
    } finally {
      if (!deepDiveCancelledRef.current) {
        setDeepDiveLoading(false);
      }
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
    const text = `AI Trend Intelligence: ${result.trend}\nBest Idea: ${result.best_idea.name}\n\nAnalyzed via Signal to Startup`;
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
    loadingStage,
    loadingProgress,
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
    cancelAnalysis,
    generateDeepDive,
    cancelDeepDive,
    deleteAnalysis,
    filteredOpportunities,
    shareOnTwitter,
    shareOnLinkedIn,
  };
}
