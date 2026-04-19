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
  { source: 'TechCrunch', text: 'Collide Capital raises $95M for fintech startups', score: 87, badge: 'Funding', bdg: '#0d2818', btx: '#22c55e' },
  { source: 'Jamaica Observer', text: 'DBJ launches $500M SME loan facility for informal sector', score: 82, badge: 'Local', bdg: '#0d1829', btx: '#3b82f6' },
  { source: 'TechCabal', text: 'Nigerian fintech raises $900M — payments still underserved', score: 79, badge: 'AI & Tech', bdg: '#160d24', btx: '#a855f7' },
  { source: 'Reuters', text: 'EU mandates digital product passports for all goods by 2026', score: 71, badge: 'Policy', btx: '#ca8a04', bdg: '#1a1500' },
  { source: 'SBA.gov', text: 'SBA unlocks $2B in new small business funding — applications open', score: 68, badge: 'Funding', bdg: '#0d2818', btx: '#22c55e' },
  { source: 'Inc Magazine', text: 'US retail vacancy hits 8-year high — 40,000 empty storefronts', score: 76, badge: 'Markets', bdg: '#1a0d0d', btx: '#ef4444' },
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
        console.warn('[AUTH] Landing redirect result error:', code);
      });
  }, []);

  const handleSignIn = async () => {
    setSignInError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === 'auth/cancelled-popup-request' || code === 'auth/popup-closed-by-user') return;
      if (code === 'auth/popup-blocked') {
        try { const { signInWithRedirect } = await import('@/firebase'); await signInWithRedirect(auth, googleProvider); } catch {}
        return;
      }
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
    } catch {
      setSubmitted(true);
    } finally { setSubmitting(false); }
  };

  if (showDemo) return <DemoMode onSignUp={handleSignIn} onBack={() => setShowDemo(false)} />;

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', color: '#fff', fontFamily: '-apple-system,BlinkMacSystemFont,"Inter",sans-serif' }}>

      {/* NAV */}
      <nav style={{ height: '52px', borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', position: 'sticky', top: 0, zIndex: 50, background: '#0a0a0a' }}>
        <Logo size="sm" showWordmark showSubbrand theme="dark" />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={() => setShowDemo(true)} style={{ height: '30px', padding: '0 14px', borderRadius: '5px', border: '1px solid #222', background: 'transparent', color: '#777', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>
            Try demo
          </button>
          <button onClick={handleSignIn} style={{ height: '30px', padding: '0 14px', borderRadius: '5px', border: 'none', background: '#fff', color: '#0a0a0a', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
            Sign in →
          </button>
        </div>
      </nav>

      {/* TICKER */}
      <div style={{ borderBottom: '1px solid #1a1a1a', height: '36px', display: 'flex', alignItems: 'center', padding: '0 32px', gap: '24px', overflow: 'hidden' }}>
        <span style={{ fontSize: '9px', fontWeight: 700, color: '#333', letterSpacing: '2px', textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0 }}>Live signals</span>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center', overflow: 'hidden' }}>
          {LIVE_SIGNALS.slice(0, 4).map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              {i > 0 && <span style={{ width: '1px', height: '14px', background: '#1a1a1a', flexShrink: 0 }} />}
              <span style={{ fontSize: '9px', fontWeight: 700, color: '#444', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{s.source}</span>
              <span style={{ fontSize: '11px', color: '#444', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.text}</span>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#22c55e', fontVariantNumeric: 'tabular-nums' }}>{s.score}</span>
            </div>
          ))}
        </div>
      </div>

      {/* HERO */}
      <div style={{ padding: '80px 32px 60px', maxWidth: '960px' }}>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div style={{ fontSize: '9px', fontWeight: 700, color: '#333', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '1px', background: '#222' }} />
            Market intelligence for builders
          </div>
          <h1 style={{ fontSize: '56px', fontWeight: 800, color: '#fff', letterSpacing: '-2.5px', lineHeight: 1.05, marginBottom: '24px' }}>
            Every headline<br />
            hides a <span style={{ color: '#22c55e' }}>business.</span>
          </h1>
          <p style={{ fontSize: '15px', color: '#555', lineHeight: 1.7, maxWidth: '500px', marginBottom: '36px' }}>
            We scan hundreds of sources daily. Our agents score, rank, and surface the signals worth building from — with a complete execution plan tailored to your market.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '48px' }}>
            <button onClick={handleSignIn} style={{ height: '42px', padding: '0 24px', background: '#fff', color: '#0a0a0a', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
              Start reading signals →
            </button>
            <button onClick={() => setShowDemo(true)} style={{ height: '42px', padding: '0 20px', background: 'transparent', color: '#555', border: '1px solid #1a1a1a', borderRadius: '6px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
              Watch a demo
            </button>
          </div>
          {signInError && <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '-32px', marginBottom: '16px' }}>{signInError}</p>}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            {['78 sources monitored daily', '5 global markets', '4 agents running 24/7', 'Free to start'].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#333' }}>
                <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#22c55e' }} />
                {item}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* LIVE SIGNAL GRID */}
      <div style={{ margin: '0 32px', border: '1px solid #1a1a1a', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ background: '#111', borderBottom: '1px solid #1a1a1a', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '9px', fontWeight: 700, color: '#333', letterSpacing: '2px', textTransform: 'uppercase' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#22c55e' }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#22c55e' }} />
              Live feed
            </div>
            — Global / US market
          </div>
          <span style={{ fontSize: '9px', color: '#333' }}>Updated 2 minutes ago · 50 signals</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
          {LIVE_SIGNALS.map((sig, i) => (
            <div key={i} style={{ padding: '16px', borderRight: (i + 1) % 3 !== 0 ? '1px solid #1a1a1a' : 'none', borderBottom: i < 3 ? '1px solid #1a1a1a' : 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <span style={{ fontSize: '9px', fontWeight: 700, color: '#444', letterSpacing: '0.5px', textTransform: 'uppercase', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sig.source}</span>
                <span style={{ fontSize: '8px', fontWeight: 700, padding: '1px 6px', borderRadius: '3px', textTransform: 'uppercase', background: sig.bdg, color: sig.btx }}>{sig.badge}</span>
                <span style={{ marginLeft: 'auto', fontSize: '10px', fontWeight: 700, color: '#22c55e', fontVariantNumeric: 'tabular-nums' }}>{sig.score}</span>
              </div>
              <div style={{ fontSize: '11px', color: '#888', lineHeight: 1.45, fontWeight: 500, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>{sig.text}</div>
              <button onClick={handleSignIn} style={{ fontSize: '9px', fontWeight: 700, color: '#333', letterSpacing: '0.5px', textTransform: 'uppercase', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
                Analyze signal →
              </button>
            </div>
          ))}
        </div>
        <div style={{ background: '#0d0d0d', borderTop: '1px solid #1a1a1a', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '11px', color: '#333' }}>Sign in to analyze any signal and get a full execution plan</span>
          <button onClick={handleSignIn} style={{ fontSize: '11px', fontWeight: 700, color: '#22c55e', background: 'none', border: 'none', cursor: 'pointer' }}>Get full access →</button>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div style={{ padding: '80px 32px', borderTop: '1px solid #1a1a1a', marginTop: '80px' }}>
        <div style={{ fontSize: '9px', fontWeight: 700, color: '#333', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '1px', background: '#1a1a1a' }} />
          How it works
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', border: '1px solid #1a1a1a', borderRadius: '8px', overflow: 'hidden' }}>
          {[
            { num: '01', icon: '📡', title: 'Signal detected', desc: 'Agents monitor 78 sources across news, Reddit, and market data — 24 hours a day.' },
            { num: '02', icon: '⚡', title: 'Scored and ranked', desc: 'Every signal is scored 1-99 for opportunity strength, timing, and market relevance.' },
            { num: '03', icon: '🎯', title: 'Opportunities surfaced', desc: 'Get 3 startup opportunities per signal — with costs, funding sources, and a launch checklist.' },
            { num: '04', icon: '🚀', title: 'You execute', desc: 'Full business plan, investor matches, cost calculator, and one daily action to move today.' },
          ].map((step, i) => (
            <div key={i} style={{ padding: '24px', borderRight: i < 3 ? '1px solid #1a1a1a' : 'none' }}>
              <div style={{ fontSize: '9px', fontWeight: 700, color: '#222', letterSpacing: '2px', marginBottom: '20px' }}>{step.num}</div>
              <div style={{ width: '32px', height: '32px', background: '#111', border: '1px solid #1a1a1a', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', marginBottom: '14px' }}>{step.icon}</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginBottom: '8px', letterSpacing: '-0.2px' }}>{step.title}</div>
              <div style={{ fontSize: '11px', color: '#444', lineHeight: 1.6 }}>{step.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* MARKETS */}
      <div style={{ padding: '0 32px 80px' }}>
        <div style={{ fontSize: '9px', fontWeight: 700, color: '#333', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '1px', background: '#1a1a1a' }} />
          Built for every market
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', border: '1px solid #1a1a1a', borderRadius: '8px', overflow: 'hidden' }}>
          {[
            { flag: '🌎', name: 'Global / US', desc: 'SBA, SBIR, Angel Capital. USD pricing.' },
            { flag: '🌴', name: 'Caribbean', desc: 'DBJ, JBDC, CARICOM, IDB. JMD pricing.' },
            { flag: '🌍', name: 'Africa', desc: 'TEF, AfDB, BOI Nigeria. NGN pricing.' },
            { flag: '🇬🇧', name: 'UK / Europe', desc: 'Innovate UK, Horizon Europe. GBP pricing.' },
            { flag: '🌎', name: 'Latin America', desc: 'IDB, BNDES, iNNpulsa. MXN/BRL pricing.' },
          ].map((m, i) => (
            <div key={i} style={{ padding: '24px 16px', borderRight: i < 4 ? '1px solid #1a1a1a' : 'none', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>{m.flag}</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff', marginBottom: '6px' }}>{m.name}</div>
              <div style={{ fontSize: '10px', color: '#444', lineHeight: 1.5 }}>{m.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: '0 32px 80px' }}>
        <div style={{ border: '1px solid #1a1a1a', borderRadius: '8px', padding: '56px', textAlign: 'center', background: '#0d0d0d' }}>
          <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#fff', letterSpacing: '-1.5px', marginBottom: '12px' }}>
            Start reading signals today.
          </h2>
          <p style={{ fontSize: '14px', color: '#444', marginBottom: '32px', lineHeight: 1.6 }}>
            Free to start. No credit card. Your first analysis in under 60 seconds.
          </p>
          {!submitted ? (
            <form onSubmit={handleWaitlist} style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                style={{ height: '42px', padding: '0 16px', borderRadius: '6px', border: '1px solid #222', background: '#111', color: '#fff', fontSize: '13px', width: '240px', outline: 'none' }}
              />
              <button type="submit" disabled={submitting} style={{ height: '42px', padding: '0 24px', background: '#fff', color: '#0a0a0a', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                {submitting ? 'Joining...' : 'Join waitlist →'}
              </button>
            </form>
          ) : (
            <p style={{ color: '#22c55e', fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>You're on the list. We'll be in touch.</p>
          )}
          {emailError && <p style={{ fontSize: '11px', color: '#ef4444', marginBottom: '16px' }}>{emailError}</p>}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <button onClick={handleSignIn} style={{ height: '42px', padding: '0 24px', background: '#fff', color: '#0a0a0a', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
              Sign in with Google →
            </button>
            <button onClick={() => setShowDemo(true)} style={{ height: '42px', padding: '0 20px', background: 'transparent', color: '#555', border: '1px solid #1a1a1a', borderRadius: '6px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
              Try the demo first
            </button>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ borderTop: '1px solid #1a1a1a', padding: '24px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '11px', color: '#333' }}>© 2026 EntrepAIneur · Signal to Startup</span>
        <div style={{ display: 'flex', gap: '24px' }}>
          {[['Privacy', '/privacy'], ['Terms', '/terms'], ['Unsubscribe', '/unsubscribe']].map(([label, href]) => (
            <a key={label} href={href} style={{ fontSize: '11px', color: '#333', textDecoration: 'none' }}>{label}</a>
          ))}
        </div>
      </div>

    </div>
  );
}
