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
  const scoreColor = score >= 70 ? '#16a34a' : score >= 50 ? '#d97706' : '#94a3b8';
  const scoreBg    = score >= 70 ? '#f0fdf4' : score >= 50 ? '#fffbeb' : '#f8fafc';
  const scoreBorder= score >= 70 ? '#bbf7d0' : score >= 50 ? '#fde68a' : '#e2e8f0';

  const priorityMap: Record<string, { bg: string; text: string; border: string }> = {
    High:   { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
    Medium: { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
    Low:    { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0' },
  };
  const p = priorityMap[opp.priority] ?? priorityMap.Low;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: '#fff',
        border: isBestIdea ? '2px solid #16a34a' : '1px solid #e5e5e1',
        borderRadius: '14px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        boxShadow: isBestIdea
          ? '0 4px 20px rgba(22,163,74,0.1)'
          : '0 1px 4px rgba(0,0,0,0.05)',
        transition: 'box-shadow 0.2s, transform 0.2s',
      }}
      whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.10)' }}
    >
      {isBestIdea && (
        <div style={{
          background: 'linear-gradient(90deg, #16a34a, #059669)',
          color: '#fff', fontSize: '9px', fontWeight: 800,
          letterSpacing: '2px', textTransform: 'uppercase',
          padding: '5px 16px', textAlign: 'center',
        }}>
          ★ Top Opportunity
        </div>
      )}

      <div style={{ padding: '18px 20px 20px', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
              <span style={{
                fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '5px',
                background: p.bg, color: p.text, border: `1px solid ${p.border}`,
                textTransform: 'uppercase', letterSpacing: '0.5px',
              }}>
                {opp.priority}
              </span>
            </div>
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#0a0a0a', lineHeight: 1.3, letterSpacing: '-0.2px' }}>
              {opp.name}
            </h4>
          </div>

          {/* Score */}
          <div style={{
            flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '8px 12px', background: scoreBg, border: `1px solid ${scoreBorder}`,
            borderRadius: '10px', minWidth: '48px',
          }}>
            <span style={{ fontSize: '22px', fontWeight: 900, color: scoreColor, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
              {score}
            </span>
            <span style={{ fontSize: '8px', fontWeight: 600, color: scoreColor, opacity: 0.7, letterSpacing: '0.5px', textTransform: 'uppercase', marginTop: '2px' }}>
              score
            </span>
          </div>
        </div>

        {/* Description */}
        <p style={{ fontSize: '13px', color: '#555', lineHeight: 1.7, margin: 0 }}>{opp.description}</p>

        {/* Stats */}
        <div style={{ display: 'flex', borderTop: '1px solid #f0f0ec', paddingTop: '14px', gap: 0 }}>
          {[
            { label: 'Cost',  value: `$${opp.startup_cost.toLocaleString()}` },
            { label: 'Speed', value: `${opp.speed_to_launch}/10` },
            { label: 'Ease',  value: `${10 - opp.difficulty}/10` },
          ].map((m, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center', borderRight: i < 2 ? '1px solid #f0f0ec' : 'none' }}>
              <p style={{ fontSize: '9px', fontWeight: 700, color: '#ccc', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
                {m.label}
              </p>
              <p style={{ fontSize: '14px', fontWeight: 800, color: '#0a0a0a', fontVariantNumeric: 'tabular-nums' }}>
                {m.value}
              </p>
            </div>
          ))}
        </div>

        {/* Target */}
        <div>
          <p style={{ fontSize: '9px', fontWeight: 700, color: '#bbb', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
            Target customer
          </p>
          <p style={{ fontSize: '12px', fontWeight: 500, color: '#555', lineHeight: 1.5 }}>
            {opp.target_customer}
          </p>
        </div>

        {/* CTA */}
        {isReadOnly ? (
          <Link
            href="/"
            style={{
              marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              background: '#0a0a0a', color: '#fff', height: '42px', borderRadius: '10px',
              fontSize: '13px', fontWeight: 700, textDecoration: 'none', letterSpacing: '-0.2px',
              transition: 'background 0.15s',
            }}
          >
            Run your own analysis →
          </Link>
        ) : (
          <button
            onClick={() => generateDeepDive(opp)}
            style={{
              marginTop: 'auto', width: '100%', background: '#0a0a0a', color: '#fff',
              height: '42px', borderRadius: '10px', fontSize: '13px', fontWeight: 700,
              border: 'none', cursor: 'pointer', letterSpacing: '-0.2px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = '#1a1a1a')}
            onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = '#0a0a0a')}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Open Execution Suite
          </button>
        )}
      </div>
    </motion.div>
  );
};
