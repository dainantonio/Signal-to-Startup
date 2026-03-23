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
  Bookmark
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
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center p-4">
        <div className="bg-white border-2 border-[#141414] p-8 md:p-12 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto">
            <LogIn className="w-8 h-8 text-indigo-600" />
          </div>
          <div className="space-y-2">
            <h1 className="font-serif italic text-2xl">Sign in to Your Pipeline</h1>
            <p className="text-[10px] font-mono uppercase opacity-50">Access your saved opportunities and execution plans.</p>
          </div>
          <button 
            onClick={login}
            className="w-full flex items-center justify-center gap-2 bg-[#141414] text-[#E4E3E0] px-6 py-3 text-[10px] font-mono uppercase tracking-widest hover:bg-[#333] transition-all shadow-[4px_4px_0px_0px_rgba(20,20,20,0.2)]"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b-2 border-[#141414] shadow-[0px_4px_0px_0px_rgba(20,20,20,0.1)]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-[10px] font-mono uppercase hover:opacity-60 transition-opacity">
            <ArrowLeft className="w-4 h-4" />
            Back to Analysis
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Page Title */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-serif italic mb-2">Your Opportunity Pipeline</h1>
          <p className="text-sm font-mono uppercase opacity-50">Manage and track your saved opportunities</p>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border-2 border-[#141414] p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase opacity-50">Total Saved</span>
              <Bookmark className="w-4 h-4 opacity-50" />
            </div>
            <div className="text-3xl font-bold font-serif italic">{totalSaved}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white border-2 border-[#141414] p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase opacity-50">In Progress</span>
              <Clock className="w-4 h-4 opacity-50" />
            </div>
            <div className="text-3xl font-bold font-serif italic">{inProgress}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white border-2 border-[#141414] p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase opacity-50">Launched</span>
              <CheckCircle className="w-4 h-4 opacity-50" />
            </div>
            <div className="text-3xl font-bold font-serif italic">{launched}</div>
          </motion.div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-6">
            <Loader2 className="w-12 h-12 animate-spin opacity-30" />
            <p className="text-[10px] font-mono uppercase opacity-50">Loading your pipeline...</p>
          </div>
        ) : savedOpportunities.length === 0 ? (
          <div className="text-center py-20 opacity-40">
            <Bookmark className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-sm font-mono uppercase tracking-widest">No saved opportunities yet</p>
            <p className="text-[10px] font-mono opacity-50 mt-2">Start by analyzing a signal and saving an opportunity</p>
          </div>
        ) : (
          /* Kanban Board */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(['Saved', 'In Progress', 'Launched'] as const).map((status) => (
              <div key={status} className="space-y-4">
                {/* Column Header */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-serif italic font-bold">{status}</h2>
                  <span className="bg-[#141414] text-[#E4E3E0] text-xs font-mono px-2 py-1 rounded-full">
                    {groupedByStatus[status].length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="space-y-4 min-h-[400px] bg-white/30 border-2 border-dashed border-[#141414] p-4 rounded-lg">
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
  const progressPercent = checklistTotal > 0 ? (checklistProgress / checklistTotal) * 100 : 0;

  const priorityColor = {
    'High': 'bg-red-500',
    'Medium': 'bg-amber-500',
    'Low': 'bg-emerald-500'
  }[opp.priority] || 'bg-gray-500';

  return (
    // FIX: Added "relative" so the absolute priority strip stays inside this card
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="relative bg-white border-2 border-[#141414] p-4 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] hover:shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] transition-all group"
    >
      {/* Priority Strip */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${priorityColor}`} />

      {/* Header */}
      <div className="flex items-start justify-between mb-3 pt-2">
        <div className="flex-grow">
          <h3 className="font-serif italic font-bold text-sm leading-tight mb-1">
            {opp.name}
          </h3>
          <div className="flex items-center gap-2">
            <span className="bg-[#141414] text-[#E4E3E0] text-[9px] font-mono px-2 py-0.5 rounded">
              {Math.round(opp.money_score)}/100
            </span>
          </div>
        </div>
        <GripVertical className="w-4 h-4 opacity-20 group-hover:opacity-50 transition-opacity" />
      </div>

      {/* Checklist Progress */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[8px] font-mono uppercase opacity-60">Checklist</span>
          <span className="text-[8px] font-mono font-bold">{checklistProgress}/{checklistTotal}</span>
        </div>
        <div className="h-2 bg-gray-100 border border-[#141414] overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5 }}
            className="h-full bg-emerald-500"
          />
        </div>
      </div>

      {/* Startup Cost */}
      <div className="mb-4 text-[10px] font-mono">
        <span className="opacity-60">Startup Cost:</span>
        <span className="font-bold ml-1">${opp.startup_cost.toLocaleString()}</span>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mb-3">
        <Link
          href={`/dashboard/${opportunity.id}`}
          className="flex-1 text-center py-2 bg-[#141414] text-[#E4E3E0] text-[10px] font-mono uppercase tracking-widest hover:bg-black transition-all"
        >
          Open Plan →
        </Link>
      </div>

      {/* Status Dropdown */}
      <div className="relative">
        <button
          onClick={() => setShowStatusMenu(!showStatusMenu)}
          disabled={isUpdating}
          className="w-full py-2 px-3 bg-white border-2 border-[#141414] text-[10px] font-mono uppercase font-bold text-center hover:bg-gray-50 disabled:opacity-50 transition-all"
        >
          {isUpdating ? (
            <Loader2 className="w-3 h-3 animate-spin inline" />
          ) : (
            opportunity.status
          )}
        </button>

        {showStatusMenu && !isUpdating && (
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border-2 border-[#141414] shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] z-10">
            {(['Saved', 'In Progress', 'Launched'] as const).map((status) => (
              <button
                key={status}
                onClick={() => {
                  onStatusChange(status);
                  setShowStatusMenu(false);
                }}
                className={`w-full text-left px-3 py-2 text-[10px] font-mono uppercase border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-all ${
                  opportunity.status === status ? 'bg-[#141414] text-[#E4E3E0] font-bold' : ''
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}