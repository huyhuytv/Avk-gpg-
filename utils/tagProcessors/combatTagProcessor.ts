



import { KnowledgeBase, GameMessage, NPC, YeuThu } from '../../types';
import { diceCoefficient, normalizeStringForComparison } from '../questUtils';

const SIMILARITY_THRESHOLD = 0.8; // Match if 80% similar

export const processSetCombatStatus = (
    currentKb: KnowledgeBase,
    tagParams: Record<string, string>
): { updatedKb: KnowledgeBase; systemMessages: GameMessage[] } => {
    const newKb = JSON.parse(JSON.stringify(currentKb)) as KnowledgeBase;
    const status = tagParams.status?.toLowerCase();
    if (status === 'start' || tagParams.value?.toLowerCase() === 'true') { // Added check for legacy "value"
        newKb.playerStats.isInCombat = true;
    } else if (status === 'end' || tagParams.value?.toLowerCase() === 'false') {
        newKb.playerStats.isInCombat = false;
    }
    return { updatedKb: newKb, systemMessages: [] };
};

export const processBeginCombat = (
    currentKb: KnowledgeBase,
    tagParams: Record<string, string>
): { updatedKb: KnowledgeBase; systemMessages: GameMessage[] } => {
    const newKb = JSON.parse(JSON.stringify(currentKb)) as KnowledgeBase;
    const systemMessages: GameMessage[] = [];
    const opponentIdsStr = tagParams.opponentIds;

    if (!opponentIdsStr) {
        console.warn("BEGIN_COMBAT: Missing opponentIds parameter.", tagParams);
        return { updatedKb: newKb, systemMessages };
    }

    const opponentNamesOrIds = opponentIdsStr.split(',').map(id => id.trim()).filter(id => id);
    const resolvedOpponentIds: string[] = [];
    const allCombatants: (NPC | YeuThu)[] = [...newKb.discoveredNPCs, ...newKb.discoveredYeuThu];

    opponentNamesOrIds.forEach(nameOrId => {
        // 1. Exact ID match across both lists
        let opponent: (NPC | YeuThu) | undefined = allCombatants.find(c => c.id === nameOrId);
        
        // 2. Exact name match if no ID match
        if (!opponent) {
            opponent = allCombatants.find(c => c.name.toLowerCase() === nameOrId.toLowerCase());
        }

        // 3. Fuzzy name match if still no match
        if (!opponent) {
            let bestMatch: { entity: NPC | YeuThu | null; score: number } = { entity: null, score: 0 };
            const normalizedNameOrId = normalizeStringForComparison(nameOrId);

            allCombatants.forEach(potentialOpponent => {
                const normalizedEntityName = normalizeStringForComparison(potentialOpponent.name);
                const score = diceCoefficient(normalizedNameOrId, normalizedEntityName);
                if (score > bestMatch.score) {
                    bestMatch = { entity: potentialOpponent, score: score };
                }
            });

            if (bestMatch.entity && bestMatch.score >= SIMILARITY_THRESHOLD) {
                console.log(`[BEGIN_COMBAT_FUZZY] Matched "${nameOrId}" to "${bestMatch.entity.name}" with score ${bestMatch.score.toFixed(2)}`);
                opponent = bestMatch.entity;
            }
        }
        
        if (opponent) {
            resolvedOpponentIds.push(opponent.id);
        } else {
            console.warn(`BEGIN_COMBAT: Could not find NPC or YeuThu with ID or name "${nameOrId}". No fuzzy match found above threshold.`);
        }
    });
    
    const surrenderedNpcIds = tagParams.surrenderedNpcIds?.split(',').map(id => id.trim()).filter(id => id) || [];


    if (resolvedOpponentIds.length > 0) {
        newKb.pendingCombat = {
            opponentIds: resolvedOpponentIds,
            surrenderedNpcIds: surrenderedNpcIds,
        };
    } else {
        console.warn("BEGIN_COMBAT: No valid opponents found after resolving IDs.");
    }
    
    return { updatedKb: newKb, systemMessages };
};
