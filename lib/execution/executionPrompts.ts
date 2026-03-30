/**
 * AI Prompts for Execution Assistance - Action-Oriented Artifacts
 */

import { UserProfile, BusinessContext } from './artifactGenerator';

export class ExecutionPrompts {
  /**
   * Prompt 1: Grant Draft Generation
   * 
   * Creates Jamaica-relevant grant application with evidence-based answers
   */
  static getGrantDraftPrompt(
    userProfile: UserProfile,
    businessContext: BusinessContext,
    grantProgram: {
      name: string;
      provider: string;
      eligibility: string;
      focusAreas?: string[];
      questions?: string[];
    }
  ): string {
    return `You are a Jamaica business development expert helping entrepreneurs draft grant applications.

**User Profile:**
- Name: ${userProfile.name}
- Business: ${userProfile.businessName}
- Industry: ${userProfile.industry}
- Location: ${userProfile.location}
- Registration: ${userProfile.registrationNumber || 'Not provided'}
- Years in Business: ${userProfile.yearsInBusiness || 'Startup'}

**Business Context:**
- Type: ${businessContext.businessType}
- Description: ${businessContext.description}
- Target Customer: ${businessContext.targetCustomer}
- Revenue Model: ${businessContext.revenue || 'Not specified'}
- Key Advantages: ${businessContext.advantages?.join(', ') || 'Not specified'}

**Grant Program:**
- Name: ${grantProgram.name}
- Provider: ${grantProgram.provider}
- Eligibility: ${grantProgram.eligibility}
${grantProgram.focusAreas ? `- Focus Areas: ${grantProgram.focusAreas.join(', ')}` : ''}

**Task:**
Draft a Jamaica-relevant grant application response. Keep answers:
1. **Evidence-based** - Use specific data points from the business context
2. **Concise** - 150-200 words per question max
3. **Aligned to local eligibility** - Reference Jamaican context (e.g., "Kingston-based", "serving local market")
4. **Action-oriented** - Show clear execution plan

**Application Questions (if provided):**
${grantProgram.questions?.map((q, i) => `${i + 1}. ${q}`).join('\n') || 'Use standard grant questions below'}

**Standard Grant Questions (if none provided):**
1. Describe your business and what problem it solves
2. Who are your target customers and how will you reach them?
3. What makes your business unique or innovative?
4. What are your revenue projections for the next 12 months?
5. How will you use the grant funding?
6. What are the key milestones you will achieve?
7. What experience does your team have?

**Important Instructions:**
1. **Flag missing inputs FIRST** - Before generating the draft, list any critical missing information
2. **Use Jamaica context** - Reference local suppliers, partners, markets
3. **Be specific with numbers** - Include concrete projections in JMD
4. **Show job creation** - Emphasize local employment impact
5. **Align with program goals** - Match the grant's focus areas

**Output Format:**
\`\`\`
MISSING INPUTS (if any):
- [List any critical missing information]

GRANT APPLICATION DRAFT

Program: ${grantProgram.name}
Applicant: ${userProfile.businessName}

[Question 1]
[Your answer - evidence-based, concise, 150-200 words]

[Question 2]
[Your answer - evidence-based, concise, 150-200 words]

...

SUPPORTING DOCUMENTS NEEDED:
- Business registration certificate
- Financial statements (if applicable)
- Project budget breakdown
- Team CVs

SUBMISSION CHECKLIST:
[ ] Complete all questions
[ ] Gather supporting documents
[ ] Review for local relevance
[ ] Proofread for errors
[ ] Submit before deadline: [Date if known]
\`\`\`

**Quality Checks:**
- Every answer must reference the business context provided
- Use JMD (Jamaica Dollars) for all financial figures
- Include specific Jamaica locations, suppliers, or partners
- Show how business benefits local community
- Demonstrate clear understanding of grant program goals`;
  }

  /**
   * Prompt 2: Outreach Email Generation
   * 
   * Creates professional partner outreach emails for Jamaica
   */
  static getOutreachEmailsPrompt(
    userProfile: UserProfile,
    businessContext: BusinessContext,
    targetType: 'supplier' | 'distributor' | 'partner',
    specificTargets?: string[]
  ): string {
    return `You are helping a Jamaican entrepreneur create professional outreach emails to ${targetType}s.

**Business Profile:**
- Business: ${userProfile.businessName}
- Industry: ${businessContext.industry}
- Type: ${businessContext.businessType}
- Description: ${businessContext.description}
- Location: ${userProfile.location}
- Contact: ${userProfile.email || '[Your Email]'}

**Target Type:** ${targetType.charAt(0).toUpperCase() + targetType.slice(1)}s
${specificTargets ? `**Specific Targets:** ${specificTargets.join(', ')}` : ''}

**Task:**
Create 3 professional outreach emails for Jamaican ${targetType}s. Each email should have a slightly different approach while maintaining consistent professionalism.

**Email Requirements:**
1. **Tone:** Professional, concise, respectful (Jamaican business context)
2. **Structure:**
   - Clear subject line
   - Brief intro (who you are)
   - Clear ask (what you need)
   - Expected timeline (when you need response)
   - Follow-up schedule (when you'll follow up)
3. **Length:** 150-200 words per email
4. **Cultural fit:** Appropriate for Jamaica business culture

**What to Include:**
- Why you're reaching out
- What's in it for them
- Specific next steps
- Professional but approachable tone
- Reference to Jamaica/local context
- Clear call-to-action

**Output Format:**

\`\`\`
EMAIL 1: INITIAL OUTREACH (DIRECT APPROACH)

Subject: [Compelling subject line]

Dear [Name/Title],

[Body - 150-200 words]

[Clear call-to-action]

Best regards,
${userProfile.name}
${userProfile.businessName}
${userProfile.email || '[Your Email]'}
${userProfile.phone || '[Your Phone]'}

---

EMAIL 2: INITIAL OUTREACH (VALUE-FOCUSED)

Subject: [Compelling subject line]

Dear [Name/Title],

[Body - 150-200 words with focus on mutual benefit]

[Clear call-to-action]

Best regards,
${userProfile.name}
${userProfile.businessName}

---

EMAIL 3: FOLLOW-UP EMAIL (IF NO RESPONSE)

Subject: Re: [Original subject] - Following up

Dear [Name/Title],

[Body - 100-150 words, gentle follow-up]

[Clear call-to-action]

Best regards,
${userProfile.name}

---

USAGE GUIDE:

Timeline:
- Send Email 1 or 2 (choose based on target)
- Wait 5-7 business days
- Send Email 3 if no response
- Follow up by phone if still no response

Customization Tips:
- Research each ${targetType} before sending
- Add 1-2 sentences specific to their business
- Update timeline based on urgency
- Include relevant attachments (pitch deck, product info)

Success Metrics:
- Track response rate
- Note which email version performs best
- Follow up promptly on all responses
\`\`\`

**Best Practices for Jamaica Context:**
- Be professional but friendly
- Reference local market knowledge
- Mention any mutual connections (if applicable)
- Respect business hours (9am-5pm local time)
- Be prepared for in-person meeting if requested
- Have your business registration ready to share`;
  }

  /**
   * Prompt 3: Financial Template Generation
   * 
   * Creates 12-month cashflow projection in JMD
   */
  static getFinancialTemplatePrompt(
    businessContext: BusinessContext,
    assumptions: {
      monthlyRevenue?: number;
      cogs?: number; // Cost of goods sold as percentage
      fixedCosts?: number;
      startingCapital?: number;
      growthRate?: number;
    }
  ): string {
    return `You are a financial advisor helping a Jamaican entrepreneur create a startup cashflow projection.

**Business Context:**
- Business: ${businessContext.businessName}
- Type: ${businessContext.businessType}
- Industry: ${businessContext.industry}
- Description: ${businessContext.description}

**Assumptions Provided:**
- Starting Capital: ${assumptions.startingCapital ? `JMD ${assumptions.startingCapital.toLocaleString()}` : 'To be determined'}
- Expected Monthly Revenue (Month 1): ${assumptions.monthlyRevenue ? `JMD ${assumptions.monthlyRevenue.toLocaleString()}` : 'To be estimated'}
- Cost of Goods Sold: ${assumptions.cogs ? `${assumptions.cogs}% of revenue` : 'To be estimated'}
- Fixed Monthly Costs: ${assumptions.fixedCosts ? `JMD ${assumptions.fixedCosts.toLocaleString()}` : 'To be estimated'}
- Monthly Growth Rate: ${assumptions.growthRate ? `${assumptions.growthRate}%` : '10% (default)'}

**Task:**
Generate a comprehensive 12-month startup cashflow template in JMD (Jamaica Dollars) with:
1. Clear assumptions listed at top (editable)
2. Month-by-month revenue projections
3. Cost breakdown (COGS, fixed costs, variable costs)
4. Runway calculation (months until breakeven)
5. Key metrics and warnings

**Output Format:**

\`\`\`markdown
# 12-MONTH CASHFLOW PROJECTION
## ${businessContext.businessName}

### ASSUMPTIONS (EDIT THESE)

| Item | Value | Notes |
|------|-------|-------|
| Starting Capital | JMD [amount] | Initial investment/savings |
| Month 1 Revenue | JMD [amount] | Conservative first month estimate |
| Revenue Growth Rate | [%]/month | Expected monthly growth |
| COGS % | [%] | Cost of goods sold as % of revenue |
| Fixed Costs/Month | JMD [amount] | Rent, salaries, utilities, etc. |
| Variable Costs % | [%] | Marketing, supplies as % of revenue |

### REVENUE PROJECTIONS

| Month | Units/Customers | Avg. Price (JMD) | Gross Revenue | COGS | Net Revenue |
|-------|----------------|------------------|---------------|------|-------------|
| 1 | [qty] | [price] | [total] | [cost] | [net] |
| 2 | [qty] | [price] | [total] | [cost] | [net] |
| 3 | [qty] | [price] | [total] | [cost] | [net] |
| ... | ... | ... | ... | ... | ... |
| 12 | [qty] | [price] | [total] | [cost] | [net] |

**Total Year 1 Revenue:** JMD [total]

### EXPENSE BREAKDOWN

#### Fixed Costs (Monthly)
- Rent: JMD [amount]
- Salaries: JMD [amount]
- Utilities: JMD [amount]
- Insurance: JMD [amount]
- Other: JMD [amount]
**Total Fixed:** JMD [total]

#### Variable Costs (% of Revenue)
- Raw Materials: [%]
- Packaging: [%]
- Marketing: [%]
- Delivery: [%]
**Total Variable:** [%] of revenue

### CASHFLOW SUMMARY

| Month | Opening Balance | Revenue | Expenses | Net Cash | Closing Balance |
|-------|----------------|---------|----------|----------|-----------------|
| 1 | [amount] | [amount] | [amount] | [amount] | [amount] |
| 2 | [amount] | [amount] | [amount] | [amount] | [amount] |
| ... | ... | ... | ... | ... | ... |
| 12 | [amount] | [amount] | [amount] | [amount] | [amount] |

### KEY METRICS

- **Break-even Month:** Month [X] (when revenue > expenses)
- **Runway:** [X] months (based on starting capital)
- **Cash Low Point:** Month [X] - JMD [amount]
- **Year-end Balance:** JMD [amount]

### WARNINGS & NOTES

⚠️ **Critical Months:** [List months with negative cashflow]
⚠️ **Funding Needed:** JMD [amount] to reach break-even
✓ **Best Month:** Month [X] with JMD [amount] profit

### SENSITIVITY ANALYSIS

| Scenario | Break-even Month | Funding Needed |
|----------|-----------------|----------------|
| Optimistic (20% higher revenue) | Month [X] | JMD [amount] |
| Base Case (as above) | Month [X] | JMD [amount] |
| Pessimistic (20% lower revenue) | Month [X] | JMD [amount] |

### NEXT STEPS

1. **Validate Assumptions:** Review each assumption with actual quotes/data
2. **Adjust for Seasonality:** If applicable (e.g., tourism, agriculture)
3. **Plan Funding:** Secure [amount] before Month [X]
4. **Monitor Monthly:** Compare actual vs. projected
5. **Update Quarterly:** Refine projections based on real performance

### JAMAICA-SPECIFIC CONSIDERATIONS

- **GCT (General Consumption Tax):** Factor in 15% (or 0% if registered threshold not met)
- **Payroll Taxes:** NIS, NHT, Education Tax if hiring employees
- **Seasonal Cash Flow:** Account for Christmas, back-to-school periods
- **Currency:** All figures in JMD. Consider USD exposure if importing
- **Payment Terms:** Jamaica businesses often operate on 30-60 day payment terms

### EDITABLE FIELDS

To customize this template:
1. Update all [bracketed] values with your actual figures
2. Adjust growth rates based on your market research
3. Add industry-specific cost categories
4. Include one-time startup costs in Month 1
5. Factor in grant/loan disbursements when expected

---

**This template is provided for planning purposes. Consult with an accountant for detailed financial planning.**
\`\`\`

**Implementation Notes:**
- Make all assumptions clearly editable
- Include realistic Jamaica market values
- Show month-by-month detail
- Highlight cash danger zones
- Provide clear next steps
- Consider local tax implications
- Allow easy scenario testing`;
  }

  /**
   * Get combined execution prompt
   */
  static getCombinedExecutionPrompt(
    userProfile: UserProfile,
    businessContext: BusinessContext,
    artifactType: 'grant' | 'outreach' | 'financial'
  ): string {
    switch (artifactType) {
      case 'grant':
        return this.getGrantDraftPrompt(
          userProfile,
          businessContext,
          {
            name: 'JBDC Entrepreneurship Programme',
            provider: 'Jamaica Business Development Corporation',
            eligibility: 'Jamaican citizens 18+, viable business plan',
            focusAreas: ['Job creation', 'Innovation', 'Export potential'],
          }
        );
      case 'outreach':
        return this.getOutreachEmailsPrompt(
          userProfile,
          businessContext,
          'supplier'
        );
      case 'financial':
        return this.getFinancialTemplatePrompt(
          businessContext,
          {
            startingCapital: 500000,
            monthlyRevenue: 100000,
            cogs: 40,
            fixedCosts: 50000,
            growthRate: 10,
          }
        );
    }
  }
}
