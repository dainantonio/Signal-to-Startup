import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { fetchRSSFeeds } from '@/lib/rss-fetcher';
import { COUNTRY_CONTEXT } from '@/lib/rss-sources';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (
    process.env.NODE_ENV === 'production' &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = getAdminDb();

    console.log('[AGENT] Signal Monitor starting...');

    // STEP 1: Get all active users and their preferences
    const usersSnapshot = await db.collection('user_preferences').get();

    if (usersSnapshot.empty) {
      console.log('[AGENT] No users with preferences yet');
      return NextResponse.json({ success: true, message: 'No users to process' });
    }

    const users = usersSnapshot.docs.map(d => ({ userId: d.id, ...d.data() }));
    console.log(`[AGENT] Processing ${users.length} users`);

    // STEP 2: Fetch all RSS feeds across all markets
    let allArticles: ReturnType<typeof Array.prototype.slice> = [];
    try {
      const feedResult = await fetchRSSFeeds({
        markets: ['global', 'caribbean', 'africa', 'uk', 'latam'],
        sectors: ['ai', 'policy', 'markets', 'funding', 'sustainability', 'realestate', 'health'],
        recency: '24h',
      });
      allArticles = feedResult.items;
      console.log(`[AGENT] Fetched ${allArticles.length} articles`);
    } catch (feedError) {
      console.error('[AGENT] Feed fetch failed:', feedError);
      return NextResponse.json({ error: 'Feed fetch failed' }, { status: 500 });
    }

    if (allArticles.length === 0) {
      return NextResponse.json({ success: true, message: 'No new articles found' });
    }

    console.log('[AGENT] Total articles fetched:', allArticles.length);
    console.log('[AGENT] Sample article:', JSON.stringify(allArticles[0], null, 2));

    // STEP 3: For each user, score articles against their preferences
    const results: { userId: string; newSignals: number }[] = [];

    for (const user of users) {
      try {
        const userPrefs = user as Record<string, unknown>;
        const userMarket = (userPrefs.marketMode as string) || 'global';
        const userCountry = (userPrefs.countryTag as string) || '';
        const userSectors = (userPrefs.sectors as string[]) || [];
        const userBusinessTypes = (userPrefs.businessTypes as string[]) || [];

        // Filter articles for this user's market (always include global)
        const marketArticles = allArticles.filter(
          (article: { market: string }) =>
            article.market === userMarket || article.market === 'global'
        );

        console.log('[AGENT] Market filtered articles:', marketArticles.length);

        // Score each article for this user
        const scoredArticles = marketArticles
          .map((article: { title: string; snippet: string; sector: string; market: string; signalScore?: number; url: string; source: string; publishedAt: string }) => {
            let score = article.signalScore ?? 50;

            if (userSectors.includes(article.sector)) score += 15;

            if (userCountry) {
              const countryConfig = COUNTRY_CONTEXT[userCountry.toLowerCase()];
              if (countryConfig?.keywords) {
                const text = `${article.title} ${article.snippet}`.toLowerCase();
                const countryHits = countryConfig.keywords.filter(
                  (k: string) => text.includes(k.toLowerCase())
                ).length;
                score += countryHits * 10;
              }
            }

            if (userBusinessTypes.length > 0) {
              const text = `${article.title} ${article.snippet}`.toLowerCase();
              const typeHits = userBusinessTypes.filter((t: string) =>
                text.includes(t.toLowerCase())
              ).length;
              score += typeHits * 8;
            }

            return { ...article, userScore: score };
          });

        console.log('[AGENT] Article scores for user:',
          scoredArticles.slice(0, 5).map((a: { title: string; userScore: number; market: string; sector: string }) => ({
            title: a.title?.substring(0, 50),
            userScore: a.userScore,
            market: a.market,
            sector: a.sector,
          }))
        );

        const topArticles = scoredArticles
          .filter((a: { userScore: number }) => a.userScore >= 60)
          .sort((a: { userScore: number }, b: { userScore: number }) => b.userScore - a.userScore)
          .slice(0, 5);

        if (topArticles.length === 0) continue;

        // STEP 4: Check which articles user has already seen (last 7 days)
        const seenSnapshot = await db
          .collection('agent_signals')
          .where('userId', '==', user.userId)
          .where('createdAt', '>', new Date(Date.now() - 7 * 24 * 3_600_000).toISOString())
          .get();

        const seenUrls = new Set(seenSnapshot.docs.map(d => d.data().url as string));
        const newArticles = topArticles.filter(
          (a: { url: string }) => !seenUrls.has(a.url)
        );

        if (newArticles.length === 0) continue;

        // STEP 5: Save new signals + notification in one batch
        const batch = db.batch();

        for (const article of newArticles) {
          const signalRef = db.collection('agent_signals').doc();
          batch.set(signalRef, {
            userId: user.userId,
            title: article.title,
            snippet: article.snippet,
            url: article.url,
            source: article.source,
            sector: article.sector,
            market: article.market,
            signalScore: article.signalScore,
            userScore: article.userScore,
            createdAt: new Date().toISOString(),
            read: false,
            analyzed: false,
          });
        }

        // STEP 6: Create in-app notification
        const notificationRef = db.collection('notifications').doc();
        batch.set(notificationRef, {
          userId: user.userId,
          type: 'new_signals',
          title: `${newArticles.length} new signal${newArticles.length > 1 ? 's' : ''} for you`,
          message: newArticles[0].title,
          count: newArticles.length,
          read: false,
          createdAt: new Date().toISOString(),
        });

        await batch.commit();

        results.push({ userId: user.userId, newSignals: newArticles.length });
        console.log(`[AGENT] Saved ${newArticles.length} signals for user ${user.userId}`);

      } catch (userError) {
        console.error(`[AGENT] Error processing user ${user.userId}:`, userError);
      }
    }

    console.log('[AGENT] Monitor complete:', results);

    return NextResponse.json({
      success: true,
      processed: users.length,
      results,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[AGENT] Monitor failed:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
