
/**
 * Defines the base currency value for NPCs participating in an auction,
 * based on their realm tier. This file now uses a formula to generate
 * these values dynamically for better scalability.
 */

/**
 * Base currency for a non-cultivator (e.g., Mortal Realm).
 */
const BASE_CURRENCY_MORTAL = 500;

/**
 * Base currency for the first cultivation realm (e.g., Luyện Khí).
 */
const BASE_CURRENCY_FIRST_REALM = 5000;

/**
 * The initial multiplier for calculating the next tier's currency from the previous one.
 * A higher value creates a steeper economic curve.
 */
const REALM_CURRENCY_MULTIPLIER_BASE = 5.0;

/**
 * The rate at which the multiplier decreases for each subsequent tier.
 * This prevents hyperinflation at very high tiers. A value of 0.3 means
 * the multiplier decreases by 0.3 for each new tier.
 */
const REALM_CURRENCY_MULTIPLIER_DECAY = 0.3;

/**
 * The minimum multiplier to ensure wealth still grows meaningfully at high tiers.
 */
const REALM_CURRENCY_MULTIPLIER_MIN = 3.0;

/**
 * Generates an array of base currency values for auction NPCs based on their realm tier.
 * The index of the array corresponds to the index of the realm in the `realmProgressionList`.
 * @param {number} numberOfTiers - The total number of cultivation tiers to generate values for.
 * @returns {number[]} An array of currency values.
 */
const generateAuctionNpcCurrencyTiers = (numberOfTiers: number): number[] => {
    if (numberOfTiers <= 0) {
        return [];
    }
    
    const tiers: number[] = [BASE_CURRENCY_MORTAL]; // Tier 0

    if (numberOfTiers > 1) {
        tiers.push(BASE_CURRENCY_FIRST_REALM); // Tier 1
    }

    for (let i = 2; i < numberOfTiers; i++) {
        const previousTierValue = tiers[i - 1];
        // The multiplier decreases as the tier index 'i' increases
        const multiplier = Math.max(
            REALM_CURRENCY_MULTIPLIER_MIN, 
            REALM_CURRENCY_MULTIPLIER_BASE - (REALM_CURRENCY_MULTIPLIER_DECAY * (i - 2)) // Decay starts from tier 2
        );
        const nextTierValue = Math.floor(previousTierValue * multiplier);
        tiers.push(nextTierValue);
    }
    
    return tiers;
};


/**
 * An array of base currency values for NPCs participating in an auction,
 * generated dynamically to support a large number of realms.
 * The AI is instructed to randomize this value between 60% and 200%.
 */
export const AUCTION_NPC_CURRENCY_BY_REALM_TIER: number[] = generateAuctionNpcCurrencyTiers(30); // Generate for 30 tiers as a default
