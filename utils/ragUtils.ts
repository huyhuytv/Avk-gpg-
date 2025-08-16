// src/utils/ragUtils.ts
import { KnowledgeBase, VectorStore, Item, NPC, YeuThu, Skill, GameLocation, Faction, WorldLoreEntry, Quest, Wife, Slave, Prisoner, PlayerStats, VectorMetadata, Master } from '../types';
import { generateEmbeddings } from '../services/embeddingService';
import * as GameTemplates from '../templates';

// --- Text Chunking and Formatting ---

/**
 * Creates a descriptive string for an Item for embedding.
 * @param item The item object.
 * @returns A formatted string.
 */
export const formatItemForEmbedding = (item: Item): string => {
    let details = `Vật phẩm: ${item.name} (ID: ${item.id}). Loại: ${item.category}. Độ hiếm: ${item.rarity}. Mô tả: ${item.description}.`;
    if (item.category === GameTemplates.ItemCategory.EQUIPMENT) {
        const equip = item as GameTemplates.EquipmentTemplate;
        const bonuses = Object.entries(equip.statBonuses).filter(([_, val]) => val !== 0 && val !== undefined).map(([key, val]) => `${key}: ${val}`).join(', ');
        if (bonuses) details += ` Chỉ số cộng thêm: ${bonuses}.`;
        if (equip.uniqueEffects.length > 0) details += ` Hiệu ứng đặc biệt: ${equip.uniqueEffects.join('; ')}.`;
        details += ` Loại trang bị: ${equip.equipmentType}. Vị trí: ${equip.slot || 'Không rõ'}.`;
    } else if (item.category === GameTemplates.ItemCategory.POTION) {
        const potion = item as GameTemplates.PotionTemplate;
        if (potion.effects.length > 0) details += ` Hiệu ứng: ${potion.effects.join('; ')}.`;
        if (potion.durationTurns) details += ` Thời gian: ${potion.durationTurns} lượt.`;
    }
    return details;
};

/**
 * Creates a descriptive string for an NPC/Person for embedding.
 * @param person The person object (NPC, Wife, Slave, Prisoner).
 * @returns A formatted string.
 */
export const formatPersonForEmbedding = (person: NPC | Wife | Slave | Prisoner | Master): string => {
    const entityType = 'entityType' in person ? (person as Wife | Slave | Prisoner).entityType : ('mood' in person ? 'master' : 'npc');
    let details = `Nhân vật (${entityType}): ${person.name} (ID: ${person.id}).`;
    details += ` Chức danh: ${person.title || 'Không'}.`;
    details += ` Giới tính: ${person.gender || 'Không rõ'}.`;
    details += ` Chủng tộc: ${person.race || 'Không rõ'}.`;
    details += ` Cảnh giới: ${person.realm || 'Không rõ'}.`;
    if ('relationshipToPlayer' in person) {
        details += ` Mối quan hệ với người chơi: ${(person as NPC).relationshipToPlayer || 'Chưa rõ'}.`;
    }
    details += ` Thiện cảm: ${person.affinity}.`;
    details += ` Linh căn: ${person.spiritualRoot || 'Không rõ'}.`;
    details += ` Thể chất: ${person.specialPhysique || 'Không rõ'}.`;
    details += ` Tư chất: ${person.tuChat || 'Không rõ'}.`;

    if (person.stats) {
        let statsParts: string[] = [];
        if (person.stats.maxSinhLuc) statsParts.push(`HP ${person.stats.sinhLuc}/${person.stats.maxSinhLuc}`);
        if (person.stats.maxLinhLuc) statsParts.push(`MP ${person.stats.linhLuc}/${person.stats.maxLinhLuc}`);
        if (person.stats.sucTanCong) statsParts.push(`ATK ${person.stats.sucTanCong}`);
        if (person.stats.maxThoNguyen) statsParts.push(`Thọ nguyên ${Math.floor(person.stats.thoNguyen || 0)}/${person.stats.maxThoNguyen}`);
        if (statsParts.length > 0) details += ` Chỉ số: ${statsParts.join(', ')}.`;
    }
    
    if (entityType === 'prisoner') {
        const prisoner = person as Prisoner;
        details += ` Trạng thái tù nhân: Ý chí ${prisoner.willpower}, Phản kháng ${prisoner.resistance}, Phục tùng ${prisoner.obedience}.`;
    } else if (entityType === 'wife' || entityType === 'slave') {
        const companion = person as Wife | Slave;
        details += ` Trạng thái bạn đồng hành: Ý chí ${companion.willpower}, Phục tùng ${companion.obedience}.`;
    } else if (entityType === 'master') {
        const master = person as Master;
        details += ` Trạng thái chủ nhân: Tâm trạng ${master.mood}, Mục tiêu ${master.currentGoal}, Sủng ái ${master.favor || 0}.`;
    }

    details += ` Mô tả: ${person.description}.`;
    
    return details;
};

/**
 * Creates a descriptive string for a YeuThu for embedding.
 * @param beast The YeuThu object.
 * @returns A formatted string.
 */
export const formatYeuThuForEmbedding = (beast: YeuThu): string => {
    let details = `Yêu thú: ${beast.name} (ID: ${beast.id}). Loài: ${beast.species}. Cảnh giới: ${beast.realm || 'Không rõ'}. Thái độ: ${beast.isHostile ? 'Thù địch' : 'Trung lập'}. Mô tả: ${beast.description}.`;
    if (beast.stats) {
        let statsParts: string[] = [];
        if (beast.stats.maxSinhLuc) statsParts.push(`HP ${beast.stats.sinhLuc}/${beast.stats.maxSinhLuc}`);
        if (beast.stats.maxLinhLuc) statsParts.push(`MP ${beast.stats.linhLuc}/${beast.stats.maxLinhLuc}`);
        if (beast.stats.sucTanCong) statsParts.push(`ATK ${beast.stats.sucTanCong}`);
        if (statsParts.length > 0) details += ` Chỉ số: ${statsParts.join(', ')}.`;
    }
    return details;
};

/**
 * Creates a descriptive string for a Skill for embedding.
 * @param skill The skill object.
 * @returns A formatted string.
 */
export const formatSkillForEmbedding = (skill: Skill): string => {
    let details = `Kỹ năng: ${skill.name} (ID: ${skill.id}). Loại: ${skill.skillType}. Độ thuần thục: ${skill.proficiencyTier || 'Sơ Nhập'}. Mô tả: ${skill.description}. Hiệu ứng: ${skill.detailedEffect}.`;
    if (skill.manaCost > 0 || skill.cooldown > 0 || skill.baseDamage > 0) {
        let statsParts: string[] = [];
        if (skill.manaCost > 0) statsParts.push(`Tiêu hao ${skill.manaCost} MP`);
        if (skill.cooldown > 0) statsParts.push(`Hồi ${skill.cooldown} lượt`);
        if (skill.baseDamage > 0) statsParts.push(`Sát thương cơ bản ${skill.baseDamage}`);
        if (skill.damageMultiplier > 0) statsParts.push(`Sát thương theo ${skill.damageMultiplier * 100}% ATK`);
        if (skill.healingAmount > 0) statsParts.push(`Hồi ${skill.healingAmount} HP`);
        if (statsParts.length > 0) details += ` Thuộc tính: ${statsParts.join('; ')}.`;
    }
    return details;
};

/**
 * Creates a descriptive string for a Location for embedding.
 * @param location The location object.
 * @returns A formatted string.
 */
export const formatLocationForEmbedding = (location: GameLocation): string => {
    let details = `Địa điểm: ${location.name} (ID: ${location.id}). Loại: ${location.locationType || 'Không rõ'}. Khu vực an toàn: ${location.isSafeZone ? 'Có' : 'Không'}. Mô tả: ${location.description}.`;
    return details;
};

/**
 * Creates a descriptive string for a Faction for embedding.
 * @param faction The faction object.
 * @returns A formatted string.
 */
export const formatFactionForEmbedding = (faction: Faction): string => {
    return `Phe phái: ${faction.name} (ID: ${faction.id}). phe: ${faction.alignment}. Uy tín với người chơi: ${faction.playerReputation}. Mô tả: ${faction.description}`;
};

/**
 * Creates a descriptive string for a Lore entry for embedding.
 * @param lore The lore object.
 * @returns A formatted string.
 */
export const formatLoreForEmbedding = (lore: WorldLoreEntry): string => {
    return `Tri thức thế giới: ${lore.title} (ID: ${lore.id}). Nội dung: ${lore.content}`;
};

/**
 * Creates a descriptive string for an active Quest for embedding.
 * @param quest The quest object.
 * @returns A formatted string.
 */
export const formatQuestForEmbedding = (quest: Quest): string => {
    const objectives = quest.objectives.filter(o => !o.completed).map(o => o.text).join('; ');
    return `Nhiệm vụ đang làm: ${quest.title} (ID: ${quest.id}). Mô tả: ${quest.description}. Mục tiêu còn lại: ${objectives}`;
};

/**
 * NEW: Explicitly extracts context for known entities mentioned in an action string.
 * This guarantees the AI gets context about the direct subjects of the player's action.
 * @param action The player's action string.
 * @param kb The full KnowledgeBase object.
 * @returns An array of context strings for matched entities.
 */
export const extractEntityContextsFromString = (action: string, kb: KnowledgeBase): string[] => {
    if (!kb.ragVectorStore || kb.ragVectorStore.metadata.length === 0) {
        return [];
    }

    const foundContexts = new Set<string>();
    const normalizedAction = action.toLowerCase();

    const allEntities = [
        ...kb.discoveredNPCs, ...kb.wives, ...kb.slaves, ...kb.prisoners,
        ...kb.discoveredYeuThu, ...kb.inventory, ...kb.playerSkills,
        ...kb.discoveredLocations, ...kb.discoveredFactions
    ];

    allEntities.sort((a, b) => (b.name || (b as any).title).length - (a.name || (a as any).title).length);

    for (const entity of allEntities) {
        const entityName = (entity as any).name || (entity as any).title;
        if (!entityName || typeof entityName !== 'string' || entityName.length < 3) {
            continue;
        }

        if (normalizedAction.includes(entityName.toLowerCase())) {
            const contextItem = kb.ragVectorStore.metadata.find(meta => meta.entityId === entity.id);
            if (contextItem) {
                foundContexts.add(contextItem.text);
            }
        }
    }

    return Array.from(foundContexts);
};


/**
 * Extracts all relevant textual information from the KnowledgeBase, formats it into clean strings,
 * generates embeddings for them, and returns a populated VectorStore.
 * @param kb The full KnowledgeBase object.
 * @returns A Promise that resolves to a VectorStore object.
 */
export const vectorizeKnowledgeBase = async (kb: KnowledgeBase): Promise<VectorStore> => {
    const metadataToEmbed: VectorMetadata[] = [];

    // 1. World & Player Info (These don't have IDs, so we can skip them for now or assign pseudo-IDs)
    // For simplicity, we will focus on entities with IDs first.
    // textsToEmbed.push(`Bối cảnh chung của thế giới: ${kb.worldConfig.theme}. Mô tả: ${kb.worldConfig.settingDescription}`);
    // textsToEmbed.push(`Mục tiêu chính của người chơi (${kb.worldConfig.playerName}): ${kb.worldConfig.playerGoal}`);
    // textsToEmbed.push(`Thông tin người chơi: Chủng tộc ${kb.worldConfig.playerRace}, Linh căn ${kb.playerStats.spiritualRoot}, Thể chất ${kb.playerStats.specialPhysique}`);

    // 2. Format all entities with IDs
    kb.discoveredNPCs.forEach(e => metadataToEmbed.push({ entityId: e.id, entityType: 'npc', text: formatPersonForEmbedding(e) }));
    kb.wives.forEach(e => metadataToEmbed.push({ entityId: e.id, entityType: 'wife', text: formatPersonForEmbedding(e) }));
    kb.slaves.forEach(e => metadataToEmbed.push({ entityId: e.id, entityType: 'slave', text: formatPersonForEmbedding(e) }));
    kb.prisoners.forEach(e => metadataToEmbed.push({ entityId: e.id, entityType: 'prisoner', text: formatPersonForEmbedding(e) }));
    if (kb.master) {
        metadataToEmbed.push({ entityId: kb.master.id, entityType: 'master', text: formatPersonForEmbedding(kb.master) });
    }
    kb.discoveredYeuThu.forEach(e => metadataToEmbed.push({ entityId: e.id, entityType: 'yeuThu', text: formatYeuThuForEmbedding(e) }));
    kb.inventory.forEach(e => metadataToEmbed.push({ entityId: e.id, entityType: 'item', text: formatItemForEmbedding(e) }));
    kb.playerSkills.forEach(e => metadataToEmbed.push({ entityId: e.id, entityType: 'skill', text: formatSkillForEmbedding(e) }));
    kb.discoveredLocations.forEach(e => metadataToEmbed.push({ entityId: e.id, entityType: 'location', text: formatLocationForEmbedding(e) }));
    kb.discoveredFactions.forEach(e => metadataToEmbed.push({ entityId: e.id, entityType: 'faction', text: formatFactionForEmbedding(e) }));
    kb.worldLore.forEach(e => metadataToEmbed.push({ entityId: e.id, entityType: 'lore', text: formatLoreForEmbedding(e) }));
    kb.allQuests.filter(q => q.status === 'active').forEach(e => metadataToEmbed.push({ entityId: e.id, entityType: 'quest', text: formatQuestForEmbedding(e) }));

    // 3. Generate embeddings
    if (metadataToEmbed.length === 0) {
        return { vectors: [], metadata: [] };
    }
    
    const textChunks = metadataToEmbed.map(meta => meta.text);
    const vectors = await generateEmbeddings(textChunks);
    
    // 4. Return the populated VectorStore
    return {
        vectors: vectors,
        metadata: metadataToEmbed
    };
};