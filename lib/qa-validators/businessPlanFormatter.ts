/**
 * Business Plan Content Cleanup & Formatting
 * 
 * Fixes spacing errors, splits merged words, and reformats into concise bullet points
 * Maintains all original meaning while improving readability
 */

export interface BusinessPlan {
  executiveSummary: string[];
  customer: string[];
  offer: string[];
  goToMarket: string[];
  operations: string[];
  financials: string[];
  risks: string[];
  timeline: {
    day30: string[];
    day60: string[];
    day90: string[];
  };
}

export class BusinessPlanFormatter {
  /**
   * Clean and reformat generated business plan content
   */
  static cleanup(rawContent: string): string {
    let cleaned = rawContent;

    // Fix spacing errors
    cleaned = this.fixSpacing(cleaned);

    // Split merged words
    cleaned = this.splitMergedWords(cleaned);

    // Fix common formatting issues
    cleaned = this.fixCommonIssues(cleaned);

    return cleaned;
  }

  /**
   * Convert raw text to structured business plan with required sections
   */
  static format(rawContent: string): BusinessPlan {
    const cleaned = this.cleanup(rawContent);
    const sections = this.extractSections(cleaned);

    return {
      executiveSummary: this.toBullets(sections.executiveSummary, 6),
      customer: this.toBullets(sections.customer, 6),
      offer: this.toBullets(sections.offer, 6),
      goToMarket: this.toBullets(sections.goToMarket, 6),
      operations: this.toBullets(sections.operations, 6),
      financials: this.toBullets(sections.financials, 6),
      risks: this.toBullets(sections.risks, 6),
      timeline: {
        day30: this.toBullets(sections.timeline30, 5),
        day60: this.toBullets(sections.timeline60, 5),
        day90: this.toBullets(sections.timeline90, 5),
      },
    };
  }

  private static fixSpacing(text: string): string {
    return text
      // Fix missing spaces after punctuation
      .replace(/([.!?])([A-Z])/g, '$1 $2')
      // Fix missing spaces after commas
      .replace(/,([^\s\d])/g, ', $1')
      // Fix double spaces
      .replace(/\s{2,}/g, ' ')
      // Fix spaces before punctuation
      .replace(/\s+([.,!?;:])/g, '$1')
      // Fix newline spacing
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  private static splitMergedWords(text: string): string {
    // Common merged word patterns
    const patterns: [RegExp, string][] = [
      // "theproduct" -> "the product"
      [/([a-z])([A-Z])/g, '$1 $2'],
      // "startupwill" -> "startup will"
      [/(startup)(will|can|should|would|could)/gi, '$1 $2'],
      // "customer needs" patterns
      [/(customer)(s?)(need|want|require|expect)/gi, '$1$2 $3'],
      // Common business terms
      [/(market)(size|share|entry|fit)/gi, '$1 $2'],
      [/(revenue)(model|stream|forecast)/gi, '$1 $2'],
      [/(cost)(structure|estimate|breakdown)/gi, '$1 $2'],
    ];

    let result = text;
    patterns.forEach(([pattern, replacement]) => {
      result = result.replace(pattern, replacement);
    });

    return result;
  }

  private static fixCommonIssues(text: string): string {
    return text
      // Fix currency formatting
      .replace(/\$\s+/g, '$')
      .replace(/USD\s+/g, 'USD ')
      // Fix percentage formatting
      .replace(/(\d+)\s*%/g, '$1%')
      // Fix date formatting
      .replace(/(\d{1,2})\s*\/\s*(\d{1,2})/g, '$1/$2')
      // Fix bullet points
      .replace(/^[•\-\*]\s*/gm, '• ')
      // Remove excessive punctuation
      .replace(/\.{2,}/g, '.')
      .replace(/!{2,}/g, '!')
      // Fix common typos
      .replace(/\bstartup\s+s\b/gi, 'startups')
      .replace(/\bcustomer\s+s\b/gi, 'customers');
  }

  private static extractSections(text: string): Record<string, string> {
    const sections: Record<string, string> = {
      executiveSummary: '',
      customer: '',
      offer: '',
      goToMarket: '',
      operations: '',
      financials: '',
      risks: '',
      timeline30: '',
      timeline60: '',
      timeline90: '',
    };

    // Section headers patterns
    const patterns = {
      executiveSummary: /(?:executive summary|overview|summary)/i,
      customer: /(?:customer|target market|audience|who)/i,
      offer: /(?:offer|product|service|solution|what)/i,
      goToMarket: /(?:go.?to.?market|marketing|sales|distribution|how)/i,
      operations: /(?:operations|execution|implementation|team)/i,
      financials: /(?:financials?|revenue|cost|pricing|money)/i,
      risks: /(?:risks?|challenges?|assumptions?)/i,
      timeline30: /(?:30.?day|first month|month 1)/i,
      timeline60: /(?:60.?day|second month|month 2)/i,
      timeline90: /(?:90.?day|third month|month 3)/i,
    };

    // Split by common section delimiters
    const lines = text.split('\n');
    let currentSection = 'executiveSummary';

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Check if line is a section header
      let isHeader = false;
      for (const [key, pattern] of Object.entries(patterns)) {
        if (pattern.test(trimmed)) {
          currentSection = key;
          isHeader = true;
          break;
        }
      }

      if (!isHeader) {
        sections[currentSection] += (sections[currentSection] ? '\n' : '') + trimmed;
      }
    });

    return sections;
  }

  private static toBullets(text: string, maxBullets: number = 6): string[] {
    if (!text || !text.trim()) return [];

    // Split by existing bullets or periods
    let bullets = text
      .split(/[•\-\*]/)
      .map(b => b.trim())
      .filter(b => b.length > 10);

    // If no bullets found, split by sentences
    if (bullets.length === 0) {
      bullets = text
        .split(/\.\s+/)
        .map(s => s.trim())
        .filter(s => s.length > 10);
    }

    // Ensure bullets are concise (max 150 chars)
    bullets = bullets.map(b => {
      if (b.length > 150) {
        // Find natural break point
        const breakPoint = b.lastIndexOf(',', 140) || b.lastIndexOf(' ', 140);
        return b.substring(0, breakPoint > 0 ? breakPoint : 140).trim() + '...';
      }
      return b;
    });

    // Limit to max bullets
    if (bullets.length > maxBullets) {
      // Keep most important (usually first and last)
      const keep = Math.floor(maxBullets / 2);
      bullets = [
        ...bullets.slice(0, keep),
        ...bullets.slice(bullets.length - (maxBullets - keep)),
      ];
    }

    // Ensure proper capitalization
    bullets = bullets.map(b => {
      const first = b.charAt(0).toUpperCase();
      return first + b.slice(1);
    });

    return bullets;
  }

  /**
   * Convert business plan back to readable text
   */
  static toString(plan: BusinessPlan): string {
    const sections = [
      { title: 'Executive Summary', content: plan.executiveSummary },
      { title: 'Customer', content: plan.customer },
      { title: 'Offer', content: plan.offer },
      { title: 'Go-to-Market', content: plan.goToMarket },
      { title: 'Operations', content: plan.operations },
      { title: 'Financials', content: plan.financials },
      { title: 'Risks', content: plan.risks },
    ];

    let result = sections
      .map(s => {
        if (s.content.length === 0) return '';
        return `## ${s.title}\n\n${s.content.map(b => `• ${b}`).join('\n')}`;
      })
      .filter(Boolean)
      .join('\n\n');

    // Add timeline
    if (plan.timeline.day30.length > 0 || plan.timeline.day60.length > 0 || plan.timeline.day90.length > 0) {
      result += '\n\n## 30/60/90-Day Plan\n\n';
      
      if (plan.timeline.day30.length > 0) {
        result += '**First 30 Days:**\n' + plan.timeline.day30.map(b => `• ${b}`).join('\n') + '\n\n';
      }
      
      if (plan.timeline.day60.length > 0) {
        result += '**Days 31-60:**\n' + plan.timeline.day60.map(b => `• ${b}`).join('\n') + '\n\n';
      }
      
      if (plan.timeline.day90.length > 0) {
        result += '**Days 61-90:**\n' + plan.timeline.day90.map(b => `• ${b}`).join('\n');
      }
    }

    return result;
  }
}
