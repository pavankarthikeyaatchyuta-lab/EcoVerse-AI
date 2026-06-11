# EcoVerse AI
> Shape your future. One choice at a time.

![License](https://img.shields.io/badge/license-MIT-green)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![Gemini](https://img.shields.io/badge/AI-Google_Gemini-blue)
![Cloud Run](https://img.shields.io/badge/deployed%20on-Google%20Cloud%20Run-4285F4)

EcoVerse AI is a climate companion built for the PromptWars Challenge 3. It turns everyday habits into readable consequences, a visual future city, and personalized guidance users can act on right away.

## What it does
- **Onboarding flow** collects location, diet, commute, and energy habits.
- **Future city simulation** generates a localized 50-year narrative for the user's city.
- **AI Carbon Coach** now streams its guidance in real time and converts daily actions into carbon consequences and lower-impact alternatives.
- **Daily quests** suggest small, achievable actions based on the user profile.
- **Accessibility tools** include ELI10 mode, high contrast mode, voice input, text-to-speech support, a skip link, reduced-motion support, and live announcements for AI responses.
- **Animated 3D background** adds a more immersive presentation without breaking reduced-motion preferences.
- **Firestore-backed caching and rate limiting** keep repeated AI requests fast and deployment-friendly on Cloud Run.

## Tech stack
- Next.js 16
- React 19
- TypeScript
- Zustand
- Gemini API via `@google/genai`
- Zod
- Firebase config and Firestore rules
- Security headers
- Firestore-backed rate limiting with in-memory fallback
- Firestore-backed AI response caching with in-memory fallback

## Gemini setup
The app uses `GEMINI_MODEL` when provided, and defaults to `gemini-2.5-flash`.

Required environment variables:

```bash
GEMINI_API_KEY=your_key_here
```

Optional:

```bash
GEMINI_MODEL=gemini-2.5-flash
```

Firebase variables are also included in the repo for local and future integration:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

## Local development

```bash
npm install
npm run build
npm run start
```

For a full local check:

```bash
npm ci
npm run build
npm run test
```

## Test coverage
- `src/app/api/__tests__/routes.test.ts` covers AI success, validation, rate limit, malformed JSON, and streaming paths.
- `src/components/__tests__/OnboardingFlow.test.tsx` smoke-tests the onboarding flow.
- `src/app/dashboard/__tests__/page.test.tsx` smoke-tests the dashboard render path.

## Deployment
The app is deployed on Google Cloud Run.

Live URL:

https://ecoverse-ai-655808244864.asia-south1.run.app

## Notes
- Docker uses a standalone Next.js output.
- The production image now runs on Node 22 Alpine.
- The deployment issue was fixed by syncing the lockfile and switching Gemini routes away from `gemini-2.5-pro`.
- `next.config.ts` now sets security headers for production.
- Gemini usage is centralized through a shared singleton client in `src/lib/gemini.ts`.
- Streaming coach replies and cached AI payloads are handled through shared helpers in `src/lib/ai-cache.ts`.
