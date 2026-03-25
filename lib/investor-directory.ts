/**
 * Known investor homepages for the View Thesis button.
 * Keys are lowercase so matching works after .toLowerCase().trim().
 * When Gemini returns a name not in this list the fallback is a
 * targeted Google search for the firm's investment thesis.
 */
export const INVESTOR_DIRECTORY: Record<string, string> = {
  // ── Tier-1 US VC ────────────────────────────────────────────────────────
  'sequoia': 'https://www.sequoiacap.com',
  'sequoia capital': 'https://www.sequoiacap.com',
  'andreessen horowitz': 'https://a16z.com',
  'andreessen': 'https://a16z.com',
  'a16z': 'https://a16z.com',
  'kleiner perkins': 'https://www.kleinerperkins.com',
  'kpcb': 'https://www.kleinerperkins.com',
  'accel': 'https://www.accel.com',
  'accel partners': 'https://www.accel.com',
  'benchmark': 'https://www.benchmark.com',
  'benchmark capital': 'https://www.benchmark.com',
  'index ventures': 'https://www.indexventures.com',
  'general catalyst': 'https://www.generalcatalyst.com',
  'lightspeed': 'https://lsvp.com',
  'lightspeed venture partners': 'https://lsvp.com',
  'lightspeed ventures': 'https://lsvp.com',
  'greylock': 'https://greylock.com',
  'greylock partners': 'https://greylock.com',
  'bessemer': 'https://www.bvp.com',
  'bessemer venture partners': 'https://www.bvp.com',
  'bvp': 'https://www.bvp.com',
  'founders fund': 'https://foundersfund.com',
  'tiger global': 'https://www.tigerglobal.com',
  'tiger global management': 'https://www.tigerglobal.com',
  'softbank': 'https://www.softbank.jp/en/corp/investment',
  'softbank vision fund': 'https://visionfund.com',
  'vision fund': 'https://visionfund.com',
  'y combinator': 'https://www.ycombinator.com',
  'ycombinator': 'https://www.ycombinator.com',
  'yc': 'https://www.ycombinator.com',
  'techstars': 'https://www.techstars.com',
  '500 startups': 'https://500.co',
  '500 global': 'https://500.co',
  'first round capital': 'https://firstround.com',
  'first round': 'https://firstround.com',
  'union square ventures': 'https://www.usv.com',
  'usv': 'https://www.usv.com',
  'spark capital': 'https://www.sparkcapital.com',
  'nea': 'https://www.nea.com',
  'new enterprise associates': 'https://www.nea.com',
  'battery ventures': 'https://www.battery.com',
  'insight partners': 'https://www.insightpartners.com',
  'insight venture partners': 'https://www.insightpartners.com',
  'sv angel': 'https://svangel.com',
  'social capital': 'https://www.socialcapital.com',
  'lux capital': 'https://www.luxcapital.com',
  'khosla ventures': 'https://www.khoslaventures.com',
  'true ventures': 'https://trueventures.com',
  'founder collective': 'https://foundercollective.com',
  'obvious ventures': 'https://obvious.com',
  'initialized capital': 'https://initialized.com',
  'canaan': 'https://www.canaan.com',
  'canaan partners': 'https://www.canaan.com',
  'flatiron health': 'https://flatiron.com',
  'general atlantic': 'https://www.generalatlantic.com',
  'coatue': 'https://www.coatue.com',
  'coatue management': 'https://www.coatue.com',
  'durable capital': 'https://www.durablecapital.com',
  'slow ventures': 'https://slow.co',
  'pear vc': 'https://pear.vc',
  'pear': 'https://pear.vc',
  'blue run ventures': 'https://www.bluerun.com',
  'lowercase capital': 'https://www.lowercase.vc',

  // ── Climate / Sustainability ─────────────────────────────────────────────
  's2g ventures': 'https://s2gventures.com',
  'agfunder': 'https://agfunder.com',
  'breakthrough energy ventures': 'https://breakthroughenergy.org/our-work/breakthrough-energy-ventures',
  'breakthrough energy': 'https://breakthroughenergy.org',
  'congruent ventures': 'https://congruentvc.com',
  'energy impact partners': 'https://www.energyimpactpartners.com',
  'lowercarbon capital': 'https://lowercarboncapital.com',
  'clean energy ventures': 'https://cleanenergyventures.com',
  'prelude ventures': 'https://www.preludeventures.com',
  'chrysalix venture capital': 'https://chrysalix.com',
  'cleantech group': 'https://www.cleantech.com',
  'new crop capital': 'https://newcropcapital.com',
  'good food institute': 'https://gfi.org',
  'blue horizon': 'https://www.bluehorizoncorporation.com',
  'gfi': 'https://gfi.org',

  // ── Health / Life Sciences ───────────────────────────────────────────────
  'a16z bio': 'https://a16z.com/bio',
  'andreessen horowitz bio': 'https://a16z.com/bio',
  'rock health': 'https://rockhealth.com',
  'omers ventures': 'https://www.omersventures.com',
  'general atlantic growth': 'https://www.generalatlantic.com',
  'hms ventures': 'https://www.hmsventures.com',
  'deerfield management': 'https://www.deerfield.com',

  // ── Impact / Emerging Markets ────────────────────────────────────────────
  'omidyar network': 'https://omidyar.com',
  'village capital': 'https://vilcap.com',
  'idb lab': 'https://idblab.org',
  'inter-american development bank': 'https://idblab.org',
  'idb': 'https://idblab.org',
  'caribbean development bank': 'https://www.caribank.org',
  'caribank': 'https://www.caribank.org',
  'development bank of jamaica': 'https://www.dbankjm.com',
  'dbj': 'https://www.dbankjm.com',
  'tony elumelu foundation': 'https://www.tonyelumelufoundation.org',
  'mastercard foundation': 'https://mastercardfdn.org',
  'african development bank': 'https://www.afdb.org',
  'afdb': 'https://www.afdb.org',
  'world bank': 'https://www.worldbank.org',
  'world bank ifc': 'https://www.ifc.org',
  'ifc': 'https://www.ifc.org',
  'sba': 'https://www.sba.gov',
  'impact america fund': 'https://impactamericafund.com',
  'patient capital collaborative': 'https://www.patientcapital.org',
  'acumen': 'https://acumen.org',

  // ── UK / Europe ──────────────────────────────────────────────────────────
  'innovate uk': 'https://www.ukri.org/councils/innovate-uk',
  'british business bank': 'https://www.british-business-bank.co.uk',
  'horizon europe': 'https://research-and-innovation.ec.europa.eu/funding/funding-programmes-and-open-calls/horizon-europe_en',
  'northzone': 'https://northzone.com',
  'balderton capital': 'https://www.balderton.com',
  'balderton': 'https://www.balderton.com',
  'atomico': 'https://www.atomico.com',
  'seedcamp': 'https://seedcamp.com',
  'notion capital': 'https://notion.vc',
};

/**
 * Returns the best URL for a given investor name:
 * 1. Exact match in directory (case-insensitive)
 * 2. Partial match (name contains or is contained by a directory key)
 * 3. Targeted Google search for investment thesis
 */
export function getInvestorUrl(name: string): string {
  const key = name.toLowerCase().trim();

  // Exact match
  if (INVESTOR_DIRECTORY[key]) return INVESTOR_DIRECTORY[key];

  // Partial match — shorter key contained in longer name or vice versa
  for (const [k, url] of Object.entries(INVESTOR_DIRECTORY)) {
    if (key.includes(k) || k.includes(key)) return url;
  }

  // Targeted fallback — search for their investment thesis specifically
  const q = encodeURIComponent(`"${name}" venture capital investment thesis portfolio`);
  return `https://www.google.com/search?q=${q}`;
}
