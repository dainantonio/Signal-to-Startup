import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { GoogleGenAI } from '@google/genai';

const MARKET_CONTEXT: Record<string, string> = {
  global: 'Focus on scalable international opportunities.',
  caribbean: `CARIBBEAN CONTEXT: Focus on informal-to-formal transitions, mobile-first solutions, DBJ/JBDC funding, JMD costs. Use local terminology.`,
  africa: 'Focus on mobile money, informal economy, TEF funding.',
  uk: 'Focus on UK regulatory landscape, Innovate UK grants.',
  latam: 'Focus on IDB funding, informal economy, mobile-first.',
};

export async function GET(request: NextRequest) {
  console.log('[SCOUT] GET function entered');

  const authHeader = request.headers.get('authorization');
  if (
    process.env.NODE_ENV === 'production' &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[SCOUT] Auth passed');

  const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    console.error('[SCOUT] Missing GEMINI_API_KEY / NEXT_PUBLIC_GEMINI_API_KEY');
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
  }

  console.log('[SCOUT] Env vars present');

  let db: ReturnType<typeof getAdminDb>;
  try {
    db = getAdminDb();
    console.log('[SCOUT] Firestore initialized');
  } catch (initError) {
    console.error('[SCOUT] Firestore init failed:', String(initError));
    return NextResponse.json({ error: `Firestore init: ${String(initError)}` }, { status: 500 });
  }

  const ai = new GoogleGenAI({ apiKey: geminiKey });
  console.log('[SCOUT] AI initialized');

  console.log('[SCOUT] Opportunity Scout starting...');

  try {

    // STEP 1: Get unanalyzed signals, filter by score in code to avoid composite index
    const signalsSnapshot = await db
      .collection('agent_signals')
      .where('analyzed', '==', false)
      .get();

    console.log('[SCOUT] Total unanalyzed:', signalsSnapshot.size);

    const highScoreSignals = signalsSnapshot.docs.filter(d => (d.data().userScore ?? 0) >= 80);

    console.log('[SCOUT] High score signals:', highScoreSignals.length);

    if (highScoreSignals.length === 0) {
      console.log('[SCOUT] No high-score unanalyzed signals found');
      return NextResponse.json({ success: true, analyzed: 0, message: 'No signals to analyze' });
    }

    const results: { signalId: string; opportunityId: string; bestIdea: string | undefined }[] = [];

    // Max 3 per run to stay within API limits and execution time
    const signalsToProcess = highScoreSignals.slice(0, 3);

    for (const signalDoc of signalsToProcess) {
      const signal = signalDoc.data();
      console.log('[SCOUT] Analyzing:', signal.title?.substring(0, 50));

      try {
        // Get user preferences for market context
        const userPrefDoc = await db.collection('user_preferences').doc(signal.userId).get();
        const userPrefs = userPrefDoc.exists ? userPrefDoc.data() : {};
        const marketMode = (userPrefs?.marketMode as string) || 'global';
        const countryTag = (userPrefs?.countryTag as string) || '';
        const marketContext = MARKET_CONTEXT[marketMode] || '';
        const countryContext = countryTag ? `TARGET COUNTRY: ${countryTag}` : '';

        const prompt = `Analyze this market signal and find exactly 3 startup opportunities.

SIGNAL: "${signal.title}: ${signal.snippet}"

${marketContext}
${countryContext}

Return ONLY valid JSON:
{
  "summary": "2 sentence summary",
  "trend": "one sentence trend",
  "affected_groups": ["group1", "group2"],
  "problems": ["problem1", "problem2"],
  "opportunities": [
    {
      "name": "opportunity name",
      "description": "2 sentences",
      "target_customer": "who to sell to",
      "why_now": "1 sentence",
      "monetization": "how to make money",
      "pricing_model": "specific pricing",
      "status": "New",
      "priority": "High",
      "startup_cost": 500,
      "grant_eligible": false,
      "speed_to_launch": 8,
      "difficulty": 4,
      "roi_potential": 8,
      "urgency": 7,
      "local_fit": 7,
      "competition_gap": 6,
      "money_score": 75
    }
  ],
  "best_idea": {
    "name": "best opportunity name",
    "reason": "why this is best",
    "who_should_build": "who should do this",
    "cost_estimate": "$500 - $1,000",
    "speed_rating": "Fast",
    "first_steps": ["step1", "step2", "step3"]
  }
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            maxOutputTokens: 1200,
          },
        });

        const rawText = response.text ?? '';
        console.log('[SCOUT] Raw response length:', rawText.length);

        let parsed: Record<string, unknown> | null = null;

        // Clean the text first
        const cleanedText = rawText
          .replace(/```json/gi, '')
          .replace(/```/g, '')
          .trim();

        // Try 1 — direct parse
        try {
          parsed = JSON.parse(cleanedText);
          console.log('[SCOUT] Parsed via try 1');
        } catch {}

        // Try 2 — find JSON object
        if (!parsed) {
          const match = cleanedText.match(/\{[\s\S]*\}/);
          if (match) {
            try {
              parsed = JSON.parse(match[0]);
              console.log('[SCOUT] Parsed via try 2');
            } catch {}
          }
        }

        // Try 3 — fix trailing commas
        if (!parsed) {
          try {
            const fixed = cleanedText.replace(/,(\s*[}\]])/g, '$1');
            parsed = JSON.parse(fixed);
            console.log('[SCOUT] Parsed via try 3');
          } catch {}
        }

        if (!parsed) {
          console.error('[SCOUT] Parse failed for:', signal.title);
          continue;
        }

        // Cap at 3 opportunities
        if (Array.isArray(parsed.opportunities) && parsed.opportunities.length > 3) {
          parsed.opportunities = parsed.opportunities.slice(0, 3);
        }

        // STEP 2: Save to agent_opportunities
        const opportunityRef = db.collection('agent_opportunities').doc();
        await opportunityRef.set({
          userId: signal.userId,
          signalId: signalDoc.id,
          signalTitle: signal.title,
          signalUrl: signal.url,
          signalSource: signal.source,
          signalScore: signal.userScore,
          marketMode,
          countryTag: countryTag || null,
          result: parsed,
          createdAt: new Date().toISOString(),
          viewed: false,
          saved: false,
        });

        // STEP 3: Mark signal as analyzed
        await signalDoc.ref.update({
          analyzed: true,
          analyzedAt: new Date().toISOString(),
          opportunityId: opportunityRef.id,
        });

        // STEP 4: Create in-app notification
        const bestIdea =
          (parsed.best_idea as Record<string, string> | undefined)?.name ??
          (parsed.opportunities as Record<string, string>[])?.[0]?.name ??
          'New opportunity';

        await db.collection('notifications').add({
          userId: signal.userId,
          type: 'new_opportunity',
          title: 'New opportunity discovered',
          message: `${bestIdea} — based on: ${signal.title?.substring(0, 60)}...`,
          opportunityId: opportunityRef.id,
          signalScore: signal.userScore,
          read: false,
          createdAt: new Date().toISOString(),
        });

        results.push({
          signalId: signalDoc.id,
          opportunityId: opportunityRef.id,
          bestIdea,
        });

        console.log('[SCOUT] Saved opportunity:', bestIdea);

        // Brief delay between API calls
        await new Promise(r => setTimeout(r, 1000));

      } catch (signalError) {
        console.error('[SCOUT] Error analyzing signal:', signalError);
        continue;
      }
    }

    console.log('[SCOUT] Complete:', results);

    return NextResponse.json({
      success: true,
      analyzed: results.length,
      results,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[SCOUT] Failed:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
