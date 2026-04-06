/**
 * Signal Analyzer Utility
 * 
 * Provides clustering and "Strong Signal" identification logic.
 * Helps identify when multiple signals point to the same emerging trend.
 */

export interface SignalItem {
  id?: string;
  title: string;
  snippet: string;
  url: string;
  source: string;
  sector: string;
  userScore: number;
  [key: string]: any;
}

/**
 * Calculates Jaccard similarity between two sets of words.
 * Filters out common stop words and short words.
 */
function calculateSimilarity(textA: string, textB: string): number {
  const stopWords = new Set(['the', 'is', 'at', 'on', 'in', 'for', 'to', 'and', 'a', 'an', 'it', 'this', 'that', 'with', 'by']);
  const getWords = (text: string) => new Set(
    text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length >= 2 && !stopWords.has(w))
  );

  const wordsA = getWords(textA);
  const wordsB = getWords(textB);

  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  const intersection = new Set([...wordsA].filter(w => wordsB.has(w)));
  const union = new Set([...wordsA, ...wordsB]);

  return intersection.size / union.size;
}

/**
 * Clusters signals based on similarity.
 * Returns an array of signal groups (clusters).
 */
export function clusterSignals(signals: SignalItem[], threshold = 0.15): SignalItem[][] {
  const clusters: SignalItem[][] = [];
  const processed = new Set<number>();

  for (let i = 0; i < signals.length; i++) {
    if (processed.has(i)) continue;

    const currentCluster = [signals[i]];
    processed.add(i);

    for (let j = i + 1; j < signals.length; j++) {
      if (processed.has(j)) continue;

      const similarity = calculateSimilarity(
        `${signals[i].title} ${signals[i].snippet}`,
        `${signals[j].title} ${signals[j].snippet}`
      );

      if (similarity >= threshold) {
        currentCluster.push(signals[j]);
        processed.add(j);
      }
    }

    clusters.push(currentCluster);
  }

  return clusters;
}

/**
 * Identifies "Strong Signals" from a list of fetched items.
 * A signal is "strong" if:
 * 1. Its individual score is very high (> 85).
 * 2. It is part of a cluster of 2 or more related reports (trend confirmation).
 */
export function identifyStrongSignals(signals: SignalItem[]): {
  strongSignals: SignalItem[];
  clusters: SignalItem[][];
} {
  const clusters = clusterSignals(signals);
  const strongSignals: SignalItem[] = [];

  // Rules:
  // 1. High individual score
  const highScoring = signals.filter(s => s.userScore >= 85);
  strongSignals.push(...highScoring);

  // 2. Trend confirmation (part of a cluster)
  const clusteredSignals = clusters
    .filter(c => c.length >= 2)
    .flatMap(c => c);
  
  strongSignals.push(...clusteredSignals);

  // Deduplicate by URL
  const uniqueStrong = Array.from(new Map(strongSignals.map(s => [s.url, s])).values());

  return {
    strongSignals: uniqueStrong,
    clusters: clusters.filter(c => c.length >= 2)
  };
}
