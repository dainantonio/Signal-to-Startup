/**
 * Business Plan Structure Validator
 * 
 * Validates business plan against required schema
 * Generates missing sections
 * Condenses long sections to max 6 bullets
 * Uses plain language suitable for first-time founders
 */

import { BusinessPlan, BusinessPlanFormatter } from './businessPlanFormatter';

export interface ValidationResult {
  passed: boolean;
  score: number; // 0-100
  issues: string[];
  fixes: string[];
  validatedPlan: BusinessPlan;
}

export class BusinessPlanValidator {
  private static readonly REQUIRED_SECTIONS = [
    'executiveSummary',
    'customer',
    'offer',
    'goToMarket',
    'operations',
    'financials',
    'risks',
  ];

  private static readonly MAX_BULLETS_PER_SECTION = 6;
  private static readonly MIN_BULLETS_PER_SECTION = 3;

  /**
   * Validate and fix business plan structure
   */
  static validate(plan: BusinessPlan, opportunityContext?: string): ValidationResult {
    const issues: string[] = [];
    const fixes: string[] = [];
    let validatedPlan = { ...plan };

    // Check for missing sections
    const missingSections = this.findMissingSections(plan);
    if (missingSections.length > 0) {
      issues.push(`Missing sections: ${missingSections.join(', ')}`);
      fixes.push('Generated missing sections using opportunity context');
      
      // Generate missing sections
      missingSections.forEach(section => {
        validatedPlan = this.generateSection(validatedPlan, section as keyof BusinessPlan, opportunityContext);
      });
    }

    // Check section lengths
    this.REQUIRED_SECTIONS.forEach(section => {
      const content = validatedPlan[section as keyof BusinessPlan];
      if (Array.isArray(content)) {
        if (content.length > this.MAX_BULLETS_PER_SECTION) {
          issues.push(`${section} has ${content.length} bullets (max ${this.MAX_BULLETS_PER_SECTION})`);
          fixes.push(`Condensed ${section} to ${this.MAX_BULLETS_PER_SECTION} bullets`);
          
          // Condense
          (validatedPlan[section as keyof BusinessPlan] as string[]) = this.condenseBullets(
            content,
            this.MAX_BULLETS_PER_SECTION
          );
        } else if (content.length < this.MIN_BULLETS_PER_SECTION && content.length > 0) {
          issues.push(`${section} has only ${content.length} bullets (min ${this.MIN_BULLETS_PER_SECTION})`);
        }
      }
    });

    // Check timeline structure
    const timelineIssues = this.validateTimeline(validatedPlan.timeline);
    if (timelineIssues.length > 0) {
      issues.push(...timelineIssues);
      fixes.push('Generated balanced timeline with 5 actions per period');
      
      validatedPlan.timeline = this.generateTimeline(opportunityContext || '');
    }

    // Check language complexity
    const complexityIssues = this.checkLanguageComplexity(validatedPlan);
    if (complexityIssues.length > 0) {
      issues.push(...complexityIssues);
      fixes.push('Simplified language for first-time founders');
      
      validatedPlan = this.simplifyLanguage(validatedPlan);
    }

    const score = this.calculateScore(issues.length);
    const passed = score >= 95;

    return {
      passed,
      score,
      issues,
      fixes,
      validatedPlan,
    };
  }

  private static findMissingSections(plan: BusinessPlan): string[] {
    const missing: string[] = [];
    
    this.REQUIRED_SECTIONS.forEach(section => {
      const content = plan[section as keyof BusinessPlan];
      if (!content || (Array.isArray(content) && content.length === 0)) {
        missing.push(section);
      }
    });

    return missing;
  }

  private static generateSection(
    plan: BusinessPlan,
    section: keyof BusinessPlan,
    context?: string
  ): BusinessPlan {
    const updated = { ...plan };
    
    // Generate placeholder content based on section type
    const templates: Record<string, string[]> = {
      executiveSummary: [
        'A startup addressing [market problem] for [target customers]',
        'Offering [solution] that [key benefit]',
        'Target market size: [estimate] with [growth rate]',
        'Revenue model: [how you make money]',
        'Team brings [relevant experience/skills]',
        'Seeking [funding amount] to [key milestones]',
      ],
      customer: [
        'Primary customer: [specific demographic/industry]',
        'Pain point: [what problem they face]',
        'Current solution: [how they solve it today]',
        'Willingness to pay: [price sensitivity]',
        'How to reach them: [channels]',
      ],
      offer: [
        'Core product/service: [what you sell]',
        'Key features: [top 3 capabilities]',
        'Unique value: [why choose you vs alternatives]',
        'Pricing: [price point and model]',
        'Delivery: [how customers get/use it]',
      ],
      goToMarket: [
        'Customer acquisition: [how to find first customers]',
        'Marketing channels: [where to promote]',
        'Sales process: [how to close deals]',
        'Partnerships: [who can help you grow]',
        'Launch timeline: [when to start selling]',
      ],
      operations: [
        'Team needed: [roles to hire]',
        'Key activities: [what you do daily]',
        'Infrastructure: [tools/systems required]',
        'Suppliers/partners: [who you rely on]',
        'Timeline: [how long to set up]',
      ],
      financials: [
        'Startup costs: [initial investment needed]',
        'Monthly expenses: [recurring costs]',
        'Revenue forecast: [expected income]',
        'Break-even: [when you become profitable]',
        'Funding needs: [how much to raise]',
      ],
      risks: [
        'Market risk: [what if customers don\'t buy]',
        'Competition: [existing alternatives]',
        'Execution risk: [what could go wrong]',
        'Mitigation: [how to reduce risks]',
      ],
    };

    if (section in templates) {
      (updated[section] as string[]) = templates[section];
    }

    return updated;
  }

  private static condenseBullets(bullets: string[], maxCount: number): string[] {
    if (bullets.length <= maxCount) return bullets;

    // Keep most important bullets (usually first and last)
    const keep = Math.floor(maxCount / 2);
    return [
      ...bullets.slice(0, keep),
      ...bullets.slice(bullets.length - (maxCount - keep)),
    ];
  }

  private static validateTimeline(timeline: BusinessPlan['timeline']): string[] {
    const issues: string[] = [];

    if (!timeline.day30 || timeline.day30.length === 0) {
      issues.push('Missing 30-day plan');
    }
    if (!timeline.day60 || timeline.day60.length === 0) {
      issues.push('Missing 60-day plan');
    }
    if (!timeline.day90 || timeline.day90.length === 0) {
      issues.push('Missing 90-day plan');
    }

    // Check balance
    const counts = [timeline.day30?.length || 0, timeline.day60?.length || 0, timeline.day90?.length || 0];
    const maxDiff = Math.max(...counts) - Math.min(...counts);
    
    if (maxDiff > 3) {
      issues.push('Timeline periods are unbalanced');
    }

    return issues;
  }

  private static generateTimeline(context: string): BusinessPlan['timeline'] {
    return {
      day30: [
        'Set up basic business infrastructure (bank account, tools)',
        'Validate product/market fit with 10 customer interviews',
        'Build MVP or prototype',
        'Create initial marketing materials',
        'Launch to first 5-10 customers',
      ],
      day60: [
        'Gather feedback and iterate on product',
        'Expand marketing to 2-3 channels',
        'Close 20-30 paying customers',
        'Establish key partnerships or suppliers',
        'Refine pricing and positioning',
      ],
      day90: [
        'Scale customer acquisition process',
        'Hire first team member (if needed)',
        'Reach $X in monthly revenue',
        'Document processes and systems',
        'Plan next quarter growth strategy',
      ],
    };
  }

  private static checkLanguageComplexity(plan: BusinessPlan): string[] {
    const issues: string[] = [];
    const complexWords = [
      'synergize', 'leverage', 'paradigm', 'disruptive', 'ecosystem',
      'seamless', 'innovative', 'cutting-edge', 'best-in-class',
      'revolutionary', 'game-changing', 'world-class',
    ];

    const checkSection = (bullets: string[], sectionName: string) => {
      bullets.forEach(bullet => {
        complexWords.forEach(word => {
          if (bullet.toLowerCase().includes(word)) {
            issues.push(`${sectionName} contains jargon: "${word}"`);
          }
        });
      });
    };

    this.REQUIRED_SECTIONS.forEach(section => {
      const content = plan[section as keyof BusinessPlan];
      if (Array.isArray(content)) {
        checkSection(content, section);
      }
    });

    return issues;
  }

  private static simplifyLanguage(plan: BusinessPlan): BusinessPlan {
    const replacements: Record<string, string> = {
      'synergize': 'work together',
      'leverage': 'use',
      'paradigm': 'model',
      'disruptive': 'new approach to',
      'ecosystem': 'network',
      'seamless': 'smooth',
      'innovative': 'new',
      'cutting-edge': 'latest',
      'best-in-class': 'high quality',
      'revolutionary': 'significant change in',
      'game-changing': 'major improvement',
      'world-class': 'excellent',
    };

    const simplify = (text: string): string => {
      let result = text;
      Object.entries(replacements).forEach(([complex, simple]) => {
        const regex = new RegExp(complex, 'gi');
        result = result.replace(regex, simple);
      });
      return result;
    };

    const updated = { ...plan };

    this.REQUIRED_SECTIONS.forEach(section => {
      const content = updated[section as keyof BusinessPlan];
      if (Array.isArray(content)) {
        (updated[section as keyof BusinessPlan] as string[]) = content.map(simplify);
      }
    });

    return updated;
  }

  private static calculateScore(issueCount: number): number {
    // Perfect score = 100
    // Each issue reduces score by 5 points
    // Minimum score = 0
    return Math.max(0, 100 - (issueCount * 5));
  }
}
