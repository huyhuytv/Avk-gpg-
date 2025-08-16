
import { KnowledgeBase, GameMessage, VectorMetadata } from './../types';
import { parseTagValue } from './parseTagValue'; 
import { processPlayerStatsInit, processStatsUpdate, processRemoveBinhCanhEffect, processBecomeSpecialStatus, processPlayerSpecialStatusUpdate, processBecomeFree } from './tagProcessors/statsTagProcessor';
import { processItemAcquired, processItemConsumed, processItemUpdate, processShopItem } from './tagProcessors/itemTagProcessor';
import { processSkillLearned, processSkillUpdate } from './tagProcessors/skillTagProcessor';
import { 
    processQuestAssigned, 
    processQuestUpdated, 
    processQuestCompleted,
    processQuestFailed,    
    processObjectiveUpdate 
} from './tagProcessors/questTagProcessor';
import { 
    processNpc, 
    processNpcUpdate, 
    processNpcRemove 
} from './tagProcessors/npcTagProcessor';
import { 
    processYeuThu, 
    processYeuThuRemove 
} from './tagProcessors/yeuThuTagProcessor';
import { 
    processMainLocation, 
    processSubLocation, 
    processLocationUpdate, 
    processLocationChange 
} from './tagProcessors/locationTagProcessor';
import { 
    processFactionDiscovered, 
    processFactionUpdate, 
    processFactionRemove 
} from './tagProcessors/factionTagProcessor';
import { 
    processWorldLoreAdd, 
    processWorldLoreUpdate 
} from './tagProcessors/worldLoreTagProcessor';
import { processSetCombatStatus, processBeginCombat } from './tagProcessors/combatTagProcessor';
import { 
    processCompanionAdd, 
    processCompanionLeave, 
    processCompanionStatsUpdate 
} from './tagProcessors/companionTagProcessor';
import { processMessage, processRealmList } from './tagProcessors/systemInfoTagProcessor';
import { processStatusEffectApply, processStatusEffectRemove } from './tagProcessors/statusEffectTagProcessor';
import { processProfessionLearned } from './tagProcessors/professionTagProcessor';
import { processAuctionItem, processNpcBid, processAuctionNpc } from './tagProcessors/auctionTagProcessor';
import { processChangeTime } from './tagProcessors/timeTagProcessor';
import { processPrisonerAdd, processWifeAdd, processSlaveAdd, processWifeUpdate, processSlaveUpdate, processPrisonerUpdate, processWifeRemove, processSlaveRemove, processPrisonerRemove } from './tagProcessors/companionAndPrisonerTagProcessor';
import { processMasterUpdate } from './tagProcessors/masterTagProcessor';
import { processSlaveForSale, processAuctionSlave } from './tagProcessors/slaveTagProcessor';
import { processEventTriggered, processEventUpdate, processEventDetailRevealed } from './tagProcessors/eventTagProcessor';
import { generateEmbeddings } from './../services/embeddingService';


export { parseTagValue }; 

const addOrUpdateVectorMetadata = (
    metadataQueue: VectorMetadata[],
    newMetadata: VectorMetadata
) => {
    // If an update for the same entity is already in the queue, replace it to avoid redundant processing
    const existingIndex = metadataQueue.findIndex(m => m.entityId === newMetadata.entityId);
    if (existingIndex > -1) {
        metadataQueue[existingIndex] = newMetadata;
    } else {
        metadataQueue.push(newMetadata);
    }
};

export const performTagProcessing = async (
    currentKb: KnowledgeBase, 
    tagBatch: string[], 
    turnForSystemMessages: number,
    setKnowledgeBaseDirectly: React.Dispatch<React.SetStateAction<KnowledgeBase>>, 
    logNpcAvatarPromptCallback?: (prompt: string) => void 
): Promise<{ 
    newKb: KnowledgeBase;
    turnIncrementedByTag: boolean;
    systemMessagesFromTags: GameMessage[];
    realmChangedByTag: boolean;
    appliedBinhCanhViaTag: boolean;
    removedBinhCanhViaTag: boolean;
}> => {
    let workingKb: KnowledgeBase = JSON.parse(JSON.stringify(currentKb));
    let turnIncrementedByAnyTag = false;
    const allSystemMessages: GameMessage[] = [];
    let realmChangedByAnyTag = false;
    let removedBinhCanhByAnyTag = false;
    const metadataToVectorize: VectorMetadata[] = [];

    for (const originalTag of tagBatch) { 
        const mainMatch = originalTag.match(/\[(.*?)(?::\s*(.*))?\]$/s);
        if (!mainMatch || !mainMatch[1]) {
             console.warn(`Malformed tag structure: ${originalTag}`);
             allSystemMessages.push({
                 id: 'malformed-tag-structure-' + Date.now(), type: 'system',
                 content: `[DEBUG] Tag có cấu trúc không hợp lệ: ${originalTag}`,
                 timestamp: Date.now(), turnNumber: turnForSystemMessages
             });
             continue; 
        }
        const tagName = mainMatch[1].trim().toUpperCase();
        const rawTagParameterString = mainMatch[2] ? mainMatch[2].trim() : '';
        
        let tempCleanedParams = rawTagParameterString.replace(/\\\\"/g, '\\"').replace(/\\\\'/g, "\\'"); 
        tempCleanedParams = tempCleanedParams.replace(/\\"/g, '"').replace(/\\'/g, "'"); 
        const cleanedTagParameterString = tempCleanedParams;
        
        let tagParams: Record<string, string> = {};
         if (cleanedTagParameterString) {
            if (tagName === 'MESSAGE' && !cleanedTagParameterString.includes('=')) {
                tagParams = { message: cleanedTagParameterString.replace(/^"|"$/g, '') };
            } else {
                tagParams = parseTagValue(cleanedTagParameterString);
            }
        }

        try {
            switch (tagName) {
                 case 'EVENT_TRIGGERED': {
                    const { updatedKb, systemMessages } = processEventTriggered(workingKb, tagParams, turnForSystemMessages);
                    workingKb = updatedKb;
                    allSystemMessages.push(...systemMessages);
                    break;
                }
                case 'EVENT_UPDATE': {
                    const { updatedKb, systemMessages } = processEventUpdate(workingKb, tagParams, turnForSystemMessages);
                    workingKb = updatedKb;
                    allSystemMessages.push(...systemMessages);
                    break;
                }
                case 'EVENT_DETAIL_REVEALED': {
                    const { updatedKb, systemMessages } = processEventDetailRevealed(workingKb, tagParams, turnForSystemMessages);
                    workingKb = updatedKb;
                    allSystemMessages.push(...systemMessages);
                    break;
                }
                 case 'ITEM_UPDATE': {
                    const { updatedKb, systemMessages, updatedVectorMetadata } = processItemUpdate(workingKb, tagParams, turnForSystemMessages);
                    workingKb = updatedKb;
                    allSystemMessages.push(...systemMessages);
                    if (updatedVectorMetadata) addOrUpdateVectorMetadata(metadataToVectorize, updatedVectorMetadata);
                    break;
                }
                case 'SKILL_UPDATE': { 
                    const { updatedKb, systemMessages, updatedVectorMetadata } = processSkillUpdate(workingKb, tagParams, turnForSystemMessages);
                    workingKb = updatedKb;
                    allSystemMessages.push(...systemMessages);
                    if (updatedVectorMetadata) addOrUpdateVectorMetadata(metadataToVectorize, updatedVectorMetadata);
                    break;
                }
                 case 'NPC_UPDATE': {
                    const result = await processNpcUpdate(workingKb, tagParams, turnForSystemMessages, setKnowledgeBaseDirectly, logNpcAvatarPromptCallback);
                    workingKb = result.updatedKb;
                    allSystemMessages.push(...result.systemMessages);
                    if (result.updatedVectorMetadata) addOrUpdateVectorMetadata(metadataToVectorize, result.updatedVectorMetadata);
                    break;
                }
                case 'WIFE_UPDATE': {
                    const { updatedKb, systemMessages, updatedVectorMetadata } = processWifeUpdate(workingKb, tagParams, turnForSystemMessages);
                    workingKb = updatedKb;
                    allSystemMessages.push(...systemMessages);
                    if (updatedVectorMetadata) addOrUpdateVectorMetadata(metadataToVectorize, updatedVectorMetadata);
                    break;
                }
                case 'SLAVE_UPDATE': {
                    const { updatedKb, systemMessages, updatedVectorMetadata } = processSlaveUpdate(workingKb, tagParams, turnForSystemMessages);
                    workingKb = updatedKb;
                    allSystemMessages.push(...systemMessages);
                    if (updatedVectorMetadata) addOrUpdateVectorMetadata(metadataToVectorize, updatedVectorMetadata);
                    break;
                }
                case 'PRISONER_UPDATE': {
                    const { updatedKb, systemMessages, updatedVectorMetadata } = processPrisonerUpdate(workingKb, tagParams, turnForSystemMessages);
                    workingKb = updatedKb;
                    allSystemMessages.push(...systemMessages);
                    if (updatedVectorMetadata) addOrUpdateVectorMetadata(metadataToVectorize, updatedVectorMetadata);
                    break;
                }
                case 'LOCATION_UPDATE': { 
                    const { updatedKb, systemMessages, updatedVectorMetadata } = processLocationUpdate(workingKb, tagParams, turnForSystemMessages);
                    workingKb = updatedKb;
                    allSystemMessages.push(...systemMessages);
                    if (updatedVectorMetadata) addOrUpdateVectorMetadata(metadataToVectorize, updatedVectorMetadata);
                    break;
                }
                case 'WORLD_LORE_UPDATE': { 
                    const { updatedKb, systemMessages, updatedVectorMetadata } = processWorldLoreUpdate(workingKb, tagParams, turnForSystemMessages);
                    workingKb = updatedKb;
                    allSystemMessages.push(...systemMessages);
                    if (updatedVectorMetadata) addOrUpdateVectorMetadata(metadataToVectorize, updatedVectorMetadata);
                    break;
                }
                case 'FACTION_UPDATE': { 
                    const { updatedKb, systemMessages, updatedVectorMetadata } = processFactionUpdate(workingKb, tagParams, turnForSystemMessages);
                    workingKb = updatedKb;
                    allSystemMessages.push(...systemMessages);
                    if (updatedVectorMetadata) addOrUpdateVectorMetadata(metadataToVectorize, updatedVectorMetadata);
                    break;
                }
                case 'SLAVE_FOR_SALE': {
                    const { updatedKb, systemMessages } = processSlaveForSale(workingKb, tagParams, turnForSystemMessages);
                    workingKb = updatedKb;
                    allSystemMessages.push(...systemMessages);
                    break;
                }
                case 'AUCTION_SLAVE': {
                    const { updatedKb, systemMessages } = processAuctionSlave(workingKb, tagParams, turnForSystemMessages);
                    workingKb = updatedKb;
                    allSystemMessages.push(...systemMessages);
                    break;
                }
                case 'MASTER_UPDATE': {
                    const { updatedKb, systemMessages, updatedVectorMetadata } = processMasterUpdate(workingKb, tagParams, turnForSystemMessages);
                    workingKb = updatedKb;
                    allSystemMessages.push(...systemMessages);
                    if (updatedVectorMetadata) addOrUpdateVectorMetadata(metadataToVectorize, updatedVectorMetadata);
                    break;
                }
                case 'CHANGE_TIME': {
                    const { updatedKb, systemMessages } = processChangeTime(workingKb, tagParams, turnForSystemMessages);
                    workingKb = updatedKb;
                    allSystemMessages.push(...systemMessages);
                    break;
                }
                case 'PLAYER_STATS_INIT': {
                    const { updatedKb, systemMessages, realmChanged, turnIncremented } = processPlayerStatsInit(workingKb, tagParams);
                    workingKb = updatedKb;
                    allSystemMessages.push(...systemMessages);
                    if (realmChanged) realmChangedByAnyTag = true;
                    if (turnIncremented) turnIncrementedByAnyTag = true;
                    break;
                }
                case 'STATS_UPDATE': {
                    const { updatedKb, systemMessages, realmChanged, turnIncremented, removedBinhCanh } = processStatsUpdate(workingKb, tagParams, turnForSystemMessages);
                    workingKb = updatedKb;
                    allSystemMessages.push(...systemMessages);
                    if (realmChanged) realmChangedByAnyTag = true;
                    if (turnIncremented) turnIncrementedByAnyTag = true;
                    if (removedBinhCanh) removedBinhCanhByAnyTag = true;
                    break;
                }
                case 'BECOMEPRISONER':
                case 'BECOMESLAVE': {
                    const { updatedKb, systemMessages, newVectorMetadata } = processBecomeSpecialStatus(workingKb, tagParams, tagName as 'BECOMEPRISONER' | 'BECOMESLAVE', turnForSystemMessages);
                    workingKb = updatedKb;
                    allSystemMessages.push(...systemMessages);
                    if (newVectorMetadata) addOrUpdateVectorMetadata(metadataToVectorize, newVectorMetadata);
                    break;
                }
                case 'PLAYER_SPECIAL_STATUS_UPDATE': {
                    const { updatedKb, systemMessages } = processPlayerSpecialStatusUpdate(workingKb, tagParams, turnForSystemMessages);
                    workingKb = updatedKb;
                    allSystemMessages.push(...systemMessages);
                    break;
                }
                case 'BECOMEFREE': {
                    const { updatedKb, systemMessages } = processBecomeFree(workingKb, turnForSystemMessages);
                    workingKb = updatedKb;
                    allSystemMessages.push(...systemMessages);
                    break;
                }
                case 'ITEM_ACQUIRED': {
                    const { updatedKb, systemMessages, newVectorMetadata } = processItemAcquired(workingKb, tagParams, turnForSystemMessages);
                    workingKb = updatedKb;
                    allSystemMessages.push(...systemMessages);
                    if (newVectorMetadata) addOrUpdateVectorMetadata(metadataToVectorize, newVectorMetadata);
                    break;
                }
                case 'SHOP_ITEM': {
                    const { updatedKb, systemMessages } = processShopItem(workingKb, tagParams, turnForSystemMessages);
                    workingKb = updatedKb;
                    allSystemMessages.push(...systemMessages);
                    break;
                }
                case 'ITEM_CONSUMED': {
                    const { updatedKb, systemMessages } = processItemConsumed(workingKb, tagParams, turnForSystemMessages);
                    workingKb = updatedKb;
                    allSystemMessages.push(...systemMessages);
                    break;
                }
                case 'SKILL_LEARNED': {
                    const { updatedKb, systemMessages, newVectorMetadata } = processSkillLearned(workingKb, tagParams, turnForSystemMessages);
                    workingKb = updatedKb;
                    allSystemMessages.push(...systemMessages);
                    if (newVectorMetadata) addOrUpdateVectorMetadata(metadataToVectorize, newVectorMetadata);
                    break;
                }
                case 'PROFESSION_LEARNED': {
                    const { updatedKb, systemMessages } = processProfessionLearned(workingKb, tagParams, turnForSystemMessages);
                    workingKb = updatedKb;
                    allSystemMessages.push(...systemMessages);
                    break;
                }
                case 'QUEST_ASSIGNED': {
                    const { updatedKb, systemMessages, newVectorMetadata } = processQuestAssigned(workingKb, tagParams, turnForSystemMessages);
                    workingKb = updatedKb;
                    allSystemMessages.push(...systemMessages);
                    if (newVectorMetadata) addOrUpdateVectorMetadata(metadataToVectorize, newVectorMetadata);
                    break;
                }
                case 'QUEST_UPDATED': {
                    const { updatedKb, systemMessages } = processQuestUpdated(workingKb, tagParams, turnForSystemMessages);
                    workingKb = updatedKb;
                    allSystemMessages.push(...systemMessages);
                    break;
                }
                case 'QUEST_COMPLETED': {
                    const { updatedKb, systemMessages } = processQuestCompleted(workingKb, tagParams, turnForSystemMessages);
                    workingKb = updatedKb;
                    allSystemMessages.push(...systemMessages);
                    break;
                }
                case 'QUEST_FAILED': {
                    const { updatedKb, systemMessages } = processQuestFailed(workingKb, tagParams, turnForSystemMessages);
                    workingKb = updatedKb;
                    allSystemMessages.push(...systemMessages);
                    break;
                }
                case 'OBJECTIVE_UPDATE': {
                    const { updatedKb, systemMessages } = processObjectiveUpdate(workingKb, tagParams, turnForSystemMessages);
                    workingKb = updatedKb;
                    allSystemMessages.push(...systemMessages);
                    break;
                }
                case 'NPC': { 
                    const result = await processNpc(workingKb, tagParams, turnForSystemMessages, setKnowledgeBaseDirectly, logNpcAvatarPromptCallback); 
                    workingKb = result.updatedKb;
                    allSystemMessages.push(...result.systemMessages);
                    if (result.newVectorMetadata) addOrUpdateVectorMetadata(metadataToVectorize, result.newVectorMetadata);
                    break;
                }
                case 'YEUTHU': {
                    const result = await processYeuThu(workingKb, tagParams, turnForSystemMessages, setKnowledgeBaseDirectly, logNpcAvatarPromptCallback); 
                    workingKb = result.updatedKb;
                    allSystemMessages.push(...result.systemMessages);
                    if (result.newVectorMetadata) addOrUpdateVectorMetadata(metadataToVectorize, result.newVectorMetadata);
                    break;
                }
                case 'MAINLOCATION': {
                    const { updatedKb, systemMessages, newVectorMetadata } = processMainLocation(workingKb, tagParams, turnForSystemMessages);
                    workingKb = updatedKb;
                    allSystemMessages.push(...systemMessages);
                    if (newVectorMetadata) addOrUpdateVectorMetadata(metadataToVectorize, newVectorMetadata);
                    break;
                }
                case 'SUBLOCATION': {
                    const { updatedKb, systemMessages, newVectorMetadata } = processSubLocation(workingKb, tagParams, turnForSystemMessages);
                    workingKb = updatedKb;
                    allSystemMessages.push(...systemMessages);
                    if (newVectorMetadata) addOrUpdateVectorMetadata(metadataToVectorize, newVectorMetadata);
                    break;
                }
                case 'LOCATION_CHANGE': {
                    const { updatedKb, systemMessages } = await processLocationChange(workingKb, tagParams, turnForSystemMessages);
                    workingKb = updatedKb;
                    allSystemMessages.push(...systemMessages);
                    break;
                }
                case 'WORLD_LORE_ADD': {
                    const { updatedKb, systemMessages, newVectorMetadata } = processWorldLoreAdd(workingKb, tagParams, turnForSystemMessages);
                    workingKb = updatedKb;
                    allSystemMessages.push(...systemMessages);
                    if (newVectorMetadata) addOrUpdateVectorMetadata(metadataToVectorize, newVectorMetadata);
                    break;
                }
                case 'FACTION_DISCOVERED': {
                    const { updatedKb, systemMessages, newVectorMetadata } = processFactionDiscovered(workingKb, tagParams, turnForSystemMessages);
                    workingKb = updatedKb;
                    allSystemMessages.push(...systemMessages);
                    if (newVectorMetadata) addOrUpdateVectorMetadata(metadataToVectorize, newVectorMetadata);
                    break;
                }
                 case 'FACTION_REMOVE': { 
                    const { updatedKb, systemMessages } = processFactionRemove(workingKb, tagParams, turnForSystemMessages);
                    workingKb = updatedKb;
                    allSystemMessages.push(...systemMessages);
                    break;
                }
                case 'NPC_REMOVE': {
                    const { updatedKb, systemMessages } = processNpcRemove(workingKb, tagParams, turnForSystemMessages);
                    workingKb = updatedKb;
                    allSystemMessages.push(...systemMessages);
                    break;
                }
                case 'YEUTHU_REMOVE': {
                    const { updatedKb, systemMessages } = processYeuThuRemove(workingKb, tagParams, turnForSystemMessages);
                    workingKb = updatedKb;
                    allSystemMessages.push(...systemMessages);
                    break;
                }
                case 'SET_COMBAT_STATUS': {
                    const { updatedKb } = processSetCombatStatus(workingKb, tagParams);
                    workingKb = updatedKb;
                    break;
                }
                case 'BEGIN_COMBAT': { // Added
                    const { updatedKb, systemMessages } = processBeginCombat(workingKb, tagParams);
                    workingKb = updatedKb;
                    allSystemMessages.push(...systemMessages);
                    break;
                }
                case 'COMPANION_JOIN':
                case 'COMPANION_ADD': {
                    const { updatedKb, systemMessages } = processCompanionAdd(workingKb, tagParams);
                    workingKb = updatedKb;
                    allSystemMessages.push(...systemMessages);
                    break;
                }
                case 'COMPANION_LEAVE': {
                    const { updatedKb, systemMessages } = processCompanionLeave(workingKb, tagParams);
                    workingKb = updatedKb;
                    allSystemMessages.push(...systemMessages);
                    break;
                }
                case 'COMPANION_STATS_UPDATE': {
                    const { updatedKb, systemMessages } = processCompanionStatsUpdate(workingKb, tagParams);
                    workingKb = updatedKb;
                    allSystemMessages.push(...systemMessages);
                    break;
                }
                 case 'PRISONER_ADD': {
                    const { updatedKb, systemMessages, newVectorMetadata } = processPrisonerAdd(workingKb, tagParams, turnForSystemMessages);
                    workingKb = updatedKb;
                    allSystemMessages.push(...systemMessages);
                    if (newVectorMetadata) addOrUpdateVectorMetadata(metadataToVectorize, newVectorMetadata);
                    break;
                }
                case 'WIFE_ADD': {
                    const { updatedKb, systemMessages, newVectorMetadata } = processWifeAdd(workingKb, tagParams, turnForSystemMessages);
                    workingKb = updatedKb;
                    allSystemMessages.push(...systemMessages);
                    if (newVectorMetadata) addOrUpdateVectorMetadata(metadataToVectorize, newVectorMetadata);
                    break;
                }
                case 'SLAVE_ADD': {
                    const { updatedKb, systemMessages, newVectorMetadata } = processSlaveAdd(workingKb, tagParams, turnForSystemMessages);
                    workingKb = updatedKb;
                    allSystemMessages.push(...systemMessages);
                    if (newVectorMetadata) addOrUpdateVectorMetadata(metadataToVectorize, newVectorMetadata);
                    break;
                }
                case 'WIFE_REMOVE': {
                    const { updatedKb, systemMessages } = processWifeRemove(workingKb, tagParams, turnForSystemMessages);
                    workingKb = updatedKb;
                    allSystemMessages.push(...systemMessages);
                    break;
                }
                case 'SLAVE_REMOVE': {
                    const { updatedKb, systemMessages } = processSlaveRemove(workingKb, tagParams, turnForSystemMessages);
                    workingKb = updatedKb;
                    allSystemMessages.push(...systemMessages);
                    break;
                }
                case 'PRISONER_REMOVE': {
                    const { updatedKb, systemMessages } = processPrisonerRemove(workingKb, tagParams, turnForSystemMessages);
                    workingKb = updatedKb;
                    allSystemMessages.push(...systemMessages);
                    break;
                }
                case 'MESSAGE': {
                    const msg = processMessage(tagParams, turnForSystemMessages);
                    if (msg) allSystemMessages.push(msg);
                    break;
                }
                 case 'REALM_LIST': {
                    const { updatedKb } = processRealmList(workingKb, tagParams);
                    workingKb = updatedKb;
                    break;
                }
                case 'REMOVE_BINH_CANH_EFFECT': {
                    const { updatedKb, systemMessages, removedBinhCanh } = processRemoveBinhCanhEffect(workingKb, tagParams, turnForSystemMessages);
                    workingKb = updatedKb;
                    allSystemMessages.push(...systemMessages);
                    if (removedBinhCanh) removedBinhCanhByAnyTag = true;
                    break;
                }
                case 'STATUS_EFFECT_APPLY': {
                    const { updatedKb, systemMessages } = processStatusEffectApply(workingKb, tagParams, turnForSystemMessages);
                    workingKb = updatedKb;
                    allSystemMessages.push(...systemMessages);
                    break;
                }
                case 'STATUS_EFFECT_REMOVE': {
                    const { updatedKb, systemMessages } = processStatusEffectRemove(workingKb, tagParams, turnForSystemMessages);
                    workingKb = updatedKb;
                    allSystemMessages.push(...systemMessages);
                    break;
                }
                case 'AUCTION_ITEM': {
                    const { updatedKb, systemMessages } = processAuctionItem(workingKb, tagParams, turnForSystemMessages);
                    workingKb = updatedKb;
                    allSystemMessages.push(...systemMessages);
                    break;
                }
                 case 'AUCTION_NPC': {
                    const { updatedKb, systemMessages } = processAuctionNpc(workingKb, tagParams, turnForSystemMessages);
                    workingKb = updatedKb;
                    allSystemMessages.push(...systemMessages);
                    break;
                }
                case 'NPC_BID': {
                    const { updatedKb, systemMessages } = processNpcBid(workingKb, tagParams, turnForSystemMessages);
                    workingKb = updatedKb;
                    allSystemMessages.push(...systemMessages);
                    break;
                }
                default:
                    if (!tagName.startsWith("GENERATED_") && tagName !== "CHOICE") {
                        console.warn(`Unknown tag: "${tagName}". Full tag: "${originalTag}"`);
                        allSystemMessages.push({
                             id: 'unknown-tag-' + Date.now(), type: 'system',
                             content: `[DEBUG] Tag không xác định: "${tagName}". Full tag: "${originalTag}" (Cleaned params: "${cleanedTagParameterString}")`,
                             timestamp: Date.now(), turnNumber: turnForSystemMessages
                         });
                    }
            }
        } catch (error) {
             console.error(`Error processing tag "${tagName}":`, error, "Original tag:", originalTag, "Params:", tagParams);
             allSystemMessages.push({
                id: 'tag-processing-error-' + Date.now(), type: 'system',
                content: `Lỗi xử lý tag ${tagName}: ${error instanceof Error ? error.message : "Không rõ"}`,
                timestamp: Date.now(), turnNumber: turnForSystemMessages
            });
        }
    } 

    if (metadataToVectorize.length > 0) {
        try {
            console.log(`[RAG Update] Bắt đầu vector hóa ${metadataToVectorize.length} thực thể...`);
            const textChunks = metadataToVectorize.map(m => m.text);
            const newVectors = await generateEmbeddings(textChunks);
            
            if (!workingKb.ragVectorStore) {
                workingKb.ragVectorStore = { vectors: [], metadata: [] };
            }

            metadataToVectorize.forEach((metadata, index) => {
                const newVector = newVectors[index];
                if (!newVector) return;

                const existingIndex = workingKb.ragVectorStore!.metadata.findIndex(m => m.entityId === metadata.entityId);
                if (existingIndex > -1) {
                    // Update existing vector and metadata
                    workingKb.ragVectorStore!.vectors[existingIndex] = newVector;
                    workingKb.ragVectorStore!.metadata[existingIndex] = metadata;
                } else {
                    // Add new vector and metadata
                    workingKb.ragVectorStore!.vectors.push(newVector);
                    workingKb.ragVectorStore!.metadata.push(metadata);
                }
            });
            
            console.log(`[RAG Update] Vector hóa hoàn tất. VectorStore hiện có ${workingKb.ragVectorStore.vectors.length} vector.`);
        } catch (embeddingError) {
            console.error("Failed to update RAG VectorStore during tag processing:", embeddingError);
            allSystemMessages.push({
                id: 'rag-update-error-' + Date.now(),
                type: 'error',
                content: `Lỗi cập nhật RAG: ${embeddingError instanceof Error ? embeddingError.message : 'Lỗi không xác định'}`,
                timestamp: Date.now(),
                turnNumber: turnForSystemMessages
            });
        }
    }

    return { 
        newKb: workingKb, 
        turnIncrementedByTag: turnIncrementedByAnyTag, 
        systemMessagesFromTags: allSystemMessages, 
        realmChangedByTag: realmChangedByAnyTag, 
        appliedBinhCanhViaTag: false, // This was deprecated, keeping structure
        removedBinhCanhViaTag: removedBinhCanhByAnyTag 
    };
};
