'use client';

import React from 'react';
import { MarketMode } from './types';

interface LeftSidebarProps {
  selectedMode: MarketMode;
  setSelectedMode: (mode: MarketMode) => void;
  selectedSectors: string[];
  toggleSector: (sector: string) => void;
  onValidate: () => void;
  onDashboard: () => void;
  watchlistCount: number;
}

const MARKETS = [
  { id: 'global', label: 'Global / US', flag: '🌎' },
  { id: 'caribbean', label: 'Caribbean', flag: '🌴' },
  { id: 'africa', label: 'Africa', flag: '🌍' },
  { id: 'uk', label: 'UK / Europe', flag: '🇬🇧' },
  { id: 'latam', label: 'Latin America', flag: '🌎' },
];

const SECTORS = [
  { id: 'ai', label: 'AI & Tech', icon: '🤖' },
  { id: 'markets', label: 'Markets', icon: '📈' },
  { id: 'funding', label: 'Funding', icon: '💰' },
  { id: 'policy', label: 'Policy', icon: '📋' },
  { id: 'retail', label: 'Retail', icon: '🛍' },
  { id: 'food', label: 'Food & Bev', icon: '🍽' },
  { id: 'workforce', label: 'Workforce', icon: '👷' },
  { id: 'agriculture', label: 'Agriculture', icon: '🌾' },
  { id: 'tourism', label: 'Tourism', icon: '✈️' },
  { id: 'remittances', label: 'Remittances', icon: '💸' },
  { id: 'realestate', label: 'Real Estate', icon: '🏠' },
  { id: 'health', label: 'Health', icon: '🏥' },
];

export default function LeftSidebar({
  selectedMode,
  setSelectedMode,
  selectedSectors,
  toggleSector,
  onValidate,
  onDashboard,
  watchlistCount,
}: LeftSidebarProps) {
  return (
    <aside className="h-full bg-white border-r border-gray-100 overflow-y-auto flex flex-col">

      {/* Market selector */}
      <div className="p-3">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-2 mb-2">
          Market
        </p>
        {MARKETS.map(market => (
          <button
            key={market.id}
            onClick={() => setSelectedMode(market.id as MarketMode)}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-sm transition-colors ${
              selectedMode === market.id
                ? 'bg-gray-900 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span style={{ fontSize: '14px' }}>{market.flag}</span>
            <span className={`font-medium ${selectedMode === market.id ? 'text-white' : 'text-gray-700'}`}>
              {market.label}
            </span>
          </button>
        ))}
      </div>

      <div className="border-t border-gray-100 mx-3" />

      {/* Sector filters */}
      <div className="p-3">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-2 mb-2">
          Sectors
        </p>
        {SECTORS.map(sector => {
          const active = selectedSectors.includes(sector.id);
          return (
            <button
              key={sector.id}
              onClick={() => toggleSector(sector.id)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                active ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <span style={{ fontSize: '12px' }}>{sector.icon}</span>
              <span className="text-xs font-medium">{sector.label}</span>
            </button>
          );
        })}
      </div>

      <div className="border-t border-gray-100 mx-3" />

      {/* Tools */}
      <div className="p-3">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-2 mb-2">
          Tools
        </p>
        <button
          onClick={onValidate}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <span style={{ fontSize: '14px' }}>✅</span>
          <span className="text-sm font-medium text-gray-700">Validate idea</span>
        </button>
        <button
          onClick={onDashboard}
          className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <span style={{ fontSize: '14px' }}>👁</span>
            <span className="text-sm font-medium text-gray-700">Watchlist</span>
          </div>
          {watchlistCount > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded-full">
              {watchlistCount}
            </span>
          )}
        </button>
        <button
          onClick={onDashboard}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <span style={{ fontSize: '14px' }}>📊</span>
          <span className="text-sm font-medium text-gray-700">Dashboard</span>
        </button>
      </div>
    </aside>
  );
}
