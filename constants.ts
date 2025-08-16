// src/constants.ts
// This file now acts as a barrel, re-exporting constants from modular files.

// Import and re-export all constants from their specific modules
export * from './constants/api';
export * from './constants/character';
export * from './constants/equipment';
export * from './constants/game';
export * from './constants/knowledgeBase';
export * from './constants/media';
export * from './constants/nsfw';
export * from './constants/storage';
export * from './constants/ui';
export * from './constants/world';
export * from './constants/npc';

export * from './constants/economy';
export * from './constants/auction'; // NEW

// Re-export prompt templates
// Assuming 'prompts' directory is directly under 'src', so './prompts/index' from 'src/constants.ts'
export { PROMPT_FUNCTIONS } from './prompts/index';

// Import translations from their respective modules
import { VIETNAMESE_TRANSLATIONS as BaseTranslations } from './constants/translations';
import { NSFW_TRANSLATIONS } from './constants/nsfw';

// Re-export prompt templates
// Assuming 'prompts' directory is directly under 'src', so './prompts/index' from 'src/constants.ts'
export { PROMPT_FUNCTIONS as PROMPT_TEMPLATES } from './prompts/index';

// Merge all translations into a single VIETNAMESE object
export const VIETNAMESE = {
    ...BaseTranslations,
    ...NSFW_TRANSLATIONS,
};

// Note: Type-related constants like GENRE_VALUES_FOR_TYPE are managed in types.ts
// and AVAILABLE_GENRES (which uses GENRE_VALUES_FOR_TYPE) is exported from ./constants/world.ts
// to prevent circular dependencies.
// The EquipmentSlotConfig in types.ts directly imports from './constants/translations' for its labelKey type
// to also avoid circular dependencies.
export { PROFICIENCY_TIERS, TU_CHAT_TIERS } from './types';