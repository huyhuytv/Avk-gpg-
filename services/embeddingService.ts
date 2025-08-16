
// src/services/embeddingService.ts
import { GoogleGenAI, ContentEmbedding } from "@google/genai";
import { getApiSettings } from './geminiService'; // Reuse API settings logic
import { VIETNAMESE } from '../constants';
import { incrementApiCallCount } from '../utils/apiUsageTracker';

const EMBEDDING_MODEL_NAME = 'text-embedding-004';

let ai: GoogleGenAI | null = null;
let lastUsedApiKeyForEmbeddings: string | null = null;
let lastUsedApiKeySourceForEmbeddings: 'system' | 'user' | null = null;

// Function to get a shared GoogleGenAI instance, re-initializing if the API key changes.
// This is separate from the main geminiService instance to avoid conflicts.
const getAiInstanceForEmbeddings = (): GoogleGenAI => {
    const settings = getApiSettings();
    let effectiveApiKey: string;

    if (settings.apiKeySource === 'system') {
        const systemApiKey = process.env.API_KEY;
        if (typeof systemApiKey !== 'string' || systemApiKey.trim() === '') {
            throw new Error(VIETNAMESE.apiKeySystemUnavailable + " (API_KEY not found in environment for embeddings)");
        }
        effectiveApiKey = systemApiKey;
    } else {
        const validKeys = settings.userApiKeys.filter(k => k && k.trim() !== '');
        if (validKeys.length === 0) {
            throw new Error(VIETNAMESE.apiKeyMissing);
        }
        // Use the first valid key for simplicity, as embeddings are a background task.
        effectiveApiKey = validKeys[0];
    }

    if (!ai || lastUsedApiKeySourceForEmbeddings !== settings.apiKeySource || lastUsedApiKeyForEmbeddings !== effectiveApiKey) {
        try {
            ai = new GoogleGenAI({ apiKey: effectiveApiKey });
            lastUsedApiKeyForEmbeddings = effectiveApiKey;
            lastUsedApiKeySourceForEmbeddings = settings.apiKeySource;
        } catch (initError) {
            console.error("Failed to initialize GoogleGenAI client for embeddings:", initError);
            throw new Error(`Lỗi khởi tạo API Key cho dịch vụ embedding: ${initError instanceof Error ? initError.message : String(initError)}`);
        }
    }
    return ai;
};


/**
 * Generates embeddings for an array of text strings.
 * @param texts An array of strings to embed.
 * @returns A Promise that resolves to an array of number arrays (vectors).
 */
export const generateEmbeddings = async (texts: string[]): Promise<number[][]> => {
    if (!texts || texts.length === 0) {
        return [];
    }

    const client = getAiInstanceForEmbeddings();
    incrementApiCallCount('EMBEDDING_GENERATION'); // Increment for every embedding call

    try {
        const response = await client.models.embedContent({
            model: EMBEDDING_MODEL_NAME,
            contents: texts.map(text => ({ parts: [{ text }] }))
        });

        if (response.embeddings && response.embeddings.length > 0) {
            texts.forEach((text, index) => {
                if (response.embeddings[index]?.values) {
                    console.log(`Successfully vectorized text chunk for RAG: "${text.substring(0, 70)}..."`);
                }
            });
            return response.embeddings.map((emb: ContentEmbedding) => emb.values);
        } else {
            console.error("No embeddings found in API response.", response);
            throw new Error("Không tìm thấy dữ liệu vector trong phản hồi từ API embedding.");
        }

    } catch (error) {
        console.error("Lỗi khi tạo embeddings:", error);
        // Provide a more user-friendly error message
        const userMessage = error instanceof Error ? error.message : "Lỗi không xác định.";
        throw new Error(`Lỗi tạo vector: ${userMessage}`);
    }
};