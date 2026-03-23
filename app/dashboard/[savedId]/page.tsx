'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft,
  FileText,
  Calculator,
  Coins,
  CheckSquare,
  Users,
  Loader2,
  Copy,
  Check,
  Sparkles,
  ChevronRight,
  Download,
  Share2,
  X
} from 'lucide-react';
import Link from 'next/link';
import Markdown from 'react-markdown';
import { useParams, useRouter } from 'next/navigation';
import {
  auth,
  db,
  onAuthStateChanged,
  doc,
  getDoc,
  FirebaseUser,
  handleFirestoreError,
  OperationType
} from '@/firebase';
import { SavedOpportunity } from '@/components/types';
import { CostEstimator } from '@/components/CostEstimator';
import { GrantFinder } from '@/components/GrantFinder';
import { InvestorMatch } from '@/components/InvestorMatch';
import { Checklist } from '@/components/Checklist';

export default function SavedOpportunityPage() {
  const params = useParams();
  const router = useRouter();
  const savedId = params.savedId as string;

  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [savedOpp, setSavedOpp] = useState<SavedOpportunity & { id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'plan' | 'costs' | 'grants' | 'checklist' | 'investors'>('plan');
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        loadSavedOpportunity(user.uid);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadSavedOpportunity = async (uid: string) => {
    try {
      const docRef = doc(db, 'saved_opportunities', savedId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        setError('Opportunity not found');
        setLoading(false);
        return;
      }

      const data = docSnap.data() as SavedOpportunity;

      if (data.userId !== uid) {
        router.push('/dashboard');
        return;
      }

      setSavedOpp({ id: docSnap.id, ...data });
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `saved_opportunities/${savedId}`);
      setError('Failed to load opportunity');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen-safe bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
          <p className="text-[10px] font-mono uppercase font-bold tracking-widest text-muted">Loading Execution Plan...</p>
        </div>
      </div>
    );
  }

  if (error || !savedOpp) {
    return (
      <div className="min-h-screen-safe bg-background flex items-center justify-center p-6">
        <div className="bg-white border border-border/10 p-12 text-center rounded-[2.5rem] shadow-2xl shadow-black/5 max-w-md w-full">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
            <X className="w-8 h-8" />
          </div>
          <p className="text-lg font-serif italic font-bold mb-6">{error || 'Opportunity not found'}</p>
          <Link
            href="/dashboard"
            className="w-full flex items-center justify-center gap-2 bg-foreground text-background px-6 py-4 rounded-2xl text-[11px] font-mono uppercase tracking-widest font-bold hover:bg-foreground/90 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Pipeline
          </Link>
        </div>
      </div>
    );
  }

  const opp = savedOpp.opportunity;
  const deepDive = savedOpp.deepDive;

  const tabs = [
    { id: 'plan', label: 'Business Plan', icon: FileText },
    { id: 'costs', label: 'Cost Estimator', icon: Calculator },
    { id: 'grants', label: 'Grant Finder', icon: Coins },
    { id: 'checklist', label: 'Checklist', icon: CheckSquare },
    { id: 'investors', label: 'Investor Match', icon: Users },
  ] as const;

  return (
    <div className="min-h-screen-safe bg-background">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-border/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-[10px] font-mono uppercase font-bold text-muted hover:text-foreground transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Pipeline
          </Link>
          <div className="flex items-center gap-4">
            <h1 className="hidden md:block text-lg font-serif italic font-bold tracking-tight">{opp.name}</h1>
            <div className="bg-primary text-white text-[10px] font-mono font-bold px-3 py-1.5 rounded-lg shadow-lg shadow-primary/20">
              SCORE: {Math.round(opp.money_score)}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white border border-border/10 p-8 rounded-3xl shadow-sm space-y-8">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-primary mb-1">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-[9px] font-mono uppercase font-bold tracking-widest">Opportunity Score</span>
                </div>
                <div className="text-4xl font-bold font-serif italic">{Math.round(opp.money_score)}<span className="text-sm font-sans font-normal opacity-30 ml-1">/100</span></div>
              </div>

              <div className="space-y-4 pt-6 border-t border-border/5">
                <p className="text-[10px] font-mono uppercase font-bold tracking-widest text-muted">Strategic Metrics</p>
                {[
                  { label: 'ROI', value: opp.roi_potential, color: 'bg-primary' },
                  { label: 'Urgency', value: opp.urgency, color: 'bg-accent' },
                  { label: 'Local Fit', value: opp.local_fit, color: 'bg-secondary' },
                  { label: 'Gap', value: opp.competition_gap, color: 'bg-primary' },
                  { label: 'Speed', value: opp.speed_to_launch, color: 'bg-secondary' },
                  { label: 'Ease', value: 10 - opp.difficulty, color: 'bg-gray-400' },
                ].map((metric) => (
                  <div key={metric.label} className="space-y-1.5">
                    <div className="flex justify-between items-end">
                      <p className="text-[9px] uppercase font-bold font-mono text-muted leading-none">{metric.label}</p>
                      <p className="text-[9px] font-mono font-bold leading-none">{metric.value}/10</p>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${metric.value * 10}%` }}
                        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                        className={`h-full ${metric.color}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {tabs.map((tab) => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-[10px] font-mono uppercase font-bold tracking-widest transition-all duration-200 ${
                    activeTab === tab.id 
                      ? 'bg-foreground text-background shadow-xl shadow-foreground/10' 
                      : 'bg-white border border-border/10 text-muted hover:text-foreground hover:bg-gray-50'
                  }`}
                >
                  <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-background' : 'text-muted'}`} />
                  {tab.label}
                  {activeTab === tab.id && <ChevronRight className="w-4 h-4 ml-auto opacity-40" />}
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white border border-border/10 rounded-[2.5rem] shadow-sm overflow-hidden min-h-[700px] flex flex-col">
              {/* Content Header */}
              <div className="px-8 py-6 border-b border-border/5 flex items-center justify-between bg-gray-50/30">
                <div className="flex items-center gap-3">
                  {tabs.find(t => t.id === activeTab)?.icon && React.createElement(tabs.find(t => t.id === activeTab)!.icon, { className: "w-5 h-5 text-primary" })}
                  <h2 className="text-sm font-mono uppercase font-bold tracking-widest">{tabs.find(t => t.id === activeTab)?.label}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      let text = "";
                      if (activeTab === 'plan') text = deepDive.business_plan;
                      if (activeTab === 'costs') text = deepDive.cost_breakdown.map(c => `${c.item}: $${c.cost}`).join('\n');
                      if (activeTab === 'grants') text = deepDive.grants.join('\n');
                      if (activeTab === 'checklist') text = deepDive.checklist.join('\n');
                      if (activeTab === 'investors') text = deepDive.investors.map(inv => `${inv.name} (${inv.stage}): ${inv.focus}`).join('\n');
                      copyToClipboard(text, activeTab);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-border/10 rounded-xl text-[10px] font-mono uppercase font-bold hover:bg-gray-50 transition-all shadow-sm"
                  >
                    {copied === activeTab ? (<><Check className="w-3.5 h-3.5 text-secondary" /> Copied</>) : (<><Copy className="w-3.5 h-3.5" /> Copy Text</>)}
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-muted">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Content Body */}
              <div className="p-8 md:p-12 flex-grow">
                <AnimatePresence mode="wait">
                  {activeTab === 'plan' && (
                    <motion.div key="plan" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-10">
                      <div className="bg-foreground text-background p-8 rounded-3xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.05]">
                          <FileText className="w-32 h-32 -mr-8 -mt-8" />
                        </div>
                        <div className="relative z-10 space-y-3">
                          <h3 className="text-[10px] font-mono uppercase tracking-widest opacity-40 font-bold">Executive Summary</h3>
                          <p className="font-serif italic text-xl md:text-2xl leading-relaxed">{opp.description}</p>
                        </div>
                      </div>
                      <div className="prose prose-slate prose-headings:font-serif prose-headings:italic prose-headings:tracking-tight prose-p:leading-relaxed prose-p:text-gray-600 max-w-none">
                        <Markdown>{deepDive.business_plan}</Markdown>
                      </div>
                    </motion.div>
                  )}
                  {activeTab === 'costs' && (
                    <motion.div key="costs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                      <CostEstimator deepDiveResult={deepDive} />
                    </motion.div>
                  )}
                  {activeTab === 'grants' && (
                    <motion.div key="grants" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                      <GrantFinder deepDiveResult={deepDive} selectedMode="global" />
                    </motion.div>
                  )}
                  {activeTab === 'checklist' && (
                    <motion.div key="checklist" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                      <Checklist deepDiveResult={deepDive} savedDocId={savedOpp.id} />
                    </motion.div>
                  )}
                  {activeTab === 'investors' && (
                    <motion.div key="investors" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                      <InvestorMatch deepDiveResult={deepDive} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
