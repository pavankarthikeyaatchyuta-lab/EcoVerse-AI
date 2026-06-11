import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ai, GEMINI_MODEL } from '@/lib/gemini';
import { getCachedAiPayload, setCachedAiPayload } from '@/lib/ai-cache';
import { checkRateLimit } from '@/lib/rate-limit';

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

type CoachResponse = z.infer<typeof GeminiResponseSchema>;

type CoachStreamPayload = {
  response: CoachResponse;
  assistantText: string;
};

const CACHE_TTL_MS = 1000 * 60 * 60 * 12;
const STREAM_CHUNK_SIZE = 24;

function createFallbackResponse(): CoachResponse {
  return {
    choice: 'Your recent action',
    impact: 'Unknown CO2 impact',
    equivalent: ['Equivalent to breathing for a day'],
    alternative: 'Consider local or plant-based alternatives',
    suggestion: 'I had trouble analyzing that precisely, but reducing transport and meat consumption always helps!',
    impactReductionPercentage: 0
  };
}

function chunkText(text: string, chunkSize = STREAM_CHUNK_SIZE) {
  const chunks: string[] = [];

  for (let index = 0; index < text.length; index += chunkSize) {
    chunks.push(text.slice(index, index + chunkSize));
  }

  return chunks;
}

function encodeSseEvent(event: string, payload: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
}

async function generateWithRetry(contents: any, systemPrompt: string, retries = 2): Promise<CoachResponse> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
        }
      });

      const data = JSON.parse(response.text || '{}');
      const validated = GeminiResponseSchema.safeParse(data);
      if (validated.success) return validated.data;
    } catch (error) {
      console.error('Parse failed on attempt', i, error);
    }
  }

  return createFallbackResponse();
}

async function streamCoachResponse(
  cacheKeyParts: Array<string | number | boolean | null | undefined>,
  cached: CoachStreamPayload | null,
  contents: any,
  analysisPrompt: string,
  streamPrompt: string
) {
  const encoder = new TextEncoder();

  return new Response(
    new ReadableStream({
      async start(controller) {
        const send = (event: string, payload: unknown) => {
          controller.enqueue(encoder.encode(encodeSseEvent(event, payload)));
        };

        let assistantText = '';

        try {
          if (cached) {
            const fallbackText = cached.assistantText || cached.response.suggestion;
            for (const chunk of chunkText(fallbackText)) {
              assistantText += chunk;
              send('delta', { text: chunk });
            }
          } else {
            const analysisPromise = generateWithRetry(contents, analysisPrompt);
            const stream = await ai.models.generateContentStream({
              model: GEMINI_MODEL,
              contents,
              config: {
                systemInstruction: streamPrompt,
              }
            });

            for await (const chunk of stream) {
              const text = chunk.text ?? '';
              if (!text) continue;
              assistantText += text;
              send('delta', { text });
            }

            const analysis = await analysisPromise;
            const finalAssistantText = assistantText.trim() || analysis.suggestion;
            if (!assistantText.trim()) {
              for (const chunk of chunkText(finalAssistantText)) {
                send('delta', { text: chunk });
              }
              assistantText = finalAssistantText;
            }

            const payload: CoachStreamPayload = {
              response: analysis,
              assistantText: finalAssistantText,
            };

            await setCachedAiPayload(cacheKeyParts, payload);
            send('result', payload);
            controller.close();
            return;
          }

          const response = cached?.response ?? createFallbackResponse();
          const finalAssistantText = assistantText.trim() || response.suggestion;
          const payload: CoachStreamPayload = {
            response,
            assistantText: finalAssistantText,
          };

          await setCachedAiPayload(cacheKeyParts, payload);
          send('result', payload);
          controller.close();
        } catch (error) {
          console.error('Coach Stream Error:', error);
          const fallbackResponse = createFallbackResponse();
          const fallbackText = fallbackResponse.suggestion;

          if (!assistantText.trim()) {
            for (const chunk of chunkText(fallbackText)) {
              send('delta', { text: chunk });
            }
          }

          const payload: CoachStreamPayload = {
            response: fallbackResponse,
            assistantText: fallbackText,
          };

          await setCachedAiPayload(cacheKeyParts, payload);
          send('result', payload);
          controller.close();
        }
      }
    }),
    {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      }
    }
  );
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'anonymous';
    const rateLimit = await checkRateLimit({ identifier: ip, scope: 'coach-chat', windowMs: 2000 });

    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await req.json();
    const result = RequestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid payload', details: result.error.format() }, { status: 400 });
    }

    const { message, history, eli10Mode } = result.data;
    const cacheKeyParts = [
      'coach-chat',
      message,
      eli10Mode ?? false,
      ...history.map((item) => `${item.role}:${item.text}`),
    ];

    const styleGuide = eli10Mode
      ? 'Explain everything as if I am a 10 year old child. Use very simple words, fun emojis, and basic concepts.'
      : 'Be conversational, encouraging, and highly actionable.';

    const analysisPrompt = `
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

    const streamPrompt = `
      You are the EcoVerse AI Carbon Coach.
      ${styleGuide}

      Reply directly to the user in plain text.
      Keep the response warm, practical, and short enough to read comfortably on mobile.
      Do not use JSON. Do not include code fences.
    `;

    const contents = history.slice(1).map((msg) => ({
      role: msg.role === 'coach' ? 'model' : 'user',
      parts: [{ text: msg.text }]
    }));

    contents.push({ role: 'user', parts: [{ text: message }] });

    const acceptHeader = req.headers.get('accept') || '';
    const cached = await getCachedAiPayload<CoachStreamPayload>(cacheKeyParts, CACHE_TTL_MS);

    if (acceptHeader.includes('text/event-stream')) {
      return streamCoachResponse(cacheKeyParts, cached ?? null, contents, analysisPrompt, streamPrompt);
    }

    if (cached) {
      return NextResponse.json({ response: cached.response });
    }

    const data = await generateWithRetry(contents, analysisPrompt);
    const payload: CoachStreamPayload = {
      response: data,
      assistantText: data.suggestion,
    };

    await setCachedAiPayload(cacheKeyParts, payload);

    return NextResponse.json({ response: data });
  } catch (error) {
    console.error('Coach Chat Error:', error);
    return NextResponse.json({
      response: {
        choice: 'Error processing',
        impact: 'Unknown',
        equivalent: ['API Error'],
        alternative: 'Make sure your API keys are configured.',
        suggestion: 'There was a network error. Ensure GEMINI_API_KEY is set in Cloud Run.',
        impactReductionPercentage: 0
      }
    });
  }
}
