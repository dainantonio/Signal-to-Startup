export interface UILabels {
  feedTitle: string;
  analyzeButton: string;
  intelligenceBriefing: string;
  emergingTrend: string;
  affectedGroups: string;
  topOpportunities: string;
  executionSuite: string;
  businessPlan: string;
  startupCosts: string;
  fundingGrants: string;
  checklist: string;
  investorMatch: string;
  viewTopOpportunity: string;
  deepDiveButton: string;
  signalScore: boolean | null;
  metricsVisible: boolean;
  opportunityCount: number;
}

export function getLabels(level: 'simple' | 'standard' | 'advanced'): UILabels {
  if (level === 'simple') return {
    feedTitle: "What's happening in your market",
    analyzeButton: '⚡ Find opportunities',
    intelligenceBriefing: "Here's what's happening",
    emergingTrend: 'The opportunity',
    affectedGroups: 'Who this affects',
    topOpportunities: 'Business ideas for you',
    executionSuite: 'How to start',
    businessPlan: 'Your step-by-step plan',
    startupCosts: 'What you\'ll need',
    fundingGrants: 'Money you can apply for',
    checklist: 'Your action list',
    investorMatch: 'Who can back you',
    viewTopOpportunity: 'See the best idea →',
    deepDiveButton: 'Show me how to start',
    signalScore: null,
    metricsVisible: false,
    opportunityCount: 1,
  };

  if (level === 'advanced') return {
    feedTitle: 'Market Intelligence Feed',
    analyzeButton: '⚡ Extract opportunities',
    intelligenceBriefing: 'Intelligence Briefing',
    emergingTrend: 'Emerging Trend',
    affectedGroups: 'Affected Groups',
    topOpportunities: 'Opportunity Matrix',
    executionSuite: 'Execution Suite',
    businessPlan: 'Strategic Business Plan',
    startupCosts: 'Capital Requirements',
    fundingGrants: 'Funding & Grants',
    checklist: 'Launch Checklist',
    investorMatch: 'Investor Match',
    viewTopOpportunity: 'View Top Opportunity →',
    deepDiveButton: 'Generate Execution Suite',
    signalScore: true,
    metricsVisible: true,
    opportunityCount: 3,
  };

  // standard (default)
  return {
    feedTitle: 'Your signal feed',
    analyzeButton: '⚡ Analyze signal',
    intelligenceBriefing: 'Intelligence Briefing',
    emergingTrend: 'Emerging Trend',
    affectedGroups: 'Impacted Groups',
    topOpportunities: 'Top Opportunities',
    executionSuite: 'Execution Suite',
    businessPlan: 'Business Plan',
    startupCosts: 'Startup Costs',
    fundingGrants: 'Funding & Grants',
    checklist: 'Launch Checklist',
    investorMatch: 'Investor Match',
    viewTopOpportunity: 'View Top Opportunity →',
    deepDiveButton: 'Generate Execution Suite',
    signalScore: true,
    metricsVisible: true,
    opportunityCount: 3,
  };
}
