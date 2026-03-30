/**
 * User Context & Localization System
 * 
 * Manages user location, preferences, and Jamaica-first ranking
 */

export type SourceOrigin = 'Jamaica Government' | 'Jamaica Private Sector' | 'Caribbean Regional' | 'International';

export interface UserContext {
  country: string;
  countryCode: string;
  isJamaican: boolean;
  detectedFrom: 'ip' | 'profile' | 'manual';
  marketMode?: string;
  preferences?: {
    showJamaicanFirst: boolean;
    includeCaribbean: boolean;
    includeGlobal: boolean;
  };
}

export interface SourceClassification {
  origin: SourceOrigin;
  confidence: number; // 0-100
  justification: string;
  isLocal: boolean;
}

export interface LocalizedResource {
  id: string;
  title: string;
  description: string;
  source: string;
  sourceClassification: SourceClassification;
  relevanceScore: number; // 0-100
  rankingReason: string;
  url?: string;
  eligibility?: string;
  deadline?: string;
  firstAction?: string;
}

export class UserContextManager {
  private static readonly JAMAICAN_INDICATORS = [
    'jamaica', 'jamaican', 'kingston', 'montego bay', 'spanish town',
    'portmore', 'jm', '+1876', '876'
  ];

  private static readonly CARIBBEAN_COUNTRIES = [
    'jamaica', 'barbados', 'trinidad', 'bahamas', 'grenada',
    'dominica', 'saint lucia', 'antigua', 'saint vincent'
  ];

  /**
   * Detect user context from various sources
   */
  static async detectUserContext(
    ipCountry?: string,
    profileCountry?: string,
    manualSelection?: string
  ): Promise<UserContext> {
    let country = 'Global';
    let countryCode = 'XX';
    let detectedFrom: 'ip' | 'profile' | 'manual' = 'ip';

    // Priority: manual > profile > IP
    if (manualSelection) {
      country = manualSelection;
      detectedFrom = 'manual';
    } else if (profileCountry) {
      country = profileCountry;
      detectedFrom = 'profile';
    } else if (ipCountry) {
      country = ipCountry;
      detectedFrom = 'ip';
    }

    const isJamaican = this.isJamaicanContext(country);
    
    if (isJamaican) {
      countryCode = 'JM';
    }

    return {
      country,
      countryCode,
      isJamaican,
      detectedFrom,
      preferences: {
        showJamaicanFirst: isJamaican,
        includeCaribbean: isJamaican,
        includeGlobal: true,
      },
    };
  }

  /**
   * Check if context indicates Jamaican user
   */
  static isJamaicanContext(text: string): boolean {
    const lower = text.toLowerCase();
    return this.JAMAICAN_INDICATORS.some(indicator => lower.includes(indicator));
  }

  /**
   * Check if country is Caribbean
   */
  static isCaribbeanCountry(country: string): boolean {
    const lower = country.toLowerCase();
    return this.CARIBBEAN_COUNTRIES.some(c => lower.includes(c));
  }

  /**
   * Get user's location preference from localStorage
   */
  static getUserPreference(): string | null {
    try {
      return localStorage.getItem('userCountryPreference');
    } catch {
      return null;
    }
  }

  /**
   * Save user's location preference
   */
  static saveUserPreference(country: string): void {
    try {
      localStorage.setItem('userCountryPreference', country);
    } catch {}
  }
}

/**
 * Source Classification System
 */
export class SourceClassifier {
  private static readonly JAMAICA_GOV_DOMAINS = [
    'gov.jm', 'jampro.com', 'dbankjm.com', 'jbdc.net',
    'exim.gov.jm', 'jamaicatradeandinvest.org'
  ];

  private static readonly JAMAICA_GOV_KEYWORDS = [
    'ministry of', 'jamaica government', 'office of the prime minister',
    'jampro', 'development bank of jamaica', 'exim bank',
    'jamaica business development', 'jbdc'
  ];

  private static readonly JAMAICA_PRIVATE_KEYWORDS = [
    'jamaica chamber of commerce', 'private sector organisation',
    'jamaica manufacturers', 'jamaica exporters', 'jsif',
    'entrepreneurship programme jamaica'
  ];

  private static readonly CARIBBEAN_KEYWORDS = [
    'caribbean', 'caricom', 'carib', 'west indies',
    'caribbean development bank', 'cdb', 'oecs'
  ];

  /**
   * Classify source origin with confidence
   */
  static classify(
    source: string,
    url?: string,
    description?: string
  ): SourceClassification {
    const text = `${source} ${url || ''} ${description || ''}`.toLowerCase();

    // Check Jamaica Government
    const isGovDomain = url && this.JAMAICA_GOV_DOMAINS.some(d => url.includes(d));
    const hasGovKeywords = this.JAMAICA_GOV_KEYWORDS.some(k => text.includes(k.toLowerCase()));
    
    if (isGovDomain || hasGovKeywords) {
      return {
        origin: 'Jamaica Government',
        confidence: isGovDomain ? 95 : 85,
        justification: isGovDomain 
          ? 'Official .gov.jm domain or verified government entity'
          : 'Contains official government keywords',
        isLocal: true,
      };
    }

    // Check Jamaica Private Sector
    const hasPrivateKeywords = this.JAMAICA_PRIVATE_KEYWORDS.some(k => text.includes(k.toLowerCase()));
    const hasJamaicaInName = text.includes('jamaica') && !text.includes('caribbean');
    
    if (hasPrivateKeywords || (hasJamaicaInName && (url?.includes('.jm') || source.includes('Jamaica')))) {
      return {
        origin: 'Jamaica Private Sector',
        confidence: hasPrivateKeywords ? 80 : 70,
        justification: hasPrivateKeywords
          ? 'Known Jamaican private sector organization'
          : 'Jamaica-based organization',
        isLocal: true,
      };
    }

    // Check Caribbean Regional
    const hasCaribbeanKeywords = this.CARIBBEAN_KEYWORDS.some(k => text.includes(k.toLowerCase()));
    
    if (hasCaribbeanKeywords) {
      return {
        origin: 'Caribbean Regional',
        confidence: 75,
        justification: 'Caribbean-focused regional organization',
        isLocal: false,
      };
    }

    // Default: International
    return {
      origin: 'International',
      confidence: 60,
      justification: 'General international resource',
      isLocal: false,
    };
  }
}

/**
 * Jamaica-First Ranking System
 */
export class JamaicanRankingEngine {
  /**
   * Rank resources with Jamaica-first priority
   */
  static rank(
    resources: any[],
    userContext: UserContext,
    maxResults: number = 10
  ): LocalizedResource[] {
    if (!userContext.isJamaican) {
      // Non-Jamaican users get standard ranking
      return resources.slice(0, maxResults).map((r, i) => ({
        ...r,
        relevanceScore: 100 - (i * 5),
        rankingReason: 'Standard relevance ranking',
      }));
    }

    // Jamaica-first ranking
    const scored = resources.map(resource => {
      const classification = SourceClassifier.classify(
        resource.source || '',
        resource.url,
        resource.description
      );

      let score = 50; // Base score
      let reason = '';

      // Jamaica Government: Highest priority
      if (classification.origin === 'Jamaica Government') {
        score = 100;
        reason = 'Official Jamaica government resource - highest priority for Jamaican entrepreneurs';
      }
      // Jamaica Private Sector: Second priority
      else if (classification.origin === 'Jamaica Private Sector') {
        score = 85;
        reason = 'Local Jamaican organization with direct support for entrepreneurs';
      }
      // Caribbean Regional: Third priority
      else if (classification.origin === 'Caribbean Regional') {
        score = 70;
        reason = 'Regional Caribbean resource accessible to Jamaican businesses';
      }
      // International: Lowest priority (unless no local alternative)
      else {
        score = 55;
        reason = 'International resource - use when local options exhausted';
      }

      // Boost if highly relevant keywords
      if (resource.title?.toLowerCase().includes('jamaica')) {
        score += 10;
        reason += ' + mentions Jamaica specifically';
      }

      if (resource.title?.toLowerCase().includes('grant') || 
          resource.title?.toLowerCase().includes('funding')) {
        score += 5;
        reason += ' + direct funding available';
      }

      return {
        ...resource,
        sourceClassification: classification,
        relevanceScore: Math.min(100, score),
        rankingReason: reason.trim(),
      };
    });

    // Sort by score (Jamaica-first)
    scored.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Take top results
    return scored.slice(0, maxResults);
  }

  /**
   * Filter to remove international duplicates of local resources
   */
  static deduplicateLocal(
    resources: LocalizedResource[]
  ): LocalizedResource[] {
    const seen = new Set<string>();
    const filtered: LocalizedResource[] = [];

    // First pass: Add all local resources
    resources.forEach(resource => {
      if (resource.sourceClassification.isLocal) {
        const key = resource.title.toLowerCase().substring(0, 30);
        seen.add(key);
        filtered.push(resource);
      }
    });

    // Second pass: Add international only if no local equivalent
    resources.forEach(resource => {
      if (!resource.sourceClassification.isLocal) {
        const key = resource.title.toLowerCase().substring(0, 30);
        if (!seen.has(key)) {
          filtered.push(resource);
        }
      }
    });

    return filtered;
  }
}

/**
 * Opportunity Matching for Jamaica
 */
export interface JamaicanOpportunityMatch {
  type: 'grant' | 'program' | 'permit' | 'partner';
  name: string;
  provider: string;
  sourceClassification: SourceClassification;
  eligibility: string;
  deadline?: string;
  firstAction: string;
  relevanceScore: number;
  url?: string;
}

export class JamaicanOpportunityMatcher {
  /**
   * Match business type to Jamaican resources
   */
  static async match(
    businessType: string,
    industry: string
  ): Promise<JamaicanOpportunityMatch[]> {
    // This would typically call an API or database
    // For now, return structured templates
    
    const matches: JamaicanOpportunityMatch[] = [
      {
        type: 'grant',
        name: 'JBDC Entrepreneurship Programme',
        provider: 'Jamaica Business Development Corporation',
        sourceClassification: SourceClassifier.classify('JBDC', 'https://jbdc.net'),
        eligibility: 'Jamaican citizens with viable business plan',
        firstAction: 'Visit JBDC office to schedule consultation',
        relevanceScore: 95,
        url: 'https://jbdc.net',
      },
      {
        type: 'grant',
        name: 'Development Bank of Jamaica Loans',
        provider: 'DBJ',
        sourceClassification: SourceClassifier.classify('Development Bank of Jamaica'),
        eligibility: 'MSMEs in priority sectors (agriculture, manufacturing, tourism, ICT)',
        deadline: 'Rolling applications',
        firstAction: 'Prepare business plan and financial statements',
        relevanceScore: 90,
        url: 'https://dbankjm.com',
      },
      {
        type: 'program',
        name: 'JAMPRO Export Services',
        provider: 'JAMPRO',
        sourceClassification: SourceClassifier.classify('JAMPRO', 'https://jampro.com'),
        eligibility: 'Export-ready Jamaican businesses',
        firstAction: 'Register with JAMPRO online portal',
        relevanceScore: 85,
        url: 'https://jampro.com',
      },
    ];

    return matches;
  }
}
