'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  ArrowRight,
  LogIn, 
  Loader2, 
  GripVertical, 
  TrendingUp,
  CheckCircle,
  Clock,
  Bookmark,
  ChevronRight,
  Sparkles,
  LayoutDashboard,
  Target,
  Coins,
  Trash2,
  CheckSquare
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  auth,
  db,
  onAuthStateChanged,
  collection,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  updateDoc,
  deleteDoc,
  doc,
  FirebaseUser,
  signInWithPopup,
  googleProvider,
  limit,
} from '@/firebase';
import { 
  SavedOpportunity, 
  OpportunityStatus, 
  IdeaValidation, 
  SavedArticle, 
  AgentSignal 
} from '@/components/types';
import { COUNTRY_CONTEXT } from '@/lib/rss-sources';


// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sanitizeForStorage(obj: any): any {
  if (typeof obj === 'string') {
    return obj
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ')
      .replace(/\\/g, '\\\\');
  }
  if (Array.isArray(obj)) return obj.map(sanitizeForStorage);
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, sanitizeForStorage(v)])
    );
  }
  return obj;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [savedOpportunities, setSavedOpportunities] = useState<(SavedOpportunity & { id: string })[]>([]);
  const [validations, setValidations] = useState<IdeaValidation[]>([]);
  const [savedArticles, setSavedArticles] = useState<SavedArticle[]>([]);
  const [agentSignals, setAgentSignals] = useState<AgentSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [dashboardTab, setDashboardTab] = useState<'opportunities' | 'validations' | 'articles' | 'signals' | 'archive'>('opportunities');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        loadSavedOpportunities(user.uid);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadSavedOpportunities = async (uid: string) => {
    try {
      const [oppSnap, valSnap, artSnap, signalsSnap] = await Promise.all([
        getDocs(query(collection(db, 'saved_opportunities'), where('userId', '==', uid), orderBy('savedAt', 'desc'))),
        getDocs(query(collection(db, 'idea_validations'), where('userId', '==', uid), orderBy('createdAt', 'desc'))),
        getDocs(query(collection(db, 'saved_articles'), where('userId', '==', uid), orderBy('savedAt', 'desc'))),
        getDocs(query(collection(db, 'agent_signals'), where('userId', '==', uid))),
      ]);
      setSavedOpportunities(
        oppSnap.docs.map(d => ({ id: d.id, ...d.data() })) as (SavedOpportunity & { id: string })[]
      );
      setValidations(
        valSnap.docs.map(d => ({ id: d.id, ...d.data() })) as IdeaValidation[]
      );
      setSavedArticles(
        artSnap.docs.map(d => ({ id: d.id, ...d.data() })) as SavedArticle[]
      );
      const signals = signalsSnap.docs
        .map(d => ({ id: d.id, ...d.data() }) as AgentSignal)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 50); // Increased limit slightly for history
      setAgentSignals(signals);
    } catch (err) {
      console.error('[DASHBOARD] Failed to load pipeline:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.size} items? This cannot be undone.`)) return;
    
    setBulkProcessing(true);
    try {
      const collectionMap: Record<typeof dashboardTab, string> = {
        opportunities: 'saved_opportunities',
        validations: 'idea_validations',
        articles: 'saved_articles',
        signals: 'agent_signals',
        archive: '' // Archive tab won't have own collection
      };

      const ids = Array.from(selectedIds);
      await Promise.all(ids.map(async (id) => {
        // Find which collection this ID belongs to if we are in 'archive' tab
        let collectionName = collectionMap[dashboardTab];
        if (dashboardTab === 'archive') {
          // Check all state lists to find where this ID resides
          if (savedOpportunities.some(o => o.id === id)) collectionName = 'saved_opportunities';
          else if (validations.some(v => v.id === id)) collectionName = 'idea_validations';
          else if (savedArticles.some(a => a.id === id)) collectionName = 'saved_articles';
          else if (agentSignals.some(s => s.id === id)) collectionName = 'agent_signals';
        }

        if (collectionName) {
          await deleteDoc(doc(db, collectionName, id));
        }
      }));

      // Update local state
      setSavedOpportunities(prev => prev.filter(o => !selectedIds.has(o.id!)));
      setValidations(prev => prev.filter(v => !selectedIds.has(v.id!)));
      setSavedArticles(prev => prev.filter(a => !selectedIds.has(a.id!)));
      setAgentSignals(prev => prev.filter(s => !selectedIds.has(s.id!)));
      setSelectedIds(new Set());
    } catch (err) {
      console.error('Bulk delete failed:', err);
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleBulkArchive = async (unarchive = false) => {
    if (selectedIds.size === 0) return;
    setBulkProcessing(true);
    try {
      const collectionMap: Record<string, string> = {
        opportunities: 'saved_opportunities',
        validations: 'idea_validations',
        articles: 'saved_articles',
        signals: 'agent_signals',
        archive: ''
      };

      const ids = Array.from(selectedIds);
      await Promise.all(ids.map(async (id) => {
        let collectionName = collectionMap[dashboardTab];
        if (dashboardTab === 'archive') {
          if (savedOpportunities.some(o => o.id === id)) collectionName = 'saved_opportunities';
          else if (validations.some(v => v.id === id)) collectionName = 'idea_validations';
          else if (savedArticles.some(a => a.id === id)) collectionName = 'saved_articles';
          else if (agentSignals.some(s => s.id === id)) collectionName = 'agent_signals';
        }

        if (collectionName) {
          await updateDoc(doc(db, collectionName, id), { archived: !unarchive });
        }
      }));

      // Update local state
      const updateFn = (item: any) => selectedIds.has(item.id!) ? { ...item, archived: !unarchive } : item;
      setSavedOpportunities(prev => prev.map(updateFn));
      setValidations(prev => prev.map(updateFn));
      setSavedArticles(prev => prev.map(updateFn));
      setAgentSignals(prev => prev.map(updateFn));
      setSelectedIds(new Set());
    } catch (err) {
      console.error('Bulk archive failed:', err);
    } finally {
      setBulkProcessing(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = (currentItems: {id?: string}[]) => {
    if (selectedIds.size === currentItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(currentItems.map(item => item.id!)));
    }
  };

  const getActiveList = () => {
    switch (dashboardTab) {
      case 'opportunities': return savedOpportunities.filter(o => !o.archived);
      case 'validations': return validations.filter(v => !v.archived);
      case 'articles': return savedArticles.filter(a => !a.archived);
      case 'signals': return agentSignals.filter(s => !s.archived);
      case 'archive': return [
        ...savedOpportunities.filter(o => o.archived),
        ...validations.filter(v => v.archived),
        ...savedArticles.filter(a => a.archived),
        ...agentSignals.filter(s => s.archived)
      ];
      default: return [];
    }
  };

  const updateStatus = async (id: string, newStatus: OpportunityStatus) => {
    setUpdating(id);
    try {
      await updateDoc(doc(db, 'saved_opportunities', id), {
        status: newStatus
      });
      setSavedOpportunities(prev =>
        prev.map(opp => opp.id === id ? { ...opp, status: newStatus } : opp)
      );
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdating(null);
    }
  };

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Login failed", err);
    }
  };

  // Compute metrics
  const totalSaved = savedOpportunities.length;
  const inProgress = savedOpportunities.filter(o => o.status === 'In Progress').length;
  const launched = savedOpportunities.filter(o => o.status === 'Launched').length;

  // Group opportunities by status
  const groupedByStatus = {
    'Saved': savedOpportunities.filter(o => o.status === 'Saved'),
    'In Progress': savedOpportunities.filter(o => o.status === 'In Progress'),
    'Launched': savedOpportunities.filter(o => o.status === 'Launched')
  };

  if (!user) {
    return (
      <div className="min-h-screen-safe bg-background flex items-center justify-center p-6">
        <div className="bg-white border border-border/10 p-10 md:p-16 rounded-[2.5rem] shadow-2xl shadow-black/5 max-w-md w-full text-center space-y-8">
          <div className="w-20 h-20 bg-primary/5 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
            <LayoutDashboard className="w-10 h-10 text-primary" />
          </div>
          <div className="space-y-3">
            <h1 className="font-serif italic text-3xl font-bold tracking-tight">Your Pipeline</h1>
            <p className="text-sm text-muted font-medium leading-relaxed">Sign in to access your saved opportunities and execution plans.</p>
          </div>
          <button 
            onClick={login}
            className="w-full flex items-center justify-center gap-3 bg-foreground text-background px-8 py-4 rounded-2xl text-[11px] font-mono uppercase tracking-widest font-bold hover:bg-foreground/90 transition-all shadow-xl shadow-foreground/10 active:scale-[0.98]"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen-safe bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-border/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-[10px] font-mono uppercase font-bold text-muted hover:text-foreground transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            ← Back
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
              {user.displayName?.[0] || 'U'}
            </div>
            <span className="text-[10px] font-mono uppercase font-bold hidden sm:inline">{user.displayName}</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">

        {/* Page Title */}
        <div className="mb-12 space-y-2">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[10px] font-mono uppercase font-bold tracking-widest">Opportunity Pipeline</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-serif italic font-bold tracking-tight">Strategic Dashboard</h1>
          <p className="text-base text-muted font-medium max-w-2xl">Manage and track your saved opportunities from signal to launch.</p>
        </div>

        {/* Tab switcher */}
        <div className="flex flex-wrap gap-1 rounded-xl border border-gray-200 p-1 bg-gray-50 w-fit mb-10">
          {([
            ['opportunities', '💼 Opportunities'],
            ['validations', '💡 Validations'],
            ['articles', '🔖 Saved Articles'],
            ['signals', `🤖 Agent Signals${agentSignals.filter(s => !s.read && !s.archived).length > 0 ? ` (${agentSignals.filter(s => !s.read && !s.archived).length})` : ''}`],
            ['archive', '📦 Archive'],
          ] as const).map(([tab, label]) => (
            <button
              key={tab}
              type="button"
              onClick={() => setDashboardTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                dashboardTab === tab ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Bulk Action Toolbar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 py-3 border-b border-border/5">
          <div className="flex items-center gap-4">
            <button
              onClick={() => selectAll(getActiveList())}
              className="text-[10px] font-mono uppercase font-bold text-muted hover:text-foreground transition-colors flex items-center gap-2"
            >
              <div className={`w-4 h-4 border rounded flex items-center justify-center ${selectedIds.size === getActiveList().length && getActiveList().length > 0 ? 'bg-black border-black text-white' : 'border-gray-300'}`}>
                {selectedIds.size === getActiveList().length && getActiveList().length > 0 && <CheckCircle className="w-3 h-3" />}
              </div>
              {selectedIds.size === getActiveList().length && getActiveList().length > 0 ? 'Deselect All' : 'Select All'}
            </button>
            {selectedIds.size > 0 && (
              <span className="text-[10px] font-mono uppercase font-bold text-primary">
                {selectedIds.size} selected
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <>
                <button
                  onClick={() => handleBulkArchive(dashboardTab === 'archive')}
                  disabled={bulkProcessing}
                  className="px-3 py-1.5 border border-border/10 rounded-lg text-[10px] font-mono uppercase font-bold text-muted hover:text-foreground transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {dashboardTab === 'archive' ? 'Restore' : 'Archive'}
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkProcessing}
                  className="px-3 py-1.5 border border-red-100 bg-red-50 text-red-600 rounded-lg text-[10px] font-mono uppercase font-bold hover:bg-red-100 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </>
            )}
            <button
              onClick={async () => {
                const current = getActiveList();
                if (current.length === 0) return;
                if (!window.confirm(`Are you sure you want to delete ALL ${current.length} items in this view?`)) return;
                setBulkProcessing(true);
                try {
                  const ids = current.map(item => item.id!);
                  const collectionMap: Record<string, string> = {
                    opportunities: 'saved_opportunities',
                    validations: 'idea_validations',
                    articles: 'saved_articles',
                    signals: 'agent_signals',
                  };
                  await Promise.all(ids.map(id => {
                    let col = collectionMap[dashboardTab];
                    if (dashboardTab === 'archive') {
                      if (savedOpportunities.some(o => o.id === id)) col = 'saved_opportunities';
                      else if (validations.some(v => v.id === id)) col = 'idea_validations';
                      else if (savedArticles.some(a => a.id === id)) col = 'saved_articles';
                      else if (agentSignals.some(s => s.id === id)) col = 'agent_signals';
                    }
                    return deleteDoc(doc(db, col, id));
                  }));
                  // Local state update omitted for brevity, reload better here
                  window.location.reload();
                } catch (err) {
                  console.error('Delete all failed:', err);
                } finally {
                  setBulkProcessing(false);
                }
              }}
              className="text-[10px] font-mono uppercase font-bold text-muted/50 hover:text-red-400 transition-colors"
            >
              Delete All
            </button>
          </div>
        </div>

        {dashboardTab === 'signals' ? (
          <AgentSignalsList
            signals={agentSignals.filter(s => !s.archived)}
            loading={loading}
            selectedIds={selectedIds}
            onSelect={toggleSelect}
            onView={async (signal) => {
              if (signal.analyzed && signal.opportunityId) {
                try {
                  const oppDoc = await getDoc(doc(db, 'agent_opportunities', signal.opportunityId));
                  if (oppDoc.exists()) {
                    sessionStorage.setItem('agentOpportunityId', signal.opportunityId);
                    sessionStorage.setItem('agentSignalTitle', signal.title || '');
                    window.location.href = '/';
                    return;
                  }
                } catch (err) {
                  console.error('Failed to load agent opportunity:', err);
                }
              }
              // Fall back to manual analysis
              try {
                sessionStorage.setItem('sharedArticle', JSON.stringify({
                  url: signal.url,
                  title: signal.title,
                  text: signal.snippet || signal.title,
                  source: signal.source,
                }));
              } catch {}
              window.location.href = '/';
            }}
            onDismiss={async (id) => {
              try {
                await updateDoc(doc(db, 'agent_signals', id), {
                  read: true,
                  dismissed: true,
                  dismissedAt: new Date().toISOString(),
                });
                setAgentSignals(prev => prev.filter(s => s.id !== id));
              } catch (err) {
                console.error('Dismiss failed:', err);
              }
            }}
          />
        ) : dashboardTab === 'validations' ? (
          <ValidationsList 
            validations={validations.filter(v => !v.archived)} 
            loading={loading} 
            selectedIds={selectedIds}
            onSelect={toggleSelect}
          />
        ) : dashboardTab === 'articles' ? (
          <SavedArticlesList
            articles={savedArticles.filter(a => !a.archived)}
            loading={loading}
            selectedIds={selectedIds}
            onSelect={toggleSelect}
            onAnalyze={(article) => {
              try {
                sessionStorage.setItem('sharedArticle', JSON.stringify({
                  url: article.url,
                  title: article.title,
                  text: article.text,
                  source: 'saved',
                }));
              } catch {}
              router.push('/');
            }}
            onRemove={async (id) => {
              try {
                await deleteDoc(doc(db, 'saved_articles', id));
                setSavedArticles(prev => prev.filter(a => a.id !== id));
              } catch (err) {
                console.error('Failed to delete article:', err);
              }
            }}
          />
        ) : dashboardTab === 'archive' ? (
          <div className="space-y-12">
            <div className="bg-gray-50 border border-border/10 p-6 rounded-2xl">
              <p className="text-sm text-muted font-medium">Archived items are hidden from your main pipeline. You can restore them or delete them permanently here.</p>
            </div>
            {getActiveList().length === 0 ? (
              <div className="text-center py-24 opacity-20 font-serif italic text-2xl font-bold">
                Archive is empty
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {savedOpportunities.filter(o => o.archived).length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-mono uppercase font-bold text-muted px-2">Opportunities</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                      {savedOpportunities.filter(o => o.archived).map(opp => (
                        <KanbanCard 
                          key={opp.id} 
                          opportunity={opp} 
                          onStatusChange={(s) => updateStatus(opp.id!, s)} 
                          isUpdating={updating === opp.id}
                          selected={selectedIds.has(opp.id!)}
                          onSelect={() => toggleSelect(opp.id!)}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {validations.filter(v => v.archived).length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-mono uppercase font-bold text-muted px-2">Validations</h3>
                    <ValidationsList 
                      validations={validations.filter(v => v.archived)} 
                      loading={false} 
                      selectedIds={selectedIds} 
                      onSelect={toggleSelect} 
                    />
                  </div>
                )}
                {savedArticles.filter(a => a.archived).length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-mono uppercase font-bold text-muted px-2">Articles</h3>
                    <SavedArticlesList 
                      articles={savedArticles.filter(a => a.archived)} 
                      loading={false} 
                      selectedIds={selectedIds} 
                      onSelect={toggleSelect}
                      onAnalyze={() => {}}
                      onRemove={() => {}}
                    />
                  </div>
                )}
                {agentSignals.filter(s => s.archived).length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-mono uppercase font-bold text-muted px-2">Agent Signals</h3>
                    <AgentSignalsList 
                      signals={agentSignals.filter(s => s.archived)} 
                      loading={false} 
                      selectedIds={selectedIds} 
                      onSelect={toggleSelect}
                      onView={() => {}}
                      onDismiss={() => {}}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <>
          {/* Metrics Summary Bar */}
          <div className="flex items-center gap-6 mb-10 px-1 text-sm text-muted">
            <span><span className="font-bold text-foreground">{totalSaved}</span> saved</span>
            <span className="text-border/40">·</span>
            <span><span className="font-bold text-primary">{inProgress}</span> in progress</span>
            <span className="text-border/40">·</span>
            <span><span className="font-bold text-secondary">{launched}</span> launched</span>
          </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <div className="w-16 h-16 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
            <p className="text-[10px] font-mono uppercase font-bold tracking-widest text-muted">Syncing Pipeline...</p>
          </div>
        ) : savedOpportunities.length === 0 ? (
          <div className="text-center py-24 bg-white border border-dashed border-border/20 rounded-[3rem] px-6 max-w-3xl mx-auto">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-muted/20">
              <Bookmark className="w-10 h-10" />
            </div>
            <p className="text-2xl font-serif italic font-bold mb-4">Your Pipeline is Empty</p>
            <div className="text-sm text-muted font-medium mb-8 leading-relaxed max-w-xl mx-auto space-y-4">
              <p>The Pipeline is your execution engine. When you read the news feed and see a business opportunity you like, analyzing it generates a full "Deep Dive" business plan.</p>
              <p>Save that Deep Dive to this Pipeline to manage its lifecycle from idea to execution. It will automatically generate funding sources, cost estimates, and let you launch a real waitlist website.</p>
            </div>
            <Link href="/" className="inline-flex items-center gap-2 bg-foreground text-background px-8 py-4 rounded-2xl text-[11px] font-mono uppercase tracking-widest font-bold hover:bg-foreground/90 transition-all shadow-xl shadow-foreground/10">
              Go to News Feed <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          /* Kanban Board */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {(['Saved', 'In Progress', 'Launched'] as const).map((status) => (
              <div key={status} className="space-y-6">
                {/* Column Header */}
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      status === 'Saved' ? 'bg-gray-400' : status === 'In Progress' ? 'bg-primary' : 'bg-secondary'
                    }`} />
                    <h2 className="text-xl font-serif italic font-bold">{status}</h2>
                  </div>
                  <span className="bg-gray-100 text-muted text-[10px] font-mono font-bold px-3 py-1 rounded-full">
                    {groupedByStatus[status].length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="space-y-4 min-h-[500px] bg-gray-50/50 border border-dashed border-border/10 p-4 rounded-[2rem]">
                  <AnimatePresence mode="popLayout">
                    {groupedByStatus[status].map((opp) => (
                      <KanbanCard
                        key={opp.id}
                        opportunity={opp}
                        onStatusChange={(newStatus) => updateStatus(opp.id!, newStatus)}
                        isUpdating={updating === opp.id}
                        selected={selectedIds.has(opp.id!)}
                        onSelect={() => toggleSelect(opp.id!)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        )}
        </>)}
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Validations list
// ---------------------------------------------------------------------------

function ValidationsList({ 
  validations, 
  loading,
  selectedIds,
  onSelect,
}: { 
  validations: IdeaValidation[]; 
  loading: boolean;
  selectedIds?: Set<string>;
  onSelect?: (id: string) => void;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 gap-4">
        <div className="w-10 h-10 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
        <p className="text-[10px] font-mono uppercase font-bold tracking-widest text-muted">Loading...</p>
      </div>
    );
  }
  if (validations.length === 0) {
    return (
      <div className="text-center py-32 bg-white border border-dashed border-border/20 rounded-[3rem]">
        <div className="text-6xl mb-6">💡</div>
        <p className="text-lg font-sans font-bold mb-2">No validations yet</p>
        <p className="text-sm text-muted font-medium mb-8">
          Head to the Validate tab to test your business ideas against live market signals.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-foreground text-background px-8 py-4 rounded-2xl text-[11px] font-mono uppercase tracking-widest font-bold hover:bg-foreground/90 transition-all shadow-xl shadow-foreground/10"
        >
          Validate an Idea <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {validations.map(v => {
        const scoreColor =
          v.validationScore >= 80 ? 'text-green-600 bg-green-50 border-green-200' :
          v.validationScore >= 60 ? 'text-amber-600 bg-amber-50 border-amber-200' :
          v.validationScore >= 40 ? 'text-gray-600 bg-gray-50 border-gray-200' :
          'text-red-600 bg-red-50 border-red-200';
        const countryCtx = v.countryTag ? COUNTRY_CONTEXT[v.countryTag.toLowerCase()] : null;
        return (
          <motion.div
            key={v.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => onSelect?.(v.id)}
            className={`bg-white border rounded-2xl shadow-sm hover:shadow-md transition-all relative group cursor-pointer p-6 ${
              selectedIds?.has(v.id) ? 'border-primary ring-1 ring-primary' : 'border-border/10'
            }`}
          >
            {onSelect && (
              <div className="absolute top-6 left-6 z-10">
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                  selectedIds?.has(v.id) ? 'bg-primary border-primary text-white' : 'border-gray-200 bg-white group-hover:border-gray-400'
                }`}>
                  {selectedIds?.has(v.id) && <CheckSquare className="w-3.5 h-3.5" />}
                </div>
              </div>
            )}
            <div className={`flex items-center justify-between mb-4 ${onSelect ? 'pl-10' : ''}`}>
              <div className={`text-2xl font-bold border rounded-xl px-3 py-1 ${scoreColor}`}>
                {v.validationScore}
              </div>
              <span className="text-[10px] font-mono uppercase font-bold text-muted">
                {v.createdAt ? new Date(v.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
              </span>
            </div>
            <p className="text-xs font-semibold text-primary mb-1">{v.verdict}</p>
            <p className="text-sm text-gray-700 leading-relaxed line-clamp-3 mb-4">
              {v.idea}
            </p>
            <div className="flex flex-wrap gap-2 text-[10px]">
              <span className="px-2 py-0.5 bg-gray-100 rounded-full font-mono font-medium">{v.marketMode}</span>
              {countryCtx && (
                <span className="px-2 py-0.5 bg-gray-100 rounded-full font-mono font-medium">
                  {countryCtx.flag} {v.countryTag}
                </span>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

interface KanbanCardProps {
  opportunity: SavedOpportunity & { id: string };
  onStatusChange: (status: OpportunityStatus) => void;
  isUpdating: boolean;
  selected?: boolean;
  onSelect?: () => void;
}

function KanbanCard({ opportunity, onStatusChange, isUpdating, selected, onSelect }: KanbanCardProps) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const opp = opportunity.opportunity;
  const checklistProgress = opportunity.checklist.filter(c => c.completed).length;
  const checklistTotal = opportunity.checklist.length;
  const progressPercent = (checklistProgress / checklistTotal) * 100;

  const priorityColor = {
    'High': 'bg-emerald-500',
    'Medium': 'bg-amber-500',
    'Low': 'bg-gray-400'
  }[opp.priority] || 'bg-gray-400';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      onClick={() => onSelect?.()}
      className={`bg-white border p-6 rounded-2xl shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 group relative overflow-hidden cursor-pointer ${
        selected ? 'border-primary ring-1 ring-primary' : 'border-border/10'
      }`}
    >
      {/* Checkbox */}
      {onSelect && (
        <div className="absolute top-6 left-6 z-10">
           <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
            selected ? 'bg-primary border-primary text-white' : 'border-gray-200 bg-white group-hover:border-gray-400'
          }`}>
            {selected && <CheckSquare className="w-3.5 h-3.5" />}
          </div>
        </div>
      )}
      {/* Priority Strip */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${priorityColor} opacity-40`} />

      {/* Header */}
      <div className={`flex items-start justify-between mb-4 ${onSelect ? 'pl-10' : ''}`}>
        <div className="flex-grow space-y-1">
          <h3 className="font-serif italic font-bold text-base leading-tight group-hover:text-primary transition-colors">
            {opp.name}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono uppercase font-bold text-muted bg-gray-50 px-2 py-0.5 rounded border border-border/5">
              Score: {Math.round(opp.money_score)}
            </span>
          </div>
        </div>
        <GripVertical className="w-4 h-4 text-muted/20 group-hover:text-muted/50 transition-colors cursor-grab" />
      </div>

      {/* Checklist Progress */}
      <div className="mb-4 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-[9px] font-mono uppercase font-bold text-muted tracking-widest">Execution Progress</span>
          <span className="text-[9px] font-mono font-bold text-primary">{checklistProgress}/{checklistTotal}</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="h-full bg-primary shadow-[0_0_8px_rgba(79,70,229,0.3)]"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-1 text-muted">
            <Coins className="w-3 h-3 flex-shrink-0" />
            <p className="text-[8px] font-mono uppercase tracking-widest truncate">Cost</p>
          </div>
          <p className="text-xs font-bold font-mono truncate">{opportunity.marketMode ? (COUNTRY_CONTEXT[opportunity.marketMode]?.symbol || '$') : '$'}{opp.startup_cost.toLocaleString()}</p>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-muted">
            <Target className="w-3 h-3" />
            <p className="text-[8px] font-mono uppercase tracking-widest">Priority</p>
          </div>
          <p className="text-xs font-bold font-mono">{opp.priority}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2">
        <Link
          href={`/dashboard/${opportunity.id}`}
          className="w-full text-center py-3 bg-foreground text-background rounded-xl text-[10px] font-mono uppercase tracking-widest font-bold hover:bg-foreground/90 transition-all shadow-lg shadow-foreground/5 flex items-center justify-center gap-2 group"
        >
          Open Plan <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </Link>

        {/* Status Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowStatusMenu(!showStatusMenu)}
            disabled={isUpdating}
            className="w-full py-3 px-4 bg-white border border-border/10 rounded-xl text-[10px] font-mono uppercase font-bold text-muted hover:text-foreground hover:border-border/30 transition-all flex items-center justify-center gap-2"
          >
            {isUpdating ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <>
                <div className={`w-1.5 h-1.5 rounded-full ${
                  opportunity.status === 'Saved' ? 'bg-gray-400' : opportunity.status === 'In Progress' ? 'bg-primary' : 'bg-secondary'
                }`} />
                {opportunity.status}
              </>
            )}
          </button>

          <AnimatePresence>
            {showStatusMenu && !isUpdating && (
              <>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowStatusMenu(false)}
                  className="fixed inset-0 z-10"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-border/10 rounded-2xl shadow-2xl z-20 p-2 overflow-hidden"
                >
                  {(['Saved', 'In Progress', 'Launched'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        onStatusChange(status);
                        setShowStatusMenu(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-[10px] font-mono uppercase font-bold rounded-xl transition-all ${
                        opportunity.status === status ? 'bg-primary/5 text-primary' : 'text-muted hover:bg-gray-50 hover:text-foreground'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}


// ---------------------------------------------------------------------------
// Agent Signals list
// ---------------------------------------------------------------------------

function AgentSignalsList({
  signals,
  loading,
  selectedIds,
  onSelect,
  onView,
  onDismiss,
}: {
  signals: AgentSignal[];
  loading: boolean;
  selectedIds?: Set<string>;
  onSelect?: (id: string) => void;
  onView: (signal: AgentSignal) => void;
  onDismiss: (id: string) => void;
}) {
  const [dismissing, setDismissing] = React.useState<string | null>(null);
  const unreadCount = signals.filter(s => !s.read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 gap-4">
        <div className="w-10 h-10 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
        <p className="text-[10px] font-mono uppercase font-bold tracking-widest text-muted">Loading...</p>
      </div>
    );
  }

  if (signals.length === 0) {
    return (
      <div className="text-center py-32 bg-white border border-dashed border-border/20 rounded-[3rem]">
        <div className="text-6xl mb-6">🤖</div>
        <p className="text-lg font-sans font-bold mb-2">No agent signals yet</p>
        <p className="text-sm text-muted font-medium mb-2">
          The Signal Monitor runs daily and discovers opportunities matched to your profile.
        </p>
        <p className="text-xs text-muted">Make sure you have completed onboarding so the agent knows your preferences.</p>
      </div>
    );
  }

  const timeAgo = (iso: string) => {
    const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
    if (h < 1) return 'Just now';
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  const sectorColor: Record<string, string> = {
    ai: 'bg-purple-50 text-purple-700',
    funding: 'bg-green-50 text-green-700',
    policy: 'bg-blue-50 text-blue-700',
    markets: 'bg-amber-50 text-amber-700',
    sustainability: 'bg-emerald-50 text-emerald-700',
    realestate: 'bg-orange-50 text-orange-700',
    health: 'bg-rose-50 text-rose-700',
  };

  return (
    <div className="space-y-4">
      {unreadCount > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl text-sm font-medium w-fit">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
          {unreadCount} new signal{unreadCount > 1 ? 's' : ''} discovered for you
        </div>
      )}

      {signals.map(signal => (
        <motion.div
          key={signal.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => onSelect?.(signal.id!)}
          className={`bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group relative cursor-pointer ${
            selectedIds?.has(signal.id!) ? 'border-primary ring-1 ring-primary' : !signal.read ? 'border-black/20' : 'border-border/10'
          }`}
        >
          {onSelect && (
            <div className="absolute top-5 left-5 z-10">
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                selectedIds?.has(signal.id!) ? 'bg-primary border-primary text-white' : 'border-gray-200 bg-white group-hover:border-gray-400'
              }`}>
                {selectedIds?.has(signal.id!) && <CheckSquare className="w-3.5 h-3.5" />}
              </div>
            </div>
          )}
          <div className={`flex items-start justify-between gap-3 mb-3 ${onSelect ? 'pl-10' : ''}`}>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-[10px] font-mono font-bold bg-black text-white px-2 py-0.5 rounded-full">
                  Score {signal.userScore}
                </span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${sectorColor[signal.sector] ?? 'bg-gray-50 text-gray-600'}`}>
                  {signal.sector}
                </span>
                <span className="text-[10px] font-mono text-muted">{signal.source}</span>
                {!signal.read && (
                  <span className="text-[9px] font-mono font-bold bg-black text-white px-1.5 py-0.5 rounded">NEW</span>
                )}
              </div>
              <h3 className="font-semibold text-sm leading-snug line-clamp-2 mb-1">
                {signal.title}
              </h3>
              {signal.snippet && (
                <p className="text-xs text-muted leading-relaxed line-clamp-2">{signal.snippet}</p>
              )}
            </div>
            <span className="text-[10px] font-mono text-muted flex-shrink-0">{timeAgo(signal.createdAt)}</span>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onView(signal); }}
              className="flex-1 py-2 bg-foreground text-background rounded-xl text-[10px] font-mono uppercase tracking-widest font-bold hover:bg-foreground/90 transition-all flex items-center justify-center gap-1.5"
            >
              {signal.analyzed && signal.opportunityId ? '🤖 View Opportunity' : '⚡ Analyze'}
            </button>
            <button
              type="button"
              disabled={dismissing === signal.id}
              onClick={async () => {
                setDismissing(signal.id);
                await onDismiss(signal.id);
                setDismissing(null);
              }}
              className="px-4 py-2 border border-border/10 rounded-xl text-[10px] font-mono uppercase text-muted hover:text-gray-700 hover:border-gray-300 transition-all disabled:opacity-40"
            >
              {dismissing === signal.id ? '...' : 'Dismiss'}
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Saved Articles list
// ---------------------------------------------------------------------------

function SavedArticlesList({
  articles,
  loading,
  selectedIds,
  onSelect,
  onAnalyze,
  onRemove,
}: {
  articles: SavedArticle[];
  loading: boolean;
  selectedIds?: Set<string>;
  onSelect?: (id: string) => void;
  onAnalyze: (article: SavedArticle) => void;
  onRemove: (id: string) => void;
}) {
  const [removing, setRemoving] = React.useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 gap-4">
        <div className="w-10 h-10 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
        <p className="text-[10px] font-mono uppercase font-bold tracking-widest text-muted">Loading...</p>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="text-center py-32 bg-white border border-dashed border-border/20 rounded-[3rem]">
        <div className="text-6xl mb-6">🔖</div>
        <p className="text-lg font-sans font-bold mb-2">No saved articles yet</p>
        <p className="text-sm text-muted font-medium mb-8">
          On Android, tap Share → Signal to Startup from any article to save it here.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-foreground text-background px-8 py-4 rounded-2xl text-[11px] font-mono uppercase tracking-widest font-bold hover:bg-foreground/90 transition-all shadow-xl shadow-foreground/10"
        >
          Go to Feed <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const timeAgo = (iso: string) => {
    const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3600000);
    if (h < 1) return 'Just now';
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
  };

  return (
    <div className="space-y-4">
      {articles.map(article => (
        <motion.div
          key={article.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => onSelect?.(article.id!)}
          className={`bg-white border p-5 rounded-2xl shadow-sm hover:shadow-md transition-all group relative cursor-pointer ${
            selectedIds?.has(article.id!) ? 'border-primary ring-1 ring-primary' : 'border-border/10'
          }`}
        >
          {onSelect && (
            <div className="absolute top-5 left-5 z-10">
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                selectedIds?.has(article.id!) ? 'bg-primary border-primary text-white' : 'border-gray-200 bg-white group-hover:border-gray-400'
              }`}>
                {selectedIds?.has(article.id!) && <CheckSquare className="w-3.5 h-3.5" />}
              </div>
            </div>
          )}
          <div className={`flex items-start justify-between gap-3 mb-3 ${onSelect ? 'pl-8' : ''}`}>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm leading-snug line-clamp-2 mb-1">
                {article.title || article.url}
              </h3>
              <p className="text-[10px] font-mono text-muted truncate">{article.url}</p>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <span className="text-[10px] font-mono text-muted">{timeAgo(article.savedAt)}</span>
              {article.analyzed && (
                <span className="text-[9px] font-mono uppercase font-bold bg-secondary/10 text-secondary px-2 py-0.5 rounded-full">
                  Analyzed
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onAnalyze(article)}
              className="flex-1 py-2 bg-foreground text-background rounded-xl text-[10px] font-mono uppercase tracking-widest font-bold hover:bg-foreground/90 transition-all"
            >
              ⚡ Analyze
            </button>
            <button
              type="button"
              disabled={removing === article.id}
              onClick={async () => {
                setRemoving(article.id);
                await onRemove(article.id);
                setRemoving(null);
              }}
              className="px-4 py-2 border border-border/10 rounded-xl text-[10px] font-mono uppercase text-muted hover:text-red-500 hover:border-red-200 transition-all disabled:opacity-40"
            >
              {removing === article.id ? '...' : '🗑'}
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
