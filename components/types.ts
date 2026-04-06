export interface Opportunity {
  name: string;
  description: string;
  target_customer: string;
  why_now: string;
  monetization: string;
  pricing_model: string;
  status: string;
  priority: 'High' | 'Medium' | 'Low';
  startup_cost: number;
  grant_eligible: boolean;
  speed_to_launch: number;
  difficulty: number;
  roi_potential: number;
  urgency: number;
  local_fit: number;
  competition_gap: number;
  money_score: number;
  compound_advantage?: string;
}

export type MarketMode = 'global' | 'caribbean' | 'africa' | 'uk' | 'latam';

export interface MarketModeConfig {
  id: MarketMode;
  label: string;
  flag: string;
  description: string;
  grantSources: string[];
  promptContext: string;
}

export interface AnalysisResult {
  id?: string;
  summary: string;
  trend: string;
  affected_groups: string[];
  problems: string[];
  opportunities: Opportunity[];
  best_idea: {
    name: string;
    reason: string;
    who_should_build: string;
    cost_estimate: string;
    speed_rating: string;
    first_steps: string[];
  };
  createdAt?: string;
  marketMode?: MarketMode;
  countryTag?: string;
  // Compound analysis fields
  isCompound?: boolean;
  compound_trend?: string;
  convergence_score?: number;
  signal_connections?: string[];
  sources?: { title: string; source: string; url: string }[];
  sourceCount?: number;
  // AI Intelligence verdict fields
  ai_verdict?: 'Truth' | 'Emerging' | 'Fad';
  ai_evidence?: string;
  real_world_roi?: string | null;
  // Your Next Move
  today_action?: string;
  today_action_type?: 'research' | 'talk' | 'build' | 'apply' | 'test';
}

export interface CostBreakdownItem {
  item: string;
  cost: number;
  type: 'one-time' | 'monthly';
  notes?: string;
  source_url?: string;
}

export interface GrantItem {
  name: string;
  organization: string;
  amount: string;
  who_qualifies: string;
  why_this_qualifies: string;
  how_to_apply: string;
  url?: string;
}

export interface ChecklistStep {
  title: string;
  description: string;
  phase: number; // 1=Research, 2=Legal/Setup, 3=Build, 4=Launch
  time_estimate: string;
  cost?: string;
}

export interface DeepDiveResult {
  business_plan: string;
  cost_breakdown: CostBreakdownItem[];
  grants: GrantItem[];
  checklist: ChecklistStep[];
  investors: { name: string; focus: string; stage: string; website?: string }[];
}

export type OpportunityStatus = 'Saved' | 'In Progress' | 'Launched';

export interface LandingPageData {
  hero_headline: string;
  hero_subheadline: string;
  cta_text: string;
  value_proposition: {
    feature_title: string;
    feature_description: string;
    icon_name: string; // Generic icon name suggestion e.g. "Zap", "Shield", "TrendingUp"
  }[];
  target_audience_pain: string;
  solution_statement: string;
  color_theme: {
    primary: string; // Tailwind color name e.g. "blue", "emerald", "indigo", "rose", "amber"
    background: 'light' | 'dark';
  };
  pricing_suggestion: {
    tier_name: string;
    price: string;
    perks: string[];
  }[];
}

export interface SavedOpportunity {
  id?: string;
  userId: string;
  opportunity: Opportunity;
  deepDive: DeepDiveResult;
  status: OpportunityStatus;
  checklist: { text: string; completed: boolean }[];
  savedAt: string;
  marketMode?: MarketMode;
  landingPage?: LandingPageData;
  pitchDeck?: PitchDeckData;
}

export interface UserAction {
  id?: string;
  userId: string;
  actionText: string;
  actionType: 'next_move' | 'checklist' | 'custom';
  completedAt: string; // ISO DateTime
}

export interface Lead {
  id?: string;
  opportunityId: string;
  email: string;
  createdAt: string;
}

export interface PitchDeckData {
  title: {
    company_name: string;
    one_liner: string;
  };
  problem: string[];
  solution: string[];
  market_size: {
    tam: string;
    sam: string;
    som: string;
    explanation: string;
  };
  business_model: string[];
  go_to_market: string[];
  competition: {
    competitor_types: string;
    our_advantage: string;
  };
  traction: string[];
  team: string[];
  the_ask: {
    amount: string;
    use_of_funds: string[];
  };
}

export type SectorKey = 'ai' | 'policy' | 'markets' | 'funding' | 'sustainability' | 'realestate' | 'health' | 'ai_intelligence';

export interface SectorConfig {
  key: SectorKey;
  label: string;
  color: string;
  borderColor: string;
  bgColor: string;
  textColor: string;
  badgeBg: string;
  badgeText: string;
}

export const SECTOR_CONFIGS: Record<SectorKey, SectorConfig> = {
  ai:             { key: 'ai',             label: 'AI & Tech',        color: 'indigo',  borderColor: 'border-indigo-300',  bgColor: 'bg-indigo-50',   textColor: 'text-indigo-700',  badgeBg: 'bg-indigo-100',   badgeText: 'text-indigo-800'  },
  policy:         { key: 'policy',         label: 'Policy',           color: 'amber',   borderColor: 'border-amber-300',   bgColor: 'bg-amber-50',    textColor: 'text-amber-700',   badgeBg: 'bg-amber-100',    badgeText: 'text-amber-800'   },
  markets:        { key: 'markets',        label: 'Market Shifts',    color: 'emerald', borderColor: 'border-emerald-300', bgColor: 'bg-emerald-50',  textColor: 'text-emerald-700', badgeBg: 'bg-emerald-100',  badgeText: 'text-emerald-800' },
  funding:        { key: 'funding',        label: 'Funding & Grants', color: 'green',   borderColor: 'border-green-300',   bgColor: 'bg-green-50',    textColor: 'text-green-700',   badgeBg: 'bg-green-100',    badgeText: 'text-green-800'   },
  sustainability: { key: 'sustainability', label: 'Sustainability',   color: 'teal',    borderColor: 'border-teal-300',    bgColor: 'bg-teal-50',     textColor: 'text-teal-700',    badgeBg: 'bg-teal-100',     badgeText: 'text-teal-800'    },
  realestate:     { key: 'realestate',     label: 'Real Estate',      color: 'orange',  borderColor: 'border-orange-300',  bgColor: 'bg-orange-50',   textColor: 'text-orange-700',  badgeBg: 'bg-orange-100',   badgeText: 'text-orange-800'  },
  health:         { key: 'health',         label: 'Health',           color: 'pink',    borderColor: 'border-pink-300',    bgColor: 'bg-pink-50',     textColor: 'text-pink-700',    badgeBg: 'bg-pink-100',     badgeText: 'text-pink-800'    },
  ai_intelligence: { key: 'ai_intelligence', label: 'AI Intelligence', color: 'violet', borderColor: 'border-violet-300', bgColor: 'bg-violet-50', textColor: 'text-violet-700', badgeBg: 'bg-violet-100', badgeText: 'text-violet-800' },
};

export interface FeedSignal {
  title: string;
  source: string;
  publishedAt: string;
  url: string;
  sector: SectorKey;
  category: string;
  color: string;
  snippet: string;
  strength: number;
  signalScore?: number;
  market?: string;
  isLocalSource?: boolean;
  isGlobalMention?: boolean;
}

export type RecencyFilter = '24h' | '3d' | '7d';

export interface FeedFilters {
  sectors: SectorKey[];
  recency: RecencyFilter;
}
