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
 * Processes a resume file and converts it to JSON format using Gemini API
 */
export async function processResumeToJson(file: File): Promise<string> {
    const apiKey = await databaseService.getGeminiApiKey();
    if (!apiKey) {
        throw new Error('Missing Gemini API key. Configure it in Settings → AI Configuration.');
    }

    // Check file type
    if (!['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
        throw new Error('Only PDF and DOCX files are supported');
    }

    // Check file size (20MB limit)
    if (file.size > 20 * 1024 * 1024) {
        throw new Error('File size must be under 20MB');
    }

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = btoa(String.fromCharCode(...Array.from(new Uint8Array(arrayBuffer))));

    const model = 'gemini-2.5-flash'; // Use the latest model for document processing
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

    const prompt = `This is a resume. Convert this resume into JSON format. 

IMPORTANT INSTRUCTIONS:
- Do not add any unwanted text at the start or end
- The output must contain ONLY valid JSON response
- Extract key information like name, contact details, experience, education, skills, etc.
- Structure the JSON in a logical way that makes sense for a resume
- Do not include any explanatory text, just the JSON object
- Ensure the JSON is properly formatted and valid`;

    const body = {
        contents: [{
            parts: [
                {
                    inlineData: {
                        mimeType: file.type,
                        data: base64Data
                    }
                },
                {
                    text: prompt
                }
            ]
        }],
        generationConfig: {
            temperature: 0.1, // Low temperature for more consistent output
            topK: 1,
            topP: 0.8,
            maxOutputTokens: 2048
        }
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000); // 60 second timeout for document processing

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

        const text = extractFirstText(json);
        if (!text) {
            throw new Error('No response received from AI');
        }

        // Clean the response to extract just the JSON
        const cleanedText = text.trim();

        // Try to find JSON in the response (in case AI added extra text)
        const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return jsonMatch[0];
        }

        return cleanedText;
    } finally {
        clearTimeout(timeout);
    }
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


