'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'motion/react';
import { db, doc, getDoc, collection, addDoc } from '@/firebase';
import { SavedOpportunity, LandingPageData } from '@/components/types';
import { Target, Zap, Shield, TrendingUp, Heart, Anchor, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function LaunchpadPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<LandingPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !id) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'opportunity_leads'), {
        opportunityId: id,
        email: email,
        createdAt: new Date().toISOString()
      });
      setSubscribed(true);
      setEmail('');
    } catch (err) {
      console.error('Failed to save lead:', err);
      alert('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Tailwind JIT Safelist Hack for dynamic color injection
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const TAILWIND_SAFELIST = "bg-blue-500 bg-emerald-500 bg-indigo-500 bg-rose-500 bg-amber-500 bg-purple-500 bg-slate-500 hover:bg-blue-600 hover:bg-emerald-600 hover:bg-indigo-600 hover:bg-rose-600 hover:bg-amber-600 hover:bg-purple-600 hover:bg-slate-600 text-blue-500 text-emerald-500 text-indigo-500 text-rose-500 text-amber-500 text-purple-500 text-slate-500 text-blue-600 text-emerald-600 text-indigo-600 text-rose-600 text-amber-600 text-purple-600 text-slate-600 bg-blue-500/10 bg-emerald-500/10 bg-indigo-500/10 bg-rose-500/10 bg-amber-500/10 bg-purple-500/10 bg-slate-500/10 ring-blue-500/20 ring-emerald-500/20 ring-indigo-500/20 ring-rose-500/20 ring-amber-500/20 ring-purple-500/20 ring-slate-500/20 shadow-blue-500/25 shadow-emerald-500/25 shadow-indigo-500/25 shadow-rose-500/25 shadow-amber-500/25 shadow-purple-500/25 shadow-slate-500/25 shadow-blue-500/20 shadow-emerald-500/20 shadow-indigo-500/20 shadow-rose-500/20 shadow-amber-500/20 shadow-purple-500/20 shadow-slate-500/20 bg-blue-500/20 bg-emerald-500/20 bg-indigo-500/20 bg-rose-500/20 bg-amber-500/20 bg-purple-500/20 bg-slate-500/20 selection:bg-blue-500/30 selection:bg-emerald-500/30 selection:bg-indigo-500/30 selection:bg-rose-500/30 selection:bg-amber-500/30 selection:bg-purple-500/30 selection:bg-slate-500/30";

  useEffect(() => {
    const fetchLandingPage = async () => {
      try {
        const docRef = doc(db, 'saved_opportunities', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const loaded = docSnap.data() as SavedOpportunity;
          if (loaded.landingPage) {
            setData(loaded.landingPage);
          } else {
            setError("This startup hasn't generated their launchpad yet.");
          }
        } else {
          setError("Startup not found.");
        }
      } catch {
        setError("Failed to load landing page.");
      } finally {
        setLoading(false);
      }
    };
    fetchLandingPage();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">404 - Not Found</h1>
        <p className="text-gray-500">{error || "Something went wrong."}</p>
        <Link href="/" className="mt-8 text-indigo-500 font-medium hover:underline">
          Return to Signal to Startup
        </Link>
      </div>
    );
  }

  // Map generic icon strings to Lucide components
  const renderIcon = (iconName: string, className: string) => {
    const Match = {
      'Zap': Zap,
      'Shield': Shield,
      'TrendingUp': TrendingUp,
      'Target': Target,
      'Heart': Heart,
      'Anchor': Anchor,
    }[iconName] || CheckCircle2;
    return <Match className={className} />;
  };

  // Tailwind dynamic color generation safely mapped
  // Note: Since Tailwind purges unused dynamic classes, we map the most common ones explicitly, 
  // or rely on inline styles for absolute dynamic safety. For ease, we use standard tailwind mappings here.
  const color = data.color_theme.primary || 'indigo';
  const isDark = data.color_theme.background === 'dark';

  const themeClasses = {
    bg: isDark ? 'bg-gray-950' : 'bg-slate-50',
    text: isDark ? 'text-white' : 'text-slate-900',
    textMuted: isDark ? 'text-gray-400' : 'text-slate-600',
    card: isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200',
  };

  return (
    <div className={`min-h-screen ${themeClasses.bg} ${themeClasses.text} font-sans selection:bg-${color}-500/30`}>
      {/* Header */}
      <header className={`border-b ${isDark ? 'border-white/5' : 'border-black/5'} pt-6 pb-4 px-6 md:px-12 flex justify-between items-center`}>
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg bg-${color}-500 flex items-center justify-center text-white font-bold`}>
            {data.hero_headline.charAt(0)}
          </div>
          <span className="font-bold tracking-tight">{data.hero_headline.split(' ')[0]} HQ</span>
        </div>
        <button onClick={() => document.getElementById('waitlist-form')?.scrollIntoView({ behavior: 'smooth' })} className={`px-4 py-2 bg-${color}-500 hover:bg-${color}-600 text-white text-sm font-semibold rounded-full transition-all shadow-lg shadow-${color}-500/20`}>
          Join Waitlist
        </button>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-32 md:pt-32 md:pb-40 text-center relative overflow-hidden">
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-${color}-400/20 rounded-full blur-[120px] pointer-events-none`} />
        
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="relative z-10 flex flex-col items-center">
          <span className={`inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-${color}-500/10 text-${color}-600 text-[11px] font-bold mb-8 ring-1 ring-${color}-500/20 uppercase tracking-[0.2em]`}>
            <span className={`w-2 h-2 rounded-full bg-${color}-500 animate-pulse`} />
            {data.target_audience_pain}
          </span>
          <h1 className={`text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[1.1] max-w-4xl text-balance ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {data.hero_headline}
          </h1>
          <p className={`text-xl md:text-2xl ${themeClasses.textMuted} max-w-2xl mx-auto mb-12 leading-relaxed text-balance font-medium`}>
            {data.hero_subheadline}
          </p>
          <div id="waitlist-form" className="flex flex-col items-center justify-center gap-4 max-w-md mx-auto">
            {subscribed ? (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`bg-${color}-500/10 text-${color}-600 border border-${color}-500/20 px-6 py-4 rounded-2xl flex items-center gap-3 font-semibold`}>
                <CheckCircle2 className="w-5 h-5" /> You're on the list! We'll be in touch.
              </motion.div>
            ) : (
              <form onSubmit={handleSubscribe} className={`w-full flex p-1.5 bg-white border border-slate-200 rounded-full shadow-xl shadow-${color}-500/10 relative z-20`}>
                <input 
                  type="email" 
                  required
                  placeholder="Enter your email to join the waitlist" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="flex-grow px-4 bg-transparent outline-none text-slate-800 placeholder:text-slate-400 min-w-0"
                />
                <button type="submit" disabled={submitting} className={`px-6 py-3 bg-${color}-500 hover:bg-${color}-600 text-white rounded-full font-bold transition-transform hover:scale-105 shadow-md flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50`}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : data.cta_text} 
                  {!submitting && <ArrowRight className="w-4 h-4" />}
                </button>
              </form>
            )}
          </div>

          {/* Glowing Hero Icon Graphic instead of broken-looking wireframe */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="mt-20 w-fit mx-auto relative group"
          >
            <div className={`absolute -inset-10 bg-gradient-to-r from-${color}-500/20 to-${color}-600/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 pointer-events-none`} />
            <div className={`relative w-40 h-40 md:w-56 md:h-56 rounded-full border border-${color}-500/20 bg-${color}-500/5 backdrop-blur-3xl flex items-center justify-center shadow-2xl shadow-${color}-500/10`}>
              <div className={`absolute inset-0 rounded-full bg-gradient-to-tr from-${color}-500/10 to-transparent`} />
              {renderIcon(data.value_proposition[0]?.icon_name || 'Zap', `w-16 h-16 md:w-24 md:h-24 text-${color}-500 relative z-10 opacity-80 group-hover:scale-110 transition-transform duration-500`)}
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Value Prop (Features) Section */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-b border-black/5">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{data.solution_statement}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {data.value_proposition.map((feature, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              className={`p-10 rounded-[2.5rem] border ${themeClasses.card} shadow-lg shadow-black/5 hover:-translate-y-2 transition-transform duration-300 relative overflow-hidden group`}
            >
              <div className={`absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-5 transform translate-x-4 -translate-y-4 transition-all duration-500 pointer-events-none`}>
                {renderIcon(feature.icon_name, `w-32 h-32 text-${color}-500`)}
              </div>
              <div className={`w-14 h-14 rounded-2xl bg-${color}-500/10 flex items-center justify-center mb-8 ring-1 ring-${color}-500/20`}>
                {renderIcon(feature.icon_name, `w-6 h-6 text-${color}-500`)}
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.feature_title}</h3>
              <p className={`${themeClasses.textMuted} leading-relaxed`}>{feature.feature_description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      {data.pricing_suggestion && data.pricing_suggestion.length > 0 && (
        <section className="max-w-5xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, transparent pricing</h2>
            <p className={`${themeClasses.textMuted} text-lg`}>Invest in your future with plans that scale with you.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 justify-center relative z-10">
            {data.pricing_suggestion.map((tier, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15 }}
                className={`p-10 rounded-[2.5rem] border ${idx === 1 ? `border-${color}-400 shadow-2xl shadow-${color}-400/20 relative scale-105 z-10 bg-white` : `${themeClasses.card} shadow-sm`} flex flex-col`}
              >
                {idx === 1 && (
                  <div className={`absolute top-0 inset-x-0 h-2 bg-${color}-500 rounded-t-[2.5rem]`} />
                )}
                {idx === 1 && (
                  <span className={`absolute top-4 right-6 bg-${color}-100 text-${color}-700 text-[10px] font-bold uppercase tracking-widest py-1 px-3 rounded-full ring-1 ring-${color}-500/20`}>Most Popular</span>
                )}
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4">{tier.tier_name}</h3>
                <div className="flex items-baseline gap-2 mb-8">
                  <span className="text-5xl font-black tracking-tighter">{tier.price}</span>
                </div>
                <ul className="space-y-5 mb-10 flex-grow">
                  {tier.perks.map((perk, i) => (
                    <li key={i} className="flex gap-4">
                      <div className={`w-6 h-6 rounded-full bg-${color}-500/10 flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <CheckCircle2 className={`w-3.5 h-3.5 text-${color}-600`} />
                      </div>
                      <span className={`${themeClasses.textMuted} font-medium leading-relaxed`}>{perk}</span>
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-4 rounded-xl font-bold text-sm uppercase tracking-wider ${
                  idx === 1 
                    ? `bg-${color}-500 text-white hover:bg-${color}-600 shadow-xl shadow-${color}-500/20 hover:-translate-y-1` 
                    : `bg-slate-100 text-slate-900 hover:bg-slate-200`
                } transition-all duration-300`}>
                  Get Started
                </button>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className={`border-t ${isDark ? 'border-white/5' : 'border-black/5'} py-12 text-center`}>
        <p className={`${themeClasses.textMuted} text-sm font-medium`}>
          Built with Signal to Startup. © {new Date().getFullYear()} {data.hero_headline.split(' ')[0]} HQ.
        </p>
      </footer>
    </div>
  );
}
