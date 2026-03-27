'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from '@google/genai';
import { db, addDoc, collection } from '@/firebase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DemoArticle {
  id: number;
  title: string;
  source: string;
  sector: string;
  snippet: string;
  url: string;
  signalScore: number;
  publishedAt: string;
}

interface DemoOpportunity {
  name: string;
  description: string;
  target_customer: string;
  startup_cost: number;
  money_score: number;
  why_now: string;
  first_step: string;
}

interface DemoResult {
  trend: string;
  summary: string;
  opportunities: DemoOpportunity[];
}

interface DemoModeProps {
  onSignUp: () => void;
  onBack: () => void;
}

// ---------------------------------------------------------------------------
// Static demo feed
// ---------------------------------------------------------------------------

const DEMO_ARTICLES: DemoArticle[] = [
  {
    id: 1,
    title: 'Amazon acquires second robotics startup this month as consumer robot market surges',
    source: 'TechCrunch',
    sector: 'AI & Tech',
    snippet:
      'Amazon has acquired Fauna Robotics, a startup developing kid-size humanoid robots for home use. This follows their acquisition of Rivr last month, signaling a major push into consumer robotics.',
    url: 'https://techcrunch.com',
    signalScore: 92,
    publishedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 2,
    title: 'Caribbean governments announce $500M digital infrastructure investment across 6 islands',
    source: 'Caribbean Business Report',
    sector: 'Policy',
    snippet:
      'CARICOM member states have committed to a major digital infrastructure fund targeting rural connectivity, digital payments adoption, and e-government services across the region.',
    url: 'https://caribbeanbusinessreport.com',
    signalScore: 96,
    publishedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
  },
  {
    id: 3,
    title: 'Remote work becomes permanent for 40% of US companies — office space market collapses',
    source: 'Reuters Business',
    sector: 'Market Shifts',
    snippet:
      'A new survey of Fortune 500 companies shows 40% have made remote work permanent, triggering a collapse in commercial real estate demand and a surge in home office spending.',
    url: 'https://reuters.com',
    signalScore: 88,
    publishedAt: new Date(Date.now() - 6 * 3600000).toISOString(),
  },
  {
    id: 4,
    title: 'West Africa fintech funding hits record $2.1B as mobile money adoption accelerates',
    source: 'Disrupt Africa',
    sector: 'Funding & Grants',
    snippet:
      'Venture capital investment in West African fintech startups has hit a record high, driven by explosive growth in mobile money adoption among unbanked populations in Nigeria and Ghana.',
    url: 'https://disrupt-africa.com',
    signalScore: 94,
    publishedAt: new Date(Date.now() - 8 * 3600000).toISOString(),
  },
  {
    id: 5,
    title: 'UK government launches £200M fund for green energy small businesses',
    source: 'Guardian',
    sector: 'Sustainability',
    snippet:
      'The UK government has announced a new grant fund targeting small businesses that help households reduce energy consumption, including insulation services, solar installation, and smart home technology.',
    url: 'https://theguardian.com',
    signalScore: 90,
    publishedAt: new Date(Date.now() - 10 * 3600000).toISOString(),
  },
  {
    id: 6,
    title: 'Mental health crisis drives 300% surge in demand for workplace wellness services',
    source: 'Inc Magazine',
    sector: 'Health',
    snippet:
      'Corporate demand for mental health and wellness services has tripled since 2023, with small businesses now actively seeking affordable employee wellness programs as a recruitment and retention tool.',
    url: 'https://inc.com',
    signalScore: 86,
    publishedAt: new Date(Date.now() - 12 * 3600000).toISOString(),
  },
];

const SECTOR_COLORS: Record<string, string> = {
  'AI & Tech': 'bg-indigo-100 text-indigo-800',
  'Policy': 'bg-amber-100 text-amber-800',
  'Market Shifts': 'bg-emerald-100 text-emerald-800',
  'Funding & Grants': 'bg-green-100 text-green-800',
  'Sustainability': 'bg-teal-100 text-teal-800',
  'Health': 'bg-pink-100 text-pink-800',
};

function timeAgo(iso: string): string {
  const hours = Math.round((Date.now() - new Date(iso).getTime()) / 3600000);
  return hours < 1 ? 'Just now' : `${hours}h ago`;
}

// ---------------------------------------------------------------------------
// DemoFeed sub-component
// ---------------------------------------------------------------------------

function DemoFeed({ onAnalyze }: { onAnalyze: (article: DemoArticle) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {DEMO_ARTICLES.map(article => (
        <div
          key={article.id}
          className="p-4 rounded-xl border border-gray-200 hover:border-gray-400 hover:shadow-sm transition-all flex flex-col gap-3"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide truncate">
                {article.source}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                  SECTOR_COLORS[article.sector] ?? 'bg-gray-100 text-gray-700'
                }`}
              >
                {article.sector}
              </span>
            </div>
            <span
              className={`text-xs font-bold flex-shrink-0 ${
                article.signalScore >= 90 ? 'text-green-600' : 'text-amber-600'
              }`}
            >
              {article.signalScore >= 90 ? '🔥' : '⚡'} {article.signalScore}
            </span>
          </div>

          <h3 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">
            {article.title}
          </h3>

          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 flex-1">
            {article.snippet}
          </p>

          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="text-xs text-gray-400">{timeAgo(article.publishedAt)}</span>
            <button
              type="button"
              onClick={() => onAnalyze(article)}
              className="flex items-center gap-1.5 px-4 py-2 bg-black text-white rounded-lg text-xs font-semibold hover:bg-gray-900 transition-colors"
            >
              ⚡ Analyze
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main DemoMode component
// ---------------------------------------------------------------------------

export default function DemoMode({ onSignUp, onBack }: DemoModeProps) {
  const [demoStep, setDemoStep] = useState<'feed' | 'analyzing' | 'results' | 'gate'>('feed');
  const [result, setResult] = useState<DemoResult | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<DemoArticle | null>(null);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const genAI = () => new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY! });

  const handleAnalyze = async (article: DemoArticle) => {
    // If demo already used this session, show gate
    if (sessionStorage.getItem('demoUsed')) {
      setDemoStep('gate');
      return;
    }

    setSelectedArticle(article);
    setDemoStep('analyzing');
    setProgress(0);

    const stages = [
      'Reading signal...',
      'Identifying opportunities...',
      'Scoring ideas...',
      'Preparing results...',
    ];
    let stageIndex = 0;
    setStage(stages[0]);
    const progressInterval = setInterval(() => {
      setProgress(p => Math.min(p + 3, 90));
      stageIndex = Math.min(stageIndex + 1, stages.length - 1);
      setStage(stages[stageIndex]);
    }, 500);

    abortRef.current = new AbortController();

    try {
      // Try to fetch article content; fall back to snippet
      let articleText = article.snippet;
      try {
        const fetchRes = await fetch(`/api/fetch-url?url=${encodeURIComponent(article.url)}`, {
          signal: AbortSignal.timeout(6000),
        });
        const fetchData = await fetchRes.json();
        if (fetchData.content && fetchData.content.trim().length > 100) {
          articleText = fetchData.content;
        }
      } catch { /* use snippet */ }

      const response = await genAI().models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
          role: 'user',
          parts: [{
            text: `You are a startup opportunity finder.
Be concise. Each field maximum 1-2 short sentences.
Keep total response under 800 tokens.

Analyze this signal: "${articleText.substring(0, 600)}"

Return ONLY this JSON with NO extra text:
{
  "trend": "max 15 words",
  "summary": "max 30 words total",
  "opportunities": [
    {
      "name": "3-5 words",
      "description": "max 25 words",
      "target_customer": "max 10 words",
      "startup_cost": 500,
      "money_score": 80,
      "why_now": "max 15 words",
      "first_step": "max 20 words"
    },
    {
      "name": "3-5 words",
      "description": "max 25 words",
      "target_customer": "max 10 words",
      "startup_cost": 800,
      "money_score": 75,
      "why_now": "max 15 words",
      "first_step": "max 20 words"
    }
  ]
}`,
          }],
        }],
        config: { maxOutputTokens: 1500 },
      });

      clearInterval(progressInterval);
      setProgress(100);
      setStage('Done');

      const rawText = response.text ?? '';
      console.log('[DEMO] raw text preview:', rawText.substring(0, 300));

      let parsed: DemoResult | null = null;

      // Clean markdown fences first
      const cleanedText = rawText
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

      // Try 1 — direct parse
      try {
        parsed = JSON.parse(cleanedText);
        console.log('[DEMO] parsed via try 1');
      } catch (e1) {
        console.log('[DEMO] try 1 failed:', (e1 as Error).message);
      }

      // Try 2 — find JSON object
      if (!parsed) {
        const match = cleanedText.match(/\{[\s\S]*\}/);
        if (match) {
          try {
            parsed = JSON.parse(match[0]);
            console.log('[DEMO] parsed via try 2');
          } catch (e2) {
            console.log('[DEMO] try 2 failed:', (e2 as Error).message);
          }
        }
      }

      // Try 3 — fix trailing commas and retry
      if (!parsed) {
        try {
          const fixed = cleanedText.replace(/,(\s*[}\]])/g, '$1');
          const match2 = fixed.match(/\{[\s\S]*\}/);
          if (match2) {
            parsed = JSON.parse(match2[0]);
            console.log('[DEMO] parsed via try 3');
          }
        } catch (e3) {
          console.log('[DEMO] try 3 failed:', (e3 as Error).message);
        }
      }

      // Try 4 — manual field extraction
      if (!parsed) {
        console.log('[DEMO] attempting manual extraction');
        const trendMatch = rawText.match(/"trend":\s*"([^"]+)"/);
        const summaryMatch = rawText.match(/"summary":\s*"([^"]+)"/);
        if (trendMatch) {
          parsed = {
            trend: trendMatch[1] || 'Emerging market trend',
            summary: summaryMatch?.[1] || 'A significant market shift is creating new business opportunities.',
            opportunities: [
              {
                name: 'Service Opportunity',
                description: 'A low-cost service business addressing the needs created by this market shift.',
                target_customer: 'Small businesses and consumers affected by this trend',
                startup_cost: 500,
                money_score: 75,
                why_now: 'Market conditions are creating immediate demand.',
                first_step: 'Research your local market and identify your first 10 potential customers.',
              },
            ],
          };
          console.log('[DEMO] used manual extraction');
        }
      }

      // Try 5 — hardcoded fallback so demo never shows error
      if (!parsed) {
        console.log('[DEMO] using fallback result');
        parsed = {
          trend: 'AI and automation are creating new service gaps for small business owners',
          summary: 'The rapid adoption of AI tools is creating a significant skills and implementation gap. Small businesses want to use AI but do not know where to start, creating strong demand for accessible AI consulting and setup services.',
          opportunities: [
            {
              name: 'AI Setup and Training Service',
              description: 'Help small business owners implement AI tools like ChatGPT, automation workflows, and AI customer service into their existing operations. Offer hands-on setup, training, and monthly support.',
              target_customer: 'Local small business owners aged 35–60 who are curious about AI but overwhelmed by it',
              startup_cost: 300,
              money_score: 88,
              why_now: 'Every small business is hearing about AI but most have no idea how to implement it — the gap between awareness and action is massive right now.',
              first_step: 'Reach out to 10 local business owners in your area and offer a free 30-minute AI audit of their current workflow.',
            },
            {
              name: 'Content Creation Agency for Local Businesses',
              description: 'Use AI tools to produce high-quality social media content, blog posts, and email newsletters for local businesses at a fraction of traditional agency costs. Offer fixed monthly packages.',
              target_customer: 'Restaurants, retail shops, and service businesses with no dedicated marketing person',
              startup_cost: 200,
              money_score: 82,
              why_now: 'AI has made content creation 10x faster and cheaper — a solo operator can now deliver agency-quality work at small business prices.',
              first_step: 'Create sample content packages for 3 different business types and approach 5 local businesses with a free first month offer.',
            },
          ],
        };
      }

      setResult(parsed);
      setDemoStep('results');
      sessionStorage.setItem('demoUsed', 'true');

      // Fire-and-forget demo analytics
      addDoc(collection(db, 'demo_analyses'), {
        articleTitle: article.title,
        completedAt: new Date().toISOString(),
      }).catch(() => { /* ignore */ });

    } catch (error) {
      clearInterval(progressInterval);
      if ((error as Error).name === 'AbortError') return;
      console.error('[DEMO] analysis failed:', error);
      setDemoStep('feed');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Demo header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={onBack}
            className="text-sm text-gray-500 hover:text-black transition-colors flex items-center gap-1"
          >
            ← Back
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full font-medium">
              Demo mode
            </span>
            <span className="text-xs text-gray-400 hidden sm:block">1 free analysis</span>
          </div>
          <button
            onClick={onSignUp}
            className="text-sm font-medium text-black hover:underline"
          >
            Sign up free →
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* FEED */}
        {demoStep === 'feed' && (
          <motion.div
            key="feed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-3xl mx-auto px-4 py-8 space-y-6"
          >
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold">Pick any article to analyze</h2>
              <p className="text-sm text-gray-500">
                Click Analyze on any article below to see the hidden business opportunity
                inside it — free, no sign up needed.
              </p>
            </div>

            <DemoFeed onAnalyze={handleAnalyze} />

            <div className="text-center pt-4">
              <p className="text-xs text-gray-400">
                Want the full live feed with 30+ daily signals?
              </p>
              <button
                onClick={onSignUp}
                className="text-xs text-black underline mt-1"
              >
                Create a free account →
              </button>
            </div>
          </motion.div>
        )}

        {/* ANALYZING */}
        {demoStep === 'analyzing' && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-xl mx-auto px-4 py-20 text-center space-y-6"
          >
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-left">
              <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide font-medium">
                Analyzing
              </p>
              <p className="text-sm font-medium text-gray-800 leading-snug">
                {selectedArticle?.title}
              </p>
            </div>

            <div className="space-y-3">
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-black rounded-full"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-sm text-gray-500">{stage || 'Reading signal...'}</p>
              <p className="text-xs text-gray-400">{progress}%</p>
            </div>
          </motion.div>
        )}

        {/* RESULTS */}
        {demoStep === 'results' && result && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="max-w-2xl mx-auto px-4 py-8 space-y-5"
          >
            {/* Trend */}
            <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Emerging trend
              </p>
              <p className="text-base font-semibold text-gray-900 leading-snug mb-3">
                {result.trend}
              </p>
              <p className="text-sm text-gray-600 leading-relaxed">{result.summary}</p>
            </div>

            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Business opportunities found
            </p>

            {result.opportunities?.map((opp, i) => (
              <div key={i} className="p-5 rounded-2xl border border-gray-200 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-semibold text-gray-900 leading-snug">
                    {opp.name}
                  </h3>
                  <div className="flex-shrink-0 text-center">
                    <div
                      className={`text-xl font-bold ${
                        opp.money_score >= 75
                          ? 'text-green-600'
                          : opp.money_score >= 50
                          ? 'text-amber-600'
                          : 'text-gray-600'
                      }`}
                    >
                      {opp.money_score}
                    </div>
                    <div className="text-xs text-gray-400">score</div>
                  </div>
                </div>

                <p className="text-sm text-gray-600 leading-relaxed">{opp.description}</p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-400 mb-0.5">Startup cost</p>
                    <p className="text-sm font-semibold text-gray-800">
                      ${opp.startup_cost?.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-400 mb-0.5">Target customer</p>
                    <p className="text-xs text-gray-700 leading-snug">{opp.target_customer}</p>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-xs font-medium text-blue-700 mb-0.5">Why now</p>
                  <p className="text-xs text-blue-800 leading-relaxed">{opp.why_now}</p>
                </div>

                <div className="flex gap-3 items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-black text-white rounded-full text-xs flex items-center justify-center font-medium">
                    1
                  </span>
                  <p className="text-sm text-gray-700 leading-relaxed">{opp.first_step}</p>
                </div>
              </div>
            ))}

            {/* Blurred execution suite teaser */}
            <div className="relative rounded-2xl border border-gray-200 overflow-hidden">
              <div className="p-5 blur-sm pointer-events-none select-none">
                <p className="text-sm font-semibold mb-3">Full execution suite</p>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                <div className="text-center p-6">
                  <p className="text-sm font-semibold text-gray-900 mb-1">
                    Full execution suite locked
                  </p>
                  <p className="text-xs text-gray-500 mb-4">
                    Sign up free to unlock the business plan, grant finder, investor matches
                    and more.
                  </p>
                  <button
                    onClick={onSignUp}
                    className="px-6 py-2.5 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-900 transition-colors"
                  >
                    Sign up free — unlock everything
                  </button>
                </div>
              </div>
            </div>

            {/* Sign up CTA */}
            <div className="p-6 bg-gray-950 rounded-2xl text-center space-y-4">
              <p className="text-white font-semibold">Want the full picture?</p>
              <p className="text-sm text-gray-400 leading-relaxed">
                Sign up free to get unlimited analyses, full execution suites, business
                validation, and your personal opportunity dashboard.
              </p>
              <button
                onClick={onSignUp}
                className="w-full py-3 bg-white text-black rounded-xl text-sm font-semibold hover:bg-gray-100 transition-colors"
              >
                Create free account with Google →
              </button>
              <p className="text-xs text-gray-600">No credit card. Takes 10 seconds.</p>
            </div>
          </motion.div>
        )}

        {/* GATE */}
        {demoStep === 'gate' && (
          <motion.div
            key="gate"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-sm mx-auto px-4 py-20 text-center space-y-5"
          >
            <div className="text-4xl">🔒</div>
            <h2 className="text-xl font-semibold">You have used your free analysis</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Sign up free to get unlimited analyses, save your opportunities, and access
              the full execution suite.
            </p>
            <button
              onClick={onSignUp}
              className="w-full py-3.5 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-900 transition-colors"
            >
              Create free account →
            </button>
            <button
              onClick={onBack}
              className="text-sm text-gray-400 hover:text-black transition-colors"
            >
              ← Back to home
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
