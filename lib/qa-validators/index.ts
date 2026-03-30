/**
 * QA Validators - Export Module
 */

export { MobileUIValidator, runMobileQA } from './mobileUIValidator';
export type { MobileUIBug, MobileUIValidationResult } from './mobileUIValidator';

export { BusinessPlanFormatter } from './businessPlanFormatter';
export type { BusinessPlan } from './businessPlanFormatter';

export { BusinessPlanValidator } from './businessPlanValidator';
export type { ValidationResult } from './businessPlanValidator';

/**
 * Run all QA validators
 */
export async function runFullQA() {
  const results = {
    mobileUI: null as any,
    timestamp: new Date().toISOString(),
  };

  // Run mobile UI validation
  try {
    const { runMobileQA } = await import('./mobileUIValidator');
    results.mobileUI = runMobileQA();
  } catch (error) {
    console.error('Mobile UI QA failed:', error);
  }

  return results;
}

/**
 * Check if app passes all exit criteria
 */
export function checkExitCriteria(results: any): {
  passed: boolean;
  failures: string[];
} {
  const failures: string[] = [];

  // Exit criteria 1: No horizontal scrolling at target mobile widths
  if (results.mobileUI) {
    const horizontalScrollBugs = results.mobileUI.bugs.filter((b: any) =>
      b.issue.toLowerCase().includes('horizontal')
    );
    if (horizontalScrollBugs.length > 0) {
      failures.push('Horizontal scrolling detected at mobile widths');
    }
  }

  // Exit criteria 2: No text escaping cards
  if (results.mobileUI) {
    const textOverflowBugs = results.mobileUI.bugs.filter((b: any) =>
      b.issue.toLowerCase().includes('overflow') || b.issue.toLowerCase().includes('exceed')
    );
    if (textOverflowBugs.length > 0) {
      failures.push('Text escaping containers detected');
    }
  }

  return {
    passed: failures.length === 0,
    failures,
  };
}
