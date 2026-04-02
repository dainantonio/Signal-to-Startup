// ---------------------------------------------------------------------------
// RSS source registry — curated, tiered, market-segmented
// ---------------------------------------------------------------------------

export interface RSSSource {
  url: string;
  market: 'global' | 'caribbean' | 'africa' | 'uk' | 'latam';
  sector: 'ai' | 'policy' | 'markets' | 'funding' | 'sustainability' | 'realestate' | 'health';
  name: string;
  tier: 1 | 2 | 3;
}

// ---------------------------------------------------------------------------
// Blocked domains — paywalls, sports, and low-quality sites
// ---------------------------------------------------------------------------
export const BLOCKED_DOMAINS = [
  // Paywalls
  'ft.com', 'bloomberg.com', 'wsj.com',
  'nytimes.com', 'economist.com',
  'thetimes.co.uk', 'telegraph.co.uk',
  'hbr.org', 'businessinsider.com',
  'theinformation.com', 'barrons.com',
  'washingtonpost.com', 'newyorker.com',
  // Sports
  'on3.com', 'espn.com', 'si.com',
  'bleacherreport.com', 'theathletic.com',
  'cbssports.com', 'nbcsports.com',
  // Low quality / spam / academic (not business-relevant)
  'whatjapanthinks.com',
  'nature.com',
];

// ---------------------------------------------------------------------------
// Spam title patterns — SEO bait, scam-review sites
// ---------------------------------------------------------------------------
export const SPAM_TITLE_PATTERNS = [
  'review:', 'scam?', 'facts uncovered',
  'claims vs reality', 'real or fake',
  'legit or scam', 'is it legit',
  'unveiled', 'exposed', 'leaked',
  "you won't believe", 'shocking',
  'vs reality', 'the truth about',
  'eligibility lawsuit', 'ncaa',
  'college athlete', 'defensive lineman',
  'transfer portal', 'athletic eligibility',
];

// ---------------------------------------------------------------------------
// Curated RSS source list
// global  → shown in all market modes
// others  → shown only in their market mode + global
// ---------------------------------------------------------------------------
export const RSS_SOURCES: RSSSource[] = [

  // ── GLOBAL / US — Business & Entrepreneurship ─────────────────────────
  { url: 'https://feeds.feedburner.com/entrepreneur/latest',          market: 'global', sector: 'markets',        name: 'Entrepreneur',               tier: 1 },
  { url: 'https://www.inc.com/rss',                                    market: 'global', sector: 'markets',        name: 'Inc Magazine',               tier: 1 },
  { url: 'https://www.fastcompany.com/latest/rss',                     market: 'global', sector: 'markets',        name: 'Fast Company',               tier: 1 },
  { url: 'https://hbr.org/feed',                                       market: 'global', sector: 'markets',        name: 'Harvard Business Review',    tier: 1 },

  // ── GLOBAL / US — Tech & AI ───────────────────────────────────────────
  { url: 'https://techcrunch.com/feed/',                               market: 'global', sector: 'ai',             name: 'TechCrunch',                 tier: 1 },
  { url: 'https://www.theverge.com/rss/index.xml',                     market: 'global', sector: 'ai',             name: 'The Verge',                  tier: 1 },
  { url: 'https://www.wired.com/feed/rss',                             market: 'global', sector: 'ai',             name: 'Wired',                      tier: 1 },
  { url: 'https://feeds.feedburner.com/venturebeat/SZYF',              market: 'global', sector: 'ai',             name: 'VentureBeat',                tier: 1 },
  { url: 'https://www.technologyreview.com/feed/',                     market: 'global', sector: 'ai',             name: 'MIT Tech Review',            tier: 1 },
  { url: 'https://feeds.reuters.com/reuters/technologyNews',           market: 'global', sector: 'ai',             name: 'Reuters Tech',               tier: 1 },

  // ── GLOBAL / US — Funding & Grants ───────────────────────────────────
  { url: 'https://techcrunch.com/category/venture/feed/',              market: 'global', sector: 'funding',        name: 'TechCrunch Venture',         tier: 1 },
  { url: 'https://www.businesswire.com/rss/home/?rss=G1',              market: 'global', sector: 'funding',        name: 'Business Wire',              tier: 1 },
  { url: 'https://www.sba.gov/rss',                                    market: 'global', sector: 'policy',         name: 'SBA Gov',                    tier: 1 },

  // ── GLOBAL / US — Markets & Economy ──────────────────────────────────
  { url: 'https://feeds.reuters.com/reuters/businessNews',             market: 'global', sector: 'markets',        name: 'Reuters Business',           tier: 1 },
  { url: 'https://www.cnbc.com/id/10000664/device/rss/rss.html',       market: 'global', sector: 'markets',        name: 'CNBC Business',              tier: 1 },

  // ── GLOBAL — Sustainability, Health, Real Estate ─────────────────────
  { url: 'https://www.greenbiz.com/feeds/news',                        market: 'global', sector: 'sustainability', name: 'GreenBiz',                   tier: 1 },
  { url: 'https://www.fiercehealthcare.com/rss/xml',                   market: 'global', sector: 'health',         name: 'Fierce Healthcare',          tier: 2 },
  { url: 'https://www.inman.com/feed/',                                market: 'global', sector: 'realestate',     name: 'Inman Real Estate',          tier: 2 },

  // ── CARIBBEAN ─────────────────────────────────────────────────────────
  { url: 'https://www.jamaicaobserver.com/feed/',                      market: 'caribbean', sector: 'markets',     name: 'Jamaica Observer',           tier: 1 },
  { url: 'https://jamaica-gleaner.com/feed',                           market: 'caribbean', sector: 'markets',     name: 'Jamaica Gleaner',            tier: 1 },
  { url: 'https://loopjamaica.com/rss.xml',                            market: 'caribbean', sector: 'markets',     name: 'Loop Jamaica',               tier: 1 },
  { url: 'https://caribbeanbusinessreport.com/feed/',                  market: 'caribbean', sector: 'markets',     name: 'Caribbean Business Report',  tier: 1 },
  { url: 'https://www.trinidadexpress.com/feed/',                      market: 'caribbean', sector: 'markets',     name: 'Trinidad Express',           tier: 1 },
  { url: 'https://www.barbadostoday.bb/feed/',                         market: 'caribbean', sector: 'markets',     name: 'Barbados Today',             tier: 2 },
  { url: 'https://www.stabroeknews.com/feed/',                         market: 'caribbean', sector: 'markets',     name: 'Stabroek News Guyana',       tier: 2 },
  { url: 'https://www.jamaicaobserver.com/category/business/feed/',    market: 'caribbean', sector: 'funding',     name: 'Jamaica Observer Business',  tier: 1 },

  // ── AFRICA ────────────────────────────────────────────────────────────
  { url: 'https://techcabal.com/feed/',                                market: 'africa',    sector: 'ai',          name: 'TechCabal',                  tier: 1 },
  { url: 'https://disrupt-africa.com/feed/',                           market: 'africa',    sector: 'funding',     name: 'Disrupt Africa',             tier: 1 },
  { url: 'https://www.howwemadeitinafrica.com/feed/',                  market: 'africa',    sector: 'markets',     name: 'How We Made It In Africa',   tier: 1 },
  { url: 'https://africabusiness.com/feed/',                           market: 'africa',    sector: 'markets',     name: 'Africa Business',            tier: 1 },
  { url: 'https://www.businessdailyafrica.com/feed/',                  market: 'africa',    sector: 'markets',     name: 'Business Daily Africa',      tier: 1 },
  { url: 'https://www.vanguardngr.com/category/business/feed/',        market: 'africa',    sector: 'markets',     name: 'Vanguard Nigeria Business',  tier: 1 },
  { url: 'https://businessday.ng/feed/',                               market: 'africa',    sector: 'markets',     name: 'BusinessDay Nigeria',        tier: 1 },
  { url: 'https://www.myjoyonline.com/feed/',                          market: 'africa',    sector: 'markets',     name: 'MyJoyOnline Ghana',          tier: 2 },
  { url: 'https://techpoint.africa/feed/',                             market: 'africa',    sector: 'ai',          name: 'Techpoint Africa',           tier: 1 },
  { url: 'https://nairobilaw.com/feed/',                               market: 'africa',    sector: 'policy',      name: 'Nairobi Law Monthly',        tier: 2 },

  // ── UK & EUROPE ───────────────────────────────────────────────────────
  { url: 'https://feeds.bbci.co.uk/news/business/rss.xml',            market: 'uk',        sector: 'markets',     name: 'BBC Business',               tier: 1 },
  { url: 'https://www.theguardian.com/business/rss',                   market: 'uk',        sector: 'markets',     name: 'Guardian Business',          tier: 1 },
  { url: 'https://www.theguardian.com/uk/technology/rss',              market: 'uk',        sector: 'ai',          name: 'Guardian Tech',              tier: 1 },
  { url: 'https://techcrunch.com/tag/europe/feed/',                    market: 'uk',        sector: 'ai',          name: 'TechCrunch Europe',          tier: 1 },
  { url: 'https://sifted.eu/feed/',                                    market: 'uk',        sector: 'funding',     name: 'Sifted EU Startups',         tier: 1 },
  { url: 'https://www.uktech.news/feed',                               market: 'uk',        sector: 'ai',          name: 'UK Tech News',               tier: 1 },
  { url: 'https://www.realbusiness.co.uk/feed',                        market: 'uk',        sector: 'markets',     name: 'Real Business UK',           tier: 1 },
  { url: 'https://smallbusiness.co.uk/feed/',                          market: 'uk',        sector: 'markets',     name: 'Small Business UK',          tier: 1 },

  // ── LATIN AMERICA ─────────────────────────────────────────────────────
  { url: 'https://www.contxto.com/en/feed/',                           market: 'latam',     sector: 'ai',          name: 'Contxto LatAm Tech',         tier: 1 },
  { url: 'https://lavca.org/feed/',                                    market: 'latam',     sector: 'funding',     name: 'LAVCA VC Latin America',     tier: 1 },
  { url: 'https://www.americaeconomia.com/rss.xml',                    market: 'latam',     sector: 'markets',     name: 'America Economia',           tier: 1 },
  { url: 'https://startupbrasil.com.br/feed/',                         market: 'latam',     sector: 'funding',     name: 'Startup Brasil',             tier: 2 },
  { url: 'https://www.eleconomista.com.mx/rss.xml',                    market: 'latam',     sector: 'markets',     name: 'El Economista Mexico',       tier: 1 },
  { url: 'https://www.portafolio.co/rss/portafolio.xml',               market: 'latam',     sector: 'markets',     name: 'Portafolio Colombia',        tier: 1 },
];

// ---------------------------------------------------------------------------
// Country context — used for local signal matching
// ---------------------------------------------------------------------------
export const COUNTRY_CONTEXT: Record<string, { flag: string; currency: string; region: string }> = {
  jamaica:     { flag: '🇯🇲', currency: 'JMD', region: 'caribbean' },
  trinidad:    { flag: '🇹🇹', currency: 'TTD', region: 'caribbean' },
  barbados:    { flag: '🇧🇧', currency: 'BBD', region: 'caribbean' },
  guyana:      { flag: '🇬🇾', currency: 'GYD', region: 'caribbean' },
  nigeria:     { flag: '🇳🇬', currency: 'NGN', region: 'africa'    },
  kenya:       { flag: '🇰🇪', currency: 'KES', region: 'africa'    },
  ghana:       { flag: '🇬🇭', currency: 'GHS', region: 'africa'    },
  'south africa': { flag: '🇿🇦', currency: 'ZAR', region: 'africa' },
  uk:          { flag: '🇬🇧', currency: 'GBP', region: 'uk'        },
  mexico:      { flag: '🇲🇽', currency: 'MXN', region: 'latam'     },
  brazil:      { flag: '🇧🇷', currency: 'BRL', region: 'latam'     },
  colombia:    { flag: '🇨🇴', currency: 'COP', region: 'latam'     },
  argentina:   { flag: '🇦🇷', currency: 'ARS', region: 'latam'     },
  usa:         { flag: '🇺🇸', currency: 'USD', region: 'global'    },
};
