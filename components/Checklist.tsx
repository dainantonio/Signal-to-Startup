import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Loader2, Check, CheckSquare } from 'lucide-react';
import { DeepDiveResult } from './types';
import { db, doc, getDoc, updateDoc } from '../firebase';

interface ChecklistProps {
  deepDiveResult: DeepDiveResult;
  savedDocId?: string | null;
}

interface ChecklistItem {
  text: string;
  completed: boolean;
}

export const Checklist: React.FC<ChecklistProps> = ({ deepDiveResult, savedDocId }) => {
  const [items, setItems] = React.useState<ChecklistItem[]>(
    deepDiveResult.checklist.map(text => ({ text, completed: false }))
  );
  const [loading, setLoading] = React.useState(false);

  const loadSavedChecklist = React.useCallback(async () => {
    if (!savedDocId) return;
    setLoading(true);
    try {
      const docSnap = await getDoc(doc(db, 'saved_opportunities', savedDocId));
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.checklist) {
          setItems(data.checklist);
        }
      }
    } catch (err) {
      console.error("Error loading checklist", err);
    } finally {
      setLoading(false);
    }
  }, [savedDocId]);

  React.useEffect(() => {
    if (savedDocId) {
      loadSavedChecklist();
    }
  }, [savedDocId, loadSavedChecklist]);

  const toggleItem = async (index: number) => {
    const newItems = [...items];
    newItems[index].completed = !newItems[index].completed;
    setItems(newItems);

    if (savedDocId) {
      try {
        await updateDoc(doc(db, 'saved_opportunities', savedDocId), {
          checklist: newItems
        });
      } catch (err) {
        console.error('Failed to sync checklist:', err);
      }
    }
  };

  const completedCount = items.filter(i => i.completed).length;
  const progress = (completedCount / items.length) * 100;

  return (
    <motion.div
      key="checklist"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="border-b-2 border-[#141414] pb-4 flex justify-between items-end">
        <div>
          <h3 className="text-2xl font-serif italic tracking-tight">30-Day Launch Sequence</h3>
          <p className="text-[10px] font-mono uppercase opacity-50 mt-1">From Signal to First Dollar</p>
        </div>
        <div className="text-right">
          <div className="text-xs font-mono uppercase mb-1">{completedCount}/{items.length} Tasks</div>
          <div className="w-32 h-2 bg-gray-100 border border-[#141414] overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-emerald-500"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin opacity-20" />
        </div>
      ) : (
        <div className="relative space-y-12 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
          {items.map((item, i) => (
            <div 
              key={i} 
              className={`relative flex gap-8 group cursor-pointer transition-opacity ${item.completed ? 'opacity-50' : ''}`}
              onClick={() => toggleItem(i)}
            >
              <div className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full bg-white border-2 border-[#141414] flex items-center justify-center font-bold font-serif italic text-lg transition-all ${item.completed ? 'bg-emerald-500 text-white border-emerald-600' : 'group-hover:bg-[#141414] group-hover:text-[#E4E3E0]'}`}>
                {item.completed ? <Check className="w-6 h-6" /> : i + 1}
              </div>
              <div className="flex-grow pt-1.5">
                <div className="flex items-start justify-between gap-4">
                  <p className={`text-sm font-medium leading-relaxed pr-8 ${item.completed ? 'line-through' : ''}`}>{item.text}</p>
                  <div className={`flex-shrink-0 p-1.5 bg-gray-50 border border-gray-200 rounded-lg transition-opacity ${item.completed ? 'opacity-100 bg-emerald-50' : 'opacity-20 group-hover:opacity-100'}`}>
                    <CheckCircle2 className={`w-4 h-4 ${item.completed ? 'text-emerald-500' : 'text-gray-300'}`} />
                  </div>
                </div>
                <div className="mt-4 h-px bg-gray-100 w-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!savedDocId && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
          <div className="p-1 bg-amber-100 rounded text-amber-700">
            <CheckSquare className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-mono uppercase text-amber-800 font-bold">Progress Not Tracked</p>
            <p className="text-[10px] font-mono text-amber-600 mt-0.5">Save this opportunity to your dashboard to track your progress and keep your checklist synced.</p>
          </div>
        </div>
      )}

      <div className="bg-[#141414] text-[#E4E3E0] p-8 text-center relative overflow-hidden">
        <div className="relative z-10">
          <h4 className="text-xl font-serif italic mb-2 tracking-tight">Ready to execute?</h4>
          <p className="text-xs font-mono uppercase tracking-[0.2em] opacity-60 mb-6">Day 31 starts with your first customer.</p>
          <button 
            onClick={() => window.print()}
            className="bg-[#E4E3E0] text-[#141414] px-8 py-3 text-[10px] font-mono uppercase tracking-widest font-bold hover:bg-white transition-all"
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
