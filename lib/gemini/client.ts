import { GoogleGenAI } from "@google/genai";

export const GEMINI_MODEL = "gemini-2.5-flash";

let clientInstance: GoogleGenAI | null = null;

/**
 * Returns a configured GoogleGenAI client instance.
 * Lazily instantiated so missing environment variables during build time don't fail compilation.
 */
export function getGeminiClient(): GoogleGenAI {
  if (clientInstance) {
    return clientInstance;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "dummy-key-for-now") {
    // If not configured with a valid key, client can still be created with a placeholder,
    // or callers can check isGeminiConfigured()
    clientInstance = new GoogleGenAI({ apiKey: apiKey || "dummy-key-for-now" });
    return clientInstance;
  }

  clientInstance = new GoogleGenAI({ apiKey });
  return clientInstance;
}

/**
 * Checks if a real, non-dummy Gemini API key is configured.
 */
export function isGeminiConfigured(): boolean {
  const apiKey = process.env.GEMINI_API_KEY;
  return Boolean(apiKey && apiKey !== "dummy-key-for-now" && apiKey.length > 5);
}

export const genAI = getGeminiClient();
