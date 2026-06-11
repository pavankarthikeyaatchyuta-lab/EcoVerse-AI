import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';

const rateLimitMap = new Map<string, number>();

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'coach']),
  text: z.string()
});

const RequestSchema = z.object({
  message: z.string().min(1).max(500),
  history: z.array(ChatMessageSchema),
  eli10Mode: z.boolean().optional()
});

const GeminiResponseSchema = z.object({
  choice: z.string(),
  impact: z.string(),
  equivalent: z.array(z.string()),
  alternative: z.string(),
  suggestion: z.string(),
  impactReductionPercentage: z.number()
});

async function generateWithRetry(contents: any, systemPrompt: string, retries = 2): Promise<any> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined.");
  }
  const ai = new GoogleGenAI({ apiKey });

  for (let i = 0; i < retries; i++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: contents,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
        }
      });

      const data = JSON.parse(response.text || '{}');
      const validated = GeminiResponseSchema.safeParse(data);
      if (validated.success) return validated.data;
    } catch (e) {
      console.error("Parse failed on attempt", i, e);
    }
  }
  
  // Fallback
  return {
    choice: "Your recent action",
    impact: "Unknown CO2 impact",
    equivalent: ["Equivalent to breathing for a day"],
    alternative: "Consider local or plant-based alternatives",
    suggestion: "I had trouble analyzing that precisely, but reducing transport and meat consumption always helps!",
    impactReductionPercentage: 0
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
    const result = RequestSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid payload', details: result.error.format() }, { status: 400 });
    }

    const { message, history, eli10Mode } = result.data;

    const styleGuide = eli10Mode 
      ? "Explain everything as if I am a 10 year old child. Use very simple words, fun emojis, and basic concepts." 
      : "Be conversational, encouraging, and highly actionable.";

    const systemPrompt = `
      You are the EcoVerse AI Carbon Coach.
      Your goal is to help the user reduce their carbon footprint.
      ${styleGuide}

      When the user tells you about an action, you must analyze it and return a strict JSON response matching this EXACT structure:
      {
        "choice": "A brief summary of their choice.",
        "impact": "Estimated CO2 impact.",
        "equivalent": ["Equivalent to driving X km"],
        "alternative": "A realistic lower-impact alternative.",
        "suggestion": "A personalized action they can take.",
        "impactReductionPercentage": 35
      }
    `;

    const contents = history.slice(1).map(msg => ({
      role: msg.role === 'coach' ? 'model' : 'user',
      parts: [{ text: msg.text }]
    }));

    contents.push({ role: 'user', parts: [{ text: message }] });

    const data = await generateWithRetry(contents, systemPrompt);

    return NextResponse.json({ response: data });
  } catch (error) {
    console.error('Coach Chat Error:', error);
    // Return a guaranteed 200 fallback so the UI never crashes
    return NextResponse.json({ 
      response: {
        choice: "Error processing",
        impact: "Unknown",
        equivalent: ["API Error"],
        alternative: "Make sure your API keys are configured.",
        suggestion: "There was a network error. Ensure GEMINI_API_KEY is set in Cloud Run.",
        impactReductionPercentage: 0
      }
    });
  }
}
