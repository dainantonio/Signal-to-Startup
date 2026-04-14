import { NextRequest, NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';

function cleanText(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanRedditText(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '')
    .replace(/&gt;/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getTimeAgo(isoString: string): string {
  const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const SUBREDDITS_BY_MARKET_SECTOR: Record<string, Record<string, string[]>> = {
  global: {
    ai: ['MachineLearning', 'artificial', 'ChatGPT', 'singularity'],
    markets: ['smallbusiness', 'Entrepreneur', 'startups'],
    funding: ['venturecapital', 'startups', 'Entrepreneur'],
    food: ['restaurantowners', 'foodtrucks', 'KitchenConfidential'],
    workforce: ['freelance', 'remotework', 'digitalnomad'],
    retail: ['ecommerce', 'smallbusiness', 'Entrepreneur'],
    default: ['smallbusiness', 'Entrepreneur', 'SideProject', 'indiehackers'],
  },
  caribbean: {
    default: ['jamaica', 'smallbusiness', 'Entrepreneur'],
  },
  africa: {
    default: ['nigeria', 'africa', 'smallbusiness'],
    ai: ['nigeria', 'africa', 'AfricanTech'],
    funding: ['nigeria', 'africa', 'startups'],
  },
  uk: {
    default: ['UKBusiness', 'smallbusiness', 'Entrepreneur', 'ukpolitics'],
  },
  latam: {
    default: ['mexico', 'smallbusiness', 'Entrepreneur'],
  },
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
  const sector = request.nextUrl.searchParams.get('sector') || 'default';

  console.log('[REDDIT] RSS fetch for market:', market, 'sector:', sector);

  try {
    const marketSectors = SUBREDDITS_BY_MARKET_SECTOR[market] || SUBREDDITS_BY_MARKET_SECTOR.global;
    const subs = marketSectors[sector] || marketSectors.default || ['smallbusiness', 'Entrepreneur'];

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
      .map((post) => {
        const cleanTitle = cleanRedditText(post.title);
        const cleanBody = cleanRedditText(post.body);
        return {
          title: cleanTitle,
          snippet: (cleanBody || cleanTitle).substring(0, 200),
          source: `r/${post.subreddit}`,
          url: post.url,
          sector: 'markets',
          signalScore: Math.floor(Math.random() * 20 + 55),
          type: 'reddit',
          publishedAt: new Date(post.created).toISOString(),
          timeAgo: getTimeAgo(post.created),
          redditMeta: {
            subreddit: post.subreddit,
            upvotes: post.upvotes,
            comments: post.comments,
            postType: 'Signal',
            problem: cleanBody.substring(0, 150) || cleanTitle,
            startupIdea: 'Click Deep Analysis for startup idea',
            targetUser: 'Entrepreneurs',
            signalStrength: 6,
          },
        };
      })
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
