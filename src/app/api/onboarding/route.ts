import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// Initialize the Gemini AI client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { profile } = body;

    if (!profile || !profile.location) {
      return NextResponse.json({ error: 'Missing profile data' }, { status: 400 });
    }

    // Step 1: Analyze the profile and generate a narrative and an image prompt
    const prompt = `
      You are the EcoVerse Oracle. The user lives in ${profile.location}.
      Their current lifestyle consists of:
      - Diet: ${profile.lifestyleBaseline.diet}
      - Commute: ${profile.lifestyleBaseline.commute}
      - Energy: ${profile.lifestyleBaseline.energy}
      
      Based on this, simulate their city in 50 years.
      1. Write a 3-sentence visceral, sensory narrative describing the local environment. Do not be overly apocalyptic, make it grounded and realistic.
      2. Provide a detailed, 1-sentence prompt that can be used to generate an image of this exact future city landscape.

      Respond ONLY in valid JSON format:
      {
        "narrative": "the narrative text",
        "imagePrompt": "the image prompt text"
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const contentText = response.text || '{}';
    let generatedData;
    try {
      generatedData = JSON.parse(contentText);
    } catch (e) {
      console.error("Failed to parse Gemini response:", contentText);
      throw new Error("Invalid response format from Gemini");
    }

    // Here we would normally call an Image Generation API with generatedData.imagePrompt
    // For this MVP, we will return a placeholder or null, and handle the image client-side or wait for Phase 3.

    return NextResponse.json({
      worldState: {
        narrative: generatedData.narrative,
        imageUrl: null, // To be implemented with Cloud Storage & Image Gen
      }
    });

  } catch (error: any) {
    console.error('Onboarding Generation Error:', error);
    return NextResponse.json({ error: 'Failed to generate world simulation' }, { status: 500 });
  }
}
