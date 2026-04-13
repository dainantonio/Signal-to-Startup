import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { fetchRedditSignals } from '@/lib/reddit-fetcher';

const sanitizeAiJson = (raw: string) =>
  raw
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .replace(/[]/g, "'")
    .replace(/[]/g, '"')
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/&/g, 'and')
    .replace(/</g, '')
    .replace(/>/g, '')
    .replace(/\r/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const parseModelJson = (raw: string): any | null => {
  const cleaned = sanitizeAiJson(raw);
  const candidates = [cleaned];
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) candidates.push(match[0]);
  candidates.push(cleaned.replace(/,(\s*[}\]])/g, '$1'));

  if (!cleaned.trim().endsWith('}')) {
    const lastBrace = cleaned.lastIndexOf('}');
    if (lastBrace > 0) {
      const truncated = cleaned.substring(0, lastBrace + 1);
      const opens = (truncated.match(/\{/g) || []).length;
      const closes = (truncated.match(/\}/g) || []).length;
      candidates.push(truncated + '}'.repeat(Math.max(0, opens - closes)));
    }
  }

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      continue;
    }
  }

  return null;
};

const rawRedditSignal = (post: { title: string; body: string; subreddit: string; upvotes: number; comments: number; url: string; created: number }) => ({
  title: post.title,
  snippet: post.body?.substring(0, 180) || post.title,
  source: `r/${post.subreddit}`,
  url: post.url,
  sector: 'markets',
  signalScore: Math.min(post.upvotes + post.comments * 2, 75),
  type: 'reddit',
  publishedAt: new Date(post.created * 1000).toISOString(),
  redditMeta: {
    subreddit: post.subreddit,
    upvotes: post.upvotes,
    comments: post.comments,
    postType: 'Raw',
    problem: post.body?.substring(0, 120) || post.title,
    startupIdea: 'Raw Reddit post signal',
    targetUser: 'Startup founders',
    signalStrength: 3,
    marketNote: 'Fallback raw Reddit signal',
  },
});

export async function GET(request: NextRequest) {
  const market = request.nextUrl.searchParams.get('market') || 'global';
  const raw = request.nextUrl.searchParams.get('raw') === 'true';

  try {
    const posts = await fetchRedditSignals(market, 8);

    if (posts.length === 0) {
      return NextResponse.json({ signals: [] });
    }

    // If raw mode requested, return raw posts immediately
    if (raw) {
      return NextResponse.json({
        signals: posts.slice(0, 8).map(rawRedditSignal),
        meta: { postCount: posts.length, rawFallback: true },
      });
    }

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      process.env.gemini_api_key ||
      process.env.next_public_gemini_api_key;

    if (!apiKey) {
      console.warn('[REDDIT] Missing Gemini API key — returning raw Reddit fallback signals');
      return NextResponse.json({
        signals: posts.slice(0, 8).map(rawRedditSignal),
        meta: { postCount: posts.length, rawFallback: true },
      });
    }

    const genAI = new GoogleGenAI({ apiKey });
    const signals = [];

    for (const post of posts.slice(0, 8)) {
      try {
        const prompt = `You are a startup signal analyst.
Analyze this Reddit post and extract a business opportunity signal.

Title: ${post.title}
Body: ${post.body.substring(0, 500)}
Subreddit: r/${post.subreddit}
Upvotes: ${post.upvotes}
Comments: ${post.comments}

Classify: Pain Point, Request, Complaint, Workaround, Trend, or Noise.

If Noise, return {"type":"Noise"} only.

Otherwise return ONLY valid JSON:
{
  "type": "Pain Point|Request|Complaint|Workaround|Trend",
  "problem": "specific problem in one sentence",
  "signal_strength": 7,
  "startup_idea": "concrete product or service idea",
  "target_user": "who would use this",
  "market_note": "niche or broad, monetization angle"
}

Signal strength 1-10. Be strict — only score above 6 if truly actionable.
Return ONLY the JSON object.`;

        const response = await genAI.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
        });

        const text = response.text ?? '';
        const parsed = parseModelJson(text);

        if (!parsed) {
          console.warn('[REDDIT] Could not parse model output for post:', post.title.slice(0, 120), text.substring(0, 250));
          continue;
        }

        const type = String(parsed.type ?? parsed.postType ?? '').trim().toLowerCase();
        if (type === 'noise') continue;

        const signalStrength = Number(parsed.signal_strength ?? parsed.signalStrength ?? 0);
        if (signalStrength < 4) continue;

        const problem = String(parsed.problem ?? parsed.problem_statement ?? parsed.problemStatement ?? parsed.summary ?? '').trim();
        const startupIdea = String(parsed.startup_idea ?? parsed.startupIdea ?? parsed.idea ?? '').trim();
        const targetUser = String(parsed.target_user ?? parsed.targetUser ?? parsed.target_audience ?? '').trim();
        const marketNote = String(parsed.market_note ?? parsed.marketNote ?? parsed.note ?? '').trim();

        signals.push({
          title: post.title,
          snippet: problem || parsed.problem || parsed.summary || post.body.substring(0, 200),
          source: `r/${post.subreddit}`,
          url: post.url,
          sector: 'markets',
          signalScore: Math.min(
            Math.round(
              signalStrength * 10 +
                Math.min(post.upvotes / 100, 10) +
                Math.min(post.comments / 20, 9)
            ),
            99
          ),
          type: 'reddit',
          publishedAt: new Date(post.created * 1000).toISOString(),
          redditMeta: {
            subreddit: post.subreddit,
            upvotes: post.upvotes,
            comments: post.comments,
            postType: parsed.type || parsed.postType || type || 'reddit',
            problem: problem || parsed.problem || '',
            startupIdea: startupIdea || parsed.startup_idea || '',
            targetUser: targetUser || parsed.target_user || '',
            signalStrength,
            marketNote: marketNote || parsed.market_note || parsed.marketNote || '',
          },
        });
      } catch {
        console.warn('[REDDIT] Analysis failed for post:', post.title.slice(0, 40));
      }
    }

    if (signals.length === 0) {
      console.warn('[REDDIT] No AI signals generated — returning raw Reddit fallback output');
      return NextResponse.json({
        signals: posts.slice(0, 8).map(rawRedditSignal),
        meta: { postCount: posts.length, rawFallback: true },
      });
    }

    return NextResponse.json({ signals, meta: { postCount: posts.length, rawFallback: false } });
  } catch (err) {
    console.error('[REDDIT] Route failed:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
