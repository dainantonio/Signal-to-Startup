'use client';

import React from 'react';
import { MapPin, Building2, Globe2, Check } from 'lucide-react';
import { SourceOrigin, SourceClassification } from '@/lib/localization/jamaicaFirst';

interface SourceLabelProps {
  classification: SourceClassification;
  size?: 'sm' | 'md' | 'lg';
  showConfidence?: boolean;
}

export const SourceLabel: React.FC<SourceLabelProps> = ({
  classification,
  size = 'md',
  showConfidence = false,
}) => {
  const getOriginConfig = (origin: SourceOrigin) => {
    switch (origin) {
      case 'Jamaica Government':
        return {
          icon: MapPin,
          color: 'bg-green-100 text-green-800 border-green-200',
          label: '🇯🇲 Jamaica Gov',
          badgeColor: 'bg-green-600',
        };
      case 'Jamaica Private Sector':
        return {
          icon: Building2,
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          label: '🇯🇲 Jamaica',
          badgeColor: 'bg-blue-600',
        };
      case 'Caribbean Regional':
        return {
          icon: Globe2,
          color: 'bg-purple-100 text-purple-800 border-purple-200',
          label: '🌴 Caribbean',
          badgeColor: 'bg-purple-600',
        };
      case 'International':
        return {
          icon: Globe2,
          color: 'bg-gray-100 text-gray-700 border-gray-200',
          label: '🌍 Global',
          badgeColor: 'bg-gray-600',
        };
    }
  };

  const config = getOriginConfig(classification.origin);
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  return (
    <div className="inline-flex items-center gap-2">
      <span
        className={`inline-flex items-center font-semibold border rounded-md ${config.color} ${sizeClasses[size]} whitespace-nowrap`}
      >
        <Icon className={iconSizes[size]} />
        {config.label}
      </span>

      {showConfidence && classification.confidence >= 80 && (
        <span className="inline-flex items-center gap-1 text-xs text-gray-600">
          <Check className="w-3 h-3 text-green-600" />
          <span className="text-[10px]">Verified</span>
        </span>
      )}
    </div>
  );
};

interface SourceBadgeProps {
  origin: SourceOrigin;
  isLocal: boolean;
  compact?: boolean;
}

export const SourceBadge: React.FC<SourceBadgeProps> = ({ origin, isLocal, compact = false }) => {
  const getBadgeStyle = () => {
    if (isLocal && origin.includes('Jamaica')) {
      return {
        bg: 'bg-green-600',
        text: 'text-white',
        label: compact ? 'JM' : '🇯🇲 Local',
      };
    }
    if (origin === 'Caribbean Regional') {
      return {
        bg: 'bg-purple-600',
        text: 'text-white',
        label: compact ? 'CAR' : '🌴 Regional',
      };
    }
    return {
      bg: 'bg-gray-500',
      text: 'text-white',
      label: compact ? 'INT' : '🌍 Global',
    };
  };

  const style = getBadgeStyle();

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${style.bg} ${style.text}`}
    >
      {style.label}
    </span>
  );
};

interface SourceTooltipProps {
  classification: SourceClassification;
  children: React.ReactNode;
}

export const SourceTooltip: React.FC<SourceTooltipProps> = ({ classification, children }) => {
  const [showTooltip, setShowTooltip] = React.useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="cursor-help"
      >
        {children}
      </div>

      {showTooltip && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 pointer-events-none">
          <div className="bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl">
            <div className="font-semibold mb-1">{classification.origin}</div>
            <div className="text-gray-300 mb-2">{classification.justification}</div>
            <div className="flex items-center gap-2 text-[10px] text-gray-400">
              <span>Confidence: {classification.confidence}%</span>
              {classification.confidence >= 80 && (
                <span className="text-green-400">✓ Verified</span>
              )}
            </div>
            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
              <div className="w-2 h-2 bg-gray-900 rotate-45" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface LocationPreferenceSelectorProps {
  currentCountry: string;
  onChange: (country: string) => void;
}

export const LocationPreferenceSelector: React.FC<LocationPreferenceSelectorProps> = ({
  currentCountry,
  onChange,
}) => {
  const countries = [
    { code: 'JM', name: 'Jamaica', flag: '🇯🇲', isLocal: true },
    { code: 'BB', name: 'Barbados', flag: '🇧🇧', isLocal: false },
    { code: 'TT', name: 'Trinidad & Tobago', flag: '🇹🇹', isLocal: false },
    { code: 'BS', name: 'Bahamas', flag: '🇧🇸', isLocal: false },
    { code: 'XX', name: 'Global', flag: '🌍', isLocal: false },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <label className="block text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">
        Your Location
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {countries.map(country => (
          <button
            key={country.code}
            onClick={() => onChange(country.name)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
              currentCountry === country.name
                ? 'border-green-600 bg-green-50 text-green-900'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
          >
            <span className="text-lg">{country.flag}</span>
            <span className="truncate">{country.name}</span>
            {country.isLocal && currentCountry === country.name && (
              <Check className="w-4 h-4 ml-auto flex-shrink-0" />
            )}
          </button>
        ))}
      </div>

      {currentCountry === 'Jamaica' && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-xs text-green-800 flex items-center gap-2">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>You'll see Jamaica resources first</span>
          </p>
        </div>
      )}
    </div>
  );
};
