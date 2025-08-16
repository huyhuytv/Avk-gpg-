import { KnowledgeBase, GameMessage, NPC, Slave, AuctionSlave, PlayerStats } from '../../types';
import { TU_CHAT_TIERS } from '../../constants';
import { diceCoefficient, normalizeStringForComparison } from '../questUtils';
import { calculateRealmBaseStats, calculateSlaveValue } from '../statsCalculationUtils';

const SIMILARITY_THRESHOLD = 0.8;

const findNpcByName = (npcs: NPC[], name: string): NPC | null => {
    if (!name) return null;
    let bestMatch = { npc: null as NPC | null, score: 0 };
    const normalizedName = normalizeStringForComparison(name);

    npcs.forEach((npc) => {
        const score = diceCoefficient(normalizedName, normalizeStringForComparison(npc.name));
        if (score > bestMatch.score) {
            bestMatch = { npc, score };
        }
    });

    if (bestMatch.npc && bestMatch.score >= SIMILARITY_THRESHOLD) {
        return bestMatch.npc;
    }
    
    console.warn(`[findNpcByName] NPC matching "${name}" not found or similarity too low.`);
    return null;
}

export const processSlaveForSale = (
    currentKb: KnowledgeBase,
    tagParams: Record<string, string>,
    turnForSystemMessages: number
): { updatedKb: KnowledgeBase; systemMessages: GameMessage[] } => {
    const newKb = JSON.parse(JSON.stringify(currentKb)) as KnowledgeBase;
    const systemMessages: GameMessage[] = [];
    
    const parentId = tagParams.parentId;
    const name = tagParams.name;
    const description = tagParams.description;
    const value = parseInt(tagParams.value || '0', 10);
    const statsJSON = tagParams.statsJSON;
    let stats: Partial<PlayerStats> = {};
    if (statsJSON) {
        try {
            stats = JSON.parse(statsJSON);
        } catch (e) {
            console.warn(`SLAVE_FOR_SALE: Could not parse statsJSON for ${name}:`, statsJSON, e);
        }
    }

    if (!parentId || !name || !description) {
        console.warn("SLAVE_FOR_SALE: Missing parentId, name, or description.", tagParams);
        return { updatedKb: newKb, systemMessages };
    }

    const vendor = findNpcByName(newKb.discoveredNPCs, parentId);

    if (vendor && vendor.vendorType === 'SlaveTrader') {
        const newSlave: Slave = {
            id: `slave-for-sale-${name.replace(/\s+/g, '-')}-${Date.now()}`,
            name,
            description,
            title: tagParams.title,
            gender: 'Nữ', // As per spec
            entityType: 'slave',
            affinity: parseInt(tagParams.affinity, 10) || -50,
            willpower: parseInt(tagParams.willpower, 10) || 30,
            obedience: parseInt(tagParams.obedience, 10) || 70,
            race: tagParams.race || 'Nhân Tộc',
            realm: tagParams.realm || 'Phàm Nhân',
            tuChat: (tagParams.tuChat as any) || 'Trung Đẳng',
            spiritualRoot: tagParams.spiritualRoot,
            specialPhysique: tagParams.specialPhysique,
            avatarUrl: tagParams.avatarUrl,
            stats: stats,
            value: isNaN(value) ? 0 : value, // Store monetary value directly on the slave object
            skills: [],
            equippedItems: { mainWeapon: null, offHandWeapon: null, head: null, body: null, hands: null, legs: null, artifact: null, pet: null, accessory1: null, accessory2: null },
        };
        
        // --- STAT CALCULATION LOGIC ---
        if (newKb.worldConfig?.isCultivationEnabled && newSlave.realm) {
            const slaveRace = newSlave.race || 'Nhân Tộc';
            const raceSystemForSlave = newKb.worldConfig.raceCultivationSystems.find(rs => rs.raceName === slaveRace) 
                                     || newKb.worldConfig.raceCultivationSystems[0];
            
            if (raceSystemForSlave) {
                const slaveRealmProgression = raceSystemForSlave.realmSystem.split(' - ').map(s => s.trim()).filter(Boolean);
                const calculatedBaseStats = calculateRealmBaseStats(
                    newSlave.realm,
                    slaveRealmProgression,
                    newKb.currentRealmBaseStats
                );
                
                if (!newSlave.stats) newSlave.stats = {};
    
                newSlave.stats = {
                    ...newSlave.stats,
                    ...calculatedBaseStats,
                    maxSinhLuc: calculatedBaseStats.baseMaxSinhLuc,
                    maxLinhLuc: calculatedBaseStats.baseMaxLinhLuc,
                    sucTanCong: calculatedBaseStats.baseSucTanCong,
                    maxKinhNghiem: calculatedBaseStats.baseMaxKinhNghiem,
                    sinhLuc: calculatedBaseStats.baseMaxSinhLuc,
                    linhLuc: calculatedBaseStats.baseMaxLinhLuc,
                    kinhNghiem: 0,
                };

                 // --- OVERRIDE VALUE WITH SYSTEMIC CALCULATION ---
                newSlave.value = calculateSlaveValue(newSlave, slaveRealmProgression);
                // --- END OVERRIDE ---
            }
        }
        
        if (!vendor.slavesForSale) {
            vendor.slavesForSale = [];
        }
        vendor.slavesForSale.push(newSlave);
    } else {
        console.warn(`SLAVE_FOR_SALE: Could not find a SlaveTrader NPC with name "${parentId}".`);
    }

    return { updatedKb: newKb, systemMessages };
};


export const processAuctionSlave = (
    currentKb: KnowledgeBase,
    tagParams: Record<string, string>,
    turnForSystemMessages: number
): { updatedKb: KnowledgeBase; systemMessages: GameMessage[] } => {
    const newKb = JSON.parse(JSON.stringify(currentKb)) as KnowledgeBase;
    const systemMessages: GameMessage[] = [];

    const name = tagParams.name;
    const description = tagParams.description;
    const value = parseInt(tagParams.value || '1000', 10);

    if (!name || !description) {
        console.warn("AUCTION_SLAVE: Missing name or description.", tagParams);
        return { updatedKb: newKb, systemMessages };
    }

    if (!newKb.slaveAuctionState) {
        newKb.slaveAuctionState = { 
            isOpen: true, 
            items: [], 
            auctionNPCs: [], 
            auctioneerCommentary: [], 
            currentItemIndex: 0, 
            lastBidTime: Date.now(), 
            auctioneerCallCount: 0, 
            locationId: newKb.currentLocationId || '' 
        };
    }
    
    const baseValue = isNaN(value) ? 1000 : value;

    const newAuctionSlave: AuctionSlave = {
        id: `auction-slave-${name.replace(/\s+/g, '-')}-${Date.now()}`,
        name,
        description,
        gender: 'Nữ',
        entityType: 'slave',
        affinity: parseInt(tagParams.affinity, 10) || -50,
        willpower: parseInt(tagParams.willpower, 10) || 50,
        obedience: parseInt(tagParams.obedience, 10) || 50,
        race: tagParams.race || 'Nhân Tộc',
        realm: tagParams.realm || 'Phàm Nhân',
        tuChat: (tagParams.tuChat as any) || 'Thượng Đẳng',
        stats: {},
        skills: [],
        equippedItems: { mainWeapon: null, offHandWeapon: null, head: null, body: null, hands: null, legs: null, artifact: null, pet: null, accessory1: null, accessory2: null },
        startingPrice: Math.floor(baseValue * 0.5),
        currentBid: Math.floor(baseValue * 0.5),
        buyoutPrice: Math.floor(baseValue * 2.5),
        highestBidderId: undefined,
        ownerId: 'system',
    };
    
    // --- STAT CALCULATION LOGIC ---
    if (newKb.worldConfig?.isCultivationEnabled && newAuctionSlave.realm) {
        const slaveRace = newAuctionSlave.race || 'Nhân Tộc';
        const raceSystemForSlave = newKb.worldConfig.raceCultivationSystems.find(rs => rs.raceName === slaveRace) 
                                 || newKb.worldConfig.raceCultivationSystems[0];
        
        if (raceSystemForSlave) {
            const slaveRealmProgression = raceSystemForSlave.realmSystem.split(' - ').map(s => s.trim()).filter(Boolean);
            const calculatedBaseStats = calculateRealmBaseStats(
                newAuctionSlave.realm,
                slaveRealmProgression,
                newKb.currentRealmBaseStats
            );
            
            if (!newAuctionSlave.stats) newAuctionSlave.stats = {};

            newAuctionSlave.stats = {
                ...newAuctionSlave.stats,
                ...calculatedBaseStats,
                maxSinhLuc: calculatedBaseStats.baseMaxSinhLuc,
                maxLinhLuc: calculatedBaseStats.baseMaxLinhLuc,
                sucTanCong: calculatedBaseStats.baseSucTanCong,
                maxKinhNghiem: calculatedBaseStats.baseMaxKinhNghiem,
                sinhLuc: calculatedBaseStats.baseMaxSinhLuc,
                linhLuc: calculatedBaseStats.baseMaxLinhLuc,
                kinhNghiem: 0,
            };
            
            // --- OVERRIDE VALUE WITH SYSTEMIC CALCULATION ---
            const calculatedValue = calculateSlaveValue(newAuctionSlave, slaveRealmProgression);
            newAuctionSlave.value = calculatedValue;
            newAuctionSlave.startingPrice = Math.floor(calculatedValue * 0.5);
            newAuctionSlave.currentBid = newAuctionSlave.startingPrice;
            newAuctionSlave.buyoutPrice = Math.floor(calculatedValue * 2.5);
            // --- END OVERRIDE ---
        }
    }

    newKb.slaveAuctionState.items.push(newAuctionSlave);
    
    systemMessages.push({
        id: `auction-slave-added-${newAuctionSlave.id}`,
        type: 'system',
        content: `Nô lệ đấu giá mới được thêm: ${newAuctionSlave.name}.`,
        timestamp: Date.now(),
        turnNumber: turnForSystemMessages
    });

    return { updatedKb: newKb, systemMessages };
};