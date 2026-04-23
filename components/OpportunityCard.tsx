'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Opportunity } from './types';

interface OpportunityCardProps {
  opp: Opportunity;
  index: number;
  isBestIdea: boolean;
  generateDeepDive: (opp: Opportunity) => void;
  isReadOnly?: boolean;
  countryTags?: string[];
  readingLevel?: 'simple' | 'standard' | 'advanced';
}

export const OpportunityCard: React.FC<OpportunityCardProps> = ({
  opp, index, isBestIdea, generateDeepDive, isReadOnly = false,
}) => {
  const score = Math.round(opp.money_score);

  const priorityColors: Record<string, string> = {
    High:   'bg-indigo-50 text-indigo-700 border-indigo-200',
    Medium: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Low:    'bg-slate-100 text-slate-500 border-slate-200',
  };
  const priorityCls = priorityColors[opp.priority] ?? priorityColors.Low;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      className={`bg-white flex flex-col relative overflow-hidden rounded-xl shadow-sm transition-shadow hover:shadow-md ${
        isBestIdea ? 'border-2 border-emerald-500' : 'border border-slate-200'
      }`}
    >
      <div className="p-5 flex flex-col flex-1 gap-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${priorityCls}`}>
                {opp.priority}
              </span>
              {isBestIdea && (
                <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  Top Pick
                </span>
              )}
            </div>
            <h4 className="font-sans font-bold text-lg leading-snug text-gray-900">{opp.name}</h4>
          </div>

          {/* Score badge */}
          <div style={{
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '6px 10px',
            background: score >= 70 ? '#F0FDF4' : score >= 50 ? '#FFFBEB' : '#F8F8F6',
            border: `1px solid ${score >= 70 ? '#BBF7D0' : score >= 50 ? '#FDE68A' : '#E8E8E4'}`,
            borderRadius: '8px',
            minWidth: '44px',
          }}>
            <span style={{
              fontSize: '20px',
              fontWeight: 800,
              color: score >= 70 ? '#16A34A' : score >= 50 ? '#D97706' : '#94A3B8',
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1,
            }}>
              {score}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm font-sans leading-relaxed text-gray-600">{opp.description}</p>

        {/* Key stats */}
        <div style={{ display: 'flex', gap: 0, paddingTop: '12px', borderTop: '1px solid #F5F5F3' }}>
          {[
            { label: 'Cost', value: `$${opp.startup_cost.toLocaleString()}` },
            { label: 'Speed', value: `${opp.speed_to_launch}/10` },
            { label: 'Ease', value: `${10 - opp.difficulty}/10` },
          ].map((m, i) => (
            <div key={i} style={{
              flex: 1,
              textAlign: 'center',
              borderRight: i < 2 ? '1px solid #F5F5F3' : 'none',
              padding: '0 8px',
            }}>
              <p style={{ fontSize: '9px', fontWeight: 700, color: '#BBB', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '3px' }}>
                {m.label}
              </p>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#0A0A0A', fontVariantNumeric: 'tabular-nums' }}>
                {m.value}
              </p>
            </div>
          ))}
        </div>

        {/* Target customer */}
        <div>
          <p className="text-[9px] font-semibold text-slate-400 uppercase mb-1">Target Customer</p>
          <p className="text-xs font-sans font-medium text-gray-700 leading-snug">{opp.target_customer}</p>
        </div>

        {/* CTA */}
        {isReadOnly ? (
          <Link
            href="/"
            className="mt-auto w-full bg-gray-900 text-white h-11 rounded-lg text-sm font-semibold transition-colors hover:bg-gray-800 flex items-center justify-center gap-2"
          >
            Run your own analysis →
          </Link>
        ) : (
          <button
            onClick={() => generateDeepDive(opp)}
            className="mt-auto w-full bg-gray-900 text-white h-11 rounded-lg text-sm font-semibold transition-colors hover:bg-gray-800 flex items-center justify-center"
          >
            ⚡ Open Execution Suite
          </button>
        )}
      </div>
    </motion.div>
  );
};
