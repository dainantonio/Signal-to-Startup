import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

// Common words to exclude from keyword matching
const STOP_WORDS = [
  'that', 'this', 'with', 'from', 'they', 'have', 'will', 'been', 'their',
  'about', 'which', 'when', 'there', 'would', 'could', 'should', 'after',
  'before', 'these', 'those', 'other', 'more', 'also', 'into', 'than',
  'then', 'some', 'what', 'your',
];

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

  console.log('[WATCHER] NODE_ENV:', process.env.NODE_ENV);
  console.log('[WATCHER] Auth header received:', !!authHeader);
  console.log('[WATCHER] CRON_SECRET present:', !!process.env.CRON_SECRET);
  console.log('[WATCHER] Secret first 4 chars:', process.env.CRON_SECRET?.slice(0, 4));
  console.log('[WATCHER] Auth match:', authHeader === expectedAuth);

  if (
    process.env.NODE_ENV === 'production' &&
    authHeader !== expectedAuth
  ) {
    console.log('[WATCHER] Unauthorized - rejecting');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[WATCHER] Signal Watcher starting...');

  try {
    const db = getAdminDb();
    const now = new Date();

    // Get all active watchlists
    const watchlistSnap = await db
      .collection('signal_watchlist')
      .where('status', '==', 'active')
      .get();

    if (watchlistSnap.empty) {
      return NextResponse.json({
        success: true,
        processed: 0,
        message: 'No active watchlists',
      });
    }

    console.log('[WATCHER] Active watchlists:', watchlistSnap.size);

    let totalMatches = 0;

    for (const watchDoc of watchlistSnap.docs) {
      const watch = watchDoc.data();

      // Check if expired
      if (new Date(watch.expiresAt) < now) {
        await watchDoc.ref.update({ status: 'expired' });
        continue;
      }

      // Get recent signals for this user from the last 48 hours
      const cutoff = new Date();
      cutoff.setHours(cutoff.getHours() - 48);

      const recentSignals = await db
        .collection('agent_signals')
        .where('userId', '==', watch.userId)
        .where('read', '==', false)
        .get();

      const newSignals = recentSignals.docs
        .filter(d => new Date(d.data().createdAt) > cutoff)
        .map(d => d.data());

      if (newSignals.length === 0) continue;

      // Extract key terms from seed signal
      const seedText = (
        watch.seedSignal.title + ' ' + watch.seedSignal.snippet
      ).toLowerCase();

      const seedWords = seedText
        .split(/\W+/)
        .filter(w => w.length > 4)
        .filter(w => !STOP_WORDS.includes(w));

      // Score each new signal against the seed
      const alreadyMatchedUrls = new Set(
        (watch.matchedSignals || []).map((m: { url: string }) => m.url)
      );

      const matches: {
        title: string;
        snippet: string;
        url: string;
        source: string;
        matchScore: number;
        addedAt: string;
      }[] = [];

      for (const signal of newSignals) {
        // Skip already-matched signals and the seed itself
        if (alreadyMatchedUrls.has(signal.url)) continue;
        if (signal.url === watch.seedSignal.url) continue;

        const signalText = (
          (signal.title || '') + ' ' + (signal.snippet || '')
        ).toLowerCase();

        const hits = seedWords.filter(w => signalText.includes(w)).length;
        const sectorBonus = signal.sector === watch.seedSignal.sector ? 2 : 0;

        const matchScore = Math.min(
          Math.round(
            ((hits + sectorBonus) / Math.max(seedWords.length * 0.3, 3)) * 100
          ),
          99
        );

        if (matchScore >= 35) {
          matches.push({
            title: signal.title,
            snippet: signal.snippet || '',
            url: signal.url,
            source: signal.source,
            matchScore,
            addedAt: new Date().toISOString(),
          });
        }
      }

      if (matches.length === 0) continue;

      // Merge with existing matched signals
      const allMatches = [...(watch.matchedSignals || []), ...matches];

      const convergenceScore = Math.min(
        Math.round(
          (allMatches.length / Math.max(watch.watchDays * 0.5, 2)) * 100
        ),
        99
      );

      // Update watchlist doc
      await watchDoc.ref.update({
        matchedSignals: allMatches,
        convergenceScore,
        status: convergenceScore >= 60 ? 'triggered' : 'active',
      });

      // Create in-app notification
      await db.collection('notifications').add({
        userId: watch.userId,
        type: 'watchlist_match',
        title: `${matches.length} new signal${matches.length > 1 ? 's' : ''} strengthen your watchlist`,
        message: `"${watch.seedSignal.title.substring(0, 60)}..." — convergence ${convergenceScore}%`,
        watchlistId: watchDoc.id,
        convergenceScore,
        read: false,
        createdAt: new Date().toISOString(),
      });

      totalMatches += matches.length;
      console.log(
        '[WATCHER] Matched',
        matches.length,
        'signals for:',
        watch.seedSignal.title.substring(0, 40)
      );
    }

    return NextResponse.json({
      success: true,
      watchlistsChecked: watchlistSnap.size,
      totalMatches,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[WATCHER] Failed:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
