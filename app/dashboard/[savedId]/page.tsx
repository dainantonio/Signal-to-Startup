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
  Check
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
import { marketModeConfigs } from '@/components/MarketModeSelector';

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

  // Auth listener
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

      // Verify ownership
      if (data.userId !== uid) {
        router.push('/dashboard');
        return;
      }

      setSavedOpp({ id: docSnap.id, ...data });
    } catch (err) {
      handleFirestoreError(err, OperationType.READ, `saved_opportunities/${savedId}`);
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
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin opacity-30" />
          <p className="text-[10px] font-mono uppercase opacity-50">Loading execution plan...</p>
        </div>
      </div>
    );
  }

  if (error || !savedOpp) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center p-4">
        <div className="bg-white border-2 border-[#141414] p-8 text-center shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]">
          <p className="text-sm font-serif italic mb-4">{error || 'Opportunity not found'}</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-[#141414] text-[#E4E3E0] px-4 py-2 text-[10px] font-mono uppercase tracking-widest hover:bg-black transition-all"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to Pipeline
          </Link>
        </div>
      </div>
    );
  }

  const opp = savedOpp.opportunity;
  const deepDive = savedOpp.deepDive;

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b-2 border-[#141414] shadow-[0px_4px_0px_0px_rgba(20,20,20,0.1)]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-[10px] font-mono uppercase hover:opacity-60 transition-opacity">
            <ArrowLeft className="w-4 h-4" />
            Back to Pipeline
          </Link>
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-serif italic font-bold">{opp.name}</h1>
            <div className="bg-[#141414] text-[#E4E3E0] text-sm font-mono px-3 py-1 rounded">
              {Math.round(opp.money_score)}/100
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          {/* Sidebar Tabs */}
          <div className="lg:col-span-1 space-y-3">
            <div className="bg-white border-2 border-[#141414] p-4 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
              <div className="text-[10px] font-mono uppercase opacity-50 mb-2">Opportunity Score</div>
              <div className="text-3xl font-bold font-serif italic mb-4">{Math.round(opp.money_score)}/100</div>
              
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <p className="text-[10px] font-mono uppercase font-bold tracking-widest mb-2">Detailed Metrics</p>
                {[
                  { label: 'ROI', value: opp.roi_potential },
                  { label: 'Urgency', value: opp.urgency },
                  { label: 'Local Fit', value: opp.local_fit },
                  { label: 'Gap', value: opp.competition_gap },
                  { label: 'Speed', value: opp.speed_to_launch },
                  { label: 'Ease', value: 10 - opp.difficulty },
                ].map((metric) => (
                  <div key={metric.label} className="space-y-1">
                    <div className="flex justify-between items-end">
                      <p className="text-[8px] uppercase opacity-50 font-mono leading-none">{metric.label}</p>
                      <p className="text-[8px] font-mono font-bold leading-none">{metric.value}/10</p>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${metric.value * 10}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="h-full bg-[#141414]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {['plan', 'costs', 'grants', 'checklist', 'investors'].map((tab) => {
              const icons = {
                plan: FileText,
                costs: Calculator,
                grants: Coins,
                checklist: CheckSquare,
                investors: Users
              };
              const labels = {
                plan: 'Business Plan',
                costs: 'Cost Estimator',
                grants: 'Grant Finder',
                checklist: 'Checklist',
                investors: 'Investor Match'
              };
              const Icon = icons[tab as keyof typeof icons];
              
              return (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab as typeof activeTab)}
                  className={`w-full flex items-center gap-3 px-4 py-4 text-xs font-mono uppercase tracking-widest border-2 border-[#141414] transition-all shadow-[4px_4px_0px_0px_rgba(20,20,20,0.1)] active:shadow-none active:translate-x-1 active:translate-y-1 ${activeTab === tab ? 'bg-[#141414] text-[#E4E3E0] shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]' : 'bg-white hover:bg-gray-50'}`}
                >
                  <Icon className="w-4 h-4" />
                  {labels[tab as keyof typeof labels]}
                </button>
              );
            })}
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 bg-white border-2 border-[#141414] p-8 md:p-12 min-h-[600px] shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]">
            <div className="absolute top-4 right-4">
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
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-[#141414] text-[10px] font-mono uppercase hover:bg-[#141414] hover:text-[#E4E3E0] transition-all"
              >
                {copied === activeTab ? (
                  <><Check className="w-3 h-3" /> Copied</>
                ) : (
                  <><Copy className="w-3 h-3" /> Copy Text</>
                )}
              </button>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'plan' && (
                <motion.div
                  key="plan"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="bg-[#141414] text-[#E4E3E0] p-6 border-l-8 border-emerald-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
                    <h3 className="text-xs font-mono uppercase tracking-[0.3em] mb-2 opacity-60 text-emerald-400">Executive Summary</h3>
                    <p className="font-serif italic text-lg leading-relaxed">
                      {opp.description}
                    </p>
                  </div>
                  
                  <div className="prose prose-sm max-w-none font-serif prose-headings:font-serif prose-headings:italic prose-headings:tracking-tight prose-p:leading-relaxed prose-headings:border-b prose-headings:border-gray-100 prose-headings:pb-2">
                    <Markdown>{deepDive.business_plan}</Markdown>
                  </div>
                </motion.div>
              )}

              {activeTab === 'costs' && (
                <CostEstimator deepDiveResult={deepDive} />
              )}

              {activeTab === 'grants' && (
                <GrantFinder deepDiveResult={deepDive} selectedMode="global" />
              )}

              {activeTab === 'checklist' && (
                <Checklist 
                  deepDiveResult={deepDive} 
                  savedDocId={savedOpp.id}
                />
              )}

              {activeTab === 'investors' && (
                <InvestorMatch deepDiveResult={deepDive} />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
