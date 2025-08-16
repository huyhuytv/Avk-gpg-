import { MALE_AVATAR_PLACEHOLDER_URL, FEMALE_AVATAR_BASE_URL, MAX_FEMALE_AVATAR_INDEX } from '../constants';

/**
 * A simple hashing function to convert a string (like a character ID) into a number.
 * This is used to deterministically pick an avatar.
 * @param str The input string (e.g., character ID).
 * @returns A non-negative integer hash.
 */
function simpleHash(str: string): number {
  let hash = 0;
  if (!str || str.length === 0) {
    return hash;
  }
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Gets a deterministic avatar source URL for a character.
 * If a valid avatarUrl is provided, it's used directly.
 * Otherwise, a "random" but consistent avatar is chosen based on the character's ID and gender.
 * This prevents re-fetching a new random avatar on every render.
 * @param person An object with an id, optional avatarUrl, and optional gender.
 * @returns The source URL for the avatar image.
 */
export const getDeterministicAvatarSrc = (person: { id: string, avatarUrl?: string, gender?: string }): string => {
    // 1. Prioritize a valid, existing avatar URL.
    if (person.avatarUrl && (person.avatarUrl.startsWith('http://') || person.avatarUrl.startsWith('https://') || person.avatarUrl.startsWith('data:image'))) {
      return person.avatarUrl;
    }
  
    // 2. Fallback to a deterministic "random" avatar based on ID.
    // Use a simple hash of the ID to pick a consistent index.
    const hash = simpleHash(person.id);
    
    if (person.gender === 'Nữ') {
      const randomIndex = (hash % MAX_FEMALE_AVATAR_INDEX) + 1;
      return `${FEMALE_AVATAR_BASE_URL}${randomIndex}.png`;
    }
    
    // 3. Default to a male placeholder for any other case.
    return MALE_AVATAR_PLACEHOLDER_URL;
};
