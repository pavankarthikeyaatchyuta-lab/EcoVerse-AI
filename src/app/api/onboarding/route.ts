import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';

// Initialize the Gemini AI client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const rateLimitMap = new Map<string, number>();

const OnboardingResponseSchema = z.object({
  narrative: z.string(),
  imagePrompt: z.string().optional(),
});

async function generateWithRetry(prompt: string, retries = 2): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });
      
      const contentText = response.text || '{}';
      const data = JSON.parse(contentText);
      const validated = OnboardingResponseSchema.safeParse(data);
      if (validated.success) return validated.data;
    } catch (e) {
      console.error("Failed to parse Gemini response on attempt", i, e);
    }
  }
  
  // Fallback safe response
  return {
    narrative: "A sprawling metropolis where technology and nature are attempting to find balance. The air hums with the sound of electric transit, but the horizon is clouded by the consequences of past industrial choices. It's a world in flux, waiting for decisive action.",
    imagePrompt: "A futuristic city skyline with a mix of green tech and pollution smog."
  };
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'anonymous';
    const now = Date.now();
    const lastRequest = rateLimitMap.get(ip);
    
    if (lastRequest && (now - lastRequest) < 2000) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }
    rateLimitMap.set(ip, now);

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

    const generatedData = await generateWithRetry(prompt);

    return NextResponse.json({
      worldState: {
        narrative: generatedData.narrative,
        imageUrl: null, 
        cssState: 'neutral'
      }
    });

  } catch (error: any) {
    console.error('Onboarding Generation Error:', error);
    // Even if it completely fails at network level, return a fallback so user isn't stuck
    return NextResponse.json({
      worldState: {
        narrative: "The future of your city remains uncertain. Small choices today will ripple into tomorrow.",
        imageUrl: null,
        cssState: 'neutral'
      }
    });
  }
}
