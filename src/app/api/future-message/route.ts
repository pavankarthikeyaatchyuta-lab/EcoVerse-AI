import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Basic in-memory rate limiting (Note: in production across multiple instances, use Redis/Firestore)
const rateLimitMap = new Map<string, number>();

const RequestSchema = z.object({
  location: z.string().min(2).max(100),
  recentChoice: z.string().min(2).max(200),
  healthScore: z.number().min(0).max(100),
});

export async function POST(req: Request) {
  try {
    // 1. Rate Limiting Check (by IP)
    const ip = req.headers.get('x-forwarded-for') || 'anonymous';
    const now = Date.now();
    const lastRequest = rateLimitMap.get(ip);
    
    if (lastRequest && (now - lastRequest) < 5000) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }
    rateLimitMap.set(ip, now);

    // 2. Parse & Validate Body
    const body = await req.json();
    const result = RequestSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid payload', details: result.error.format() }, { status: 400 });
    }

    const { location, recentChoice, healthScore } = result.data;

    // 3. Gemini Generation
    const prompt = `
      You are the user's Future Self living in ${location} in the year 2075.
      The current world health score timeline is ${healthScore}/100.
      The user just made this choice: "${recentChoice}".
      
      Write a short, highly personalized 2-sentence message from their future self.
      If healthScore > 70, be grateful for their choice protecting the local environment in ${location}.
      If healthScore < 40, warn them about the specific local consequences in ${location} if they don't change.
      Make it emotional and urgent. Do not sound like a robot.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
    });

    const message = response.text || 'The transmission from the future was lost...';

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Future Message API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
