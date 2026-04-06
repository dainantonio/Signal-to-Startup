import { useState } from 'react';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import { Opportunity, DeepDiveResult, LandingPageData } from '../types';
import { updateDoc, doc, db } from '../../firebase';

const landingPageSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    hero_headline: { type: Type.STRING, description: "Punchy, value-driven main headline (H1)." },
    hero_subheadline: { type: Type.STRING, description: "1-2 sentence description of the solution and who it is for." },
    cta_text: { type: Type.STRING, description: "Action-oriented button text (e.g., 'Get Early Access')." },
    value_proposition: {
      type: Type.ARRAY,
      description: "Exactly 3 key value propositions.",
      items: {
        type: Type.OBJECT,
        properties: {
          feature_title: { type: Type.STRING },
          feature_description: { type: Type.STRING },
          icon_name: { type: Type.STRING, description: "A highly relevant generic icon name (e.g., Zap, Shield, TrendingUp, Target, Heart, Anchor)." }
        },
        required: ["feature_title", "feature_description", "icon_name"]
      }
    },
    target_audience_pain: { type: Type.STRING, description: "A sentence highlighting the pain point the target audience faces." },
    solution_statement: { type: Type.STRING, description: "A sentence stating how this product uniquely solves that pain." },
    color_theme: {
      type: Type.OBJECT,
      properties: {
        primary: { type: Type.STRING, description: "A standard Tailwind color (blue, emerald, indigo, rose, amber, purple, slate)." },
        background: { type: Type.STRING, description: "'light' or 'dark'" }
      },
      required: ["primary", "background"]
    },
    pricing_suggestion: {
      type: Type.ARRAY,
      description: "Provide 1-3 simple pricing tiers",
      items: {
        type: Type.OBJECT,
        properties: {
          tier_name: { type: Type.STRING },
          price: { type: Type.STRING, description: "e.g., '$29/mo' or 'Custom'" },
          perks: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["tier_name", "price", "perks"]
      }
    }
  },
  required: [
    "hero_headline", 
    "hero_subheadline", 
    "cta_text", 
    "value_proposition", 
    "target_audience_pain", 
    "solution_statement", 
    "color_theme",
    "pricing_suggestion"
  ]
};

export function useAgentLandingPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateLandingPage = async (
    opportunity: Opportunity, 
    deepDive: DeepDiveResult,
    savedDocId: string
  ): Promise<LandingPageData | null> => {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      setError('Missing API Key');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const genAI = new GoogleGenAI({ apiKey });

      const prompt = `
        You are a world-class startup copywriter and web designer. 
        Your task is to take an entrepreneur's verified business plan and convert it into a highly-converting, sleek landing page structure.

        BUSINESS IDEA: ${opportunity.name} 
        DESCRIPTION: ${opportunity.description}
        TARGET AUDIENCE: ${opportunity.target_customer}
        MONETIZATION: ${opportunity.monetization}
        BUSINESS PLAN (Extract core details): ${deepDive.business_plan}

        INSTRUCTIONS:
        1. Write a punchy hero headline.
        2. Identify 3 strong value propositions.
        3. Suggest a modern color theme that fits the industry.
        4. Develop 1-3 realistic pricing tiers based on the monetization plan.
        5. Tone must be professional, urgent, and highly persuasive. DO NOT USE FLUFF.
      `;

      const response = await genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: landingPageSchema,
        },
      });

      const data = JSON.parse(response.text ?? '') as LandingPageData;

      // Save it automatically to the opportunity
      await updateDoc(doc(db, 'saved_opportunities', savedDocId), {
        landingPage: data,
      });

      return data;
    } catch (err) {
      console.error('[LANDING PAGE GENERATION FAILED]', err);
      setError('Failed to generate landing page copy.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    generateLandingPage,
    loading,
    error,
  };
}
