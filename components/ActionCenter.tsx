import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, CheckCircle, Trophy, Activity, Loader2 } from 'lucide-react';
import { auth, db, collection, query, where, getDocs, orderBy } from '../firebase';
import { UserAction } from './types';

export const ActionCenter = () => {
  const [actions, setActions] = useState<UserAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (!auth.currentUser) return;
    
    const loadActions = async () => {
      try {
        const q = query(
          collection(db, 'user_actions'),
          where('userId', '==', auth.currentUser!.uid),
          orderBy('completedAt', 'desc')
        );
        const snap = await getDocs(q);
        const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() })) as UserAction[];
        setActions(fetched);
        
        // Calculate Streak
        let currentStreak = 0;
        const now = new Date();
        const dates = new Set(fetched.map(a => new Date(a.completedAt).toDateString()));
        
        let checkDate = new Date(now);
        
        // Is today explicitly done?
        if (dates.has(checkDate.toDateString())) {
          currentStreak++;
        }
        
        // Move to yesterday
        checkDate.setDate(checkDate.getDate() - 1);
        
        // Check backwards continuously
        while (dates.has(checkDate.toDateString())) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        }
        
        // Grace period rule: if today is missed but yesterday is done, streak is active but count starts from yesterday.
        if (currentStreak === 0 && dates.has(checkDate.toDateString())) {
          let graceStreak = 1;
          let graceDate = new Date(now);
          graceDate.setDate(graceDate.getDate() - 2);
          while (dates.has(graceDate.toDateString())) {
            graceStreak++;
            graceDate.setDate(graceDate.getDate() - 1);
          }
          currentStreak = graceStreak;
        }

        setStreak(currentStreak);
      } catch (err) {
        console.error('Failed to load user actions', err);
      } finally {
        setLoading(false);
      }
    };
    
    // We poll briefly in case the dashboard mounts right after a tracked action
    loadActions();
    const interval = setInterval(loadActions, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white border border-border/10 rounded-3xl p-6 shadow-sm flex items-center justify-center min-h-[120px]">
        <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
      </div>
    );
  }

  if (actions.length === 0) {
    return (
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100/50 rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-orange-100">
            <Flame className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h3 className="text-lg font-sans font-bold text-gray-900">Start Your Execution Streak</h3>
            <p className="text-sm text-gray-600 mt-1">Check off 'Your Next Move' or complete a Deep Dive checklist item to light your fire.</p>
          </div>
        </div>
      </div>
    );
  }

  const levels = [
    { threshold: 1, name: 'Spark', color: 'text-orange-500', bg: 'bg-orange-100 text-orange-600' },
    { threshold: 3, name: 'Ignition', color: 'text-amber-500', bg: 'bg-amber-100 text-amber-600' },
    { threshold: 7, name: 'Momentum', color: 'text-rose-500', bg: 'bg-rose-100 text-rose-600' },
    { threshold: 14, name: 'Execution', color: 'text-purple-500', bg: 'bg-purple-100 text-purple-600' },
    { threshold: 30, name: 'Founder', color: 'text-indigo-500', bg: 'bg-indigo-100 text-indigo-600' },
  ];

  const currentLevel = levels.slice().reverse().find(l => streak >= l.threshold) || levels[0];
  const nextLevel = levels.find(l => l.threshold > streak);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Streak Card */}
      <div className="md:col-span-2 bg-gray-50/50 border border-border/10 rounded-3xl p-6 shadow-sm flex flex-col justify-center relative overflow-hidden group">
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-border/5 relative z-10 transition-transform group-hover:scale-105">
                <Flame className={`w-7 h-7 ${streak > 0 ? 'text-orange-500 fill-orange-500' : 'text-gray-300'}`} />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase font-bold tracking-widest text-muted">Execution Streak</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-serif italic font-bold tracking-tight text-gray-900">{streak}</span>
                <span className="text-sm font-sans font-medium text-gray-400">Day{streak !== 1 ? 's' : ''}</span>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[9px] font-mono uppercase font-bold tracking-widest mt-2 ${currentLevel.bg}`}>
                <Trophy className="w-3 h-3" /> Level: {currentLevel.name}
              </span>
            </div>
          </div>

          {nextLevel && (
            <div className="w-full md:w-44 bg-white/40 border border-border/5 p-3 rounded-xl">
              <p className="text-[8px] font-mono uppercase font-bold text-muted/60 mb-1.5 flex justify-between">
                <span>Target</span>
                <span>{nextLevel.threshold} Days</span>
              </p>
              <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((streak / nextLevel.threshold) * 100, 100)}%` }}
                  className="h-full bg-orange-400"
                />
              </div>
              <p className="text-[9px] font-medium text-muted mt-1.5 truncate">
                {nextLevel.threshold - streak} to {nextLevel.name}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Activity Feed */}
      <div className="bg-white border border-border/10 rounded-3xl p-6 shadow-sm flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xs font-mono uppercase font-bold tracking-widest flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" /> Recent Action
          </h3>
          <span className="text-[10px] font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{actions.length} Total</span>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[140px] scrollbar-thin scrollbar-thumb-gray-200">
          {actions.slice(0, 10).map((action, i) => (
            <div key={i} className="flex gap-3">
              <div className="mt-0.5">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-900 leading-snug">{action.actionText}</p>
                <p className="text-[9px] text-gray-400 mt-1 uppercase font-mono">
                  {new Date(action.completedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · {action.actionType === 'checklist' ? 'Checklist' : 'Next Move'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
