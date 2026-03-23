import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db, getDoc, doc } from '../../../firebase';
import { AnalysisResult } from '../../../components/types';
import { OpportunityCard } from '../../../components/OpportunityCard';
import { Users, AlertTriangle, Globe, TrendingUp, Sparkles, Zap, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface AnalysisPageProps {
  params: Promise<{ id: string }>;
}

async function getAnalysis(id: string): Promise<AnalysisResult | null> {
  try {
    const docRef = doc(db, 'analyses', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as AnalysisResult & { id: string };
    }
    return null;
  } catch (error) {
    console.error('Error fetching analysis:', error);
    return null;
  }
}

export async function generateMetadata({ params }: AnalysisPageProps): Promise<Metadata> {
  const { id } = await params;
  const analysis = await getAnalysis(id);
  
  if (!analysis) {
    return {
      title: 'Analysis Not Found',
    };
  }

  return {
    title: `${analysis.trend} | Signal to Startup`,
    description: analysis.summary,
  };
}

export default async function AnalysisPage({ params }: AnalysisPageProps) {
  const { id } = await params;
  const analysis = await getAnalysis(id);

  if (!analysis) {
    notFound();
  }

  return (
    <div className="min-h-screen-safe bg-background text-foreground p-4 md:p-8 font-sans selection:bg-primary/20">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-12 border-b border-border/10 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tighter uppercase italic font-serif">
                Signal to Startup
              </h1>
            </div>
            <p className="text-xs md:text-sm uppercase tracking-widest text-muted font-medium max-w-xl leading-relaxed">
              Shared Intelligence Analysis
            </p>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono bg-secondary/10 text-secondary px-4 py-2 rounded-full border border-secondary/20 font-bold tracking-widest">
            <Globe className="w-3.5 h-3.5" />
            PUBLIC ANALYSIS
          </div>
        </header>

        <div className="space-y-16">
          {/* Analysis Summary */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white border border-border/10 p-8 md:p-12 rounded-[2.5rem] shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                <TrendingUp className="w-64 h-64 -mr-16 -mt-16" />
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 text-primary mb-8">
                  <Sparkles className="w-5 h-5" />
                  <span className="text-[10px] font-mono uppercase font-bold tracking-widest">Intelligence Protocol 02</span>
                </div>
                
                <h2 className="text-4xl md:text-6xl font-serif italic tracking-tight mb-10 leading-tight text-foreground border-b border-border/5 pb-8">
                  {analysis.trend}
                </h2>
                
                <div className="space-y-10">
                  <p className="text-xl md:text-2xl font-sans leading-relaxed text-muted font-medium">
                    {analysis.summary}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-10 border-t border-border/5">
                    <div className="space-y-5">
                      <h4 className="text-[10px] font-mono uppercase font-bold tracking-widest flex items-center gap-2 text-primary">
                        <Users className="w-4 h-4" /> Impacted Groups
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {analysis.affected_groups.map((group, i) => (
                          <span key={i} className="px-3 py-1.5 bg-primary/5 border border-primary/10 text-primary text-[10px] font-mono uppercase font-bold rounded-lg">
                            {group}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-5">
                      <h4 className="text-[10px] font-mono uppercase font-bold tracking-widest flex items-center gap-2 text-accent">
                        <AlertTriangle className="w-4 h-4" /> New Problems
                      </h4>
                      <ul className="space-y-3">
                        {analysis.problems.map((problem, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm font-medium leading-relaxed text-muted">
                            <span className="mt-1.5 w-1.5 h-1.5 bg-accent rounded-full flex-shrink-0" />
                            {problem}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-foreground text-background p-10 rounded-[2.5rem] shadow-2xl shadow-foreground/10 relative overflow-hidden h-full">
                <div className="absolute top-0 right-0 p-10 opacity-[0.05]">
                  <Zap className="w-48 h-48 -mr-12 -mt-12" />
                </div>
                <div className="relative z-10 space-y-8">
                  <div className="space-y-2">
                    <h3 className="text-[10px] font-mono uppercase tracking-widest opacity-40 font-bold">Strategic Outlook</h3>
                    <p className="text-xs opacity-60 font-medium">Recommended path to market entry based on current signals.</p>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="p-6 bg-white/5 rounded-2xl border border-white/10 space-y-4">
                      <div className="flex items-center gap-3 text-primary">
                        <Sparkles className="w-5 h-5" />
                        <p className="text-[10px] font-mono uppercase font-bold tracking-widest">Primary Opportunity</p>
                      </div>
                      <p className="text-2xl font-serif italic font-bold leading-tight">{analysis.best_idea.name}</p>
                      <Link href="/" className="inline-flex items-center gap-2 text-[10px] font-mono uppercase font-bold text-primary hover:text-primary/80 transition-colors group">
                        Analyze your own signal <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Opportunity Matrix */}
          <section className="space-y-10">
            <div className="flex items-center gap-4 border-b border-border/10 pb-8">
              <div className="w-12 h-12 rounded-2xl bg-foreground text-background flex items-center justify-center font-mono text-sm font-bold shadow-lg shadow-foreground/10">03</div>
              <div className="flex flex-col">
                <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted font-bold">Market Intelligence</h3>
                <h2 className="text-3xl md:text-5xl font-serif italic font-bold tracking-tight leading-none">Opportunity Matrix</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {analysis.opportunities.map((opp, i) => (
                <OpportunityCard 
                  key={i}
                  opp={opp}
                  index={i}
                  isBestIdea={opp.name === analysis.best_idea.name}
                  generateDeepDive={() => {}} 
                  isReadOnly={true}
                />
              ))}
            </div>
          </section>
        </div>

        <footer className="mt-32 border-t border-border/10 pt-12 pb-12 text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-primary mb-2">
            <TrendingUp className="w-5 h-5" />
            <span className="font-serif italic font-bold text-xl">Signal to Startup</span>
          </div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted font-bold">
            Analyzed via AI Trend Intelligence Agent
          </p>
          <div className="flex items-center justify-center gap-6 pt-4">
            <Link href="/" className="text-[10px] font-mono uppercase font-bold text-muted hover:text-foreground transition-colors">Home</Link>
            <Link href="/dashboard" className="text-[10px] font-mono uppercase font-bold text-muted hover:text-foreground transition-colors">Pipeline</Link>
            <a href="https://github.com/dainantonio/Signal-to-Startup" target="_blank" rel="noopener noreferrer" className="text-[10px] font-mono uppercase font-bold text-muted hover:text-foreground transition-colors">GitHub</a>
          </div>
        </footer>
      </div>
    </div>
  );
}
