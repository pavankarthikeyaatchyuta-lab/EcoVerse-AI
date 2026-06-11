import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ai, GEMINI_MODEL } from '@/lib/gemini';
import { getCachedAiPayload, setCachedAiPayload } from '@/lib/ai-cache';
import { checkRateLimit } from '@/lib/rate-limit';

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

const CACHE_TTL_MS = 1000 * 60 * 60 * 24;

async function generateWithRetry(prompt: string, retries = 2): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });

      const data = JSON.parse(response.text || '{}');
      const validated = QuestsResponseSchema.safeParse(data);
      if (validated.success) return validated.data;
    } catch (e) {
      console.error("Quest Parse failed on attempt", i, e);
    }
  }
  // Fallback safe response
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
    const rateLimit = await checkRateLimit({ identifier: ip, scope: 'quest-generate', windowMs: 10000 });

    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await req.json();
    const result = RequestSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid payload', details: result.error.format() }, { status: 400 });
    }

    const { profile } = result.data;
    const cacheKeyParts = [
      'quest-generate',
      profile.location,
      profile.lifestyleBaseline.diet,
      profile.lifestyleBaseline.commute,
      profile.lifestyleBaseline.energy,
      result.data.stats.healthScore,
      result.data.stats.currentStreak ?? 0,
      result.data.stats.lastLogin ?? 0,
    ];

    const cachedQuests = await getCachedAiPayload<{
      quests: Array<{
        title: string;
        description: string;
        xpReward: number;
      }>;
    }>(cacheKeyParts, CACHE_TTL_MS);

    if (cachedQuests) {
      return NextResponse.json(cachedQuests);
    }

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
    await setCachedAiPayload(cacheKeyParts, data);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Quest Generation Error:', error);
    // Return a guaranteed 200 fallback so UI doesn't crash
    return NextResponse.json({
      quests: [
        {
          title: "Setup API Keys",
          description: "Ensure your GEMINI_API_KEY is configured in Cloud Run to receive personalized quests.",
          xpReward: 10
        }
      ]
    });
  }
}
