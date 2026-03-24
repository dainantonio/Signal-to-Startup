import { XMLParser } from 'fast-xml-parser';
import { RSS_SOURCES, PAYWALL_DOMAINS } from './rss-sources';
import type { SectorKey } from '@/components/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RSSFeedItem {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  snippet: string;
  sector: SectorKey;
  market: string;
  strength: number;
  category: string;
  color: string;
  signalScore?: number;
  isLocalSource?: boolean;
  isGlobalMention?: boolean;
}

export interface FetchRSSOptions {
  markets: string[];
  sectors: string[];
  recency: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STOP_WORDS = new Set([
  'the','a','an','in','of','to','is','and','or','for','with','on','at',
  'by','from','as','are','was','were','be','been','being','it','its',
  'this','that','these','those','will','has','have','had','but','not',
]);

function stripHtml(raw: string): string {
  return raw
    .replace(/<!\[CDATA\[/g, '')
    .replace(/\]\]>/g, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]{2,6};/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function safeIso(dateStr: string | undefined): string {
  if (!dateStr) return new Date().toISOString();
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

function tierBaseScore(tier: 1 | 2 | 3): number {
  if (tier === 1) return 8;
  if (tier === 2) return 6;
  return 4;
}

function recencyBonus(publishedAt: string): number {
  const ageHours = (Date.now() - new Date(publishedAt).getTime()) / 3_600_000;
  if (ageHours < 6) return 2;
  if (ageHours < 24) return 1;
  return 0;
}

function strengthScore(tier: 1 | 2 | 3, publishedAt: string): number {
  return Math.min(10, tierBaseScore(tier) + recencyBonus(publishedAt));
}

const OPPORTUNITY_KEYWORDS = [
  'shortage', 'gap', 'lack of', 'demand for', 'surge in',
  'crisis', 'disruption', 'new regulation', 'policy change',
  'funding', 'grant', 'investment', 'billion', 'million',
  'startup', 'opportunity', 'growth', 'emerging', 'launch',
];

const TIER1_SOURCES = ['Reuters', 'TechCrunch', 'CNBC', 'BBC', 'Guardian', 'Wired'];
const TIER2_SOURCES = ['Fast Company', 'Inc Magazine', 'Entrepreneur', 'VentureBeat', 'The Verge'];

function calculateSignalScore(item: RSSFeedItem): number {
  let score = 50;

  const hoursAgo = (Date.now() - new Date(item.publishedAt).getTime()) / 3_600_000;
  if (hoursAgo < 2) score += 20;
  else if (hoursAgo < 6) score += 15;
  else if (hoursAgo < 24) score += 8;

  if (TIER1_SOURCES.some(s => item.source.includes(s))) score += 15;
  else if (TIER2_SOURCES.some(s => item.source.includes(s))) score += 8;

  const text = `${item.title} ${item.snippet}`.toLowerCase();
  const hits = OPPORTUNITY_KEYWORDS.filter(k => text.includes(k)).length;
  score += Math.min(hits * 5, 15);

  if (item.sector === 'funding') score += 10;
  if (item.sector === 'policy') score += 8;

  return Math.min(Math.max(score, 10), 99);
}

function titleTokens(title: string): Set<string> {
  return new Set(
    title.toLowerCase().split(/\W+/).filter(w => w.length > 2 && !STOP_WORDS.has(w))
  );
}

function isTitleDuplicate(a: string, b: string): boolean {
  const ta = titleTokens(a);
  const tb = titleTokens(b);
  if (ta.size === 0 || tb.size === 0) return false;
  const shared = [...ta].filter(w => tb.has(w)).length;
  return shared / Math.max(ta.size, tb.size) > 0.6;
}

function recencyCutoff(recency: string): Date {
  const now = Date.now();
  if (recency === '24h') return new Date(now - 24 * 3_600_000);
  if (recency === '3d')  return new Date(now - 3 * 24 * 3_600_000);
  return new Date(now - 7 * 24 * 3_600_000);
}

// ---------------------------------------------------------------------------
// Per-feed fetcher
// ---------------------------------------------------------------------------

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (name) => ['item', 'entry', 'link'].includes(name),
  parseTagValue: true,
  trimValues: true,
  cdataPropName: '#cdata',
});

function extractText(field: unknown): string {
  if (typeof field === 'string') return field;
  if (field && typeof field === 'object') {
    const f = field as Record<string, unknown>;
    if (typeof f['#text'] === 'string') return f['#text'];
    if (typeof f['#cdata'] === 'string') return f['#cdata'];
  }
  return '';
}

async function fetchOneFeed(source: typeof RSS_SOURCES[0]): Promise<RSSFeedItem[]> {
  const res = await fetch(source.url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; SignalBot/1.0)',
      'Accept': 'application/rss+xml, application/xml, text/xml, */*',
    },
    signal: AbortSignal.timeout(8_000),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  const parsed = xmlParser.parse(text);

  const items: RSSFeedItem[] = [];

  // RSS 2.0 format
  const rssItems: unknown[] = parsed?.rss?.channel?.item ?? [];
  for (const raw of rssItems) {
    const item = raw as Record<string, unknown>;
    const title = stripHtml(extractText(item.title));
    if (!title) continue;

    // link can be a string or an object
    let url = '';
    if (typeof item.link === 'string') url = item.link;
    else if (Array.isArray(item.link) && item.link.length > 0) url = String(item.link[0]);
    else if (item.guid) url = extractText(item.guid) || String(item.guid);
    if (!url || url === 'true' || url === 'false') url = '';

    const pubDate = extractText(item.pubDate) || extractText(item['dc:date']) || '';
    const publishedAt = safeIso(pubDate);
    const snippet = stripHtml(extractText(item.description) || extractText(item.summary || '')).substring(0, 200);

    const rssItem: RSSFeedItem = {
      title, url, source: source.name, publishedAt, snippet,
      sector: source.sector, market: source.market,
      strength: strengthScore(source.tier, publishedAt),
      category: source.sector, color: '',
    };
    rssItem.signalScore = calculateSignalScore(rssItem);
    items.push(rssItem);
  }

  // Atom format
  const atomEntries: unknown[] = parsed?.feed?.entry ?? [];
  for (const raw of atomEntries) {
    const entry = raw as Record<string, unknown>;
    const title = stripHtml(extractText(entry.title));
    if (!title) continue;

    let url = '';
    const linkField = entry.link;
    if (typeof linkField === 'string') url = linkField;
    else if (Array.isArray(linkField)) {
      const alt = (linkField as Record<string, string>[]).find(
        l => !l['@_rel'] || l['@_rel'] === 'alternate'
      );
      url = alt?.['@_href'] ?? (linkField[0] as Record<string, string>)?.['@_href'] ?? '';
    } else if (linkField && typeof linkField === 'object') {
      url = (linkField as Record<string, string>)['@_href'] ?? '';
    }

    const pubDate = extractText(entry.published) || extractText(entry.updated) || '';
    const publishedAt = safeIso(pubDate);
    const snippet = stripHtml(extractText(entry.summary) || extractText(entry.content || '')).substring(0, 200);

    const atomItem: RSSFeedItem = {
      title, url, source: source.name, publishedAt, snippet,
      sector: source.sector, market: source.market,
      strength: strengthScore(source.tier, publishedAt),
      category: source.sector, color: '',
    };
    atomItem.signalScore = calculateSignalScore(atomItem);
    items.push(atomItem);
  }

  return items;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function fetchRSSFeeds(options: FetchRSSOptions): Promise<RSSFeedItem[]> {
  const { markets, sectors, recency } = options;

  // Match sources that belong to any of the requested markets AND sectors.
  // Always include 'global' as a fallback market.
  const effectiveMarkets = [...new Set([...markets, 'global'])];
  const sources = RSS_SOURCES.filter(
    s => effectiveMarkets.includes(s.market) && sectors.includes(s.sector)
  );

  // If nothing matches (e.g. no africa+health sources), fall back to global only
  const activeSources = sources.length > 0
    ? sources
    : RSS_SOURCES.filter(s => sectors.includes(s.sector));

  const cutoff = recencyCutoff(recency);

  // Fetch all feeds in parallel — one failure never blocks the rest
  const results = await Promise.allSettled(activeSources.map(fetchOneFeed));

  const allItems: RSSFeedItem[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      allItems.push(...result.value);
    }
    // Rejected feeds are silently skipped
  }

  // Filter out paywalled articles by domain
  const beforePaywallFilter = allItems.length;
  const noPaywall = allItems.filter(item => {
    if (!item.url) return true;
    try {
      const hostname = new URL(item.url).hostname.replace(/^www\./, '');
      return !PAYWALL_DOMAINS.some(d => hostname === d || hostname.endsWith(`.${d}`));
    } catch {
      return true;
    }
  });
  const removed = beforePaywallFilter - noPaywall.length;
  if (removed > 0) console.log(`[PAYWALL FILTER] removed ${removed} paywalled articles`);

  // Filter by recency window
  const recent = noPaywall.filter(item => {
    try { return new Date(item.publishedAt) >= cutoff; } catch { return false; }
  });

  // Deduplicate: URL → then title similarity
  const seenUrls = new Set<string>();
  const deduped: RSSFeedItem[] = [];

  for (const item of recent) {
    if (item.url && seenUrls.has(item.url)) continue;
    if (deduped.some(existing => isTitleDuplicate(item.title, existing.title))) continue;
    if (item.url) seenUrls.add(item.url);
    deduped.push(item);
  }

  // Sort newest first
  return deduped.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}
