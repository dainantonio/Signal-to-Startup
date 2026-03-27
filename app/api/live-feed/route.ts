import { NextRequest, NextResponse } from 'next/server';

const NEWS_API_KEY = process.env.NEWS_API_KEY;

// ─── Sector definitions ───────────────────────────────────────────────────
// Each sector has a targeted query, a label, and a color identity
const SECTORS = {
  ai: {
    label: 'AI & Tech',
    color: 'indigo',
    query: '(artificial intelligence OR "machine learning" OR "AI startup" OR "tech regulation" OR "generative AI") AND (business OR startup OR entrepreneur OR market)',
  },
  policy: {
    label: 'Policy',
    color: 'amber',
    query: '(government policy OR regulation OR "new law" OR legislation OR compliance) AND (small business OR entrepreneur OR startup OR market)',
  },
  markets: {
    label: 'Market Shifts',
    color: 'emerald',
    query: '(market disruption OR "consumer trend" OR "industry shift" OR "market opportunity" OR "emerging market") AND business',
  },
  funding: {
    label: 'Funding & Grants',
    color: 'green',
    query: '(startup grant OR "small business funding" OR "government grant" OR venture capital OR "angel investment" OR accelerator)',
  },
  sustainability: {
    label: 'Sustainability',
    color: 'teal',
    query: '(green energy OR sustainability regulation OR "carbon policy" OR "clean energy" OR "net zero") AND (business OR startup OR opportunity)',
  },
  realestate: {
    label: 'Real Estate',
    color: 'orange',
    query: '(real estate regulation OR "housing policy" OR "construction permit" OR "infrastructure spending" OR "property market") AND business',
  },
  health: {
    label: 'Health & Wellness',
    color: 'pink',
    query: '(health regulation OR "telehealth" OR "wellness market" OR "healthcare startup" OR "medical technology") AND (business OR opportunity)',
  },
} as const;

export type SectorKey = keyof typeof SECTORS;

// ─── Region boosting ──────────────────────────────────────────────────────
const REGION_BOOST: Record<string, string> = {
  caribbean: '(Jamaica OR Trinidad OR Barbados OR Guyana OR Caribbean OR CARICOM OR "West Indies")',
  uk:        '(UK OR Britain OR "United Kingdom" OR England OR Scotland OR Wales OR HMRC OR "Companies House")',
  africa:    '(Africa OR Nigeria OR Kenya OR Ghana OR "South Africa" OR Ethiopia OR "Sub-Saharan")',
  global:    '', // no boost — global = everything
};

// ─── Signal strength heuristic (0–5) ─────────────────────────────────────
const HIGH_CREDIBILITY_SOURCES = [
  'reuters', 'bloomberg', 'financial times', 'bbc', 'wall street journal',
  'wsj', 'economist', 'ap', 'associated press', 'techcrunch', 'wired',
  'the guardian', 'forbes', 'harvard business review', 'ft',
];

const OPPORTUNITY_KEYWORDS = [
  'opportunity', 'startup', 'entrepreneur', 'business', 'market',
  'launch', 'disrupt', 'revenue', 'growth', 'investment', 'billion',
  'mandate', 'regulation', 'policy', 'grant', 'fund', 'subsidy',
];

function scoreSignal(article: {
  title: string;
  snippet: string;
  source: string;
  publishedAt: string;
}): number {
  let score = 0;

  // Recency: up to 2 points
  const hoursAgo = (Date.now() - new Date(article.publishedAt).getTime()) / 3600000;
  if (hoursAgo < 6)  score += 2;
  else if (hoursAgo < 24) score += 1.5;
  else if (hoursAgo < 72) score += 1;
  else score += 0.5;

  // Source credibility: up to 1.5 points
  const srcLower = article.source.toLowerCase();
  if (HIGH_CREDIBILITY_SOURCES.some(s => srcLower.includes(s))) score += 1.5;
  else score += 0.5;

  // Opportunity keyword density: up to 1.5 points
  const text = `${article.title} ${article.snippet}`.toLowerCase();
  const hits = OPPORTUNITY_KEYWORDS.filter(kw => text.includes(kw)).length;
  score += Math.min(hits * 0.3, 1.5);

  return Math.min(Math.round(score), 5);
}

// ─── Demo fallback signals ─────────────────────────────────────────────────
const DEMO_SIGNALS = [
  {
    title: 'AI Regulation Framework Released for Small Businesses',
    source: 'TechCrunch',
    publishedAt: new Date().toISOString(),
    url: '#',
    sector: 'ai' as SectorKey,
    category: 'AI & Tech',
    color: 'indigo',
    snippet: 'New federal AI guidelines create compliance requirements for businesses using automated decision-making. Early adopters who implement compliant systems could gain first-mover advantage in the auditing space.',
    strength: 4,
  },
  {
    title: 'Caribbean Trade Fund Opens $200M SME Window',
    source: 'Caribbean Business',
    publishedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    url: '#',
    sector: 'funding' as SectorKey,
    category: 'Funding & Grants',
    color: 'green',
    snippet: 'The Caribbean Development Bank has opened a new funding window specifically targeting small and medium enterprises in logistics, agritech, and digital services across CARICOM member states.',
    strength: 5,
  },
  {
    title: 'Green Energy Mandate Creates Installation Boom',
    source: 'Reuters',
    publishedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    url: '#',
    sector: 'sustainability' as SectorKey,
    category: 'Sustainability',
    color: 'teal',
    snippet: 'Commercial buildings over 10,000 sq ft must install EV charging stations by 2027. Early adopters qualify for rebates covering up to 40% of installation costs, creating an urgent service opportunity.',
    strength: 4,
  },
  {
    title: 'Last-Mile Delivery Market Projected to Hit $200B by 2027',
    source: 'Bloomberg',
    publishedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    url: '#',
    sector: 'markets' as SectorKey,
    category: 'Market Shifts',
    color: 'emerald',
    snippet: 'E-commerce growth is driving unprecedented demand for last-mile delivery solutions. Local operators with community relationships have significant advantages over large logistics companies in dense urban areas.',
    strength: 3,
  },
];

// ─── Main handler ──────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // Parse params from client
  const sectorsParam = searchParams.get('sectors'); // e.g. "ai,policy,markets"
  const region = searchParams.get('region') || 'global'; // market mode id
  const niche = searchParams.get('niche') || ''; // user's focus/niche field
  const recency = searchParams.get('recency') || '3d'; // '24h' | '3d' | '7d'

  // Determine which sectors to fetch
  const requestedSectors: SectorKey[] = sectorsParam
    ? (sectorsParam.split(',').filter(s => s in SECTORS) as SectorKey[])
    : (Object.keys(SECTORS) as SectorKey[]);

  // No API key — return smart demo signals filtered by requested sectors
  if (!NEWS_API_KEY) {
    console.warn('NEWS_API_KEY missing — returning demo signals');
    const filtered = DEMO_SIGNALS.filter(s => requestedSectors.includes(s.sector));
    return NextResponse.json(filtered.length > 0 ? filtered : DEMO_SIGNALS);
  }

  // Build recency date param
  const fromDate = new Date();
  if (recency === '24h') fromDate.setHours(fromDate.getHours() - 24);
  else if (recency === '7d') fromDate.setDate(fromDate.getDate() - 7);
  else fromDate.setDate(fromDate.getDate() - 3); // default 3d
  const fromStr = fromDate.toISOString().split('T')[0];

  // Region boost string
  const regionBoost = REGION_BOOST[region] || '';

  // Niche boost — if user has a niche, weave it into queries
  const nicheBoost = niche.trim() ? `OR "${niche.trim()}"` : '';

  try {
    const results = await Promise.allSettled(
      requestedSectors.map(async (sectorKey) => {
        const sector = SECTORS[sectorKey];

        // Build final query: sector query + region boost + niche boost
        let q: string = sector.query;
        if (regionBoost) q = `(${q}) AND ${regionBoost}`;
        if (nicheBoost) q = `(${q}) ${nicheBoost}`;

        const url = new URL('https://newsapi.org/v2/everything');
        url.searchParams.set('q', q);
        url.searchParams.set('from', fromStr);
        url.searchParams.set('pageSize', '6');
        url.searchParams.set('sortBy', 'publishedAt');
        url.searchParams.set('language', 'en');
        url.searchParams.set('apiKey', NEWS_API_KEY);

        // Cache 30 mins on server — don't hammer the API
        const res = await fetch(url.toString(), { next: { revalidate: 1800 } });

        if (!res.ok) {
          throw new Error(`NewsAPI ${res.status} for sector ${sectorKey}`);
        }

        const data = await res.json();
        const articles = (data.articles || []) as any[];

        return articles
          .filter(a => a.title && a.title !== '[Removed]' && a.description)
          .map(a => ({
            title: a.title as string,
            source: (a.source?.name || 'Unknown') as string,
            publishedAt: a.publishedAt as string,
            url: a.url as string,
            sector: sectorKey,
            category: sector.label,
            color: sector.color,
            snippet: (a.description || a.content || '') as string,
            strength: scoreSignal({
              title: a.title,
              snippet: a.description || '',
              source: a.source?.name || '',
              publishedAt: a.publishedAt,
            }),
          }));
      })
    );

    // Collect successful results
    const allSignals = results
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => (r as PromiseFulfilledResult<any[]>).value);

    if (allSignals.length === 0) {
      return NextResponse.json(DEMO_SIGNALS);
    }

    // Sort by strength desc, then recency — surface best signals first
    const sorted = allSignals
      .sort((a, b) => {
        if (b.strength !== a.strength) return b.strength - a.strength;
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      })
      .slice(0, 16); // max 16 cards

    return NextResponse.json(sorted);
  } catch (error) {
    console.error('Live feed error:', error);
    return NextResponse.json(DEMO_SIGNALS);
  }
}