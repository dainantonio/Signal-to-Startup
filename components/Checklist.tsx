import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Loader2, Check, CheckSquare, Clock, DollarSign } from 'lucide-react';
import { DeepDiveResult, ChecklistStep } from './types';
import confetti from 'canvas-confetti';
import { auth, db, doc, getDoc, updateDoc, collection, addDoc } from '../firebase';

interface ChecklistProps {
  deepDiveResult: DeepDiveResult;
  savedDocId?: string | null;
}

interface ChecklistItem {
  step: ChecklistStep;
  completed: boolean;
}

const PHASE_LABELS: Record<number, { label: string; color: string; bg: string }> = {
  1: { label: 'Research & Validation', color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200'   },
  2: { label: 'Legal & Setup',         color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200'  },
  3: { label: 'Build & Prepare',       color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200'},
  4: { label: 'Launch & First Customers', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
};

function normalizeStep(raw: ChecklistStep | string): ChecklistStep {
  if (typeof raw === 'string') {
    return { title: raw, description: '', phase: 1, time_estimate: '' };
  }
  return raw;
}

export const Checklist: React.FC<ChecklistProps> = ({ deepDiveResult, savedDocId }) => {
  const [items, setItems] = React.useState<ChecklistItem[]>(() =>
    deepDiveResult.checklist.map(raw => ({
      step: normalizeStep(raw as ChecklistStep | string),
      completed: false,
    }))
  );
  const [loading, setLoading] = React.useState(false);

  // Load saved checklist from Firestore
  const loadSavedChecklist = React.useCallback(async () => {
    if (!savedDocId) return;
    setLoading(true);
    try {
      const docSnap = await getDoc(doc(db, 'saved_opportunities', savedDocId));
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.checklist && Array.isArray(data.checklist)) {
          setItems(prev =>
            prev.map((item, i) => ({
              ...item,
              completed: data.checklist[i]?.completed ?? false,
            }))
          );
        }
      }
    } catch (err) {
      console.error('Error loading checklist', err);
    } finally {
      setLoading(false);
    }
  }, [savedDocId]);

  React.useEffect(() => {
    if (savedDocId) loadSavedChecklist();
  }, [savedDocId, loadSavedChecklist]);

  // localStorage key for non-saved checklist progress
  const localKey = `checklist_${deepDiveResult.checklist.map(s => (typeof s === 'string' ? s : (s as ChecklistStep).title)).join('').slice(0, 40)}`;

  // Load from localStorage on mount (when no Firestore savedDocId)
  React.useEffect(() => {
    if (savedDocId) return;
    try {
      const saved = localStorage.getItem(localKey);
      if (saved) {
        const completed: boolean[] = JSON.parse(saved);
        setItems(prev => prev.map((item, i) => ({ ...item, completed: completed[i] ?? false })));
      }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleItem = async (index: number) => {
    const newItems = items.map((item, i) =>
      i === index ? { ...item, completed: !item.completed } : item
    );
    setItems(newItems);

    if (savedDocId) {
      try {
        // Save step completed locally
        await updateDoc(doc(db, 'saved_opportunities', savedDocId), {
          checklist: newItems.map(item => ({
            text: item.step.title,
            completed: item.completed,
          })),
        });

        // If it was just toggled ON
        if (!items[index].completed && newItems[index].completed) {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.7 },
            colors: ['#10B981', '#34D399', '#059669', '#FCD34D']
          });

          // Track in user_actions for the daily streak
          if (auth.currentUser) {
            await addDoc(collection(db, 'user_actions'), {
              userId: auth.currentUser.uid,
              actionText: newItems[index].step.title,
              actionType: 'checklist',
              completedAt: new Date().toISOString()
            });
          }
        }
      } catch (err) {
        console.error('Failed to sync checklist:', err);
      }
    } else {
      // Persist to localStorage
      try {
        localStorage.setItem(localKey, JSON.stringify(newItems.map(i => i.completed)));
      } catch { /* ignore */ }
    }
  };

  const completedCount = items.filter(i => i.completed).length;
  const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0;

  // Group by phase
  const phases = [1, 2, 3, 4].map(phase => ({
    phase,
    ...PHASE_LABELS[phase],
    items: items.map((item, originalIndex) => ({ item, originalIndex }))
             .filter(({ item }) => item.step.phase === phase),
  })).filter(p => p.items.length > 0);

  return (
    <motion.div
      key="checklist"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <p className="text-[10px] font-mono uppercase text-gray-400">From Signal to First Dollar</p>
        <div className="flex items-center gap-3">
          <div className="text-xs font-mono text-gray-500">{completedCount}/{items.length} Done</div>
          <div className="w-24 h-1.5 bg-gray-100 overflow-hidden rounded-full">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-emerald-500 rounded-full"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin opacity-20" />
        </div>
      ) : (
        <div className="space-y-8">
          {phases.map(({ phase, label, color, bg, items: phaseItems }) => (
            <div key={phase}>
              {/* Phase header */}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border mb-4 ${bg}`}>
                <span className={`text-xs font-mono font-bold uppercase tracking-widest ${color}`}>
                  Phase {phase} — {label}
                </span>
                <span className={`text-[10px] font-mono ml-auto ${color} opacity-60`}>
                  {phaseItems.filter(({ item }) => item.completed).length}/{phaseItems.length}
                </span>
              </div>

              {/* Steps */}
              <div className="space-y-3">
                {phaseItems.map(({ item, originalIndex }) => (
                  <div
                    key={originalIndex}
                    onClick={() => toggleItem(originalIndex)}
                    className={`group relative flex gap-4 p-4 rounded-xl border cursor-pointer transition-all hover:shadow-sm ${
                      item.completed
                        ? 'bg-gray-50 border-gray-200 opacity-60'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* Checkbox */}
                    <div className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all mt-0.5 ${
                      item.completed
                        ? 'bg-emerald-500 border-emerald-600'
                        : 'border-gray-300 group-hover:border-gray-500'
                    }`}>
                      {item.completed && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold leading-snug mb-1 ${item.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                        {item.step.title}
                      </p>
                      {item.step.description && (
                        <p className="text-xs text-gray-500 leading-relaxed mb-2">
                          {item.step.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 flex-wrap">
                        {item.step.time_estimate && (
                          <span className="flex items-center gap-1 text-[10px] font-mono text-gray-400">
                            <Clock className="w-3 h-3" />
                            {item.step.time_estimate}
                          </span>
                        )}
                        {item.step.cost && (
                          <span className="flex items-center gap-1 text-[10px] font-mono text-gray-400">
                            <DollarSign className="w-3 h-3" />
                            {item.step.cost}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Done indicator */}
                    {item.completed && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!savedDocId && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
          <div className="p-1 bg-amber-100 rounded text-amber-700 flex-shrink-0">
            <CheckSquare className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-mono uppercase text-amber-800 font-bold">Progress saved locally</p>
            <p className="text-[10px] font-mono text-amber-600 mt-0.5">
              Save this opportunity to your dashboard to sync progress across devices.
            </p>
          </div>
        </div>
      )}

      <div className="bg-foreground text-background p-8 text-center relative overflow-hidden rounded-2xl">
        <div className="relative z-10">
          <p className="text-xs font-mono uppercase tracking-[0.2em] opacity-60 mb-6">
            {completedCount === items.length && items.length > 0
              ? 'All steps complete — go get that first customer!'
              : `${items.length - completedCount} steps remaining`}
          </p>
          <button
            type="button"
            onClick={() => window.print()}
            className="bg-background text-foreground px-8 py-3 text-[10px] font-mono uppercase tracking-widest font-bold hover:bg-white transition-all rounded-lg"
          >
            Download PDF Checklist
          </button>
        </div>
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_#fff_1px,_transparent_1px)] bg-[length:20px_20px]" />
        </div>
      </div>
    </motion.div>
  );
};
