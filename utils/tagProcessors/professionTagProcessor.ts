import { KnowledgeBase, GameMessage, ProfessionType } from '../../types';
import * as GameTemplates from '../../templates';

export const processProfessionLearned = (
    currentKb: KnowledgeBase,
    tagParams: Record<string, string>,
    turnForSystemMessages: number
): { updatedKb: KnowledgeBase; systemMessages: GameMessage[] } => {
    const newKb = JSON.parse(JSON.stringify(currentKb)) as KnowledgeBase;
    const systemMessages: GameMessage[] = [];
    const professionType = tagParams.type as ProfessionType;

    if (!professionType || !Object.values(GameTemplates.ProfessionType).includes(professionType)) {
        console.warn("PROFESSION_LEARNED: Invalid profession type.", tagParams);
        return { updatedKb: newKb, systemMessages };
    }

    if (!newKb.playerStats.professions) {
        newKb.playerStats.professions = [];
    }

    if (!newKb.playerStats.professions.find(p => p.type === professionType)) {
        newKb.playerStats.professions.push({
            type: professionType,
            level: 1,
            exp: 0,
            maxExp: 100, // Initial max exp for level 1
        });
        systemMessages.push({
            id: `profession-learned-${professionType.replace(/\s+/g, '-')}-${Date.now()}`,
            type: 'system',
            content: `Bạn đã học được nghề: ${professionType}!`,
            timestamp: Date.now(),
            turnNumber: turnForSystemMessages
        });
    }

    return { updatedKb: newKb, systemMessages };
};
