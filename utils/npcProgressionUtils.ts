

import { KnowledgeBase, GameMessage, NPC, Wife, Slave } from '../types';
import { TU_CHAT_MULTIPLIERS, NPC_BASE_EXP_PERCENTAGE, NPC_BOTTLENECK_DURATION_TURNS, SUB_REALM_NAMES, VIETNAMESE } from '../constants';
import { calculateRealmBaseStats } from './statsCalculationUtils';

export const progressNpcCultivation = (currentKb: KnowledgeBase): { updatedKb: KnowledgeBase; systemMessages: GameMessage[] } => {
    const newKb = JSON.parse(JSON.stringify(currentKb)) as KnowledgeBase;
    
    if (!newKb.worldConfig?.isCultivationEnabled || !newKb.worldConfig.raceCultivationSystems || newKb.worldConfig.raceCultivationSystems.length === 0) {
        return { updatedKb: newKb, systemMessages: [] };
    }
    
    const allCharactersToProgress: (NPC | Wife | Slave)[] = [
        ...newKb.discoveredNPCs,
        ...newKb.wives,
        ...newKb.slaves,
    ];

    allCharactersToProgress.forEach(character => {
        // Assign default aptitude if missing to prevent skipping
        if (newKb.worldConfig?.isCultivationEnabled && character.realm && character.realm !== VIETNAMESE.mortalRealmName && !character.tuChat) {
            character.tuChat = "Trung Đẳng";
        }

        if (!character.realm || character.realm === VIETNAMESE.mortalRealmName || !character.tuChat) {
            return; // Skip characters without a realm or aptitude
        }
        if (!character.stats) {
            character.stats = {};
        }

        // Determine the correct realm progression list for the character's race
        const characterRace = character.race || 'Nhân Tộc'; // Default to human race
        const raceSystem = newKb.worldConfig!.raceCultivationSystems.find(rs => rs.raceName === characterRace) || newKb.worldConfig!.raceCultivationSystems[0];
        
        if (!raceSystem || !raceSystem.realmSystem) {
            console.warn(`No realm system found for race: ${characterRace}. Skipping progression for ${character.name}.`);
            return; // Skip if no valid system found
        }
        
        const characterRealmProgression = raceSystem.realmSystem.split(' - ').map(s => s.trim()).filter(Boolean);

        // Handle Bottleneck
        if (character.isBinhCanh) {
            character.binhCanhCounter = (character.binhCanhCounter || 0) + 1;
            if (character.binhCanhCounter >= NPC_BOTTLENECK_DURATION_TURNS) {
                const oldRealm = character.realm;
                const currentMainRealmIndex = characterRealmProgression.findIndex(r => oldRealm.startsWith(r));
                
                if (currentMainRealmIndex !== -1 && currentMainRealmIndex < characterRealmProgression.length - 1) {
                    const nextMainRealm = characterRealmProgression[currentMainRealmIndex + 1];
                    character.realm = `${nextMainRealm} ${SUB_REALM_NAMES[0]}`;
                    
                    // Reset state
                    character.isBinhCanh = false;
                    character.binhCanhCounter = 0;
                    if(character.stats) character.stats.kinhNghiem = 0;

                    // IMPORTANT: Pass the correct realm list to the calculation function
                    const newBaseStats = calculateRealmBaseStats(character.realm, characterRealmProgression, newKb.currentRealmBaseStats);
                    character.stats = {
                        ...character.stats,
                        ...newBaseStats,
                        maxSinhLuc: newBaseStats.baseMaxSinhLuc,
                        maxLinhLuc: newBaseStats.baseMaxLinhLuc,
                        sucTanCong: newBaseStats.baseSucTanCong,
                        maxKinhNghiem: newBaseStats.baseMaxKinhNghiem,
                        sinhLuc: newBaseStats.baseMaxSinhLuc, // Full heal
                        linhLuc: newBaseStats.baseMaxLinhLuc,   // Full heal
                    };

                    // Grant lifespan bonus on major breakthrough
                    const lifespanBonus = 100 * Math.pow(1.5, currentMainRealmIndex);
                    if (character.stats) {
                        if (character.stats.maxThoNguyen) {
                            character.stats.maxThoNguyen += lifespanBonus;
                        } else {
                            character.stats.maxThoNguyen = 120 + lifespanBonus;
                        }
                        if (character.stats.thoNguyen) {
                            character.stats.thoNguyen += lifespanBonus;
                        } else {
                            character.stats.thoNguyen = character.stats.maxThoNguyen;
                        }
                    }
                }
            }
            return; // No EXP gain during bottleneck
        }

        // EXP Gain
        if (typeof character.stats.kinhNghiem !== 'number' || isNaN(character.stats.kinhNghiem)) {
            character.stats.kinhNghiem = 0;
        }
        const tuChatMultiplier = TU_CHAT_MULTIPLIERS[character.tuChat] || 1.0;
        const maxExpForCurrentLevel = character.stats.maxKinhNghiem || 100;
        const expGain = Math.round(NPC_BASE_EXP_PERCENTAGE * tuChatMultiplier * maxExpForCurrentLevel);
        character.stats.kinhNghiem += expGain;

        // Level Up Logic
        while (character.stats.kinhNghiem >= (character.stats.maxKinhNghiem || Infinity)) {
            const realmBeforeLevelUp = character.realm;
            character.stats.kinhNghiem -= character.stats.maxKinhNghiem!;

            let currentMainRealmName = "";
            let currentSubRealmName = "";
            // IMPORTANT: Use the character's specific realm list
            const sortedMainRealms = [...characterRealmProgression].sort((a,b) => b.length - a.length);
            for(const r of sortedMainRealms){
                if(realmBeforeLevelUp.startsWith(r)){
                    currentMainRealmName = r;
                    currentSubRealmName = realmBeforeLevelUp.substring(r.length).trim();
                    break;
                }
            }

            if (!currentMainRealmName || !SUB_REALM_NAMES.includes(currentSubRealmName as any)) {
                character.stats.kinhNghiem = character.stats.maxKinhNghiem! - 1;
                break;
            }

            const currentSubRealmIndex = SUB_REALM_NAMES.indexOf(currentSubRealmName as any);
            
            if (currentSubRealmIndex === SUB_REALM_NAMES.length - 1) {
                character.isBinhCanh = true;
                character.binhCanhCounter = 1;
                character.stats.kinhNghiem = character.stats.maxKinhNghiem!;
                break;
            }

            const nextSubRealmName = SUB_REALM_NAMES[currentSubRealmIndex + 1];
            character.realm = `${currentMainRealmName} ${nextSubRealmName}`;
            
            // IMPORTANT: Pass the correct realm list to the calculation function
            const newBaseStats = calculateRealmBaseStats(character.realm, characterRealmProgression, newKb.currentRealmBaseStats);
            character.stats = {
                ...character.stats,
                ...newBaseStats,
                maxSinhLuc: newBaseStats.baseMaxSinhLuc,
                maxLinhLuc: newBaseStats.baseMaxLinhLuc,
                sucTanCong: newBaseStats.baseSucTanCong,
                maxKinhNghiem: newBaseStats.baseMaxKinhNghiem,
            };
        }
    });

    return { updatedKb: newKb, systemMessages: [] };
};
