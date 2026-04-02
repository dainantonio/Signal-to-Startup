import he from 'he';

/**
 * cleanText — decodes all HTML entities and normalises whitespace/unicode.
 * Apply to every title, snippet, or short string from an RSS feed.
 */
export function cleanText(raw: string): string {
  if (!raw) return '';
  if (typeof raw !== 'string') {
    try { return String(raw).trim(); } catch { return ''; }
  }

  // Decode all HTML entities (&#8217; &#038; &amp; etc.)
  let t = he.decode(raw);

  // Safety-net for anything he misses
  t = t.replace(/&#8217;/g, "'");
  t = t.replace(/&#8216;/g, "'");
  t = t.replace(/&#8220;/g, '"');
  t = t.replace(/&#8221;/g, '"');
  t = t.replace(/&#8212;/g, '—');
  t = t.replace(/&#8211;/g, '–');
  t = t.replace(/&#038;/g,  '&');
  t = t.replace(/&amp;/g,   '&');
  t = t.replace(/&nbsp;/g,  ' ');
  t = t.replace(/&#160;/g,  ' ');
  t = t.replace(/&lt;/g,    '<');
  t = t.replace(/&gt;/g,    '>');
  t = t.replace(/&quot;/g,  '"');
  t = t.replace(/&#39;/g,   "'");
  t = t.replace(/&apos;/g,  "'");

  // Strip zero-width / control characters
  t = t.replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ');
  t = t.replace(/[\u200B-\u200D\uFEFF]/g, '');
  t = t.replace(/\u00A0/g, ' ');

  // Normalise smart quotes and dashes to ASCII equivalents
  t = t.replace(/[\u2018\u2019]/g, "'");
  t = t.replace(/[\u201C\u201D]/g, '"');
  t = t.replace(/[\u2013\u2014]/g, '-');

  // Collapse extra whitespace
  t = t.replace(/\s+/g, ' ').trim();

  return t;
}

/**
 * cleanArticleBody — extends cleanText with additional cleanup for long-form
 * article content: strips markdown, URLs, code lines, and social noise.
 * Apply to the article body returned from fetch-url, NOT to titles.
 */
export function cleanArticleBody(raw: string): string {
  if (!raw) return '';
  if (typeof raw !== 'string') return '';

  let t = cleanText(raw);

  // Strip markdown syntax
  t = t.replace(/#{1,6}\s/g, '');
  t = t.replace(/\*\*(.*?)\*\*/g, '$1');
  t = t.replace(/\*(.*?)\*/g, '$1');
  t = t.replace(/`{1,3}([\s\S]*?)`{1,3}/g, '$1');
  t = t.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  t = t.replace(/!\[.*?\]\(.*?\)/g, '');

  // Strip URLs
  t = t.replace(/https?:\/\/[^\s]+/g, '');
  t = t.replace(/www\.[^\s]+/g, '');

  const NOISE_PATTERNS = [
    /follow us on/i, /subscribe to/i, /sign up for/i,
    /share this/i, /advertisement/i, /sponsored/i,
    /read more:/i, /related:/i, /see also:/i,
  ];

  const CODE_PATTERNS = /^(\/\/|import\s|export\s|const\s|let\s|var\s|function\s|class\s|return\s|if\s*\(|for\s*\(|while\s*\(|<\/|<[a-z]|\{|\}|=>|;$)/;

  const lines = t.split('\n');
  const kept = lines.filter(line => {
    const trimmed = line.trim();
    if (trimmed.length < 20) return false;
    if (CODE_PATTERNS.test(trimmed)) return false;
    if (NOISE_PATTERNS.some(p => p.test(trimmed))) return false;
    return true;
  });

  t = kept.join('\n');
  t = t.replace(/\n{3,}/g, '\n\n').trim();

  // Trim at sentence boundary ≤ 3000 chars
  if (t.length > 3000) {
    const cut = t.lastIndexOf('.', 3000);
    t = cut > 2000 ? t.slice(0, cut + 1) : t.slice(0, 3000);
  }

  return t;
}
