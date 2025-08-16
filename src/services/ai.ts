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

CRITICAL REQUIREMENTS:
- Output ONLY valid JSON - no text before or after
- Do not include any explanatory text, introductions, or conclusions
- Do not add phrases like "Here is the JSON:" or "The resume in JSON format:"
- Start directly with { and end with }
- Ensure all property names are in double quotes
- Ensure all string values are in double quotes
- Use proper JSON syntax with no trailing commas
- Extract key information like name, contact details, experience, education, skills, etc.
- Structure the JSON in a logical way that makes sense for a resume

Example format:
{
  "personal_info": {
    "name": "John Doe",
    "email": "john@example.com"
  },
  "experience": [
    {
      "title": "Software Engineer",
      "company": "Tech Corp"
    }
  ]
}`;

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

        // Try multiple strategies to extract valid JSON
        let extractedJson = null;

        // Strategy 1: Look for JSON object at the start
        const startJsonMatch = cleanedText.match(/^\{[\s\S]*\}/);
        if (startJsonMatch) {
            try {
                JSON.parse(startJsonMatch[0]);
                extractedJson = startJsonMatch[0];
            } catch (e) {
                // Continue to next strategy
            }
        }

        // Strategy 2: Look for JSON object anywhere in the text
        if (!extractedJson) {
            const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    JSON.parse(jsonMatch[0]);
                    extractedJson = jsonMatch[0];
                } catch (e) {
                    // Continue to next strategy
                }
            }
        }

        // Strategy 3: Try to clean common AI artifacts and parse
        if (!extractedJson) {
            // Remove common AI prefixes/suffixes
            let cleaned = cleanedText;

            // Remove common prefixes
            cleaned = cleaned.replace(/^(Here is|Here's|This is|The resume|Resume|JSON|Here is the JSON|Here's the JSON|The JSON|Generated JSON|AI generated|I've generated|Generated):?\s*/i, '');

            // Remove common suffixes
            cleaned = cleaned.replace(/\s*(This JSON|The JSON|JSON format|Format|End|\.|$)/i, '');

            // Try to find JSON in cleaned text
            const cleanedJsonMatch = cleaned.match(/\{[\s\S]*\}/);
            if (cleanedJsonMatch) {
                try {
                    JSON.parse(cleanedJsonMatch[0]);
                    extractedJson = cleanedJsonMatch[0];
                } catch (e) {
                    // Continue to next strategy
                }
            }
        }

        // Strategy 4: Try to fix common JSON formatting issues
        if (!extractedJson) {
            // Try to fix common issues like missing quotes, extra commas, etc.
            let fixed = cleanedText;

            // Remove any text before the first {
            const firstBraceIndex = fixed.indexOf('{');
            if (firstBraceIndex > 0) {
                fixed = fixed.substring(firstBraceIndex);
            }

            // Remove any text after the last }
            const lastBraceIndex = fixed.lastIndexOf('}');
            if (lastBraceIndex > 0 && lastBraceIndex < fixed.length - 1) {
                fixed = fixed.substring(0, lastBraceIndex + 1);
            }

            try {
                JSON.parse(fixed);
                extractedJson = fixed;
            } catch (e) {
                // Last resort: try to return the cleaned text
                console.warn('Could not extract valid JSON, returning cleaned text:', e);
                extractedJson = cleanedText;
            }
        }

        if (extractedJson) {
            return extractedJson;
        }

        throw new Error('Could not extract valid JSON from AI response');
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


