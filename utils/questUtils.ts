
import { VIETNAMESE } from '../constants'; // VIETNAMESE might be needed for quest related strings in the future

// Helper function to sanitize quest objective text for display
export const sanitizeQuestObjectiveTextForDisplay = (text: string | undefined): string | undefined => {
    if (text === undefined || text === null) return undefined;
    // Remove single quotes, backslashes, and asterisks for display purposes only
    return text.replace(/['\\*]/g, '');
};

// New helper function to format objective text specifically for system messages
export const formatObjectiveForSystemMessage = (objectiveText: string, questTitle: string): string => {
  let text = objectiveText.replace(/['\\*]/g, '').trim(); // Basic sanitization
  const lowerQuestTitle = questTitle.toLowerCase();
  const lowerText = text.toLowerCase();

  if (lowerText.startsWith(lowerQuestTitle)) {
    let remainingText = text.substring(questTitle.length).trim();
    // Remove common leading separators like ':', '-', '(', ' - ' more robustly
    remainingText = remainingText.replace(/^[\s:\-\(\)]+/, '').trim();
    
    if (remainingText.startsWith("(") && remainingText.endsWith(")")) {
        const coreObjective = remainingText.substring(1, remainingText.length - 1).trim();
        if (coreObjective.indexOf("(") === -1 && coreObjective.indexOf(")") === -1) {
            remainingText = coreObjective;
        }
    }
    return remainingText || objectiveText; 
  }
  return text; 
};

// --- NEW STRING SIMILARITY HELPERS ---

/**
 * Creates a set of bigrams from a given string.
 * @param str The input string.
 * @returns A Set of 2-character strings.
 */
function getBigrams(str: string): Set<string> {
  const bigrams = new Set<string>();
  if (!str || str.length < 2) {
    return bigrams;
  }
  for (let i = 0; i < str.length - 1; i++) {
    bigrams.add(str.substring(i, i + 2));
  }
  return bigrams;
}

/**
 * Calculates the Sørensen-Dice coefficient between two strings.
 * The coefficient is a value between 0 and 1, where 1 indicates identical strings.
 * @param str1 The first string.
 * @param str2 The second string.
 * @returns A similarity score between 0 and 1.
 */
export function diceCoefficient(str1: string, str2: string): number {
  if (!str1 || !str2) {
    return 0;
  }
  if (str1 === str2) {
    return 1;
  }

  const bigrams1 = getBigrams(str1);
  const bigrams2 = getBigrams(str2);
  
  if (bigrams1.size === 0 || bigrams2.size === 0) {
    return 0;
  }

  let intersectionSize = 0;
  for (const x of bigrams1) {
    if (bigrams2.has(x)) {
      intersectionSize++;
    }
  }

  return (2 * intersectionSize) / (bigrams1.size + bigrams2.size);
}

/**
 * Normalizes a string for comparison by converting to lowercase and removing common punctuation.
 * @param str The input string.
 * @returns The normalized string.
 */
export const normalizeStringForComparison = (str: string): string => {
    if (!str) return '';
    return str
        .toLowerCase()
        // Decompose accented letters into base letters and combining marks
        .normalize("NFD")
        // Remove combining diacritical marks
        .replace(/[\u0300-\u036f]/g, "")
        // Special case for the letter 'đ'
        .replace(/đ/g, "d")
        .replace(/['".,]/g, '') // Remove common punctuation that can vary
        .replace(/\s+/g, ' ') // Collapse multiple spaces
        .trim();
}
