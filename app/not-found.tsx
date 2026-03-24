import Link from 'next/link';
import { ArrowLeft, Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen-safe bg-background flex items-center justify-center p-6">
      <div className="bg-white border border-border/10 p-12 text-center rounded-[2.5rem] shadow-2xl shadow-black/5 max-w-md w-full space-y-6">
        <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mx-auto text-primary">
          <Compass className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <p className="text-[10px] font-mono uppercase font-bold tracking-widest text-muted">404 — Not Found</p>
          <h1 className="text-2xl font-serif italic font-bold tracking-tight">Page not found</h1>
          <p className="text-sm text-muted leading-relaxed">
            This page doesn&apos;t exist or may have been moved.
          </p>
        </div>
        <div className="flex flex-col gap-3 pt-2">
          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 bg-foreground text-background px-6 py-4 rounded-2xl text-[11px] font-mono uppercase tracking-widest font-bold hover:bg-foreground/90 transition-all"
          >
            Go to Home
          </Link>
          <Link
            href="/dashboard"
            className="w-full flex items-center justify-center gap-2 bg-white border border-border/10 px-6 py-4 rounded-2xl text-[11px] font-mono uppercase tracking-widest font-bold text-muted hover:text-foreground hover:bg-gray-50 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Pipeline
          </Link>
        </div>
      </div>
    </div>
  );
}
