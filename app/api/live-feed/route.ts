import { NextRequest, NextResponse } from 'next/server';
import { fetchRSSFeeds } from '@/lib/rss-fetcher';

// ─── Sector key type ──────────────────────────────────────────────────────
type SectorKey = 'ai' | 'policy' | 'markets' | 'funding' | 'sustainability' | 'realestate' | 'health';

const ALL_SECTORS: SectorKey[] = ['ai', 'policy', 'markets', 'funding', 'sustainability', 'realestate', 'health'];

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

  const sectorsParam = searchParams.get('sectors');
  const region = searchParams.get('region') || 'global';
  const recency = searchParams.get('recency') || '3d';

  const requestedSectors: SectorKey[] = sectorsParam
    ? (sectorsParam.split(',').filter(s => ALL_SECTORS.includes(s as SectorKey)) as SectorKey[])
    : ALL_SECTORS;

  const countryTagsParam = searchParams.get('countryTags') || '';
  const countryTags = countryTagsParam.split(',').filter(Boolean);

  try {
    const feedResult = await fetchRSSFeeds({
      market: region,
      sectors: requestedSectors,
      recency,
      countryTags,
    });

    if (feedResult.items.length === 0) {
      return NextResponse.json(DEMO_SIGNALS);
    }

    // Shape items to match the FeedSignal interface expected by the client
    const signals = feedResult.items.map(item => ({
      title: item.title,
      source: item.source,
      publishedAt: item.publishedAt,
      url: item.url,
      sector: item.sector,
      category: item.category,
      color: item.color || '',
      snippet: item.snippet,
      strength: item.strength,
      signalScore: item.signalScore,
    }));

    return NextResponse.json(signals);
  } catch (error) {
    console.error('Live feed error:', error);
    return NextResponse.json(DEMO_SIGNALS);
  }
}
