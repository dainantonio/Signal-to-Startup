import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { Resend } from 'resend';

const APP_URL = process.env.APP_URL || 'https://signal-to-startup.vercel.app';
const FROM_EMAIL = process.env.FROM_EMAIL || 'Signal to Startup <hello@entrepaIneur.com>';

export async function GET(request: NextRequest) {
  try {
    console.log('[DIGEST] VERSION 2026-04-15-FRESH');
    console.log('[DIGEST] START');
    console.log('[DIGEST] NODE_ENV:', process.env.NODE_ENV);
    console.log('[DIGEST] RESEND_API_KEY present:', !!process.env.RESEND_API_KEY);

    const authHeader = request.headers.get('authorization');
    if (
      process.env.NODE_ENV === 'production' &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.RESEND_API_KEY) {
      console.log('[DIGEST] RESEND_API_KEY missing - aborting');
      return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
    }

    // Lazy init — avoids module-load-time throw if key is undefined
    const resend = new Resend(process.env.RESEND_API_KEY);
    console.log('[DIGEST] Resend initialized');

    const db = getAdminDb();
    console.log('[DIGEST] Firebase initialized');

    const usersSnapshot = await db.collection('user_preferences').get();
    console.log('[DIGEST] Users found:', usersSnapshot.size);

    if (usersSnapshot.empty) {
      console.log('[DIGEST] No users - returning early');
      return NextResponse.json({ success: true, emailsSent: 0, timestamp: new Date().toISOString() });
    }

    let emailsSent = 0;

    for (const userDoc of usersSnapshot.docs) {
      try {
        const userId = userDoc.id;
        const prefs = userDoc.data();

        if (prefs.digestEnabled === false) {
          console.log('[DIGEST] User has digest disabled:', userId);
          continue;
        }

        const userDataDoc = await db.collection('users').doc(userId).get();
        if (!userDataDoc.exists) {
          console.log('[DIGEST] No users doc for userId:', userId);
          continue;
        }
        const email = userDataDoc.data()?.email as string | undefined;
        if (!email) {
          console.log('[DIGEST] No email for userId:', userId);
          continue;
        }

        console.log('[DIGEST] Processing:', email);

        const cutoff = new Date();
        cutoff.setHours(cutoff.getHours() - 24);

        const signalsSnapshot = await db
          .collection('agent_signals')
          .where('userId', '==', userId)
          .where('read', '==', false)
          .where('createdAt', '>=', cutoff.toISOString())
          .orderBy('createdAt', 'desc')
          .limit(5)
          .get();

        console.log('[DIGEST] Signals for user:', signalsSnapshot.size);

        // Get triggered watchlists for this user
        const watchlistSnap = await db
          .collection('signal_watchlist')
          .where('userId', '==', userId)
          .where('status', '==', 'triggered')
          .get();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const triggeredWatches: any[] = watchlistSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        if (signalsSnapshot.empty && triggeredWatches.length === 0) continue;

        const signals = signalsSnapshot.docs.map(d => d.data());

        // Enrich signals with pre-analyzed opportunities where available
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        type EnrichedSignal = Record<string, any> & { topOpportunity: any; todayAction: any };
        const enrichedSignals: EnrichedSignal[] = await Promise.all(
          signals.map(async (signal): Promise<EnrichedSignal> => {
            if (signal.analyzed && signal.opportunityId) {
              try {
                const oppDoc = await db
                  .collection('agent_opportunities')
                  .doc(signal.opportunityId)
                  .get();
                if (oppDoc.exists) {
                  const oppData = oppDoc.data();
                  const topOpp = oppData?.result?.opportunities?.[0];
                  const todayAction = oppData?.result?.today_action;
                  return { ...signal, topOpportunity: topOpp ?? null, todayAction: todayAction ?? null };
                }
              } catch (err) {
                console.warn('[DIGEST] Failed to fetch opportunity:', err);
              }
            }
            return { ...signal, topOpportunity: null, todayAction: null };
          })
        );

        const analyzedCount = enrichedSignals.filter(s => s.topOpportunity).length;

        const signalCards = enrichedSignals.map(signal => `
          <div style="margin:16px 0;padding:20px;background:#fff;border-radius:12px;border:1px solid #e5e7eb;">
            <p style="margin:0 0 4px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">
              ${signal.source} · Score ${Math.min(signal.userScore || 0, 99)}
            </p>
            <p style="margin:0 0 12px;font-size:15px;font-weight:600;color:#111;line-height:1.4;">
              ${signal.title}
            </p>
            ${signal.topOpportunity ? `
            <div style="padding:14px;background:#f0fdf4;border-radius:8px;border:1px solid #86efac;margin-bottom:12px;">
              <p style="margin:0 0 4px;font-size:10px;color:#15803d;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">
                ⚡ Top Opportunity — Already Analyzed
              </p>
              <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:#111;">
                ${signal.topOpportunity.name}
              </p>
              <p style="margin:0 0 8px;font-size:13px;color:#374151;line-height:1.5;">
                ${String(signal.topOpportunity.description || '').substring(0, 120)}...
              </p>
              <p style="margin:0;font-size:12px;color:#6b7280;">
                💰 Startup cost: $${(signal.topOpportunity.startup_cost || 0).toLocaleString()} · 🚀 Speed: ${signal.topOpportunity.speed_to_launch || '—'}/10
              </p>
            </div>
            ${signal.todayAction ? `
            <div style="padding:12px;background:#fefce8;border-radius:8px;border:1px solid #fde047;margin-bottom:12px;">
              <p style="margin:0 0 4px;font-size:10px;color:#854d0e;font-weight:700;text-transform:uppercase;">
                Your move today
              </p>
              <p style="margin:0;font-size:13px;color:#713f12;line-height:1.5;">
                ${signal.todayAction}
              </p>
            </div>
            ` : ''}
            <a href="${APP_URL}?opportunity=${signal.opportunityId}"
              style="display:inline-block;padding:10px 20px;background:#000;color:#fff;border-radius:8px;font-size:13px;font-weight:600;text-decoration:none;">
              View full analysis →
            </a>
            ` : `
            <p style="margin:0 0 12px;font-size:13px;color:#6b7280;line-height:1.5;">
              ${String(signal.snippet ?? '').substring(0, 150)}...
            </p>
            <a href="${APP_URL}"
              style="display:inline-block;padding:10px 20px;background:#000;color:#fff;border-radius:8px;font-size:13px;font-weight:600;text-decoration:none;">
              Analyze this signal →
            </a>
            `}
          </div>`).join('');

        const countryDisplay = prefs.countryTag ? ` · ${prefs.countryTag}` : '';
        const marketDisplay = (prefs.marketMode as string) || 'Global';
        const dateDisplay = new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        });
        const weekdayDisplay = new Date().toLocaleDateString('en-US', { weekday: 'long' });

        const subject = analyzedCount > 0
          ? `⚡ ${analyzedCount} opportunit${analyzedCount > 1 ? 'ies' : 'y'} pre-analyzed for you — ${weekdayDisplay}`
          : `📡 Your ${signals.length} signals for ${weekdayDisplay}`;

        console.log('[DIGEST] Sending to:', email);
        console.log('[DIGEST] From:', 'onboarding@resend.dev');
        console.log('[DIGEST] Pre-analyzed count:', analyzedCount);

        await resend.emails.send({
          from: 'Signal to Startup <onboarding@resend.dev>',
          to: email,
          subject,
          html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">

    <div style="background:#0f0f0f;padding:24px 32px;">
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="width:32px;height:32px;background:#ffffff;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px;">⚡</div>
          <span style="color:#ffffff;font-size:15px;font-weight:600;">Signal to Startup</span>
        </div>
        <span style="color:#6b7280;font-size:12px;">Daily digest</span>
      </div>
    </div>

    <div style="padding:32px;">
      <h2 style="margin:0 0 4px;font-size:20px;font-weight:700;color:#0f0f0f;">Your signals for today</h2>
      <p style="margin:0 0 24px;font-size:13px;color:#6b7280;">${marketDisplay}${countryDisplay} · ${dateDisplay}</p>

      ${signalCards}

      ${signals[0]?.todayAction ? `
      <div style="margin:24px 0;padding:20px;background:#f0fdf4;border-radius:12px;border:2px solid #86efac;">
        <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#15803d;text-transform:uppercase;letter-spacing:0.1em;">
          Your Move Today
        </p>
        <p style="margin:0;font-size:15px;color:#111;line-height:1.5;font-weight:500;">
          ${signals[0].todayAction}
        </p>
      </div>
      ` : ''}

      ${triggeredWatches.length > 0 ? `
      <div style="margin:24px 0;padding:20px;background:#fffbeb;border-radius:12px;border:2px solid #fbbf24;">
        <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#92400e;">
          🔥 Your watchlist is heating up
        </p>
        ${triggeredWatches.map((w) => `
          <div style="margin-bottom:12px;padding:12px;background:white;border-radius:8px;">
            <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#111;">
              ${String(w.seedSignal?.title || '').substring(0, 80)}
            </p>
            <p style="margin:0 0 8px;font-size:12px;color:#666;">
              ${w.matchedSignals?.length || 0} supporting signal${(w.matchedSignals?.length || 0) > 1 ? 's' : ''} · ${w.convergenceScore}% convergence
            </p>
            <a href="${APP_URL}/dashboard?tab=watchlist"
              style="font-size:12px;font-weight:600;color:#d97706;text-decoration:none;">
              Run compound analysis →
            </a>
          </div>
        `).join('')}
      </div>
      ` : ''}

      <div style="text-align:center;margin-top:24px;padding-top:24px;border-top:1px solid #f3f4f6;">
        <a href="${APP_URL}"
          style="display:inline-block;background:#0f0f0f;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:10px;font-size:13px;font-weight:600;">
          Open Signal to Startup →
        </a>
        <p style="margin:12px 0 0;font-size:11px;color:#9ca3af;">Based on your preferences: ${marketDisplay}${countryDisplay}</p>
      </div>
    </div>

    <div style="background:#f9fafb;padding:16px 32px;border-top:1px solid #f3f4f6;text-align:center;">
      <p style="margin:0;font-size:11px;color:#9ca3af;">
        Signal to Startup by EntrepAIneur ·
        <a href="${APP_URL}/unsubscribe" style="color:#9ca3af;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>`,
        });

        emailsSent++;
        console.log('[DIGEST] Sent to:', email);

        // Mark signals as read so they don't appear in next digest
        const batch = db.batch();
        signalsSnapshot.docs.forEach(doc => {
          batch.update(doc.ref, {
            read: true,
            readAt: new Date().toISOString(),
          });
        });
        await batch.commit();
        console.log('[DIGEST] Marked', signalsSnapshot.size, 'signals as read');

      } catch (userError) {
        console.error('[DIGEST] Error for user:', userError);
      }
    }

    console.log('[DIGEST] Returning result:', { emailsSent });

    return NextResponse.json({
      success: true,
      emailsSent,
      timestamp: new Date().toISOString(),
    });

  } catch (topLevelError) {
    console.error('[DIGEST] TOP LEVEL ERROR:', topLevelError);
    return NextResponse.json(
      { error: String(topLevelError) },
      { status: 500 }
    );
  }
}
