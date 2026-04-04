'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { Opportunity, AnalysisResult, DeepDiveResult, MarketMode, FeedSignal } from '../types';
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
// Reading level prompt fragments
// ---------------------------------------------------------------------------
const READING_LEVEL_PROMPTS = {
  simple: `
WRITING STYLE — SIMPLE MODE:
Write everything at a Grade 6-8 reading level.
Use short sentences. Use everyday words.
Never use business jargon or startup terminology.
Write like a smart friend explaining over lunch.
Instead of "B2C revenue model" say "selling directly to customers".
"market penetration" say "getting your first customers".
"ROI potential" say "how much money you could make".
"value proposition" say "why people would choose you".
Keep opportunity descriptions under 2 sentences.
First steps must be specific and actionable today.
Cost estimates must feel achievable — break into phases if large.
Always use local currency and local examples.
`,
  standard: `
WRITING STYLE — STANDARD MODE:
Write clearly for an educated entrepreneur who is not a startup insider.
Explain business concepts briefly when used.
Balance professional tone with accessibility.
Use local currency and context throughout.
`,
  advanced: `
WRITING STYLE — ADVANCED MODE:
Write for sophisticated founders and investors.
Include market sizing language, competitive moats, unit economics thinking, and growth trajectory.
Use standard startup and VC terminology.
Be precise with metrics and financial projections.
`,
} as const;

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
    today_action: {
      type: Type.STRING,
      description: "ONE specific thing the user can do TODAY. One sentence. Starts with a verb. Free. Under 25 words."
    },
    today_action_type: {
      type: Type.STRING,
      description: "one of: research, talk, build, apply, test"
    },
    summary: { 
      type: Type.STRING, 
      description: "2 sentences max." 
    },
    trend: { 
      type: Type.STRING,
      description: "One sentence max."
    },
    affected_groups: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Max 3 items."
    },
    problems: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Max 2 items."
    },
    opportunities: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING, description: "Max 2 sentences." },
          target_customer: { type: Type.STRING },
          why_now: { type: Type.STRING, description: "One sentence max." },
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
        reason: { type: Type.STRING, description: "2 sentences max." },
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
  required: [
    "today_action",
    "today_action_type", 
    "summary",
    "trend",
    "affected_groups",
    "problems",
    "opportunities",
    "best_idea"
  ]
};

const deepDiveSchema = {
  type: Type.OBJECT,
  properties: {
    business_plan: { type: Type.STRING, description: "Complete business plan with exactly 9 numbered sections as plain text." },
    cost_breakdown: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          item: { type: Type.STRING, description: "Name of the expense item" },
          cost: { type: Type.INTEGER, description: "Estimated cost in USD." },
          type: { type: Type.STRING, description: "'one-time' or 'monthly'" },
          notes: { type: Type.STRING, description: "Optional tip, free tier info, or variation." }
        },
        required: ["item", "cost", "type"]
      }
    },
    grants: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Exact name of the grant or funding program." },
          organization: { type: Type.STRING, description: "The organization offering it." },
          amount: { type: Type.STRING, description: "Estimated amount or range." },
          link: { type: Type.STRING, description: "Direct URL to apply or learn more." },
          why_fit: { type: Type.STRING, description: "One sentence on why this business qualifies." }
        },
        required: ["name", "organization", "amount", "link", "why_fit"]
      }
    },
    marketing_strategy: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          channel: { type: Type.STRING },
          tactic: { type: Type.STRING },
          cost: { type: Type.STRING },
          effort: { type: Type.STRING, description: "Low, Medium, or High" }
        },
        required: ["channel", "tactic", "cost", "effort"]
      }
    }
  },
  required: ["business_plan", "cost_breakdown", "grants", "marketing_strategy"]
};

// ---------------------------------------------------------------------------
// Hook: useAgentAnalysis
// ---------------------------------------------------------------------------
export function useAgentAnalysis(
  user: FirebaseUser | null, 
  selectedMode: MarketMode,
  countryTags: string[],
  readingLevel: 'simple' | 'standard' | 'advanced'
) {
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const cancelAnalysis = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
  }, []);

  const analyzeSignal = async (signalText: string, location?: string, focus?: string) => {
    if (!signalText.trim()) return;

    // Reset UI state
    setResult(null);
    setError(null);
    setLoadingProgress(0);

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      console.error('[AUTH] GEMINI_API_KEY missing from environment');
      setError('Gemini API key not configured.');
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

      const trimmedForGemini = sanitizeInput(signalText);

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
        - Keep ALL text fields concise — descriptions under 2 sentences, trend under 1 sentence, today_action under 25 words
        - You MUST return EXACTLY 3 opportunities. Not 2, not 4, not 5. EXACTLY 3.
        - Each opportunity must be a distinct business model.
        - If the signal only supports 1-2 strong ideas, create adjacent opportunities in the same space.
        - Be specific, not generic
        - Avoid vague startup ideas
        - ALL ideas must be lean to start — achievable without large upfront capital.
        - Set 'status' to 'New' for all new opportunities.
        - Assign a 'priority' (High, Medium, Low) based on the balance of ROI potential vs. difficulty.
        - Identify if an idea is likely to qualify for government funding or grants (e.g., sustainability, rural development, small business support).
        - Prioritize ideas that can be launched quickly
        - Favor underserved or overlooked markets
        - Highlight opportunities that small operators can execute
        - Tailor at least 2 ideas to the provided location (${location || 'United States'})
        - Heavily weight opportunities toward the specified focus: ${focus || 'General Business'}
        - For 'best_idea', provide a realistic 'cost_estimate' and 'speed_rating' (Fast, Medium, Slow).
        - today_action must be ONE sentence only
        - today_action must start with a verb
        - today_action must be free to do
        - today_action must be completable today
        - today_action must be specific — not 'research the market' but 'Search Google for [specific thing] and write down [what]'
        - Tailor today_action to the user's country and market context

        MARKET CONTEXT:
        ${marketModeConfigs[selectedMode].promptContext}

        MONEY SCORE & BENCHMARKING
        For each opportunity, rate 1-10 and calculate:
        Money Score = ((ROI * 0.30) + (Speed * 0.20) + ((10 - Difficulty) * 0.15) + (Urgency * 0.15) + (Local Fit * 0.10) + (Competition Gap * 0.10)) * 10
        Return as 'money_score'. In 'description', briefly compare to real-world sector averages.

        TONE: Clear, sharp, execution-focused. Think: "What can someone start THIS WEEK?"

        ${buildCountryPrompt(countryTags)}

        ${READING_LEVEL_PROMPTS[readingLevel]}

        ${trimmedForGemini.toLowerCase().includes('ai') || trimmedForGemini.toLowerCase().includes('artificial intelligence') ? `
        For this AI-focused signal, explicitly assess:
        1. Is this a PROVEN trend with documented ROI and real adoption data? (AI Truth)
        2. Or is this an EARLY SIGNAL that needs validation? (Emerging)
        3. Or is this primarily HYPE with little real-world traction? (Fad)

        Add to the JSON response:
        'ai_verdict': 'Truth' | 'Emerging' | 'Fad',
        'ai_evidence': 'One sentence explaining the verdict',
        'real_world_roi': 'Any documented ROI examples or null'
        ` : ''}
      `;

      const responseStream = await genAI.models.generateContentStream({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
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
      console.log('[ANALYSIS] today_action present:', !!parsedResult?.today_action, parsedResult?.today_action?.slice(0, 50));
      console.log('[6] parsed result — trend:', parsedResult?.trend, '| opportunities:', parsedResult?.opportunities?.length);
      console.log('[ANALYSIS] today_action:', parsedResult?.today_action?.slice(0, 80));

      // Enforce exactly 3 opportunities
      if (!parsedResult.opportunities || parsedResult.opportunities.length < 2) {
        throw new Error('Insufficient opportunities returned — please try again.');
      }
      // Pad to 3 if only 2 returned
      const base = parsedResult.opportunities[0];
      while (parsedResult.opportunities.length < 3) {
        parsedResult.opportunities.push({
          name: 'Adjacent Service Opportunity',
          description: 'A complementary service business serving the same market segment identified in this signal.',
          target_customer: base?.target_customer || 'Small business owners',
          why_now: base?.why_now || 'Market conditions create immediate demand.',
          monetization: 'Service fees',
          pricing_model: 'Monthly retainer or per-project',
          status: 'New',
          priority: 'Medium',
          startup_cost: 500,
          grant_eligible: false,
          speed_to_launch: 7,
          difficulty: 4,
          roi_potential: 6,
          urgency: 5,
          local_fit: 6,
          competition_gap: 5,
          money_score: 60,
        });
      }
      // Trim to exactly 3
      parsedResult.opportunities = parsedResult.opportunities.slice(0, 3);

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
            today_action: parsedResult.today_action || null,
            today_action_type: parsedResult.today_action_type || null,
            createdAt: new Date().toISOString(),
            marketMode: selectedMode,
            countryTag: countryTags.length > 0 ? countryTags.join(',') : null,
          });
          savedId = docRef.id;
          console.log('[8] Firestore save complete, id:', savedId);
          // Trigger a history reload if needed - but loadHistory is not passed here anymore
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
      // Track usage — fire and forget
      try {
        if (user) {
          addDoc(collection(db, 'usage_logs'), {
            userId: user.uid,
            type: 'analysis',
            marketMode: selectedMode || 'global',
            countryTag: countryTags?.[0] || null,
            isCompound: false,
            timestamp: new Date().toISOString(),
          }).catch(() => {});
        }
      } catch {}
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

  const analyzeCompoundSignal = async (articles: FeedSignal[]) => {
    if (articles.length < 2) return;

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) { setError('Gemini API key not configured.'); return; }

    setLoading(true);
    setError(null);
    setLoadingStage(0);
    setLoadingProgress(5);

    const progressInterval = setInterval(() => {
      setLoadingProgress(p => Math.min(p + 2, 90));
    }, 400);

    try {
      const compoundText = articles.map((a, i) =>
        `Signal ${i + 1} — ${a.source}:\n${a.title}\n${a.snippet}`
      ).join('\n\n---\n\n');

      const marketContext = marketModeConfigs[selectedMode]?.promptContext || '';
      const countryLine = countryTags.length > 0 ? `TARGET MARKET: ${countryTags.join(', ')}` : '';

      const genAI = new GoogleGenAI({ apiKey });
      const response = await genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: `You are an expert market analyst specializing in compound business opportunities — opportunities that emerge from the convergence of multiple market signals simultaneously.

MULTIPLE SIGNALS DETECTED:
${compoundText}

${marketContext}
${countryLine}

TASK: Analyze how these ${articles.length} signals TOGETHER create opportunities that NONE of them would reveal individually. Look for convergence patterns, timing advantages, compound market gaps, and second/third order effects.

Return ONLY valid JSON in this exact structure:
{
  "compound_trend": "One sentence describing the convergence pattern",
  "trend": "Same as compound_trend",
  "convergence_score": <number 0-100 how strongly these signals reinforce each other>,
  "signal_connections": ["How signal 1 and 2 are connected", "How signal 2 and 3 are connected"],
  "summary": "2-3 sentences on the compound opportunity",
  "affected_groups": ["group1", "group2", "group3"],
  "problems": ["compound problem 1", "compound problem 2"],
  "opportunities": [
    {
      "name": "opportunity name",
      "description": "Why this needs ALL signals to be true",
      "compound_advantage": "What makes this stronger than single-signal opportunities",
      "target_customer": "specific customer",
      "why_now": "Why the timing of ALL signals matters",
      "monetization": "how to make money",
      "pricing_model": "specific pricing",
      "status": "New",
      "priority": "High",
      "startup_cost": <number under 2000>,
      "grant_eligible": <boolean>,
      "speed_to_launch": <number 1-10>,
      "difficulty": <number 1-10>,
      "roi_potential": <number 1-10>,
      "urgency": <number 1-10>,
      "local_fit": <number 1-10>,
      "competition_gap": <number 1-10>,
      "money_score": <number 0-100>
    }
  ],
  "best_idea": {
    "name": "best opportunity name",
    "reason": "why this compound signal makes this the best idea",
    "who_should_build": "who",
    "cost_estimate": "$X - $Y",
    "speed_rating": "Fast",
    "first_steps": ["step1", "step2", "step3"]
  }
}` }]}]
      });

      const text = response.response.text();
      const parsed = JSON.parse(text);
      setResult(parsed);

    } catch (err) {
      setError('Compound analysis failed.');
      console.error(err);
    } finally {
      clearInterval(progressInterval);
      setLoading(false);
    }
  };

  const deepDiveOpportunity = async (opportunity: Opportunity, signalText: string) => {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) return null;

    try {
      const genAI = new GoogleGenAI({ apiKey });
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: deepDiveSchema,
        },
      });

      const prompt = `
        You are a business consultant helping an entrepreneur launch a new business.
        SIGNAL: ${signalText}
        BUSINESS IDEA: ${opportunity.name}
        DESCRIPTION: ${opportunity.description}
        TARGET CUSTOMER: ${opportunity.target_customer}
        MONETIZATION: ${opportunity.monetization}
        LOCATION: ${countryTags.join(', ') || 'Global'}

        TASK: Provide a deep-dive execution plan.
        1. BUSINESS PLAN: Write a concise 9-section plan (Problem, Solution, Market, Revenue, Marketing, Operations, Team, Risks, Milestones).
        2. COST BREAKDOWN: List 5-8 specific items needed to start, with costs in USD. Total must be around ${opportunity.startup_cost} USD.
        3. GRANTS: Find 2-3 REAL grants, loans, or programs in ${countryTags[0] || 'the target market'} that this business could qualify for.
        4. MARKETING: 3 specific marketing tactics with effort/cost ratings.

        TONE: Practical, encouraging, and highly specific.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const data = JSON.parse(response.text()) as DeepDiveResult;
      return data;
    } catch (err) {
      console.error('[DEEP DIVE FAILED]', err);
      return null;
    }
  };

  return {
    loading,
    loadingStage,
    loadingProgress,
    result,
    setResult,
    error,
    cancelAnalysis,
    analyzeSignal,
    analyzeCompoundSignal,
    deepDiveOpportunity,
  };
}
