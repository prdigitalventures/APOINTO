/**
 * Pluggable onboarding LLM. Production should set GEMINI_API_KEY (Google AI Studio).
 * Aliases: GOOGLE_AI_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY.
 * Optional fallback: OPENAI_API_KEY (gpt-4o-mini), ANTHROPIC_API_KEY.
 * If none are set, the deterministic parser in ai-onboarding.ts still advances the wizard.
 */
import type { OnboardingState, ServiceDraft } from './ai-onboarding';
import { getOnboardingCategoryIds } from './booking-schema';

export interface LlmOnboardingExtract {
  frustration?: boolean;
  start?: boolean;
  confirm?: boolean;
  businessName?: string | null;
  category?: string | null;
  location?: string | null;
  description?: string | null;
  services?: ServiceDraft[] | null;
  skipLocation?: boolean;
  skipStaff?: boolean;
}

export function getOnboardingLlmProvider(): 'gemini' | 'openai' | 'anthropic' | null {
  if (process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return 'gemini';
  }
  if (process.env.OPENAI_API_KEY) return 'openai';
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  return null;
}

function geminiKey(): string | undefined {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_AI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    undefined
  );
}

export async function interpretOnboardingWithLlm(
  state: OnboardingState,
  userMessage: string
): Promise<LlmOnboardingExtract | null> {
  const provider = getOnboardingLlmProvider();
  if (!provider) return null;

  const prompt = buildPrompt(state, userMessage);
  try {
    const raw =
      provider === 'gemini'
        ? await callGemini(prompt)
        : provider === 'openai'
          ? await callOpenAi(prompt)
          : await callAnthropic(prompt);
    if (!raw) return null;
    return parseLlmJson(raw);
  } catch {
    return null;
  }
}

function buildPrompt(state: OnboardingState, userMessage: string): string {
  const missing = [
    !state.businessName ? 'businessName' : null,
    !state.category ? 'category' : null,
    !state.location && !state.locationSkipped ? 'location' : null,
    !state.services?.length ? 'services' : null,
  ].filter(Boolean);

  return `You extract fields for a booking-system onboarding chat. Return JSON only.
Known so far: ${JSON.stringify({
    businessName: state.businessName || null,
    category: state.category || null,
    location: state.location || null,
    services: state.services || [],
    step: state.step,
  })}
Still missing: ${missing.join(', ') || 'none (confirm/create)'}
User message: ${JSON.stringify(userMessage)}

Rules:
- Start utterances like "Bow", "hi", "create my booking system" are start=true and must NOT be a businessName.
- Short brand names (catify, Catify, Joe's Cuts) ARE business names when we are missing businessName.
- Profanity/frustration (fuck, shit, this is broken) => frustration=true, do not copy them into any field.
- category should be one of: ${getOnboardingCategoryIds()}. Map saloon/beauty salon to beauty, barber to barber, hairdresser to hairdresser, salon to salon, yoga to yoga (not fitness), pilates to pilates, dental to dental, physician to physician, doctors to doctors, HubSpots/coworking/hot-desk to hub (not HubSpot CRM), wine tour to wine_tour, meeting rooms to meeting_room, VIP/MLA/MP/Leader to vip/mla/mp/leader, small business to small_business. lawyer to legal.
- Do not invent fields the user did not mention.
- skipLocation/skipStaff if they clearly skip that step.

JSON shape:
{"frustration":false,"start":false,"confirm":false,"businessName":null,"category":null,"location":null,"description":null,"services":null,"skipLocation":false,"skipStaff":false}`;
}

function parseLlmJson(raw: string): LlmOnboardingExtract | null {
  const trimmed = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    const parsed = JSON.parse(trimmed.slice(start, end + 1)) as LlmOnboardingExtract;
    if (parsed.businessName === '') parsed.businessName = null;
    if (parsed.category === '') parsed.category = null;
    if (parsed.location === '') parsed.location = null;
    return parsed;
  } catch {
    return null;
  }
}

async function fetchWithTimeout(url: string, init: RequestInit, ms = 5000): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function callGemini(prompt: string): Promise<string> {
  const key = geminiKey();
  if (!key) return '';
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
  const res = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 512,
        responseMimeType: 'application/json',
      },
    }),
  });
  if (!res.ok) return '';
  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function callOpenAi(prompt: string): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return '';
  const res = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_ONBOARDING_MODEL || 'gpt-4o-mini',
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'Return only JSON for booking onboarding field extraction.' },
        { role: 'user', content: prompt },
      ],
    }),
  });
  if (!res.ok) return '';
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content || '';
}

async function callAnthropic(prompt: string): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return '';
  const res = await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_ONBOARDING_MODEL || 'claude-3-5-haiku-latest',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) return '';
  const data = (await res.json()) as { content?: Array<{ text?: string }> };
  return data.content?.[0]?.text || '';
}
