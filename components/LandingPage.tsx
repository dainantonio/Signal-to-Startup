'use client';
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  auth, googleProvider, signInWithPopup,
  getRedirectResult, db, addDoc, collection
} from '@/firebase';
import DemoMode from '@/components/DemoMode';
import Logo from '@/components/Logo';

const LIVE_SIGNALS = [
  { source: 'TechCrunch', text: 'Collide Capital raises $95M for fintech and future-of-work startups', score: 87, badge: 'Funding', bg: '#f0fdf4', color: '#166534' },
  { source: 'Jamaica Observer', text: 'DBJ launches $500M SME loan facility targeting informal sector', score: 82, badge: 'Local', bg: '#e0f2fe', color: '#075985' },
  { source: 'TechCabal', text: 'Nigerian fintech raises $900M in Q1 — payments still underserved', score: 79, badge: 'AI & Tech', bg: '#eff6ff', color: '#1e40af' },
  { source: 'Reuters', text: 'EU mandates digital product passports for all goods by 2026', score: 71, badge: 'Policy', bg: '#fefce8', color: '#854d0e' },
  { source: 'SBA.gov', text: 'SBA unlocks $2B in small business funding — applications now open', score: 68, badge: 'Funding', bg: '#f0fdf4', color: '#166534' },
  { source: 'Inc Magazine', text: 'US retail vacancy hits 8-year high — 40,000 empty storefronts', score: 76, badge: 'Markets', bg: '#faf5ff', color: '#6b21a8' },
];

const STEPS = [
  { num: '01', title: 'Signal detected', desc: 'Agents monitor 78 sources across news, Reddit, and market data around the clock.' },
  { num: '02', title: 'Scored and ranked', desc: 'Every signal is scored 1–99 for opportunity strength, timing, and local relevance.' },
  { num: '03', title: 'Opportunities surfaced', desc: 'Three specific startup opportunities per signal — with real costs and funding sources.' },
  { num: '04', title: 'You execute', desc: 'Full business plan, investor matches, cost calculator, and one action you can take today.' },
];

const MARKETS = [
  { flag: '🌎', name: 'Global / US', grants: 'SBA · SBIR · Angel Capital' },
  { flag: '🌴', name: 'Caribbean', grants: 'DBJ · JBDC · CARICOM · IDB' },
  { flag: '🌍', name: 'Africa', grants: 'TEF · AfDB · BOI Nigeria' },
  { flag: '🇬🇧', name: 'UK / Europe', grants: 'Innovate UK · Horizon Europe' },
  { flag: '🌎', name: 'Latin America', grants: 'IDB · BNDES · iNNpulsa' },
];

export default function LandingPage() {
  const [showDemo, setShowDemo] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [emailError, setEmailError] = useState('');

  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) console.log('[AUTH] Landing redirect sign-in successful');
      })
      .catch((err: unknown) => {
        const code = (err as { code?: string }).code;
        if (code === 'auth/cancelled-popup-request' || code === 'auth/popup-closed-by-user') return;
      });
  }, []);

  const handleSignIn = async () => {
    setSignInError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === 'auth/cancelled-popup-request' || code === 'auth/popup-closed-by-user') return;
      setSignInError('Sign-in failed. Please try again.');
    }
  };

  const handleWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) { setEmailError('Please enter a valid email'); return; }
    setSubmitting(true); setEmailError('');
    try {
      await addDoc(collection(db, 'waitlist'), { email: email.toLowerCase().trim(), joinedAt: new Date().toISOString(), source: 'landing-page' });
      setSubmitted(true);
    } catch { setSubmitted(true); }
    finally { setSubmitting(false); }
  };

  if (showDemo) return <DemoMode onSignUp={handleSignIn} onBack={() => setShowDemo(false)} />;

  const S = {
    page: { background: '#fafaf8', minHeight: '100vh', fontFamily: '-apple-system,BlinkMacSystemFont,"Inter",sans-serif', color: '#0a0a0a' } as React.CSSProperties,
    nav: { height: '56px', borderBottom: '1px solid #e8e8e4', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', position: 'sticky' as const, top: 0, zIndex: 50, background: 'rgba(250,250,248,0.95)', backdropFilter: 'blur(8px)' },
    navBtn: { height: '32px', padding: '0 16px', borderRadius: '6px', border: '1px solid #e8e8e4', background: 'white', color: '#555', fontSize: '12px', fontWeight: 500, cursor: 'pointer' } as React.CSSProperties,
    navPrimary: { height: '32px', padding: '0 16px', borderRadius: '6px', border: 'none', background: '#0a0a0a', color: 'white', fontSize: '12px', fontWeight: 600, cursor: 'pointer' } as React.CSSProperties,
    ticker: { borderBottom: '1px solid #e8e8e4', height: '38px', display: 'flex', alignItems: 'center', padding: '0 40px', gap: '0', overflow: 'hidden', background: 'white' } as React.CSSProperties,
    section: { padding: '80px 40px', borderTop: '1px solid #e8e8e4' } as React.CSSProperties,
    sectionLabel: { fontSize: '9px', fontWeight: 700, color: '#999', letterSpacing: '2.5px', textTransform: 'uppercase' as const, marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '12px' },
    labelLine: { flex: '0 0 24px', height: '1px', background: '#e8e8e4' } as React.CSSProperties,
  };

  return (
    <div style={S.page}>

      {/* NAV */}
      <nav style={S.nav}>
        <Logo size="sm" showWordmark showSubbrand theme="light" />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={() => setShowDemo(true)} style={S.navBtn}>Try demo</button>
          <button onClick={handleSignIn} style={S.navPrimary}>Sign in →</button>
        </div>
      </nav>

      {/* TICKER — live signals bar */}
      <div style={S.ticker}>
        <span style={{ fontSize: '9px', fontWeight: 700, color: '#999', letterSpacing: '2px', textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0, marginRight: '24px', paddingRight: '24px', borderRight: '1px solid #e8e8e4' }}>
          Live signals
        </span>
        <div style={{ display: 'flex', gap: '0', alignItems: 'center', overflow: 'hidden', flex: 1 }}>
          {LIVE_SIGNALS.slice(0, 5).map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 24px', borderRight: '1px solid #e8e8e4', flexShrink: 0 }}>
              <span style={{ fontSize: '9px', fontWeight: 700, color: '#bbb', letterSpacing: '0.5px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{s.source}</span>
              <span style={{ fontSize: '11px', color: '#555', whiteSpace: 'nowrap', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.text}</span>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#16a34a', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{s.score}</span>
            </div>
          ))}
        </div>
      </div>

      {/* HERO */}
      <div style={{ padding: '80px 40px 60px', maxWidth: '1100px' }}>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div style={S.sectionLabel}>
            <div style={S.labelLine} />
            Market intelligence for entrepreneurs
          </div>
          <h1 style={{ fontSize: '60px', fontWeight: 800, color: '#0a0a0a', letterSpacing: '-3px', lineHeight: 1.02, marginBottom: '24px', maxWidth: '700px' }}>
            Every headline<br />
            hides a{' '}
            <span style={{ color: '#16a34a' }}>business.</span>
          </h1>
          <p style={{ fontSize: '16px', color: '#666', lineHeight: 1.7, maxWidth: '480px', marginBottom: '36px', fontWeight: 400 }}>
            We scan hundreds of sources daily and surface the signals worth building from — with a complete execution plan tailored to your market and funding landscape.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px' }}>
            <button onClick={handleSignIn} style={{ height: '44px', padding: '0 28px', background: '#0a0a0a', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', letterSpacing: '-0.2px' }}>
              Start reading signals →
            </button>
            <button onClick={() => setShowDemo(true)} style={{ height: '44px', padding: '0 20px', background: 'white', color: '#555', border: '1px solid #e8e8e4', borderRadius: '8px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>
              Try the demo
            </button>
          </div>
          {signInError && <p style={{ fontSize: '12px', color: '#dc2626', marginTop: '-24px', marginBottom: '16px' }}>{signInError}</p>}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
            {['78 sources monitored', '5 global markets', '4 agents running 24/7', 'Free to start'].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', color: '#999' }}>
                <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#16a34a', flexShrink: 0 }} />
                {item}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* LIVE SIGNAL GRID */}
      <div style={{ margin: '0 40px', border: '1px solid #e8e8e4', borderRadius: '10px', overflow: 'hidden', background: 'white' }}>
        {/* Grid header */}
        <div style={{ background: '#fafaf8', borderBottom: '1px solid #e8e8e4', padding: '10px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a' }} />
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#16a34a', letterSpacing: '0.5px' }}>LIVE</span>
            </div>
            <span style={{ fontSize: '11px', color: '#999', borderLeft: '1px solid #e8e8e4', paddingLeft: '10px' }}>Global / US · 50 signals · updated 2m ago</span>
          </div>
          <button onClick={handleSignIn} style={{ fontSize: '11px', fontWeight: 600, color: '#0a0a0a', background: 'none', border: 'none', cursor: 'pointer' }}>
            Sign in to analyze →
          </button>
        </div>

        {/* Signal rows — table style like Bloomberg */}
        <div>
          {LIVE_SIGNALS.map((sig, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '100px 60px 1fr 40px 80px', alignItems: 'center', gap: '16px', padding: '14px 18px', borderBottom: i < LIVE_SIGNALS.length - 1 ? '1px solid #f5f5f3' : 'none', transition: 'background 0.1s' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#fafaf8')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <span style={{ fontSize: '9px', fontWeight: 700, color: '#bbb', letterSpacing: '0.5px', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sig.source}</span>
              <span style={{ fontSize: '9px', fontWeight: 700, padding: '3px 7px', borderRadius: '4px', background: sig.bg, color: sig.color, textTransform: 'uppercase', letterSpacing: '0.2px', whiteSpace: 'nowrap', display: 'inline-block' }}>{sig.badge}</span>
              <span style={{ fontSize: '12px', color: '#333', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sig.text}</span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#16a34a', fontVariantNumeric: 'tabular-nums', textAlign: 'right' as const }}>{sig.score}</span>
              <button onClick={handleSignIn} style={{ fontSize: '10px', fontWeight: 600, color: '#0a0a0a', background: '#f5f5f3', border: '1px solid #e8e8e4', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Analyze →
              </button>
            </div>
          ))}
        </div>

        {/* Grid footer */}
        <div style={{ background: '#fafaf8', borderTop: '1px solid #e8e8e4', padding: '10px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '11px', color: '#bbb' }}>Showing 6 of 50 signals. Sign in to see all and analyze any signal.</span>
          <button onClick={handleSignIn} style={{ fontSize: '11px', fontWeight: 700, color: '#16a34a', background: 'none', border: 'none', cursor: 'pointer' }}>
            Get full access →
          </button>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div style={S.section}>
        <div style={{ maxWidth: '1020px' }}>
          <div style={S.sectionLabel}>
            <div style={S.labelLine} />
            How it works
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0', border: '1px solid #e8e8e4', borderRadius: '10px', overflow: 'hidden', background: 'white' }}>
            {STEPS.map((step, i) => (
              <div key={i} style={{ padding: '28px 24px', borderRight: i < 3 ? '1px solid #e8e8e4' : 'none' }}>
                <div style={{ fontSize: '9px', fontWeight: 700, color: '#ccc', letterSpacing: '2px', marginBottom: '20px', fontVariantNumeric: 'tabular-nums' }}>{step.num}</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0a0a0a', marginBottom: '10px', letterSpacing: '-0.3px' }}>{step.title}</div>
                <div style={{ fontSize: '12px', color: '#888', lineHeight: 1.65 }}>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MARKETS */}
      <div style={{ ...S.section, paddingTop: '0', borderTop: 'none' }}>
        <div style={{ maxWidth: '1020px' }}>
          <div style={S.sectionLabel}>
            <div style={S.labelLine} />
            Built for every market
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', border: '1px solid #e8e8e4', borderRadius: '10px', overflow: 'hidden', background: 'white' }}>
            {MARKETS.map((m, i) => (
              <div key={i} style={{ padding: '28px 20px', borderRight: i < 4 ? '1px solid #e8e8e4' : 'none', textAlign: 'center' as const }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>{m.flag}</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0a0a0a', marginBottom: '8px', letterSpacing: '-0.2px' }}>{m.name}</div>
                <div style={{ fontSize: '10px', color: '#999', lineHeight: 1.6 }}>{m.grants}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* WHY NOT CHATGPT */}
      <div style={{ ...S.section, background: '#0a0a0a', borderTop: 'none' }}>
        <div style={{ maxWidth: '1020px' }}>
          <div style={{ ...S.sectionLabel, color: '#444' }}>
            <div style={{ ...S.labelLine, background: '#1a1a1a' }} />
            <span style={{ color: '#444' }}>Why not just use ChatGPT?</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'start' }}>
            <div>
              <h2 style={{ fontSize: '32px', fontWeight: 800, color: 'white', letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: '20px' }}>
                ChatGPT gives you ideas.<br />
                We give you signals.
              </h2>
              <p style={{ fontSize: '14px', color: '#555', lineHeight: 1.7 }}>
                Generic AI tools generate ideas from nothing. We surface real problems happening right now — from news, Reddit, government data, and market feeds — then build a full execution plan around what the market is actually telling you.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { label: 'ChatGPT', text: 'Generic ideas from training data' },
                { label: 'Signal to Startup', text: 'Real signals from today\'s market' },
                { label: 'ChatGPT', text: 'No market timing or local context' },
                { label: 'Signal to Startup', text: 'Scored by opportunity strength & timing' },
                { label: 'ChatGPT', text: 'You figure out funding yourself' },
                { label: 'Signal to Startup', text: 'Grant sources matched to your region' },
                { label: 'ChatGPT', text: 'Conversation ends, nothing happens' },
                { label: 'Signal to Startup', text: 'One action you can take today' },
              ].map((item, i) => (
                <div key={i} style={{ padding: '14px', borderRadius: '8px', background: item.label === 'ChatGPT' ? '#111' : '#0d1f0d', border: `1px solid ${item.label === 'ChatGPT' ? '#1a1a1a' : '#1a3a1a'}` }}>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: item.label === 'ChatGPT' ? '#444' : '#16a34a', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px' }}>{item.label}</div>
                  <div style={{ fontSize: '11px', color: item.label === 'ChatGPT' ? '#555' : '#86efac', lineHeight: 1.5 }}>{item.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: '80px 40px' }}>
        <div style={{ maxWidth: '1020px', border: '1px solid #e8e8e4', borderRadius: '10px', padding: '60px', textAlign: 'center' as const, background: 'white' }}>
          <div style={S.sectionLabel}>
            <div style={{ ...S.labelLine, flex: 1 }} />
            Get started
            <div style={{ ...S.labelLine, flex: 1 }} />
          </div>
          <h2 style={{ fontSize: '40px', fontWeight: 800, color: '#0a0a0a', letterSpacing: '-2px', marginBottom: '12px', lineHeight: 1.05 }}>
            Start reading signals today.
          </h2>
          <p style={{ fontSize: '15px', color: '#888', marginBottom: '36px', lineHeight: 1.6 }}>
            Free to start. No credit card. Your first analysis in under 60 seconds.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' as const }}>
            <button onClick={handleSignIn} style={{ height: '44px', padding: '0 28px', background: '#0a0a0a', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
              Sign in with Google →
            </button>
            <button onClick={() => setShowDemo(true)} style={{ height: '44px', padding: '0 20px', background: 'white', color: '#555', border: '1px solid #e8e8e4', borderRadius: '8px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>
              Try the demo first
            </button>
          </div>
          {!submitted ? (
            <form onSubmit={handleWaitlist} style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' as const }}>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Join the waitlist — your@email.com"
                style={{ height: '40px', padding: '0 16px', borderRadius: '8px', border: '1px solid #e8e8e4', background: '#fafaf8', color: '#0a0a0a', fontSize: '13px', width: '280px', outline: 'none' }} />
              <button type="submit" disabled={submitting}
                style={{ height: '40px', padding: '0 20px', background: '#fafaf8', color: '#0a0a0a', border: '1px solid #e8e8e4', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                {submitting ? 'Joining...' : 'Join waitlist'}
              </button>
            </form>
          ) : (
            <p style={{ fontSize: '13px', color: '#16a34a', fontWeight: 600 }}>You are on the list. We will be in touch.</p>
          )}
          {emailError && <p style={{ fontSize: '11px', color: '#dc2626', marginTop: '8px' }}>{emailError}</p>}
          {signInError && <p style={{ fontSize: '11px', color: '#dc2626', marginTop: '8px' }}>{signInError}</p>}
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ borderTop: '1px solid #e8e8e4', padding: '24px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white' }}>
        <span style={{ fontSize: '11px', color: '#bbb' }}>© 2026 EntrepAIneur · Signal to Startup</span>
        <div style={{ display: 'flex', gap: '24px' }}>
          {[['Privacy', '/privacy'], ['Terms', '/terms'], ['Unsubscribe', '/unsubscribe']].map(([label, href]) => (
            <a key={label} href={href} style={{ fontSize: '11px', color: '#bbb', textDecoration: 'none' }}>{label}</a>
          ))}
        </div>
      </div>

    </div>
  );
}
