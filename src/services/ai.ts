import { databaseService } from './database';

export interface GenerateContentOptions {
    prompt?: string;
    contents?: Array<{ parts: Array<{ text: string }> }>;
    model?: string; // e.g., 'gemini-2.0-flash'
    safetySettings?: unknown;
    generationConfig?: unknown;
    timeoutMs?: number;
    overrideApiKey?: string;
}

export interface GeminiCandidatePart {
    text?: string;
}

export interface GeminiCandidateContent {
    parts?: GeminiCandidatePart[];
}

export interface GeminiCandidate {
    content?: GeminiCandidateContent;
}

export interface GeminiResponse {
    candidates?: GeminiCandidate[];
    promptFeedback?: unknown;
    error?: { message?: string };
}

/**
 * Extracts first text response from Gemini candidates array
 */
export function extractFirstText(response: GeminiResponse): string | undefined {
    const part = response.candidates?.[0]?.content?.parts?.find(p => typeof p.text === 'string' && p.text.length > 0);
    return part?.text;
}

/**
 * Calls Google Gemini generateContent endpoint using the saved API key.
 * Throws if API key is missing or request fails.
 */
export async function generateContent(options: GenerateContentOptions): Promise<GeminiResponse> {
    const apiKey = options.overrideApiKey ?? (await databaseService.getGeminiApiKey());
    if (!apiKey) {
        throw new Error('Missing Gemini API key. Configure it in Settings → AI Configuration.');
    }

    const model = options.model || 'gemini-2.0-flash';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

    const body = {
        contents: options.contents ?? (options.prompt
            ? [{ parts: [{ text: options.prompt }] }]
            : []),
        ...(options.safetySettings ? { safetySettings: options.safetySettings } : {}),
        ...(options.generationConfig ? { generationConfig: options.generationConfig } : {}),
    };

    if (!Array.isArray(body.contents) || body.contents.length === 0) {
        throw new Error('Either prompt or contents must be provided');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 30000);
    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-goog-api-key': apiKey,
            },
            body: JSON.stringify(body),
            signal: controller.signal,
        });

        const json = (await res.json()) as GeminiResponse;
        if (!res.ok) {
            const message = (json as any)?.error?.message || res.statusText || 'Gemini API error';
            throw new Error(message);
        }
        return json;
    } finally {
        clearTimeout(timeout);
    }
}


