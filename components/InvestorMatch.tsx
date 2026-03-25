import React from 'react';
import { motion } from 'motion/react';
import { Users, Target, ArrowUpRight } from 'lucide-react';
import { DeepDiveResult } from './types';

// Known investor homepages — checked against AI-generated names
const KNOWN_INVESTOR_URLS: Record<string, string> = {
  'sequoia capital': 'https://www.sequoiacap.com',
  'andreessen horowitz': 'https://a16z.com',
  'a16z': 'https://a16z.com',
  'y combinator': 'https://www.ycombinator.com',
  'techstars': 'https://www.techstars.com',
  'first round capital': 'https://firstround.com',
  'benchmark': 'https://benchmark.com',
  'kleiner perkins': 'https://www.kleinerperkins.com',
  'accel': 'https://www.accel.com',
  'lightspeed venture partners': 'https://lsvp.com',
  'lightspeed': 'https://lsvp.com',
  'general catalyst': 'https://www.generalcatalyst.com',
  'greylock': 'https://greylock.com',
  'greylock partners': 'https://greylock.com',
  'index ventures': 'https://www.indexventures.com',
  'bessemer venture partners': 'https://www.bvp.com',
  'bessemer': 'https://www.bvp.com',
  'founders fund': 'https://foundersfund.com',
  'tiger global': 'https://www.tigerglobal.com',
  'tiger global management': 'https://www.tigerglobal.com',
  'softbank': 'https://www.softbank.jp/en/corp/group/sbg/',
  'softbank vision fund': 'https://visionfund.com',
  'kpcb': 'https://www.kleinerperkins.com',
  'union square ventures': 'https://www.usv.com',
  'usv': 'https://www.usv.com',
  'spark capital': 'https://www.sparkcapital.com',
  'NEA': 'https://www.nea.com',
  'new enterprise associates': 'https://www.nea.com',
  'battery ventures': 'https://www.battery.com',
  'insight partners': 'https://www.insightpartners.com',
  'sv angel': 'https://svangel.com',
  'sv angel (ron conway)': 'https://svangel.com',
  '500 startups': 'https://500.co',
  '500 global': 'https://500.co',
  'social capital': 'https://www.socialcapital.com',
  'lowercase capital': 'https://www.lowercase.vc',
  'lowercase vc': 'https://www.lowercase.vc',
  'flatiron health': 'https://flatiron.com',
  'lux capital': 'https://www.luxcapital.com',
  'lux capital management': 'https://www.luxcapital.com',
  'blue run ventures': 'https://www.bluerun.com',
  'true ventures': 'https://trueventures.com',
  'founder collective': 'https://foundercollective.com',
  'folio ventures': 'https://folio.ventures',
  'obvious ventures': 'https://obvious.com',
  'initialized capital': 'https://initialized.com',
  'garry tan': 'https://initialized.com',
  'khosla ventures': 'https://www.khoslaventures.com',
  'canaan partners': 'https://www.canaan.com',
  'ifc': 'https://www.ifc.org',
  'world bank': 'https://www.worldbank.org',
  'sba': 'https://www.sba.gov',
  'impact america fund': 'https://impactamericafund.com',
};

function getInvestorUrl(name: string): string {
  const key = name.toLowerCase().trim();
  if (KNOWN_INVESTOR_URLS[key]) return KNOWN_INVESTOR_URLS[key];
  // Partial match — find if any known key is contained in the name
  for (const [k, url] of Object.entries(KNOWN_INVESTOR_URLS)) {
    if (key.includes(k) || k.includes(key)) return url;
  }
  // Fallback: specific investment thesis search
  return `https://www.google.com/search?q=${encodeURIComponent(name + ' venture capital investment thesis')}`;
}

interface InvestorMatchProps {
  deepDiveResult: DeepDiveResult;
}

export const InvestorMatch: React.FC<InvestorMatchProps> = ({ deepDiveResult }) => {
  return (
    <motion.div
      key="investors"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="flex items-center gap-4 border-b-2 border-foreground pb-4">
        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
          <Users className="w-6 h-6" />
        </div>
        <h3 className="text-2xl font-serif italic tracking-tight">Investor Matchmaking</h3>
      </div>

      <div className="space-y-4">
        {deepDiveResult.investors.map((investor, i) => (
          <div key={i} className="bg-white border-2 border-foreground p-6 hover:bg-gray-50 transition-all group">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-grow">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-bold text-lg uppercase tracking-tight">{investor.name}</h4>
                  <span className="text-[10px] font-mono bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded uppercase font-bold">
                    {investor.stage}
                  </span>
                </div>
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <Target className="w-4 h-4 mt-0.5 flex-shrink-0 opacity-40" />
                  <p>{investor.focus}</p>
                </div>
              </div>
              <a
                href={getInvestorUrl(investor.name)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[10px] font-mono uppercase font-bold border border-foreground px-4 py-2 hover:bg-foreground hover:text-background transition-all self-start md:self-center"
              >
                View Thesis
                <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-xl">
        <h4 className="text-xs font-mono uppercase font-bold text-indigo-900 mb-2">Pitching Strategy</h4>
        <p className="text-xs text-indigo-800 leading-relaxed">
          Focus your pitch on the specific signal that triggered this opportunity. Investors in this stage prioritize founders who have identified a clear, time-sensitive market gap created by policy or tech shifts.
        </p>
      </div>
    </motion.div>
  );
};
