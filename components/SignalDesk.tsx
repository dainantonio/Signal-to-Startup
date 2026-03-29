'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Loader2, X, FileUp, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Edit3 } from 'lucide-react';
import { MarketMode } from './types';
import { LOADING_STAGE_LABELS } from './agent/useAgentAnalysis';
import { MarketModeSelector } from './MarketModeSelector';

interface SignalDeskProps {
  input: string;
  setInput: (val: string) => void;
  location: string;
  setLocation: (val: string) => void;
  focus: string;
  setFocus: (val: string) => void;
  loading: boolean;
  loadingStage?: number;
  loadingProgress?: number;
  analyzeSignal: () => void;
  cancelAnalysis: () => void;
  selectedMode: MarketMode;
  setSelectedMode: (mode: MarketMode) => void;
  countryTags: string[];
  setCountryTags: (tags: string[]) => void;
  onQuickEdit?: () => void;
  showQuickEdit?: boolean;
}

export const SignalDesk: React.FC<SignalDeskProps> = ({
  input,
  setInput,
  location,
  setLocation,
  focus,
  setFocus,
  loading,
  loadingStage = 0,
  loadingProgress = 5,
  analyzeSignal,
  cancelAnalysis,
  selectedMode,
  setSelectedMode,
  countryTags,
  setCountryTags,
  onQuickEdit,
  showQuickEdit = false,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfStatus, setPdfStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const uploadPdf = async (file: File) => {
    setPdfLoading(true);
    setPdfStatus(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/parse-pdf', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) {
        setPdfStatus({ type: 'error', message: data.error || 'Could not read PDF.' });
        return;
      }
      setInput(data.content);
      setPdfStatus({ type: 'success', message: 'PDF extracted successfully' });
    } catch {
      setPdfStatus({ type: 'error', message: 'Failed to upload PDF' });
    } finally {
      setPdfLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <section id="step-1" className="scroll-mt-24 mb-16">
      {/* Lead Signal Card */}
      <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-100 px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-serif font-bold text-gray-900 mb-1">
                Signal Desk
              </h2>
              <p className="text-sm text-gray-500">
                Paste your market signal to extract opportunities
              </p>
            </div>
            <Sparkles className="w-6 h-6 text-gray-300" />
          </div>
        </div>

        {/* Main Input Area */}
        <div className="p-8 space-y-6">
          {/* Quick Edit Button (shown when result exists) */}
          {showQuickEdit && onQuickEdit && (
            <button
              onClick={onQuickEdit}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-black transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              Quick edit & rerun
            </button>
          )}

          {/* Text Input */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Paste a news article, policy update, or market signal here..."
              className="w-full h-64 bg-gray-50 border-0 rounded-2xl p-6 focus:ring-2 focus:ring-black focus:bg-white outline-none resize-none font-sans text-base leading-relaxed transition-all"
            />
            <div className="absolute bottom-6 right-6 text-gray-200">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>

          {/* PDF Upload */}
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) uploadPdf(f);
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={pdfLoading}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-200 hover:border-gray-300 disabled:opacity-50 transition-all"
            >
              {pdfLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileUp className="w-4 h-4" />
              )}
              {pdfLoading ? 'Reading PDF...' : 'Upload PDF'}
            </button>
            {pdfStatus && (
              <span
                className={`flex items-center gap-2 text-sm ${
                  pdfStatus.type === 'success' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {pdfStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                {pdfStatus.message}
              </span>
            )}
          </div>

          {/* Extract Button - Directly Under Text */}
          {loading ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-black" />
                  <span className="text-sm font-medium text-gray-700">
                    {LOADING_STAGE_LABELS[loadingStage] ?? 'Processing...'}
                  </span>
                </div>
                <button
                  onClick={cancelAnalysis}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="h-full bg-black rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: `${loadingProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={analyzeSignal}
              disabled={!input.trim()}
              className="w-full bg-black text-white py-5 rounded-2xl text-base font-semibold hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 shadow-lg active:scale-[0.98]"
            >
              <Sparkles className="w-5 h-5" />
              Extract Opportunities
            </button>
          )}

          {/* Desk Settings - Collapsed */}
          <div className="border-t border-gray-100 pt-6">
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className="w-full flex items-center justify-between text-sm font-medium text-gray-600 hover:text-black transition-colors"
            >
              <span>Desk Settings</span>
              {showSettings ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {showSettings && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-6 space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
                      Location
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      placeholder="e.g. Kingston, New York"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-black focus:bg-white outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
                      Focus / Niche
                    </label>
                    <input
                      type="text"
                      value={focus}
                      onChange={e => setFocus(e.target.value)}
                      placeholder="e.g. SaaS, Healthcare"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-black focus:bg-white outline-none transition-all"
                    />
                  </div>
                </div>

                <MarketModeSelector
                  selectedMode={selectedMode}
                  onModeChange={setSelectedMode}
                />
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
