'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  Mail,
  DollarSign,
  Download,
  Check,
  Loader2,
  AlertCircle,
  ChevronRight,
  Sparkles,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { ArtifactType, GeneratedArtifact, ArtifactStatus } from '@/lib/execution/artifactGenerator';

interface ArtifactGeneratorProps {
  type: ArtifactType;
  title: string;
  description: string;
  estimatedTime: string;
  onGenerate: () => Promise<void>;
  disabled?: boolean;
}

export const ArtifactGeneratorCard: React.FC<ArtifactGeneratorProps> = ({
  type,
  title,
  description,
  estimatedTime,
  onGenerate,
  disabled = false,
}) => {
  const [generating, setGenerating] = useState(false);

  const getIcon = () => {
    switch (type) {
      case 'grant':
        return FileText;
      case 'outreach':
        return Mail;
      case 'financial':
        return DollarSign;
      default:
        return FileText;
    }
  };

  const Icon = getIcon();

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await onGenerate();
    } finally {
      setGenerating(false);
    }
  };

  return (
    <motion.div
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      className={`bg-white border-2 border-gray-200 rounded-2xl p-6 transition-all ${
        disabled ? 'opacity-60 cursor-not-allowed' : 'hover:border-blue-400 hover:shadow-lg cursor-pointer'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
          <Icon className="w-6 h-6 text-blue-600" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-600 mb-3 leading-relaxed">{description}</p>

          <div className="flex items-center gap-4 mb-4">
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {estimatedTime}
            </span>
          </div>

          <button
            onClick={handleGenerate}
            disabled={disabled || generating}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              disabled || generating
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
            }`}
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Now
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

interface ArtifactViewerProps {
  artifact: GeneratedArtifact;
  onDownload: (format: 'txt' | 'docx' | 'pdf') => void;
  onCopy: () => void;
  onMarkSubmitted: () => void;
}

export const ArtifactViewer: React.FC<ArtifactViewerProps> = ({
  artifact,
  onDownload,
  onCopy,
  onMarkSubmitted,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = (status: ArtifactStatus) => {
    switch (status) {
      case 'generated':
        return { text: 'Ready', color: 'bg-blue-100 text-blue-800' };
      case 'downloaded':
        return { text: 'Downloaded', color: 'bg-green-100 text-green-800' };
      case 'submitted':
        return { text: 'Submitted', color: 'bg-purple-100 text-purple-800' };
      case 'completed':
        return { text: 'Completed', color: 'bg-emerald-100 text-emerald-800' };
      default:
        return { text: 'Draft', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const status = getStatusBadge(artifact.status);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-1">{artifact.title}</h2>
            <p className="text-sm text-blue-100">
              Generated {new Date(artifact.metadata.generatedAt).toLocaleDateString()}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${status.color}`}>
            {status.text}
          </span>
        </div>
      </div>

      {/* Missing Inputs Warning */}
      {artifact.metadata.missingInputs && artifact.metadata.missingInputs.length > 0 && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-amber-900 mb-2">
                Missing Information
              </h3>
              <ul className="text-sm text-amber-800 space-y-1">
                {artifact.metadata.missingInputs.map((input, i) => (
                  <li key={i}>• {input}</li>
                ))}
              </ul>
              <p className="text-xs text-amber-700 mt-2">
                Add these details to improve your application quality
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-6 max-h-96 overflow-y-auto">
        <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed">
          {artifact.content}
        </pre>
      </div>

      {/* Actions */}
      <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-all"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-600" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy
              </>
            )}
          </button>

          <button
            onClick={() => onDownload('txt')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-all"
          >
            <Download className="w-4 h-4" />
            Download .txt
          </button>

          <button
            onClick={() => onDownload('docx')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-all"
          >
            <Download className="w-4 h-4" />
            Download .docx
          </button>

          {artifact.status !== 'submitted' && artifact.status !== 'completed' && (
            <button
              onClick={onMarkSubmitted}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all ml-auto"
            >
              <Check className="w-4 h-4" />
              Mark as Submitted
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

interface NextActionsProps {
  actions: Array<{
    action: string;
    artifactType: ArtifactType;
    priority: 'high' | 'medium' | 'low';
    reason: string;
    estimatedTime: string;
  }>;
  onActionClick: (artifactType: ArtifactType) => void;
}

export const NextActionsPanel: React.FC<NextActionsProps> = ({ actions, onActionClick }) => {
  if (actions.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
        <div className="flex items-start gap-3">
          <Check className="w-6 h-6 text-green-600 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-semibold text-green-900 mb-1">
              You're all set!
            </h3>
            <p className="text-sm text-green-700">
              You've generated all recommended artifacts. Focus on execution now!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-blue-200 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <Sparkles className="w-6 h-6 text-blue-600" />
        <h3 className="text-xl font-semibold text-gray-900">
          Recommended Next Actions
        </h3>
      </div>

      <div className="space-y-3">
        {actions.map((action, i) => {
          const priorityColors = {
            high: 'border-red-200 bg-red-50',
            medium: 'border-amber-200 bg-amber-50',
            low: 'border-gray-200 bg-gray-50',
          };

          const priorityBadges = {
            high: 'bg-red-600 text-white',
            medium: 'bg-amber-600 text-white',
            low: 'bg-gray-600 text-white',
          };

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`border-2 rounded-xl p-4 ${priorityColors[action.priority]} cursor-pointer hover:scale-102 transition-all`}
              onClick={() => onActionClick(action.artifactType)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${priorityBadges[action.priority]}`}>
                      {action.priority}
                    </span>
                    <span className="text-xs text-gray-600">{action.estimatedTime}</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">{action.action}</h4>
                  <p className="text-sm text-gray-600">{action.reason}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

interface CompletionTrackerProps {
  totalArtifacts: number;
  completedArtifacts: number;
  artifactsByType: Record<ArtifactType, number>;
}

export const CompletionTracker: React.FC<CompletionTrackerProps> = ({
  totalArtifacts,
  completedArtifacts,
  artifactsByType,
}) => {
  const completionRate = totalArtifacts > 0 ? (completedArtifacts / totalArtifacts) * 100 : 0;

  return (
    <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Progress Tracker</h3>
        <div className="text-2xl font-bold">
          {Math.round(completionRate)}%
        </div>
      </div>

      <div className="mb-4">
        <div className="bg-blue-800/50 rounded-full h-3 overflow-hidden">
          <motion.div
            className="bg-white h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${completionRate}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-blue-200 mb-1">Created</p>
          <p className="text-2xl font-bold">{totalArtifacts}</p>
        </div>
        <div>
          <p className="text-blue-200 mb-1">Submitted</p>
          <p className="text-2xl font-bold">{completedArtifacts}</p>
        </div>
      </div>

      {totalArtifacts > 0 && completedArtifacts === 0 && (
        <div className="mt-4 bg-blue-800/50 rounded-lg p-3">
          <p className="text-sm text-blue-100">
            💡 <strong>Tip:</strong> Download and submit your first artifact to get started!
          </p>
        </div>
      )}
    </div>
  );
};
