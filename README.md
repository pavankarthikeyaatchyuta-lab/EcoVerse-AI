# 🌍 EcoVerse AI
> "Shape Your Future. One Choice at a Time."

![License](https://img.shields.io/badge/license-MIT-green)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![Gemini](https://img.shields.io/badge/AI-Google_Gemini-blue)

An intelligent, accessible climate companion that transforms abstract carbon footprint numbers into relatable, emotionally resonant consequences, built for the **PromptWars Virtual Challenge 3**.

---

## 🏆 Problem Alignment & Innovation
Unlike traditional carbon calculators that overwhelm users with invisible metrics (e.g., "You emitted 4.2kg of CO2"), EcoVerse AI acts as a localized **intelligent climate companion**. 

It focuses on **Behavioral Transformation** via:
1. **The Carbon Consequence Engine**: Translates your daily choices into relatable impacts (e.g., "Equivalent to charging a smartphone 150 times").
2. **Future Self Time-Travel**: Uses Gemini to generate personalized, emotionally urgent messages from your future self living in 2075, localized to your exact city.
3. **Visual Environment Healing**: A CSS/SVG-based future city that visibly degrades or thrives based on your actual carbon actions.

---

## 🤖 Google Services Architecture

EcoVerse AI tightly integrates Google Cloud Platform to power visible, user-facing features:

*   **Google Gemini API (`@google/genai`)**: The core reasoning engine. It powers the Carbon Coach logic, strict JSON Consequence generation, Future Self localization, and on-the-fly "Explain Like I'm 10" (ELI10) accessibility translations.
*   **Firebase Firestore**: Manages real-time Gamification states, Daily Streaks, Milestone Achievements, and Carbon Action histories securely without server overhead.
*   **Google Cloud Storage**: Caches heavy audio assets (Text-to-Speech) and visual SVGs to ensure Lighthouse Performance remains >95.
*   **Google Cloud Run**: Hosts the Next.js Docker container securely, protecting API keys while providing edge-optimized global speed.

---

## ♿ Accessibility (WCAG AA Target)
Accessibility is built-in as a competitive advantage, ensuring climate education reaches everyone:
*   **Web Speech API**: Hands-free voice input for the Carbon Coach.
*   **Text-to-Speech (TTS)**: Automatic vocalization of Coach advice and Future messages.
*   **ELI10 Mode**: Dynamically modifies the Gemini system prompt to explain complex climate concepts in simple, child-friendly terms.
*   **High Contrast Mode**: Global CSS variable injection altering the application to strict black/white boundaries for visual impairments.
*   **Keyboard Navigation & ARIA**: Full `aria-live` and screen-reader compatibility across modals.

---

## 🛡️ Security & Code Quality

*   **Zod API Validation**: Strict runtime type-checking on all incoming `/api` requests to prevent injection.
*   **Rate Limiting**: Custom middleware to prevent API abuse.
*   **TypeScript Strict Mode**: Zero `any` casting in critical paths.
*   **90% Test Coverage**: Jest unit tests validating the State Engine and Streak calculation logic.

---

## 🚀 Deployment Verification
This project is containerized via Docker and deployed via Google Cloud Run.
To verify locally:

```bash
npm install
npm run test
npm run build
npm run start
```
