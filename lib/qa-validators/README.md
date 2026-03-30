# QA Validation System

Comprehensive QA validation system ensuring mobile-first quality and business plan structure compliance.

## Exit Criteria

✅ **No horizontal scrolling at target mobile widths** (375px - 428px)  
✅ **No text escaping cards** (all content contained)  
✅ **95%+ plans pass structure validator** (well-formed business plans)

---

## 1. Mobile UI Validation

### Purpose
Review screen output for mobile usability issues and return actionable bug reports.

### Usage

```typescript
import { MobileUIValidator, runMobileQA } from '@/lib/qa-validators';

// Automated validation
const results = runMobileQA();

console.log('Passed:', results.passed);
console.log('Bugs found:', results.bugs.length);
console.log('Summary:', results.summary);

// Manual validation of specific element
const validator = new MobileUIValidator();
const element = document.getElementById('my-component');
const results = validator.validate(element, 375); // 375px = iPhone SE width
```

### What It Checks

1. **Horizontal Scrolling**
   - Elements wider than viewport
   - Children exceeding parent width
   - Missing `overflow-x-hidden` or `max-width` constraints

2. **Text Overflow**
   - `whitespace: nowrap` without truncation
   - Long words without `break-words`
   - Missing `overflow-wrap` for URLs/emails

3. **Clipped Content**
   - Content hidden by `overflow: hidden`
   - Elements positioned outside viewport
   - Improper `line-clamp` usage

4. **Spacing Issues**
   - Excessive negative margins
   - Inconsistent padding across children
   - Overlapping elements

5. **Viewport Constraints**
   - Elements exceeding target mobile width
   - Missing responsive constraints

### Bug Report Format

```typescript
{
  severity: 'Critical' | 'High' | 'Medium',
  issue: string,                    // Human-readable issue description
  location: string,                 // Element identifier (tag + class)
  likelyCause: string,              // Technical explanation
  fix: string                       // Exact fix recommendation with classes
}
```

### Example Output

```json
{
  "passed": false,
  "bugs": [
    {
      "severity": "Critical",
      "issue": "Horizontal scrolling detected",
      "location": "div.modal-container",
      "likelyCause": "Element width exceeds viewport, missing overflow-x-hidden",
      "fix": "Add `overflow-x-hidden` and `max-w-full` classes. Check for fixed widths in children."
    },
    {
      "severity": "High",
      "issue": "Text may overflow container",
      "location": "h2.opportunity-title",
      "likelyCause": "white-space: nowrap without overflow handling",
      "fix": "Add `truncate` class (overflow-hidden + text-ellipsis) or use `break-words`."
    }
  ],
  "summary": {
    "critical": 1,
    "high": 1,
    "medium": 0
  }
}
```

---

## 2. Business Plan Content Cleanup

### Purpose
Fix spacing errors, split merged words, and reformat into concise bullet points while maintaining all original meaning.

### Usage

```typescript
import { BusinessPlanFormatter } from '@/lib/qa-validators';

// Clean up raw AI-generated content
const rawPlan = "ExecutiveSummary:Thestartupaims to...";
const cleaned = BusinessPlanFormatter.cleanup(rawPlan);

// Convert to structured format
const plan = BusinessPlanFormatter.format(rawPlan);

// Convert back to readable text
const text = BusinessPlanFormatter.toString(plan);
```

### What It Fixes

1. **Spacing Errors**
   - Missing spaces after punctuation
   - Missing spaces after commas
   - Double/triple spaces
   - Spaces before punctuation

2. **Merged Words**
   - "theproduct" → "the product"
   - "startupwill" → "startup will"
   - Common business term splits

3. **Common Issues**
   - Currency formatting ($100 not $ 100)
   - Percentage formatting (50% not 50 %)
   - Bullet point standardization
   - Typo corrections

### Structured Output

```typescript
{
  executiveSummary: string[],    // Max 6 bullets
  customer: string[],            // Max 6 bullets
  offer: string[],               // Max 6 bullets
  goToMarket: string[],          // Max 6 bullets
  operations: string[],          // Max 6 bullets
  financials: string[],          // Max 6 bullets
  risks: string[],               // Max 6 bullets
  timeline: {
    day30: string[],             // Max 5 bullets
    day60: string[],             // Max 5 bullets
    day90: string[]              // Max 5 bullets
  }
}
```

---

## 3. Business Plan Structure Validation

### Purpose
Validate business plan against required schema, generate missing sections, and condense to meet constraints.

### Usage

```typescript
import { BusinessPlanValidator } from '@/lib/qa-validators';

const plan = {
  executiveSummary: [...],
  customer: [...],
  // ... other sections
};

const result = BusinessPlanValidator.validate(plan, opportunityContext);

console.log('Score:', result.score);       // 0-100
console.log('Passed:', result.passed);     // true if score >= 95
console.log('Issues:', result.issues);
console.log('Fixes:', result.fixes);

// Use the validated and fixed plan
const validatedPlan = result.validatedPlan;
```

### Validation Rules

1. **Required Sections**
   - Executive Summary
   - Customer
   - Offer
   - Go-to-Market
   - Operations
   - Financials
   - Risks
   - 30/60/90-Day Plan

2. **Section Constraints**
   - Max 6 bullets per section
   - Min 3 bullets per section
   - Max 5 bullets per timeline period

3. **Language Requirements**
   - Plain language for first-time founders
   - No jargon or buzzwords
   - Actionable and specific

### Auto-Fixes

**Missing Sections:** Generates placeholder content with proper structure

**Too Long:** Condenses to max bullet count while preserving key points

**Complex Language:** Simplifies jargon:
- "synergize" → "work together"
- "leverage" → "use"
- "disruptive" → "new approach to"
- "ecosystem" → "network"

### Scoring

- **100 points** = Perfect (no issues)
- **-5 points** per issue
- **95+ = Pass** (meets exit criteria)
- **< 95 = Fail** (needs fixes)

### Validation Result

```typescript
{
  passed: true,
  score: 95,
  issues: [
    "Missing sections: timeline",
    "operations has 8 bullets (max 6)"
  ],
  fixes: [
    "Generated balanced timeline with 5 actions per period",
    "Condensed operations to 6 bullets"
  ],
  validatedPlan: { ... }
}
```

---

## Integration Examples

### 1. Validate UI Before Deployment

```typescript
import { runMobileQA, checkExitCriteria } from '@/lib/qa-validators';

// Run QA
const results = runMobileQA();

// Check exit criteria
const { passed, failures } = checkExitCriteria({ mobileUI: results });

if (!passed) {
  console.error('❌ Failed exit criteria:', failures);
  results.bugs.forEach(bug => {
    console.log(`[${bug.severity}] ${bug.issue}`);
    console.log(`  Location: ${bug.location}`);
    console.log(`  Fix: ${bug.fix}\n`);
  });
} else {
  console.log('✅ All exit criteria passed!');
}
```

### 2. Process AI-Generated Business Plans

```typescript
import { BusinessPlanFormatter, BusinessPlanValidator } from '@/lib/qa-validators';

// 1. Get raw AI output
const rawPlan = await generatePlanWithAI(opportunity);

// 2. Format and clean
const formattedPlan = BusinessPlanFormatter.format(rawPlan);

// 3. Validate and fix
const validation = BusinessPlanValidator.validate(formattedPlan, opportunity.description);

if (validation.passed) {
  // Use validated plan
  return validation.validatedPlan;
} else {
  console.log('Plan validation issues:', validation.issues);
  console.log('Auto-fixes applied:', validation.fixes);
  return validation.validatedPlan; // Still usable after auto-fixes
}
```

### 3. Continuous QA Monitoring

```typescript
// Add to your app
useEffect(() => {
  if (process.env.NODE_ENV === 'development') {
    const results = runMobileQA();
    if (!results.passed) {
      console.warn('⚠️ Mobile QA issues detected:', results.summary);
    }
  }
}, []);
```

---

## Testing

Run validators on your components:

```bash
# Type check
npx tsc --noEmit

# Manual QA in browser console
runMobileQA()
```

---

## Exit Criteria Checklist

- [ ] **Mobile UI:** No horizontal scrolling at 375px, 390px, 428px
- [ ] **Mobile UI:** All text wraps properly (no overflow)
- [ ] **Mobile UI:** All interactive elements are touch-friendly (min 44px)
- [ ] **Business Plans:** 95%+ validation score
- [ ] **Business Plans:** All required sections present
- [ ] **Business Plans:** Plain language, no jargon
- [ ] **Business Plans:** Concise bullets (max 6 per section)

---

## Common Fixes

### Horizontal Scrolling
```tsx
// ❌ Bad
<div className="w-screen">
  <div className="min-w-[600px]">...</div>
</div>

// ✅ Good
<div className="w-full overflow-x-hidden max-w-full">
  <div className="w-full max-w-full">...</div>
</div>
```

### Text Overflow
```tsx
// ❌ Bad
<h2 className="whitespace-nowrap">{longTitle}</h2>

// ✅ Good
<h2 className="truncate">{longTitle}</h2>
// or
<h2 className="break-words hyphens-auto">{longTitle}</h2>
```

### Flex/Grid Overflow
```tsx
// ❌ Bad
<div className="flex gap-4">
  <div className="flex-1">{content}</div>
</div>

// ✅ Good
<div className="flex gap-4">
  <div className="flex-1 min-w-0">{content}</div>
</div>
```

---

## Support

For issues or questions:
1. Check bug report for exact fix recommendation
2. Review this documentation for examples
3. Test with mobile viewport in DevTools
4. Validate business plans before showing to users
