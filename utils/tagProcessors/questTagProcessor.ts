import { VIETNAMESE } from '../../constants'; // VIETNAMESE might be needed for quest related strings in the future
import { KnowledgeBase, GameMessage, QuestObjective, Quest, VectorMetadata } from '../../types';
import { formatQuestForEmbedding } from '../ragUtils'; // NEW: Import formatter
import { diceCoefficient, normalizeStringForComparison, formatObjectiveForSystemMessage } from '../questUtils';

const SIMILARITY_THRESHOLD = 0.75; // 75% similarity required to match an objective/quest

// Helper function to find a quest by fuzzy title matching
const findQuestByTitle = (quests: Quest[], title: string): Quest | null => {
    if (!title) return null;
    let bestMatch = { quest: null as Quest | null, score: 0 };
    const normalizedTitle = normalizeStringForComparison(title);

    quests.forEach(q => {
        if (q.status === 'active') {
            const score = diceCoefficient(normalizedTitle, normalizeStringForComparison(q.title));
            if (score > bestMatch.score) {
                bestMatch = { quest: q, score };
            }
        }
    });

    if (bestMatch.quest && bestMatch.score >= SIMILARITY_THRESHOLD) {
        return bestMatch.quest;
    }
    
    if(bestMatch.quest) {
        console.warn(`QUEST_PROCESSOR: Quest matching "${title}" found, but similarity score ${bestMatch.score.toFixed(2)} is below threshold ${SIMILARITY_THRESHOLD}. Best match: "${bestMatch.quest.title}"`);
    } else {
        console.warn(`QUEST_PROCESSOR: Active quest matching "${title}" not found.`);
    }

    return null;
}


export const processQuestAssigned = (
    currentKb: KnowledgeBase,
    tagParams: Record<string, string>,
    turnForSystemMessages: number
): { updatedKb: KnowledgeBase; systemMessages: GameMessage[]; newVectorMetadata?: VectorMetadata; } => {
    const newKb = JSON.parse(JSON.stringify(currentKb)) as KnowledgeBase;
    const systemMessages: GameMessage[] = [];
    let newVectorMetadata: VectorMetadata | undefined = undefined;

    const questTitle = tagParams.title;
    const questDescription = tagParams.description;
    const objectivesStr = tagParams.objectives;

    if (questTitle && questDescription && objectivesStr) {
        if (!newKb.allQuests.find(q => q.title === questTitle)) {
            const newQuestObjectives: QuestObjective[] = objectivesStr.split('|').map((objText, index) => ({
                id: `obj-${questTitle.replace(/\s+/g, '-')}-${index}-${Date.now()}`,
                text: objText.trim(),
                completed: false,
            }));

            const newQuest: Quest = {
                id: `quest-${questTitle.replace(/\s+/g, '-')}-${Date.now()}`,
                title: questTitle,
                description: questDescription,
                status: 'active',
                objectives: newQuestObjectives,
            };
            
            newKb.allQuests.push(newQuest);
            newVectorMetadata = { entityId: newQuest.id, entityType: 'quest', text: formatQuestForEmbedding(newQuest) };

            systemMessages.push({
                id: 'quest-assigned-' + Date.now(), type: 'system',
                content: `Nhiệm vụ mới: ${questTitle}!`,
                timestamp: Date.now(), turnNumber: turnForSystemMessages
            });
        } else {
            console.warn(`QUEST_ASSIGNED: Quest with title "${questTitle}" already exists. Not adding duplicate.`);
        }
    } else {
        console.warn("QUEST_ASSIGNED: Missing title, description, or objectives.", tagParams);
    }
    return { updatedKb: newKb, systemMessages, newVectorMetadata };
};

export const processQuestUpdated = (
    currentKb: KnowledgeBase,
    tagParams: Record<string, string>,
    turnForSystemMessages: number
): { updatedKb: KnowledgeBase; systemMessages: GameMessage[] } => {
    const newKb = JSON.parse(JSON.stringify(currentKb)) as KnowledgeBase;
    const systemMessages: GameMessage[] = [];
    const questTitle = tagParams.title;
    const objectiveTextToUpdate = tagParams.objectiveText; 
    const newObjectiveText = tagParams.newObjectiveText; 
    const completed = tagParams.completed?.toLowerCase() === 'true';

    if (!questTitle || !objectiveTextToUpdate) {
        console.warn("QUEST_UPDATED: Missing title or objectiveText.", tagParams);
        return { updatedKb: newKb, systemMessages };
    }

    const quest = findQuestByTitle(newKb.allQuests, questTitle);
    
    if (quest) {
        let bestObjectiveMatch = { index: -1, score: 0 };
        const normalizedObjectiveTextToUpdate = normalizeStringForComparison(objectiveTextToUpdate);

        quest.objectives.forEach((obj, index) => {
            if (!obj.completed) { // Only match against uncompleted objectives
                const normalizedStoredText = normalizeStringForComparison(obj.text);
                const score = diceCoefficient(normalizedObjectiveTextToUpdate, normalizedStoredText);
                if (score > bestObjectiveMatch.score) {
                    bestObjectiveMatch = { index, score };
                }
            }
        });

        if (bestObjectiveMatch.index !== -1 && bestObjectiveMatch.score >= SIMILARITY_THRESHOLD) {
            const objectiveIndex = bestObjectiveMatch.index;
            const originalObjectiveTextForMessage = quest.objectives[objectiveIndex].text;

            quest.objectives[objectiveIndex].completed = completed;
            if (newObjectiveText) {
                quest.objectives[objectiveIndex].text = newObjectiveText;
            }
            
            const formattedObjective = formatObjectiveForSystemMessage(originalObjectiveTextForMessage, quest.title);
            systemMessages.push({
                id: 'quest-objective-updated-' + Date.now(), type: 'system',
                content: `Nhiệm vụ "${quest.title}": Mục tiêu "${formattedObjective}" đã được ${completed ? 'hoàn thành' : 'cập nhật'}.`,
                timestamp: Date.now(), turnNumber: turnForSystemMessages
            });

            const allObjectivesCompleted = quest.objectives.every(obj => obj.completed);
            if (allObjectivesCompleted) {
                quest.status = 'completed';
                systemMessages.push({
                    id: 'quest-all-objectives-completed-' + Date.now(), type: 'system',
                    content: `Nhiệm vụ "${quest.title}" đã hoàn thành tất cả mục tiêu!`,
                    timestamp: Date.now(), turnNumber: turnForSystemMessages
                });
            }
        } else {
            console.warn(`QUEST_UPDATED: Objective matching "${objectiveTextToUpdate}" not found or similarity too low in quest "${quest.title}". Best score: ${bestObjectiveMatch.score.toFixed(2)}.`);
        }
    }
    return { updatedKb: newKb, systemMessages };
};

export const processQuestCompleted = (
    currentKb: KnowledgeBase,
    tagParams: Record<string, string>,
    turnForSystemMessages: number
): { updatedKb: KnowledgeBase; systemMessages: GameMessage[] } => {
    const newKb = JSON.parse(JSON.stringify(currentKb)) as KnowledgeBase;
    const systemMessages: GameMessage[] = [];
    const questTitle = tagParams.title;

    if (!questTitle) {
        console.warn("QUEST_COMPLETED: Missing title.", tagParams);
        return { updatedKb: newKb, systemMessages };
    }
    const quest = findQuestByTitle(newKb.allQuests, questTitle);
    if (quest) {
        quest.status = 'completed';
        quest.objectives.forEach(obj => obj.completed = true); 
        systemMessages.push({
            id: 'quest-completed-' + Date.now(), type: 'system',
            content: `Nhiệm vụ "${quest.title}" đã hoàn thành!`,
            timestamp: Date.now(), turnNumber: turnForSystemMessages
        });
    }
    return { updatedKb: newKb, systemMessages };
};

export const processQuestFailed = (
    currentKb: KnowledgeBase,
    tagParams: Record<string, string>,
    turnForSystemMessages: number
): { updatedKb: KnowledgeBase; systemMessages: GameMessage[] } => {
    const newKb = JSON.parse(JSON.stringify(currentKb)) as KnowledgeBase;
    const systemMessages: GameMessage[] = [];
    const questTitle = tagParams.title;

    if (!questTitle) {
        console.warn("QUEST_FAILED: Missing title.", tagParams);
        return { updatedKb: newKb, systemMessages };
    }
    const quest = findQuestByTitle(newKb.allQuests, questTitle);
    if (quest) {
        quest.status = 'failed';
        systemMessages.push({
            id: 'quest-failed-' + Date.now(), type: 'system',
            content: `Nhiệm vụ "${quest.title}" đã thất bại!`,
            timestamp: Date.now(), turnNumber: turnForSystemMessages
        });
    }
    return { updatedKb: newKb, systemMessages };
};


export const processObjectiveUpdate = ( 
    currentKb: KnowledgeBase,
    tagParams: Record<string, string>,
    turnForSystemMessages: number
): { updatedKb: KnowledgeBase; systemMessages: GameMessage[] } => {
    console.warn("OBJECTIVE_UPDATE tag is being handled by processQuestUpdated. Consider consolidating tag usage if behavior is identical.");
    return processQuestUpdated(currentKb, tagParams, turnForSystemMessages);
};