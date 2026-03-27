import type { SectorKey, MarketMode } from '@/components/types';

// ---------------------------------------------------------------------------
// Country context — keywords, flag, currency, home region
// ---------------------------------------------------------------------------

export interface CountryContext {
  keywords: string[];
  flag: string;
  currency: string;
  region: MarketMode | 'global';
}

export function getCountryConfig(tag: string): (CountryContext & { name: string }) | null {
  if (!tag) return null;
  const key = tag.toLowerCase();
  const ctx = COUNTRY_CONTEXT[key];
  if (!ctx) return null;
  const name = key.charAt(0).toUpperCase() + key.slice(1);
  return { ...ctx, name };
}

export const COUNTRY_CONTEXT: Record<string, CountryContext> = {
  jamaica:      { keywords: ['Jamaica', 'Jamaican', 'Kingston', 'JA', 'Montego Bay'],          flag: '🇯🇲', currency: 'JMD', region: 'caribbean' },
  trinidad:     { keywords: ['Trinidad', 'Tobago', 'Port of Spain', 'TT'],                      flag: '🇹🇹', currency: 'TTD', region: 'caribbean' },
  barbados:     { keywords: ['Barbados', 'Bajan', 'Bridgetown', 'BB'],                          flag: '🇧🇧', currency: 'BBD', region: 'caribbean' },
  guyana:       { keywords: ['Guyana', 'Guyanese', 'Georgetown', 'GY'],                         flag: '🇬🇾', currency: 'GYD', region: 'caribbean' },
  haiti:        { keywords: ['Haiti', 'Haitian', 'Port-au-Prince', 'HT'],                       flag: '🇭🇹', currency: 'HTG', region: 'caribbean' },
  bahamas:      { keywords: ['Bahamas', 'Bahamian', 'Nassau', 'BS'],                            flag: '🇧🇸', currency: 'BSD', region: 'caribbean' },
  nigeria:      { keywords: ['Nigeria', 'Nigerian', 'Lagos', 'Abuja', 'NG'],                    flag: '🇳🇬', currency: 'NGN', region: 'africa'    },
  ghana:        { keywords: ['Ghana', 'Ghanaian', 'Accra', 'GH'],                               flag: '🇬🇭', currency: 'GHS', region: 'africa'    },
  kenya:        { keywords: ['Kenya', 'Kenyan', 'Nairobi', 'KE'],                               flag: '🇰🇪', currency: 'KES', region: 'africa'    },
  'south africa': { keywords: ['South Africa', 'South African', 'Johannesburg', 'Cape Town', 'ZA'], flag: '🇿🇦', currency: 'ZAR', region: 'africa' },
  rwanda:       { keywords: ['Rwanda', 'Rwandan', 'Kigali', 'RW'],                              flag: '🇷🇼', currency: 'RWF', region: 'africa'    },
  uk:           { keywords: ['UK', 'Britain', 'British', 'England', 'London'],                  flag: '🇬🇧', currency: 'GBP', region: 'uk'        },
  london:       { keywords: ['London', 'Greater London', 'UK'],                                  flag: '🇬🇧', currency: 'GBP', region: 'uk'        },
  manchester:   { keywords: ['Manchester', 'Greater Manchester', 'UK'],                          flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', currency: 'GBP', region: 'uk' },
  scotland:     { keywords: ['Scotland', 'Scottish', 'Edinburgh', 'Glasgow'],                   flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', currency: 'GBP', region: 'uk' },
  'new york':   { keywords: ['New York', 'NYC', 'Manhattan', 'Brooklyn', 'NY'],                 flag: '🗽', currency: 'USD', region: 'global'    },
  atlanta:      { keywords: ['Atlanta', 'Georgia', 'ATL'],                                       flag: '🇺🇸', currency: 'USD', region: 'global'    },
  miami:        { keywords: ['Miami', 'South Florida', 'Dade'],                                  flag: '🇺🇸', currency: 'USD', region: 'global'    },
  houston:      { keywords: ['Houston', 'Texas', 'HTX'],                                         flag: '🇺🇸', currency: 'USD', region: 'global'    },
  // LATIN AMERICA
  mexico:       { keywords: ['Mexico', 'Mexican', 'Ciudad de Mexico', 'CDMX', 'Guadalajara', 'Monterrey', 'MX'], flag: '🇲🇽', currency: 'MXN', region: 'latam' },
  brazil:       { keywords: ['Brazil', 'Brazilian', 'Brasil', 'São Paulo', 'Rio de Janeiro', 'BR'],               flag: '🇧🇷', currency: 'BRL', region: 'latam' },
  colombia:     { keywords: ['Colombia', 'Colombian', 'Bogota', 'Medellin', 'Cali', 'CO'],                        flag: '🇨🇴', currency: 'COP', region: 'latam' },
  argentina:    { keywords: ['Argentina', 'Argentine', 'Buenos Aires', 'AR', 'Argentinian'],                      flag: '🇦🇷', currency: 'ARS', region: 'latam' },
  chile:        { keywords: ['Chile', 'Chilean', 'Santiago', 'CL'],                                               flag: '🇨🇱', currency: 'CLP', region: 'latam' },
  peru:         { keywords: ['Peru', 'Peruvian', 'Lima', 'PE'],                                                    flag: '🇵🇪', currency: 'PEN', region: 'latam' },
  // ASIA-PACIFIC
  india:        { keywords: ['India', 'Indian', 'Mumbai', 'Delhi', 'Bangalore', 'Bengaluru', 'IN'],               flag: '🇮🇳', currency: 'INR', region: 'global' },
  philippines:  { keywords: ['Philippines', 'Filipino', 'Manila', 'Cebu', 'PH'],                                  flag: '🇵🇭', currency: 'PHP', region: 'global' },
  singapore:    { keywords: ['Singapore', 'Singaporean', 'SG', 'SGD'],                                            flag: '🇸🇬', currency: 'SGD', region: 'global' },
  uae:          { keywords: ['UAE', 'Dubai', 'Abu Dhabi', 'Emirates', 'AE'],                                      flag: '🇦🇪', currency: 'AED', region: 'global' },
};

export interface RSSSource {
  url: string;
  market: MarketMode | 'global';
  sector: SectorKey;
  name: string;
  tier: 1 | 2 | 3; // 1 = highest authority
}

// ---------------------------------------------------------------------------
// Paywall domain blocklist — articles from these domains are filtered out
// ---------------------------------------------------------------------------
export const PAYWALL_DOMAINS = [
  'ft.com',
  'bloomberg.com',
  'wsj.com',
  'nytimes.com',
  'economist.com',
  'thetimes.co.uk',
  'telegraph.co.uk',
  'hbr.org',
  'fortune.com',
  'businessinsider.com',
  'theinformation.com',
  'barrons.com',
  'washingtonpost.com',
  'newyorker.com',
];

export const RSS_SOURCES: RSSSource[] = [
  // GLOBAL — AI & TECH
  { url: 'https://techcrunch.com/feed/',                                         market: 'global', sector: 'ai',             name: 'TechCrunch',        tier: 1 },
  { url: 'https://www.theverge.com/rss/index.xml',                              market: 'global', sector: 'ai',             name: 'The Verge',         tier: 2 },
  { url: 'https://www.wired.com/feed/rss',                                       market: 'global', sector: 'ai',             name: 'Wired',             tier: 1 },
  { url: 'https://www.technologyreview.com/feed/',                               market: 'global', sector: 'ai',             name: 'MIT Tech Review',   tier: 1 },
  { url: 'https://feeds.feedburner.com/venturebeat/SZYF',                        market: 'global', sector: 'ai',             name: 'VentureBeat',       tier: 2 },
  { url: 'https://www.forbes.com/innovation/feed/',                               market: 'global', sector: 'ai',             name: 'Forbes Tech',       tier: 2 },
  { url: 'https://feeds.reuters.com/reuters/technologyNews',                      market: 'global', sector: 'ai',             name: 'Reuters Tech',      tier: 1 },
  { url: 'https://www.fastcompany.com/latest/rss',                               market: 'global', sector: 'ai',             name: 'Fast Company',      tier: 2 },
  { url: 'https://hackernoon.com/feed',                                           market: 'global', sector: 'ai',             name: 'Hacker Noon',       tier: 2 },
  { url: 'https://techxplore.com/rss-feed/',                                     market: 'global', sector: 'ai',             name: 'TechXplore',        tier: 2 },

  // GLOBAL — MARKETS
  { url: 'https://feeds.reuters.com/reuters/businessNews',                        market: 'global', sector: 'markets',        name: 'Reuters Business',  tier: 1 },
  { url: 'https://www.cnbc.com/id/19854910/device/rss/rss.html',                 market: 'global', sector: 'markets',        name: 'CNBC Tech',         tier: 1 },
  { url: 'https://www.cnbc.com/id/10000664/device/rss/rss.html',                 market: 'global', sector: 'markets',        name: 'CNBC Business',     tier: 1 },
  { url: 'https://feeds.feedburner.com/entrepreneur/latest',                      market: 'global', sector: 'markets',        name: 'Entrepreneur',      tier: 2 },
  { url: 'https://www.inc.com/rss',                                               market: 'global', sector: 'markets',        name: 'Inc Magazine',      tier: 2 },

  // GLOBAL — FUNDING & POLICY
  { url: 'https://techcrunch.com/category/venture/feed/',                         market: 'global', sector: 'funding',        name: 'TC Venture',        tier: 1 },
  { url: 'https://www.sba.gov/rss',                                              market: 'global', sector: 'funding',        name: 'SBA Gov',           tier: 2 },
  { url: 'https://www.businesswire.com/rss/home/?rss=G1',                        market: 'global', sector: 'funding',        name: 'Business Wire',     tier: 2 },

  // GLOBAL — SUSTAINABILITY
  { url: 'https://www.greenbiz.com/feeds/news',                                   market: 'global', sector: 'sustainability', name: 'GreenBiz',          tier: 2 },

  // GLOBAL — HEALTH
  { url: 'https://www.fiercehealthcare.com/rss/xml',                             market: 'global', sector: 'health',         name: 'Fierce Healthcare', tier: 2 },

  // GLOBAL — REAL ESTATE
  { url: 'https://www.inman.com/feed/',                                           market: 'global', sector: 'realestate',     name: 'Inman',             tier: 2 },

  // CARIBBEAN
  { url: 'https://www.jamaicaobserver.com/feed/',                                 market: 'caribbean', sector: 'markets',     name: 'Jamaica Observer',  tier: 2 },
  { url: 'https://jamaica-gleaner.com/feed',                                      market: 'caribbean', sector: 'markets',     name: 'Jamaica Gleaner',   tier: 2 },
  { url: 'https://www.loopjamaica.com/rss.xml',                                   market: 'caribbean', sector: 'markets',     name: 'Loop Jamaica',      tier: 3 },
  { url: 'https://caribbeanbusinessreport.com/feed/',                             market: 'caribbean', sector: 'markets',     name: 'Caribbean Business',tier: 3 },
  { url: 'https://www.trinidadexpress.com/feed/',                                 market: 'caribbean', sector: 'markets',     name: 'Trinidad Express',  tier: 2 },

  // UK & EUROPE
  { url: 'https://www.theguardian.com/uk/technology/rss',                         market: 'uk', sector: 'ai',                name: 'Guardian Tech',     tier: 1 },
  { url: 'https://feeds.bbci.co.uk/news/technology/rss.xml',                      market: 'uk', sector: 'ai',                name: 'BBC Tech',          tier: 1 },
  { url: 'https://techcrunch.com/tag/europe/feed/',                               market: 'uk', sector: 'ai',                name: 'TC Europe',         tier: 1 },

  // AFRICA & DIASPORA
  { url: 'https://techcabal.com/feed/',                                           market: 'africa', sector: 'ai',             name: 'TechCabal',              tier: 2 },
  { url: 'https://disrupt-africa.com/feed/',                                      market: 'africa', sector: 'funding',        name: 'Disrupt Africa',         tier: 2 },
  { url: 'https://www.howwemadeitinafrica.com/feed/',                             market: 'africa', sector: 'markets',        name: 'How We Made It',         tier: 3 },
  { url: 'https://africabusiness.com/feed/',                                      market: 'africa', sector: 'markets',        name: 'Africa Business',        tier: 3 },

  // LATIN AMERICA
  { url: 'https://www.infobae.com/economia/rss/',                                 market: 'latam',  sector: 'markets',        name: 'Infobae Economia',       tier: 2 },
  { url: 'https://feeds.folha.uol.com.br/mercado/rss091.xml',                    market: 'latam',  sector: 'markets',        name: 'Folha Mercado',          tier: 2 },
  { url: 'https://www.contxto.com/en/feed/',                                      market: 'latam',  sector: 'ai',             name: 'Contxto LatAm Tech',     tier: 2 },
  { url: 'https://startupbrasil.com.br/feed/',                                    market: 'latam',  sector: 'ai',             name: 'Startup Brasil',         tier: 3 },
  { url: 'https://businessinsider.mx/feed',                                       market: 'latam',  sector: 'markets',        name: 'Business Insider Mexico',tier: 3 },
  { url: 'https://www.lavanguardia.com/rss/economia.xml',                         market: 'latam',  sector: 'markets',        name: 'La Vanguardia Economia', tier: 3 },
];
