'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { auth, googleProvider, signInWithPopup, signInWithRedirect, db, addDoc, collection } from '@/firebase';
import DemoMode from '@/components/DemoMode';
import Logo from '@/components/Logo';
import { WorkflowInteractiveDemo } from '@/components/WorkflowInteractiveDemo';

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showDemo, setShowDemo] = useState(false);

  const handleWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await addDoc(collection(db, 'waitlist'), {
        email: email.toLowerCase().trim(),
        joinedAt: new Date().toISOString(),
        source: 'landing-page',
      });
    } catch {
      try {
        const existing = JSON.parse(localStorage.getItem('waitlist') || '[]');
        existing.push({ email, joinedAt: new Date().toISOString() });
        localStorage.setItem('waitlist', JSON.stringify(existing));
      } catch { /* ignore */ }
    }
    fetch('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.toLowerCase().trim() }),
    }).catch(() => { /* ignore */ });
    setSubmitted(true);
    setSubmitting(false);
  };

  const handleSignIn = async () => {
    try {
      const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
      console.log('Starting Google sign-in, mobile=', isMobile, 'userAgent=', navigator.userAgent);
      if (isMobile) {
        await signInWithRedirect(auth, googleProvider);
      } else {
        await signInWithPopup(auth, googleProvider);
      }
    } catch (err: any) {
      if (err?.code === 'auth/cancelled-popup-request') return;
      if (err?.code === 'auth/popup-closed-by-user') return;
      console.error('Sign in failed:', err);
    }
  };

  if (showDemo) {
    return <DemoMode onSignUp={handleSignIn} onBack={() => setShowDemo(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 font-sans">

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo size="sm" showWordmark showSubbrand={false} theme="light" />
          <div className="flex items-center gap-6">
            <button
              onClick={() => setShowDemo(true)}
              className="btn-ghost hidden sm:flex"
            >
              Try free demo
            </button>
            <button
              onClick={handleSignIn}
              className="btn-primary text-sm"
            >
              Sign in →
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-20 px-6 text-center max-w-5xl mx-auto">

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Now with Reddit signals & compound analysis
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-balance mb-6"
        >
          Turn news into
          <br />
          <span className="gradient-primary bg-clip-text text-transparent">
            business opportunities
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto mb-6 text-balance"
        >
          Signal to Startup transforms any news story into actionable business opportunities.
          Get AI-powered analysis, market-specific insights, funding sources, and a complete
          launch plan — all tailored to your location and industry.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-wrap justify-center gap-4 text-sm text-slate-500 mb-10"
        >
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            5 markets covered
          </span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Reddit signal analysis
          </span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Compound opportunity detection
          </span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Auto-generated pitch decks
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="max-w-lg mx-auto"
        >
          {submitted ? (
            <div className="premium-card p-8 text-center rounded-2xl">
              <div className="text-4xl mb-4">🎉</div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">You're on the list!</h3>
              <p className="text-slate-600 mb-6">Ready to start building? Try it now.</p>
              <button
                onClick={handleSignIn}
                className="btn-primary w-full"
              >
                Start free →
              </button>
            </div>
          ) : (
            <form onSubmit={handleWaitlist} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="input-premium flex-1"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary whitespace-nowrap"
                >
                  {submitting ? 'Joining...' : 'Get early access'}
                </button>
              </div>
              {error && <p className="text-sm text-red-600 text-center">{error}</p>}
              <p className="text-sm text-slate-500 text-center">
                Free during beta • No credit card required •{' '}
                <button onClick={handleSignIn} className="text-primary hover:underline">
                  Already have access?
                </button>
              </p>
            </form>
          )}

          <div className="mt-6 flex items-center justify-center gap-4">
            <div className="h-px bg-slate-200 flex-1 max-w-12" />
            <span className="text-sm text-slate-400">or</span>
            <div className="h-px bg-slate-200 flex-1 max-w-12" />
          </div>

          <button
            onClick={() => setShowDemo(true)}
            className="btn-secondary w-full mt-4"
          >
            Try a free analysis — no sign up needed
          </button>
        </motion.div>
      </section>

      {/* WORKFLOW */}
      <section className="py-10 px-6 max-w-6xl mx-auto">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              label: 'Discover',
              title: 'Signal discovery',
              detail: 'Automatically scan news, Reddit, and local market sources for the most relevant opportunities.',
            },
            {
              label: 'Analyze',
              title: 'AI intelligence',
              detail: 'The agent converts raw signals into startup ideas, funding paths, and action-ready execution plans.',
            },
            {
              label: 'Launch',
              title: 'Build with confidence',
              detail: 'Get a clear path from idea to launch with pitch decks, landing pages, and launch checklists.',
            },
          ].map(step => (
            <div key={step.label} className="premium-card rounded-3xl p-8 text-left">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-slate-900 text-white font-semibold mb-4">
                {step.label.slice(0, 1)}
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">{step.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{step.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* STATS */}
      <section className="border-y border-slate-200/50 py-12 px-6 bg-slate-50/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: '5', label: 'Markets covered', icon: '🌍' },
              { number: '60+', label: 'Signal sources', icon: '📡' },
              { number: '3', label: 'AI agents running', icon: '🤖' },
              { number: '50+', label: 'Countries supported', icon: '🇺🇸' },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl mb-2">{stat.icon}</div>
                <div className="text-2xl font-bold text-slate-900">{stat.number}</div>
                <div className="text-sm text-slate-600 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY NOT CHATGPT */}
      <section className="py-24 px-6 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">
              Why not just use ChatGPT?
            </p>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-balance">
              Four things no other AI tool does
            </h2>
            <p className="text-slate-400 text-lg max-w-3xl mx-auto leading-relaxed">
              ChatGPT is great. But it waits for you to ask, gives generic global advice,
              and stops at the idea. Signal to Startup is different in four specific ways.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                icon: '🤖',
                label: '01',
                title: 'It works while you sleep',
                body: 'Your personal AI agent monitors markets every morning, finds signals matching your profile, analyzes the top opportunities, and has them waiting in your inbox. You open the app and the research is already done.',
                highlight: true,
              },
              {
                icon: '📍',
                label: '02',
                title: 'It knows your specific market',
                body: 'An Atlanta entrepreneur gets SBA programs and local market context. A Kingston business owner gets DBJ loans, JMD costs, and references to Portmore market. A Lagos founder gets TEF funding and naira pricing. No prompt gets ChatGPT that specific.',
                highlight: false,
              },
              {
                icon: '🔗',
                label: '03',
                title: 'Compound signal analysis',
                body: 'Select multiple news articles and find the business opportunity hiding at their intersection. Rising electricity rates + solar adoption surge + new green energy loans = compound signal. We surface what no single article reveals.',
                highlight: false,
              },
              {
                icon: '🚀',
                label: '04',
                title: 'Reddit signal intelligence',
                body: 'We analyze real-time Reddit discussions across 50+ subreddits to find pain points, complaints, and workarounds that traditional news misses. Turn community conversations into business opportunities before they become mainstream.',
                highlight: true,
              },
            ].map(item => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className={`premium-card p-8 rounded-2xl ${item.highlight ? 'bg-slate-800 border-slate-700' : 'bg-slate-800/50 border-slate-700/50'}`}
              >
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-3xl">{item.icon}</span>
                  <span className="text-sm font-mono text-slate-500">{item.label}</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">{item.title}</h3>
                <p className="text-slate-300 leading-relaxed">{item.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* THE JOURNEY */}
      <section className="py-20 px-4 max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            The journey
          </p>
          <h2 className="text-3xl font-bold text-gray-900">
            From news story to open for business
          </h2>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto text-sm leading-relaxed">
            Most people read the news and see information. We help you see opportunity
            — and walk you all the way through.
          </p>
        </div>

        <div className="mt-12">
          <WorkflowInteractiveDemo />
        </div>
        <div className="text-center mt-10">
          <button
            onClick={() => setShowDemo(true)}
            className="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:border-black hover:text-black transition-all"
          >
            See it in action →
          </button>
        </div>
      </section>

      {/* WHO IT IS FOR */}
      <section className="py-20 px-4 bg-gray-50 border-y border-gray-200">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              Who this is for
            </p>
            <h2 className="text-3xl font-bold text-gray-900">
              Built for entrepreneurs every other tool underserves
            </h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto text-sm leading-relaxed">
              Big startup tools are built for Silicon Valley. Signal to Startup
              is built for everyone else — US small businesses, immigrant
              founders, diaspora entrepreneurs, and first-generation builders
              across the globe.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                emoji: '🏪',
                name: 'The US small business owner',
                location: 'Atlanta · Dallas · Miami',
                story: 'Running a business or ready to start one. Tired of advice built for tech startups with venture capital. Needs opportunities that fit their budget, their community, their market.',
                level: 'Simple or Standard mode',
              },
              {
                emoji: '✈️',
                name: 'The immigrant founder',
                location: 'New York · Houston · LA',
                story: 'Built businesses back home, now building in America — or sending opportunities back. Needs tools that understand both worlds and do not assume you started with capital.',
                level: 'Standard mode',
              },
              {
                emoji: '🌴',
                name: 'The diaspora entrepreneur',
                location: 'Caribbean & African roots',
                story: 'Professional career in the US or UK, wants to build something back home or serve their community. Needs hyperlocal intelligence for markets most tools ignore.',
                level: 'Standard or Advanced',
              },
              {
                emoji: '🚀',
                name: 'The emerging market founder',
                location: 'Lagos · Kingston · Bogotá',
                story: 'Full of hustle and ideas. What is missing is the roadmap — the business plan, the funding sources, the step-by-step guide that a business advisor would give. This is that.',
                level: 'Simple or Standard mode',
              },
            ].map(person => (
              <motion.div
                key={person.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="p-6 bg-white rounded-2xl border border-gray-200 hover:shadow-md transition-all"
              >
                <div className="text-3xl mb-4">{person.emoji}</div>
                <p className="text-sm font-semibold text-gray-900 mb-0.5">{person.name}</p>
                <p className="text-xs text-gray-400 mb-3">{person.location}</p>
                <p className="text-xs text-gray-600 leading-relaxed mb-4">{person.story}</p>
                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded-full">
                  {person.level}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* READING LEVELS */}
      <section className="py-20 px-4 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Meets you where you are
          </p>
          <h2 className="text-3xl font-bold text-gray-900">Not too much. Not too little.</h2>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto text-sm leading-relaxed">
            Choose how you want opportunities explained. A first-time entrepreneur
            and a seasoned founder need different things from the same data.
            You get both.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              icon: '🗣', level: 'Simple', title: 'Talk to me like a friend',
              tag: 'First-time entrepreneurs',
              points: ['Plain language — no startup jargon', 'One business idea at a time', 'One specific next move today', 'Costs in your local currency'],
              featured: false,
            },
            {
              icon: '📊', level: 'Standard', title: 'Give me the full picture',
              tag: 'Growing entrepreneurs',
              points: ['Full market analysis', 'Three ranked opportunities', 'Grants and funding sources', 'Complete execution suite'],
              featured: true,
            },
            {
              icon: '🚀', level: 'Advanced', title: 'Deep details only',
              tag: 'Experienced founders',
              points: ['Investor-ready language', 'Compound signal analysis', 'Competitive moat analysis', 'Market sizing and metrics'],
              featured: false,
            },
          ].map(item => (
            <div
              key={item.level}
              className={`p-6 rounded-2xl border-2 ${item.featured ? 'border-black bg-gray-950 text-white' : 'border-gray-200 bg-white'}`}
            >
              <div className="text-2xl mb-3">{item.icon}</div>
              <div className="text-xs font-mono text-gray-400 mb-1">{item.level}</div>
              <h3 className={`text-sm font-semibold mb-1 ${item.featured ? 'text-white' : 'text-gray-900'}`}>
                {item.title}
              </h3>
              <p className="text-xs text-gray-400 mb-4">{item.tag}</p>
              <ul className="space-y-2">
                {item.points.map(p => (
                  <li key={p} className={`text-xs flex items-start gap-2 ${item.featured ? 'text-gray-300' : 'text-gray-600'}`}>
                    <span className="text-green-500 flex-shrink-0 mt-0.5">✓</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* THE AGENT */}
      <section className="py-20 px-4 bg-gray-50 border-y border-gray-200">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">The agent</p>
            <h2 className="text-3xl font-bold text-gray-900">It works while you sleep</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              Every morning your personal Signal Monitor scans the news, finds
              opportunities matched to your profile and location, and has them analyzed
              before you open the app. Your digest arrives by 9am.
            </p>
            <p className="text-gray-500 text-sm leading-relaxed">
              This is the difference between a tool you have to use and an
              assistant working for you — whether you are in Atlanta or Accra.
            </p>
          </div>
          <div className="space-y-3">
            {[
              { time: '7:00 AM', icon: '📡', action: 'Signal Monitor runs',      detail: 'Scans your market for new signals',    color: 'bg-blue-50 border-blue-200' },
              { time: '8:00 AM', icon: '🔍', action: 'Scout analyzes top signals', detail: 'Full analysis ready before you wake',  color: 'bg-purple-50 border-purple-200' },
              { time: '9:00 AM', icon: '📧', action: 'Digest delivered',           detail: 'Opportunities in your inbox',          color: 'bg-green-50 border-green-200' },
              { time: 'All day', icon: '🔔', action: 'High-score alerts',          detail: 'Best signals notify you instantly',    color: 'bg-amber-50 border-amber-200' },
            ].map(item => (
              <div key={item.time} className={`flex items-center gap-4 p-4 rounded-xl border ${item.color}`}>
                <span className="text-xl flex-shrink-0">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900">{item.action}</p>
                  <p className="text-xs text-gray-500">{item.detail}</p>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0 font-mono">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MARKETS */}
      <section className="py-20 px-4 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Your market</p>
          <h2 className="text-3xl font-bold text-gray-900">Hyperlocal everywhere</h2>
          <p className="text-gray-500 mt-3 max-w-2xl mx-auto text-sm leading-relaxed">
            Every opportunity is tailored to your region — local funding sources,
            local regulations, costs in your currency. The same specificity for
            a small business in Miami as for one in Montego Bay.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { flag: '🇺🇸', market: 'United States',  detail: 'SBA loans, SBIR grants, Angel investors, Federal programs',       primary: true  },
            { flag: '🌴', market: 'Caribbean',       detail: 'DBJ, JBDC, CDB — costs in JMD, TTD, BBD',                         primary: false },
            { flag: '🌍', market: 'Africa',          detail: 'TEF, BOI, AfDB — costs in NGN, GHS, KES',                         primary: false },
            { flag: '🇬🇧', market: 'UK & Europe',    detail: 'Innovate UK, British Business Bank — GBP costs',                  primary: false },
            { flag: '🌎', market: 'Latin America',   detail: 'IDB, BNDES, iNNpulsa — MXN, BRL, COP costs',                     primary: false },
          ].map(m => (
            <div
              key={m.market}
              className={`p-5 rounded-2xl border text-center transition-all ${m.primary ? 'border-black bg-gray-950 text-white' : 'border-gray-200 hover:border-gray-400 hover:shadow-sm'}`}
            >
              <div className="text-3xl mb-3">{m.flag}</div>
              <h3 className={`text-sm font-semibold mb-2 ${m.primary ? 'text-white' : 'text-gray-900'}`}>{m.market}</h3>
              <p className={`text-xs leading-relaxed ${m.primary ? 'text-gray-400' : 'text-gray-500'}`}>{m.detail}</p>
              {m.primary && (
                <span className="mt-3 inline-block text-xs px-2 py-0.5 bg-white/10 text-gray-300 rounded-full">
                  Primary market
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* VALIDATE */}
      <section className="py-16 px-4 bg-gray-950 text-white">
        <div className="max-w-3xl mx-auto text-center space-y-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Validate mode</p>
          <h2 className="text-3xl font-bold">Already have an idea?</h2>
          <p className="text-gray-400 text-sm leading-relaxed max-w-xl mx-auto">
            Describe your business concept and get a full validation report —
            viability score 0-100, local market conditions, competition analysis,
            available grants, risk factors, and your first 3 moves.
            Specific to your state or country.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {['Viability score 0-100', 'Local policy check', 'Funding sources', 'Risk factors', 'Your first 3 moves'].map(item => (
              <span key={item} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-full border border-white/20 text-xs text-gray-300">
                <span className="text-green-400">✓</span>{item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 px-4 text-center max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-6"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Your next business is in today&apos;s news
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            Join entrepreneurs across the US, Caribbean, Africa, UK and Latin America
            who are turning signals into startups.
          </p>
          {submitted ? (
            <button
              onClick={handleSignIn}
              className="px-8 py-4 bg-black text-white rounded-2xl text-sm font-semibold hover:bg-gray-900 transition-colors"
            >
              Start free →
            </button>
          ) : (
            <form onSubmit={handleWaitlist} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Your email address"
                className="flex-1 px-4 py-3.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3.5 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-900 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Joining...' : 'Get early access'}
              </button>
            </form>
          )}
          <p className="text-xs text-gray-400">Free during beta. No credit card. Unsubscribe anytime.</p>
          <button
            onClick={() => setShowDemo(true)}
            className="block mx-auto text-sm text-gray-500 hover:text-black underline transition-colors"
          >
            Or try a free analysis first →
          </button>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-950 border-t border-gray-800 py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="space-y-2">
              <Logo size="sm" showWordmark showSubbrand theme="dark" />
              <p className="text-xs text-gray-500 leading-relaxed mt-1">
                From signal to startup — built for entrepreneurs everywhere.
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Product</p>
              <div className="flex flex-col gap-1.5">
                <button onClick={handleSignIn} className="text-xs text-gray-500 hover:text-white transition-colors text-left">Sign in</button>
                <a href="/terms" className="text-xs text-gray-500 hover:text-white transition-colors">Terms of Service</a>
                <a href="/privacy" className="text-xs text-gray-500 hover:text-white transition-colors">Privacy Policy</a>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Contact</p>
              <p className="text-xs text-gray-500">hello@entrepaIneur.com</p>
              <p className="text-xs text-gray-600 leading-relaxed mt-3">
                AI-generated content is for informational purposes only and does not
                constitute financial or legal advice.
              </p>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 text-center">
            <p className="text-xs text-gray-600">&copy; 2026 EntrepAIneur. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
