'use client';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import {
  auth, googleProvider, signInWithPopup,
  getRedirectResult, db, addDoc, collection
} from '@/firebase';
import DemoMode from '@/components/DemoMode';
import Logo from '@/components/Logo';

const LIVE_SIGNALS = [
  { source: 'TechCrunch',      text: 'Collide Capital raises $95M for fintech and future-of-work startups',  score: 87, badge: 'Funding',  bg: '#f0fdf4', color: '#166534' },
  { source: 'Jamaica Observer', text: 'DBJ launches $500M SME loan facility targeting informal sector',       score: 82, badge: 'Local',    bg: '#e0f2fe', color: '#075985' },
  { source: 'TechCabal',        text: 'Nigerian fintech raises $900M in Q1 — payments still underserved',    score: 79, badge: 'AI & Tech', bg: '#eff6ff', color: '#1e40af' },
  { source: 'Reuters',          text: 'EU mandates digital product passports for all goods by 2026',         score: 71, badge: 'Policy',   bg: '#fefce8', color: '#854d0e' },
  { source: 'SBA.gov',          text: 'SBA unlocks $2B in small business funding — applications now open',   score: 68, badge: 'Funding',  bg: '#f0fdf4', color: '#166534' },
  { source: 'Inc Magazine',     text: 'US retail vacancy hits 8-year high — 40,000 empty storefronts',       score: 76, badge: 'Markets',  bg: '#faf5ff', color: '#6b21a8' },
];

const STEPS = [
  { num: '01', title: 'Signal detected',        desc: 'Agents monitor 78 sources across news, Reddit, and market data around the clock.' },
  { num: '02', title: 'Scored and ranked',      desc: 'Every signal is scored 1–99 for opportunity strength, timing, and local relevance.' },
  { num: '03', title: 'Opportunities surfaced', desc: 'Three specific startup opportunities per signal — with real costs and funding sources.' },
  { num: '04', title: 'You execute',            desc: 'Full business plan, investor matches, cost calculator, and one action for today.' },
];

const MARKETS = [
  { flag: '🌎', name: 'Global / US',    grants: 'SBA · SBIR · Angel Capital' },
  { flag: '🌴', name: 'Caribbean',      grants: 'DBJ · JBDC · CARICOM · IDB' },
  { flag: '🌍', name: 'Africa',         grants: 'TEF · AfDB · BOI Nigeria' },
  { flag: '🇬🇧', name: 'UK / Europe',  grants: 'Innovate UK · Horizon Europe' },
  { flag: '🌎', name: 'Latin America',  grants: 'IDB · BNDES · iNNpulsa' },
];

const COMPARISONS = [
  { a: 'Generic ideas from training data',          b: 'Real signals from today\'s market' },
  { a: 'No market timing or local context',         b: 'Scored by opportunity strength & timing' },
  { a: 'You find funding yourself',                 b: 'Grant sources matched to your region' },
  { a: 'Conversation ends, nothing ships',          b: 'One concrete action you can take today' },
];

export default function LandingPage() {
  const [showDemo, setShowDemo]       = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);
  const [email, setEmail]             = useState('');
  const [submitted, setSubmitted]     = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [emailError, setEmailError]   = useState('');

  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => { if (result?.user) console.log('[AUTH] Landing redirect sign-in successful'); })
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
    if (!email || !email.includes('@')) { setEmailError('Please enter a valid email address'); return; }
    setSubmitting(true); setEmailError('');
    try {
      await addDoc(collection(db, 'waitlist'), { email: email.toLowerCase().trim(), joinedAt: new Date().toISOString(), source: 'landing-page' });
      setSubmitted(true);
    } catch { setSubmitted(true); }
    finally { setSubmitting(false); }
  };

  if (showDemo) return <DemoMode onSignUp={handleSignIn} onBack={() => setShowDemo(false)} />;

  return (
    <div style={{ background: '#F7F7F5', minHeight: '100vh', fontFamily: 'Inter, -apple-system, sans-serif', color: '#0a0a0a' }}>

      {/* ── NAV ── */}
      <header style={{
        height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(20px, 5vw, 48px)', position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(247,247,245,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #e5e5e1',
      }}>
        <Logo size="sm" showWordmark showSubbrand theme="light" />
        <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setShowDemo(true)}
            style={btnOutline}
          >Try demo</button>
          <button
            onClick={handleSignIn}
            style={btnPrimary}
          >Sign in →</button>
        </nav>
      </header>

      {/* ── TICKER ── */}
      <div style={{
        borderBottom: '1px solid #e5e5e1', background: '#fff',
        height: '38px', display: 'flex', alignItems: 'center', overflow: 'hidden',
      }}>
        <div style={{
          flexShrink: 0, display: 'flex', alignItems: 'center', gap: '10px',
          padding: '0 20px 0 clamp(20px,5vw,48px)', borderRight: '1px solid #e5e5e1',
          height: '100%',
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a', flexShrink: 0, animation: 'pulse-dot 2s infinite' }} />
          <span style={{ fontSize: '9px', fontWeight: 700, color: '#16a34a', letterSpacing: '2px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Live</span>
        </div>
        <div style={{ overflow: 'hidden', flex: 1 }}>
          <div className="animate-ticker">
            {[...LIVE_SIGNALS, ...LIVE_SIGNALS].map((s, i) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '0 28px', borderRight: '1px solid #eee', flexShrink: 0 }}>
                <span style={{ fontSize: '9px', fontWeight: 700, color: '#bbb', letterSpacing: '0.5px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{s.source}</span>
                <span style={{ fontSize: '11px', color: '#555', whiteSpace: 'nowrap' }}>{s.text}</span>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#16a34a', fontVariantNumeric: 'tabular-nums' }}>{s.score}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── HERO ── */}
      <section style={{ padding: 'clamp(48px,8vw,96px) clamp(20px,5vw,48px) clamp(40px,6vw,64px)', maxWidth: '1200px' }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
          <div style={sectionLabel}>Market intelligence for entrepreneurs</div>
          <h1 style={{
            fontSize: 'clamp(42px, 7vw, 72px)',
            fontWeight: 800, color: '#0a0a0a',
            letterSpacing: '-0.04em', lineHeight: 1.01,
            marginBottom: '24px', maxWidth: '720px',
          }}>
            Every headline<br />
            hides a{' '}
            <span style={{ color: '#16a34a' }}>business.</span>
          </h1>
          <p style={{ fontSize: 'clamp(15px, 2vw, 17px)', color: '#666', lineHeight: 1.75, maxWidth: '500px', marginBottom: '36px', fontWeight: 400 }}>
            We scan hundreds of sources daily and surface the signals worth building from — with a complete execution plan tailored to your market and funding landscape.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '36px', flexWrap: 'wrap' }}>
            <button onClick={handleSignIn} style={{ ...btnPrimary, height: '46px', padding: '0 28px', fontSize: '14px', borderRadius: '10px' }}>
              Start reading signals →
            </button>
            <button onClick={() => setShowDemo(true)} style={{ ...btnOutline, height: '46px', padding: '0 22px', fontSize: '14px', borderRadius: '10px' }}>
              Try the demo
            </button>
          </div>

          {signInError && (
            <p style={{ fontSize: '12px', color: '#dc2626', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>⚠</span> {signInError}
            </p>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            {['78 sources monitored', '5 global markets', '4 agents running 24/7', 'Free to start'].map((item) => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', color: '#888' }}>
                <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#16a34a', flexShrink: 0 }} />
                {item}
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── SIGNAL GRID ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        style={{ margin: '0 clamp(20px,5vw,48px) clamp(40px,6vw,64px)', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e5e5e1', background: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.05)' }}
      >
        {/* Grid header */}
        <div style={{ background: '#FAFAF8', borderBottom: '1px solid #e5e5e1', padding: '10px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="status-live" style={{ fontSize: '9px', fontWeight: 700, color: '#16a34a', letterSpacing: '1.5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a', animation: 'pulse-dot 2s infinite', display: 'inline-block' }} />
              LIVE
            </span>
            <span style={{ fontSize: '11px', color: '#aaa', borderLeft: '1px solid #e5e5e1', paddingLeft: '12px' }}>Global / US · 50 signals · updated 2m ago</span>
          </div>
          <button onClick={handleSignIn} style={{ fontSize: '11px', fontWeight: 700, color: '#0a0a0a', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', letterSpacing: '-0.2px' }}>
            Sign in to analyze →
          </button>
        </div>

        {/* Signal rows */}
        <div style={{ overflowX: 'auto' }}>
          {LIVE_SIGNALS.map((sig, i) => (
            <div
              key={i}
              style={{
                display: 'grid', gridTemplateColumns: '90px 58px 1fr 36px 80px',
                alignItems: 'center', gap: '14px', padding: '13px 18px',
                borderBottom: i < LIVE_SIGNALS.length - 1 ? '1px solid #f5f5f3' : 'none',
                transition: 'background 0.1s', minWidth: '480px',
                borderLeft: sig.score >= 80 ? '2px solid #16a34a' : '2px solid transparent',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#FAFAF8')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ fontSize: '9px', fontWeight: 700, color: '#bbb', letterSpacing: '0.5px', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sig.source}</span>
              <span style={{ fontSize: '9px', fontWeight: 700, padding: '3px 7px', borderRadius: '5px', background: sig.bg, color: sig.color, textTransform: 'uppercase', letterSpacing: '0.2px', whiteSpace: 'nowrap', display: 'inline-block' }}>{sig.badge}</span>
              <span style={{ fontSize: '12px', color: '#333', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sig.text}</span>
              <span style={{ fontSize: '12px', fontWeight: 800, color: sig.score >= 80 ? '#16a34a' : sig.score >= 70 ? '#d97706' : '#94a3b8', fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>{sig.score}</span>
              <button
                onClick={handleSignIn}
                style={{ fontSize: '10px', fontWeight: 600, color: '#0a0a0a', background: '#f5f5f3', border: '1px solid #e5e5e1', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.1s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#0a0a0a'; (e.currentTarget as HTMLButtonElement).style.color = '#fff'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#f5f5f3'; (e.currentTarget as HTMLButtonElement).style.color = '#0a0a0a'; }}
              >
                Analyze →
              </button>
            </div>
          ))}
        </div>

        {/* Grid footer */}
        <div style={{ background: '#FAFAF8', borderTop: '1px solid #e5e5e1', padding: '10px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', color: '#bbb' }}>Showing 6 of 50 signals. Sign in to see all.</span>
          <button onClick={handleSignIn} style={{ fontSize: '11px', fontWeight: 700, color: '#16a34a', background: 'none', border: 'none', cursor: 'pointer', padding: '0' }}>
            Get full access →
          </button>
        </div>
      </motion.div>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: '0 clamp(20px,5vw,48px) clamp(48px,6vw,80px)', borderTop: '1px solid #e5e5e1' }}>
        <div style={{ maxWidth: '1100px', paddingTop: 'clamp(48px,6vw,80px)' }}>
          <div style={sectionLabel}>How it works</div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            border: '1px solid #e5e5e1', borderRadius: '12px', overflow: 'hidden', background: '#fff',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}>
            {STEPS.map((step, i) => (
              <div key={i} style={{
                padding: 'clamp(20px,3vw,32px)', borderRight: i < 3 ? '1px solid #e5e5e1' : 'none',
                position: 'relative',
              }}>
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#d1d5db', letterSpacing: '2.5px', marginBottom: '20px', fontVariantNumeric: 'tabular-nums' }}>{step.num}</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0a0a0a', marginBottom: '10px', letterSpacing: '-0.3px' }}>{step.title}</div>
                <div style={{ fontSize: '12px', color: '#888', lineHeight: 1.7 }}>{step.desc}</div>
                {i < 3 && (
                  <div style={{ position: 'absolute', right: '-8px', top: '50%', transform: 'translateY(-50%)', zIndex: 1, display: 'none' }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MARKETS ── */}
      <section style={{ padding: 'clamp(32px,4vw,48px) clamp(20px,5vw,48px) clamp(48px,6vw,80px)' }}>
        <div style={{ maxWidth: '1100px' }}>
          <div style={sectionLabel}>Built for every market</div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            border: '1px solid #e5e5e1', borderRadius: '12px', overflow: 'hidden', background: '#fff',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}>
            {MARKETS.map((m, i) => (
              <div key={i} style={{
                padding: 'clamp(20px,3vw,28px) 20px', borderRight: i < 4 ? '1px solid #e5e5e1' : 'none',
                textAlign: 'center', transition: 'background 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = '#FAFAF8')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ fontSize: '26px', marginBottom: '10px', lineHeight: 1 }}>{m.flag}</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0a0a0a', marginBottom: '6px', letterSpacing: '-0.2px' }}>{m.name}</div>
                <div style={{ fontSize: '10px', color: '#aaa', lineHeight: 1.65 }}>{m.grants}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY NOT CHATGPT ── */}
      <section style={{ background: '#0d0d0d', padding: 'clamp(48px,6vw,80px) clamp(20px,5vw,48px)' }}>
        <div style={{ maxWidth: '1100px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#333', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 'clamp(32px,4vw,48px)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '24px', height: '1px', background: '#222' }} />
            Why not just use ChatGPT?
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'clamp(32px,5vw,56px)', alignItems: 'start' }}>
            <div>
              <h2 style={{ fontSize: 'clamp(26px,4vw,36px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '16px' }}>
                ChatGPT gives you ideas.<br />We give you signals.
              </h2>
              <p style={{ fontSize: '14px', color: '#555', lineHeight: 1.75 }}>
                Generic AI tools generate ideas from nothing. We surface real problems happening right now — from news, Reddit, and market feeds — then build a full execution plan around what the market is actually telling you.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {COMPARISONS.map((item, i) => (
                <div key={`a-${i}`} style={{ padding: '14px', borderRadius: '8px', background: '#141414', border: '1px solid #1e1e1e' }}>
                  <div style={{ fontSize: '8px', fontWeight: 700, color: '#3a3a3a', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '6px' }}>ChatGPT</div>
                  <div style={{ fontSize: '11px', color: '#4a4a4a', lineHeight: 1.55 }}>{item.a}</div>
                </div>
              ))}
              {COMPARISONS.map((item, i) => (
                <div key={`b-${i}`} style={{ padding: '14px', borderRadius: '8px', background: '#0c1f0e', border: '1px solid #1a3a1e' }}>
                  <div style={{ fontSize: '8px', fontWeight: 700, color: '#16a34a', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '6px' }}>Signal to Startup</div>
                  <div style={{ fontSize: '11px', color: '#86efac', lineHeight: 1.55 }}>{item.b}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: 'clamp(48px,6vw,80px) clamp(20px,5vw,48px)' }}>
        <div style={{ maxWidth: '1100px' }}>
          <div style={{
            border: '1px solid #e5e5e1', borderRadius: '16px', padding: 'clamp(40px,5vw,64px)',
            textAlign: 'center', background: '#fff',
            boxShadow: '0 2px 20px rgba(0,0,0,0.04)',
          }}>
            <div style={{ ...sectionLabel, justifyContent: 'center' }}>
              <div style={{ flex: 1, height: '1px', background: '#e5e5e1', maxWidth: '40px' }} />
              Get started
              <div style={{ flex: 1, height: '1px', background: '#e5e5e1', maxWidth: '40px' }} />
            </div>
            <h2 style={{ fontSize: 'clamp(28px,5vw,44px)', fontWeight: 800, color: '#0a0a0a', letterSpacing: '-0.035em', marginBottom: '12px', lineHeight: 1.05 }}>
              Start reading signals today.
            </h2>
            <p style={{ fontSize: '15px', color: '#888', marginBottom: '36px', lineHeight: 1.65, maxWidth: '400px', margin: '0 auto 36px' }}>
              Free to start. No credit card. Your first analysis in under 60 seconds.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '28px', flexWrap: 'wrap' }}>
              <button onClick={handleSignIn} style={{ ...btnPrimary, height: '46px', padding: '0 28px', fontSize: '14px', borderRadius: '10px' }}>
                Sign in with Google →
              </button>
              <button onClick={() => setShowDemo(true)} style={{ ...btnOutline, height: '46px', padding: '0 22px', fontSize: '14px', borderRadius: '10px' }}>
                Try the demo first
              </button>
            </div>
            {!submitted ? (
              <form onSubmit={handleWaitlist} style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', maxWidth: '420px', margin: '0 auto' }}>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="Join waitlist — your@email.com"
                  style={{
                    flex: 1, minWidth: '200px', height: '40px', padding: '0 14px',
                    borderRadius: '8px', border: '1px solid #e5e5e1', background: '#FAFAF8',
                    color: '#0a0a0a', fontSize: '13px', outline: 'none', fontFamily: 'inherit',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#aaa')}
                  onBlur={e => (e.target.style.borderColor = '#e5e5e1')}
                />
                <button
                  type="submit" disabled={submitting}
                  style={{ height: '40px', padding: '0 18px', background: '#FAFAF8', color: '#0a0a0a', border: '1px solid #e5e5e1', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                >
                  {submitting ? 'Joining…' : 'Join waitlist'}
                </button>
              </form>
            ) : (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#16a34a', fontWeight: 600, background: '#f0fdf4', padding: '8px 16px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7l3 3 6-6" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                You're on the list. We'll be in touch.
              </div>
            )}
            {emailError && <p style={{ fontSize: '11px', color: '#dc2626', marginTop: '10px' }}>{emailError}</p>}
            {signInError && <p style={{ fontSize: '11px', color: '#dc2626', marginTop: '10px' }}>{signInError}</p>}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid #e5e5e1', padding: '20px clamp(20px,5vw,48px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', gap: '16px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '11px', color: '#ccc', letterSpacing: '-0.1px' }}>© 2026 EntrepAIneur · Signal to Startup</span>
        <div style={{ display: 'flex', gap: '20px' }}>
          {[['Privacy', '/privacy'], ['Terms', '/terms'], ['Unsubscribe', '/unsubscribe']].map(([label, href]) => (
            <a key={label} href={href} style={{ fontSize: '11px', color: '#bbb', textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#666')}
              onMouseLeave={e => (e.currentTarget.style.color = '#bbb')}
            >{label}</a>
          ))}
        </div>
      </footer>

    </div>
  );
}

/* ── Shared button styles ── */
const btnPrimary: React.CSSProperties = {
  height: '32px', padding: '0 16px',
  background: '#0a0a0a', color: '#fff',
  border: 'none', borderRadius: '8px',
  fontSize: '12px', fontWeight: 600,
  cursor: 'pointer', fontFamily: 'inherit',
  letterSpacing: '-0.2px', whiteSpace: 'nowrap',
  boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
};

const btnOutline: React.CSSProperties = {
  height: '32px', padding: '0 14px',
  background: '#fff', color: '#555',
  border: '1px solid #e5e5e1', borderRadius: '8px',
  fontSize: '12px', fontWeight: 500,
  cursor: 'pointer', fontFamily: 'inherit',
  whiteSpace: 'nowrap',
};

const sectionLabel: React.CSSProperties = {
  fontSize: '10px', fontWeight: 700, color: '#aaa',
  letterSpacing: '2.5px', textTransform: 'uppercase',
  marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px',
};
