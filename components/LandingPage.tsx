'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { auth, googleProvider, signInWithPopup, db, addDoc, collection } from '@/firebase';
import DemoMode from '@/components/DemoMode';
import Logo from '@/components/Logo';

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
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Sign in failed:', err);
    }
  };

  if (showDemo) {
    return <DemoMode onSignUp={handleSignIn} onBack={() => setShowDemo(false)} />;
  }

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Logo size="sm" showWordmark showSubbrand={false} theme="light" />
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowDemo(true)}
              className="text-sm text-gray-500 hover:text-black transition-colors hidden sm:block"
            >
              Try free demo
            </button>
            <button
              onClick={handleSignIn}
              className="text-sm font-medium text-gray-600 hover:text-black transition-colors"
            >
              Sign in →
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-16 px-4 text-center max-w-4xl mx-auto">

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 text-xs font-medium text-gray-600 mb-8"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          Beta — free to join
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 leading-tight tracking-tight mb-6"
        >
          Stop reading the news.
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-500">
            Start building from it.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg text-gray-500 leading-relaxed max-w-2xl mx-auto mb-4"
        >
          Signal to Startup turns any news story into a business opportunity — with a
          full plan, real costs, and funding sources specific to where you are.
          US, Caribbean, Africa, UK, Latin America.
          Your market. Your language. Your currency.
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="text-sm text-gray-400 mb-10"
        >
          Used by entrepreneurs in Atlanta, Kingston, Lagos, London, and beyond.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="max-w-md mx-auto"
        >
          {submitted ? (
            <div className="p-6 bg-green-50 rounded-2xl border border-green-200 text-center">
              <div className="text-3xl mb-2">🎉</div>
              <p className="text-base font-semibold text-green-800 mb-1">You are on the list</p>
              <p className="text-sm text-green-600">We will be in touch. Want to try right now?</p>
              <button
                onClick={handleSignIn}
                className="mt-4 px-6 py-2.5 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-900 transition-colors"
              >
                Start free →
              </button>
            </div>
          ) : (
            <form onSubmit={handleWaitlist} className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-900 transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {submitting ? 'Joining...' : 'Get early access'}
              </button>
            </form>
          )}
          {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
          {!submitted && (
            <p className="text-xs text-gray-400 mt-3">
              Free during beta. No credit card.{' '}
              <button onClick={handleSignIn} className="underline hover:text-black transition-colors">
                Already have access? Sign in
              </button>
            </p>
          )}
          <div className="mt-4 flex items-center justify-center gap-3">
            <div className="h-px bg-gray-200 flex-1 max-w-16" />
            <span className="text-xs text-gray-400">or</span>
            <div className="h-px bg-gray-200 flex-1 max-w-16" />
          </div>
          <button
            onClick={() => setShowDemo(true)}
            className="w-full sm:w-auto px-8 py-3 border-2 border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:border-black hover:text-black transition-all"
          >
            Try a free analysis — no sign up needed
          </button>
        </motion.div>
      </section>

      {/* STATS */}
      <section className="border-y border-gray-100 py-8 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-10 text-center">
          {[
            { number: '5',   label: 'Markets covered' },
            { number: '59+', label: 'Curated signal sources' },
            { number: '3',   label: 'Agents running daily' },
            { number: '50+', label: 'Countries supported' },
          ].map(stat => (
            <div key={stat.label}>
              <div className="text-2xl font-bold text-gray-900">{stat.number}</div>
              <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* WHY NOT CHATGPT */}
      <section className="py-20 px-4 bg-gray-950 text-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              Why not just use ChatGPT?
            </p>
            <h2 className="text-3xl font-bold mb-4">Four things no other AI tool does</h2>
            <p className="text-gray-400 text-sm max-w-xl mx-auto">
              ChatGPT is great. But it waits for you to ask, gives generic global
              advice, and stops at the idea. Signal to Startup is different in four specific ways.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: '🤖',
                label: '01',
                title: 'It works while you sleep',
                body: 'Your personal agent monitors markets every morning, finds signals matching your profile, analyzes the top opportunities, and has them waiting in your inbox. You open the app and the research is already done. ChatGPT waits for you.',
                highlight: true,
              },
              {
                icon: '📍',
                label: '02',
                title: 'It knows your specific market',
                body: 'A small business owner in Atlanta gets SBA programs and local market context. One in Kingston gets DBJ loans, JMD costs, and references to Portmore market. One in Lagos gets TEF funding and naira pricing. No prompt gets ChatGPT that specific.',
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
                title: 'Signal to startup — not just idea',
                body: 'We do not stop at the idea. Every opportunity comes with a business plan, cost breakdown in your currency, grants you can apply for today, a launch checklist, and your single next move. The goal is an actual business.',
                highlight: true,
              },
            ].map(item => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className={`p-6 rounded-2xl border ${item.highlight ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/10'}`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-xs font-mono text-gray-500">{item.label}</span>
                </div>
                <h3 className="text-base font-semibold text-white mb-3">{item.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{item.body}</p>
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
          {[
            {
              step: '01', icon: '📡', title: 'Signal found',
              body: 'Your agent monitors markets daily and surfaces signals matched to your profile and location.',
              color: 'border-blue-200 bg-blue-50', dark: false,
            },
            {
              step: '02', icon: '⚡', title: 'Opportunities surfaced',
              body: 'AI finds 3 business ideas hidden inside the signal — specific to your region and budget.',
              color: 'border-purple-200 bg-purple-50', dark: false,
            },
            {
              step: '03', icon: '✅', title: 'Idea validated',
              body: 'Score 0-100 with local market conditions, competition, risks, and funding sources.',
              color: 'border-amber-200 bg-amber-50', dark: false,
            },
            {
              step: '04', icon: '📋', title: 'Full plan built',
              body: 'Business plan, cost breakdown in your currency, grants, checklist — everything to move.',
              color: 'border-green-200 bg-green-50', dark: false,
            },
            {
              step: '05', icon: '🚀', title: 'You launch',
              body: 'Your next move is specific and actionable. Not inspiration — a real business.',
              color: 'border-gray-900 bg-gray-900', dark: true,
            },
          ].map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`p-5 rounded-2xl border-2 ${item.color}`}
            >
              <div className="text-2xl mb-3">{item.icon}</div>
              <div className={`text-xs font-mono mb-1 ${item.dark ? 'text-gray-500' : 'text-gray-400'}`}>
                {item.step}
              </div>
              <h3 className={`text-sm font-semibold mb-2 ${item.dark ? 'text-white' : 'text-gray-900'}`}>
                {item.title}
              </h3>
              <p className={`text-xs leading-relaxed ${item.dark ? 'text-gray-400' : 'text-gray-500'}`}>
                {item.body}
              </p>
            </motion.div>
          ))}
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
