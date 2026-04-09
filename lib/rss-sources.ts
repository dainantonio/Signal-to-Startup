// ---------------------------------------------------------------------------
// RSS source registry — curated, tiered, market-segmented
// ---------------------------------------------------------------------------

export interface RSSSource {
  url: string;
  market: 'global' | 'caribbean' | 'africa' | 'uk' | 'latam';
  sector: 'ai' | 'policy' | 'markets' | 'funding' | 'sustainability' | 'realestate' | 'health' | 'ai_intelligence' | 'retail' | 'food' | 'workforce' | 'agriculture' | 'tourism' | 'remittances';
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
  'sportingnews.com', 'goal.com',
  'skysports.com', 'espn.go.com',
  'covers.com', 'draftkings.com', 'fanduel.com',
  // Entertainment
  'tmz.com', 'eonline.com', 'people.com',
  'usmagazine.com', 'rollingstone.com',
  'billboard.com', 'hollywoodreporter.com',
  'variety.com',
  // Low quality / spam / academic (not business-relevant)
  'whatjapanthinks.com',
  'nature.com',
];

// ---------------------------------------------------------------------------
// Spam title patterns — SEO bait, scam-review sites
// ---------------------------------------------------------------------------
export const SPAM_TITLE_PATTERNS = [
  // Scam / SEO bait
  'review:', 'scam?', 'facts uncovered',
  'claims vs reality', 'real or fake',
  'legit or scam', 'is it legit',
  'unveiled', 'exposed', 'leaked',
  "you won't believe", 'shocking',
  'vs reality', 'the truth about',
  // Crime / courts (not business signals)
  'granted bail', 'conspiracy charges',
  'arrested', 'charged with',
  'murder', 'shooting', 'robbery',
  'crime', 'police', 'court hearing',
  'sentenced to', 'pleaded guilty',
  'drug bust', 'smuggling charges',
  // Sports
  'eligibility lawsuit', 'ncaa',
  'college athlete', 'defensive lineman',
  'transfer portal', 'athletic eligibility',
  'nfl', 'nba', 'mlb', 'nhl', 'fifa',
  'premier league', 'champions league',
  'transfer window', 'match preview',
  'injury update', 'game recap',
  'fantasy sports', 'betting odds',
  'sports betting', 'nfl draft',
  // Entertainment
  'celebrity', 'kardashian', 'taylor swift',
  'box office', 'album drops', 'concert',
  'red carpet', 'grammy', 'oscar',
  'emmy', 'reality tv', 'dating show',
  // Crypto noise
  'price prediction', 'bull run',
  'to the moon', 'presale', 'meme coin',
  '100x', 'get rich', 'passive income crypto',
  'nft drop', 'web3 game',
  // General noise
  'horoscope', 'zodiac', 'recipe',
  'weather', 'traffic', 'obituary',
  'wedding announcement', 'sports score',
  'listicle', 'quiz:', 'ranked:',
  'worst movies', 'best restaurants',
  // Consumer deals / shopping noise
  'best deals', 'deals available',
  'right now', 'sale ends', 'discount',
  'coupon', 'promo code', 'buy now',
  'limited time', 'cheap', 'affordable',
  'budget', 'under $', 'save money',
  'best buy', 'shopping guide',
  'gift guide', 'holiday deals',
  'black friday', 'cyber monday',
  'prime day', 'best apple',
  'best samsung', 'best iphone',
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
  { url: 'https://aiindex.stanford.edu/feed/',                         market: 'global', sector: 'ai_intelligence', name: 'Stanford AI Index',          tier: 1 },
  { url: 'https://www.mckinsey.com/capabilities/quantumblack/our-insights/rss', market: 'global', sector: 'ai_intelligence', name: 'McKinsey AI',          tier: 1 },
  { url: 'https://www.technologyreview.com/feed/',                     market: 'global', sector: 'ai_intelligence', name: 'MIT Tech Review',            tier: 1 },
  { url: 'https://newsletter.pragmaticengineer.com/feed',              market: 'global', sector: 'ai_intelligence', name: 'Pragmatic Engineer',         tier: 1 },

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
  // ── CARIBBEAN — verified working 2026-04-08 ──────────────────────────
  { url: 'https://www.jamaicaobserver.com/feed/',                      market: 'caribbean', sector: 'markets',     name: 'Jamaica Observer',           tier: 1 },
  { url: 'https://jamaica-gleaner.com/rss.xml',                        market: 'caribbean', sector: 'markets',     name: 'Jamaica Gleaner',            tier: 1 },
  { url: 'https://caribbeanbusinessreport.com/feed/',                  market: 'caribbean', sector: 'markets',     name: 'Caribbean Business Report',  tier: 1 },
  { url: 'https://www.trinidadexpress.com/search/?f=rss',              market: 'caribbean', sector: 'markets',     name: 'Trinidad Express',           tier: 1 },
  { url: 'https://www.caribbean360.com/feed/',                         market: 'caribbean', sector: 'markets',     name: 'Caribbean360',               tier: 1 },
  { url: 'https://www.nationnews.com/feed/',                           market: 'caribbean', sector: 'markets',     name: 'Nation News Barbados',       tier: 2 },
  { url: 'https://iwnsvg.com/feed/',                                   market: 'caribbean', sector: 'markets',     name: 'iWitness News SVG',          tier: 2 },
  { url: 'https://www.jamaicaobserver.com/category/business/feed/',    market: 'caribbean', sector: 'funding',     name: 'Jamaica Observer Business',  tier: 1 },
  { url: 'https://jis.gov.jm/feed/',                                   market: 'caribbean', sector: 'policy',      name: 'Jamaica Information Service', tier: 1 },
  { url: 'https://blogs.iadb.org/caribbean-dev-trends/en/feed/',       market: 'caribbean', sector: 'funding',     name: 'IDB Caribbean Dev',          tier: 1 },

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

  // ── AI INTELLIGENCE — Real ROI, trends, not hype ─────────────────────
  { url: 'https://www.technologyreview.com/feed/',                        market: 'global', sector: 'ai_intelligence', name: 'MIT Tech Review AI',    tier: 1 },
  { url: 'https://newsletter.pragmaticengineer.com/feed',                 market: 'global', sector: 'ai_intelligence', name: 'Pragmatic Engineer',     tier: 1 },
  { url: 'https://feeds.feedburner.com/venturebeat/SZYF',                 market: 'global', sector: 'ai_intelligence', name: 'VentureBeat AI',         tier: 1 },
  { url: 'https://techcrunch.com/category/artificial-intelligence/feed/', market: 'global', sector: 'ai_intelligence', name: 'TechCrunch AI',          tier: 1 },

  // ── US — Retail & E-commerce ──────────────────────────────────────────
  { url: 'https://feeds.retaildive.com/~/t/0/0/retaildive/~retaildive.com', market: 'global', sector: 'retail',  name: 'Retail Dive',                tier: 1 },
  { url: 'https://www.pymnts.com/feed/',                                market: 'global',    sector: 'retail',      name: 'PYMNTS',                     tier: 1 },

  // ── US — Food & Beverage ──────────────────────────────────────────────
  { url: 'https://www.fooddive.com/feeds/news/',                        market: 'global',    sector: 'food',        name: 'Food Dive',                  tier: 1 },
  { url: 'https://www.nrn.com/rss.xml',                                 market: 'global',    sector: 'food',        name: "Nation's Restaurant News",   tier: 1 },

  // ── US — Workforce ────────────────────────────────────────────────────
  { url: 'https://www.shrm.org/rss/pages/rss.aspx',                    market: 'global',    sector: 'workforce',   name: 'SHRM',                       tier: 1 },
  { url: 'https://www.hrdive.com/feeds/news/',                          market: 'global',    sector: 'workforce',   name: 'HR Dive',                    tier: 2 },

  // ── CARIBBEAN — Tourism ───────────────────────────────────────────────
  { url: 'https://www.travelweekly.com/rss',                            market: 'caribbean', sector: 'tourism',     name: 'Travel Weekly',              tier: 2 },
  { url: 'https://caribbeanjournal.com/feed/',                          market: 'caribbean', sector: 'tourism',     name: 'Caribbean Journal',          tier: 1 },

  // ── CARIBBEAN — Agriculture ───────────────────────────────────────────
  { url: 'https://www.caribbean360.com/feed/',                          market: 'caribbean', sector: 'agriculture', name: 'Caribbean360 Agriculture',   tier: 2 },

  // ── CARIBBEAN — Remittances ───────────────────────────────────────────
  { url: 'https://www.centralbanking.com/rss',                          market: 'caribbean', sector: 'remittances', name: 'Central Banking',            tier: 2 },

  // ── AFRICA — Agriculture ──────────────────────────────────────────────
  { url: 'https://www.agrilinks.org/rss.xml',                           market: 'africa',    sector: 'agriculture', name: 'Agrilinks',                  tier: 2 },
  { url: 'https://africabusiness.com/feed/',                            market: 'africa',    sector: 'agriculture', name: 'Africa Business',            tier: 1 },

  // ── AFRICA — Mobile Money & Remittances ───────────────────────────────
  { url: 'https://nairametrics.com/feed/',                              market: 'africa',    sector: 'remittances', name: 'Nairametrics',               tier: 1 },
  { url: 'https://techpoint.africa/feed/',                              market: 'africa',    sector: 'remittances', name: 'Techpoint Africa',           tier: 1 },

  // ── AFRICA — Better sources ───────────────────────────────────────────
  { url: 'https://theexchangeafrica.com/feed/',                         market: 'africa',    sector: 'markets',     name: 'The Exchange Africa',        tier: 1 },
  { url: 'https://disrupt-africa.com/feed/',                            market: 'africa',    sector: 'funding',     name: 'Disrupt Africa',             tier: 1 },

  // ── LATAM — Better sources ────────────────────────────────────────────
  { url: 'https://iupana.com/feed/',                                    market: 'latam',     sector: 'remittances', name: 'Iupana LatAm Fintech',       tier: 1 },

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
export const COUNTRY_CONTEXT: Record<string, { name: string; flag: string; currency: string; symbol: string; region: string; keywords: string[] }> = {
  jamaica:        { name: 'Jamaica',      flag: '🇯🇲', currency: 'JMD', symbol: 'J$',  region: 'caribbean', keywords: ['jamaica', 'jamaican', 'kingston', 'montego bay', 'ocho rios', 'ja'] },
  trinidad:       { name: 'Trinidad',     flag: '🇹🇹', currency: 'TTD', symbol: 'TT$', region: 'caribbean', keywords: ['trinidad', 'tobago', 'trinidadian', 'port of spain', 't&t'] },
  barbados:       { name: 'Barbados',     flag: '🇧🇧', currency: 'BBD', symbol: 'Bds$', region: 'caribbean', keywords: ['barbados', 'barbadian', 'bridgetown', 'bajan'] },
  guyana:         { name: 'Guyana',       flag: '🇬🇾', currency: 'GYD', symbol: 'G$',  region: 'caribbean', keywords: ['guyana', 'guyanese', 'georgetown', 'demerara'] },
  nigeria:        { name: 'Nigeria',      flag: '🇳🇬', currency: 'NGN', symbol: '₦',   region: 'africa',    keywords: ['nigeria', 'nigerian', 'lagos', 'abuja', 'naira', 'fintech nigeria'] },
  kenya:          { name: 'Kenya',        flag: '🇰🇪', currency: 'KES', symbol: 'KSh', region: 'africa',    keywords: ['kenya', 'kenyan', 'nairobi', 'mombasa', 'm-pesa', 'east africa'] },
  ghana:          { name: 'Ghana',        flag: '🇬🇭', currency: 'GHS', symbol: 'GH₵', region: 'africa',    keywords: ['ghana', 'ghanaian', 'accra', 'kumasi', 'cedi', 'west africa'] },
  'south africa': { name: 'South Africa', flag: '🇿🇦', currency: 'ZAR', symbol: 'R',   region: 'africa',    keywords: ['south africa', 'south african', 'johannesburg', 'cape town', 'rand', 'joburg'] },
  uk:             { name: 'United Kingdom', flag: '🇬🇧', currency: 'GBP', symbol: '£',   region: 'uk',      keywords: ['uk', 'united kingdom', 'britain', 'british', 'london', 'england', 'scotland', 'wales'] },
  mexico:         { name: 'Mexico',       flag: '🇲🇽', currency: 'MXN', symbol: '$',   region: 'latam',     keywords: ['mexico', 'mexican', 'ciudad de mexico', 'monterrey', 'guadalajara', 'peso'] },
  brazil:         { name: 'Brazil',       flag: '🇧🇷', currency: 'BRL', symbol: 'R$',  region: 'latam',     keywords: ['brazil', 'brazilian', 'sao paulo', 'rio de janeiro', 'brasilia', 'real'] },
  colombia:       { name: 'Colombia',     flag: '🇨🇴', currency: 'COP', symbol: '$',   region: 'latam',     keywords: ['colombia', 'colombian', 'bogota', 'medellin', 'cali', 'peso colombiano'] },
  argentina:      { name: 'Argentina',    flag: '🇦🇷', currency: 'ARS', symbol: '$',   region: 'latam',     keywords: ['argentina', 'argentinian', 'buenos aires', 'cordoba', 'rosario', 'peso argentino'] },
  usa:            { name: 'United States', flag: '🇺🇸', currency: 'USD', symbol: '$',   region: 'global',   keywords: ['united states', 'american', 'us market', 'federal', 'washington', 'new york'] },
};

export function getCountryConfig(country: string) {
  return COUNTRY_CONTEXT[country.toLowerCase()] ?? null;
}

// ---------------------------------------------------------------------------
// Market keyword lists — used for relevance scoring
// ---------------------------------------------------------------------------
export const MARKET_KEYWORDS: Record<string, string[]> = {
  caribbean: [
    // Jamaica
    'jamaica', 'jamaican', 'kingston', 'montego bay', 'ocho rios', 'portmore',
    'spanish town', 'mandeville', 'jps', 'dbj', 'jbdc', 'jmd', 'petrojam',
    'ncb', 'scotiabank jamaica', 'planning institute', 'pioj',
    'ministry of finance jamaica',
    // Trinidad
    'trinidad', 'tobago', 'port of spain', 'ttd', 'ngc', 'bptt',
    // Barbados
    'barbados', 'bridgetown', 'bbd', 'central bank of barbados',
    // Guyana
    'guyana', 'georgetown', 'gyd', 'exxon guyana', 'oil guyana',
    // Regional
    'caribbean', 'caricom', 'carifta', 'oecs', 'caribbean development bank',
    'cdb', 'idb caribbean', 'acp', 'west indies', 'antilles',
    'caribbean sea', 'island nation', 'small island', 'tourism caribbean',
    'remittance caribbean', 'diaspora caribbean',
  ],
  africa: [
    // Nigeria
    'nigeria', 'nigerian', 'lagos', 'abuja', 'naira', 'ngn', 'cbn',
    'access bank', 'gtbank', 'zenith bank', 'flutterwave', 'paystack', 'kuda',
    'tef', 'tony elumelu', 'dangote', 'nse', 'nigerian stock',
    // Ghana
    'ghana', 'ghanaian', 'accra', 'tema', 'cedi', 'ghs', 'bank of ghana',
    'momo ghana', 'vodafone ghana',
    // Kenya
    'kenya', 'kenyan', 'nairobi', 'shilling', 'kes', 'mpesa', 'm-pesa',
    'safaricom', 'equity bank kenya', 'i-hub', 'silicon savannah',
    // South Africa
    'south africa', 'johannesburg', 'cape town', 'rand', 'zar',
    'jse', 'absa', 'standard bank',
    // Rwanda
    'rwanda', 'kigali', 'rwf', 'bank of kigali', 'mtn rwanda',
    // Ethiopia
    'ethiopia', 'addis ababa', 'birr', 'commercial bank ethiopia',
    // Regional
    'africa', 'african', 'sub-saharan', 'west africa', 'east africa',
    'southern africa', 'afcfta', 'african union', 'au summit',
    'afdb', 'african development bank', 'mastercard foundation',
    'mobile money africa', 'fintech africa', 'startup africa', 'tech africa',
    'agritech africa', 'healthtech africa',
  ],
  uk: [
    // UK specific
    'united kingdom', 'uk', 'britain', 'british', 'england', 'scotland',
    'wales', 'northern ireland', 'london', 'manchester', 'birmingham',
    'leeds', 'bristol', 'glasgow', 'gbp', 'pound sterling',
    'bank of england', 'hmrc', 'companies house', 'fca',
    'innovate uk', 'british business bank', 'startup loans uk',
    'prince trust', 'enterprise nation',
    // EU relevance
    'europe', 'european', 'eu', 'eurozone', 'ecb',
  ],
  latam: [
    // Mexico
    'mexico', 'mexican', 'ciudad de mexico', 'cdmx', 'guadalajara',
    'monterrey', 'peso mexicano', 'mxn', 'banxico',
    'innpulsa mexico', 'nacional financiera',
    // Brazil
    'brazil', 'brazilian', 'sao paulo', 'rio de janeiro', 'brasilia',
    'real', 'brl', 'banco do brasil', 'bndes', 'sebrae', 'fintechs brasil',
    // Colombia
    'colombia', 'colombian', 'bogota', 'medellin', 'cali', 'cop',
    'bancolombia', 'innpulsa colombia',
    // Argentina
    'argentina', 'buenos aires', 'ars', 'bcra', 'mercadolibre',
    // Chile
    'chile', 'santiago', 'clp', 'corfo', 'startup chile',
    // Peru
    'peru', 'lima', 'sol', 'pen',
    // Regional
    'latin america', 'latam', 'latinoamerica', 'idb',
    'inter-american development', 'caf development bank',
    'latin american startup', 'fintech latam', 'ecommerce latam',
  ],
  global: [], // no keyword filter for global
};
