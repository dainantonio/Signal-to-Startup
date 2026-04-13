import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { fetchRedditSignals } from '@/lib/reddit-fetcher';

export async function GET(request: NextRequest) {
  const market = request.nextUrl.searchParams.get('market') || 'global';

  try {
    const posts = await fetchRedditSignals(market, 8);

    if (posts.length === 0) {
      return NextResponse.json({ signals: [] });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'No API key' }, { status: 500 });
    }

    const genAI = new GoogleGenAI({ apiKey });
    const signals = [];

    for (const post of posts.slice(0, 5)) {
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

        const text = (response.text ?? '')
          .replace(/```json|```/g, '')
          .trim();

        const parsed = JSON.parse(text);

        if (parsed.type === 'Noise') continue;
        if ((parsed.signal_strength ?? 0) < 5) continue;

        signals.push({
          title: post.title,
          snippet: parsed.problem,
          source: `r/${post.subreddit}`,
          url: post.url,
          sector: 'markets',
          signalScore: Math.min(
            Math.round(
              parsed.signal_strength * 10 +
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
            postType: parsed.type,
            problem: parsed.problem,
            startupIdea: parsed.startup_idea,
            targetUser: parsed.target_user,
            signalStrength: parsed.signal_strength,
            marketNote: parsed.market_note,
          },
        });
      } catch {
        console.warn('[REDDIT] Analysis failed for post:', post.title.slice(0, 40));
      }
    }

    return NextResponse.json({ signals });
  } catch (err) {
    console.error('[REDDIT] Route failed:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
