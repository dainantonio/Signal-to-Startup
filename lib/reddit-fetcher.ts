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
  { name: 'design', sector: 'markets', market: 'global' },
  { name: 'startup', sector: 'markets', market: 'global' },
  { name: 'nigeria', sector: 'markets', market: 'africa' },
  { name: 'jamaica', sector: 'markets', market: 'caribbean' },
  { name: 'africa', sector: 'markets', market: 'africa' },
  { name: 'personalfinance', sector: 'funding', market: 'global' },
];

const MIN_UPVOTES = 10;
const MIN_COMMENTS = 2;

export async function fetchRedditSignals(
  market: string = 'global',
  limit: number = 10
): Promise<RedditPost[]> {
  const relevantSubs = SUBREDDITS.filter(
    (s) => s.market === market || s.market === 'global'
  );

  const posts: RedditPost[] = [];

  for (const sub of relevantSubs.slice(0, 8)) {
    try {
      const res = await fetch(
        `https://www.reddit.com/r/${sub.name}/hot.json?limit=35`,
        {
          headers: { 'User-Agent': 'SignalToStartup/1.0' },
          next: { revalidate: 3600 },
        }
      );

      if (!res.ok) continue;

      const data = await res.json();
      const children = data?.data?.children || [];

      for (const child of children) {
        const post = child.data;

        if (post.ups < MIN_UPVOTES) continue;
        if (post.num_comments < MIN_COMMENTS) continue;
        if (post.is_video) continue;
        if (post.post_hint === 'image') continue;

        const body = post.selftext || '';
        if (body.length < 30 && post.title.length < 25) continue;

        posts.push({
          title: post.title,
          body: body.substring(0, 1200),
          subreddit: sub.name,
          upvotes: post.ups,
          comments: post.num_comments,
          url: `https://reddit.com${post.permalink}`,
          permalink: post.permalink,
          created: post.created_utc,
          type: 'reddit',
        });
      }
    } catch (err) {
      console.warn(`[REDDIT] Failed to fetch r/${sub.name}:`, err);
    }
  }

  return posts
    .sort(
      (a, b) =>
        b.upvotes + b.comments * 3 - (a.upvotes + a.comments * 3)
    )
    .slice(0, limit);
}
