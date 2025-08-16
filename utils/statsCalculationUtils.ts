import { PlayerStats, RealmBaseStatDefinition, Item, EquipmentSlotId, StatusEffect, GameMessage, KnowledgeBase, Slave } from '../types';
import { 
    DEFAULT_PLAYER_STATS, 
    SUB_REALM_NAMES, 
    DEFAULT_TIERED_STATS, 
    VIETNAMESE, 
    DEFAULT_MORTAL_STATS,
    MORTAL_REALM_BASE_VALUE,
    FIRST_CULTIVATION_REALM_BASE_VALUE,
    REALM_MULTIPLIER_BASE,
    REALM_MULTIPLIER_DECAY,
    REALM_MULTIPLIER_MIN,
    STAT_POINT_VALUES,
    RARITY_MULTIPLIERS,
    CATEGORY_MULTIPLIERS,
    SPECIAL_EFFECT_KEYWORDS,
    UNKNOWN_EFFECT_MULTIPLIER,
    AUCTION_NPC_CURRENCY_BY_REALM_TIER,
    TU_CHAT_VALUE_MULTIPLIERS,
} from '../constants';
import * as GameTemplates from '../templates';
import { normalizeStringForComparison } from './questUtils';

// Calculates base stats (maxHP, maxMP, baseATK, maxEXP) based on realm.
export const calculateRealmBaseStats = (
    realmString: string,
    mainRealmList: string[],
    currentRealmBaseStatsMap: Record<string, RealmBaseStatDefinition>
): Pick<PlayerStats, 'baseMaxSinhLuc' | 'baseMaxLinhLuc' | 'baseSucTanCong' | 'baseMaxKinhNghiem'> => {
    
    if (typeof realmString !== 'string' || !realmString) {
        console.error(`[calculateRealmBaseStats] realmString is invalid: ${JSON.stringify(realmString)}. Using fallback.`); // Keep critical error
        realmString = DEFAULT_PLAYER_STATS.realm;
    }

    if (realmString === VIETNAMESE.mortalRealmName || realmString === DEFAULT_MORTAL_STATS.realm || realmString === VIETNAMESE.noCultivationSystem) {
        return {
            baseMaxKinhNghiem: DEFAULT_MORTAL_STATS.baseMaxKinhNghiem,
            baseMaxSinhLuc: DEFAULT_MORTAL_STATS.baseMaxSinhLuc,
            baseMaxLinhLuc: DEFAULT_MORTAL_STATS.baseMaxLinhLuc,
            baseSucTanCong: DEFAULT_MORTAL_STATS.baseSucTanCong,
        };
    }

    let mainRealmName = "";
    let subRealmName = "";
    
    // Sort main realms by length descending to match longer names first (e.g., "Hợp Thể" before "Hợp")
    const sortedMainRealmList = [...mainRealmList].sort((a,b) => b.length - a.length);

    for (const potentialMainRealm of sortedMainRealmList) {
        if (realmString.startsWith(potentialMainRealm)) {
            const remainingPart = realmString.substring(potentialMainRealm.length).trim();
            
            // Case 1: Direct match to a main realm (e.g., "Luyện Khí") -> assume peak
            if (remainingPart === '') {
                mainRealmName = potentialMainRealm;
                subRealmName = SUB_REALM_NAMES[SUB_REALM_NAMES.length - 1];
                break;
            }

            // Case 2: Find sub-realm within the remaining part (more robust)
            // Sort sub-realms by length to prioritize longer matches (e.g., "Đỉnh Phong" before "Phong") though unlikely to clash here.
            const sortedSubRealms = [...SUB_REALM_NAMES].sort((a, b) => b.length - a.length);
            for (const potentialSubRealm of sortedSubRealms) {
                if (remainingPart.includes(potentialSubRealm)) {
                    mainRealmName = potentialMainRealm;
                    subRealmName = potentialSubRealm;
                    break; 
                }
            }

            // If we found a sub-realm, we're done with the main loop
            if (subRealmName) {
                break;
            }
        }
    }
    
    const fallbackTierDefinition = DEFAULT_TIERED_STATS[0] || { hpBase: 10, hpInc: 1, mpBase: 10, mpInc: 1, atkBase: 1, atkInc: 0, expBase: 10, expInc: 1 };

    if (!mainRealmName || !subRealmName) {
        if (realmString !== "Không rõ") {
            // This warning is for non-standard NPC realms, which is fine, so we can mute it.
        }
        return {
            baseMaxKinhNghiem: fallbackTierDefinition.expBase,
            baseMaxSinhLuc: fallbackTierDefinition.hpBase,
            baseMaxLinhLuc: fallbackTierDefinition.mpBase,
            baseSucTanCong: fallbackTierDefinition.atkBase,
        };
    }
    
    const subRealmIndex = SUB_REALM_NAMES.indexOf(subRealmName);
    
    if (subRealmIndex === -1) {
         let tierDefinitionForError = currentRealmBaseStatsMap[mainRealmName] || fallbackTierDefinition;
         return {
            baseMaxKinhNghiem: tierDefinitionForError.expBase,
            baseMaxSinhLuc: tierDefinitionForError.hpBase,
            baseMaxLinhLuc: tierDefinitionForError.mpBase,
            baseSucTanCong: tierDefinitionForError.atkBase,
        };
    }
    
    let tierDefinition = currentRealmBaseStatsMap[mainRealmName];
    if (!tierDefinition) {
      const mainRealmIndexInList = mainRealmList.findIndex(r => r.trim() === mainRealmName.trim());
      if (mainRealmIndexInList !== -1 && mainRealmIndexInList < DEFAULT_TIERED_STATS.length) {
          tierDefinition = DEFAULT_TIERED_STATS[mainRealmIndexInList];
      } else {
          tierDefinition = fallbackTierDefinition;
      }
    }
    
    const calculatedBaseMaxSinhLuc = tierDefinition.hpBase + (subRealmIndex * tierDefinition.hpInc);
    const calculatedBaseMaxLinhLuc = tierDefinition.mpBase + (subRealmIndex * tierDefinition.mpInc);
    const calculatedBaseSucTanCong = tierDefinition.atkBase + (subRealmIndex * tierDefinition.atkInc);
    const calculatedBaseMaxKinhNghiem = tierDefinition.expBase + (subRealmIndex * tierDefinition.expInc);
    
    const calculatedStats = {
        baseMaxKinhNghiem: Math.max(10, calculatedBaseMaxKinhNghiem),
        baseMaxSinhLuc: Math.max(10, calculatedBaseMaxSinhLuc),
        baseMaxLinhLuc: Math.max(0, calculatedBaseMaxLinhLuc),
        baseSucTanCong: Math.max(1, calculatedBaseSucTanCong),
    };
    
    return calculatedStats;
};

export const calculateEffectiveStats = (
    currentStats: PlayerStats, 
    equippedItemIds: Record<EquipmentSlotId, Item['id'] | null>,
    inventory: Item[]
): PlayerStats => {
    const effectiveStats: PlayerStats = {
        ...currentStats, 
        maxSinhLuc: currentStats.baseMaxSinhLuc,
        maxLinhLuc: currentStats.baseMaxLinhLuc,
        sucTanCong: currentStats.baseSucTanCong,
        maxKinhNghiem: currentStats.baseMaxKinhNghiem,
        thoNguyen: currentStats.thoNguyen,
        maxThoNguyen: currentStats.maxThoNguyen,
    };

    for (const slotId in equippedItemIds) {
        const itemId = equippedItemIds[slotId as EquipmentSlotId];
        if (itemId) {
            const equippedItem = inventory.find(item => item.id === itemId);
            if (equippedItem && equippedItem.category === GameTemplates.ItemCategory.EQUIPMENT) {
                const equipment = equippedItem as GameTemplates.EquipmentTemplate;
                if (equipment.statBonuses) { 
                    for (const statKey in equipment.statBonuses) {
                        const key = statKey as keyof typeof equipment.statBonuses; 
                        const bonusValue = equipment.statBonuses[key];
                        if (typeof bonusValue === 'number') {
                            if (key === 'maxSinhLuc') effectiveStats.maxSinhLuc += bonusValue;
                            else if (key === 'maxLinhLuc') effectiveStats.maxLinhLuc += bonusValue;
                            else if (key === 'sucTanCong') effectiveStats.sucTanCong += bonusValue;
                            else if (key === 'maxKinhNghiem') effectiveStats.maxKinhNghiem += bonusValue;
                            else if (key === 'thoNguyen') effectiveStats.thoNguyen += bonusValue;
                            else if (key === 'maxThoNguyen') effectiveStats.maxThoNguyen += bonusValue;
                        }
                    }
                }
            }
        }
    }

    if (currentStats.activeStatusEffects && currentStats.activeStatusEffects.length > 0) {
        currentStats.activeStatusEffects.forEach(effect => {
            for (const statKey in effect.statModifiers) {
                const key = statKey as keyof PlayerStats;
                const modValue = effect.statModifiers[key as keyof typeof effect.statModifiers];

                if (typeof modValue === 'string') {
                    if (modValue.endsWith('%')) {
                        const percentage = parseFloat(modValue.slice(0, -1)) / 100;
                        if (!isNaN(percentage) && typeof effectiveStats[key] === 'number') {
                            (effectiveStats[key] as number) *= (1 + percentage);
                        }
                    } else {
                        const flatChange = parseInt(modValue, 10);
                        if (!isNaN(flatChange) && typeof effectiveStats[key] === 'number') {
                           (effectiveStats[key] as number) += flatChange;
                        }
                    }
                } else if (typeof modValue === 'number') {
                    if (typeof effectiveStats[key] === 'number') {
                        (effectiveStats[key] as number) += modValue;
                    }
                }
            }
        });
    }
    
    effectiveStats.maxSinhLuc = Math.round(effectiveStats.maxSinhLuc);
    effectiveStats.maxLinhLuc = Math.round(effectiveStats.maxLinhLuc);
    effectiveStats.sucTanCong = Math.round(effectiveStats.sucTanCong);
    effectiveStats.maxKinhNghiem = Math.round(effectiveStats.maxKinhNghiem);
    effectiveStats.thoNguyen = Math.round(effectiveStats.thoNguyen);
    effectiveStats.maxThoNguyen = Math.round(effectiveStats.maxThoNguyen);


    effectiveStats.sinhLuc = Math.max(0, Math.min(effectiveStats.sinhLuc, effectiveStats.maxSinhLuc));
    effectiveStats.linhLuc = Math.max(0, Math.min(effectiveStats.linhLuc, effectiveStats.maxLinhLuc));
    effectiveStats.kinhNghiem = Math.max(0, effectiveStats.kinhNghiem); 
    effectiveStats.thoNguyen = Math.max(0, Math.min(effectiveStats.thoNguyen, effectiveStats.maxThoNguyen));
    
    effectiveStats.maxSinhLuc = Math.max(10, effectiveStats.maxSinhLuc);
    effectiveStats.maxLinhLuc = Math.max(0, effectiveStats.maxLinhLuc); 
    effectiveStats.sucTanCong = Math.max(1, effectiveStats.sucTanCong);
    effectiveStats.maxKinhNghiem = Math.max(10, effectiveStats.maxKinhNghiem);

    return effectiveStats;
};

// New function to handle all level-up logic
export const handleLevelUps = (currentKb: KnowledgeBase): { updatedKb: KnowledgeBase; systemMessages: GameMessage[] } => {
    const newKb = JSON.parse(JSON.stringify(currentKb)) as KnowledgeBase;
    const systemMessages: GameMessage[] = [];
    const turnNumber = newKb.playerStats.turn;

    if (!newKb.worldConfig?.isCultivationEnabled) {
        return { updatedKb: newKb, systemMessages };
    }

    // Determine correct realm progression for the player
    const playerRace = newKb.worldConfig.playerRace || 'Nhân Tộc';
    const playerRealmSystem = newKb.worldConfig.raceCultivationSystems.find(s => s.raceName === playerRace)?.realmSystem 
                              || newKb.worldConfig.raceCultivationSystems[0]?.realmSystem 
                              || '';
    const realmProgressionList = playerRealmSystem.split(' - ').map(s => s.trim()).filter(Boolean);


    let hasLeveledUpInLoop = true;
    while (hasLeveledUpInLoop) {
        hasLeveledUpInLoop = false;

        if (newKb.playerStats.kinhNghiem < newKb.playerStats.maxKinhNghiem) {
            break;
        }

        const realmBefore = newKb.playerStats.realm;
        
        let currentMainRealmName = "";
        let currentSubRealmName = "";

        const sortedMainRealms = [...realmProgressionList].sort((a, b) => b.length - a.length);
        for (const r of sortedMainRealms) {
            if (realmBefore.startsWith(r)) {
                currentMainRealmName = r;
                currentSubRealmName = realmBefore.substring(r.length).trim();
                break;
            }
        }

        if (!currentMainRealmName || !SUB_REALM_NAMES.includes(currentSubRealmName as any)) {
            break;
        }

        const currentSubRealmIndex = SUB_REALM_NAMES.indexOf(currentSubRealmName as any);
        const isAtPeakSubRealm = currentSubRealmIndex === SUB_REALM_NAMES.length - 1;

        if (isAtPeakSubRealm) {
            newKb.playerStats.hieuUngBinhCanh = true;
            newKb.playerStats.kinhNghiem = newKb.playerStats.maxKinhNghiem;
            systemMessages.push({
                id: 'binh-canh-applied-client-' + Date.now(), type: 'system',
                content: `Bạn đã đạt đến ${newKb.playerStats.realm}! ${VIETNAMESE.bottleneckNotification}`,
                timestamp: Date.now(), turnNumber: turnNumber
            });
            break;
        } else {
            newKb.playerStats.kinhNghiem -= newKb.playerStats.maxKinhNghiem;
            const nextRealmString = `${currentMainRealmName} ${SUB_REALM_NAMES[currentSubRealmIndex + 1]}`;
            newKb.playerStats.realm = nextRealmString;
            
            const newBaseStats = calculateRealmBaseStats(newKb.playerStats.realm, realmProgressionList, newKb.currentRealmBaseStats);
            newKb.playerStats = { ...newKb.playerStats, ...newBaseStats };

            newKb.playerStats = calculateEffectiveStats(newKb.playerStats, newKb.equippedItems, newKb.inventory);

            newKb.playerStats.sinhLuc = newKb.playerStats.maxSinhLuc;
            newKb.playerStats.linhLuc = newKb.playerStats.maxLinhLuc;

            systemMessages.push({
                id: `sublevel-up-${Date.now()}`, type: 'system',
                content: `Chúc mừng ${newKb.worldConfig?.playerName || 'bạn'} đã đột phá tiểu cảnh giới, từ ${realmBefore} lên ${newKb.playerStats.realm}!`,
                timestamp: Date.now(), turnNumber: turnNumber
            });
            hasLeveledUpInLoop = true;
        }
    }

    newKb.playerStats = calculateEffectiveStats(newKb.playerStats, newKb.equippedItems, newKb.inventory);
    return { updatedKb: newKb, systemMessages };
};

/**
 * Calculates the base value of a realm based on its position in the progression list.
 * Uses a formula with a decaying multiplier for exponential but controlled growth.
 * @param realmIndex The index of the realm in the `realmProgressionList`. -1 for mortal realm.
 * @returns The calculated base value for the realm.
 */
const calculateRealmValueByIndex = (realmIndex: number): number => {
    if (realmIndex < 0) {
        return MORTAL_REALM_BASE_VALUE;
    }
    if (realmIndex === 0) {
        return FIRST_CULTIVATION_REALM_BASE_VALUE;
    }

    let value = FIRST_CULTIVATION_REALM_BASE_VALUE;
    // Loop from the second realm (index 1) up to the target realm index
    for (let i = 1; i <= realmIndex; i++) {
        const multiplier = Math.max(REALM_MULTIPLIER_MIN, REALM_MULTIPLIER_BASE - (REALM_MULTIPLIER_DECAY * (i - 1)));
        value *= multiplier;
    }
    
    return Math.floor(value);
};

/**
 * Calculates the systemic value of an item based on its properties.
 * This overrides any value provided by the AI to ensure economic consistency.
 * @param item The item to be valued.
 * @param realmProgressionList The ordered list of main realms in the game.
 * @returns The calculated value of the item.
 */
export const calculateItemValue = (item: Item, realmProgressionList: string[]): number => {
    let baseValue = 0;

    // 1. Get base value from item's realm.
    if (item.itemRealm) {
        const realmIndex = realmProgressionList.findIndex(r => item.itemRealm.startsWith(r.split('(')[0].trim()));
        baseValue = calculateRealmValueByIndex(realmIndex);
    } else {
        baseValue = 10;
    }

    let statValue = 0;
    // 2. Add value from stat bonuses for equipment.
    if (item.category === GameTemplates.ItemCategory.EQUIPMENT) {
        const equipment = item as GameTemplates.EquipmentTemplate;
        if (equipment.statBonuses) {
            for (const [stat, bonus] of Object.entries(equipment.statBonuses)) {
                if (STAT_POINT_VALUES[stat] && typeof bonus === 'number') {
                    statValue += STAT_POINT_VALUES[stat] * bonus;
                }
            }
        }
    }
    
    let valueBeforeMultipliers = baseValue + statValue;

    // 3. Apply rarity multiplier.
    const rarityMultiplier = RARITY_MULTIPLIERS[item.rarity] || 1.0;
    let finalValue = valueBeforeMultipliers * rarityMultiplier;

    // 4. Apply category multiplier.
    const categoryMultiplier = CATEGORY_MULTIPLIERS[item.category] || 1.0;
    finalValue *= categoryMultiplier;
    
    // 5. NEW: Apply special effect multiplier for equipment.
    if (item.category === GameTemplates.ItemCategory.EQUIPMENT) {
        let totalEffectMultiplier = 0;
        const equipment = item as GameTemplates.EquipmentTemplate;
        if (equipment.uniqueEffects && equipment.uniqueEffects.length > 0) {
            for (const effectString of equipment.uniqueEffects) {
                if (effectString.toLowerCase().trim() === 'không có gì đặc biệt') {
                    continue; // Skip this "no effect" string
                }
                
                let effectApplied = false;
                const normalizedEffectString = normalizeStringForComparison(effectString);

                for (const [keyword, effectData] of Object.entries(SPECIAL_EFFECT_KEYWORDS)) {
                    if (normalizedEffectString.includes(normalizeStringForComparison(keyword))) {
                        // Found a keyword. Try to extract number.
                        const numberMatch = effectString.match(/(\d+(\.\d+)?)/);
                        const numericValue = numberMatch ? parseFloat(numberMatch[0]) : 1; // Default to 1 if no number found (e.g., "Miễn nhiễm choáng")
                        
                        totalEffectMultiplier += effectData.baseMultiplier * numericValue;
                        effectApplied = true;
                        break; // Stop after first keyword match for this effect string
                    }
                }
                if (!effectApplied) {
                    // This effect is unique but not in our dictionary
                    totalEffectMultiplier += UNKNOWN_EFFECT_MULTIPLIER;
                }
            }
        }
        // Apply the effect multiplier. It's an addition to the base multiplier of 1.
        finalValue *= (1 + totalEffectMultiplier);
    }

    return Math.max(1, Math.round(finalValue)); // Ensure value is at least 1.
};

/**
 * Calculates the systemic value of a slave based on their properties.
 * This is used for both market price and auction starting price.
 * @param slave The slave object to be valued.
 * @param realmProgressionList The ordered list of main realms for the slave's race.
 * @returns The calculated value of the slave.
 */
export const calculateSlaveValue = (slave: Slave, realmProgressionList: string[]): number => {
    if (!slave.realm) return 500; // Base value for a mortal/unranked slave

    // 1. Find base value from realm tier
    const mainRealmName = realmProgressionList.find(r => slave.realm!.startsWith(r));
    const mainRealmIndex = mainRealmName ? realmProgressionList.indexOf(mainRealmName) : -1;
    let baseValue = mainRealmIndex > -1 ? (AUCTION_NPC_CURRENCY_BY_REALM_TIER[mainRealmIndex] || 500) : 500;

    // 2. Apply sub-realm modifier
    const subRealmName = slave.realm.replace(mainRealmName || '', '').trim();
    const subRealmIndex = SUB_REALM_NAMES.indexOf(subRealmName as any);
    if (subRealmIndex > -1) {
        // Linear scale from 50% to 95%
        // At index 0 (Nhất Trọng), modifier is 0.5. At index 9 (Đỉnh Phong), it's 0.95.
        // Formula: 0.5 + (subRealmIndex * ( (0.95 - 0.5) / 9) ) = 0.5 + (subRealmIndex * 0.05)
        const subRealmMultiplier = 1.0 + (0.5 + (0.05 * subRealmIndex));
        baseValue *= subRealmMultiplier;
    }

    // 3. Apply aptitude (Tu Chất) multiplier
    if (slave.tuChat) {
        const tuChatMultiplier = TU_CHAT_VALUE_MULTIPLIERS[slave.tuChat] || 1.0;
        baseValue *= tuChatMultiplier;
    }

    // 4. Apply bonus for special physique/root
    if (slave.specialPhysique && slave.specialPhysique !== 'Phàm Thể') {
        baseValue *= 1.25; // +25% bonus
    }
    if (slave.spiritualRoot && slave.spiritualRoot !== 'Phàm Căn') {
        baseValue *= 1.25; // +25% bonus
    }

    return Math.max(100, Math.round(baseValue)); // Ensure value is at least 100
};