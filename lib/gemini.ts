// ============================================
// CrunchAI — Gemini Client Setup
// Stub for Day 1, full implementation on Day 2
// ============================================

import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GEMINI_API_KEY) {
  console.warn(
    '⚠️  GEMINI_API_KEY not set. Agent features will not work until Day 2.'
  );
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const geminiModel = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
});

export { genAI };
