import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const OWNER_EMAIL = process.env.OWNER_EMAIL || 'hello@entrepaIneur.com';
const FROM_EMAIL = process.env.FROM_EMAIL || 'Signal to Startup <hello@entrepaIneur.com>';

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
  }

  if (!process.env.RESEND_API_KEY) {
    // No key configured — still return success (Firestore handles persistence)
    return NextResponse.json({ ok: true });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    // Welcome email to the subscriber
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "You're on the Signal to Startup waitlist 🚀",
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 24px; color: #111;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 32px;">
            <div style="width: 32px; height: 32px; background: #000; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M13 2L4.5 13.5H11L10 22L20.5 10H14L13 2Z" fill="white"/></svg>
            </div>
            <span style="font-size: 15px; font-weight: 600;">Signal to Startup</span>
          </div>

          <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 12px;">You're on the list!</h1>
          <p style="font-size: 15px; color: #555; line-height: 1.6; margin-bottom: 24px;">
            Thanks for joining the Signal to Startup waitlist. We'll email you as soon as full access opens.
          </p>

          <div style="background: #f9f9f9; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <p style="font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #888; margin-bottom: 12px;">What you'll get</p>
            <ul style="list-style: none; padding: 0; margin: 0; font-size: 14px; color: #444; line-height: 2;">
              <li>⚡ Live signal feed — news-to-opportunity in seconds</li>
              <li>🌍 Hyperlocal intelligence for your market</li>
              <li>📋 Full execution plans with funding sources</li>
              <li>✅ Business idea validation against real data</li>
            </ul>
          </div>

          <p style="font-size: 13px; color: #999;">
            Want to try it now? You can access the beta at any time —
            <a href="https://signal-to-startup.vercel.app" style="color: #000;">signal-to-startup.vercel.app</a>
          </p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
          <p style="font-size: 12px; color: #bbb;">
            Signal to Startup by EntrepAIneur &nbsp;·&nbsp;
            <a href="https://signal-to-startup.vercel.app/unsubscribe?email=${encodeURIComponent(email)}" style="color: #bbb;">Unsubscribe</a>
          </p>
        </div>
      `,
    });

    // Owner notification
    await resend.emails.send({
      from: FROM_EMAIL,
      to: OWNER_EMAIL,
      subject: `New waitlist signup: ${email}`,
      html: `
        <p style="font-family: sans-serif; font-size: 14px; color: #333;">
          New waitlist signup: <strong>${email}</strong><br/>
          Time: ${new Date().toUTCString()}
        </p>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Resend error:', error);
    // Don't fail the request — Firestore already saved the email
    return NextResponse.json({ ok: true });
  }
}
