# 🗞️ Newsroom Workflow - Setup & Testing Guide

## What's New

The app has been upgraded with a **newsroom-inspired workflow** featuring:

### 📋 Key Changes

1. **Workflow Stepper** (Top)
   - Visual progress: Signal → Trend → Opportunities → Execution
   - Always visible when viewing results
   - Auto-scrolls based on page position

2. **Signal Desk** (Redesigned Input)
   - Clean, dominant lead card design
   - Extract button directly under text input
   - Collapsible "Desk Settings" for market/location/focus
   - Quick edit & rerun button when results exist

3. **Briefing Columns** (2-Column Layout)
   - **Left:** Emerging Trend + Evidence snippets
   - **Right:** Impacted Groups + Market Friction
   - Equal height columns with full-width text blocks
   - Newspaper-style section headers

4. **Opportunity Grid** (Redesigned Cards)
   - Edition labels: "ROI", "Fast", "Urgent" (like section tags)
   - Fixed CTA at bottom for consistent scanning
   - Cleaner layout with better typography
   - Reduced clutter, more whitespace

5. **Sticky Action Bar**
   - Appears on scroll with Extract/Regenerate/Save
   - Quick access without scrolling back

6. **Visual Polish**
   - Stronger typographic hierarchy
   - More whitespace between sections
   - Reduced capsule clutter
   - Newspaper-inspired aesthetic

---

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
cd /app
npm install
```

### 2. Configure Environment

Create `.env.local` file:

```bash
cp .env.local.template .env.local
```

Edit `.env.local` and add your keys:

```env
GEMINI_API_KEY=your_actual_gemini_api_key
NEWS_API_KEY=your_newsapi_key_optional
APP_URL=http://localhost:3000
```

### 3. Configure Firebase (Already Done)

Firebase config is in `firebase-applet-config.json`. Make sure it has your Firebase project credentials.

### 4. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

---

## 🧪 Testing the Newsroom Workflow

### Test Flow:

1. **Signal Desk**
   - Paste a news article or market signal
   - Try collapsing/expanding "Desk Settings"
   - Click "Extract Opportunities"

2. **Watch Workflow Stepper**
   - Notice the stepper at top showing progress
   - It updates as you scroll through results

3. **Briefing Columns**
   - Check the 2-column layout (Trend + Evidence | Groups + Friction)
   - Verify equal column heights
   - Review typography hierarchy

4. **Opportunity Grid**
   - Look for edition labels (ROI/Fast/Urgent) on cards
   - Check that CTAs are at consistent bottom position
   - Try the filters (ROI, Urgent, Fast, Grant Only)

5. **Sticky Action Bar**
   - Scroll down to see it appear
   - Test Extract/Regenerate buttons

6. **Quick Edit**
   - After results appear, scroll back to Signal Desk
   - Click "Quick edit & rerun" to modify and reanalyze

---

## 📁 New Components Created

- `/app/components/WorkflowStepper.tsx` - Progress stepper
- `/app/components/StickyActionBar.tsx` - Floating action bar
- `/app/components/SignalDesk.tsx` - Redesigned input section
- `/app/components/BriefingColumns.tsx` - 2-column results layout
- `/app/components/OpportunityGrid.tsx` - Grid with filters
- `/app/components/agent/TrendIntelligenceAgentNewsroom.tsx` - Main newsroom agent

## 🔧 Modified Files

- `/app/app/page.tsx` - Updated to use newsroom agent
- `/app/components/OpportunityCard.tsx` - Added edition labels + fixed CTA

---

## 🎨 Design Highlights

### Typography Hierarchy
- Headlines: Serif, bold, larger sizing
- Subheads: Sans-serif, medium weight
- Body: Sans-serif, relaxed leading

### Spacing System
- Section gaps: 16 (4rem)
- Card gaps: 6 (1.5rem)
- Internal padding: Generous (8-12)

### Color Palette
- Primary text: Gray-900
- Secondary text: Gray-600
- Backgrounds: White, Gray-50
- Accents: Black (CTAs), Blue/Green/Amber (labels)

---

## 🐛 Troubleshooting

### API Key Issues
- Make sure `.env.local` has valid GEMINI_API_KEY
- Restart dev server after adding keys

### Build Errors
```bash
npm run clean
npm install
npm run dev
```

### Firebase Auth Not Working
- Check `firebase-applet-config.json` has correct credentials
- Enable Google Sign-In in Firebase Console

---

## 📝 Notes

- All API integrations remain unchanged
- Firebase auth and Firestore work as before
- Live feed feature requires NEWS_API_KEY (optional)
- Responsive design works on mobile/tablet/desktop

---

Happy testing! 🎉
