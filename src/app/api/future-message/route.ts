import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ai, GEMINI_MODEL } from '@/lib/gemini';
import { checkRateLimit } from '@/lib/rate-limit';

const RequestSchema = z.object({
  profile: z.object({
    location: z.string()
  }),
  stats: z.object({
    healthScore: z.number(),
    currentStreak: z.number()
  })
});

const FutureMessageResponseSchema = z.object({
  message: z.string(),
  urgency: z.enum(['low', 'medium', 'high', 'critical'])
});

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
      const validated = FutureMessageResponseSchema.safeParse(data);
      if (validated.success) return validated.data;
    } catch (e) {
      console.error("Future message parse failed on attempt", i, e);
    }
  }
  // Fallback safe response
  return {
    message: "Signal lost from 2075. Your present choices are clouding the timeline.",
    urgency: "medium"
  };
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'anonymous';
    const rateLimit = await checkRateLimit({ identifier: ip, scope: 'future-message', windowMs: 5000 });

    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await req.json();
    const result = RequestSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid payload', details: result.error.format() }, { status: 400 });
    }

    const { profile, stats } = result.data;

    const stateDesc = stats.healthScore >= 70 ? 'thriving and green' 
                    : stats.healthScore < 40 ? 'polluted and struggling' 
                    : 'in a delicate balance';

    const prompt = `
      You are the user's Future Self, writing from the year 2075 in ${profile.location}.
      Based on the user's current timeline trajectory, their future world is ${stateDesc} (Health Score: ${stats.healthScore}/100).
      They have maintained a ${stats.currentStreak} day streak of logging eco-actions.

      Write a short, 2-sentence message to your past self. 
      If the world is thriving, express gratitude. If it is struggling, express urgent warning but hope.
      Make it deeply personal to ${profile.location}.

      Respond strictly in this JSON format:
      {
        "message": "The text of the message",
        "urgency": "low | medium | high | critical"
      }
    `;

    const data = await generateWithRetry(prompt);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Future Message Error:', error);
    // Return a guaranteed 200 fallback so the UI never crashes
    return NextResponse.json({
      message: "Connection to 2075 established, but data is corrupted. Please ensure your API keys are configured.",
      urgency: "medium"
    });
  }
}
