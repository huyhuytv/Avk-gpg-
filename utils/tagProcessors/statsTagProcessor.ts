
import { KnowledgeBase, PlayerStats, GameMessage, RealmBaseStatDefinition, PlayerSpecialStatus, Master, PersonBase, VectorMetadata } from '../../types';
import { DEFAULT_PLAYER_STATS, VIETNAMESE, SUB_REALM_NAMES } from '../../constants';
import { calculateRealmBaseStats, calculateEffectiveStats } from '../statsCalculationUtils';
import { formatPersonForEmbedding } from '../ragUtils';

export const processPlayerStatsInit = (
    currentKb: KnowledgeBase,
    tagParams: Record<string, string>
): { updatedKb: KnowledgeBase; systemMessages: GameMessage[]; realmChanged: boolean; turnIncremented: boolean } => {
    const newKb = JSON.parse(JSON.stringify(currentKb)) as KnowledgeBase;
    const statsUpdates: Partial<PlayerStats> = {};
    let deferMaxSinhLuc = false;
    let deferMaxLinhLuc = false;
    let realmChanged = false;
    let turnIncremented = false;
    const oldRealm = newKb.playerStats.realm;

    Object.keys(tagParams).forEach(rawKey => {
        const key = rawKey.trim() as keyof PlayerStats;
        const valueStr = tagParams[rawKey].trim();

        if (key === 'kinhNghiem' && !newKb.worldConfig?.isCultivationEnabled) {
            console.warn(`PLAYER_STATS_INIT: Cultivation is disabled. Ignoring kinhNghiem initialization from tag.`);
            return;
        }

        if (!(key in DEFAULT_PLAYER_STATS)) {
            console.warn(`PLAYER_STATS_INIT: Unknown stat key "${key}". Skipping value "${valueStr}".`);
            return;
        }

        const targetType = typeof DEFAULT_PLAYER_STATS[key];

        if (key === 'isInCombat' || key === 'hieuUngBinhCanh') {
            (statsUpdates as any)[key] = valueStr.toLowerCase() === 'true';
        } else if (key === 'realm' || key === 'spiritualRoot' || key === 'specialPhysique') {
            const trimmedValue = valueStr.trim();
            if (trimmedValue) { // This handles both "" and " "
                (statsUpdates as any)[key] = trimmedValue;
                if (key === 'realm' && trimmedValue !== oldRealm) realmChanged = true;
            } else {
                console.warn(`PLAYER_STATS_INIT: Received an empty or whitespace value for key "${key}". Ignoring.`);
            }
        } else if (targetType === 'number') {
            if (key === 'sinhLuc' && valueStr.toUpperCase() === 'MAX') {
                deferMaxSinhLuc = true;
            } else if (key === 'linhLuc' && valueStr.toUpperCase() === 'MAX') {
                deferMaxLinhLuc = true;
            } else {
                const numValue = parseInt(valueStr, 10);
                if (!isNaN(numValue)) {
                    (statsUpdates as any)[key] = numValue;
                } else {
                    console.warn(`PLAYER_STATS_INIT: Invalid number value "${valueStr}" for key "${key}". Using default.`);
                    const defaultVal = DEFAULT_PLAYER_STATS[key];
                    (statsUpdates as any)[key] = typeof defaultVal === 'number' ? defaultVal : 0;
                }
            }
        }
    });

    const initialRealmForCalc = statsUpdates.realm || newKb.playerStats.realm || DEFAULT_PLAYER_STATS.realm;
     if (typeof initialRealmForCalc !== 'string') {
        console.error(`PLAYER_STATS_INIT: initialRealmForCalc is not a string: ${initialRealmForCalc}. Fallback to default realm.`);
        statsUpdates.realm = DEFAULT_PLAYER_STATS.realm;
    }
    const baseRealmStats = calculateRealmBaseStats(statsUpdates.realm || DEFAULT_PLAYER_STATS.realm, newKb.realmProgressionList, newKb.currentRealmBaseStats);

    newKb.playerStats = {
        ...DEFAULT_PLAYER_STATS,
        ...baseRealmStats,
        ...statsUpdates
    } as PlayerStats;
     if (statsUpdates.realm) newKb.playerStats.realm = statsUpdates.realm;


    if (deferMaxSinhLuc) newKb.playerStats.sinhLuc = newKb.playerStats.maxSinhLuc;
    if (deferMaxLinhLuc) newKb.playerStats.linhLuc = newKb.playerStats.maxLinhLuc;
    
    newKb.playerStats.sinhLuc = Math.min(newKb.playerStats.sinhLuc, newKb.playerStats.maxSinhLuc);
    newKb.playerStats.linhLuc = Math.min(newKb.playerStats.linhLuc, newKb.playerStats.maxLinhLuc);
    newKb.playerStats.kinhNghiem = Math.min(newKb.playerStats.kinhNghiem, newKb.playerStats.maxKinhNghiem);
    
    newKb.playerStats = calculateEffectiveStats(newKb.playerStats, newKb.equippedItems, newKb.inventory);
    const newTurn = typeof statsUpdates.turn === 'number' ? statsUpdates.turn : 1;
    if (newKb.playerStats.turn !== newTurn) {
        newKb.playerStats.turn = newTurn;
        turnIncremented = newTurn > (currentKb.playerStats.turn || 0);
    }


    if (newKb.currentPageHistory?.length === 1 && newKb.currentPageHistory[0] > newKb.playerStats.turn) {
        newKb.currentPageHistory = [newKb.playerStats.turn];
    } else if (!newKb.currentPageHistory || newKb.currentPageHistory.length === 0) {
        newKb.currentPageHistory = [newKb.playerStats.turn];
    }
    
    return { updatedKb: newKb, systemMessages: [], realmChanged, turnIncremented };
};

export const processStatsUpdate = (
    currentKb: KnowledgeBase,
    tagParams: Record<string, string>,
    turnForSystemMessages: number
): { updatedKb: KnowledgeBase; systemMessages: GameMessage[]; realmChanged: boolean; turnIncremented: boolean; removedBinhCanh: boolean } => {
    const newKb = JSON.parse(JSON.stringify(currentKb)) as KnowledgeBase;
    const systemMessages: GameMessage[] = [];
    let realmChanged = false;
    let turnIncremented = false;
    let removedBinhCanh = false;
    const oldRealm = newKb.playerStats.realm;
    const oldTurnForThisTagProcessing = newKb.playerStats.turn;
    const statsBeforeThisTag = { ...newKb.playerStats };
    const statsUpdates: Partial<PlayerStats> = {};

    Object.keys(tagParams).forEach(rawKey => {
        const key = rawKey.trim() as keyof PlayerStats;
        const valueStr = tagParams[rawKey].trim();
        
        if (key === 'kinhNghiem' && !newKb.worldConfig?.isCultivationEnabled) {
            console.warn(`STATS_UPDATE: Cultivation is disabled. Skipping kinhNghiem gain from tag.`);
            return;
        }

        if (key === 'isInCombat') {
            // This key is deprecated and should be ignored.
            return;
        }

        if (!(key in newKb.playerStats)) {
            console.warn(`STATS_UPDATE: Unknown stat key "${key}" in playerStats. Skipping value "${valueStr}".`);
            return;
        }

        if (key === 'hieuUngBinhCanh') {
            (statsUpdates as any)[key] = valueStr.toLowerCase() === 'true';
            if (!( (statsUpdates as any)[key])) removedBinhCanh = true;
        } else if (key === 'turn') {
            let parsedTurn;
            if (valueStr.startsWith('+') || valueStr.startsWith('-')) {
                parsedTurn = oldTurnForThisTagProcessing + parseInt(valueStr, 10);
            } else {
                parsedTurn = parseInt(valueStr, 10);
            }
            if (!isNaN(parsedTurn)) {
                (statsUpdates as any)[key] = parsedTurn;
                if (parsedTurn > oldTurnForThisTagProcessing) turnIncremented = true;
            }
        } else if (key === 'realm') {
            const trimmedValue = valueStr.trim();
            if (trimmedValue) { // This handles both "" and " "
                (statsUpdates as any)[key] = trimmedValue;
                if (trimmedValue !== oldRealm) realmChanged = true;
            } else {
                console.warn(`STATS_UPDATE: Received an empty or whitespace realm value. Ignoring update.`);
            }
        } else if (key === 'kinhNghiem' && valueStr.endsWith('%')) {
            const percentage = parseFloat(valueStr.replace('+=', '').slice(0, -1));
            if (!isNaN(percentage)) {
                const expGain = Math.floor(newKb.playerStats.maxKinhNghiem * (percentage / 100));
                (statsUpdates as any)[key] = (newKb.playerStats.kinhNghiem || 0) + expGain;
            }
        } else if (typeof newKb.playerStats[key] === 'number') {
            const baseValue = (newKb.playerStats[key] as number) || 0;
            let numericValueToAssign: number | undefined = undefined;
        
            if (valueStr.toUpperCase() === 'MAX' && (key === 'sinhLuc' || key === 'linhLuc')) {
                numericValueToAssign = newKb.playerStats[key === 'sinhLuc' ? 'maxSinhLuc' : 'maxLinhLuc'];
            } else {
                let isRelative = false;
                let isAbsoluteAssignment = false;
                let parsedNumber: number = NaN;
        
                if (valueStr.startsWith('+=')) {
                    isRelative = true;
                    parsedNumber = parseInt(valueStr.substring(2), 10);
                } else if (valueStr.startsWith('-=')) {
                    isRelative = true;
                    const val = parseInt(valueStr.substring(2), 10);
                    if (!isNaN(val)) parsedNumber = -val;
                } else if (valueStr.startsWith('=')) {
                    isAbsoluteAssignment = true;
                    parsedNumber = parseInt(valueStr.substring(1), 10);
                } else if (valueStr.startsWith('+') || valueStr.startsWith('-')) {
                    isRelative = true;
                    parsedNumber = parseInt(valueStr, 10);
                } else {
                    isAbsoluteAssignment = true;
                    parsedNumber = parseInt(valueStr, 10);
                }
        
                if (key === 'currency' && !isRelative) {
                    console.warn(`STATS_UPDATE: Invalid value for currency: "${valueStr}". Must be a relative change (e.g., "+=100" or "-=50"). Skipping update for currency.`);
                } else if (!isNaN(parsedNumber)) {
                    if (isRelative) {
                        numericValueToAssign = baseValue + parsedNumber;
                    } else if (isAbsoluteAssignment) {
                        numericValueToAssign = parsedNumber;
                    }
                }
            }
        
            if (numericValueToAssign !== undefined) {
                (statsUpdates as any)[key] = numericValueToAssign;
            }
        }
    });

    newKb.playerStats = { ...newKb.playerStats, ...statsUpdates };
    if (newKb.playerStats.realm && typeof newKb.playerStats.realm !== 'string') {
        console.warn(`STATS_UPDATE: Realm value is not a string: ${newKb.playerStats.realm}. Reverting to old realm "${oldRealm}".`);
        newKb.playerStats.realm = oldRealm; 
        realmChanged = false; 
    }

    if (realmChanged) {
        const baseRealmStats = calculateRealmBaseStats(newKb.playerStats.realm, newKb.realmProgressionList, newKb.currentRealmBaseStats);
        newKb.playerStats = { ...newKb.playerStats, ...baseRealmStats };
    }
    newKb.playerStats = calculateEffectiveStats(newKb.playerStats, newKb.equippedItems, newKb.inventory);

    const statsAfterThisTag = newKb.playerStats;
    if ((tagParams.sinhLuc || (tagParams.sinhLuc?.toUpperCase() === 'MAX')) && statsAfterThisTag.sinhLuc !== statsBeforeThisTag.sinhLuc) {
        const change = statsAfterThisTag.sinhLuc - statsBeforeThisTag.sinhLuc;
        systemMessages.push({ id: 'stat-change-sinhLuc-' + Date.now(), type: 'system', content: `Sinh lực thay đổi: ${statsBeforeThisTag.sinhLuc} -> ${statsAfterThisTag.sinhLuc} (${change > 0 ? '+' : ''}${Math.round(change)}).`, timestamp: Date.now(), turnNumber: turnForSystemMessages });
    }
    // ... (similar checks and messages for linhLuc, kinhNghiem, currency, realm, hieuUngBinhCanh)

    if (newKb.playerStats.kinhNghiem < 0) newKb.playerStats.kinhNghiem = 0;
    newKb.playerStats.sinhLuc = Math.min(newKb.playerStats.sinhLuc, newKb.playerStats.maxSinhLuc);
    newKb.playerStats.linhLuc = Math.min(newKb.playerStats.linhLuc, newKb.playerStats.maxLinhLuc);

    return { updatedKb: newKb, systemMessages, realmChanged, turnIncremented, removedBinhCanh };
};

export const processRemoveBinhCanhEffect = (
    currentKb: KnowledgeBase,
    tagParams: Record<string, string>,
    turnForSystemMessages: number
): { updatedKb: KnowledgeBase; systemMessages: GameMessage[]; removedBinhCanh: boolean } => {
    const newKb = JSON.parse(JSON.stringify(currentKb)) as KnowledgeBase;
    const systemMessages: GameMessage[] = [];
    let removedBinhCanh = false;

    if (!newKb.worldConfig?.isCultivationEnabled) {
        return { updatedKb: newKb, systemMessages, removedBinhCanh };
    }

    // Check if the character is actually in a bottleneck state
    if (newKb.playerStats.hieuUngBinhCanh) {
        const realmBeforeBreakthrough = newKb.playerStats.realm;
        let mainRealmBefore = "";

        // Find the current main realm based on the full realm string
        const sortedMainRealms = [...newKb.realmProgressionList].sort((a, b) => b.length - a.length);
        for (const r of sortedMainRealms) {
            if (realmBeforeBreakthrough.startsWith(r)) {
                mainRealmBefore = r;
                break;
            }
        }
        
        const mainRealmIndex = newKb.realmProgressionList.indexOf(mainRealmBefore);

        // Check if there is a next realm to advance to
        if (mainRealmBefore && mainRealmIndex < newKb.realmProgressionList.length - 1) {
            const nextMainRealmName = newKb.realmProgressionList[mainRealmIndex + 1];
            
            // 1. Immediately set realm to next major realm
            newKb.playerStats.realm = `${nextMainRealmName} ${SUB_REALM_NAMES[0]}`;
            
            // 2. Reset EXP to 0.
            newKb.playerStats.kinhNghiem = 0;
            
            // 3. Set hieuUngBinhCanh to false.
            newKb.playerStats.hieuUngBinhCanh = false;
            removedBinhCanh = true;

            // Recalculate base stats for the new realm
            const newBaseStats = calculateRealmBaseStats(newKb.playerStats.realm, newKb.realmProgressionList, newKb.currentRealmBaseStats);
            newKb.playerStats = { ...newKb.playerStats, ...newBaseStats };

            // Give lifespan bonus
            const lifespanBonus = 100 * Math.pow(1.5, mainRealmIndex);
            newKb.playerStats.maxThoNguyen += lifespanBonus;
            newKb.playerStats.thoNguyen += lifespanBonus;

            // Heal to full after major breakthrough
            newKb.playerStats.sinhLuc = newKb.playerStats.maxSinhLuc;
            newKb.playerStats.linhLuc = newKb.playerStats.maxLinhLuc;

            // Add system messages
            systemMessages.push({
                id: 'major-breakthrough-' + Date.now(), type: 'system',
                content: `Chúc mừng ${newKb.worldConfig?.playerName || 'bạn'} đã thành công đột phá đại cảnh giới, từ ${realmBeforeBreakthrough} tiến vào ${newKb.playerStats.realm}!`,
                timestamp: Date.now(), turnNumber: turnForSystemMessages
            });
            systemMessages.push({
                id: 'lifespan-increase-' + Date.now(), type: 'system',
                content: `Thọ nguyên của bạn đã được tăng thêm ${Math.floor(lifespanBonus)} năm!`,
                timestamp: Date.now(), turnNumber: turnForSystemMessages
            });

        } else {
            // This case means they are at the absolute highest realm. Just remove bottleneck.
            newKb.playerStats.hieuUngBinhCanh = false;
            removedBinhCanh = true;
             systemMessages.push({
                id: 'binh-canh-removed-maxlevel-' + Date.now(), type: 'system',
                content: `Bình cảnh đã được gỡ bỏ, nhưng bạn đã ở cảnh giới cao nhất!`,
                timestamp: Date.now(), turnNumber: turnForSystemMessages
            });
        }
    } else {
        // Player was not in a bottleneck, so do nothing.
         systemMessages.push({
            id: 'binh-canh-remove-failed-notactive-' + Date.now(), type: 'system',
            content: `[DEBUG] Lệnh gỡ bình cảnh không có tác dụng vì bạn không ở trong trạng thái bình cảnh.`,
            timestamp: Date.now(), turnNumber: turnForSystemMessages
        });
    }

    return { updatedKb: newKb, systemMessages, removedBinhCanh };
};

export const processBecomeSpecialStatus = (
    currentKb: KnowledgeBase,
    tagParams: Record<string, string>,
    tagName: 'BECOMEPRISONER' | 'BECOMESLAVE',
    turnForSystemMessages: number
): { updatedKb: KnowledgeBase; systemMessages: GameMessage[]; newVectorMetadata?: VectorMetadata; } => {
    const newKb = JSON.parse(JSON.stringify(currentKb)) as KnowledgeBase;
    const systemMessages: GameMessage[] = [];
    let newVectorMetadata: VectorMetadata | undefined = undefined;
    const statusType = tagName === 'BECOMEPRISONER' ? 'prisoner' : 'slave';
    
    const ownerName = tagParams.name || 'Không rõ';
    
    const ownerNpcIndex = newKb.discoveredNPCs.findIndex(n => n.name === ownerName);
    if (ownerNpcIndex === -1) {
        console.warn(`${tagName}: Owner NPC "${ownerName}" not found.`);
        systemMessages.push({
            id: `error-owner-not-found-${Date.now()}`,
            type: 'error',
            content: `Lỗi: Không tìm thấy NPC có tên "${ownerName}" để trở thành chủ nhân.`,
            timestamp: Date.now(),
            turnNumber: turnForSystemMessages
        });
        return { updatedKb: newKb, systemMessages };
    }
    
    const ownerNpc = newKb.discoveredNPCs[ownerNpcIndex];
    
    // Create the new Master entity, explicitly copying all PersonBase properties
    const personBaseData: PersonBase = {
        id: ownerNpc.id,
        name: ownerNpc.name,
        title: ownerNpc.title,
        gender: ownerNpc.gender,
        description: ownerNpc.description,
        affinity: ownerNpc.affinity,
        avatarUrl: ownerNpc.avatarUrl,
        realm: ownerNpc.realm,
        tuChat: ownerNpc.tuChat,
        spiritualRoot: ownerNpc.spiritualRoot,
        specialPhysique: ownerNpc.specialPhysique,
        stats: ownerNpc.stats,
    };
    
    const newMaster: Master = {
        ...personBaseData,
        mood: 'Bình Thường',
        needs: { 'Dục Vọng': 50, 'Tham Vọng': 50, 'An Toàn': 50, 'Giải Trí': 50 },
        currentGoal: `Quan sát ${statusType} mới.`,
        favor: 0,
    };
    newKb.master = newMaster;

    // Create vector metadata for the new master
    newVectorMetadata = { entityId: newMaster.id, entityType: 'master', text: formatPersonForEmbedding(newMaster) };

    // Remove the NPC from the regular list
    newKb.discoveredNPCs.splice(ownerNpcIndex, 1);

    const willpower = parseInt(tagParams.willpower || '55', 10);
    const resistance = parseInt(tagParams.resistance || '80', 10);
    const obedience = parseInt(tagParams.obedience || '15', 10);

    const newStatus: PlayerSpecialStatus = {
        type: statusType,
        ownerName,
        willpower: Math.max(0, Math.min(100, isNaN(willpower) ? 55 : willpower)),
        resistance: Math.max(0, Math.min(100, isNaN(resistance) ? 80 : resistance)),
        obedience: Math.max(0, Math.min(100, isNaN(obedience) ? 15 : obedience)),
        fear: Math.max(0, Math.min(100, parseInt(tagParams.fear || '30', 10))),
        trust: Math.max(0, Math.min(100, parseInt(tagParams.trust || '5', 10))),
    };

    newKb.playerStats.playerSpecialStatus = newStatus;

    systemMessages.push({
        id: `player-status-change-${statusType}-${Date.now()}`,
        type: 'system',
        content: `Bạn đã trở thành ${statusType === 'prisoner' ? 'tù nhân' : 'nô lệ'} của ${ownerName}.`,
        timestamp: Date.now(),
        turnNumber: turnForSystemMessages
    });

    return { updatedKb: newKb, systemMessages, newVectorMetadata };
};

export const processPlayerSpecialStatusUpdate = (
    currentKb: KnowledgeBase,
    tagParams: Record<string, string>,
    turnForSystemMessages: number
): { updatedKb: KnowledgeBase; systemMessages: GameMessage[] } => {
    const newKb = JSON.parse(JSON.stringify(currentKb)) as KnowledgeBase;
    const systemMessages: GameMessage[] = [];

    if (!newKb.playerStats.playerSpecialStatus) {
        console.warn("PLAYER_SPECIAL_STATUS_UPDATE: Player does not have a special status to update.");
        return { updatedKb: newKb, systemMessages };
    }

    const updateNumericField = (field: keyof PlayerSpecialStatus) => {
        const paramValue = tagParams[field as string];
        if (paramValue) {
            const changeStr = paramValue.trim();
            const currentValue = (newKb.playerStats.playerSpecialStatus?.[field] as number) || 0;
            let newValue: number | null = null;
    
            if (changeStr.startsWith('+=')) {
                newValue = currentValue + parseInt(changeStr.substring(2), 10);
            } else if (changeStr.startsWith('-=')) {
                newValue = currentValue - parseInt(changeStr.substring(2), 10);
            } else if (changeStr.startsWith('=')) {
                newValue = parseInt(changeStr.substring(1), 10);
            } else {
                newValue = currentValue + parseInt(changeStr, 10);
            }
            
            if (newValue !== null && !isNaN(newValue)) {
                // Clamping values
                if (field === 'willpower' || field === 'resistance' || field === 'obedience' || field === 'fear' || field === 'trust') {
                    (newKb.playerStats.playerSpecialStatus as any)[field] = Math.max(0, Math.min(100, newValue));
                }
            }
        }
    };
    
    updateNumericField('willpower');
    updateNumericField('resistance');
    updateNumericField('obedience');
    updateNumericField('fear' as keyof PlayerSpecialStatus);
    updateNumericField('trust' as keyof PlayerSpecialStatus);

    return { updatedKb: newKb, systemMessages };
};

export const processBecomeFree = (
    currentKb: KnowledgeBase,
    turnForSystemMessages: number
): { updatedKb: KnowledgeBase; systemMessages: GameMessage[] } => {
    const newKb = JSON.parse(JSON.stringify(currentKb)) as KnowledgeBase;
    
    newKb.playerStats.playerSpecialStatus = null;
    newKb.master = null; // Clear the master object
    
    const systemMessages: GameMessage[] = [{
        id: `player-become-free-${Date.now()}`,
        type: 'system',
        content: `Bạn đã giành lại được tự do!`,
        timestamp: Date.now(),
        turnNumber: turnForSystemMessages
    }];
    
    return { updatedKb: newKb, systemMessages };
};
