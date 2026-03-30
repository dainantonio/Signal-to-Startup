/**
 * AI Prompts for Jamaica-First Localization
 */

export class LocalizationPrompts {
  /**
   * Prompt 1: Localization Ranking
   * 
   * Ranks resources with Jamaica-first priority
   */
  static getLocalizationRankingPrompt(
    resources: any[],
    userContext: { isJamaican: boolean; country: string }
  ): string {
    const resourceList = resources
      .map((r, i) => `${i + 1}. ${r.title || r.name} - ${r.source || 'Unknown source'}\n   Description: ${r.description || 'N/A'}`)
      .join('\n\n');

    return `You are a localization expert helping Jamaican entrepreneurs find relevant resources.

**User Context:**
- Location: ${userContext.country}
- Is Jamaican: ${userContext.isJamaican ? 'Yes' : 'No'}

**Task:**
Given the user context (Jamaican, located in Jamaica), rank these resources with Jamaica-first priority. Keep global resources only if no equivalent local option exists.

**Resources to Rank:**
${resourceList}

**Ranking Criteria (in priority order):**
1. Jamaica Government sources (official .gov.jm, JAMPRO, DBJ, JBDC)
2. Jamaica Private Sector (local chambers, organizations)
3. Caribbean Regional (CARICOM, Caribbean Development Bank)
4. International (only if no local equivalent)

**Output Format:**
Return top 10 resources as JSON array with this structure:
\`\`\`json
[
  {
    "rank": 1,
    "title": "Resource name",
    "source": "Provider name",
    "origin": "Jamaica Government",
    "relevanceScore": 95,
    "reason": "Official government resource providing direct grants to Jamaican entrepreneurs"
  }
]
\`\`\`

**Important:**
- Prioritize Jamaica sources heavily (90-100 score)
- Caribbean regional gets 70-85 score
- International only if necessary (50-60 score)
- Explain why each resource is ranked where it is`;
  }

  /**
   * Prompt 2: Opportunity Matching
   * 
   * Matches business type to Jamaican resources
   */
  static getOpportunityMatchingPrompt(
    businessType: string,
    industry: string,
    businessDescription: string
  ): string {
    return `You are a Jamaica business development expert helping entrepreneurs find local support.

**Business Details:**
- Type: ${businessType}
- Industry: ${industry}
- Description: ${businessDescription}

**Task:**
Match this business to Jamaican grants, support programs, permits, and local partners. Prioritize official Jamaica sources.

**Known Jamaica Resources:**
- **JBDC (Jamaica Business Development Corporation)**: Training, grants, mentorship
- **Development Bank of Jamaica (DBJ)**: Loans, equity financing for MSMEs
- **JAMPRO**: Export promotion, investment facilitation
- **EXIM Bank**: Export financing and credit insurance
- **Ministry of Industry, Investment and Commerce**: Permits, licenses
- **Jamaica Chamber of Commerce**: Networking, advocacy
- **Private Sector Organisation of Jamaica (PSOJ)**: Business support
- **Jamaica Social Investment Fund (JSIF)**: Community-based enterprises

**Output Format:**
Return matches as JSON array:
\`\`\`json
[
  {
    "name": "JBDC Entrepreneurship Programme",
    "provider": "Jamaica Business Development Corporation",
    "type": "grant",
    "origin": "Jamaica Government",
    "eligibility": "Jamaican citizens with viable business plan, 18+ years",
    "deadline": "Rolling applications year-round",
    "firstAction": "Visit JBDC office in Kingston or Montego Bay to schedule consultation. Bring business plan draft.",
    "relevanceScore": 95,
    "url": "https://jbdc.net",
    "estimatedAmount": "JMD 500,000 - 2,000,000",
    "processingTime": "2-3 months"
  }
]
\`\`\`

**Requirements:**
1. Include eligibility criteria clearly
2. Specify deadline if known (or "Rolling applications")
3. Give specific first action (where to go, what to bring)
4. Only include real, verified Jamaica resources
5. Prioritize government sources first
6. Include permits/licenses needed for this business type
7. Suggest relevant local partners or mentors

Return 5-10 most relevant matches ranked by relevance.`;
  }

  /**
   * Prompt 3: Source Confidence Classification
   * 
   * Classifies and scores source reliability
   */
  static getSourceConfidencePrompt(
    resources: any[]
  ): string {
    const resourceList = resources
      .map((r, i) => `${i + 1}. ${r.title || r.name}\n   Source: ${r.source || 'Unknown'}\n   URL: ${r.url || 'N/A'}\n   Description: ${r.description || 'N/A'}`)
      .join('\n\n');

    return `You are a source verification expert for Jamaica business resources.

**Task:**
Classify each resource as Jamaica Government, Jamaica Private Sector, Caribbean Regional, or International. Add confidence score and justification.

**Resources to Classify:**
${resourceList}

**Classification Criteria:**

**Jamaica Government (Confidence: 90-100)**
- Official .gov.jm domains
- Known agencies: JAMPRO, DBJ, JBDC, EXIM Bank, Ministries
- Verified government programs

**Jamaica Private Sector (Confidence: 75-90)**
- Jamaica Chamber of Commerce
- PSOJ (Private Sector Organisation)
- Verified local businesses/NGOs
- Jamaica-registered entities

**Caribbean Regional (Confidence: 70-85)**
- CARICOM institutions
- Caribbean Development Bank (CDB)
- OECS (Organisation of Eastern Caribbean States)
- Regional trade bodies

**International (Confidence: 50-70)**
- Global organizations
- International NGOs
- Foreign government programs
- Generic business resources

**Output Format:**
\`\`\`json
[
  {
    "resourceName": "JBDC Entrepreneurship Programme",
    "classification": "Jamaica Government",
    "confidence": 95,
    "justification": "Official government agency with verified .jm domain and established track record",
    "isLocal": true,
    "verificationStatus": "verified",
    "warnings": []
  }
]
\`\`\`

**Important:**
- Be conservative with confidence scores
- Flag suspicious or unverified sources
- Mark "isLocal: true" only for Jamaica-based
- Add warnings if source seems unreliable
- Lower confidence if URL doesn't match claimed origin`;
  }

  /**
   * Get combined localization + matching prompt
   */
  static getCombinedLocalizationPrompt(
    businessType: string,
    industry: string,
    location: string
  ): string {
    return `You are helping a Jamaican entrepreneur find local resources and opportunities.

**Business Context:**
- Type: ${businessType}
- Industry: ${industry}
- Location: ${location}

**Your Task:**
1. Identify top 5 Jamaica-specific resources (grants, programs, permits)
2. Rank them by relevance and accessibility
3. Provide practical first steps for each

**Focus on:**
- Government resources (JBDC, DBJ, JAMPRO)
- Required permits/licenses
- Local support organizations
- Relevant Caribbean regional opportunities
- Only include international if no local equivalent exists

**Output Requirements:**
- Clear eligibility criteria
- Specific contact information
- Realistic timelines
- First action to take today
- Why this resource matches their business

Return structured JSON with ranked opportunities.`;
  }
}
