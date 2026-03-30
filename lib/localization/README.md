# Jamaica-First Localization System

## Overview

Intelligent localization system ensuring Jamaican users receive Jamaica-specific opportunities and resources by default, with clear source labeling and confidence scoring.

---

## Exit Criteria

✅ **Jamaica users see Jamaica-first results by default**  
✅ **Relevance satisfaction score improves** (measured by user engagement)  
✅ **Clear source labels visible on all recommendations**

---

## System Components

### 1. User Context Detection

**Purpose:** Identify Jamaican users automatically

**Detection Methods (Priority Order):**
1. **Manual Selection** - User explicitly selects Jamaica
2. **Profile** - Saved user preference from account
3. **IP Geolocation** - Detected from IP address

```typescript
import { UserContextManager } from '@/lib/localization/jamaicaFirst';

// Detect user context
const context = await UserContextManager.detectUserContext(
  ipCountry,      // From IP: 'Jamaica'
  profileCountry, // From user profile
  manualSelection // From user selection
);

console.log(context);
// {
//   country: 'Jamaica',
//   countryCode: 'JM',
//   isJamaican: true,
//   detectedFrom: 'profile',
//   preferences: {
//     showJamaicanFirst: true,
//     includeCaribbean: true,
//     includeGlobal: true
//   }
// }
```

---

### 2. Source Classification

**Purpose:** Classify each resource by origin with confidence scoring

**Classifications:**
- **Jamaica Government** (90-100% confidence)
- **Jamaica Private Sector** (75-90% confidence)
- **Caribbean Regional** (70-85% confidence)
- **International** (50-70% confidence)

```typescript
import { SourceClassifier } from '@/lib/localization/jamaicaFirst';

const classification = SourceClassifier.classify(
  'JBDC',
  'https://jbdc.net',
  'Jamaica Business Development Corporation'
);

console.log(classification);
// {
//   origin: 'Jamaica Government',
//   confidence: 95,
//   justification: 'Official .gov.jm domain or verified government entity',
//   isLocal: true
// }
```

**Known Jamaica Sources:**

**Government:**
- JBDC (Jamaica Business Development Corporation)
- Development Bank of Jamaica (DBJ)
- JAMPRO (Jamaica Promotions Corporation)
- EXIM Bank
- Ministries (Industry, Commerce, etc.)

**Private Sector:**
- Jamaica Chamber of Commerce
- Private Sector Organisation of Jamaica (PSOJ)
- Jamaica Manufacturers Association

**Verification Criteria:**
- `.gov.jm` or `.jm` domains
- Known entity names
- Verified government programs
- Official contact information

---

### 3. Jamaica-First Ranking

**Purpose:** Rank resources with Jamaica-first priority

**Ranking Logic:**

```
Jamaica Government:     100 points (Highest priority)
Jamaica Private Sector:  85 points
Caribbean Regional:      70 points
International:           55 points (Lowest - only if no local option)

Bonuses:
+ 10 points: Mentions "Jamaica" specifically
+ 5 points: Direct funding/grants available
```

```typescript
import { JamaicanRankingEngine } from '@/lib/localization/jamaicaFirst';

const ranked = JamaicanRankingEngine.rank(
  resources,
  userContext,
  10 // max results
);

// Returns top 10 Jamaica-first results
ranked.forEach(r => {
  console.log(r.title);
  console.log('Origin:', r.sourceClassification.origin);
  console.log('Score:', r.relevanceScore);
  console.log('Reason:', r.rankingReason);
});
```

**Deduplication:**
- If local equivalent exists, international version is removed
- Prevents showing duplicate information

---

### 4. AI-Powered Localization Prompts

#### Prompt 1: Localization Ranking

```typescript
import { LocalizationPrompts } from '@/lib/localization/localizationPrompts';

const prompt = LocalizationPrompts.getLocalizationRankingPrompt(
  resources,
  userContext
);

// Send to AI (Gemini, GPT, etc.)
const response = await callAI(prompt);
// Returns top 10 ranked with reasons
```

**What It Does:**
- Ranks resources Jamaica-first
- Removes international duplicates
- Provides ranking justification
- Returns confidence scores

#### Prompt 2: Opportunity Matching

```typescript
const prompt = LocalizationPrompts.getOpportunityMatchingPrompt(
  'Tech Startup',
  'Software Development',
  'Building an app for local businesses'
);

const matches = await callAI(prompt);
// Returns Jamaica-specific grants, programs, permits
```

**Returns:**
- Relevant grants (JBDC, DBJ)
- Required permits/licenses
- Support programs
- Eligibility criteria
- Specific first actions
- Deadlines and timelines

**Example Output:**
```json
{
  "name": "JBDC Entrepreneurship Programme",
  "provider": "Jamaica Business Development Corporation",
  "type": "grant",
  "origin": "Jamaica Government",
  "eligibility": "Jamaican citizens 18+, viable business plan",
  "deadline": "Rolling applications year-round",
  "firstAction": "Visit JBDC office in Kingston or Montego Bay. Bring business plan draft.",
  "relevanceScore": 95,
  "url": "https://jbdc.net",
  "estimatedAmount": "JMD 500,000 - 2,000,000"
}
```

#### Prompt 3: Source Confidence

```typescript
const prompt = LocalizationPrompts.getSourceConfidencePrompt(resources);

const verified = await callAI(prompt);
// Returns classification with confidence scores
```

**What It Checks:**
- Domain authenticity (.gov.jm)
- Known entity verification
- URL-source matching
- Suspicious patterns
- Reliability warnings

---

## UI Components

### 1. Source Labels

**Display origin on every resource**

```typescript
import { SourceLabel } from '@/components/SourceLabels';

<SourceLabel 
  classification={resource.sourceClassification}
  size="md"
  showConfidence={true}
/>
```

**Styles:**
- 🇯🇲 Jamaica Gov (Green)
- 🇯🇲 Jamaica (Blue)
- 🌴 Caribbean (Purple)
- 🌍 Global (Gray)

### 2. Source Badges

**Compact labels for cards**

```typescript
import { SourceBadge } from '@/components/SourceLabels';

<SourceBadge 
  origin={classification.origin}
  isLocal={classification.isLocal}
  compact={true}
/>
```

### 3. Source Tooltips

**Hover for details**

```typescript
import { SourceTooltip } from '@/components/SourceLabels';

<SourceTooltip classification={classification}>
  <SourceLabel classification={classification} />
</SourceTooltip>
```

Shows:
- Classification
- Confidence score
- Justification
- Verification status

### 4. Location Preference Selector

**Let users choose their location**

```typescript
import { LocationPreferenceSelector } from '@/components/SourceLabels';

<LocationPreferenceSelector
  currentCountry={userCountry}
  onChange={(country) => setUserCountry(country)}
/>
```

Options:
- 🇯🇲 Jamaica
- 🇧🇧 Barbados
- 🇹🇹 Trinidad & Tobago
- 🇧🇸 Bahamas
- 🌍 Global

---

## Integration Example

```typescript
import { 
  UserContextManager, 
  JamaicanRankingEngine,
  SourceClassifier 
} from '@/lib/localization/jamaicaFirst';

// 1. Detect user context
const context = await UserContextManager.detectUserContext();

// 2. Classify sources
const classifiedResources = resources.map(resource => ({
  ...resource,
  sourceClassification: SourceClassifier.classify(
    resource.source,
    resource.url,
    resource.description
  )
}));

// 3. Rank Jamaica-first
const rankedResources = JamaicanRankingEngine.rank(
  classifiedResources,
  context,
  10
);

// 4. Display with labels
rankedResources.map(resource => (
  <div key={resource.id}>
    <h3>{resource.title}</h3>
    <SourceLabel classification={resource.sourceClassification} />
    <p>Relevance: {resource.relevanceScore}%</p>
    <p>{resource.rankingReason}</p>
  </div>
));
```

---

## Satisfaction Tracking

**Measure improvement in relevance**

```typescript
// Track user engagement
const satisfaction = {
  jamaicaResourcesShown: rankedResources.filter(r => r.sourceClassification.isLocal).length,
  jamaicaResourcesClicked: clickedResources.filter(r => r.sourceClassification.isLocal).length,
  clickThroughRate: (jamaicaResourcesClicked / jamaicaResourcesShown) * 100
};

// Target: >80% of Jamaica users click on Jamaica resources
```

**Metrics:**
- % Jamaica resources shown to Jamaica users (target: >70%)
- Click-through rate on Jamaica resources (target: >50%)
- User feedback score (target: 4.5/5)

---

## Testing

### Manual Testing

```typescript
// Test Jamaica user
const jamaicaContext = await UserContextManager.detectUserContext('Jamaica');
const ranked = JamaicanRankingEngine.rank(testResources, jamaicaContext);

// Verify:
// 1. Jamaica resources ranked first
// 2. Clear source labels visible
// 3. Confidence scores accurate
```

### Automated Testing

```bash
# Run localization tests
npm test localization
```

---

## Known Jamaica Resources

### Government

| Entity | URL | Focus |
|--------|-----|-------|
| JBDC | jbdc.net | Training, grants, mentorship |
| Development Bank of Jamaica | dbankjm.com | Loans, equity financing |
| JAMPRO | jampro.com | Export, investment |
| EXIM Bank | exim.gov.jm | Export financing |
| Ministry of Industry | - | Permits, licenses |

### Private Sector

| Entity | Focus |
|--------|-------|
| Jamaica Chamber of Commerce | Networking, advocacy |
| PSOJ | Business support |
| Jamaica Manufacturers Assoc. | Manufacturing support |
| Jamaica Exporters Assoc. | Export assistance |

---

## Roadmap

- [ ] Auto-detect user location on first visit
- [ ] Add more Caribbean countries
- [ ] Integrate with grant database
- [ ] Real-time resource verification
- [ ] User feedback collection
- [ ] A/B testing for ranking algorithm
- [ ] Multi-language support (English, Patois)

---

## Support

**For Jamaica-specific resources:**
- JBDC Hotline: 1-888-JBDC-NOW
- Email: info@jbdc.net

**For system questions:**
- See `/lib/localization/` for implementation
- Check components in `/components/SourceLabels.tsx`
