
import { KnowledgeBase, GameMessage, Faction, VectorMetadata } from '../../types';
import { ALL_FACTION_ALIGNMENTS } from '../../constants';
import * as GameTemplates from '../../templates';
import { formatFactionForEmbedding } from '../ragUtils';

export const processFactionDiscovered = (
    currentKb: KnowledgeBase,
    tagParams: Record<string, string>,
    turnForSystemMessages: number
): { updatedKb: KnowledgeBase; systemMessages: GameMessage[]; newVectorMetadata?: VectorMetadata; } => {
    const newKb = JSON.parse(JSON.stringify(currentKb)) as KnowledgeBase;
    const systemMessages: GameMessage[] = [];
    let newVectorMetadata: VectorMetadata | undefined = undefined;

    const name = tagParams.name;
    const description = tagParams.description;
    const alignment = tagParams.alignment as GameTemplates.FactionAlignmentValues;
    const reputation = parseInt(tagParams.playerReputation || '0', 10);

    if (!name || !description || !alignment || !ALL_FACTION_ALIGNMENTS.includes(alignment)) {
        console.warn("FACTION_DISCOVERED: Missing or invalid parameters.", tagParams);
        return { updatedKb: newKb, systemMessages };
    }

    if (!newKb.discoveredFactions.find(f => f.name === name)) {
        const newFaction: Faction = {
            id: `faction-${name.replace(/\s+/g, '-')}-${Date.now()}`,
            name,
            description,
            alignment,
            playerReputation: isNaN(reputation) ? 0 : reputation,
        };
        newKb.discoveredFactions.push(newFaction);
        newVectorMetadata = { entityId: newFaction.id, entityType: 'faction', text: formatFactionForEmbedding(newFaction) };

        systemMessages.push({
            id: 'faction-discovered-' + newFaction.id,
            type: 'system',
            content: `Bạn đã khám phá ra phe phái mới: ${name}.`,
            timestamp: Date.now(),
            turnNumber: turnForSystemMessages
        });
    }

    return { updatedKb: newKb, systemMessages, newVectorMetadata };
};

export const processFactionUpdate = (
    currentKb: KnowledgeBase,
    tagParams: Record<string, string>,
    turnForSystemMessages: number
): { updatedKb: KnowledgeBase; systemMessages: GameMessage[]; updatedVectorMetadata?: VectorMetadata; } => {
    const newKb = JSON.parse(JSON.stringify(currentKb)) as KnowledgeBase;
    const systemMessages: GameMessage[] = [];
    const name = tagParams.name;
    const newName = tagParams.newName;
    const description = tagParams.description;
    const alignment = tagParams.alignment as GameTemplates.FactionAlignmentValues;
    const reputationStr = tagParams.playerReputation;
    let updatedVectorMetadata: VectorMetadata | undefined = undefined;

    if (!name) {
        console.warn("FACTION_UPDATE: Missing name.", tagParams);
        return { updatedKb: newKb, systemMessages };
    }

    const factionIndex = newKb.discoveredFactions.findIndex(f => f.name === name);
    if (factionIndex > -1) {
        const factionToUpdate = newKb.discoveredFactions[factionIndex];
        if (newName) factionToUpdate.name = newName;
        if (description) factionToUpdate.description = description;
        if (alignment && ALL_FACTION_ALIGNMENTS.includes(alignment)) {
            factionToUpdate.alignment = alignment;
        }
        if (reputationStr) {
            if (reputationStr.startsWith('=')) {
                const value = parseInt(reputationStr.substring(1), 10);
                if (!isNaN(value)) factionToUpdate.playerReputation = value;
            } else {
                let valueToParse = reputationStr;
                if (valueToParse.includes('=')) valueToParse = valueToParse.replace('=', '');
                const change = parseInt(valueToParse, 10);
                if (!isNaN(change)) factionToUpdate.playerReputation += change;
            }
        }

        systemMessages.push({
            id: 'faction-updated-' + factionToUpdate.id,
            type: 'system',
            content: `Thông tin về phe phái ${name} đã được cập nhật.`,
            timestamp: Date.now(),
            turnNumber: turnForSystemMessages
        });

        updatedVectorMetadata = {
            entityId: factionToUpdate.id,
            entityType: 'faction',
            text: formatFactionForEmbedding(factionToUpdate)
        };
    } else {
        console.warn(`FACTION_UPDATE: Faction "${name}" not found.`);
    }

    return { updatedKb: newKb, systemMessages, updatedVectorMetadata };
};

export const processFactionRemove = (
    currentKb: KnowledgeBase,
    tagParams: Record<string, string>,
    turnForSystemMessages: number
): { updatedKb: KnowledgeBase; systemMessages: GameMessage[] } => {
    const newKb = JSON.parse(JSON.stringify(currentKb)) as KnowledgeBase;
    const systemMessages: GameMessage[] = [];
    const name = tagParams.name;

    if (!name) {
        console.warn("FACTION_REMOVE: Missing name.", tagParams);
        return { updatedKb: newKb, systemMessages };
    }

    const initialLength = newKb.discoveredFactions.length;
    newKb.discoveredFactions = newKb.discoveredFactions.filter(f => f.name !== name);
    
    if (newKb.discoveredFactions.length < initialLength) {
        systemMessages.push({
            id: 'faction-removed-' + name.replace(/\s+/g, '-'),
            type: 'system',
            content: `Phe phái ${name} đã bị xóa/tan rã.`,
            timestamp: Date.now(),
            turnNumber: turnForSystemMessages
        });
    } else {
        console.warn(`FACTION_REMOVE: Faction "${name}" not found.`);
    }

    return { updatedKb: newKb, systemMessages };
};
