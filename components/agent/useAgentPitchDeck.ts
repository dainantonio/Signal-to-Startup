import { useState } from 'react';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import { Opportunity, DeepDiveResult, PitchDeckData } from '@/components/types';
import { db, doc, updateDoc } from '@/firebase';

const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

const ai = new GoogleGenAI({ apiKey: geminiApiKey });

const pitchDeckSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.OBJECT,
      properties: {
        company_name: { type: Type.STRING, description: "Punchy short name" },
        one_liner: { type: Type.STRING, description: "X for Y, or 5 word description." }
      },
      required: ["company_name", "one_liner"]
    },
    problem: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Extract 2-3 massive, painful problems that the customer is facing."
    },
    solution: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Extract 2-3 specific ways this startup solves the problem. Keep it brief and punchy."
    },
    market_size: {
      type: Type.OBJECT,
      properties: {
        tam: { type: Type.STRING, description: "Total Addressable Market (e.g., $10B)" },
        sam: { type: Type.STRING, description: "Serviceable Addressable Market (e.g., $2B)" },
        som: { type: Type.STRING, description: "Serviceable Obtainable Market (e.g., $100M)" },
        explanation: { type: Type.STRING, description: "1 sentence explaining the market logic." }
      },
      required: ["tam", "sam", "som", "explanation"]
    },
    business_model: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Extract exactly how this business charges money (e.g. $99/mo subscription, 2% transaction fee)."
    },
    go_to_market: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Extract the exact strategy to acquire the first 1,000 customers unscalably."
    },
    competition: {
      type: Type.OBJECT,
      properties: {
        competitor_types: { type: Type.STRING, description: "Who are the incumbents?" },
        our_advantage: { type: Type.STRING, description: "What is the unfair advantage?" }
      },
      required: ["competitor_types", "our_advantage"]
    },
    traction: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "What has been done so far? If nothing, what are the first 3 roadmap milestones to prove traction?"
    },
    team: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Describe the ideal 2-3 co-founders needed to execute this (e.g. 'Technical Co-founder with FinTech XP')."
    },
    the_ask: {
      type: Type.OBJECT,
      properties: {
        amount: { type: Type.STRING, description: "Suggested Pre-Seed/Seed funding amount (e.g. '$500K Pre-Seed')" },
        use_of_funds: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING },
          description: "3 bullet points on exactly where the money goes."
        }
      },
      required: ["amount", "use_of_funds"]
    }
  },
  required: [
    "title", "problem", "solution", "market_size", "business_model", 
    "go_to_market", "competition", "traction", "team", "the_ask"
  ]
};

export const useAgentPitchDeck = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePitchDeck = async (
    opportunity: Opportunity,
    deepDive: DeepDiveResult,
    savedDocId: string
  ): Promise<PitchDeckData | null> => {
    setLoading(true);
    setError(null);

    const promptText = `
You are a senior partner at Y-Combinator and Sequoia Capital. 
Your objective is to take the provided deep-dive business plan and ruthlessly compress it into the perfect 10-slide startup pitch deck data payload.

Investors hate reading. They skim. Keep every single bullet point to LESS THAN 12 WORDS. Be punchy, quantitative, and visionary.
Avoid jargon. Talk like a billion-dollar founder.

Original Signal & Core Idea:
Name: ${opportunity.name}
Description: ${opportunity.description}
Why Now: ${opportunity.why_now}

Business Plan:
${deepDive.business_plan}

Generate structured JSON matching the requested YC schema.
    `;

    try {
      const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: promptText,
        config: {
          systemInstruction: "You are a ruthless VC editor transforming business plans into ultra-condensed, highly persuasive 10-slide pitch decks. Output JSON only.",
          responseMimeType: "application/json",
          responseSchema: pitchDeckSchema,
          temperature: 0.3,
        }
      });

      const rawText = result.text;
      if (!rawText) throw new Error("No response from AI.");

      const pitchData: PitchDeckData = JSON.parse(rawText);

      // Save to Firebase
      if (savedDocId) {
        const docRef = doc(db, 'saved_opportunities', savedDocId);
        await updateDoc(docRef, { pitchDeck: pitchData });
      }

      return pitchData;
    } catch (err: unknown) {
      console.error("Pitch Deck Agent Error:", err);
      setError(err instanceof Error ? err.message : 'Analysis failed. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { generatePitchDeck, loading, error };
};
