'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  db,
  auth,
  onAuthStateChanged,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
} from '@/firebase';
import type { FirebaseUser } from '@/firebase';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  count?: number;
  read: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u));
    return () => unsub();
  }, []);

  // Real-time notification listener
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, snapshot => {
      const notifs = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
      })) as Notification[];
      setNotifications(notifs.slice(0, 10));
    });

    return () => unsub();
  }, [user]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.read);
    await Promise.all(
      unread.map(n => updateDoc(doc(db, 'notifications', n.id), { read: true }))
    );
  };

  const handleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next && unreadCount > 0) markAllRead();
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={handleOpen}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        className="relative p-2 text-gray-500 hover:text-black transition-colors rounded-lg hover:bg-gray-100"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-black text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-gray-200 shadow-xl z-50 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-xs text-gray-500">{unreadCount} unread</span>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-gray-400">No notifications yet</p>
                  <p className="text-xs text-gray-300 mt-1">
                    The agent will notify you when new signals match your profile
                  </p>
                </div>
              ) : (
                notifications.map(notif => (
                  <div
                    key={notif.id}
                    className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                      !notif.read ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                          !notif.read ? 'bg-black' : 'bg-gray-300'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 mb-0.5">
                          {notif.title}
                        </p>
                        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                          {notif.message}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1">
                          {new Date(notif.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-100">
                <a
                  href="/dashboard"
                  className="text-xs text-gray-500 hover:text-black transition-colors"
                >
                  View all in dashboard →
                </a>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
