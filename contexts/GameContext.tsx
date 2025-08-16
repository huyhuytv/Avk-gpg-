



import React, { createContext, ReactNode, useRef, useState, useCallback, useEffect } from 'react';
import * as jsonpatch from 'fast-json-patch';
import { GameScreen, KnowledgeBase, GameMessage, WorldSettings, PlayerStats, ApiConfig, SaveGameData, StorageType, SaveGameMeta, RealmBaseStatDefinition, TurnHistoryEntry, StyleSettings, PlayerActionInputType, EquipmentSlotId, Item as ItemType, AvatarUploadHandlers, NPC, GameLocation, ResponseLength, StorageSettings, FindLocationParams, Skill, Prisoner, Wife, Slave, CombatEndPayload, AuctionSlave, CombatDispositionMap } from '../types';
import { INITIAL_KNOWLEDGE_BASE, VIETNAMESE, APP_VERSION, MAX_AUTO_SAVE_SLOTS, TURNS_PER_PAGE, DEFAULT_TIERED_STATS, KEYFRAME_INTERVAL, EQUIPMENT_SLOTS_CONFIG } from '../constants';
import { saveGameToIndexedDB, loadGamesFromIndexedDB, loadSpecificGameFromIndexedDB, deleteGameFromIndexedDB, importGameToIndexedDB, resetDBConnection as resetIndexedDBConnection } from '../services/indexedDBService';
import * as GameTemplates from '../templates';
import { useAppInitialization } from '../hooks/useAppInitialization';
import { useGameNotifications, NotificationState } from '../hooks/useGameNotifications';
import { useGameData } from '../hooks/useGameData';
import { useGameActions } from '../hooks/useGameActions';
import { useGameplayModals } from '../hooks/useGameplayModals';
import type { GameEntity, GameEntityType } from '../hooks/types'; // Import modal hook and types
import { calculateRealmBaseStats, calculateEffectiveStats, getMessagesForPage, performTagProcessing, handleLevelUps, progressNpcCultivation, updateGameEventsStatus } from '../utils/gameLogicUtils'; 
import { getApiSettings as getGeminiApiSettings, countTokens, generateCraftedItemViaAI, generateDefeatConsequence, summarizeTurnHistory } from '../services/geminiService'; 
import { uploadImageToCloudinary } from '../services/cloudinaryService';
import { isValidImageUrl } from '../utils/imageValidationUtils';

// Define the shape of the context value
export interface GameContextType {
    // State
    currentScreen: GameScreen;
    knowledgeBase: KnowledgeBase;
    gameMessages: GameMessage[];
    styleSettings: StyleSettings;
    storageSettings: StorageSettings;
    isInitialLoading: boolean;
    storageInitError: string | null;
    notification: NotificationState | null;
    apiError: string | null;
    isLoadingApi: boolean;
    isSummarizingNextPageTransition: boolean;
    isAutoPlaying: boolean;
    isSavingGame: boolean;
    isAutoSaving: boolean;
    isSummarizingOnLoad: boolean;
    isCraftingItem: boolean;
    isUploadingAvatar: boolean;
    isCultivating: boolean;
    rawAiResponsesLog: string[];
    sentPromptsLog: string[];
    sentEconomyPromptsLog: string[];
    receivedEconomyResponsesLog: string[];
    sentGeneralSubLocationPromptsLog: string[];
    receivedGeneralSubLocationResponsesLog: string[];
    latestPromptTokenCount: number | string | null;
    summarizationResponsesLog: string[];
    sentCraftingPromptsLog: string[];
    receivedCraftingResponsesLog: string[];
    sentNpcAvatarPromptsLog: string[];
    sentCultivationPromptsLog: string[];
    receivedCultivationResponsesLog: string[];
    prisonerInteractionLog: string[];
    companionInteractionLog: string[];
    sentPrisonerPromptsLog: string[];
    receivedPrisonerResponsesLog: string[];
    sentCompanionPromptsLog: string[];
    receivedCompanionResponsesLog: string[];
    retrievedRagContextLog: string[]; // NEW
    // New log states
    sentCombatSummaryPromptsLog: string[];
    receivedCombatSummaryResponsesLog: string[];
    sentVictoryConsequencePromptsLog: string[];
    receivedVictoryConsequenceResponsesLog: string[];
    currentPageDisplay: number;
    totalPages: number;
    messageIdBeingEdited: string | null;

    // New Context Strings for Prompts
    currentPageMessagesLog: string;
    previousPageSummaries: string[];
    lastNarrationFromPreviousPage?: string;

    // Modal State
    selectedEntity: { type: GameEntityType; entity: GameEntity } | null;
    isStyleSettingsModalOpen: boolean;
    isAiContextModalOpen: boolean; // NEW
    activeEconomyModal: {type: 'marketplace' | 'shopping_center', locationId: string} | null;
    activeSlaveMarketModal: {locationId: string} | null;

    // Actions
    setCurrentScreen: React.Dispatch<React.SetStateAction<GameScreen>>;
    setKnowledgeBase: React.Dispatch<React.SetStateAction<KnowledgeBase>>;
    setGameMessages: React.Dispatch<React.SetStateAction<GameMessage[]>>;
    setStyleSettings: (newSettings: StyleSettings) => void;
    handleSetupComplete: (settings: WorldSettings, rawAvatarData?: string | null) => Promise<void>;
    handlePlayerAction: (action: string, isChoice: boolean, inputType: PlayerActionInputType, responseLength: ResponseLength) => Promise<void>;
    handleFindLocation: (params: FindLocationParams) => Promise<void>;
    handleNonCombatDefeat: (kbStateAtDefeat: KnowledgeBase, fatalNarration: string) => Promise<void>;
    handlePrisonerAction: (prisoner: Prisoner, action: string) => Promise<void>;
    handleCompanionAction: (companion: Wife | Slave, action: string) => Promise<void>;
    handleExitPrisonerScreen: (log: string[]) => Promise<void>;
    handleExitCompanionScreen: (log: string[]) => Promise<void>;
    onQuit: () => void;
    onSaveGame: () => Promise<void>;
    onLoadGame: (saveId: string) => Promise<void>;
    handleUpdateEquipment: (slotId: EquipmentSlotId, itemIdToEquip: string | null, previousItemIdInSlot: string | null) => void;
    handleCraftItem: (desiredCategory: GameTemplates.ItemCategoryValues, requirements: string, materialIds: string[]) => Promise<void>;
    handleBuyItem: (itemId: string, vendorId: string, quantity?: number) => void;
    handleSellItem: (itemId: string, vendorId: string, sellPrice: number, quantity: number) => void;
    handleCombatEnd: (result: CombatEndPayload) => Promise<void>;
    onGoToNextPage: () => void;
    onGoToPrevPage: () => void;
    onJumpToPage: (page: number) => void;
    getMessagesForPage: (pageNumber: number) => GameMessage[];
    isCurrentlyActivePage: boolean;
    onRollbackTurn: () => void;
    onToggleAutoPlay: () => void;
    onStartEditMessage: (messageId: string) => void;
    onSaveEditedMessage: (messageId: string, newContent: string) => void;
    onCancelEditMessage: () => void;
    onUpdatePlayerAvatar: (newAvatarUrl: string) => void;
    onUpdateNpcAvatar: (npcId: string, newAvatarUrl: string) => void;
    handleStartAuction: (locationId: string, playerItemIds?: string[]) => Promise<void>;
    handlePlayerAuctionAction: (itemId: string, bidAmount: number) => Promise<void>;
    handleAuctioneerCall: () => void;
    handleSkipAuctionItem: () => Promise<void>;
    handleStartCultivation: (type: 'skill' | 'method', duration: number, targetId?: string, partnerId?: string) => Promise<string[]>;
    handleExitCultivation: (cultivationLog: string[], totalDuration: { days: number; months: number; years: number; }) => Promise<void>;
    fetchSaveGamesForImportExport: () => Promise<SaveGameMeta[]>;
    loadSpecificGameDataForExport: (saveId: string) => Promise<SaveGameData | null>;
    handleImportGameData: (gameData: Omit<SaveGameData, 'id' | 'timestamp'> & { name: string; }) => Promise<void>;
    showNotification: (message: string, type: "success" | "error" | "info" | "warning") => void;
    onSettingsSaved: (newSettings: StorageSettings) => void;
    gameplayScrollPosition: React.MutableRefObject<number>;
    justLoadedGame: React.MutableRefObject<boolean>;
    convertPrisoner: (prisonerId: string, targetType: 'wife' | 'slave') => void;
    handleProcessDebugTags: (narration: string, tags: string) => Promise<void>;
    setRetrievedRagContextLog: React.Dispatch<React.SetStateAction<string[]>>;
    updateLocationCoordinates: (locationId: string, x: number, y: number) => void;
    handleCheckTokenCount: () => Promise<void>; // NEW

    // Modal Actions
    openEntityModal: (type: GameEntityType, entity: GameEntity) => void;
    closeModal: () => void;
    closeEconomyModal: () => void;
    setIsStyleSettingsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setIsAiContextModalOpen: React.Dispatch<React.SetStateAction<boolean>>; // NEW
    setActiveEconomyModal: React.Dispatch<React.SetStateAction<{type: 'marketplace' | 'shopping_center', locationId: string} | null>>;
    
    // New Slave Market/Auction Actions
    setActiveSlaveMarketModal: React.Dispatch<React.SetStateAction<{locationId: string} | null>>;
    closeSlaveMarketModal: () => void;
    handleBuySlave: (slave: Slave, vendorId: string) => void;
    handleSellSlave: (slaveId: string, vendorId: string) => void;
    handleStartSlaveAuction: (locationId: string, playerSlaveIds?: string[]) => Promise<void>;
    handlePlayerSlaveAuctionAction: (slaveId: string, bidAmount: number) => Promise<void>;
    handleSlaveAuctioneerCall: () => Promise<void>;
    handleSkipSlaveAuctionItem: () => Promise<void>;
    renameSlave: (slaveId: string, newName: string) => void;
}

export const GameContext = createContext<GameContextType | null>(null);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Scroll refs
    const gameplayScrollPosition = useRef(0);
    const justLoadedGame = useRef(false);
    
    // Custom Hooks for state and logic separation
    const { storageSettings, styleSettings, setStorageSettings, setStyleSettings, isInitialLoading, storageInitError } = useAppInitialization();
    const { notification, showNotification } = useGameNotifications();
    const gameData = useGameData();
    const {
        knowledgeBase, setKnowledgeBase, gameMessages, setGameMessages,
        addMessageAndUpdateState, resetGameData, currentPageDisplay, setCurrentPageDisplay,
        totalPages, getMessagesForPage: getMessagesForPageFromHook,
        messageIdBeingEdited, setMessageIdBeingEdited,
        prisonerInteractionLog, setPrisonerInteractionLog,
        companionInteractionLog, setCompanionInteractionLog,
        retrievedRagContextLog, setRetrievedRagContextLog,
        // Destructure new log state and setters
        sentCombatSummaryPromptsLog, setSentCombatSummaryPromptsLog,
        receivedCombatSummaryResponsesLog, setReceivedCombatSummaryResponsesLog,
        sentVictoryConsequencePromptsLog, setSentVictoryConsequencePromptsLog,
        receivedVictoryConsequenceResponsesLog, setReceivedVictoryConsequenceResponsesLog
    } = gameData;
    const { 
        selectedEntity, isStyleSettingsModalOpen, isAiContextModalOpen, activeEconomyModal, activeSlaveMarketModal,
        openEntityModal, closeModal, closeEconomyModal, closeSlaveMarketModal,
        setIsStyleSettingsModalOpen, setIsAiContextModalOpen, setActiveEconomyModal, setActiveSlaveMarketModal
    } = useGameplayModals();
    
    // Local state within the context
    const [currentScreen, setCurrentScreen] = useState<GameScreen>(GameScreen.Initial);
    const [sentCraftingPromptsLog, setSentCraftingPromptsLog] = useState<string[]>([]);
    const [sentNpcAvatarPromptsLog, setSentNpcAvatarPromptsLog] = useState<string[]>([]);
    const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);
    const [isSavingGame, setIsSavingGame] = useState<boolean>(false);
    const [isAutoSaving, setIsAutoSaving] = useState<boolean>(false);
    const [isSummarizingOnLoad, setIsSummarizingOnLoad] = useState<boolean>(false);
    const [isCraftingItem, setIsCraftingItem] = useState<boolean>(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState<boolean>(false);
    const [isCultivating, setIsCultivating] = useState<boolean>(false);
    const [isLoadingApi, setIsLoadingApi] = useState<boolean>(false);
    

    // API Error State Management (moved from useGameActions)
    const [apiError, setApiError] = useState<string | null>(null);
    const apiErrorTimer = useRef<number | undefined>(undefined);

    const resetApiError = useCallback(() => {
        if (apiErrorTimer.current) clearTimeout(apiErrorTimer.current);
        setApiError(null);
    }, []);

    const setApiErrorWithTimeout = useCallback((message: string | null) => {
        resetApiError();
        setApiError(message);
        if (message) {
            apiErrorTimer.current = window.setTimeout(() => setApiError(null), 7000);
        }
    }, [resetApiError]);

    const onQuit = useCallback(() => {
        resetGameData();
        setCurrentScreen(GameScreen.Initial);
        setIsAutoPlaying(false);
      }, [resetGameData, setCurrentScreen, setIsAutoPlaying]);

    // --- Start: Compute context strings ---
    const lastPageNumberForPrompt = (knowledgeBase.currentPageHistory?.length || 1) - 1;
    let lastNarrationFromPreviousPage: string | undefined = undefined;
    if (lastPageNumberForPrompt > 0 && currentPageDisplay > lastPageNumberForPrompt) { 
        const messagesOfLastSummarizedPagePrompt = getMessagesForPageFromHook(lastPageNumberForPrompt);
        lastNarrationFromPreviousPage = [...messagesOfLastSummarizedPagePrompt].reverse().find(msg => msg.type === 'narration')?.content;
    }

    const messagesForCurrentPagePrompt = getMessagesForPageFromHook(currentPageDisplay);
    const currentPageMessagesLog = messagesForCurrentPagePrompt
        .map(msg => {
            if (msg.type === 'player_action') {
                const prefix = `${knowledgeBase.worldConfig?.playerName || 'Người chơi'} ${msg.isPlayerInput ? 'đã làm' : 'đã chọn'}: `;
                return prefix + msg.content;
            }
            if (msg.type === 'narration') {
                const prefix = "AI kể: ";
                return prefix + msg.content;
            }
            if (msg.type === 'system') {
                const contentLower = msg.content.toLowerCase();
                const isExcluded = 
                    contentLower.includes("tóm tắt") || 
                    contentLower.includes("trang") ||
                    contentLower.startsWith("nhận được:") ||
                    contentLower.startsWith("học được kỹ năng mới:") ||
                    contentLower.startsWith("bạn đã gặp npc mới:");
                
                if (!isExcluded) {
                    return `Hệ thống: ${msg.content}`;
                }
            }
            return null; // Return null for excluded system messages and other types
        })
        .filter(Boolean) // Filter out null entries
        .join("\n---\n");

    const previousPageNumbers = knowledgeBase.currentPageHistory?.slice(0, -1) || [];
    const previousPageSummariesContent: string[] = previousPageNumbers
        .map((_, index) => knowledgeBase.pageSummaries?.[index + 1])
        .filter((summary): summary is string => !!summary);
    // --- End: Compute context strings ---

    const executeSaveGame = useCallback(async (kbToSave: KnowledgeBase, messagesToSave: GameMessage[], saveName: string, existingId: string | null, isAuto: boolean): Promise<string | null> => {
        if (isAuto) setIsAutoSaving(true); else setIsSavingGame(true);
        try {
            const idForLocal = typeof existingId === 'string' ? parseInt(existingId, 10) : existingId;
            const newSaveId = await saveGameToIndexedDB(kbToSave, messagesToSave, saveName, isNaN(idForLocal as number) ? existingId : idForLocal);
            if (!isAuto) showNotification(VIETNAMESE.gameSavedSuccess + ` ("${saveName}")`, 'success');
            return newSaveId;
        } catch (e) {
            const errorMsg = VIETNAMESE.errorSavingGame + (e instanceof Error ? `: ${e.message}` : '');
            if (!isAuto) showNotification(errorMsg, 'error'); else console.error(VIETNAMESE.autoSaveError(saveName), errorMsg);
            return null;
        } finally {
            if (isAuto) setIsAutoSaving(false); else setIsSavingGame(false);
        }
    }, [showNotification]);

    const logNpcAvatarPromptCallback = useCallback((prompt: string) => {
        setSentNpcAvatarPromptsLog(prev => [prompt, ...prev].slice(0, 10));
    }, []);
    
    const handleProcessDebugTags = useCallback(async (narration: string, tags: string) => {
        setIsLoadingApi(true);
        try {
            const tagArray = tags.split('\n').map(t => t.trim()).filter(t => t);
            if (tagArray.length === 0 && !narration.trim()) {
                showNotification("Vui lòng nhập tag hoặc lời kể để xử lý.", 'warning');
                setIsLoadingApi(false);
                return;
            }
            const turnForMessages = knowledgeBase.playerStats.turn;
    
            const {
                newKb: kbAfterTags,
                systemMessagesFromTags,
            } = await performTagProcessing(
                knowledgeBase,
                tagArray,
                turnForMessages,
                setKnowledgeBase,
                logNpcAvatarPromptCallback
            );
    
            let finalKb = kbAfterTags;
            const levelUpResult = handleLevelUps(finalKb);
            finalKb = levelUpResult.updatedKb;
            const finalSystemMessages = [...systemMessagesFromTags, ...levelUpResult.systemMessages];
    
            finalKb.playerStats = calculateEffectiveStats(finalKb.playerStats, finalKb.equippedItems, finalKb.inventory);
    
            // Defeat Check
            if (finalKb.playerStats.sinhLuc <= 0) {
                // Let the defeat handler manage everything from here, including loading state.
                await gameActions.handleNonCombatDefeat(finalKb, narration || 'Bạn đã bị gục ngã do một sự kiện không rõ.');
                return;
            }
    
            const newMessages: GameMessage[] = [];
            if (narration.trim()) {
                newMessages.push({
                    id: `debug-narration-${Date.now()}`,
                    type: 'narration',
                    content: narration.trim(),
                    timestamp: Date.now(),
                    turnNumber: turnForMessages
                });
            }
            newMessages.push(...finalSystemMessages);
    
            addMessageAndUpdateState(newMessages, finalKb);
            showNotification("Debug tags đã được xử lý.", "success");
            
    
        } catch (error) {
            console.error("Error processing debug tags:", error);
            showNotification(`Lỗi xử lý debug tags: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
        } finally {
            setIsLoadingApi(false);
        }
    }, [knowledgeBase, setIsLoadingApi, showNotification, addMessageAndUpdateState, setKnowledgeBase, logNpcAvatarPromptCallback]);


    const gameActions = useGameActions({
        ...gameData,
        onQuit: onQuit,
        showNotification,
        setCurrentScreen,
        isAutoPlaying,
        setIsAutoPlaying,
        executeSaveGame,
        storageType: 'local',
        firebaseUser: null, // FirebaseUser replaced with null
        isLoadingApi,
        setIsLoadingApi,
        logNpcAvatarPromptCallback,
        setApiErrorWithTimeout: setApiErrorWithTimeout,
        resetApiError: resetApiError,
        setIsCultivating,
        setSentCultivationPromptsLog: gameData.setSentCultivationPromptsLog,
        setReceivedCultivationResponsesLog: gameData.setReceivedCultivationResponsesLog,
        setCompanionInteractionLog: gameData.setCompanionInteractionLog,
        setPrisonerInteractionLog: gameData.setPrisonerInteractionLog,
        setSentPrisonerPromptsLog: gameData.setSentPrisonerPromptsLog,
        setReceivedPrisonerResponsesLog: gameData.setReceivedPrisonerResponsesLog,
        setSentCompanionPromptsLog: gameData.setSentCompanionPromptsLog,
        setReceivedCompanionResponsesLog: gameData.setReceivedCompanionResponsesLog,
        setRetrievedRagContextLog: setRetrievedRagContextLog,
        currentPageMessagesLog,
        previousPageSummaries: previousPageSummariesContent,
        lastNarrationFromPreviousPage,
        setSentCombatSummaryPromptsLog,
        setReceivedCombatSummaryResponsesLog,
        setSentVictoryConsequencePromptsLog,
        setReceivedVictoryConsequenceResponsesLog,
        sentPromptsLog: gameData.sentPromptsLog,
    });
    
    const { isSummarizingNextPageTransition } = gameActions;

    const updateLocationCoordinates = useCallback((locationId: string, x: number, y: number) => {
        setKnowledgeBase(prevKb => {
            const newKb = JSON.parse(JSON.stringify(prevKb));
            const locIndex = newKb.discoveredLocations.findIndex((l: GameLocation) => l.id === locationId);
            if (locIndex > -1) {
                newKb.discoveredLocations[locIndex].mapX = Math.round(x);
                newKb.discoveredLocations[locIndex].mapY = Math.round(y);
                showNotification(`Đã cập nhật tọa độ của ${newKb.discoveredLocations[locIndex].name}.`, 'success');
            }
            return newKb;
        });
    }, [setKnowledgeBase, showNotification]);

    useEffect(() => {
        return () => {
            if (apiErrorTimer.current) clearTimeout(apiErrorTimer.current);
        };
    }, []);

    const handleSetupCompleteWrapper = useCallback(async (settingsFromGameSetup: WorldSettings, rawAvatarDataFromGameSetup?: string | null) => {
        let finalWorldSettings = { ...settingsFromGameSetup };
        let finalPlayerAvatarUrlForKbConfig: string | undefined = undefined;
        let base64ToStoreInKb: string | undefined = undefined;
        setIsUploadingAvatar(true);
        if (rawAvatarDataFromGameSetup) {
            if (rawAvatarDataFromGameSetup.startsWith('data:image')) {
                base64ToStoreInKb = rawAvatarDataFromGameSetup;
                try {
                    const playerNameSlug = finalWorldSettings.playerName?.replace(/\s+/g, '_').toLowerCase() || `player_${Date.now()}`;
                    const base64StringOnly = rawAvatarDataFromGameSetup.split(',')[1];
                    const cloudinaryUrl = await uploadImageToCloudinary(base64StringOnly, 'player', `player_${playerNameSlug}`);
                    finalPlayerAvatarUrlForKbConfig = cloudinaryUrl;
                    base64ToStoreInKb = undefined;
                } catch (uploadError) {
                    console.error("Cloudinary upload failed during setup:", uploadError);
                    showNotification(VIETNAMESE.avatarUploadError + (uploadError instanceof Error ? uploadError.message : ""), "warning");
                }
            } else if (rawAvatarDataFromGameSetup.startsWith('http')) {
                const isValidDirectUrl = await isValidImageUrl(rawAvatarDataFromGameSetup);
                if (isValidDirectUrl) {
                    finalPlayerAvatarUrlForKbConfig = rawAvatarDataFromGameSetup;
                } else {
                    showNotification(VIETNAMESE.avatarUrlInvalid + " Ảnh đại diện sẽ bị xóa.", "warning");
                }
            }
        } else if (finalWorldSettings.playerAvatarUrl && (finalWorldSettings.playerAvatarUrl.startsWith('http'))) {
            const isValidDirectUrl = await isValidImageUrl(finalWorldSettings.playerAvatarUrl);
            if (isValidDirectUrl) {
                finalPlayerAvatarUrlForKbConfig = finalWorldSettings.playerAvatarUrl;
            } else {
                finalWorldSettings.playerAvatarUrl = undefined;
            }
        }
        finalWorldSettings.playerAvatarUrl = finalPlayerAvatarUrlForKbConfig;
        setIsUploadingAvatar(false);
        justLoadedGame.current = true;
        resetGameData();
        await gameActions.handleSetupComplete(finalWorldSettings, base64ToStoreInKb);
    }, [gameActions.handleSetupComplete, showNotification, resetGameData]);

    const handleUpdatePlayerAvatar = useCallback(async (newAvatarUrlOrData: string) => {
        setIsUploadingAvatar(true);
        let finalUrlToShow = newAvatarUrlOrData;
        let base64ForKbIfUploadFails: string | undefined = undefined;
        if (newAvatarUrlOrData.startsWith('data:image')) {
            base64ForKbIfUploadFails = newAvatarUrlOrData;
            try {
                const playerNameSlug = knowledgeBase.worldConfig?.playerName?.replace(/\s+/g, '_').toLowerCase() || `player_${Date.now()}`;
                const base64StringOnly = newAvatarUrlOrData.split(',')[1];
                finalUrlToShow = await uploadImageToCloudinary(base64StringOnly, 'player', `player_${playerNameSlug}_ingame`);
                base64ForKbIfUploadFails = undefined;
            } catch (uploadError) {
                console.error("Cloudinary upload failed for player avatar:", uploadError);
                showNotification(VIETNAMESE.avatarUploadError + (uploadError instanceof Error ? uploadError.message : ""), "error");
                setIsUploadingAvatar(false);
                return;
            }
        } else if (newAvatarUrlOrData.startsWith('http')) {
            const isValid = await isValidImageUrl(newAvatarUrlOrData);
            if (!isValid) {
                showNotification(VIETNAMESE.avatarUrlInvalid, "error");
                setIsUploadingAvatar(false);
                return;
            }
            finalUrlToShow = newAvatarUrlOrData;
        } else if (newAvatarUrlOrData === '') {
            finalUrlToShow = '';
        } else {
            showNotification("Định dạng avatar không hợp lệ.", "error");
            setIsUploadingAvatar(false);
            return;
        }
        setKnowledgeBase(prevKb => {
            const updatedKb = JSON.parse(JSON.stringify(prevKb)) as KnowledgeBase;
            updatedKb.playerAvatarData = base64ForKbIfUploadFails || (finalUrlToShow === '' ? undefined : finalUrlToShow);
            if (updatedKb.worldConfig) {
                updatedKb.worldConfig.playerAvatarUrl = updatedKb.playerAvatarData;
            }
            return updatedKb;
        });
        showNotification(finalUrlToShow === '' ? "Đã xóa ảnh đại diện." : VIETNAMESE.avatarUploadSuccess, 'success');
        setIsUploadingAvatar(false);
    }, [setKnowledgeBase, showNotification, knowledgeBase.worldConfig?.playerName]);

    const handleUpdateNpcAvatar = useCallback(async (npcId: string, newAvatarUrlOrData: string) => {
        setIsUploadingAvatar(true);
        let finalUrlForNpc = newAvatarUrlOrData;
        const npcData = knowledgeBase.discoveredNPCs.find(n => n.id === npcId);
        if (newAvatarUrlOrData.startsWith('data:image') && npcData) {
            try {
                const base64StringOnly = newAvatarUrlOrData.split(',')[1];
                let cloudinaryFolderType: 'npc_male' | 'npc_female' = 'npc_male';
                if (npcData.gender === 'Nữ') cloudinaryFolderType = 'npc_female';
                finalUrlForNpc = await uploadImageToCloudinary(base64StringOnly, cloudinaryFolderType, `npc_${npcId}_ingame`);
            } catch (uploadError) {
                console.error(`Cloudinary upload failed for NPC ${npcId}:`, uploadError);
                showNotification(VIETNAMESE.avatarUploadError + (uploadError instanceof Error ? uploadError.message : ""), "error");
                setIsUploadingAvatar(false);
                return;
            }
        } else if (newAvatarUrlOrData.startsWith('http')) {
            const isValid = await isValidImageUrl(newAvatarUrlOrData);
            if (!isValid) {
                showNotification(VIETNAMESE.avatarUrlInvalid, "error");
                setIsUploadingAvatar(false);
                return;
            }
            finalUrlForNpc = newAvatarUrlOrData;
        } else if (newAvatarUrlOrData === '') {
            finalUrlForNpc = '';
        } else {
            showNotification("Định dạng avatar không hợp lệ cho NPC.", "error");
            setIsUploadingAvatar(false);
            return;
        }
        setKnowledgeBase(prevKb => {
            const updatedNPCs = prevKb.discoveredNPCs.map(npc => npc.id === npcId ? { ...npc, avatarUrl: finalUrlForNpc === '' ? undefined : finalUrlForNpc } : npc);
            return { ...prevKb, discoveredNPCs: updatedNPCs };
        });
        const npcNameDisplay = npcData?.name || "NPC";
        showNotification(finalUrlForNpc === '' ? `Đã xóa ảnh đại diện cho ${npcNameDisplay}.` : `${VIETNAMESE.avatarUploadSuccess} cho ${npcNameDisplay}.`, 'success');
        setIsUploadingAvatar(false);
    }, [knowledgeBase.discoveredNPCs, setKnowledgeBase, showNotification]);

    useEffect(() => {
        let autoPlayTimeoutId: number | undefined;
        if (isAutoPlaying && !isLoadingApi && !isSummarizingNextPageTransition && !isSummarizingOnLoad && currentScreen === GameScreen.Gameplay && currentPageDisplay === totalPages) {
            const latestMessageWithChoices = [...gameMessages].reverse().find((msg) => msg.type === 'narration' && msg.choices && msg.choices.length > 0);
            let actionToTake: string | null = null;
            let actionType: PlayerActionInputType = 'action';
            if (latestMessageWithChoices && latestMessageWithChoices.choices && latestMessageWithChoices.choices.length > 0) {
                actionToTake = latestMessageWithChoices.choices[0].text;
                actionType = 'action';
            } else {
                actionToTake = VIETNAMESE.autoPlayContinueAction || "Tiếp tục diễn biến.";
                actionType = 'story';
            }
            if (actionToTake) {
                autoPlayTimeoutId = window.setTimeout(async () => {
                    if (isAutoPlaying && !isLoadingApi && !isSummarizingNextPageTransition && !isSummarizingOnLoad && currentScreen === GameScreen.Gameplay && currentPageDisplay === totalPages) {
                        await gameActions.handlePlayerAction(actionToTake!, true, actionType, 'default');
                    }
                }, 1000);
            }
        }
        return () => { if (autoPlayTimeoutId) clearTimeout(autoPlayTimeoutId); };
    }, [isAutoPlaying, isLoadingApi, gameMessages, currentScreen, gameActions, isSummarizingNextPageTransition, isSummarizingOnLoad, currentPageDisplay, totalPages]);
    
    // ... all other handler functions from App.tsx go here ...
    
    const handleToggleAutoPlay = () => setIsAutoPlaying(prev => !prev);
    const onStartEditMessage = (messageId: string) => setMessageIdBeingEdited(messageId);
    const onCancelEditMessage = () => setMessageIdBeingEdited(null);
    const onSaveEditedMessage = (messageId: string, newContent: string) => {
        setGameMessages(prevMessages => prevMessages.map(msg => msg.id === messageId ? { ...msg, content: newContent, timestamp: Date.now() } : msg));
        setMessageIdBeingEdited(null);
        showNotification(VIETNAMESE.messageEditedSuccess, 'success');
    };
    
    const onSaveGame = async () => {
        setIsSavingGame(true);
        const saveName = knowledgeBase.manualSaveName || knowledgeBase.worldConfig?.saveGameName || "Cuộc Phiêu Lưu Mặc Định";
        if (!saveName.trim()) {
            showNotification(VIETNAMESE.manualSaveErrorNoName, 'error');
            setIsSavingGame(false);
            return;
        }
        const newSaveId = await executeSaveGame(knowledgeBase, gameMessages, saveName, knowledgeBase.manualSaveId, false); // Here
        if(newSaveId) {
            setKnowledgeBase(prev => ({...prev, manualSaveId: newSaveId, manualSaveName: saveName}));
        }
        setIsSavingGame(false);
    };

    const onLoadGame = async (saveId: string) => {
        setIsSavingGame(true);
        if (apiErrorTimer.current) clearTimeout(apiErrorTimer.current); setApiError(null);
        setIsSummarizingOnLoad(false);
        try {
            justLoadedGame.current = true;
            const gameData = await loadSpecificGameFromIndexedDB(saveId);
            if (gameData) {
                // ... (The entire complex loading logic remains here)
                let loadedKb = gameData.knowledgeBase;

                // Data migration for saves made before the "buoi" (time of day) system was added.
                if (loadedKb.worldDate && typeof (loadedKb.worldDate as any).buoi !== 'undefined') {
                    const buoi = (loadedKb.worldDate as any).buoi;
                    delete (loadedKb.worldDate as any).buoi;
                    switch(buoi) {
                        case 'Sáng Sớm': loadedKb.worldDate.hour = 6; loadedKb.worldDate.minute = 0; break;
                        case 'Buổi Sáng': loadedKb.worldDate.hour = 8; loadedKb.worldDate.minute = 0; break;
                        case 'Buổi Trưa': loadedKb.worldDate.hour = 12; loadedKb.worldDate.minute = 0; break;
                        case 'Buổi Chiều': loadedKb.worldDate.hour = 15; loadedKb.worldDate.minute = 0; break;
                        case 'Hoàng Hôn': loadedKb.worldDate.hour = 18; loadedKb.worldDate.minute = 0; break;
                        case 'Buổi Tối': loadedKb.worldDate.hour = 20; loadedKb.worldDate.minute = 0; break;
                        case 'Nửa Đêm': loadedKb.worldDate.hour = 0; loadedKb.worldDate.minute = 0; break;
                        default: loadedKb.worldDate.hour = 8; loadedKb.worldDate.minute = 0;
                    }
                }
                if (loadedKb.worldDate && typeof loadedKb.worldDate.hour === 'undefined') {
                    loadedKb.worldDate.hour = 8;
                }
                if (loadedKb.worldDate && typeof loadedKb.worldDate.minute === 'undefined') {
                    loadedKb.worldDate.minute = 0;
                }

                if (loadedKb.turnHistory && Array.isArray(loadedKb.turnHistory)) {
                    let lastKeyframeKbSnapshot: KnowledgeBase | null = null;
                    let lastKeyframeMessagesSnapshot: GameMessage[] | null = null;
                    const reconstructedTurnHistory: TurnHistoryEntry[] = [];
                    for (const entry of loadedKb.turnHistory) {
                        if (entry.type === 'keyframe') {
                            lastKeyframeKbSnapshot = JSON.parse(JSON.stringify(entry.knowledgeBaseSnapshot));
                            lastKeyframeMessagesSnapshot = JSON.parse(JSON.stringify(entry.gameMessagesSnapshot));
                            reconstructedTurnHistory.push(entry);
                        } else if (entry.type === 'delta') {
                            if (!lastKeyframeKbSnapshot || !lastKeyframeMessagesSnapshot || !entry.knowledgeBaseDelta || !entry.gameMessagesDelta) { continue; }
                            let newKbSnapshotForDelta = lastKeyframeKbSnapshot;
                            if (entry.knowledgeBaseDelta.length > 0) newKbSnapshotForDelta = jsonpatch.applyPatch(JSON.parse(JSON.stringify(lastKeyframeKbSnapshot)), entry.knowledgeBaseDelta as readonly jsonpatch.Operation[]).newDocument as KnowledgeBase;
                            let newMessagesSnapshotForDelta = lastKeyframeMessagesSnapshot;
                            if (entry.gameMessagesDelta.length > 0) newMessagesSnapshotForDelta = jsonpatch.applyPatch(JSON.parse(JSON.stringify(lastKeyframeMessagesSnapshot)), entry.gameMessagesDelta as readonly jsonpatch.Operation[]).newDocument as GameMessage[];
                            reconstructedTurnHistory.push({ ...entry, knowledgeBaseSnapshot: newKbSnapshotForDelta, gameMessagesSnapshot: newMessagesSnapshotForDelta });
                            lastKeyframeKbSnapshot = newKbSnapshotForDelta;
                            lastKeyframeMessagesSnapshot = newMessagesSnapshotForDelta;
                        } else {
                            reconstructedTurnHistory.push(entry);
                        }
                    }
                    loadedKb.turnHistory = reconstructedTurnHistory;
                }
                setGameMessages(gameData.gameMessages);
                loadedKb.manualSaveName = gameData.name || loadedKb.manualSaveName || loadedKb.worldConfig?.saveGameName || "Không Tên";
                loadedKb.manualSaveId = loadedKb.manualSaveId ?? gameData.id ?? null;
                // ... (rest of the loading logic from App.tsx) ...
                setKnowledgeBase(loadedKb);
                const loadedTotalPages = Math.max(1, loadedKb.currentPageHistory?.length || 1);
                setCurrentPageDisplay(loadedTotalPages); 
                setCurrentScreen(GameScreen.Gameplay);
                showNotification(VIETNAMESE.gameLoadedSuccess, 'success');
            } else { throw new Error("Không tìm thấy dữ liệu game."); }
        } catch (e) {
            const errorMsg = VIETNAMESE.errorLoadingGame + (e instanceof Error ? `: ${e.message}` : '');
            if (apiErrorTimer.current) clearTimeout(apiErrorTimer.current); setApiError(errorMsg);
            setCurrentScreen(GameScreen.LoadGameSelection);
        } finally {
            setIsSavingGame(false);
            setIsSummarizingOnLoad(false);
        }
    };

    const handleUpdateEquipment = useCallback((slotId: EquipmentSlotId, itemIdToEquip: string | null, previousItemIdInSlot: string | null) => {
        setKnowledgeBase(prevKb => {
            const newKb = JSON.parse(JSON.stringify(prevKb)) as KnowledgeBase;
            
            if (newKb.equippedItems[slotId] === itemIdToEquip) {
                return prevKb; 
            }
    
            newKb.equippedItems[slotId] = itemIdToEquip;
    
            newKb.playerStats = calculateEffectiveStats(newKb.playerStats, newKb.equippedItems, newKb.inventory);
    
            const slotConfig = EQUIPMENT_SLOTS_CONFIG.find(s => s.id === slotId);
            const slotName = slotConfig ? (VIETNAMESE[slotConfig.labelKey] as string) : slotId;
            
            if (itemIdToEquip) {
                const equippedItem = newKb.inventory.find(i => i.id === itemIdToEquip);
                if (equippedItem) {
                    showNotification(VIETNAMESE.itemEquipped(equippedItem.name, slotName), 'success');
                }
            } else if (previousItemIdInSlot) {
                const unequippedItem = newKb.inventory.find(i => i.id === previousItemIdInSlot);
                if (unequippedItem) {
                     showNotification(VIETNAMESE.itemUnequipped(unequippedItem.name, slotName), 'info');
                }
            }
            
            return newKb;
        });
    }, [setKnowledgeBase, showNotification]);

    const handleCraftItem = useCallback(async (desiredCategory: GameTemplates.ItemCategoryValues, requirements: string, materialIds: string[]) => {
        setIsCraftingItem(true);
        setIsLoadingApi(true); 
        if (apiErrorTimer.current) clearTimeout(apiErrorTimer.current); setApiError(null);
        
        const materialsUsed = knowledgeBase.inventory.filter(item => materialIds.includes(item.id));
        if (materialsUsed.length !== materialIds.length) {
            showNotification("Lỗi: Một số nguyên liệu không tìm thấy trong túi đồ.", "error");
            setIsCraftingItem(false);
            setIsLoadingApi(false); 
            return;
        }

        try {
            const { response, rawText } = await generateCraftedItemViaAI(
                desiredCategory,
                requirements,
                materialsUsed,
                knowledgeBase.playerStats,
                knowledgeBase.worldConfig,
                currentPageMessagesLog,
                previousPageSummariesContent,
                lastNarrationFromPreviousPage,
                (prompt) => setSentCraftingPromptsLog(prev => [prompt, ...prev].slice(0, 10))
            );
            gameData.setReceivedCraftingResponsesLog(prev => [rawText, ...prev].slice(0, 10));

            let workingKb = JSON.parse(JSON.stringify(knowledgeBase));
            const turnNumber = workingKb.playerStats.turn;

            // Consume materials
            materialIds.forEach(id => {
                const itemIndex = workingKb.inventory.findIndex((i: ItemType) => i.id === id);
                if (itemIndex > -1) {
                    workingKb.inventory[itemIndex].quantity -= 1;
                    if (workingKb.inventory[itemIndex].quantity <= 0) {
                        workingKb.inventory.splice(itemIndex, 1);
                    }
                }
            });

            const { newKb: kbAfterCraft, systemMessagesFromTags } = await performTagProcessing(
                workingKb,
                response.tags,
                turnNumber,
                setKnowledgeBase,
                (prompt) => setSentNpcAvatarPromptsLog(prev => [prompt, ...prev].slice(0, 10))
            );
            
            workingKb = kbAfterCraft;

            const newMessages: GameMessage[] = [...systemMessagesFromTags];
            if (response.narration) {
                newMessages.push({
                    id: 'crafting-narration-' + Date.now(),
                    type: 'system',
                    content: response.narration,
                    timestamp: Date.now(),
                    turnNumber: turnNumber
                });
            }

            addMessageAndUpdateState(newMessages, workingKb);
            const newItemName = response.tags.find(t => t.includes('ITEM_ACQUIRED'))?.match(/name="([^"]+)"/)?.[1];
            if (newItemName) {
                showNotification(VIETNAMESE.craftingSuccess(newItemName), 'success');
            } else {
                 showNotification("Luyện chế hoàn tất!", 'info');
            }

        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            if (apiErrorTimer.current) clearTimeout(apiErrorTimer.current); setApiError(errorMsg);
            showNotification(VIETNAMESE.errorCraftingItem + `: ${errorMsg}`, 'error');
        } finally {
            setIsCraftingItem(false);
            setIsLoadingApi(false);
        }
    }, [knowledgeBase, addMessageAndUpdateState, showNotification, gameData, setSentCraftingPromptsLog, setKnowledgeBase, setSentNpcAvatarPromptsLog, currentPageMessagesLog, previousPageSummariesContent, lastNarrationFromPreviousPage]);
    
    const handleBuyItem = useCallback((itemId: string, vendorId: string, quantity: number = 1) => {
        setKnowledgeBase(prevKb => {
            const newKb = JSON.parse(JSON.stringify(prevKb)) as KnowledgeBase;
            const vendor = newKb.discoveredNPCs.find(n => n.id === vendorId);
            if (!vendor || !vendor.shopInventory) {
                console.warn(`Vendor with ID ${vendorId} or their inventory not found.`);
                return prevKb;
            }

            const itemIndexInShop = vendor.shopInventory.findIndex(i => i.id === itemId);
            if (itemIndexInShop === -1) {
                console.warn(`Item with ID ${itemId} not found in vendor ${vendor.name}'s inventory.`);
                return prevKb;
            }
            
            const itemInShop = vendor.shopInventory[itemIndexInShop];
            const price = itemInShop.value || 0;
            const totalPrice = price * quantity;

            if (newKb.playerStats.currency < totalPrice) {
                showNotification(VIETNAMESE.notEnoughMoney, 'error');
                return prevKb;
            }

            if (itemInShop.quantity < quantity) {
                showNotification(`Cửa hàng không đủ số lượng "${itemInShop.name}".`, 'warning');
                return prevKb;
            }

            // Deduct currency
            newKb.playerStats.currency -= totalPrice;

            // Add item to player inventory
            const existingPlayerItemIndex = newKb.inventory.findIndex(i => i.name === itemInShop.name && i.stackable !== false);
            if (existingPlayerItemIndex > -1) {
                newKb.inventory[existingPlayerItemIndex].quantity += quantity;
            } else {
                const newItemForPlayer = { ...itemInShop, id: `item-${itemInShop.name.replace(/\s+/g, '-')}-${Date.now()}`, quantity: quantity };
                newKb.inventory.push(newItemForPlayer);
            }
            
            // Update shop inventory
            itemInShop.quantity -= quantity;
            if (itemInShop.quantity <= 0) {
                vendor.shopInventory.splice(itemIndexInShop, 1);
            }

            const currencyName = newKb.worldConfig?.currencyName || "Tiền";
            showNotification(VIETNAMESE.itemBought(itemInShop.name, totalPrice, currencyName), 'success');

            return newKb;
        });
    }, [setKnowledgeBase, showNotification]);

    const handleSellItem = useCallback((itemId: string, vendorId: string, sellPrice: number, quantity: number = 1) => {
        setKnowledgeBase(prevKb => {
            const newKb = JSON.parse(JSON.stringify(prevKb)) as KnowledgeBase;
            
            const itemIndexInInventory = newKb.inventory.findIndex(i => i.id === itemId);
            if (itemIndexInInventory === -1) {
                console.warn(`Item with ID ${itemId} not found in player's inventory.`);
                return prevKb;
            }
            
            const itemToSell = newKb.inventory[itemIndexInInventory];
            if (itemToSell.quantity < quantity) {
                showNotification(`Bạn không có đủ số lượng "${itemToSell.name}" để bán.`, 'warning');
                return prevKb;
            }
            
            const vendor = newKb.discoveredNPCs.find(n => n.id === vendorId);
            if (!vendor) {
                console.warn(`Vendor with ID ${vendorId} not found.`);
                return prevKb;
            }

            // Add currency to player
            const totalPrice = sellPrice * quantity;
            newKb.playerStats.currency += totalPrice;

            // Remove item from player inventory
            itemToSell.quantity -= quantity;
            if (itemToSell.quantity <= 0) {
                newKb.inventory.splice(itemIndexInInventory, 1);
            }

            // Add item to vendor inventory
            if (!vendor.shopInventory) vendor.shopInventory = [];
            const existingVendorItemIndex = vendor.shopInventory.findIndex(i => i.name === itemToSell.name);
            if (existingVendorItemIndex > -1) {
                vendor.shopInventory[existingVendorItemIndex].quantity += quantity;
            } else {
                const newItemForVendor = { ...itemToSell, id: `item-${itemToSell.name.replace(/\s+/g, '-')}-${Date.now()}`, quantity: quantity };
                vendor.shopInventory.push(newItemForVendor);
            }
            
            const currencyName = newKb.worldConfig?.currencyName || "Tiền";
            showNotification(VIETNAMESE.itemSold(itemToSell.name, totalPrice, currencyName), 'success');

            return newKb;
        });
    }, [setKnowledgeBase, showNotification]);

    const handleCombatEnd = gameActions.handleCombatEnd;

    const onRollbackTurn = useCallback(() => {
        if ((!isLoadingApi && isAutoPlaying) || !knowledgeBase.turnHistory || knowledgeBase.turnHistory.length <= 1) {
            setIsAutoPlaying(false);
            if (knowledgeBase.turnHistory && knowledgeBase.turnHistory.length <= 1) {
                showNotification(VIETNAMESE.cannotRollbackFurther, 'warning');
            } else {
                showNotification(VIETNAMESE.actionStopErrorNoHistory, 'error');
            }
            return;
        }

        if (isLoadingApi) {
            showNotification(VIETNAMESE.actionStoppedAndRolledBack, 'info');
        } else {
            showNotification(VIETNAMESE.rollbackSuccess, 'info');
        }

        setIsLoadingApi(false);
        if (apiErrorTimer.current) {
            clearTimeout(apiErrorTimer.current);
        }
        setApiError(null);

        const historyCopy = [...(knowledgeBase.turnHistory || [])];
        const stateToRestore = historyCopy.pop(); // This gets the state for T-1 and leaves history at T-2

        if (stateToRestore && stateToRestore.knowledgeBaseSnapshot) {
            const restoredKbSnapshot = { ...stateToRestore.knowledgeBaseSnapshot, turnHistory: historyCopy };
    
            // After restoring the snapshot, the date is correct but event statuses might be out of sync.
            // Let's explicitly re-synchronize them to ensure consistency.
            const { updatedKb: fullySyncedKb } = updateGameEventsStatus(restoredKbSnapshot);
            // We ignore the system messages from this sync, as it's just a corrective action.
    
            setKnowledgeBase(fullySyncedKb);
            setGameMessages([...stateToRestore.gameMessagesSnapshot]);
            const restoredTotalPages = Math.max(1, stateToRestore.knowledgeBaseSnapshot.currentPageHistory?.length || 1);
            setCurrentPageDisplay(restoredTotalPages);
        } else {
            console.error("Rollback failed: Could not retrieve a valid state to restore from history.");
            onQuit(); // Fallback to a full reset
        }
    }, [isLoadingApi, isAutoPlaying, knowledgeBase.turnHistory, showNotification, setIsLoadingApi, setKnowledgeBase, setGameMessages, setCurrentPageDisplay, onQuit]);

    const fetchSaveGamesForImportExport = async (): Promise<SaveGameMeta[]> => loadGamesFromIndexedDB();
    const loadSpecificGameDataForExport = async (saveId: string): Promise<SaveGameData | null> => loadSpecificGameFromIndexedDB(saveId);
    const handleImportGameData = async (gameDataToImport: Omit<SaveGameData, 'id' | 'timestamp'> & { name: string; }) => {
        try {
            await importGameToIndexedDB(gameDataToImport);
            showNotification(VIETNAMESE.dataImportedSuccess, 'success');
        } catch (e) { throw e; }
    };
    const onSettingsSaved = (newSettings: StorageSettings) => {
        setStorageSettings(newSettings);
        resetIndexedDBConnection();
        showNotification(VIETNAMESE.storageSettingsSavedMessage, 'success');
    };
    
    const convertPrisoner = useCallback((prisonerId: string, targetType: 'wife' | 'slave') => {
        setKnowledgeBase(prevKb => {
            const newKb = JSON.parse(JSON.stringify(prevKb)) as KnowledgeBase;
            const prisonerIndex = newKb.prisoners.findIndex(p => p.id === prisonerId);
            if (prisonerIndex === -1) {
                showNotification(VIETNAMESE.prisonerConversionError, 'error');
                return prevKb;
            }

            const prisoner = newKb.prisoners[prisonerIndex];
            const { entityType, resistance, ...baseData } = prisoner;

            if (targetType === 'wife') {
                const newWife: Wife = {
                    ...baseData,
                    entityType: 'wife',
                    skills: [],
                    equippedItems: { mainWeapon: null, offHandWeapon: null, head: null, body: null, hands: null, legs: null, artifact: null, pet: null, accessory1: null, accessory2: null },
                };
                newKb.wives.push(newWife);
            } else { // 'slave'
                const newSlave: Slave = {
                    ...baseData,
                    entityType: 'slave',
                    skills: [],
                    equippedItems: { mainWeapon: null, offHandWeapon: null, head: null, body: null, hands: null, legs: null, artifact: null, pet: null, accessory1: null, accessory2: null },
                };
                newKb.slaves.push(newSlave);
            }

            newKb.prisoners.splice(prisonerIndex, 1);
            showNotification(VIETNAMESE.prisonerConverted(prisoner.name, targetType), 'success');
            return newKb;
        });
    }, [setKnowledgeBase, showNotification]);

    const renameSlave = useCallback((slaveId: string, newName: string) => {
        const trimmedName = newName.trim();
        if (!trimmedName) {
            showNotification("Tên không được để trống.", "error");
            return;
        }
    
        const slaveToRename = knowledgeBase.slaves.find(s => s.id === slaveId);
        if (!slaveToRename) {
            showNotification("Không tìm thấy nô lệ.", "error");
            return;
        }
    
        const allNames = [
            knowledgeBase.worldConfig?.playerName,
            ...knowledgeBase.discoveredNPCs.map(n => n.name),
            ...knowledgeBase.wives.map(w => w.name),
            ...knowledgeBase.slaves.filter(s => s.id !== slaveId).map(s => s.name),
            ...knowledgeBase.prisoners.map(p => p.name)
        ].filter(Boolean).map(n => (n || '').toLowerCase());
        
        if (allNames.includes(trimmedName.toLowerCase())) {
            showNotification(`Tên "${trimmedName}" đã tồn tại. Vui lòng chọn tên khác.`, "error");
            return;
        }
    
        const oldNameForTag = slaveToRename.name.replace(/"/g, '\\"');
        const newNameForTag = trimmedName.replace(/"/g, '\\"');
        const tag = `[SLAVE_UPDATE: name="${oldNameForTag}", newName="${newNameForTag}"]`;
        
        handleProcessDebugTags('', tag);
    
    }, [knowledgeBase, handleProcessDebugTags, showNotification]);
    


    // The value provided to the context consumers
    const contextValue: GameContextType = {
        currentScreen,
        knowledgeBase,
        gameMessages,
        styleSettings,
        storageSettings,
        isInitialLoading,
        storageInitError,
        notification,
        apiError,
        isLoadingApi,
        isSummarizingNextPageTransition,
        isAutoPlaying,
        isSavingGame,
        isAutoSaving,
        isSummarizingOnLoad,
        isCraftingItem,
        isUploadingAvatar,
        isCultivating,
        sentCultivationPromptsLog: gameData.sentCultivationPromptsLog,
        receivedCultivationResponsesLog: gameData.receivedCultivationResponsesLog,
        prisonerInteractionLog: gameData.prisonerInteractionLog,
        companionInteractionLog: gameData.companionInteractionLog,
        sentPrisonerPromptsLog: gameData.sentPrisonerPromptsLog,
        receivedPrisonerResponsesLog: gameData.receivedPrisonerResponsesLog,
        sentCompanionPromptsLog: gameData.sentCompanionPromptsLog,
        receivedCompanionResponsesLog: gameData.receivedCompanionResponsesLog,
        rawAiResponsesLog: gameData.rawAiResponsesLog,
        sentPromptsLog: gameData.sentPromptsLog,
        sentEconomyPromptsLog: gameData.sentEconomyPromptsLog,
        receivedEconomyResponsesLog: gameData.receivedEconomyResponsesLog,
        sentGeneralSubLocationPromptsLog: gameData.sentGeneralSubLocationPromptsLog,
        receivedGeneralSubLocationResponsesLog: gameData.receivedGeneralSubLocationResponsesLog,
        retrievedRagContextLog: gameData.retrievedRagContextLog,
        latestPromptTokenCount: gameData.latestPromptTokenCount,
        summarizationResponsesLog: gameData.summarizationResponsesLog,
        sentCraftingPromptsLog: gameData.sentCraftingPromptsLog,
        receivedCraftingResponsesLog: gameData.receivedCraftingResponsesLog,
        sentNpcAvatarPromptsLog,
        sentCombatSummaryPromptsLog: gameData.sentCombatSummaryPromptsLog,
        receivedCombatSummaryResponsesLog: gameData.receivedCombatSummaryResponsesLog,
        sentVictoryConsequencePromptsLog: gameData.sentVictoryConsequencePromptsLog,
        receivedVictoryConsequenceResponsesLog: gameData.receivedVictoryConsequenceResponsesLog,
        currentPageDisplay,
        totalPages,
        messageIdBeingEdited,
        currentPageMessagesLog,
        previousPageSummaries: previousPageSummariesContent,
        lastNarrationFromPreviousPage,
        selectedEntity,
        isStyleSettingsModalOpen,
        isAiContextModalOpen,
        activeEconomyModal,
        activeSlaveMarketModal,
        openEntityModal,
        closeModal,
        closeEconomyModal,
        closeSlaveMarketModal,
        setIsStyleSettingsModalOpen,
        setIsAiContextModalOpen,
        setActiveEconomyModal,
        setActiveSlaveMarketModal,
        setCurrentScreen,
        setKnowledgeBase,
        setGameMessages,
        setStyleSettings,
        setRetrievedRagContextLog,
        handleSetupComplete: handleSetupCompleteWrapper,
        handlePlayerAction: gameActions.handlePlayerAction,
        handleFindLocation: gameActions.handleFindLocation,
        handleNonCombatDefeat: gameActions.handleNonCombatDefeat,
        handlePrisonerAction: gameActions.handlePrisonerAction,
        handleCompanionAction: gameActions.handleCompanionAction,
        handleExitPrisonerScreen: gameActions.handleExitPrisonerScreen,
        handleExitCompanionScreen: gameActions.handleExitCompanionScreen,
        onQuit,
        onSaveGame,
        onLoadGame,
        handleUpdateEquipment,
        handleCraftItem,
        handleBuyItem,
        handleSellItem,
        handleCombatEnd,
        onGoToNextPage: () => setCurrentPageDisplay(prev => Math.min(prev + 1, totalPages)),
        onGoToPrevPage: () => setCurrentPageDisplay(prev => Math.max(prev - 1, 1)),
        onJumpToPage: (page: number) => setCurrentPageDisplay(Math.max(1, Math.min(page, totalPages))),
        getMessagesForPage: getMessagesForPageFromHook,
        isCurrentlyActivePage: currentPageDisplay === totalPages,
        onRollbackTurn,
        onToggleAutoPlay: () => setIsAutoPlaying(prev => !prev),
        onStartEditMessage,
        onSaveEditedMessage,
        onCancelEditMessage,
        onUpdatePlayerAvatar: handleUpdatePlayerAvatar,
        onUpdateNpcAvatar: handleUpdateNpcAvatar,
        handleStartAuction: gameActions.handleStartAuction,
        handlePlayerAuctionAction: gameActions.handlePlayerAuctionAction,
        handleAuctioneerCall: gameActions.handleAuctioneerCall,
        handleSkipAuctionItem: gameActions.handleSkipAuctionItem,
        handleStartCultivation: gameActions.handleStartCultivation,
        handleExitCultivation: gameActions.handleExitCultivation,
        fetchSaveGamesForImportExport,
        loadSpecificGameDataForExport,
        handleImportGameData,
        showNotification,
        onSettingsSaved,
        gameplayScrollPosition,
        justLoadedGame,
        convertPrisoner,
        handleProcessDebugTags,
        handleBuySlave: gameActions.handleBuySlave,
        handleSellSlave: gameActions.handleSellSlave,
        handleStartSlaveAuction: gameActions.handleStartSlaveAuction,
        handlePlayerSlaveAuctionAction: gameActions.handlePlayerSlaveAuctionAction,
        handleSlaveAuctioneerCall: gameActions.handleSlaveAuctioneerCall,
        handleSkipSlaveAuctionItem: gameActions.handleSkipSlaveAuctionItem,
        renameSlave,
        updateLocationCoordinates,
        handleCheckTokenCount: gameActions.handleCheckTokenCount,
    };

    return (
        <GameContext.Provider value={contextValue}>
            {children}
        </GameContext.Provider>
    );
};