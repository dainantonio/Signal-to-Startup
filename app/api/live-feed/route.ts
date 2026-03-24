import { NextRequest, NextResponse } from 'next/server';

const NEWS_API_KEY = process.env.NEWS_API_KEY;

// Maps each SectorKey to a NewsAPI search query
const SECTOR_QUERIES: Record<string, { query: string; sector: string }> = {
  ai:             { query: 'artificial intelligence technology startup',  sector: 'ai' },
  policy:         { query: 'government policy regulation small business', sector: 'policy' },
  markets:        { query: 'emerging markets economy opportunity',         sector: 'markets' },
  funding:        { query: 'startup funding venture capital grant',        sector: 'funding' },
  sustainability: { query: 'sustainability green energy climate business', sector: 'sustainability' },
  realestate:     { query: 'real estate property market housing',          sector: 'realestate' },
  health:         { query: 'health wellness medical startup',              sector: 'health' },
};

// Recency filter → NewsAPI `from` date
function fromDate(recency: string): string {
  const now = new Date();
  const days = recency === '24h' ? 1 : recency === '3d' ? 3 : 7;
  now.setDate(now.getDate() - days);
  return now.toISOString().split('T')[0];
}

// Derive signal strength (1–5) from article age
function signalStrength(publishedAt: string): number {
  const ageHours = (Date.now() - new Date(publishedAt).getTime()) / 3600000;
  if (ageHours < 6)  return 5;
  if (ageHours < 24) return 4;
  if (ageHours < 48) return 3;
  if (ageHours < 96) return 2;
  return 1;
}

const DEMO_SIGNALS = [
  {
    title: "Rural Policy Initiative for Midwest Farming",
    source: "Federal Gazette",
    publishedAt: new Date().toISOString(),
    url: "#",
    sector: "policy",
    category: "Policy",
    color: "",
    snippet: "New federal initiative announced to subsidize high-speed satellite internet for rural farming communities in the Midwest. $500M allocated for infrastructure and local tech support training.",
    strength: 5,
  },
  {
    title: "Green Energy Mandate for Commercial Buildings",
    source: "City Council",
    publishedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    url: "#",
    sector: "sustainability",
    category: "Sustainability",
    color: "",
    snippet: "City council passes mandate requiring all commercial buildings over 10,000 sq ft to install EV charging stations by 2027. Rebates available for early adopters who install before 2025.",
    strength: 4,
  },
  {
    title: "Micro-Logistics Expansion in Urban Centers",
    source: "E-commerce Weekly",
    publishedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    url: "#",
    sector: "markets",
    category: "Markets",
    color: "",
    snippet: "Major e-commerce platform opening 50 new 'last-mile' micro-fulfillment centers in dense urban areas. Seeking local partners for bicycle and electric scooter delivery fleets.",
    strength: 3,
  },
];

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const sectorsParam = searchParams.get('sectors') ?? 'ai,policy,markets,funding,sustainability,realestate,health';
  const region       = searchParams.get('region') ?? '';
  const niche        = searchParams.get('niche') ?? '';
  const recency      = searchParams.get('recency') ?? '3d';

  const requestedSectors = sectorsParam.split(',').filter(s => SECTOR_QUERIES[s]);

  if (!NEWS_API_KEY) {
    console.warn('NEWS_API_KEY is missing — returning demo signals');
    const demo = DEMO_SIGNALS.filter(s => requestedSectors.includes(s.sector));
    return NextResponse.json(demo.length > 0 ? demo : DEMO_SIGNALS);
  }

  const from = fromDate(recency);
  // Append region/niche context to each query if provided
  const context = [region, niche].filter(Boolean).join(' ');

  try {
    const results = await Promise.all(
      requestedSectors.map(async (sectorKey) => {
        const { query, sector } = SECTOR_QUERIES[sectorKey];
        const fullQuery = context ? `${query} ${context}` : query;
        const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(fullQuery)}&from=${from}&pageSize=4&sortBy=publishedAt&language=en&apiKey=${NEWS_API_KEY}`;
        const res = await fetch(url, { next: { revalidate: 1800 } });

        if (!res.ok) throw new Error(`NewsAPI failed for ${sectorKey}`);

        const data = await res.json();
        return (data.articles || [])
          .filter((a: any) => a.title && a.title !== '[Removed]')
          .map((a: any) => ({
            title:       a.title,
            source:      a.source?.name ?? 'Unknown',
            publishedAt: a.publishedAt,
            url:         a.url,
            sector,
            category:    SECTOR_QUERIES[sectorKey].query,
            color:       '',
            snippet:     a.description || a.content || '',
            strength:    signalStrength(a.publishedAt),
          }));
      })
    );

    const allSignals = results.flat()
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, 20);

    if (allSignals.length === 0) {
      return NextResponse.json(DEMO_SIGNALS);
    }

    return NextResponse.json(allSignals);
  } catch (error) {
    console.error('Live feed error:', error);
    return NextResponse.json(DEMO_SIGNALS);
  }
}
