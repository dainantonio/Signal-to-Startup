'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { auth, googleProvider, signInWithPopup, db, addDoc, collection } from '@/firebase';
import DemoMode from '@/components/DemoMode';

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showDemo, setShowDemo] = useState(false);

  const handleWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
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
      setSubmitted(true);
    } catch {
      // Fallback to localStorage
      try {
        const existing = JSON.parse(localStorage.getItem('waitlist') || '[]');
        existing.push({ email, joinedAt: new Date().toISOString() });
        localStorage.setItem('waitlist', JSON.stringify(existing));
      } catch { /* ignore */ }
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
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
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">S</span>
            </div>
            <span className="text-sm font-semibold">Signal to Startup</span>
            <span className="text-xs text-gray-400 hidden sm:block">by EntrepAIneur</span>
          </div>
          <button
            onClick={handleSignIn}
            className="text-sm font-medium text-gray-600 hover:text-black transition-colors"
          >
            Sign in →
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-20 px-4 text-center max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 text-xs font-medium text-gray-600 mb-8"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          Now in beta — join the waitlist
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 leading-tight tracking-tight mb-6"
        >
          Turn any news story into
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-500">
            your next business
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg text-gray-500 leading-relaxed max-w-2xl mx-auto mb-10"
        >
          Signal to Startup reads the news so you do not have to. Every article is a market
          signal. We find the hidden business opportunity inside it — with a full execution
          plan, under $2,000 to start.
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
                We will email you when full access opens. In the meantime —
              </p>
              <button
                onClick={handleSignIn}
                className="mt-4 px-6 py-2.5 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-900 transition-colors"
              >
                Try the beta now →
              </button>
            </div>
          ) : (
            <form onSubmit={handleWaitlist} className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-900 transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {submitting ? 'Joining...' : 'Join waitlist'}
              </button>
            </form>
          )}
          {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
          {!submitted && (
            <p className="text-xs text-gray-400 mt-3">
              Free to join. No credit card required.{' '}
              <button
                onClick={handleSignIn}
                className="underline hover:text-black transition-colors"
              >
                Already have access? Sign in
              </button>
            </p>
          )}

          {/* Demo CTA */}
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

      {/* SOCIAL PROOF BAR */}
      <section className="border-y border-gray-100 py-6 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-8 text-center">
          {[
            { number: '4', label: 'Markets covered' },
            { number: '$2K', label: 'Max startup cost' },
            { number: '30+', label: 'Live signals daily' },
            { number: '50+', label: 'Countries supported' },
          ].map(stat => (
            <div key={stat.label}>
              <div className="text-2xl font-bold text-gray-900">{stat.number}</div>
              <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 px-4 max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            How it works
          </p>
          <h2 className="text-3xl font-bold text-gray-900">From signal to launch in minutes</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: '01',
              icon: '📡',
              title: 'Read a signal',
              description:
                'Browse our live feed of curated business signals from global and local news sources. Or paste any article URL directly.',
            },
            {
              step: '02',
              icon: '⚡',
              title: 'AI finds the opportunity',
              description:
                'Our AI analyzes the signal and surfaces 3 actionable business opportunities hidden inside it — all startable for under $2,000.',
            },
            {
              step: '03',
              icon: '🚀',
              title: 'Get your execution plan',
              description:
                'Every opportunity comes with a full business plan, cost breakdown, grant eligibility check, and step-by-step launch guide.',
            },
          ].map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative p-6 rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-sm transition-all"
            >
              <div className="text-3xl mb-4">{item.icon}</div>
              <div className="text-xs font-mono text-gray-400 mb-2">{item.step}</div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{item.description}</p>
            </motion.div>
          ))}
        </div>
        <div className="text-center mt-10">
          <button
            onClick={() => setShowDemo(true)}
            className="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:border-black hover:text-black transition-all"
          >
            See it work → Try a free analysis
          </button>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20 px-4 bg-gray-950 text-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              Built for real entrepreneurs
            </p>
            <h2 className="text-3xl font-bold">Everything you need to move fast</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: '📰',
                title: 'Live signal feed',
                description:
                  'Curated news from 25+ sources across Tech, Policy, Markets, Funding, Health and more. Updated daily.',
              },
              {
                icon: '💡',
                title: 'Validate your idea',
                description:
                  'Already have a business idea? Get it validated against real market conditions and local policy in your country.',
              },
              {
                icon: '🌍',
                title: 'Built for your market',
                description:
                  'Caribbean, Africa, UK, US — every opportunity is tailored to your region with local grants and funding sources.',
              },
              {
                icon: '📋',
                title: 'Execution suite',
                description:
                  'Every opportunity comes with a full business plan, investor matches, grant finder, and launch checklist.',
              },
              {
                icon: '💰',
                title: 'Under $2,000 to start',
                description:
                  'Every idea is scored for startup cost, speed to launch, and ROI potential. No big capital required.',
              },
              {
                icon: '📱',
                title: 'Share any article',
                description:
                  'See a news story anywhere on the web? Share it directly to the app from your phone and analyze it instantly.',
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="p-5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/[0.08] transition-all"
              >
                <div className="text-2xl mb-3">{feature.icon}</div>
                <h3 className="text-sm font-semibold text-white mb-1.5">{feature.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* MARKET MODES */}
      <section className="py-20 px-4 max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Your market. Your opportunities.
          </p>
          <h2 className="text-3xl font-bold text-gray-900">Hyperlocal intelligence</h2>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto text-sm leading-relaxed">
            Switch between markets and get opportunities tailored to your region — with local
            funding sources, regulations, and customer context.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            {
              flag: '🌐',
              market: 'Global / US',
              countries: 'United States, Canada, Australia and worldwide',
              funding: 'SBA, Angel investors, Federal grants',
            },
            {
              flag: '🌴',
              market: 'Caribbean',
              countries: 'Jamaica, Trinidad, Barbados, Guyana',
              funding: 'DBJ, JBDC, CDB, IDB',
            },
            {
              flag: '🌍',
              market: 'Africa',
              countries: 'Nigeria, Ghana, Kenya, Rwanda',
              funding: 'TEF, BOI, AfDB, Mastercard Foundation',
            },
            {
              flag: '🇬🇧',
              market: 'UK & Europe',
              countries: 'United Kingdom and EU markets',
              funding: 'Innovate UK, British Business Bank',
            },
            {
              flag: '🌎',
              market: 'Latin America',
              countries: 'Mexico, Brazil, Colombia, Chile, Argentina',
              funding: 'IDB, BNDES, iNNpulsa, CORFO',
            },
          ].map((m, i) => (
            <motion.div
              key={m.market}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-5 rounded-2xl border border-gray-200 hover:border-gray-400 hover:shadow-sm transition-all text-center"
            >
              <div className="text-3xl mb-3">{m.flag}</div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">{m.market}</h3>
              <p className="text-xs text-gray-500 mb-3 leading-relaxed">{m.countries}</p>
              <p className="text-xs text-gray-400 leading-relaxed">{m.funding}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* VALIDATE CALLOUT */}
      <section className="py-16 px-4 bg-gray-50 border-y border-gray-200">
        <div className="max-w-3xl mx-auto text-center space-y-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            New feature
          </p>
          <h2 className="text-3xl font-bold text-gray-900">Already have an idea?</h2>
          <p className="text-gray-500 text-sm leading-relaxed max-w-xl mx-auto">
            Describe your business concept and get a full validation report — complete with
            local market conditions, relevant policies, available grants, and a viability
            score from 0 to 100. Specific to your country.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {[
              'Validation score 0-100',
              'Local policy check',
              'Funding sources',
              'Risk assessment',
              'First 3 action steps',
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
            Join entrepreneurs across the Caribbean, Africa, UK and US who are using Signal
            to Startup to find and launch their next venture.
          </p>

          {submitted ? (
            <button
              onClick={handleSignIn}
              className="px-8 py-4 bg-black text-white rounded-2xl text-sm font-semibold hover:bg-gray-900 transition-colors"
            >
              Try the beta now →
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
                {submitting ? 'Joining...' : 'Join waitlist'}
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
              <p className="text-sm font-semibold text-white">Signal to Startup</p>
              <p className="text-xs text-gray-400">by EntrepAIneur</p>
              <p className="text-xs text-gray-500 leading-relaxed mt-1">
                Turn market signals into startup opportunities — powered by AI.
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Product
              </p>
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={handleSignIn}
                  className="text-xs text-gray-500 hover:text-white transition-colors text-left"
                >
                  Sign in
                </button>
                <a
                  href="/terms"
                  className="text-xs text-gray-500 hover:text-white transition-colors"
                >
                  Terms of Service
                </a>
                <a
                  href="/privacy"
                  className="text-xs text-gray-500 hover:text-white transition-colors"
                >
                  Privacy Policy
                </a>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Contact
              </p>
              <p className="text-xs text-gray-500">hello@entrepaIneur.com</p>
              <p className="text-xs text-gray-600 leading-relaxed mt-3">
                AI-generated content is for informational purposes only and does not
                constitute financial or legal advice.
              </p>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 text-center">
            <p className="text-xs text-gray-600">
              &copy; 2026 EntrepAIneur. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
