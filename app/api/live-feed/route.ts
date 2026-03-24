import { NextRequest, NextResponse } from 'next/server';
import { fetchRSSFeeds } from '@/lib/rss-fetcher';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const sectorsParam = searchParams.get('sectors') ?? 'ai,policy,markets,funding,sustainability,realestate,health';
  const region       = searchParams.get('region') ?? 'global';
  const niche        = searchParams.get('niche') ?? '';
  const recency      = searchParams.get('recency') ?? '3d';

  const sectors = sectorsParam.split(',').filter(Boolean);
  // Always include global sources; for non-global markets also pull that region's feeds
  const markets = region && region !== 'global' ? [region] : ['global'];

  try {
    let items = await fetchRSSFeeds({ markets, sectors, recency });

    // Niche keyword filter — only apply if it would keep at least 3 results
    if (niche.trim()) {
      const nicheWords = niche.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      if (nicheWords.length > 0) {
        const filtered = items.filter(item => {
          const text = `${item.title} ${item.snippet}`.toLowerCase();
          return nicheWords.some(word => text.includes(word));
        });
        if (filtered.length >= 3) items = filtered;
      }
    }

    const payload = items.slice(0, 30);

    const res = NextResponse.json(payload);
    res.headers.set('Cache-Control', 's-maxage=900, stale-while-revalidate=300');
    return res;
  } catch (err) {
    console.error('Live feed RSS error:', err);
    // Return empty array with a warning header — never a 500
    const res = NextResponse.json([]);
    res.headers.set('X-Feed-Warning', 'All RSS feeds failed');
    return res;
  }
}
