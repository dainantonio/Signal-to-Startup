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

const MIN_UPVOTES = 50;
const MIN_COMMENTS = 10;

interface RedditListingResponse {
  data?: {
    children?: Array<{
      data?: {
        title?: string;
        selftext?: string;
        ups?: number;
        num_comments?: number;
        permalink?: string;
        created_utc?: number;
        is_video?: boolean;
        post_hint?: string;
      };
    }>;
  };
}

export async function fetchRedditSignals(
  market: string = 'global',
  limit: number = 10
): Promise<RedditPost[]> {
  const relevantSubs = SUBREDDITS.filter(
    s => s.market === market || s.market === 'global'
  );

  const posts: RedditPost[] = [];

  for (const sub of relevantSubs.slice(0, 5)) {
    try {
      const res = await fetch(`https://www.reddit.com/r/${sub.name}/hot.json?limit=25`, {
        headers: { 'User-Agent': 'SignalToStartup/1.0' },
        next: { revalidate: 3600 },
      });

      if (!res.ok) continue;

      const data = (await res.json()) as RedditListingResponse;
      const children = data?.data?.children || [];

      for (const child of children) {
        const post = child.data;
        if (!post?.title || !post.permalink) continue;

        if ((post.ups ?? 0) < MIN_UPVOTES) continue;
        if ((post.num_comments ?? 0) < MIN_COMMENTS) continue;

        if (post.is_video) continue;
        if (post.post_hint === 'image') continue;

        const body = post.selftext || '';
        if (body.length < 50 && post.title.length < 30) continue;

        posts.push({
          title: post.title,
          body: body.substring(0, 1000),
          subreddit: sub.name,
          upvotes: post.ups ?? 0,
          comments: post.num_comments ?? 0,
          url: `https://reddit.com${post.permalink}`,
          permalink: post.permalink,
          created: post.created_utc ?? Math.floor(Date.now() / 1000),
          type: 'reddit',
          sector: sub.sector,
          market: sub.market,
        });
      }
    } catch (err) {
      console.warn(`[REDDIT] Failed to fetch r/${sub.name}:`, err);
    }
  }

  return posts
    .sort((a, b) => (b.upvotes + b.comments * 3) - (a.upvotes + a.comments * 3))
    .slice(0, limit);
}
