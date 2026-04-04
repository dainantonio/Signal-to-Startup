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
          From signal to startup —
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-500">
            we build the roadmap
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg text-gray-500 leading-relaxed max-w-2xl mx-auto mb-4"
        >
          Every day the news reveals business opportunities that most people miss.
          Signal to Startup finds them, analyzes them for your market, and gives you a
          complete plan to act — in your language, in your currency, with funding sources
          you can actually apply for.
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="text-sm text-gray-400 mb-10 max-w-xl mx-auto"
        >
          Built for entrepreneurs in Jamaica, Nigeria, Colombia, the UK, and beyond —
          not Silicon Valley.
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
              <p className="text-sm text-green-600">
                We will be in touch soon. Want to try right now?
              </p>
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
              <button
                onClick={handleSignIn}
                className="underline hover:text-black transition-colors"
              >
                Already signed up? Sign in
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

      {/* WHAT MAKES THIS DIFFERENT */}
      <section className="py-16 px-4 bg-gray-950 text-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              Why not just use ChatGPT?
            </p>
            <h2 className="text-3xl font-bold">This is built different</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: '🤖',
                title: 'The agent works while you sleep',
                description: 'ChatGPT waits for you to ask. Signal to Startup monitors markets daily, finds signals that match your profile, analyzes the top opportunities, and delivers them to your inbox — before you wake up. You open the app and your research is already done.',
                highlight: true,
              },
              {
                icon: '🇯🇲',
                title: 'It knows your market',
                description: 'Generic AI gives generic advice. We tell a Kingston entrepreneur that their startup costs J$157,000, that DBJ has a loan they qualify for, and that their first customers are market vendors in Portmore. No prompt engineering gets ChatGPT there.',
                highlight: false,
              },
              {
                icon: '🔗',
                title: 'Compound signal analysis',
                description: 'Select multiple news articles and find the opportunity hiding at their intersection. JPS raises electricity rates + Caribbean solar adoption up 40% + DBJ green energy loans = strong compound signal. No other tool does this.',
                highlight: false,
              },
              {
                icon: '🚀',
                title: 'Signal to startup — not just signal to idea',
                description: 'Other tools stop at the idea. We give you the business plan, cost breakdown in your currency, grants you can apply for today, and a step-by-step launch checklist. The goal is an actual business, not an inspiration.',
                highlight: true,
              },
            ].map((item) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className={`p-6 rounded-2xl border ${item.highlight ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/10'}`}
              >
                <div className="text-3xl mb-4">{item.icon}</div>
                <h3 className="text-base font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* THE JOURNEY — FROM SIGNAL TO STARTUP */}
      <section className="py-20 px-4 max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            The journey
          </p>
          <h2 className="text-3xl font-bold text-gray-900">
            From news story to open for business
          </h2>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto text-sm leading-relaxed">
            Most people read the news and see information. We train you to see
            opportunity — and then walk you all the way through.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
          {[
            {
              step: '01',
              icon: '📡',
              title: 'Signal discovered',
              description: 'Your agent monitors news daily and finds signals matching your market and interests.',
              dark: false,
              color: 'bg-blue-50 border-blue-200',
            },
            {
              step: '02',
              icon: '⚡',
              title: 'Opportunity found',
              description: 'AI analyzes the signal and surfaces 3 business opportunities specific to your region.',
              dark: false,
              color: 'bg-purple-50 border-purple-200',
            },
            {
              step: '03',
              icon: '✅',
              title: 'Idea validated',
              description: 'Get a viability score 0-100 with local market conditions, risks, and funding sources.',
              dark: false,
              color: 'bg-amber-50 border-amber-200',
            },
            {
              step: '04',
              icon: '📋',
              title: 'Plan generated',
              description: 'Full business plan, cost breakdown in your currency, grants, and launch checklist.',
              dark: false,
              color: 'bg-green-50 border-green-200',
            },
            {
              step: '05',
              icon: '🚀',
              title: 'You launch',
              description: 'Your next move is specific and actionable. From signal to startup — not just inspiration.',
              dark: true,
              color: 'bg-gray-900 border-gray-900',
            },
          ].map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative p-5 rounded-2xl border-2 ${item.color}`}
            >
              <div className="text-2xl mb-3">{item.icon}</div>
              <div className="text-xs font-mono text-gray-400 mb-1">{item.step}</div>
              <h3 className={`text-sm font-semibold mb-2 ${item.dark ? 'text-white' : 'text-gray-900'}`}>
                {item.title}
              </h3>
              <p className={`text-xs leading-relaxed ${item.dark ? 'text-gray-400' : 'text-gray-500'}`}>
                {item.description}
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

      {/* WHO THIS IS FOR */}
      <section className="py-20 px-4 bg-gray-50 border-y border-gray-200">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              Who this is for
            </p>
            <h2 className="text-3xl font-bold text-gray-900">
              Built for the entrepreneur every other tool ignores
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                emoji: '🏪',
                name: 'The market vendor',
                location: 'Kingston, Jamaica',
                story: 'Smart, hardworking, full of ideas — but no business plan, no roadmap, no one to explain what DBJ actually offers. Signal to Startup is their business advisor.',
                level: 'Simple mode',
              },
              {
                emoji: '💼',
                name: 'The diaspora founder',
                location: 'London, UK',
                story: 'Caribbean or African roots, professional job, wants to build something back home or in their community. Needs local market intelligence, not generic startup advice.',
                level: 'Standard mode',
              },
              {
                emoji: '🚀',
                name: 'The growth founder',
                location: 'Lagos, Nigeria',
                story: 'Building a real company, looking for a competitive edge. Wants compound signal analysis, investor matching, and market intelligence that ChatGPT cannot replicate.',
                level: 'Advanced mode',
              },
            ].map((person) => (
              <motion.div
                key={person.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="p-6 bg-white rounded-2xl border border-gray-200 hover:shadow-md transition-all"
              >
                <div className="text-4xl mb-4">{person.emoji}</div>
                <div className="mb-3">
                  <p className="text-sm font-semibold text-gray-900">{person.name}</p>
                  <p className="text-xs text-gray-400">{person.location}</p>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">{person.story}</p>
                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full font-medium">
                  {person.level}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* MARKET MODES */}
      <section className="py-20 px-4 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Your market
          </p>
          <h2 className="text-3xl font-bold text-gray-900">Hyperlocal intelligence</h2>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto text-sm leading-relaxed">
            Every opportunity is tailored to your region — local funding, local
            regulations, local costs in your currency.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { flag: '🌐', market: 'Global / US',   detail: 'SBA, Angel investors, Federal grants' },
            { flag: '🌴', market: 'Caribbean',     detail: 'DBJ, JBDC, CDB — JMD, TTD, BBD' },
            { flag: '🌍', market: 'Africa',        detail: 'TEF, BOI, AfDB — NGN, GHS, KES' },
            { flag: '🇬🇧', market: 'UK & Europe',  detail: 'Innovate UK, British Business Bank' },
            { flag: '🌎', market: 'Latin America', detail: 'IDB, BNDES, iNNpulsa — MXN, BRL, COP' },
          ].map((m) => (
            <div
              key={m.market}
              className="p-5 rounded-2xl border border-gray-200 text-center hover:border-gray-400 hover:shadow-sm transition-all"
            >
              <div className="text-3xl mb-3">{m.flag}</div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">{m.market}</h3>
              <p className="text-xs text-gray-400 leading-relaxed">{m.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* READING LEVELS */}
      <section className="py-16 px-4 bg-gray-950 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Meets you where you are
          </p>
          <h2 className="text-3xl font-bold mb-4">Not too much. Not too little.</h2>
          <p className="text-gray-400 text-sm max-w-xl mx-auto mb-10 leading-relaxed">
            Choose how you want opportunities explained. Change it anytime.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            {[
              {
                icon: '🗣',
                level: 'Simple',
                title: 'Talk to me like a friend',
                points: [
                  'Plain language, no jargon',
                  'One business idea at a time',
                  'Your single next move today',
                  'Costs in your local currency',
                ],
                tag: 'For first-time entrepreneurs',
                featured: false,
              },
              {
                icon: '📊',
                level: 'Standard',
                title: 'Give me the full picture',
                points: [
                  'Full market analysis',
                  'Three ranked opportunities',
                  'Funding sources and grants',
                  'Complete execution suite',
                ],
                tag: 'For growing entrepreneurs',
                featured: true,
              },
              {
                icon: '🚀',
                level: 'Advanced',
                title: 'Deep details only',
                points: [
                  'Investor-ready language',
                  'Competitive analysis',
                  'Compound signal analysis',
                  'Market sizing and metrics',
                ],
                tag: 'For experienced founders',
                featured: false,
              },
            ].map((item) => (
              <div
                key={item.level}
                className={`p-6 rounded-2xl border ${item.featured ? 'bg-white text-gray-900 border-white' : 'bg-white/5 border-white/10'}`}
              >
                <div className="text-2xl mb-3">{item.icon}</div>
                <div className={`text-xs font-mono mb-1 ${item.featured ? 'text-gray-400' : 'text-gray-500'}`}>
                  {item.level}
                </div>
                <h3 className={`text-sm font-semibold mb-4 ${item.featured ? 'text-gray-900' : 'text-white'}`}>
                  {item.title}
                </h3>
                <ul className="space-y-2 mb-4">
                  {item.points.map(p => (
                    <li key={p} className={`text-xs flex items-start gap-2 ${item.featured ? 'text-gray-600' : 'text-gray-400'}`}>
                      <span className="text-green-500 flex-shrink-0 mt-0.5">✓</span>
                      {p}
                    </li>
                  ))}
                </ul>
                <span className={`text-xs px-2 py-1 rounded-full ${item.featured ? 'bg-gray-100 text-gray-600' : 'bg-white/10 text-gray-400'}`}>
                  {item.tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AGENT SECTION */}
      <section className="py-20 px-4 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              The agent
            </p>
            <h2 className="text-3xl font-bold text-gray-900">It works while you sleep</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              Every morning your personal Signal Monitor scans the news, finds
              opportunities matched to your profile, and has them analyzed before
              you open the app. Your digest arrives by 9am.
            </p>
            <p className="text-gray-500 text-sm leading-relaxed">
              This is the difference between a tool you have to use and an
              assistant working for you.
            </p>
          </div>
          <div className="space-y-3">
            {[
              {
                time: '7:00 AM',
                icon: '📡',
                action: 'Signal Monitor runs',
                detail: 'Scans your market for new signals',
                color: 'bg-blue-50 border-blue-200',
              },
              {
                time: '8:00 AM',
                icon: '🔍',
                action: 'Scout analyzes top signals',
                detail: 'Full Gemini analysis — pre-built for you',
                color: 'bg-purple-50 border-purple-200',
              },
              {
                time: '9:00 AM',
                icon: '📧',
                action: 'Digest delivered',
                detail: 'Opportunities in your inbox, ready to act',
                color: 'bg-green-50 border-green-200',
              },
              {
                time: 'All day',
                icon: '🔔',
                action: 'You get notified',
                detail: 'High-score signals alert you instantly',
                color: 'bg-amber-50 border-amber-200',
              },
            ].map(item => (
              <div key={item.time} className={`flex items-center gap-4 p-4 rounded-xl border ${item.color}`}>
                <div className="text-xl flex-shrink-0">{item.icon}</div>
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

      {/* VALIDATE SECTION */}
      <section className="py-16 px-4 bg-gray-50 border-y border-gray-200">
        <div className="max-w-3xl mx-auto text-center space-y-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            Validate mode
          </p>
          <h2 className="text-3xl font-bold text-gray-900">Already have an idea?</h2>
          <p className="text-gray-500 text-sm leading-relaxed max-w-xl mx-auto">
            Describe your business concept and get a full validation report —
            viability score 0-100, local market conditions, available grants,
            risk factors, and your first 3 moves. Specific to your country.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {[
              'Viability score 0-100',
              'Local policy check',
              'Funding sources',
              'Risk assessment',
              'Your first 3 moves',
            ].map(item => (
              <span
                key={item}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full border border-gray-200 text-xs text-gray-600"
              >
                <span className="text-green-500">✓</span>
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="border-b border-gray-100 py-8 px-4 bg-white">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-10 text-center">
          {[
            { number: '5',   label: 'Global markets' },
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
            Join entrepreneurs across the Caribbean, Africa, UK and US who
            are turning signals into startups.
          </p>
          {submitted ? (
            <button
              onClick={handleSignIn}
              className="px-8 py-4 bg-black text-white rounded-2xl text-sm font-semibold hover:bg-gray-900 transition-colors"
            >
              Start free →
            </button>
          ) : (
            <form
              onSubmit={handleWaitlist}
              className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto"
            >
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
          <p className="text-xs text-gray-400">
            Free during beta. No credit card. Unsubscribe anytime.
          </p>
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
                From signal to startup — powered by AI, built for entrepreneurs everywhere.
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Product</p>
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={handleSignIn}
                  className="text-xs text-gray-500 hover:text-white transition-colors text-left"
                >
                  Sign in
                </button>
                <a href="/terms" className="text-xs text-gray-500 hover:text-white transition-colors">
                  Terms of Service
                </a>
                <a href="/privacy" className="text-xs text-gray-500 hover:text-white transition-colors">
                  Privacy Policy
                </a>
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
