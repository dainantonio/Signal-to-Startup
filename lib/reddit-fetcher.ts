export interface RedditPost {
  title: string;
  body: string;
  subreddit: string;
  upvotes: number;
  comments: number;
  url: string;
  permalink: string;
  created: number;
  type: 'reddit';
  sector: string;
  market: string;
}

export interface RedditSignal {
  title: string;
  snippet: string;
  source: string;
  url: string;
  sector: string;
  signalScore: number;
  type: 'reddit';
  redditMeta: {
    subreddit: string;
    upvotes: number;
    comments: number;
    postType: string;
    problem: string;
    startupIdea: string;
    targetUser: string;
    signalStrength: number;
    marketNote?: string;
  };
}

const SUBREDDITS = [
  { name: 'smallbusiness', sector: 'markets', market: 'global' },
  { name: 'Entrepreneur', sector: 'markets', market: 'global' },
  { name: 'SideProject', sector: 'ai', market: 'global' },
  { name: 'indiehackers', sector: 'ai', market: 'global' },
  { name: 'microSaaS', sector: 'ai', market: 'global' },
  { name: 'freelance', sector: 'workforce', market: 'global' },
  { name: 'restaurantowners', sector: 'food', market: 'global' },
  { name: 'nigeria', sector: 'markets', market: 'africa' },
  { name: 'jamaica', sector: 'markets', market: 'caribbean' },
  { name: 'africa', sector: 'markets', market: 'africa' },
  { name: 'personalfinance', sector: 'funding', market: 'global' },
] as const;

const MIN_UPVOTES = 5;
const MIN_COMMENTS = 2;

export async function fetchRedditSignals(
  market: string = 'global',
  limit: number = 10
): Promise<RedditPost[]> {
  console.log('[REDDIT] Fetching for market:', market);

  const relevantSubs = SUBREDDITS.filter(
    s => s.market === market || s.market === 'global'
  );

  const posts: RedditPost[] = [];

  for (const sub of relevantSubs.slice(0, 5)) {
    try {
      const res = await fetch(`https://www.reddit.com/r/${sub.name}/hot.rss?limit=25`, {
        headers: {
          'User-Agent': 'SignalToStartup/1.0 (market intelligence)',
          'Accept': 'application/rss+xml, application/xml, text/xml',
        },
        next: { revalidate: 1800 },
      });

      if (!res.ok) {
        console.warn(`[REDDIT] r/${sub.name} returned ${res.status}`);
        continue;
      }

      const xml = await res.text();

      // Parse RSS with basic regex (no library needed)
      const items = xml.match(/<entry>([\s\S]*?)<\/entry>/g) ||
                    xml.match(/<item>([\s\S]*?)<\/item>/g) || [];

      for (const item of items.slice(0, 8)) {
        const getTag = (tag: string) => {
          const match = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
          return match ? match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim() : '';
        };

        const title = getTag('title');
        const link = getTag('link') ||
          (item.match(/href="([^"]+)"/) || [])[1] || '';
        const content = getTag('content') || getTag('summary') || '';
        const updated = getTag('updated') || getTag('pubDate') || '';

        if (!title || title.length < 10) continue;

        const cleanContent = content
          .replace(/<[^>]+>/g, '')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '')
          .replace(/&gt;/g, '')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .trim();

        if (cleanContent.length < 10 && title.length < 20) continue;

        posts.push({
          title: title.replace(/&amp;/g, '&').replace(/&#39;/g, "'"),
          body: cleanContent.substring(0, 800),
          subreddit: sub.name,
          upvotes: 0,
          comments: 0,
          url: link,
          permalink: link,
          created: updated ? Math.floor(new Date(updated).getTime() / 1000) : Math.floor(Date.now() / 1000),
          type: 'reddit',
          sector: sub.sector,
          market: sub.market,
        });
      }
    } catch (err) {
      console.warn(`[REDDIT] Failed to fetch r/${sub.name}:`, err);
    }
    console.log(`[REDDIT] r/${sub.name}: ${posts.length} total posts`);
  }

  console.log('[REDDIT] Total posts found:', posts.length);

  return posts
    .sort((a, b) => (b.upvotes + b.comments * 3) - (a.upvotes + a.comments * 3))
    .slice(0, limit);
}
