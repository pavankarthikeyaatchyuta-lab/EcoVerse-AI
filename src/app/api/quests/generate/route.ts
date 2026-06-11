import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const rateLimitMap = new Map<string, number>();

const RequestSchema = z.object({
  profile: z.object({
    location: z.string(),
    lifestyleBaseline: z.object({
      diet: z.string(),
      commute: z.string(),
      energy: z.string()
    })
  }),
  stats: z.object({
    healthScore: z.number(),
    currentStreak: z.number().optional(),
    lastLogin: z.number().nullable().optional()
  })
});

const QuestsResponseSchema = z.object({
  quests: z.array(z.object({
    title: z.string(),
    description: z.string(),
    xpReward: z.number()
  }))
});

async function generateWithRetry(prompt: string, retries = 2): Promise<any> {
  for (let i = 0; i < retries; i++) {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    try {
      const data = JSON.parse(response.text || '{}');
      const validated = QuestsResponseSchema.safeParse(data);
      if (validated.success) return validated.data;
    } catch (e) {
      console.error("Quest Parse failed on attempt", i);
    }
  }
  // Fallback safe response if Gemini keeps failing
  return {
    quests: [
      {
        title: "Unplug Idle Electronics",
        description: "Unplug chargers and appliances you aren't using today.",
        xpReward: 50
      },
      {
        title: "Meatless Meal",
        description: "Substitute one meal today with a fully plant-based option.",
        xpReward: 100
      }
    ]
  };
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'anonymous';
    const now = Date.now();
    const lastRequest = rateLimitMap.get(ip);
    
    if (lastRequest && (now - lastRequest) < 10000) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }
    rateLimitMap.set(ip, now);

    const body = await req.json();
    const result = RequestSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid payload', details: result.error.format() }, { status: 400 });
    }

    const { profile } = result.data;

    const prompt = `
      You are the EcoVerse AI Quest Master.
      Based on the user's profile:
      - Location: ${profile.location}
      - Diet: ${profile.lifestyleBaseline.diet}
      - Commute: ${profile.lifestyleBaseline.commute}
      
      Generate exactly 3 personalized, achievable carbon reduction quests for today.
      Make them specific to ${profile.location} if possible.
      
      Respond strictly in the following JSON format:
      {
        "quests": [
          {
            "title": "Short catchy title",
            "description": "1 sentence explanation of what to do and why.",
            "xpReward": 50
          }
        ]
      }
    `;

    const data = await generateWithRetry(prompt);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Quest Generation Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
