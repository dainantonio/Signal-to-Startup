'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, RefreshCw, Save, Loader2 } from 'lucide-react';

interface StickyActionBarProps {
  onExtract: () => void;
  onRegenerate?: () => void;
  onSave?: () => void;
  loading?: boolean;
  showRegenerate?: boolean;
  showSave?: boolean;
  extractLabel?: string;
}

export const StickyActionBar: React.FC<StickyActionBarProps> = ({
  onExtract,
  onRegenerate,
  onSave,
  loading = false,
  showRegenerate = false,
  showSave = false,
  extractLabel = 'Extract',
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show when scrolled down 300px
      setIsVisible(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40"
        >
          <div className="bg-white border border-gray-200 rounded-full shadow-2xl px-4 py-3 flex items-center gap-3">
            <button
              onClick={onExtract}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-full text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              {extractLabel}
            </button>

            {showRegenerate && onRegenerate && (
              <button
                onClick={onRegenerate}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 disabled:opacity-50 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Regenerate
              </button>
            )}

            {showSave && onSave && (
              <button
                onClick={onSave}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-all"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
