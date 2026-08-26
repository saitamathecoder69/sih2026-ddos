import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
const client = apiKey ? new GoogleGenerativeAI(apiKey) : null;

if (!apiKey) {
  console.warn('[gemini] GEMINI_API_KEY not set — ML confidence will fall back to rules-only scoring.');
}

export const isGeminiConfigured = client !== null;

export interface AnomalyFeatures {
  requestsInWindow: number;
  windowSeconds: number;
  rulesTriggered: string[];
  endpoint: string;
  userAgent: string;
}

/**
 * Ask Gemini for an anomaly confidence (0-100) given a compact feature
 * summary. This is a genuine model call on real request-shape data, not a
 * pre-trained classifier — closer in spirit to the pitch deck's "ML anomaly
 * model" than a hardcoded number, but it is not a trained model and should
 * not be presented as one. Returns null on any failure so the caller can
 * fall back to rule-based scoring alone; a demo must never go down because
 * a free-tier API call failed or rate-limited.
 */
export async function classifyAnomaly(features: AnomalyFeatures): Promise<number | null> {
  if (!client) return null;

  try {
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = [
      'You are a network traffic anomaly scorer for a DDoS-detection demo.',
      'Given these request-pattern features, respond with ONLY an integer 0-100:',
      '0 = clearly normal traffic, 100 = clearly a DDoS/bot attack.',
      '',
      `Requests from this source in the last ${features.windowSeconds}s: ${features.requestsInWindow}`,
      `Endpoint targeted: ${features.endpoint}`,
      `User-Agent: ${features.userAgent}`,
      `Rule-based flags already triggered: ${features.rulesTriggered.length ? features.rulesTriggered.join('; ') : 'none'}`,
      '',
      'Respond with only the number, nothing else.',
    ].join('\n');

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const parsed = Number.parseInt(text.match(/\d+/)?.[0] ?? '', 10);
    if (Number.isNaN(parsed)) return null;
    return Math.max(0, Math.min(100, parsed));
  } catch (err) {
    console.warn('[gemini] classification call failed, falling back to rules-only:', (err as Error).message);
    return null;
  }
}
