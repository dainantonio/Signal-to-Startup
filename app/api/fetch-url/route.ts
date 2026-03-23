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
    $('script, style, nav, footer, header, aside, iframe, noscript, .ads, .sidebar, #comments').remove();

    // Try to find the main content area
    let mainContent = $('article').html() || 
                      $('main').html() || 
                      $('#content').html() || 
                      $('.content').html() || 
                      $('.post-content').html() ||
                      $('body').html();

    if (!mainContent) {
      throw new Error("Could not extract main content");
    }

    // Initialize Turndown
    const turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      hr: '---'
    });

    // Convert to Markdown
    let markdown = turndownService.turndown(mainContent);

    // Clean up excessive whitespace and empty lines
    markdown = markdown
      .replace(/\n{3,}/g, '\n\n')
      .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images for cleaner text analysis
      .trim();

    // Add source info at the top
    const title = $('title').text() || 'Fetched Content';
    const formattedContent = `TITLE: ${title}\nSOURCE: ${url}\n---\n\n${markdown}`;

    return NextResponse.json({ content: formattedContent.substring(0, 15000) });
  } catch (error) {
    console.error('Fetch URL error:', error);
    return NextResponse.json({ error: 'Failed to fetch content from URL' }, { status: 500 });
  }
}
