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
}

export interface AnalysisResult {
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
}

export interface DeepDiveResult {
  business_plan: string;
  cost_breakdown: { item: string; cost: number }[];
  grants: string[];
  checklist: string[];
  investors: { name: string; focus: string; stage: string }[];
}
