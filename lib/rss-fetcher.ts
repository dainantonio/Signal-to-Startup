import { XMLParser } from 'fast-xml-parser';
import { RSS_SOURCES, BLOCKED_DOMAINS, SPAM_TITLE_PATTERNS } from './rss-sources';
import { cleanText } from './text-cleaner';
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
  market: string;   // single market — 'global' | 'caribbean' | 'africa' | 'uk' | 'latam'
  sectors: string[];
  recency: string;
  countryTags?: string[];
}

export interface FetchRSSResult {
  items: RSSFeedItem[];
  duplicatesRemoved: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#160;/g, ' ')
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

function strengthScore(tier: 1 | 2 | 3, publishedAt: string): number {
  const ageHours = (Date.now() - new Date(publishedAt).getTime()) / 3_600_000;
  const tierBase = tier === 1 ? 8 : tier === 2 ? 6 : 4;
  const recency = ageHours < 6 ? 2 : ageHours < 24 ? 1 : 0;
  return Math.min(10, tierBase + recency);
}

const OPPORTUNITY_KEYWORDS = [
  'shortage', 'gap', 'lack of', 'demand for', 'surge in',
  'crisis', 'disruption', 'new regulation', 'policy change',
  'funding', 'grant', 'investment', 'billion', 'million',
  'startup', 'opportunity', 'growth', 'emerging', 'launch',
];

const BUSINESS_KEYWORDS = [
  'business', 'startup', 'entrepreneur', 'market', 'investment',
  'funding', 'revenue', 'growth', 'launch', 'tech', 'company',
  'industry', 'economy', 'policy', 'regulation', 'innovation',
  'grant', 'loan', 'capital', 'venture', 'founder', 'product',
  'service', 'consumer', 'demand', 'supply', 'trade', 'export',
  'import',
];

function calculateSignalScore(item: RSSFeedItem, sourceTier: 1 | 2 | 3): number {
  let score = 40;

  const hoursAgo = (Date.now() - new Date(item.publishedAt).getTime()) / 3_600_000;
  if (hoursAgo < 2) score += 15;
  else if (hoursAgo < 6) score += 10;
  else if (hoursAgo < 24) score += 5;

  // Tier boost — tier 1 sources get +10
  if (sourceTier === 1) score += 10;
  else if (sourceTier === 2) score += 5;

  const text = `${item.title} ${item.snippet}`.toLowerCase();
  const hits = OPPORTUNITY_KEYWORDS.filter(k => text.includes(k)).length;
  score += Math.min(hits * 3, 10);

  if (item.sector === 'funding') score += 8;
  if (item.sector === 'policy') score += 5;

  return Math.min(Math.max(score, 10), 99);
}

function normalizeUrl(url: string): string {
  try {
    return url
      .toLowerCase()
      .split('?')[0]
      .split('#')[0]
      .replace(/\/$/, '')
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '');
  } catch {
    return url.toLowerCase();
  }
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 60);
}

function hasTitleOverlap(a: string, b: string): boolean {
  const wordsA = new Set(a.split(' ').filter(w => w.length > 4));
  const wordsB = new Set(b.split(' ').filter(w => w.length > 4));
  if (wordsA.size === 0) return false;
  const overlap = [...wordsA].filter(w => wordsB.has(w)).length;
  return overlap / wordsA.size > 0.7;
}

function deduplicateArticles(items: RSSFeedItem[]): { deduped: RSSFeedItem[]; removed: number } {
  const seenUrls = new Set<string>();
  const seenTitles: string[] = [];
  const deduped: RSSFeedItem[] = [];

  for (const item of items) {
    const normUrl = item.url ? normalizeUrl(item.url) : '';
    const normTitle = normalizeTitle(item.title);

    if (normUrl && seenUrls.has(normUrl)) continue;
    if (seenTitles.includes(normTitle)) continue;
    if (seenTitles.some(t => hasTitleOverlap(normTitle, t))) continue;

    if (normUrl) seenUrls.add(normUrl);
    seenTitles.push(normTitle);
    deduped.push(item);
  }

  return { deduped, removed: items.length - deduped.length };
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
    const title = cleanText(stripHtml(extractText(item.title)));
    if (!title) continue;

    let url = '';
    if (typeof item.link === 'string') url = item.link;
    else if (Array.isArray(item.link) && item.link.length > 0) url = String(item.link[0]);
    else if (item.guid) url = extractText(item.guid) || String(item.guid);
    if (!url || url === 'true' || url === 'false') url = '';

    const pubDate = extractText(item.pubDate) || extractText(item['dc:date']) || '';
    const publishedAt = safeIso(pubDate);
    const snippet = cleanText(stripHtml(extractText(item.description) || extractText(item.summary || ''))).substring(0, 220);

    const rssItem: RSSFeedItem = {
      title, url, source: source.name, publishedAt, snippet,
      sector: source.sector, market: source.market,
      strength: strengthScore(source.tier, publishedAt),
      category: source.sector, color: '',
    };
    rssItem.signalScore = calculateSignalScore(rssItem, source.tier);
    items.push(rssItem);
  }

  // Atom format
  const atomEntries: unknown[] = parsed?.feed?.entry ?? [];
  for (const raw of atomEntries) {
    const entry = raw as Record<string, unknown>;
    const title = cleanText(stripHtml(extractText(entry.title)));
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
    const snippet = cleanText(stripHtml(extractText(entry.summary) || extractText(entry.content || ''))).substring(0, 220);

    const atomItem: RSSFeedItem = {
      title, url, source: source.name, publishedAt, snippet,
      sector: source.sector, market: source.market,
      strength: strengthScore(source.tier, publishedAt),
      category: source.sector, color: '',
    };
    atomItem.signalScore = calculateSignalScore(atomItem, source.tier);
    items.push(atomItem);
  }

  return items;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function fetchRSSFeeds(options: FetchRSSOptions): Promise<FetchRSSResult> {
  const { market, sectors, recency, countryTags = [] } = options;

  // Market isolation: requested market + global sources only
  const sourcesToFetch = RSS_SOURCES.filter(
    s => (s.market === market || s.market === 'global') && sectors.includes(s.sector)
  );

  // Fallback: if nothing matches (e.g. africa+realestate), use global only
  const activeSources = sourcesToFetch.length > 0
    ? sourcesToFetch
    : RSS_SOURCES.filter(s => s.market === 'global' && sectors.includes(s.sector));

  const cutoff = recencyCutoff(recency);

  // Fetch all feeds in parallel — one failure never blocks the rest
  const results = await Promise.allSettled(activeSources.map(fetchOneFeed));

  let allItems: RSSFeedItem[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') allItems.push(...result.value);
  }

  // 1. Block by domain
  allItems = allItems.filter(item => {
    const url = (item.url || '').toLowerCase();
    return !BLOCKED_DOMAINS.some(d => url.includes(d));
  });

  // 2. Block spam titles
  allItems = allItems.filter(item => {
    const title = item.title.toLowerCase();
    return !SPAM_TITLE_PATTERNS.some(p => title.includes(p));
  });

  // 3. Business relevance — must have at least one keyword
  allItems = allItems.filter(item => {
    const text = `${item.title} ${item.snippet}`.toLowerCase();
    return BUSINESS_KEYWORDS.some(k => text.includes(k));
  });

  // 4. Recency window
  allItems = allItems.filter(item => {
    try { return new Date(item.publishedAt) >= cutoff; } catch { return false; }
  });

  // 4.5. STRICT GEOGRAPHIC FILTERING
  // If the user provided specific country tags AND they are NOT looking purely for "global" US trends,
  // we force "global" sources to actually mention their local country/region to prevent US drift.
  if (countryTags.length > 0 && market !== 'global') {
    const geoKeywords = Array.from(new Set([
      ...countryTags.map(t => t.toLowerCase()),
      market.toLowerCase()
    ]));
    
    allItems = allItems.filter(item => {
      // If the source is inherently local (e.g., Vanguard Nigeria), let it through.
      if (item.market === market && item.market !== 'global') return true;
      
      // If the source is global (TechCrunch), it MUST explicitly mention the target region or country.
      const text = `${item.title} ${item.snippet}`.toLowerCase();
      return geoKeywords.some(kw => text.includes(kw));
    });
  }

  // 5. Deduplicate
  const { deduped, removed: dedupRemoved } = deduplicateArticles(allItems);

  // 6. Sort by signalScore descending, cap at 30
  const sorted = deduped
    .sort((a, b) => (b.signalScore ?? 0) - (a.signalScore ?? 0))
    .slice(0, 30);

  return { items: sorted, duplicatesRemoved: dedupRemoved };
}

// Convenience: fetch all markets at once (used by the monitor agent)
export async function fetchAllMarkets(options: Omit<FetchRSSOptions, 'market'>): Promise<FetchRSSResult> {
  const markets = ['global', 'caribbean', 'africa', 'uk', 'latam'] as const;
  const results = await Promise.allSettled(
    markets.map(m => fetchRSSFeeds({ ...options, market: m }))
  );

  const allItems: RSSFeedItem[] = [];
  let totalDups = 0;
  for (const r of results) {
    if (r.status === 'fulfilled') {
      allItems.push(...r.value.items);
      totalDups += r.value.duplicatesRemoved;
    }
  }

  // Final dedup across markets
  const { deduped, removed } = deduplicateArticles(allItems);
  return { items: deduped, duplicatesRemoved: totalDups + removed };
}
