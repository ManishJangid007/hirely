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
- Keep the response concise but complete - prioritize completing the JSON structure over verbose details
- If you reach the token limit, ensure the JSON is properly closed with all necessary closing braces
- Focus on completing the structure rather than including every detail
- IMPORTANT: Always close all open braces and brackets - incomplete JSON is not acceptable
- If you must truncate due to length, ensure the JSON structure is complete up to that point

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

    // Try with different token limits to handle varying resume complexity
    const tokenConfigs = [
        { maxOutputTokens: 4096, temperature: 0.1 }, // First try with higher limit
        { maxOutputTokens: 8192, temperature: 0.1 }, // Second try with much higher limit
        { maxOutputTokens: 4096, temperature: 0.2 }  // Final try with slightly higher temperature
    ];

    let lastError: Error | null = null;

    for (const config of tokenConfigs) {
        try {
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
                    temperature: config.temperature,
                    topK: 1,
                    topP: 0.8,
                    maxOutputTokens: config.maxOutputTokens
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

                // Try to extract and validate JSON
                const extractedJson = await extractAndValidateJson(text);
                if (extractedJson) {
                    console.log(`Successfully extracted JSON with ${config.maxOutputTokens} tokens`);
                    return extractedJson;
                }

                console.warn(`Failed to extract valid JSON with ${config.maxOutputTokens} tokens. Response length: ${text.length}`);
                throw new Error('Failed to extract valid JSON from AI response');

            } finally {
                clearTimeout(timeout);
            }
        } catch (error) {
            lastError = error as Error;
            console.warn(`Attempt with ${config.maxOutputTokens} tokens failed:`, error);
            continue; // Try next configuration
        }
    }

    // If all attempts failed, throw the last error
    throw lastError || new Error('Failed to process resume after multiple attempts');
}

/**
 * Enhanced JSON extraction with better handling of incomplete responses
 */
async function extractAndValidateJson(text: string): Promise<string | null> {
    console.log(`Attempting to extract JSON from response of length: ${text.length}`);

    // Clean the response to extract just the JSON
    let cleanedText = text.trim();

    // Strategy 1: Look for complete JSON object
    try {
        // Remove common AI prefixes/suffixes
        cleanedText = cleanedText.replace(/^(Here is|Here's|This is|The resume|Resume|JSON|Here is the JSON|Here's the JSON|The JSON|Generated JSON|AI generated|I've generated|Generated):?\s*/i, '');
        cleanedText = cleanedText.replace(/\s*(This JSON|The JSON|JSON format|Format|End|\.|$)/i, '');

        // Try to parse the cleaned text directly
        JSON.parse(cleanedText);
        console.log('Strategy 1 succeeded: Direct JSON parse');
        return cleanedText;
    } catch (e) {
        // Continue to other strategies
    }

    // Strategy 2: Handle markdown code blocks (common in AI responses)
    const codeBlockMatch = cleanedText.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
    if (codeBlockMatch) {
        try {
            const jsonContent = codeBlockMatch[1].trim();
            JSON.parse(jsonContent);
            console.log('Strategy 2 succeeded: Extracted from markdown code block');
            return jsonContent;
        } catch (e) {
            // Try to fix the code block content
            const fixedCodeBlock = await attemptToFixIncompleteJson(codeBlockMatch[1].trim());
            if (fixedCodeBlock) {
                try {
                    JSON.parse(fixedCodeBlock);
                    console.log('Strategy 2 succeeded: Fixed markdown code block JSON');
                    return fixedCodeBlock;
                } catch (e2) {
                    // Continue to next strategy
                }
            }
        }
    }

    // Strategy 3: Look for JSON object at the start
    const startJsonMatch = cleanedText.match(/^\{[\s\S]*\}/);
    if (startJsonMatch) {
        try {
            JSON.parse(startJsonMatch[0]);
            console.log('Strategy 3 succeeded: Start JSON match');
            return startJsonMatch[0];
        } catch (e) {
            // Continue to next strategy
        }
    }

    // Strategy 4: Look for JSON object anywhere in the text
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        try {
            JSON.parse(jsonMatch[0]);
            console.log('Strategy 4 succeeded: Any JSON match');
            return jsonMatch[0];
        } catch (e) {
            // Continue to next strategy
        }
    }

    // Strategy 5: Try to fix incomplete JSON by finding the last complete object
    if (jsonMatch) {
        const incompleteJson = jsonMatch[0];

        // Try to find the last complete object by looking for balanced braces
        let fixedJson = await attemptToFixIncompleteJson(incompleteJson);
        if (fixedJson) {
            try {
                JSON.parse(fixedJson);
                console.log('Strategy 5 succeeded: Fixed incomplete JSON');
                return fixedJson;
            } catch (e) {
                // Continue to next strategy
            }
        }
    }

    // Strategy 6: Try to reconstruct JSON from partial content
    try {
        const reconstructedJson = await reconstructJsonFromPartial(cleanedText);
        if (reconstructedJson) {
            console.log('Strategy 6 succeeded: Reconstructed JSON from partial content');
            return reconstructedJson;
        }
    } catch (e) {
        // Continue to next strategy
    }

    // Strategy 6.5: Try to extract content from AI response structure (handles cases where content is in parts)
    try {
        const extractedFromStructure = await extractFromAIResponseStructure(cleanedText);
        if (extractedFromStructure) {
            console.log('Strategy 6.5 succeeded: Extracted from AI response structure');
            return extractedFromStructure;
        }
    } catch (e) {
        // Continue to next strategy
    }

    // Strategy 7: Try to extract partial information and create a minimal valid JSON
    try {
        const minimalJson = await createMinimalValidJson(cleanedText);
        if (minimalJson) {
            console.log('Strategy 7 succeeded: Created minimal valid JSON');
            return minimalJson;
        }
    } catch (e) {
        // Continue to next strategy
    }

    return null;
}

/**
 * Attempts to reconstruct JSON from partial content by analyzing the structure
 */
async function reconstructJsonFromPartial(text: string): Promise<string | null> {
    try {
        // Look for the start of JSON structure
        const jsonStart = text.indexOf('{');
        if (jsonStart === -1) return null;

        // Extract everything from the first { to the end
        let partialJson = text.substring(jsonStart);

        // Try to find complete objects by looking for balanced braces
        let braceCount = 0;
        let lastCompletePosition = -1;
        let inString = false;
        let escapeNext = false;

        for (let i = 0; i < partialJson.length; i++) {
            const char = partialJson[i];

            if (escapeNext) {
                escapeNext = false;
                continue;
            }

            if (char === '\\') {
                escapeNext = true;
                continue;
            }

            if (char === '"' && !escapeNext) {
                inString = !inString;
                continue;
            }

            if (!inString) {
                if (char === '{') {
                    braceCount++;
                } else if (char === '}') {
                    braceCount--;
                    if (braceCount === 0) {
                        lastCompletePosition = i;
                        break;
                    }
                }
            }
        }

        if (lastCompletePosition > 0) {
            const completeJson = partialJson.substring(0, lastCompletePosition + 1);

            // Try to fix common issues
            const fixedJson = await fixCommonJsonIssues(completeJson);
            if (fixedJson) {
                try {
                    JSON.parse(fixedJson);
                    return fixedJson;
                } catch (e) {
                    // Try more aggressive fixing
                    return await aggressiveJsonFixing(completeJson);
                }
            }
        }

        // If we can't find complete JSON, try to close incomplete structures
        return await closeIncompleteJsonStructures(partialJson);

    } catch (e) {
        console.warn('Error in JSON reconstruction:', e);
        return null;
    }
}

/**
 * More aggressive JSON fixing for complex issues
 */
async function aggressiveJsonFixing(json: string): Promise<string | null> {
    let fixed = json;

    // Remove trailing commas more aggressively
    fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
    fixed = fixed.replace(/,(\s*})/g, '$1');

    // Fix missing quotes around property names (more patterns)
    fixed = fixed.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g, '$1"$2"$3');
    fixed = fixed.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g, '$1"$2"$3');

    // Fix missing quotes around string values (more patterns)
    fixed = fixed.replace(/:\s*([a-zA-Z][a-zA-Z0-9\s]*[a-zA-Z0-9])(\s*[,}])/g, ': "$1"$2');
    fixed = fixed.replace(/:\s*([a-zA-Z][a-zA-Z0-9\s]*[a-zA-Z0-9])(\s*[}\]])/g, ': "$1"$2');

    // Fix missing quotes around array values
    fixed = fixed.replace(/\[\s*([a-zA-Z][a-zA-Z0-9\s]*[a-zA-Z0-9])(\s*[,,\]])/g, '["$1"$2');

    // Remove any trailing incomplete structures
    fixed = fixed.replace(/,\s*[^,}]*\s*$/, '');

    try {
        JSON.parse(fixed);
        return fixed;
    } catch (e) {
        return null;
    }
}

/**
 * Attempts to close incomplete JSON structures
 */
async function closeIncompleteJsonStructures(json: string): Promise<string | null> {
    let fixed = json;

    // Count open braces and brackets
    let braceCount = (fixed.match(/\{/g) || []).length;
    let bracketCount = (fixed.match(/\[/g) || []).length;
    let closeBraceCount = (fixed.match(/\}/g) || []).length;
    let closeBracketCount = (fixed.match(/\]/g) || []).length;

    // Add missing closing braces/brackets
    while (closeBraceCount < braceCount) {
        fixed += '}';
        closeBraceCount++;
    }

    while (closeBracketCount < bracketCount) {
        fixed += ']';
        closeBracketCount++;
    }

    // Remove trailing commas before closing braces/brackets
    fixed = fixed.replace(/,(\s*[}\]])/g, '$1');

    try {
        JSON.parse(fixed);
        return fixed;
    } catch (e) {
        return null;
    }
}

/**
 * Attempts to extract content from AI response structure when content is in parts
 */
async function extractFromAIResponseStructure(text: string): Promise<string | null> {
    try {
        // Look for patterns that suggest the content is embedded in the AI response structure
        // This handles cases where the AI response contains the content but not as direct JSON

        // Pattern 1: Look for content embedded in "text" fields
        const textFieldMatches = text.match(/"text"\s*:\s*"([^"]*)"([^}]*)/g);
        if (textFieldMatches) {
            for (const match of textFieldMatches) {
                // Extract the text content and try to find JSON within it
                const textContent = match.match(/"text"\s*:\s*"([^"]*)"/)?.[1];
                if (textContent && textContent.includes('{')) {
                    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        try {
                            JSON.parse(jsonMatch[0]);
                            return jsonMatch[0];
                        } catch (e) {
                            // Try to fix the JSON
                            const fixed = await attemptToFixIncompleteJson(jsonMatch[0]);
                            if (fixed) return fixed;
                        }
                    }
                }
            }
        }

        // Pattern 2: Look for content that was truncated but contains partial JSON
        const partialJsonMatch = text.match(/(\{[\s\S]*?)(?=\s*$|\s*"finishReason"|\s*"usageMetadata")/);
        if (partialJsonMatch) {
            const partialJson = partialJsonMatch[1];
            // Try to complete the JSON structure
            const completed = await closeIncompleteJsonStructures(partialJson);
            if (completed) return completed;
        }

        // Pattern 3: Look for content in the response that might be the actual resume data
        const contentMatches = text.match(/"content"\s*:\s*\{[^}]*"parts"\s*:\s*\[([^\]]*)\]/);
        if (contentMatches) {
            const partsContent = contentMatches[1];
            // Extract text from parts
            const textParts = partsContent.match(/"text"\s*:\s*"([^"]*)"/g);
            if (textParts) {
                for (const part of textParts) {
                    const textContent = part.match(/"text"\s*:\s*"([^"]*)"/)?.[1];
                    if (textContent && textContent.includes('{')) {
                        const jsonMatch = textContent.match(/\{[\s\S]*\}/);
                        if (jsonMatch) {
                            try {
                                JSON.parse(jsonMatch[0]);
                                return jsonMatch[0];
                            } catch (e) {
                                // Try to fix the JSON
                                const fixed = await attemptToFixIncompleteJson(jsonMatch[0]);
                                if (fixed) return fixed;
                            }
                        }
                    }
                }
            }
        }

    } catch (e) {
        console.warn('Error in AI response structure extraction:', e);
    }

    return null;
}

/**
 * Attempts to fix incomplete JSON by finding balanced braces
 */
async function attemptToFixIncompleteJson(incompleteJson: string): Promise<string | null> {
    let braceCount = 0;
    let lastValidPosition = -1;

    for (let i = 0; i < incompleteJson.length; i++) {
        if (incompleteJson[i] === '{') {
            braceCount++;
        } else if (incompleteJson[i] === '}') {
            braceCount--;
            if (braceCount === 0) {
                lastValidPosition = i;
            }
        }
    }

    if (lastValidPosition > 0) {
        const fixedJson = incompleteJson.substring(0, lastValidPosition + 1);
        try {
            JSON.parse(fixedJson);
            return fixedJson;
        } catch (e) {
            // Try to fix common syntax issues
            return await fixCommonJsonIssues(fixedJson);
        }
    }

    return null;
}

/**
 * Fixes common JSON syntax issues
 */
async function fixCommonJsonIssues(json: string): Promise<string | null> {
    let fixed = json;

    // Remove trailing commas
    fixed = fixed.replace(/,(\s*[}\]])/g, '$1');

    // Fix missing quotes around property names
    fixed = fixed.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g, '$1"$2"$3');

    // Fix missing quotes around string values
    fixed = fixed.replace(/:\s*([a-zA-Z][a-zA-Z0-9\s]*[a-zA-Z0-9])(\s*[,}])/g, ': "$1"$2');

    try {
        JSON.parse(fixed);
        return fixed;
    } catch (e) {
        return null;
    }
}

/**
 * Creates a minimal valid JSON from partial information
 */
async function createMinimalValidJson(text: string): Promise<string | null> {
    try {
        // Extract as much information as possible from the partial response
        const extractedData: any = {};

        // Extract personal info
        const nameMatch = text.match(/"name"\s*:\s*"([^"]+)"/);
        const emailMatch = text.match(/"email"\s*:\s*"([^"]+)"/);
        const phoneMatch = text.match(/"phone"\s*:\s*"([^"]+)"/);
        const titleMatch = text.match(/"title"\s*:\s*"([^"]+)"/);
        const linkedinMatch = text.match(/"linkedin"\s*:\s*"([^"]+)"/);

        if (nameMatch || emailMatch || phoneMatch || titleMatch || linkedinMatch) {
            extractedData.personal_info = {
                name: nameMatch ? nameMatch[1] : "Unknown",
                title: titleMatch ? titleMatch[1] : "",
                email: emailMatch ? emailMatch[1] : "",
                phone: phoneMatch ? phoneMatch[1] : "",
                linkedin: linkedinMatch ? linkedinMatch[1] : ""
            };
        }

        // Extract summary
        const summaryMatches = text.match(/"summary"\s*:\s*\[([^\]]*)\]/);
        if (summaryMatches) {
            try {
                // Try to extract individual summary points
                const summaryText = summaryMatches[1];
                const summaryPoints = summaryText.match(/"([^"]+)"/g);
                if (summaryPoints) {
                    extractedData.summary = summaryPoints.map(point => point.replace(/"/g, ''));
                }
            } catch (e) {
                // Ignore summary parsing errors
            }
        }

        // Extract experience
        const experienceMatches = text.match(/"experience"\s*:\s*\[([^\]]*)\]/);
        if (experienceMatches) {
            try {
                // Try to extract experience entries
                const experienceText = experienceMatches[1];
                const experienceEntries = experienceText.match(/\{[^}]*\}/g);
                if (experienceEntries) {
                    extractedData.experience = experienceEntries.map(entry => {
                        const exp: any = {};
                        const titleMatch = entry.match(/"title"\s*:\s*"([^"]+)"/);
                        const companyMatch = entry.match(/"company"\s*:\s*"([^"]+)"/);
                        const datesMatch = entry.match(/"dates"\s*:\s*"([^"]+)"/);

                        if (titleMatch) exp.title = titleMatch[1];
                        if (companyMatch) exp.company = companyMatch[1];
                        if (datesMatch) exp.dates = datesMatch[1];

                        return exp;
                    });
                }
            } catch (e) {
                // Ignore experience parsing errors
            }
        }

        // Extract skills
        const skillsMatches = text.match(/"skills"\s*:\s*\[([^\]]*)\]/);
        if (skillsMatches) {
            try {
                const skillsText = skillsMatches[1];
                const skills = skillsText.match(/"([^"]+)"/g);
                if (skills) {
                    extractedData.skills = skills.map(skill => skill.replace(/"/g, ''));
                }
            } catch (e) {
                // Ignore skills parsing errors
            }
        }

        // Extract education
        const educationMatches = text.match(/"education"\s*:\s*\[([^\]]*)\]/);
        if (educationMatches) {
            try {
                const educationText = educationMatches[1];
                const educationEntries = educationText.match(/\{[^}]*\}/g);
                if (educationEntries) {
                    extractedData.education = educationEntries.map(entry => {
                        const edu: any = {};
                        const degreeMatch = entry.match(/"degree"\s*:\s*"([^"]+)"/);
                        const schoolMatch = entry.match(/"school"\s*:\s*"([^"]+)"/);
                        const yearMatch = entry.match(/"year"\s*:\s*"([^"]+)"/);

                        if (degreeMatch) edu.degree = degreeMatch[1];
                        if (schoolMatch) edu.school = schoolMatch[1];
                        if (yearMatch) edu.year = yearMatch[1];

                        return edu;
                    });
                }
            } catch (e) {
                // Ignore education parsing errors
            }
        }

        // Add note about incomplete parsing
        extractedData.note = "Resume parsing was incomplete. Some information may be missing. Please review and edit manually.";

        // Only return if we extracted some meaningful data
        if (Object.keys(extractedData).length > 1) { // More than just the note
            return JSON.stringify(extractedData, null, 2);
        }

    } catch (e) {
        console.warn('Error in minimal JSON creation:', e);
    }

    return null;
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


