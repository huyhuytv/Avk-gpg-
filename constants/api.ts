import { HarmCategory, HarmBlockThreshold } from "@google/genai";
import { ApiConfig, SafetySetting, AvatarGenerationEngine } from '../types';

export const API_SETTINGS_STORAGE_KEY = 'daoDoAiApiSettings_v4'; // Incremented version

export const AVAILABLE_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Khuyến Nghị)' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (Chất lượng Cao Nhất)' },
  { id: 'gemini-2.5-flash-preview-05-20', name: 'Gemini 2.5 Flash Preview (Thử nghiệm)' },
  { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite (Siêu Nhanh)' },
];
export const DEFAULT_MODEL_ID = AVAILABLE_MODELS[0].id;

// New: Constants for Avatar Generation Engine selection
export const AVAILABLE_AVATAR_ENGINES: { id: AvatarGenerationEngine; name: string }[] = [
    { id: 'imagen-3.0', name: 'Imagen 3.0 (Chất lượng cao)' },
];
export const DEFAULT_AVATAR_GENERATION_ENGINE: AvatarGenerationEngine = 'imagen-3.0';

export const DEFAULT_API_KEY_SOURCE: 'system' | 'user' = 'system';
export const DEFAULT_AUTO_GENERATE_NPC_AVATARS = false;

export const GEMINI_MODEL_TEXT = DEFAULT_MODEL_ID;

export const HARM_CATEGORIES = [
  { id: HarmCategory.HARM_CATEGORY_HARASSMENT, label: "Quấy Rối" },
  { id: HarmCategory.HARM_CATEGORY_HATE_SPEECH, label: "Phát Ngôn Thù Ghét" },
  { id: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, label: "Nội Dung Khiêu Dâm" },
  { id: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, label: "Nội Dung Nguy Hiểm" },
];

export const HARM_BLOCK_THRESHOLDS = [
  { id: HarmBlockThreshold.BLOCK_NONE, label: "Không Chặn (Rủi Ro Cao Nhất)" },
  { id: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE, label: "Chặn Ngưỡng Thấp và Cao Hơn" },
  { id: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE, label: "Chặn Ngưỡng Trung Bình và Cao Hơn" },
  { id: HarmBlockThreshold.BLOCK_ONLY_HIGH, label: "Chặn Chỉ Ngưỡng Cao" },
];

export const DEFAULT_SAFETY_SETTINGS: SafetySetting[] = HARM_CATEGORIES.map(category => ({
  category: category.id,
  threshold: HarmBlockThreshold.BLOCK_NONE,
}));

export const DEFAULT_API_CONFIG: ApiConfig = {
  apiKeySource: DEFAULT_API_KEY_SOURCE,
  userApiKeys: [''],
  model: DEFAULT_MODEL_ID,
  economyModel: DEFAULT_MODEL_ID, // Default economy model to the main model
  safetySettings: DEFAULT_SAFETY_SETTINGS,
  autoGenerateNpcAvatars: DEFAULT_AUTO_GENERATE_NPC_AVATARS,
  avatarGenerationEngine: DEFAULT_AVATAR_GENERATION_ENGINE,
  ragTopK: 10,
};
