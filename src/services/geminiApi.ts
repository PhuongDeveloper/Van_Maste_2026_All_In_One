import { SYSTEM_PROMPT, CHAT_HISTORY_LIMIT } from '../constants';
import type { Message } from '../types';

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

function getApiKey(): string {
    return import.meta.env.VITE_GOOGLE_API_KEY || '';
}

/**
 * Send a chat message to Gemini 2.5 Flash and get a response.
 */
export async function sendChatMessage(
    messages: Message[],
    userText: string,
    previewImage: string | null
): Promise<{ text: string; generatedImageUrl: string | null }> {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error('API_KEY_MISSING');
    }

    const parts: any[] = [{ text: SYSTEM_PROMPT }];

    // Add recent chat history for context
    messages.slice(-CHAT_HISTORY_LIMIT).forEach((m) => {
        parts.push({ text: `${m.role}: ${m.content}` });
    });

    // Add image if present
    if (previewImage) {
        const base64Data = previewImage.includes(',') ? previewImage.split(',')[1] : previewImage;
        if (base64Data) {
            parts.push({ inlineData: { mimeType: 'image/png', data: base64Data } });
        }
    }

    parts.push({ text: userText });

    const res = await fetch(`${GEMINI_BASE_URL}/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: 'user', parts }] }),
    });

    const data = await res.json();
    const aiContent = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Master đang bận, thử lại sau nhé!';

    // Check if AI wants to generate an image
    let generatedImageUrl: string | null = null;
    if (aiContent.includes('[GEN_IMAGE]')) {
        const imagePrompt = aiContent.split('[GEN_IMAGE]')[1].split('\n')[0].trim();
        generatedImageUrl = await generateImage(imagePrompt);
    }

    const cleanedContent = aiContent.replace(/\[GEN_IMAGE\].*/s, '');

    return { text: cleanedContent, generatedImageUrl };
}

/**
 * Generate an image using Imagen 3.0.
 */
export async function generateImage(prompt: string): Promise<string | null> {
    const apiKey = getApiKey();
    if (!apiKey) {
        console.warn('No API Key - skipping image generation');
        return null;
    }

    try {
        const res = await fetch(`${GEMINI_BASE_URL}/imagen-3.0-generate-001:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        });

        const data = await res.json();
        if (data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data) {
            return `data:image/png;base64,${data.candidates[0].content.parts[0].inlineData.data}`;
        }
    } catch (error) {
        console.error('Image generation error:', error);
    }

    return null;
}

/**
 * Rewrite text using Gemini to improve writing style ("Nâng cấp văn phong").
 */
export async function rewriteText(text: string): Promise<string | null> {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error('API_KEY_MISSING');
    }

    const res = await fetch(`${GEMINI_BASE_URL}/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: `Viết lại câu sau cho hay hơn: "${text}"` }] }],
        }),
    });

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
}

/**
 * Generate a diagnostic quiz for knowledge assessment.
 */
export async function generateDiagnosticQuiz(prompt: string): Promise<string> {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error('API_KEY_MISSING');
    }

    const res = await fetch(`${GEMINI_BASE_URL}/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
        }),
    });

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Lỗi tạo bài kiểm tra chẩn đoán';
}

/**
 * Check if API key is configured.
 */
export function isApiKeyConfigured(): boolean {
    return Boolean(getApiKey());
}
