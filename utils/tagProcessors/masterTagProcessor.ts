

import { KnowledgeBase, GameMessage, Master, VectorMetadata } from '../../types';
import { formatPersonForEmbedding } from '../ragUtils';

export const processMasterUpdate = (
    currentKb: KnowledgeBase,
    tagParams: Record<string, string>,
    turnForSystemMessages: number
): { updatedKb: KnowledgeBase; systemMessages: GameMessage[]; updatedVectorMetadata?: VectorMetadata; } => {
    const newKb = JSON.parse(JSON.stringify(currentKb)) as KnowledgeBase;
    const systemMessages: GameMessage[] = [];
    let updatedVectorMetadata: VectorMetadata | undefined = undefined;

    if (!newKb.master) {
        console.warn("MASTER_UPDATE: Cannot update master, no master object exists.");
        return { updatedKb: newKb, systemMessages };
    }

    const masterToUpdate = newKb.master;

    Object.entries(tagParams).forEach(([key, value]) => {
        const paramValue = value.trim();

        if (key === 'mood') {
            const validMoods: Master['mood'][] = ['Vui Vẻ', 'Hài Lòng', 'Bình Thường', 'Bực Bội', 'Giận Dữ', 'Nghi Ngờ'];
            if (validMoods.includes(paramValue as any)) {
                masterToUpdate.mood = paramValue as Master['mood'];
            } else {
                console.warn(`MASTER_UPDATE: Invalid mood value "${paramValue}".`);
            }
        } else if (key === 'currentGoal') {
            masterToUpdate.currentGoal = paramValue;
        } else if (key === 'favor') {
            if (paramValue.startsWith('+=')) {
                const change = parseInt(paramValue.substring(2), 10);
                if (!isNaN(change)) {
                    masterToUpdate.favor = Math.max(0, Math.min(100, (masterToUpdate.favor || 0) + change));
                }
            } else if (paramValue.startsWith('-=')) {
                const change = parseInt(paramValue.substring(2), 10);
                if (!isNaN(change)) {
                    masterToUpdate.favor = Math.max(0, Math.min(100, (masterToUpdate.favor || 0) - change));
                }
            } else {
                 const val = parseInt(paramValue, 10);
                 if(!isNaN(val)) masterToUpdate.favor = Math.max(0, Math.min(100, val));
            }
        } else if (key === 'affinity') {
            if (paramValue.startsWith('+=')) {
                const change = parseInt(paramValue.substring(2), 10);
                if (!isNaN(change)) {
                    masterToUpdate.affinity = Math.max(-100, Math.min(100, (masterToUpdate.affinity || 0) + change));
                }
            } else if (paramValue.startsWith('-=')) {
                const change = parseInt(paramValue.substring(2), 10);
                if (!isNaN(change)) {
                    masterToUpdate.affinity = Math.max(-100, Math.min(100, (masterToUpdate.affinity || 0) - change));
                }
            } else {
                 const val = parseInt(paramValue, 10);
                 if(!isNaN(val)) masterToUpdate.affinity = Math.max(-100, Math.min(100, val));
            }
        } else if (key.startsWith('needs.')) {
            const needType = key.split('.')[1] as keyof Master['needs'];
            if (!masterToUpdate.needs) masterToUpdate.needs = {};

            if (paramValue.startsWith('+=')) {
                const change = parseInt(paramValue.substring(2), 10);
                if (!isNaN(change)) {
                    const currentNeed = masterToUpdate.needs[needType] || 0;
                    masterToUpdate.needs[needType] = Math.max(0, Math.min(100, currentNeed + change));
                }
            } else if (paramValue.startsWith('-=')) {
                const change = parseInt(paramValue.substring(2), 10);
                if (!isNaN(change)) {
                    const currentNeed = masterToUpdate.needs[needType] || 0;
                    masterToUpdate.needs[needType] = Math.max(0, Math.min(100, currentNeed - change));
                }
            } else {
                const val = parseInt(paramValue, 10);
                if(!isNaN(val)) masterToUpdate.needs[needType] = Math.max(0, Math.min(100, val));
            }
        }
    });

    updatedVectorMetadata = {
        entityId: masterToUpdate.id,
        entityType: 'master',
        text: formatPersonForEmbedding(masterToUpdate)
    };
    
    return { updatedKb: newKb, systemMessages, updatedVectorMetadata };
};