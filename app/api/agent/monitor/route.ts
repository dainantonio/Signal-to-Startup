import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { fetchAllMarkets } from '@/lib/rss-fetcher';
import { COUNTRY_CONTEXT } from '@/lib/rss-sources';
import { identifyStrongSignals } from '@/lib/signal-analyzer';
import { Resend } from 'resend';

const APP_URL = process.env.APP_URL || 'https://signal-to-startup.vercel.app';

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
      const feedResult = await fetchAllMarkets({
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

            return { ...article, userScore: Math.min(Math.round(score), 99) };
          });

        console.log('[AGENT] Article scores for user:',
          scoredArticles.slice(0, 5).map((a: { title: string; userScore: number; market: string; sector: string }) => ({
            title: a.title?.substring(0, 50),
            userScore: a.userScore,
            market: a.market,
            sector: a.sector,
          }))
        );
        
        // STEP 4: Identify Strong Signals (Comparison / Clustering)
        const { strongSignals } = identifyStrongSignals(scoredArticles);
        const strongUrls = new Set(strongSignals.map(s => s.url));

        const topArticles = scoredArticles
          .filter((a: { userScore: number; url: string }) => a.userScore >= 60 || strongUrls.has(a.url))
          .sort((a: { userScore: number }, b: { userScore: number }) => b.userScore - a.userScore)
          .slice(0, 10); // Take more to allow for new filter

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
          const isStrong = strongUrls.has(article.url);
          
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
            isStrongSignal: isStrong,
            createdAt: new Date().toISOString(),
            read: false,
            analyzed: false,
            todayAction: null,
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

        // STEP 7: Immediate Briefing for Strong Signals
        const newStrongSignals = newArticles.filter(a => strongUrls.has(a.url));
        if (newStrongSignals.length > 0 && process.env.RESEND_API_KEY) {
          try {
            const userDataDoc = await db.collection('users').doc(user.userId).get();
            const email = userDataDoc.data()?.email;
            
            if (email) {
              const resend = new Resend(process.env.RESEND_API_KEY);
              const signal = newStrongSignals[0]; // Focus on the top one
              
              await resend.emails.send({
                from: 'Signal to Startup <hello@entrepaIneur.com>',
                to: email,
                subject: `🔥 Strong Signal Detected: ${signal.title}`,
                html: `
                  <div style="font-family:sans-serif;max-width:600px;margin:0 auto;border:1px solid #eee;border-radius:12px;padding:24px;">
                    <div style="background:#000;color:#fff;padding:12px;border-radius:8px;text-align:center;margin-bottom:20px;">
                      <h2 style="margin:0;font-size:18px;">Strong Signal Alert</h2>
                    </div>
                    <p style="font-size:14px;color:#666;text-transform:uppercase;letter-spacing:1px;font-weight:bold;margin-bottom:8px;">${signal.source} · ${signal.sector}</p>
                    <h1 style="font-size:24px;margin:0 0 16px;line-height:1.2;">${signal.title}</h1>
                    <p style="font-size:16px;color:#444;line-height:1.6;margin-bottom:24px;">${signal.snippet}</p>
                    <div style="background:#f9f9f9;padding:16px;border-radius:8px;margin-bottom:24px;border-left:4px solid #000;">
                      <p style="margin:0;font-weight:bold;">Why this is strong:</p>
                      <p style="margin:4px 0 0;color:#666;">This signal matches your profile with a score of ${signal.userScore}/100 and shows early trend clustering ${newStrongSignals.length > 1 ? `(part of ${newStrongSignals.length} related reports)` : ''}.</p>
                    </div>
                    <a href="${APP_URL}?signal=${encodeURIComponent(signal.url)}" 
                       style="display:inline-block;background:#000;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:bold;font-size:16px;">
                      Analyze Signal →
                    </a>
                    <p style="margin-top:32px;font-size:12px;color:#999;text-align:center;border-top:1px solid #eee;padding-top:16px;">
                      You received this because it matches your Signal to Startup profile.
                    </p>
                  </div>
                `
              });
              console.log(`[AGENT] Immediate briefing sent to ${email}`);
            }
          } catch (emailError) {
            console.error('[AGENT] Failed to send immediate briefing:', emailError);
          }
        }

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
