import { NextRequest, NextResponse } from 'next/server';
import { fetchRSSFeeds } from '@/lib/rss-fetcher';
import { COUNTRY_CONTEXT } from '@/lib/rss-sources';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const sectorsParam  = searchParams.get('sectors') ?? 'ai,policy,markets,funding,sustainability,realestate,health';
  const region        = searchParams.get('region') ?? 'global';
  const niche         = searchParams.get('niche') ?? '';
  const recency       = searchParams.get('recency') ?? '3d';
  const countryTagsParam = searchParams.get('countryTags') ?? '';

  const sectors     = sectorsParam.split(',').filter(Boolean);
  const countryTags = countryTagsParam.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
  const markets     = region && region !== 'global' ? [region] : ['global'];

  try {
    const feedResult = await fetchRSSFeeds({ markets, sectors, recency });
    let items = feedResult.items;
    const duplicatesRemoved = feedResult.duplicatesRemoved;

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

    // Country tag filter + source classification
    if (countryTags.length > 0) {
      // Build combined keywords and region list from all selected country tags
      const allKeywords: string[] = [];
      const regionMarkets = new Set<string>();

      for (const tag of countryTags) {
        const ctx = COUNTRY_CONTEXT[tag];
        if (ctx) {
          allKeywords.push(...ctx.keywords.map(k => k.toLowerCase()));
          regionMarkets.add(ctx.region);
        } else {
          // Plain text tag used as keyword
          allKeywords.push(tag.toLowerCase());
        }
      }

      // Classify each item and filter to relevant ones
      const classified = items.map(item => {
        const isLocal = regionMarkets.has(item.market);
        const text    = `${item.title} ${item.snippet}`.toLowerCase();
        const isMention = !isLocal && allKeywords.some(kw => text.includes(kw));
        return { ...item, isLocalSource: isLocal, isGlobalMention: isMention };
      });

      // Keep local sources and global mentions (filter unrelated global noise)
      const filtered = classified.filter(item => item.isLocalSource || item.isGlobalMention);
      // Fall back to all items if filter leaves too few results
      items = filtered.length >= 3 ? filtered : classified;
    }

    const payload = {
      items: items.slice(0, 30),
      meta: {
        total: Math.min(items.length, 30),
        duplicatesRemoved,
      },
    };

    const res = NextResponse.json(payload);
    // Shorter cache when country-filtered (more specific, changes more often)
    const cacheAge = countryTags.length > 0 ? 600 : 900;
    res.headers.set('Cache-Control', `s-maxage=${cacheAge}, stale-while-revalidate=300`);
    return res;
  } catch (err) {
    console.error('Live feed RSS error:', err);
    const res = NextResponse.json({ items: [], meta: { total: 0, duplicatesRemoved: 0 } });
    res.headers.set('X-Feed-Warning', 'All RSS feeds failed');
    return res;
  }
}
