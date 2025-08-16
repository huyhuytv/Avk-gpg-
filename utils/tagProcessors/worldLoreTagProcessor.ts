
import { KnowledgeBase, GameMessage, WorldLoreEntry, VectorMetadata } from '../../types';
import { formatLoreForEmbedding } from '../ragUtils';

export const processWorldLoreAdd = (
    currentKb: KnowledgeBase,
    tagParams: Record<string, string>,
    turnForSystemMessages: number
): { updatedKb: KnowledgeBase; systemMessages: GameMessage[]; newVectorMetadata?: VectorMetadata; } => {
    const newKb = JSON.parse(JSON.stringify(currentKb)) as KnowledgeBase;
    const systemMessages: GameMessage[] = [];
    let newVectorMetadata: VectorMetadata | undefined = undefined;

    const rawTitle = tagParams.title;
    const title = rawTitle ? rawTitle.trim().replace(/^["']|["']$/g, '') : undefined;
    const content = tagParams.content;

    if (!title || !content) {
        console.warn("WORLD_LORE_ADD: Missing title or content.", tagParams);
        return { updatedKb: newKb, systemMessages };
    }

    if (!newKb.worldLore.find(l => l.title === title)) {
        const newLore: WorldLoreEntry = {
            id: `lore-${title.replace(/\s+/g, '-')}-${Date.now()}`,
            title: title,
            content: content,
        };
        newKb.worldLore.push(newLore);
        newVectorMetadata = { entityId: newLore.id, entityType: 'lore', text: formatLoreForEmbedding(newLore) };

        systemMessages.push({
            id: 'world-lore-added-' + newLore.id,
            type: 'system',
            content: `Tri thức thế giới mới được thêm: ${title}.`,
            timestamp: Date.now(),
            turnNumber: turnForSystemMessages
        });
    }

    return { updatedKb: newKb, systemMessages, newVectorMetadata };
};

export const processWorldLoreUpdate = (
    currentKb: KnowledgeBase,
    tagParams: Record<string, string>,
    turnForSystemMessages: number
): { updatedKb: KnowledgeBase; systemMessages: GameMessage[]; updatedVectorMetadata?: VectorMetadata; } => {
    const newKb = JSON.parse(JSON.stringify(currentKb)) as KnowledgeBase;
    const systemMessages: GameMessage[] = [];
    const title = tagParams.title;
    const newTitle = tagParams.newTitle;
    const content = tagParams.content;
    let updatedVectorMetadata: VectorMetadata | undefined = undefined;

    if (!title) {
        console.warn("WORLD_LORE_UPDATE: Missing title.", tagParams);
        return { updatedKb: newKb, systemMessages };
    }

    const loreIndex = newKb.worldLore.findIndex(l => l.title === title);
    if (loreIndex > -1) {
        const loreToUpdate = newKb.worldLore[loreIndex];
        if (newTitle) loreToUpdate.title = newTitle;
        if (content) loreToUpdate.content = content;
        
        systemMessages.push({
            id: 'world-lore-updated-' + loreToUpdate.id,
            type: 'system',
            content: `Tri thức thế giới "${title}" đã được cập nhật.`,
            timestamp: Date.now(),
            turnNumber: turnForSystemMessages
        });
        
        updatedVectorMetadata = {
            entityId: loreToUpdate.id,
            entityType: 'lore',
            text: formatLoreForEmbedding(loreToUpdate)
        };
    } else {
        console.warn(`WORLD_LORE_UPDATE: Lore with title "${title}" not found.`);
    }

    return { updatedKb: newKb, systemMessages, updatedVectorMetadata };
};
