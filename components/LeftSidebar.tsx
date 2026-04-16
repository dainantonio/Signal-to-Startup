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
  {id:'global', flag:'🌎', label:'Global / US'},
  {id:'caribbean', flag:'🌴', label:'Caribbean'},
  {id:'africa', flag:'🌍', label:'Africa'},
  {id:'uk', flag:'🇬🇧', label:'UK'},
  {id:'latam', flag:'🌎', label:'LatAm'},
]

const SECTORS = [
  {id:'ai', icon:'🤖', label:'AI & Tech'},
  {id:'markets', icon:'📈', label:'Markets'},
  {id:'funding', icon:'💰', label:'Funding'},
  {id:'policy', icon:'📋', label:'Policy'},
  {id:'retail', icon:'🛍', label:'Retail'},
  {id:'food', icon:'🍽', label:'Food & Bev'},
  {id:'workforce', icon:'👷', label:'Workforce'},
  {id:'agriculture', icon:'🌾', label:'Agriculture'},
  {id:'tourism', icon:'✈️', label:'Tourism'},
  {id:'remittances', icon:'💸', label:'Remittances'},
  {id:'realestate', icon:'🏠', label:'Real Estate'},
  {id:'health', icon:'🏥', label:'Health'},
]

export default function LeftSidebar({
  selectedMode, setSelectedMode,
  selectedSectors, toggleSector,
  onValidate, onDashboard, watchlistCount
}: LeftSidebarProps) {
  return (
    <nav className="flex flex-col h-full">

      {/* Market */}
      <div className="px-3 pt-4 pb-2">
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[2px] px-2 mb-2">
          Your market
        </p>
        {MARKETS.map(m => (
          <button key={m.id}
            onClick={() => setSelectedMode(m.id as MarketMode)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-sm font-medium transition-all duration-150 ${
              selectedMode === m.id
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}>
            <span style={{fontSize:'13px'}}>{m.flag}</span>
            {m.label}
          </button>
        ))}
      </div>

      <div className="h-px bg-slate-100 mx-3"/>

      {/* Sectors */}
      <div className="px-3 py-3 flex-1">
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[2px] px-2 mb-2">
          Filter by sector
        </p>
        {SECTORS.map(s => {
          const active = selectedSectors.includes(s.id)
          return (
            <button key={s.id}
              onClick={() => toggleSector(s.id)}
              className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left transition-all duration-150 ${
                active
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}>
              <span style={{fontSize:'11px'}}>{s.icon}</span>
              <span className="text-xs">{s.label}</span>
            </button>
          )
        })}
      </div>

      <div className="h-px bg-slate-100 mx-3"/>

      {/* Tools */}
      <div className="px-3 py-3">
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[2px] px-2 mb-2">
          Tools
        </p>
        <button onClick={onValidate}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm text-slate-600 hover:bg-slate-50 transition-colors">
          <span style={{fontSize:'13px'}}>💡</span>
          Validate idea
        </button>
        <button onClick={onDashboard}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-sm text-slate-600 hover:bg-slate-50 transition-colors">
          <div className="flex items-center gap-2">
            <span style={{fontSize:'13px'}}>👁</span>
            Watchlist
          </div>
          {watchlistCount > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded-full">
              {watchlistCount}
            </span>
          )}
        </button>
        <button onClick={onDashboard}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm text-slate-600 hover:bg-slate-50 transition-colors">
          <span style={{fontSize:'13px'}}>📊</span>
          Dashboard
        </button>
      </div>
    </nav>
  )
}
