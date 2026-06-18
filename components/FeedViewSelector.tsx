'use client';

import React from 'react';
import { LayoutGrid, List, Zap } from 'lucide-react';

export type FeedViewMode = 'card' | 'list' | 'compact';

interface FeedViewSelectorProps {
  currentView: FeedViewMode;
  onViewChange: (view: FeedViewMode) => void;
}

export const FeedViewSelector: React.FC<FeedViewSelectorProps> = ({
  currentView,
  onViewChange,
}) => {
  const views: { value: FeedViewMode; label: string; icon: React.ReactNode; description: string }[] = [
    {
      value: 'card',
      label: 'Card',
      icon: <LayoutGrid className="w-4 h-4" />,
      description: 'Spacious grid view',
    },
    {
      value: 'list',
      label: 'List',
      icon: <List className="w-4 h-4" />,
      description: 'Compact list view',
    },
    {
      value: 'compact',
      label: 'Compact',
      icon: <Zap className="w-4 h-4" />,
      description: 'Ultra-dense view',
    },
  ];

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">View:</span>
      <div className="flex rounded-lg border border-slate-200/50 overflow-hidden bg-white shadow-sm">
        {views.map((view, idx) => (
          <button
            key={view.value}
            type="button"
            onClick={() => onViewChange(view.value)}
            title={view.description}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-all duration-200 ${
              idx > 0 ? 'border-l border-slate-200/50' : ''
            } ${
              currentView === view.value
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {view.icon}
            <span className="hidden sm:inline">{view.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
