# Execution Assistance System

Move users from advice to action with one-click artifact generators and completion tracking.

---

## Goal

**Transform business plans into actionable artifacts that users can immediately use**

Instead of generic advice, generate:
- ✅ **Grant applications** (ready to submit)
- ✅ **Outreach emails** (ready to send)
- ✅ **Financial templates** (ready to use)

---

## Exit Criteria

✅ **High usage of one-click artifacts** (>60% of users generate at least one)  
✅ **Improved plan-to-submission conversion** (>30% submit generated grants)  
✅ **Users report lower "I don't know what to do next"** (<20% confusion score)

---

## System Components

### 1. Artifact Generator

**Core Function:** Generate pre-filled, action-ready documents

```typescript
import { ArtifactGenerator } from '@/lib/execution/artifactGenerator';

// Generate grant application
const grantArtifact = await ArtifactGenerator.generateGrantDraft(
  userProfile,
  businessContext,
  {
    name: 'JBDC Entrepreneurship Programme',
    provider: 'JBDC',
    eligibility: 'Jamaican citizens 18+',
    questions: ['Describe your business...']
  }
);

// Generate outreach emails
const emailArtifact = await ArtifactGenerator.generateOutreachEmails(
  userProfile,
  businessContext,
  'supplier'
);

// Generate financial template
const financialArtifact = await ArtifactGenerator.generateFinancialTemplate(
  businessContext,
  {
    monthlyRevenue: 100000,
    cogs: 40,
    fixedCosts: 50000,
    startingCapital: 500000
  }
);
```

---

### 2. Three AI Prompts

#### **Prompt 1: Grant Draft** 📄

**Purpose:** Create Jamaica-relevant grant application

**What It Does:**
- Pre-fills answers using user profile + business context
- Flags missing required information
- Uses evidence-based language
- Aligns to Jamaica eligibility requirements
- Includes submission checklist

**Output:**
```markdown
MISSING INPUTS:
- Business registration number
- Financial projections

GRANT APPLICATION DRAFT

1. Describe your business:
[Your business], based in Kingston, solves [problem] by providing [solution]. 
We serve [target customers] in the Jamaica market...

SUBMISSION CHECKLIST:
[ ] Complete all questions
[ ] Gather supporting documents
[ ] Submit before deadline
```

**Features:**
- Concise (150-200 words per question)
- Jamaica context (references Kingston, local suppliers)
- JMD currency
- Shows job creation impact
- Matches grant program goals

---

#### **Prompt 2: Outreach Automation** 📧

**Purpose:** Create partner outreach emails for Jamaica

**What It Does:**
- Generates 3 email variations
- Professional Jamaica business tone
- Clear ask + timeline + follow-up schedule
- Cultural fit for local market

**Output:**
```
EMAIL 1: INITIAL OUTREACH (DIRECT)
Subject: Partnership Opportunity - [Your Business]

Dear [Name],

I'm reaching out from [Your Business], a Kingston-based [industry] 
company...

EMAIL 2: INITIAL OUTREACH (VALUE-FOCUSED)
EMAIL 3: FOLLOW-UP EMAIL
```

**Features:**
- Professional but friendly tone
- Specific timeline (5-7 day follow-up)
- Ready to customize
- Usage guide included

---

#### **Prompt 3: Financial Starter** 💰

**Purpose:** Generate 12-month cashflow projection in JMD

**What It Does:**
- Creates month-by-month projections
- Lists all assumptions (editable)
- Calculates runway and break-even
- Shows sensitivity analysis
- Jamaica-specific considerations (GCT, payroll taxes)

**Output:**
```markdown
# 12-MONTH CASHFLOW PROJECTION

### ASSUMPTIONS
| Item | Value | Notes |
|------|-------|-------|
| Starting Capital | JMD 500,000 | Initial investment |
| Month 1 Revenue | JMD 100,000 | Conservative |

### REVENUE PROJECTIONS
| Month | Revenue | COGS | Net |
|-------|---------|------|-----|
| 1 | JMD 100,000 | JMD 40,000 | JMD 60,000 |

### KEY METRICS
- Break-even: Month 6
- Runway: 8 months
- Funding Needed: JMD 200,000
```

**Features:**
- All in JMD (Jamaica Dollars)
- Editable assumptions
- Monthly detail
- Warns about cash danger zones
- Includes GCT, NIS considerations

---

### 3. Completion Tracking

**Purpose:** Track artifact usage and submission

```typescript
import { ArtifactTracker } from '@/lib/execution/artifactGenerator';

// Track generation
ArtifactTracker.trackGeneration(artifact, userId);

// Track download
ArtifactTracker.trackDownload(artifactId, userId);

// Track submission
ArtifactTracker.trackSubmission(artifactId, userId);

// Get completion status
const completion = ArtifactTracker.getCompletion(userId);
console.log(completion);
// {
//   totalArtifacts: 5,
//   completedArtifacts: 2,
//   completionRate: 40,
//   artifactsByType: { grant: 2, outreach: 2, financial: 1 }
// }
```

**Statuses:**
- `not_started` - Missing required inputs
- `generated` - Created and ready
- `downloaded` - User downloaded the file
- `submitted` - User marked as submitted
- `completed` - Fully complete

---

### 4. Next Action Recommender

**Purpose:** Tell users exactly what to do next

```typescript
import { NextActionRecommender } from '@/lib/execution/artifactGenerator';

const nextActions = NextActionRecommender.getNextActions(
  businessContext,
  existingArtifacts,
  userContext
);

// Returns prioritized actions:
[
  {
    action: 'Create 12-month cashflow projection',
    artifactType: 'financial',
    priority: 'high',
    reason: 'Essential for any grant application',
    estimatedTime: '10 minutes'
  },
  {
    action: 'Draft JBDC grant application',
    artifactType: 'grant',
    priority: 'high',
    reason: 'JBDC offers grants up to JMD 2M',
    estimatedTime: '15 minutes'
  }
]
```

**Priority Levels:**
- **High:** Must do (financial plan, grant)
- **Medium:** Should do (outreach, permits)
- **Low:** Nice to have (pitch deck, contracts)

---

### 5. Confusion Score

**Purpose:** Detect when users are stuck

```typescript
const confusionAnalysis = NextActionRecommender.getConfusionScore(
  businessContext,
  existingArtifacts,
  daysSincePlanCreation
);

console.log(confusionAnalysis);
// {
//   score: 60,  // 0-100, higher = more confused
//   signals: [
//     'No artifacts generated after creating plan',
//     'No activity for 7+ days'
//   ],
//   recommendations: [
//     'Start with the cashflow template - it takes 10 minutes',
//     'Set aside 30 minutes to take one concrete action'
//   ]
// }
```

**Signals Detected:**
- No artifacts generated (40 points)
- Artifacts generated but not downloaded (20 points)
- No activity for 7+ days (30 points)
- Downloaded but not submitted (10 points)

**Threshold:**
- 0-30: User is on track ✅
- 31-60: Needs gentle nudge 👉
- 61-100: Intervention needed ⚠️

---

## UI Components

### 1. Artifact Generator Card

**One-click generation**

```typescript
import { ArtifactGeneratorCard } from '@/components/ArtifactComponents';

<ArtifactGeneratorCard
  type="grant"
  title="Grant Application"
  description="JBDC Entrepreneurship Programme - ready to submit"
  estimatedTime="15 minutes"
  onGenerate={async () => {
    const artifact = await generateGrant();
    setArtifact(artifact);
  }}
/>
```

**Features:**
- Shows estimated time
- Visual feedback during generation
- Disabled if missing requirements

---

### 2. Artifact Viewer

**View, download, track**

```typescript
import { ArtifactViewer } from '@/components/ArtifactComponents';

<ArtifactViewer
  artifact={generatedArtifact}
  onDownload={(format) => downloadFile(format)}
  onCopy={() => copyToClipboard()}
  onMarkSubmitted={() => markAsSubmitted()}
/>
```

**Features:**
- Shows missing inputs warning
- Download as .txt, .docx, .pdf
- Copy to clipboard
- Mark as submitted
- Status badge

---

### 3. Next Actions Panel

**Clear guidance**

```typescript
import { NextActionsPanel } from '@/components/ArtifactComponents';

<NextActionsPanel
  actions={recommendedActions}
  onActionClick={(type) => generateArtifact(type)}
/>
```

**Features:**
- Priority badges (High/Medium/Low)
- Estimated time for each
- Reason why action is important
- Click to generate

---

### 4. Completion Tracker

**Progress visualization**

```typescript
import { CompletionTracker } from '@/components/ArtifactComponents';

<CompletionTracker
  totalArtifacts={5}
  completedArtifacts={2}
  artifactsByType={{ grant: 2, outreach: 2, financial: 1 }}
/>
```

**Features:**
- Completion percentage
- Progress bar animation
- Breakdown by type
- Motivational tips

---

## Integration Example

```typescript
import { 
  ArtifactGenerator, 
  ArtifactTracker,
  NextActionRecommender 
} from '@/lib/execution/artifactGenerator';
import { ExecutionPrompts } from '@/lib/execution/executionPrompts';

// 1. Get next actions
const actions = NextActionRecommender.getNextActions(
  businessContext,
  existingArtifacts,
  userContext
);

// 2. User clicks "Generate Grant"
const handleGenerateGrant = async () => {
  // Create prompt
  const prompt = ExecutionPrompts.getGrantDraftPrompt(
    userProfile,
    businessContext,
    grantProgram
  );

  // Call AI
  const content = await callAI(prompt);

  // Generate artifact
  const artifact = await ArtifactGenerator.generateGrantDraft(
    userProfile,
    businessContext,
    grantProgram
  );

  artifact.content = content;

  // Track
  ArtifactTracker.trackGeneration(artifact, userId);

  return artifact;
};

// 3. User downloads
const handleDownload = () => {
  const blob = ArtifactGenerator.exportArtifact(artifact, 'docx');
  downloadBlob(blob, `${artifact.title}.docx`);
  
  ArtifactTracker.trackDownload(artifact.id, userId);
};

// 4. User submits
const handleMarkSubmitted = () => {
  artifact.status = 'submitted';
  artifact.submittedAt = new Date();
  
  ArtifactTracker.trackSubmission(artifact.id, userId);
};
```

---

## Success Metrics

### Usage Metrics
```typescript
{
  artifactGenerationRate: 65,  // % of users who generate artifacts
  averageArtifactsPerUser: 2.3,
  mostPopularType: 'financial', // Most generated artifact
  timeToFirstArtifact: '3 minutes' // Avg time from plan to first artifact
}
```

### Conversion Metrics
```typescript
{
  planToSubmissionRate: 35,  // % who submit generated grants
  downloadToSubmitRate: 52,  // % who submit after downloading
  completionRate: 28         // % who mark artifacts as complete
}
```

### Confusion Metrics
```typescript
{
  avgConfusionScore: 18,     // Lower is better
  usersStuck: 15,            // % with score > 60
  mostCommonSignal: 'No artifacts generated'
}
```

**Targets:**
- ✅ >60% artifact generation rate
- ✅ >30% plan-to-submission
- ✅ <20% confusion score

---

## Best Practices

### 1. Pre-fill Everything Possible
```typescript
// ❌ Bad - Empty template
const content = "Business Name: _______";

// ✅ Good - Pre-filled from context
const content = `Business Name: ${userProfile.businessName}
Location: ${userProfile.location}
Industry: ${businessContext.industry}`;
```

### 2. Flag Missing Inputs Early
```typescript
// Check before generation
const missing = validateInputs(userProfile, businessContext);

if (missing.length > 0) {
  showWarning(`Please add: ${missing.join(', ')}`);
}
```

### 3. Make Download One-Click
```typescript
// ✅ Instant download, no configuration
<button onClick={() => downloadArtifact('docx')}>
  Download Ready-to-Submit Application
</button>
```

### 4. Track Everything
```typescript
// Track each stage
trackGeneration();  // When artifact created
trackDownload();    // When user downloads
trackSubmission();  // When user marks submitted
```

---

## Files Created

```
/app/lib/execution/
├── artifactGenerator.ts     # Core generation + tracking
├── executionPrompts.ts      # AI prompts for artifacts
└── README.md                # This documentation

/app/components/
└── ArtifactComponents.tsx   # UI components
    ├── ArtifactGeneratorCard
    ├── ArtifactViewer
    ├── NextActionsPanel
    └── CompletionTracker
```

---

## Next Steps

1. **Integrate with Opportunity Generation:**
   - Auto-suggest artifacts for each opportunity
   - Link opportunities to relevant grants

2. **Add More Artifact Types:**
   - Business registration forms
   - Permit applications
   - Partnership contracts
   - Pitch decks

3. **Real-time Collaboration:**
   - Share artifacts with mentors
   - Get feedback before submission
   - Track version history

4. **Integration with Providers:**
   - Direct JBDC submission
   - Auto-fill from database
   - Track application status

---

**Execution Assistance Ready!** 🚀

Move users from "I don't know what to do" to "I just submitted my grant application" in 15 minutes.
