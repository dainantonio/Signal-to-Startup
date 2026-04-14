import { NextRequest, NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';

const SUBREDDITS_BY_MARKET: Record<string, string[]> = {
  global: [
    'smallbusiness', 'Entrepreneur',
    'SideProject', 'indiehackers',
    'startups',
  ],
  caribbean: [
    'jamaica', 'smallbusiness',
    'Entrepreneur',
  ],
  africa: [
    'nigeria', 'africa',
    'smallbusiness',
  ],
  uk: [
    'UKBusiness', 'smallbusiness',
    'Entrepreneur',
  ],
  latam: [
    'mexico', 'smallbusiness',
    'Entrepreneur',
  ],
};

async function fetchSubredditRSS(subreddit: string): Promise<Array<{
  title: string;
  body: string;
  subreddit: string;
  upvotes: number;
  comments: number;
  url: string;
  created: string;
}>> {
  try {
    const res = await fetch(
      `https://www.reddit.com/r/${subreddit}/hot.rss?limit=15`,
      {
        headers: {
          'User-Agent': 'Signal-to-Startup/1.0 (market intelligence app)',
          'Accept': 'application/rss+xml, application/xml, text/xml',
        },
        next: { revalidate: 1800 },
      }
    );

    if (!res.ok) {
      console.warn(`[REDDIT] r/${subreddit} returned ${res.status}`);
      return [];
    }

    const xml = await res.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    });
    const parsed = parser.parse(xml);

    const items =
      parsed?.feed?.entry ||
      parsed?.rss?.channel?.item ||
      [];

    const entries = Array.isArray(items) ? items : [items];

    return entries.map((item: Record<string, unknown>) => ({
      title: (item.title as Record<string, string>)?.['#text'] || String(item.title || ''),
      body: (item.content as Record<string, string>)?.['#text'] ||
            String(item.description || item.summary || ''),
      subreddit,
      upvotes: 0,
      comments: 0,
      url: (item.link as Record<string, string>)?.['@_href'] || String(item.link || ''),
      created: String(item.updated || item.pubDate || new Date().toISOString()),
    })).filter((p) => p.title && p.title.length > 15);

  } catch (err) {
    console.warn(`[REDDIT] r/${subreddit} RSS failed:`, err);
    return [];
  }
}

export async function GET(request: NextRequest) {
  const market = request.nextUrl.searchParams.get('market') || 'global';

  console.log('[REDDIT] RSS fetch for market:', market);

  try {
    const subs = SUBREDDITS_BY_MARKET[market] || SUBREDDITS_BY_MARKET.global;
    const allPosts: Array<{
      title: string;
      body: string;
      subreddit: string;
      upvotes: number;
      comments: number;
      url: string;
      created: string;
    }> = [];

    await Promise.allSettled(
      subs.slice(0, 4).map(async (sub) => {
        const posts = await fetchSubredditRSS(sub);
        console.log(`[REDDIT] r/${sub}: ${posts.length} posts`);
        allPosts.push(...posts);
      })
    );

    console.log('[REDDIT] Total posts:', allPosts.length);

    if (allPosts.length === 0) {
      return NextResponse.json({
        signals: [],
        meta: { error: 'no posts fetched' },
      });
    }

    const signals = allPosts
      .filter((p) => p.title.length > 20)
      .map((post) => ({
        title: post.title,
        snippet: post.body.replace(/<[^>]+>/g, '').substring(0, 200) || post.title,
        source: `r/${post.subreddit}`,
        url: post.url,
        sector: 'markets',
        signalScore: Math.floor(Math.random() * 20 + 55),
        type: 'reddit',
        publishedAt: new Date(post.created).toISOString(),
        redditMeta: {
          subreddit: post.subreddit,
          upvotes: post.upvotes,
          comments: post.comments,
          postType: 'Signal',
          problem: post.body.replace(/<[^>]+>/g, '').substring(0, 150) || post.title,
          startupIdea: 'Click Deep Analysis for startup idea',
          targetUser: 'Entrepreneurs',
          signalStrength: 6,
        },
      }))
      .sort(() => Math.random() - 0.5)
      .slice(0, 10);

    return NextResponse.json({
      signals,
      meta: {
        postCount: allPosts.length,
        source: 'rss',
      },
    });

  } catch (err) {
    console.error('[REDDIT] Route failed:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
