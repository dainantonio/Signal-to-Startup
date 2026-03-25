import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { PAYWALL_DOMAINS } from '@/lib/rss-sources';
import { cleanText, cleanArticleBody } from '@/lib/text-cleaner';

// ---------------------------------------------------------------------------
// Paywall signals in page HTML
// ---------------------------------------------------------------------------
const PAYWALL_STRINGS = [
  'subscribe to read',
  'subscription required',
  'sign in to read',
  'premium content',
  'subscriber only',
  'subscribers only',
  'create an account to',
  'unlock this article',
  'paywall',
  'paid subscribers',
  'become a member',
];

function isPaywalled(status: number, html: string, extractedText: string): boolean {
  if ([401, 402, 403].includes(status)) return true;
  const lower = html.toLowerCase();
  if (PAYWALL_STRINGS.some(s => lower.includes(s))) return true;
  if (extractedText.trim().length < 200) return true;
  return false;
}

function isDomainPaywalled(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '');
    return PAYWALL_DOMAINS.some(d => hostname === d || hostname.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// HTML entity decoder (no external package needed)
// ---------------------------------------------------------------------------
function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

// ---------------------------------------------------------------------------
// Deep text cleaner
// ---------------------------------------------------------------------------
function cleanArticleText(raw: string): string {
  let text = decodeEntities(raw);

  // Remove zero-width and control characters
  text = text.replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ');
  text = text.replace(/[\u200B-\u200D\uFEFF]/g, '');

  // Normalize smart quotes and dashes
  text = text.replace(/[\u2018\u2019]/g, "'");
  text = text.replace(/[\u201C\u201D]/g, '"');
  text = text.replace(/[\u2013\u2014]/g, '-');
  text = text.replace(/\u00A0/g, ' ');

  // Strip markdown syntax
  text = text.replace(/#{1,6}\s/g, '');
  text = text.replace(/\*\*(.*?)\*\*/g, '$1');
  text = text.replace(/\*(.*?)\*/g, '$1');
  text = text.replace(/`{1,3}([\s\S]*?)`{1,3}/g, '$1');
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  text = text.replace(/!\[.*?\]\(.*?\)/g, '');
  text = text.replace(/^\s*[-*+]\s/gm, '');
  text = text.replace(/^\s*\d+\.\s/gm, '');
  text = text.replace(/^>\s/gm, '');
  text = text.replace(/^-{3,}$/gm, '');
  text = text.replace(/\|\s.*?\s\|/g, '');

  // Strip code blocks
  text = text.replace(/```[\s\S]*?```/g, '');
  text = text.replace(/`[^`]+`/g, '');

  // Strip URLs
  text = text.replace(/https?:\/\/[^\s]+/g, '');
  text = text.replace(/www\.[^\s]+/g, '');

  // Strip tabs, collapse spaces
  text = text.replace(/\t/g, ' ');
  text = text.replace(/ {2,}/g, ' ');

  // Process line by line
  const lines = text.split('\n');
  const cleaned: string[] = [];

  const CODE_PATTERNS = /^(\/\/|import\s|export\s|const\s|let\s|var\s|function\s|class\s|return\s|if\s*\(|for\s*\(|while\s*\(|<\/|<[a-z]|\{|\}|=>|;$)/;
  const NOISE_PATTERNS = /follow us on|subscribe to|sign up for|share this|tweet this|advertisement|sponsored|promoted|read more:|related:|see also:/i;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.length < 20) continue;                 // too short to be content
    if (CODE_PATTERNS.test(trimmed)) continue;          // looks like code
    if (NOISE_PATTERNS.test(trimmed)) continue;         // social / ad noise
    if (/^\d+$/.test(trimmed)) continue;               // just a number
    cleaned.push(trimmed);
  }

  text = cleaned.join('\n\n');
  text = text.replace(/\n{3,}/g, '\n\n').trim();

  // Trim to 3000 chars at last sentence boundary
  if (text.length > 3000) {
    const cut = text.lastIndexOf('.', 3000);
    text = cut > 2000 ? text.slice(0, cut + 1) : text.slice(0, 3000);
  }

  return text;
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  // Block known paywall domains immediately — no need to fetch
  if (isDomainPaywalled(url)) {
    return NextResponse.json({
      paywalled: true,
      message: 'This article is behind a paywall',
    });
  }

  // 8-second hard timeout
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    clearTimeout(timeout);

    // ── PDF ────────────────────────────────────────────────────────────────
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/pdf')) {
      try {
        const buffer = Buffer.from(await response.arrayBuffer());
        const pdfMod = await import('pdf-parse');
        const pdfParse = (pdfMod.default ?? pdfMod) as (buf: Buffer) => Promise<{ text: string }>;
        const data = await pdfParse(buffer);
        const text = data.text.replace(/\f/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
        if (!text) {
          return NextResponse.json({ error: 'This PDF could not be read. It may be scanned or image-based.' }, { status: 422 });
        }
        return NextResponse.json({ content: `SOURCE: ${url}\n\n${text.substring(0, 15000)}` });
      } catch (pdfErr: unknown) {
        const msg = pdfErr instanceof Error ? pdfErr.message.toLowerCase() : '';
        return NextResponse.json({
          error: msg.includes('password') || msg.includes('encrypt')
            ? 'This PDF is password-protected.'
            : 'This PDF could not be read.',
        }, { status: 422 });
      }
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // ── STEP A: remove all noise elements ──────────────────────────────────
    $('script, style, nav, header, footer, aside, figure, figcaption').remove();
    $('iframe, noscript, form, button, input, select, textarea').remove();
    $('[class*="ad"], [class*="advertisement"], [id*="ad-"]').remove();
    $('[class*="social"], [class*="share"], [class*="newsletter"]').remove();
    $('[class*="related"], [class*="cookie"], [class*="popup"]').remove();
    $('[class*="modal"], [class*="subscribe"], [class*="paywall"]').remove();
    $('[class*="sidebar"], [class*="widget"], [class*="banner"]').remove();
    $('[aria-hidden="true"]').remove();

    // ── STEP B: extract title ──────────────────────────────────────────────
    const title =
      $('h1').first().text().trim() ||
      $('meta[property="og:title"]').attr('content')?.trim() ||
      $('title').text().trim() ||
      'Article';

    // ── STEP C: extract body from likely article containers ────────────────
    const bodySelectors = [
      'article',
      '[role="main"]',
      '.article-body',
      '.article-content',
      '.article__body',
      '.post-content',
      '.post-body',
      '.entry-content',
      '.story-body',
      '.story-content',
      '.content-body',
      'main',
    ];

    let bodyText = '';
    for (const selector of bodySelectors) {
      const el = $(selector);
      if (el.length) {
        const candidate = el.text().trim();
        if (candidate.length > 200) {
          bodyText = candidate;
          break;
        }
      }
    }
    if (!bodyText || bodyText.length < 200) {
      bodyText = $('body').text();
    }

    // ── Paywall check ──────────────────────────────────────────────────────
    if (isPaywalled(response.status, html, bodyText)) {
      return NextResponse.json({
        paywalled: true,
        message: 'This article is behind a paywall',
      });
    }

    // ── STEP D: deep clean ─────────────────────────────────────────────────
    const cleanedBody = cleanArticleBody(bodyText);
    const cleanedTitle = cleanText(title);
    const hostname = new URL(url).hostname.replace(/^www\./, '');

    const content = `TITLE: ${cleanedTitle}\nSOURCE: ${hostname}\n\n${cleanedBody}`;

    return NextResponse.json({
      content,
      title: cleanedTitle,
      source: hostname,
      paywalled: false,
    });

  } catch (error: unknown) {
    clearTimeout(timeout);

    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json({
        timedOut: true,
        message: 'Article took too long to load — using summary instead',
      });
    }

    console.error('[fetch-url] error:', error);
    return NextResponse.json({ error: 'Failed to fetch content from URL' }, { status: 500 });
  }
}
