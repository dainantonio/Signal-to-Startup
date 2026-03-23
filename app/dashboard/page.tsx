'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
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
  Coins
} from 'lucide-react';
import Link from 'next/link';
import { 
  auth, 
  db, 
  onAuthStateChanged, 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  updateDoc,
  doc,
  FirebaseUser,
  signInWithPopup,
  googleProvider,
  handleFirestoreError,
  OperationType
} from '@/firebase';
import { SavedOpportunity, OpportunityStatus } from '@/components/types';

export default function DashboardPage() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [savedOpportunities, setSavedOpportunities] = useState<(SavedOpportunity & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

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
      const q = query(
        collection(db, 'saved_opportunities'),
        where('userId', '==', uid),
        orderBy('savedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as (SavedOpportunity & { id: string })[];
      setSavedOpportunities(docs);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'saved_opportunities');
    } finally {
      setLoading(false);
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
      handleFirestoreError(err, OperationType.UPDATE, `saved_opportunities/${id}`);
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
            Back to Analysis
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
              {user.displayName?.[0] || 'U'}
            </div>
            <span className="text-[10px] font-mono uppercase font-bold hidden sm:inline">{user.displayName}</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Page Title */}
        <div className="mb-12 space-y-2">
          <div className="flex items-center gap-3 text-primary mb-2">
            <Sparkles className="w-5 h-5" />
            <span className="text-[10px] font-mono uppercase font-bold tracking-widest">Opportunity Pipeline</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-serif italic font-bold tracking-tight">Strategic Dashboard</h1>
          <p className="text-base text-muted font-medium max-w-2xl">Manage and track your saved opportunities from signal to launch.</p>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-border/10 p-8 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-muted">Total Saved</span>
              <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-muted">
                <Bookmark className="w-4 h-4" />
              </div>
            </div>
            <div className="text-4xl font-bold font-serif italic">{totalSaved}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white border border-border/10 p-8 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-muted">In Progress</span>
              <div className="w-8 h-8 bg-primary/5 rounded-lg flex items-center justify-center text-primary">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-4xl font-bold font-serif italic text-primary">{inProgress}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white border border-border/10 p-8 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-muted">Launched</span>
              <div className="w-8 h-8 bg-secondary/5 rounded-lg flex items-center justify-center text-secondary">
                <CheckCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-4xl font-bold font-serif italic text-secondary">{launched}</div>
          </motion.div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <div className="w-16 h-16 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
            <p className="text-[10px] font-mono uppercase font-bold tracking-widest text-muted">Syncing Pipeline...</p>
          </div>
        ) : savedOpportunities.length === 0 ? (
          <div className="text-center py-32 bg-white border border-dashed border-border/20 rounded-[3rem]">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-muted/20">
              <Bookmark className="w-10 h-10" />
            </div>
            <p className="text-lg font-serif italic font-bold mb-2">No saved opportunities yet</p>
            <p className="text-sm text-muted font-medium mb-8">Start by analyzing a signal and saving an opportunity to your pipeline.</p>
            <Link href="/" className="inline-flex items-center gap-2 bg-foreground text-background px-8 py-4 rounded-2xl text-[11px] font-mono uppercase tracking-widest font-bold hover:bg-foreground/90 transition-all shadow-xl shadow-foreground/10">
              Analyze New Signal <ArrowRight className="w-4 h-4" />
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
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface KanbanCardProps {
  opportunity: SavedOpportunity & { id: string };
  onStatusChange: (status: OpportunityStatus) => void;
  isUpdating: boolean;
}

function KanbanCard({ opportunity, onStatusChange, isUpdating }: KanbanCardProps) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const opp = opportunity.opportunity;
  const checklistProgress = opportunity.checklist.filter(c => c.completed).length;
  const checklistTotal = opportunity.checklist.length;
  const progressPercent = (checklistProgress / checklistTotal) * 100;

  const priorityColor = {
    'High': 'bg-primary',
    'Medium': 'bg-secondary',
    'Low': 'bg-gray-400'
  }[opp.priority] || 'bg-gray-400';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white border border-border/10 p-6 rounded-2xl shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 group relative overflow-hidden"
    >
      {/* Priority Strip */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${priorityColor} opacity-40`} />

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
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
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-muted">
            <Coins className="w-3 h-3" />
            <p className="text-[8px] font-mono uppercase tracking-widest">Cost</p>
          </div>
          <p className="text-xs font-bold font-mono">${opp.startup_cost.toLocaleString()}</p>
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
