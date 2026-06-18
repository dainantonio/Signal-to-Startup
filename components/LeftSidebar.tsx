'use client'
import React from 'react'
import { MarketMode } from './types'

interface LeftSidebarProps {
  selectedMode: MarketMode
  setSelectedMode: (m: MarketMode) => void
  selectedSectors: string[]
  toggleSector: (s: string) => void
  onValidate: () => void
  onDashboard: () => void
  watchlistCount: number
}

const MARKETS = [
  { id: 'global',    flag: '🌎', label: 'Global / US' },
  { id: 'caribbean', flag: '🌴', label: 'Caribbean'   },
  { id: 'africa',    flag: '🌍', label: 'Africa'       },
  { id: 'uk',        flag: '🇬🇧', label: 'UK / Europe' },
  { id: 'latam',     flag: '🌎', label: 'Latin America'},
]

const SECTORS = [
  { id: 'ai',          icon: '🤖', label: 'AI & Tech'    },
  { id: 'markets',     icon: '📈', label: 'Markets'      },
  { id: 'funding',     icon: '💰', label: 'Funding'      },
  { id: 'policy',      icon: '📋', label: 'Policy'       },
  { id: 'retail',      icon: '🛍', label: 'Retail'       },
  { id: 'food',        icon: '🍽', label: 'Food & Bev'   },
  { id: 'workforce',   icon: '👷', label: 'Workforce'    },
  { id: 'agriculture', icon: '🌾', label: 'Agriculture'  },
  { id: 'tourism',     icon: '✈️', label: 'Tourism'      },
  { id: 'remittances', icon: '💸', label: 'Remittances'  },
  { id: 'realestate',  icon: '🏠', label: 'Real Estate'  },
  { id: 'health',      icon: '🏥', label: 'Health'       },
]

function SidebarLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[2.5px] px-2 mb-2 select-none">
      {children}
    </p>
  )
}

function SidebarDivider() {
  return <div className="h-px bg-slate-100 mx-2 my-1" />
}

export default function LeftSidebar({
  selectedMode, setSelectedMode,
  selectedSectors, toggleSector,
  onValidate, onDashboard, watchlistCount
}: LeftSidebarProps) {
  return (
    <nav className="flex flex-col h-full overflow-y-auto scrollbar-hide">

      {/* Markets */}
      <div className="px-2 pt-4 pb-1">
        <SidebarLabel>Your market</SidebarLabel>
        {MARKETS.map(m => (
          <button
            key={m.id}
            onClick={() => setSelectedMode(m.id as MarketMode)}
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left text-[13px] font-medium transition-all duration-150 ${
              selectedMode === m.id
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span style={{ fontSize: '12px', lineHeight: 1 }}>{m.flag}</span>
            <span className="truncate">{m.label}</span>
            {selectedMode === m.id && (
              <span className="ml-auto w-1 h-1 rounded-full bg-emerald-400 flex-shrink-0" />
            )}
          </button>
        ))}
      </div>

      <SidebarDivider />

      {/* Sectors */}
      <div className="px-2 py-2 flex-1">
        <div className="flex items-center justify-between px-2 mb-2">
          <SidebarLabel>Sectors</SidebarLabel>
          {selectedSectors.length > 0 && (
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-1.5 py-0.5 bg-slate-100 rounded-full">
              {selectedSectors.length}
            </span>
          )}
        </div>
        {SECTORS.map(s => {
          const active = selectedSectors.includes(s.id)
          return (
            <button
              key={s.id}
              onClick={() => toggleSector(s.id)}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-all duration-150 ${
                active
                  ? 'bg-slate-900/6 text-slate-900 font-semibold ring-1 ring-slate-200'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <span style={{ fontSize: '11px', lineHeight: 1 }}>{s.icon}</span>
              <span className="text-[12px]">{s.label}</span>
              {active && (
                <svg className="ml-auto w-3 h-3 text-slate-700 flex-shrink-0" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          )
        })}
      </div>

      <SidebarDivider />

      {/* Tools */}
      <div className="px-2 py-2 pb-3">
        <SidebarLabel>Tools</SidebarLabel>
        <button
          onClick={onValidate}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-[13px] text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        >
          <span style={{ fontSize: '12px', lineHeight: 1 }}>💡</span>
          Validate idea
        </button>
        <button
          onClick={onDashboard}
          className="w-full flex items-center px-2.5 py-1.5 rounded-lg text-left text-[13px] text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        >
          <span style={{ fontSize: '12px', lineHeight: 1, marginRight: '8px' }}>👁</span>
          <span>Watchlist</span>
          {watchlistCount > 0 && (
            <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full tabular-nums">
              {watchlistCount}
            </span>
          )}
        </button>
        <button
          onClick={onDashboard}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-[13px] text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        >
          <span style={{ fontSize: '12px', lineHeight: 1 }}>📊</span>
          Dashboard
        </button>
      </div>

    </nav>
  )
}
