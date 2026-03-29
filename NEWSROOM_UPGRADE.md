# 🗞️ Newsroom Workflow - Setup & Testing Guide

## What's New

The app has been upgraded with a **newsroom-inspired workflow** featuring restored news feed + new daily brief!

### 📋 Key Features

1. **Workflow Stepper** (Top)
   - Visual progress: Signal → Trend → Opportunities → Execution
   - Always visible when viewing results
   - Auto-scrolls based on page position

2. **Signal Desk** (Redesigned Input) - **TWO MODES**
   - **📝 Paste Signal Mode:**
     - Clean, dominant lead card design
     - Extract button directly under text input
     - Collapsible "Desk Settings" for market/location/focus
     - Quick edit & rerun button when results exist
   
   - **📰 Newsroom Feed Mode:** ✨ **RESTORED + ENHANCED**
     - Live news feed with category filtering
     - Sector-based organization (AI, Policy, Markets, etc.)
     - Time range filters (Today, 3 days, 1 week)
     - Country/market targeting
     - Signal strength scoring (60-100 scale)
     - One-click analyze from feed cards
     - Real-time article fetching

3. **Daily Brief** 🆕
   - **Floating "Daily Brief" button** (bottom-right)
   - Shows top 5 high-priority signals you may have missed
   - Auto-appears once per day
   - Filter by signal score (60+ only)
   - One-click analyze from brief
   - Mark as read to dismiss

4. **Briefing Columns** (2-Column Layout)
   - **Left:** Emerging Trend + Evidence snippets
   - **Right:** Impacted Groups + Market Friction
   - Equal height columns with full-width text blocks
   - Newspaper-style section headers

5. **Opportunity Grid** (Redesigned Cards)
   - Edition labels: "ROI", "Fast", "Urgent" (like section tags)
   - Fixed CTA at bottom for consistent scanning
   - Cleaner layout with better typography
   - Reduced clutter, more whitespace

6. **Sticky Action Bar**
   - Appears on scroll with Extract/Regenerate/Save
   - Quick access without scrolling back

7. **Visual Polish**
   - Stronger typographic hierarchy
   - More whitespace between sections
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
NEWS_API_KEY=your_newsapi_key_for_live_feed
APP_URL=http://localhost:3000
```

**Note:** `NEWS_API_KEY` is required for the live feed and daily brief features!

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

1. **Signal Desk - Paste Mode**
   - Click "Paste Signal" tab
   - Paste a news article or market signal
   - Try collapsing/expanding "Desk Settings"
   - Click "Extract Opportunities"

2. **Signal Desk - Newsroom Feed** ✨
   - Click "Newsroom Feed" tab
   - Browse live news signals by category
   - Click filter button to adjust:
     - Sectors (AI, Policy, Markets, etc.)
     - Time range (Today, 3 days, 1 week)
     - Market region
   - Click "Analyze" on any feed card
   - Watch in-card progress animation

3. **Daily Brief** 🆕
   - Click floating "Daily Brief" button (bottom-right)
   - View top 5 high-priority signals
   - Click any signal to auto-analyze
   - Click "Mark as Read" to dismiss
   - Brief auto-appears once daily

4. **Watch Workflow Stepper**
   - Notice the stepper at top showing progress
   - It updates as you scroll through results

5. **Briefing Columns**
   - Check the 2-column layout (Trend + Evidence | Groups + Friction)
   - Verify equal column heights
   - Review typography hierarchy

6. **Opportunity Grid**
   - Look for edition labels (ROI/Fast/Urgent) on cards
   - Check that CTAs are at consistent bottom position
   - Try the filters (ROI, Urgent, Fast, Grant Only)

7. **Sticky Action Bar**
   - Scroll down to see it appear
   - Test Extract/Regenerate buttons

8. **Quick Edit**
   - After results appear, scroll back to Signal Desk
   - Click "Quick edit & rerun" to modify and reanalyze

---

## 📁 New Components Created

- `/app/components/WorkflowStepper.tsx` - Progress stepper
- `/app/components/StickyActionBar.tsx` - Floating action bar
- `/app/components/SignalDeskNewsroom.tsx` - **FULL NEWSROOM DESK** (Paste + Feed modes)
- `/app/components/BriefingColumns.tsx` - 2-column results layout
- `/app/components/OpportunityGrid.tsx` - Grid with filters
- `/app/components/DailyBrief.tsx` - **NEW: Daily missed signals brief**
- `/app/components/agent/TrendIntelligenceAgentNewsroom.tsx` - Main newsroom agent

## 🔧 Modified Files

- `/app/app/page.tsx` - Updated to use newsroom agent
- `/app/components/OpportunityCard.tsx` - Added edition labels + fixed CTA

---

## 🎨 Design Highlights

### News Feed Features
- **Category Badges:** Color-coded by sector (AI=Indigo, Policy=Amber, Markets=Green, etc.)
- **Signal Scores:** 60-100 scale with visual indicators (🔥 for 80+, ⚡ for 60+)
- **In-Card Analysis:** Progress bar and stage updates within feed cards
- **Smart Filtering:** Multi-select sectors, time ranges, market regions

### Daily Brief
- **Auto-Trigger:** Appears once per day for new users
- **Top Signals Only:** Filtered by score (60+ threshold)
- **Quick Analyze:** One-click from brief to full analysis
- **Persistent State:** Remembers last check date

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

### News Feed Not Loading
- Make sure `.env.local` has valid NEWS_API_KEY
- Restart dev server after adding key
- Check browser console for API errors

### Daily Brief Empty
- Requires NEWS_API_KEY to be configured
- Only shows signals with score 60+
- Refreshes daily

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

- **News Feed RESTORED:** Full category filtering, time ranges, and live updates
- **Daily Brief NEW:** Auto-shows top signals you missed
- All API integrations remain unchanged
- Firebase auth and Firestore work as before
- Responsive design works on mobile/tablet/desktop

---

Happy testing! 🎉
