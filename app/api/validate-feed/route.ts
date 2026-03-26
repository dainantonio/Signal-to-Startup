import { NextRequest, NextResponse } from 'next/server';
import { fetchRSSFeeds } from '@/lib/rss-fetcher';
import { cleanText } from '@/lib/text-cleaner';

const SUPPORTING_WORDS = [
  'growth', 'demand', 'surge', 'opportunity', 'funding', 'investment',
  'shortage', 'expanding', 'launches', 'new market', 'billion', 'million',
  'raises', 'backed', 'record', 'booming', 'accelerating', 'rising',
  'increasing', 'thriving',
];
const RISK_WORDS = [
  'competition', 'saturated', 'declining', 'threat', 'challenge',
  'incumbent', 'dominant', 'barriers', 'struggles', 'fails', 'shutdown',
  'bankrupt', 'falling', 'drops', 'loses',
];

function classifySignal(text: string): 'SUPPORTING' | 'RISK' | 'NEUTRAL' {
  const lower = text.toLowerCase();
  if (RISK_WORDS.some(w => lower.includes(w))) return 'RISK';
  if (SUPPORTING_WORDS.some(w => lower.includes(w))) return 'SUPPORTING';
  return 'NEUTRAL';
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const keywordsParam = searchParams.get('keywords') || '';
  const region = searchParams.get('region') || 'global';

  const keywords = keywordsParam
    .split(',')
    .map(k => (typeof k === 'string' ? k.trim() : ''))
    .filter(k => k.length > 2);

  try {
    // Fetch from all markets to maximise coverage for validation
    const allMarkets = ['global', region !== 'global' ? region : null].filter(Boolean) as string[];
    const feedResult = await fetchRSSFeeds({
      markets: allMarkets,
      sectors: ['ai', 'policy', 'markets', 'funding', 'sustainability', 'realestate', 'health'],
      recency: '7d',
    });
    const items = feedResult.items;

    type ScoredItem = (typeof items)[number] & {
      relevanceScore: number;
      matchedKeywords: string[];
      signalType: 'SUPPORTING' | 'RISK' | 'NEUTRAL';
    };

    const scoreItem = (item: (typeof items)[number], scoreMultiplier = 1): ScoredItem => {
      const text = cleanText(`${item.title} ${item.snippet}`).toLowerCase();
      let hits = 0;
      const matched: string[] = [];

      for (const keyword of keywords) {
        if (!keyword || typeof keyword !== 'string') continue;
        const kw = keyword.toLowerCase().trim();
        if (kw.length < 2) continue;

        if (text.includes(kw)) {
          // Exact phrase match
          hits += 2 * scoreMultiplier;
          matched.push(keyword);
        } else {
          // Partial word match for multi-word keywords
          const words = kw.split(' ').filter(w => w.length > 3);
          const wordHits = words.filter(w => text.includes(w)).length;
          if (wordHits > 0) {
            hits += wordHits * 0.5 * scoreMultiplier;
            if (wordHits === words.length) matched.push(keyword);
          }
        }
      }

      const maxScore = keywords.length * 2;
      const relevanceScore = maxScore > 0 ? Math.min(Math.round((hits / maxScore) * 100), 100) : 0;

      return {
        ...item,
        relevanceScore,
        matchedKeywords: matched,
        signalType: classifySignal(text),
      };
    };

    // Primary scoring: threshold > 8%
    let scored = items
      .map(item => scoreItem(item))
      .filter(item => item.relevanceScore > 8)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 20);

    let relaxed = false;

    // Relaxed fallback: any single keyword word match
    if (scored.length < 5) {
      relaxed = true;
      const allWords = keywords.join(' ').split(' ').filter(w => w.length > 4);

      scored = items
        .map(item => {
          const text = cleanText(`${item.title} ${item.snippet}`).toLowerCase();
          const wordHits = allWords.filter(w => text.includes(w));
          const relevanceScore = allWords.length > 0
            ? Math.min(Math.round((wordHits.length / allWords.length) * 60), 60)
            : 0;
          return {
            ...item,
            relevanceScore,
            matchedKeywords: wordHits,
            signalType: classifySignal(text),
          };
        })
        .filter(item => item.relevanceScore > 5)
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 10);
    }

    const res = NextResponse.json({
      items: scored,
      total: scored.length,
      relaxed,
      message: relaxed ? 'Showing broader market signals' : undefined,
    });
    res.headers.set('Cache-Control', 's-maxage=600, stale-while-revalidate=300');
    return res;
  } catch (error) {
    console.error('[VALIDATE FEED]', error);
    return NextResponse.json({ items: [], total: 0, error: 'Feed fetch failed' }, { status: 200 });
  }
}
