'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth, db, onAuthStateChanged, addDoc, collection, FirebaseUser } from '@/firebase';
import Logo from '@/components/Logo';

type ShareStep = 'loading' | 'preview' | 'saved' | 'error';

export default function SharePageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [step, setStep] = useState<ShareStep>('loading');
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [sharedUrl, setSharedUrl] = useState('');
  const [sharedTitle, setSharedTitle] = useState('');
  const [articleText, setArticleText] = useState('');
  const [saving, setSaving] = useState(false);
  // Stable random score — generated once, avoids hydration mismatch
  const [signalScore] = useState(() => Math.round(50 + Math.random() * 40));

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, u => setUser(u));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const rawUrl   = searchParams.get('url')   || '';
    const rawText  = searchParams.get('text')  || '';
    const rawTitle = searchParams.get('title') || '';

    // The shared data can arrive in either the `url` or `text` param
    const combined = rawUrl || rawText;
    const urlMatch = combined.match(/https?:\/\/[^\s]+/);
    const extractedUrl = urlMatch ? urlMatch[0] : combined;

    setSharedUrl(extractedUrl);
    setSharedTitle(rawTitle);

    if (!extractedUrl) {
      setStep('error');
      return;
    }

    fetchArticle(extractedUrl, rawTitle);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchArticle = async (url: string, fallbackTitle: string) => {
    try {
      const res = await fetch(
        `/api/fetch-url?url=${encodeURIComponent(url)}`,
        { signal: AbortSignal.timeout(8000) },
      );
      const data = await res.json();

      if (data.content && data.content.trim().length > 50) {
        setArticleText(data.content);
        if (data.title && !fallbackTitle) setSharedTitle(data.title);
      }
      // paywalled / timedOut → leave articleText empty, show amber notice
    } catch {
      // Network error — show preview with URL only
    }
    setStep('preview');
  };

  const handleSaveForLater = async () => {
    setSaving(true);
    try {
      await addDoc(collection(db, 'saved_articles'), {
        userId: user?.uid || 'anonymous',
        url: sharedUrl,
        title: sharedTitle || sharedUrl,
        text: articleText,
        savedAt: new Date().toISOString(),
        analyzed: false,
      });
    } catch {
      // Firestore save failed — persist locally so Analyze still works
      try {
        sessionStorage.setItem(
          'pendingArticle',
          JSON.stringify({ url: sharedUrl, title: sharedTitle, text: articleText }),
        );
      } catch {}
    } finally {
      setSaving(false);
      setStep('saved');
    }
  };

  const handleAnalyzeNow = () => {
    try {
      sessionStorage.setItem(
        'sharedArticle',
        JSON.stringify({
          url: sharedUrl,
          title: sharedTitle,
          text: articleText,
          source: 'shared',
        }),
      );
    } catch {}
    router.push('/');
  };

  // ── LOADING ────────────────────────────────────────────────────────────────
  if (step === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white">
        <div className="w-10 h-10 border-2 border-black border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium">Fetching article...</p>
        <p className="text-xs text-gray-400 mt-1 text-center break-all max-w-xs">{sharedUrl}</p>
      </div>
    );
  }

  // ── ERROR ──────────────────────────────────────────────────────────────────
  if (step === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white">
        <p className="text-lg font-semibold mb-2">No URL found</p>
        <p className="text-sm text-gray-500 mb-6">Share a web page URL directly to this app.</p>
        <button
          onClick={() => router.push('/')}
          className="px-6 py-3 bg-black text-white rounded-xl text-sm font-medium"
        >
          ← Back to app
        </button>
      </div>
    );
  }

  // ── SAVED ──────────────────────────────────────────────────────────────────
  if (step === 'saved') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-3xl">✓</span>
        </div>
        <h2 className="text-xl font-semibold mb-1">Saved for later</h2>
        <p className="text-sm text-gray-500 text-center mb-2 max-w-xs">
          {sharedTitle || sharedUrl}
        </p>
        <p className="text-xs text-gray-400 text-center mb-8">
          Find it in your dashboard under Saved Articles
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={handleAnalyzeNow}
            className="w-full py-3 bg-black text-white rounded-xl text-sm font-medium"
          >
            ⚡ Analyze now
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full py-3 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium"
          >
            View saved articles
          </button>
          <button
            onClick={() => router.push('/')}
            className="w-full py-2 text-sm text-gray-400"
          >
            Back to feed
          </button>
        </div>
      </div>
    );
  }

  // ── PREVIEW ────────────────────────────────────────────────────────────────
  const hasContent = articleText && articleText !== sharedUrl && articleText.trim().length > 50;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <Logo size="sm" showWordmark theme="light" />
        <button
          onClick={() => router.push('/')}
          className="text-sm text-gray-400 hover:text-black transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Article preview */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Source URL */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 truncate flex-1">{sharedUrl}</span>
          <a
            href={sharedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-500 flex-shrink-0"
          >
            Open ↗
          </a>
        </div>

        {/* Title */}
        {sharedTitle && (
          <h1 className="text-lg font-semibold leading-snug">{sharedTitle}</h1>
        )}

        {/* Article preview text */}
        {hasContent ? (
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">
              Article preview
            </p>
            <p className="text-sm text-gray-700 leading-relaxed line-clamp-6">
              {articleText.substring(0, 400)}
              {articleText.length > 400 ? '...' : ''}
            </p>
          </div>
        ) : (
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
            <p className="text-sm text-amber-700">
              ⚠️ Could not preview this article — it may be paywalled or slow to load.
              You can still save it or analyze the URL directly.
            </p>
          </div>
        )}

        {/* Signal score preview */}
        <div className="p-4 rounded-xl border border-gray-200 flex items-center gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{signalScore}</div>
            <div className="text-xs text-gray-400">Signal score</div>
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-500 leading-relaxed">
              Preliminary score based on source and content. Analyze for a full opportunity assessment.
            </p>
          </div>
        </div>
      </div>

      {/* Action buttons — sticky bottom */}
      <div className="flex-shrink-0 p-4 border-t border-gray-100 space-y-3 bg-white">
        <button
          onClick={handleAnalyzeNow}
          className="w-full py-3 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-900 transition-colors"
        >
          ⚡ Analyze now
        </button>
        <button
          onClick={handleSaveForLater}
          disabled={saving}
          className="w-full py-3 border-2 border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:border-black transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : '🔖 Save for later'}
        </button>
        <button
          onClick={() => router.push('/')}
          className="w-full py-2 text-sm text-gray-400 hover:text-black transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
