import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { Resend } from 'resend';

const APP_URL = process.env.APP_URL || 'https://signal-to-startup.vercel.app';
const FROM_EMAIL = process.env.FROM_EMAIL || 'Signal to Startup <hello@entrepaIneur.com>';

export async function GET(request: NextRequest) {
  try {
    console.log('[DIGEST] VERSION 2026-04-01-09:00');
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

        const signalsSnapshot = await db
          .collection('agent_signals')
          .where('userId', '==', userId)
          .where('read', '==', false)
          .limit(5)
          .get();

        console.log('[DIGEST] Signals for user:', signalsSnapshot.size);

        if (signalsSnapshot.empty) continue;

        const signals = signalsSnapshot.docs.map(d => d.data());

        const signalCards = signals
          .map(
            s => `
          <div style="border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin-bottom:12px;background:#ffffff;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
              <span style="font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">
                ${s.source}
              </span>
              <span style="font-size:11px;color:#ffffff;background:#0f0f0f;padding:2px 8px;border-radius:20px;">
                Score: ${s.userScore}
              </span>
            </div>
            <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#0f0f0f;line-height:1.4;">
              ${s.title}
            </p>
            <p style="margin:0 0 12px;font-size:13px;color:#6b7280;line-height:1.5;">
              ${String(s.snippet ?? '').substring(0, 150)}...
            </p>
            <a href="${APP_URL}?signal=${encodeURIComponent(String(s.url))}"
              style="display:inline-block;background:#0f0f0f;color:#ffffff;text-decoration:none;padding:8px 16px;border-radius:8px;font-size:12px;font-weight:600;">
              Analyze this signal →
            </a>
          </div>`
          )
          .join('');

        const countryDisplay = prefs.countryTag ? ` · ${prefs.countryTag}` : '';
        const marketDisplay = (prefs.marketMode as string) || 'Global';
        const dateDisplay = new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        });

        console.log('[DIGEST] Sending to:', email);
        console.log('[DIGEST] From:', 'onboarding@resend.dev');

        await resend.emails.send({
          from: 'Signal to Startup <onboarding@resend.dev>',
          to: email,
          subject: `${signals.length} new signal${signals.length > 1 ? 's' : ''} matched your profile today`,
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
