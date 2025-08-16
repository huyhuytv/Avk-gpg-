import { useCallback } from 'react';
import { KnowledgeBase, GameMessage, WorldSettings, GameScreen, RealmBaseStatDefinition, TurnHistoryEntry, WorldDate } from '../../types';
import { INITIAL_KNOWLEDGE_BASE, APP_VERSION, DEFAULT_PLAYER_STATS, DEFAULT_TIERED_STATS, VIETNAMESE, MAX_AUTO_SAVE_SLOTS } from '../../constants';
import { generateInitialStory } from '../../services/geminiService';
import { performTagProcessing, calculateRealmBaseStats, addTurnHistoryEntryRaw, calculateEffectiveStats, vectorizeKnowledgeBase, DEFAULT_AI_CONTEXT_CONFIG } from '../../utils/gameLogicUtils'; // Import vectorizeKnowledgeBase

interface UseSetupActionsProps {
  setIsLoadingApi: React.Dispatch<React.SetStateAction<boolean>>;
  resetApiError: () => void;
  setKnowledgeBase: React.Dispatch<React.SetStateAction<KnowledgeBase>>;
  setCurrentPageDisplay: React.Dispatch<React.SetStateAction<number>>;
  setCurrentScreen: (screen: GameScreen) => void;
  addMessageAndUpdateState: (newMessages: GameMessage[], newKnowledgeBase: KnowledgeBase, callback?: () => void) => void;
  logSentPromptCallback: (prompt: string) => void;
  setRawAiResponsesLog: React.Dispatch<React.SetStateAction<string[]>>;
  setApiErrorWithTimeout: (message: string | null) => void;
  logNpcAvatarPromptCallback?: (prompt: string) => void;
}

export const useSetupActions = ({
  setIsLoadingApi,
  resetApiError,
  setKnowledgeBase,
  setCurrentPageDisplay,
  setCurrentScreen,
  addMessageAndUpdateState,
  logSentPromptCallback,
  setRawAiResponsesLog,
  setApiErrorWithTimeout,
  logNpcAvatarPromptCallback,
}: UseSetupActionsProps) => {

  const handleSetupComplete = useCallback(async (settings: WorldSettings, dataForKbPlayerAvatar?: string | null) => { 
    setIsLoadingApi(true);
    resetApiError();
    
    const playerRaceTrimmed = settings.playerRace.trim();
    let playerRaceSystem = settings.raceCultivationSystems.find(s => s.raceName.trim() === playerRaceTrimmed);

    // Fallback logic if the specific race is not found.
    if (!playerRaceSystem) {
        // Attempt to match the start of the realm string to a race name.
        playerRaceSystem = settings.raceCultivationSystems.find(s => settings.canhGioiKhoiDau.trim().startsWith(s.raceName.trim()));
        if (playerRaceSystem) {
            console.log(`[SETUP_DEBUG] Player race "${settings.playerRace}" not found. Inferred race "${playerRaceSystem.raceName}" from starting realm "${settings.canhGioiKhoiDau}".`);
        }
    }
    
    // Fallback to the first system in the array as a last resort.
    const realmProgression = (playerRaceSystem?.realmSystem || settings.raceCultivationSystems[0]?.realmSystem || '').split(' - ').map(s => s.trim()).filter(Boolean);
    const initialRealm = settings.canhGioiKhoiDau;
    
    const generatedBaseStats: Record<string, RealmBaseStatDefinition> = {};
    realmProgression.forEach((realmName, index) => {
        generatedBaseStats[realmName] = DEFAULT_TIERED_STATS[Math.min(index, DEFAULT_TIERED_STATS.length - 1)];
    });
    
    const initialCalculatedStats = calculateRealmBaseStats(initialRealm, realmProgression, generatedBaseStats);
    
    const worldConfigForKb = { ...settings }; 

    // Failsafe: Ensure the startingDate object has the 'buoi' property.
    const dateToUse = { ...settings.startingDate };
    if (typeof (dateToUse as any).buoi !== 'undefined') {
        console.warn("[Setup] `buoi` was found in settings.startingDate. Migrating to hour/minute.", dateToUse);
        const buoi = (dateToUse as any).buoi;
        delete (dateToUse as any).buoi;
        switch(buoi) {
            case 'Sáng Sớm': (dateToUse as WorldDate).hour = 6; (dateToUse as WorldDate).minute = 0; break;
            case 'Buổi Sáng': (dateToUse as WorldDate).hour = 8; (dateToUse as WorldDate).minute = 0; break;
            case 'Buổi Trưa': (dateToUse as WorldDate).hour = 12; (dateToUse as WorldDate).minute = 0; break;
            case 'Buổi Chiều': (dateToUse as WorldDate).hour = 15; (dateToUse as WorldDate).minute = 0; break;
            case 'Hoàng Hôn': (dateToUse as WorldDate).hour = 18; (dateToUse as WorldDate).minute = 0; break;
            case 'Buổi Tối': (dateToUse as WorldDate).hour = 20; (dateToUse as WorldDate).minute = 0; break;
            case 'Nửa Đêm': (dateToUse as WorldDate).hour = 0; (dateToUse as WorldDate).minute = 0; break;
            default: (dateToUse as WorldDate).hour = 8; (dateToUse as WorldDate).minute = 0;
        }
    }
    if (typeof (dateToUse as WorldDate).hour === 'undefined') (dateToUse as WorldDate).hour = 8;
    if (typeof (dateToUse as WorldDate).minute === 'undefined') (dateToUse as WorldDate).minute = 0;


    let minimalInitialKB: KnowledgeBase = {
      ...INITIAL_KNOWLEDGE_BASE, 
      worldDate: dateToUse as WorldDate,
      aiContextConfig: DEFAULT_AI_CONTEXT_CONFIG, // NEW: Add default AI config
      playerStats: {
        ...DEFAULT_PLAYER_STATS, 
        realm: initialRealm, 
        ...initialCalculatedStats, 
        sinhLuc: initialCalculatedStats.baseMaxSinhLuc || DEFAULT_PLAYER_STATS.maxSinhLuc,
        linhLuc: initialCalculatedStats.baseMaxLinhLuc || DEFAULT_PLAYER_STATS.maxLinhLuc,
        kinhNghiem: 0,
        turn: 0, // Turn is 0 before the first AI response generates turn 1 content
        hieuUngBinhCanh: false,
        activeStatusEffects: [], 
        spiritualRoot: settings.playerSpiritualRoot || "Phàm Căn",
        specialPhysique: settings.playerSpecialPhysique || "Phàm Thể",
        professions: [],
        thoNguyen: settings.playerThoNguyen ?? 120,
        maxThoNguyen: settings.playerMaxThoNguyen ?? 120,
        playerSpecialStatus: null,
      },
      realmProgressionList: realmProgression,
      currentRealmBaseStats: generatedBaseStats,
      worldConfig: worldConfigForKb, 
      appVersion: APP_VERSION,
      pageSummaries: {},
      currentPageHistory: [1], // Initial page starts at turn 1 (after AI gen)
      lastSummarizedTurn: 0,
      turnHistory: [], // Starts empty
      autoSaveTurnCounter: 0,
      currentAutoSaveSlotIndex: 0,
      autoSaveSlotIds: Array(MAX_AUTO_SAVE_SLOTS).fill(null),
      manualSaveId: null,
      manualSaveName: settings.saveGameName || VIETNAMESE.saveGameNamePlaceholder.replace("[Tên Nhân Vật]", settings.playerName || "Tân Đạo Hữu"),
      playerAvatarData: dataForKbPlayerAvatar || settings.playerAvatarUrl || undefined, 
    };
    
    // History entry for "before turn 1" (initial state)
    minimalInitialKB.turnHistory = addTurnHistoryEntryRaw(
        [], // No previous history
        JSON.parse(JSON.stringify(minimalInitialKB)), // Snapshot of the very initial KB
        []  // No messages before the game starts
    );

    setKnowledgeBase(minimalInitialKB); 
    setCurrentPageDisplay(1);
    setCurrentScreen(GameScreen.Gameplay); 

    try {
      const {response, rawText} = await generateInitialStory(minimalInitialKB, logSentPromptCallback); 
      setRawAiResponsesLog(prev => [rawText, ...prev].slice(0,50));
      
      let workingKbForProcessing = JSON.parse(JSON.stringify(minimalInitialKB));
       // The turn for the first AI-generated content is 1.
      // Tags in initial story should modify this "turn 1" state.
      const { 
        newKb: kbAfterTags, 
        turnIncrementedByTag, // This should ideally not happen or be handled carefully for turn 1
        systemMessagesFromTags: systemMessagesFromInitialTags, 
        realmChangedByTag: realmChangedByInitTag 
      } = await performTagProcessing(workingKbForProcessing, response.tags, 1, setKnowledgeBase, logNpcAvatarPromptCallback); 
      
      let finalKbForDisplay = kbAfterTags;
      
      // FIX: Re-apply the user's settings for lifespan over any values the AI might have generated.
      // This ensures user input from the setup screen is always respected.
      if (settings.playerThoNguyen !== undefined) {
          finalKbForDisplay.playerStats.thoNguyen = Number(settings.playerThoNguyen);
      }
      if (settings.playerMaxThoNguyen !== undefined) {
          finalKbForDisplay.playerStats.maxThoNguyen = Number(settings.playerMaxThoNguyen);
      }

      let turnForInitialMessages = 1;

      // Ensure turn is at least 1 after initial tags.
      if (finalKbForDisplay.playerStats.turn < 1) {
          finalKbForDisplay.playerStats.turn = 1;
      }
      turnForInitialMessages = finalKbForDisplay.playerStats.turn;
      
      if (realmChangedByInitTag) {
          const reCalculatedStats = calculateRealmBaseStats(finalKbForDisplay.playerStats.realm, finalKbForDisplay.realmProgressionList, finalKbForDisplay.currentRealmBaseStats);
          finalKbForDisplay.playerStats = { ...finalKbForDisplay.playerStats, ...reCalculatedStats };
          finalKbForDisplay.playerStats.sinhLuc = finalKbForDisplay.playerStats.maxSinhLuc;
          finalKbForDisplay.playerStats.linhLuc = finalKbForDisplay.playerStats.maxLinhLuc;
          finalKbForDisplay.playerStats.kinhNghiem = Math.min(finalKbForDisplay.playerStats.kinhNghiem, finalKbForDisplay.playerStats.maxKinhNghiem);
      } else {
          finalKbForDisplay.playerStats.sinhLuc = initialCalculatedStats.baseMaxSinhLuc || finalKbForDisplay.playerStats.maxSinhLuc;
          finalKbForDisplay.playerStats.linhLuc = initialCalculatedStats.baseMaxLinhLuc || finalKbForDisplay.playerStats.maxLinhLuc;
      }
      
      // currentPageHistory should correctly point to the start turn of the first page.
      finalKbForDisplay.playerStats = calculateEffectiveStats(finalKbForDisplay.playerStats, finalKbForDisplay.equippedItems, finalKbForDisplay.inventory);
      
      // Set initial location based on the first discovered location from the setup
      const firstLocation = finalKbForDisplay.discoveredLocations?.[0];
      if (firstLocation) {
          finalKbForDisplay.currentLocationId = firstLocation.id;
      }

      const newMessages: GameMessage[] = [];
      newMessages.push({
        id: Date.now().toString() + Math.random(), type: 'narration', content: response.narration, 
        timestamp: Date.now(), choices: response.choices, turnNumber: turnForInitialMessages
      });
      if (response.systemMessage) {
        newMessages.push({
          id: Date.now().toString() + Math.random(), type: 'system', content: response.systemMessage, 
          timestamp: Date.now(), turnNumber: turnForInitialMessages
        });
      }
      newMessages.push(...systemMessagesFromInitialTags.map(m => ({...m, turnNumber: turnForInitialMessages})));
      
      // Vectorize the initial knowledge base for RAG
      try {
        console.log("Vectorizing initial knowledge base for RAG...");
        finalKbForDisplay.ragVectorStore = await vectorizeKnowledgeBase(finalKbForDisplay);
        console.log(`Initial vectorization complete. Vector store has ${finalKbForDisplay.ragVectorStore.vectors.length} entries.`);
        newMessages.push({
          id: `rag-init-${Date.now()}`,
          type: 'system',
          content: `[DEBUG] Đã tạo ${finalKbForDisplay.ragVectorStore.metadata.length} vector cho ngữ cảnh RAG.`,
          timestamp: Date.now(),
          turnNumber: turnForInitialMessages
        });
      } catch (embeddingError) {
          console.error("Failed to vectorize initial knowledge base:", embeddingError);
          newMessages.push({
            id: `rag-init-error-${Date.now()}`,
            type: 'error',
            content: `Lỗi tạo vector ngữ cảnh: ${embeddingError instanceof Error ? embeddingError.message : 'Unknown error'}.`,
            timestamp: Date.now(),
            turnNumber: turnForInitialMessages
          });
      }
      
      addMessageAndUpdateState(newMessages, finalKbForDisplay);

    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      setApiErrorWithTimeout(`Lỗi khi tạo cốt truyện ban đầu: ${errorMsg}`);
      setCurrentScreen(GameScreen.Initial);
    } finally {
      setIsLoadingApi(false);
    }
  }, [
    setIsLoadingApi,
    resetApiError,
    setKnowledgeBase,
    setCurrentPageDisplay,
    setCurrentScreen,
    addMessageAndUpdateState,
    logSentPromptCallback,
    setRawAiResponsesLog,
    setApiErrorWithTimeout,
    logNpcAvatarPromptCallback
  ]);

  return { handleSetupComplete };
};