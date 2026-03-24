import { NextRequest, NextResponse } from 'next/server';
import TurndownService from 'turndown';
import * as cheerio from 'cheerio';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove unwanted elements
    $('script, style, nav, footer, header, aside, figure, iframe, noscript, .ads, .sidebar, #comments').remove();

    // Try to find the main content area
    const mainContent =
      $('article').html() ||
      $('main').html() ||
      $('#content').html() ||
      $('.content').html() ||
      $('.post-content').html() ||
      $('body').html();

    if (!mainContent) {
      throw new Error('Could not extract main content');
    }

    // Convert HTML to intermediate text via Turndown (preserves paragraph breaks)
    const turndownService = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
    let text = turndownService.turndown(mainContent);

    // Strip markdown syntax characters
    text = text
      .replace(/!\[.*?\]\(.*?\)/g, '')               // images
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')        // links → keep label
      .replace(/`{1,3}[\s\S]*?`{1,3}/g, '')           // inline code / code blocks
      .replace(/#{1,6}\s*/gm, '')                     // headings ##
      .replace(/\*{1,2}(.+?)\*{1,2}/g, '$1')          // bold / italic **
      .replace(/_{1,2}(.+?)_{1,2}/g, '$1')            // bold / italic __
      .replace(/^\s*[-*_]{3,}\s*$/gm, '')             // horizontal rules
      .replace(/^\s*>\s*/gm, '')                      // blockquotes
      .replace(/^\s*[-*+]\s+/gm, '')                  // unordered list markers
      .replace(/^\s*\d+\.\s+/gm, '');                 // ordered list markers

    // Strip lines that look like code
    text = text
      .split('\n')
      .filter(line => {
        const t = line.trim();
        if (!t) return true;
        return !/^(\/\/|import\s|const\s|var\s|let\s|function\s|<|{|})/.test(t);
      })
      .join('\n');

    // Collapse multiple blank lines into one and trim
    text = text.replace(/\n{3,}/g, '\n\n').trim();

    const title = $('title').text() || 'Fetched Content';
    const output = `TITLE: ${title}\nSOURCE: ${url}\n\n${text}`;

    return NextResponse.json({ content: output.substring(0, 15000) });
  } catch (error) {
    console.error('Fetch URL error:', error);
    return NextResponse.json({ error: 'Failed to fetch content from URL' }, { status: 500 });
  }
}
