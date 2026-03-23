import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db, getDoc, doc } from '../../../firebase';
import { AnalysisResult } from '../../../components/types';
import { OpportunityCard } from '../../../components/OpportunityCard';
import { Users, AlertTriangle, Globe } from 'lucide-react';

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
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-12 border-b border-[#141414] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter uppercase italic font-serif">
              Signal to Startup
            </h1>
            <p className="text-sm uppercase tracking-widest opacity-60 mt-2">
              Shared Intelligence Analysis
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono bg-[#141414] text-[#E4E3E0] px-3 py-1 rounded-full">
            <Globe className="w-3 h-3" />
            PUBLIC ANALYSIS
          </div>
        </header>

        <div className="space-y-12">
          {/* Analysis Summary */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 bg-white border-2 border-[#141414] p-10 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 opacity-50" />
              
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 rounded-full bg-[#141414] text-[#E4E3E0] flex items-center justify-center font-mono text-sm font-bold">02</div>
                <div className="flex flex-col">
                  <h3 className="text-[10px] font-mono uppercase tracking-[0.4em] opacity-50">Intelligence Protocol</h3>
                  <p className="text-xs font-mono uppercase font-bold tracking-widest">Signal Analysis & Synthesis</p>
                </div>
              </div>
              
              <h2 className="text-4xl md:text-6xl font-serif italic tracking-tighter mb-8 leading-[0.9] border-b-2 border-[#141414] pb-6">
                {analysis.trend}
              </h2>
              
              <div className="space-y-6">
                <p className="text-xl font-sans leading-relaxed text-gray-800 font-medium">
                  {analysis.summary}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-10 border-t border-[#141414] border-dashed">
                  <div className="space-y-5">
                    <h4 className="text-[10px] font-mono uppercase font-bold tracking-[0.2em] flex items-center gap-2 text-indigo-600">
                      <Users className="w-4 h-4" /> Impacted Groups
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.affected_groups.map((group, i) => (
                        <span key={i} className="px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-900 text-[10px] font-mono uppercase font-bold rounded-sm">
                          {group}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-5">
                    <h4 className="text-[10px] font-mono uppercase font-bold tracking-[0.2em] flex items-center gap-2 text-amber-600">
                      <AlertTriangle className="w-4 h-4" /> New Problems
                    </h4>
                    <ul className="space-y-3">
                      {analysis.problems.map((problem, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm font-sans leading-tight text-gray-700">
                          <span className="mt-1.5 w-1.5 h-1.5 bg-amber-500 rounded-full flex-shrink-0" />
                          {problem}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-[#141414] text-[#E4E3E0] p-8 shadow-[8px_8px_0px_0px_rgba(20,20,20,0.2)]">
                <h3 className="text-[10px] font-mono uppercase tracking-[0.3em] mb-6 opacity-60">Strategic Outlook</h3>
                <div className="space-y-8">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-emerald-500/20 rounded-lg">
                      <Globe className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-mono uppercase opacity-50 mb-1">Primary Opportunity</p>
                      <p className="text-sm font-serif italic leading-snug">{analysis.best_idea.name}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Opportunity Matrix */}
          <section className="space-y-10">
            <div className="flex items-center gap-4 border-b-2 border-[#141414] pb-8">
              <div className="w-10 h-10 rounded-full bg-[#141414] text-[#E4E3E0] flex items-center justify-center font-mono text-sm font-bold">03</div>
              <div className="flex flex-col">
                <h3 className="text-[10px] font-mono uppercase tracking-[0.4em] opacity-50">Market Intelligence</h3>
                <h2 className="text-3xl md:text-5xl font-serif italic tracking-tighter leading-none">Opportunity Matrix</h2>
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

        <footer className="mt-24 border-t border-[#141414] pt-8 opacity-40 text-center">
          <p className="text-[10px] font-mono uppercase tracking-widest">
            Analyzed via Signal to Startup Trend Intelligence Agent
          </p>
        </footer>
      </div>
    </div>
  );
}
