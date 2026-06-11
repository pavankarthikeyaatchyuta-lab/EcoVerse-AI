/** @jest-environment node */

import { ai } from '@/lib/gemini';
import { checkRateLimit } from '@/lib/rate-limit';
import { POST as onboardingPOST } from '../onboarding/route';
import { POST as coachPOST } from '../coach/chat/route';
import { POST as futureMessagePOST } from '../future-message/route';
import { POST as questsPOST } from '../quests/generate/route';

jest.mock('@/lib/gemini', () => ({
  ai: {
    models: {
      generateContent: jest.fn(),
    },
  },
  GEMINI_MODEL: 'gemini-2.5-flash',
}));

jest.mock('@/lib/rate-limit', () => ({
  checkRateLimit: jest.fn(),
}));

const mockedGenerateContent = ai.models.generateContent as jest.Mock;
const mockedCheckRateLimit = checkRateLimit as jest.Mock;
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('API routes', () => {
  beforeEach(() => {
    mockedGenerateContent.mockReset();
    mockedCheckRateLimit.mockReset();
    mockedCheckRateLimit.mockResolvedValue({ allowed: true, source: 'memory' });
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  it('returns a generated onboarding world state', async () => {
    mockedGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify({
        narrative: 'A greener city emerges.',
        imagePrompt: 'A vibrant green city.',
      }),
    });

    const response = await onboardingPOST(
      new Request('http://localhost/api/onboarding', {
        method: 'POST',
        body: JSON.stringify({
          profile: {
            location: 'Seattle, WA',
            lifestyleBaseline: {
              diet: 'Vegan',
              commute: 'Public Transit',
              energy: '100% Renewable',
            },
          },
        }),
      })
    );

    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.worldState.narrative).toBe('A greener city emerges.');
    expect(mockedGenerateContent).toHaveBeenCalledTimes(1);
  });

  it('falls back cleanly when onboarding generation fails', async () => {
    mockedGenerateContent.mockRejectedValue(new Error('Gemini down'));

    const response = await onboardingPOST(
      new Request('http://localhost/api/onboarding', {
        method: 'POST',
        body: JSON.stringify({
          profile: {
            location: 'Seattle, WA',
            lifestyleBaseline: {
              diet: 'Vegan',
              commute: 'Public Transit',
              energy: '100% Renewable',
            },
          },
        }),
      })
    );

    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.worldState.narrative).toContain('A sprawling metropolis');
  });

  it('returns a coach suggestion payload', async () => {
    mockedGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify({
        choice: 'Take the bus',
        impact: '1.2 kg CO2',
        equivalent: ['Equivalent to 5 miles of driving'],
        alternative: 'Use public transit',
        suggestion: 'Choose the bus today for a lower-impact trip.',
        impactReductionPercentage: 35,
      }),
    });

    const response = await coachPOST(
      new Request('http://localhost/api/coach/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: 'I am driving alone to class.',
          history: [{ role: 'coach', text: 'Hello!' }],
          eli10Mode: false,
        }),
      })
    );

    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.response.choice).toBe('Take the bus');
  });

  it('returns a future message', async () => {
    mockedGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify({
        message: 'Thank you for choosing cleaner travel.',
        urgency: 'low',
      }),
    });

    const response = await futureMessagePOST(
      new Request('http://localhost/api/future-message', {
        method: 'POST',
        body: JSON.stringify({
          profile: { location: 'Seattle, WA' },
          stats: { healthScore: 75, currentStreak: 3 },
        }),
      })
    );

    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.message).toContain('Thank you for choosing cleaner travel.');
  });

  it('returns daily quests', async () => {
    mockedGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify({
        quests: [
          {
            title: 'Ride share less',
            description: 'Try a lower-carbon commute today.',
            xpReward: 75,
          },
          {
            title: 'Plant-based lunch',
            description: 'Swap one meal for a plant-based option.',
            xpReward: 100,
          },
          {
            title: 'Unplug idle devices',
            description: 'Cut standby power use at home.',
            xpReward: 50,
          },
        ],
      }),
    });

    const response = await questsPOST(
      new Request('http://localhost/api/quests/generate', {
        method: 'POST',
        body: JSON.stringify({
          profile: {
            location: 'Seattle, WA',
            lifestyleBaseline: {
              diet: 'Vegan',
              commute: 'Public Transit',
              energy: '100% Renewable',
            },
          },
          stats: {
            healthScore: 70,
            currentStreak: 2,
          },
        }),
      })
    );

    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.quests).toHaveLength(3);
  });
});
