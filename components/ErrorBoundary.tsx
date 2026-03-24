'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="bg-white border border-border/10 rounded-[2.5rem] shadow-2xl shadow-black/5 max-w-md w-full p-10 text-center space-y-6">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <div className="space-y-2">
              <h2 className="font-serif italic text-2xl font-bold tracking-tight">Something went wrong</h2>
              <p className="text-sm text-muted font-medium leading-relaxed">
                The AI or database ran into a problem. Your data is safe — refresh to try again.
              </p>
              {this.state.message && (
                <p className="text-[10px] font-mono text-red-700 bg-red-50 px-3 py-2 rounded-lg mt-2 text-left break-words">
                  {this.state.message}
                </p>
              )}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 bg-foreground text-background px-8 py-4 rounded-2xl text-[11px] font-mono uppercase tracking-widest font-bold hover:bg-foreground/90 transition-all shadow-xl shadow-foreground/10"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
