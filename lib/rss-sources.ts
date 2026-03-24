import type { SectorKey, MarketMode } from '@/components/types';

export interface RSSSource {
  url: string;
  market: MarketMode | 'global';
  sector: SectorKey;
  name: string;
  tier: 1 | 2 | 3; // 1 = highest authority
}

export const RSS_SOURCES: RSSSource[] = [
  // GLOBAL — AI & TECH
  { url: 'https://techcrunch.com/feed/',                              market: 'global', sector: 'ai',             name: 'TechCrunch',        tier: 1 },
  { url: 'https://www.theverge.com/rss/index.xml',                   market: 'global', sector: 'ai',             name: 'The Verge',          tier: 2 },
  { url: 'https://www.wired.com/feed/rss',                           market: 'global', sector: 'ai',             name: 'Wired',              tier: 1 },
  { url: 'https://www.technologyreview.com/feed/',                   market: 'global', sector: 'ai',             name: 'MIT Tech Review',    tier: 1 },
  { url: 'https://feeds.feedburner.com/venturebeat/SZYF',            market: 'global', sector: 'ai',             name: 'VentureBeat',        tier: 2 },
  { url: 'https://www.forbes.com/innovation/feed/',                  market: 'global', sector: 'ai',             name: 'Forbes Tech',        tier: 2 },
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml', market: 'global', sector: 'ai',         name: 'NY Times Tech',      tier: 1 },

  // GLOBAL — MARKETS
  { url: 'https://fortune.com/feed/',                                market: 'global', sector: 'markets',        name: 'Fortune',            tier: 2 },
  { url: 'https://feeds.bloomberg.com/technology/news.rss',          market: 'global', sector: 'markets',        name: 'Bloomberg Tech',     tier: 1 },

  // GLOBAL — FUNDING & POLICY
  { url: 'https://techcrunch.com/category/venture/feed/',            market: 'global', sector: 'funding',        name: 'TC Venture',         tier: 1 },
  { url: 'https://www.sba.gov/rss',                                  market: 'global', sector: 'funding',        name: 'SBA Gov',            tier: 2 },

  // GLOBAL — SUSTAINABILITY
  { url: 'https://www.greenbiz.com/feeds/news',                      market: 'global', sector: 'sustainability', name: 'GreenBiz',           tier: 2 },

  // GLOBAL — HEALTH
  { url: 'https://www.fiercehealthcare.com/rss/xml',                 market: 'global', sector: 'health',         name: 'Fierce Healthcare',  tier: 2 },

  // GLOBAL — REAL ESTATE
  { url: 'https://www.inman.com/feed/',                              market: 'global', sector: 'realestate',     name: 'Inman',              tier: 2 },

  // CARIBBEAN
  { url: 'https://www.jamaicaobserver.com/feed/',                    market: 'caribbean', sector: 'markets',     name: 'Jamaica Observer',   tier: 2 },
  { url: 'https://jamaica-gleaner.com/feed',                         market: 'caribbean', sector: 'markets',     name: 'Jamaica Gleaner',    tier: 2 },
  { url: 'https://www.loopjamaica.com/rss.xml',                      market: 'caribbean', sector: 'markets',     name: 'Loop Jamaica',       tier: 3 },
  { url: 'https://caribbeanbusinessreport.com/feed/',                market: 'caribbean', sector: 'markets',     name: 'Caribbean Business', tier: 3 },
  { url: 'https://www.trinidadexpress.com/feed/',                    market: 'caribbean', sector: 'markets',     name: 'Trinidad Express',   tier: 2 },

  // UK & EUROPE
  { url: 'https://www.theguardian.com/uk/technology/rss',            market: 'uk', sector: 'ai',                 name: 'Guardian Tech',      tier: 1 },
  { url: 'https://feeds.bbci.co.uk/news/technology/rss.xml',         market: 'uk', sector: 'ai',                 name: 'BBC Tech',           tier: 1 },
  { url: 'https://www.ft.com/technology?format=rss',                 market: 'uk', sector: 'markets',            name: 'FT Tech',            tier: 1 },
  { url: 'https://techcrunch.com/tag/europe/feed/',                   market: 'uk', sector: 'ai',                 name: 'TC Europe',          tier: 1 },

  // AFRICA & DIASPORA
  { url: 'https://techcabal.com/feed/',                              market: 'africa', sector: 'ai',             name: 'TechCabal',          tier: 2 },
  { url: 'https://disrupt-africa.com/feed/',                         market: 'africa', sector: 'funding',        name: 'Disrupt Africa',     tier: 2 },
  { url: 'https://www.howwemadeitinafrica.com/feed/',                market: 'africa', sector: 'markets',        name: 'How We Made It',     tier: 3 },
  { url: 'https://africabusiness.com/feed/',                         market: 'africa', sector: 'markets',        name: 'Africa Business',    tier: 3 },
];
