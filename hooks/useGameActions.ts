import { useCallback, useState } from 'react';
import { KnowledgeBase, GameMessage, WorldSettings, PlayerActionInputType, ResponseLength, GameScreen, RealmBaseStatDefinition, TurnHistoryEntry, AuctionState, Item, AuctionCommentaryEntry, FindLocationParams, Prisoner, Wife, Slave, CombatEndPayload, AuctionSlave, NPC, CombatDispositionMap } from './../types';
import { countTokens, getApiSettings as getGeminiApiSettings, handleCompanionInteraction, handlePrisonerInteraction, summarizeCompanionInteraction, summarizePrisonerInteraction, generateNonCombatDefeatConsequence, generateSlaveAuctionData, runSlaveAuctionTurn, runSlaveAuctioneerCall, generateVictoryConsequence, summarizeCombat, generateDefeatConsequence, generateCraftedItemViaAI, findLocationWithAI, generateNextTurn } from './../services/geminiService';
import { useSetupActions } from './actions/useSetupActions';
import { useAuctionActions } from './actions/useAuctionActions';
import { useMainGameLoop } from './actions/useMainGameLoop';
import { useCultivationActions } from './actions/useCultivationActions';
import { performTagProcessing } from '../utils/tagProcessingUtils';
import { VIETNAMESE } from '../constants';
import { calculateSlaveValue } from '../utils/gameLogicUtils';

interface UseGameActionsProps {
  knowledgeBase: KnowledgeBase;
  setKnowledgeBase: React.Dispatch<React.SetStateAction<KnowledgeBase>>;
  gameMessages: GameMessage[];
  addMessageAndUpdateState: (newMessages: GameMessage[], newKnowledgeBase: KnowledgeBase, callback?: () => void) => void;
  setRawAiResponsesLog: React.Dispatch<React.SetStateAction<string[]>>;
  setSentPromptsLog: React.Dispatch<React.SetStateAction<string[]>>;
  setSentEconomyPromptsLog: React.Dispatch<React.SetStateAction<string[]>>;
  setReceivedEconomyResponsesLog: React.Dispatch<React.SetStateAction<string[]>>;
  setSentGeneralSubLocationPromptsLog: React.Dispatch<React.SetStateAction<string[]>>;
  setReceivedGeneralSubLocationResponsesLog: React.Dispatch<React.SetStateAction<string[]>>;
  setLatestPromptTokenCount: React.Dispatch<React.SetStateAction<number | null | string>>;
  setSummarizationResponsesLog: React.Dispatch<React.SetStateAction<string[]>>;
  showNotification: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  setCurrentScreen: (screen: GameScreen) => void;
  currentPageDisplay: number;
  setCurrentPageDisplay: React.Dispatch<React.SetStateAction<number>>;
  isAutoPlaying: boolean;
  setIsAutoPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  executeSaveGame: (kbToSave: KnowledgeBase, messagesToSave: GameMessage[], saveName: string, existingId: string | null, isAuto: boolean) => Promise<string | null>;
  storageType: string; 
  firebaseUser: null; // FirebaseUser replaced with null
  logNpcAvatarPromptCallback: (prompt: string) => void;
  setApiErrorWithTimeout: (message: string | null) => void;
  resetApiError: () => void;
  isLoadingApi: boolean;
  setIsLoadingApi: React.Dispatch<React.SetStateAction<boolean>>;
  setIsCultivating: React.Dispatch<React.SetStateAction<boolean>>;
  setSentCultivationPromptsLog: React.Dispatch<React.SetStateAction<string[]>>;
  setReceivedCultivationResponsesLog: React.Dispatch<React.SetStateAction<string[]>>;
  setCompanionInteractionLog: React.Dispatch<React.SetStateAction<string[]>>;
  setPrisonerInteractionLog: React.Dispatch<React.SetStateAction<string[]>>;
  setSentPrisonerPromptsLog: React.Dispatch<React.SetStateAction<string[]>>;
  setReceivedPrisonerResponsesLog: React.Dispatch<React.SetStateAction<string[]>>;
  setSentCompanionPromptsLog: React.Dispatch<React.SetStateAction<string[]>>;
  setReceivedCompanionResponsesLog: React.Dispatch<React.SetStateAction<string[]>>;
  setRetrievedRagContextLog: React.Dispatch<React.SetStateAction<string[]>>; // NEW
  onQuit: () => void;
  // New props for context
  currentPageMessagesLog: string;
  previousPageSummaries: string[];
  lastNarrationFromPreviousPage?: string;
  // New props for combat summary logs
  setSentCombatSummaryPromptsLog: React.Dispatch<React.SetStateAction<string[]>>;
  setReceivedCombatSummaryResponsesLog: React.Dispatch<React.SetStateAction<string[]>>;
  setSentVictoryConsequencePromptsLog: React.Dispatch<React.SetStateAction<string[]>>;
  setReceivedVictoryConsequenceResponsesLog: React.Dispatch<React.SetStateAction<string[]>>;
  sentPromptsLog: string[]; // Pass sentPromptsLog for manual token check
}

export const useGameActions = (props: UseGameActionsProps) => {
  const { 
      setSentPromptsLog, setLatestPromptTokenCount, setIsLoadingApi, isLoadingApi, 
      knowledgeBase, setKnowledgeBase, addMessageAndUpdateState, showNotification, 
      setCurrentScreen, currentPageMessagesLog, previousPageSummaries, lastNarrationFromPreviousPage, 
      onQuit, logNpcAvatarPromptCallback, setRawAiResponsesLog, setApiErrorWithTimeout, 
      resetApiError, setSentEconomyPromptsLog, setReceivedEconomyResponsesLog, 
      setSentCombatSummaryPromptsLog, setReceivedCombatSummaryResponsesLog, 
      setSentVictoryConsequencePromptsLog, setReceivedVictoryConsequenceResponsesLog
    } = props;

  const logSentPromptCallback = useCallback((prompt: string) => {
    setSentPromptsLog(prev => [prompt, ...prev].slice(0, 10));
    setLatestPromptTokenCount('Chưa kiểm tra'); // Set to unchecked state
  }, [setSentPromptsLog, setLatestPromptTokenCount]);

  const handleCheckTokenCount = useCallback(async () => {
    if (isLoadingApi) return;
    const latestPrompt = props.sentPromptsLog[0];
    if (!latestPrompt) {
        showNotification("Không có prompt nào gần đây để kiểm tra.", 'warning');
        return;
    }
    
    setIsLoadingApi(true); // Re-using isLoadingApi for simplicity
    setLatestPromptTokenCount('Đang tính...');
    try {
        const tokenCount = await countTokens(latestPrompt);
        setLatestPromptTokenCount(tokenCount);
    } catch (err) {
        console.error("Error checking token count:", err);
        setLatestPromptTokenCount('Lỗi');
        const errorMsg = err instanceof Error ? err.message : "Lỗi khi kiểm tra token.";
        setApiErrorWithTimeout(errorMsg);
    } finally {
        setIsLoadingApi(false);
    }
  }, [props.sentPromptsLog, isLoadingApi, setIsLoadingApi, setLatestPromptTokenCount, setApiErrorWithTimeout, showNotification]);

  const { handleSetupComplete } = useSetupActions({
    ...props,
    setIsLoadingApi,
    logSentPromptCallback,
  });

  const handleNonCombatDefeat = useCallback(async (kbStateAtDefeat: KnowledgeBase, fatalNarration?: string) => {
    // NEW CHECK: If player is already a prisoner or slave, prevent standard defeat.
    if (kbStateAtDefeat.playerStats.playerSpecialStatus) {
        showNotification("Bạn đã gục ngã nhưng số phận của bạn nằm trong tay chủ nhân.", "warning");
        const newKb = JSON.parse(JSON.stringify(kbStateAtDefeat));
        if (newKb.playerStats.sinhLuc <= 0) {
            newKb.playerStats.sinhLuc = 1; // Heal to 1 HP to prevent repeated triggers
        }
        const systemMessage: GameMessage = {
            id: `non-combat-defeat-prevented-${Date.now()}`,
            type: 'system',
            content: `Bạn đã gục ngã, nhưng vì đang là ${newKb.playerStats.playerSpecialStatus.type === 'prisoner' ? 'tù nhân' : 'nô lệ'}, bạn không thể chết. Số phận của bạn sẽ do ${newKb.playerStats.playerSpecialStatus.ownerName} quyết định.`,
            timestamp: Date.now(),
            turnNumber: newKb.playerStats.turn
        };
        addMessageAndUpdateState([systemMessage], newKb);
        setIsLoadingApi(false); // Reset loading state set by the caller
        return; // Exit early to avoid the defeat consequence prompt
    }

    setIsLoadingApi(true);
    resetApiError();
    showNotification("Bạn đã gục ngã! AI đang quyết định số phận của bạn...", 'warning');

    try {
        const { response, rawText } = await generateNonCombatDefeatConsequence(
            kbStateAtDefeat,
            currentPageMessagesLog,
            previousPageSummaries,
            fatalNarration || 'Bạn đã gục ngã do một sự kiện không rõ.',
            lastNarrationFromPreviousPage,
            (prompt) => setSentPromptsLog(prev => [prompt, ...prev].slice(0, 10))
        );
        setRawAiResponsesLog(prev => [rawText, ...prev].slice(0, 50));

        const {
            newKb: kbAfterTags,
            systemMessagesFromTags
        } = await performTagProcessing(
            kbStateAtDefeat, // We process tags based on the state *before* the consequence
            response.tags,
            kbStateAtDefeat.playerStats.turn + 1, // Consequence is the next turn
            setKnowledgeBase,
            logNpcAvatarPromptCallback
        );

        // FIX: Ensure any pending combat from a contradictory tag is cleared when defeat occurs.
        kbAfterTags.pendingCombat = null;

        const narrationMessage: GameMessage = {
            id: 'non-combat-defeat-narration-' + Date.now(),
            type: 'narration',
            content: response.narration,
            timestamp: Date.now(),
            choices: response.choices,
            turnNumber: kbAfterTags.playerStats.turn, // Use the turn from after tag processing
        };
        
        const finalMessages = [narrationMessage, ...systemMessagesFromTags];
        addMessageAndUpdateState(finalMessages, kbAfterTags);

    } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Lỗi khi xử lý hậu quả.";
        setApiErrorWithTimeout(errorMsg);
        onQuit(); // A drastic measure if consequence generation fails.
    } finally {
        setIsLoadingApi(false);
    }
  }, [addMessageAndUpdateState, showNotification, setIsLoadingApi, setApiErrorWithTimeout, setRawAiResponsesLog, setSentPromptsLog, resetApiError, onQuit, setKnowledgeBase, logNpcAvatarPromptCallback, currentPageMessagesLog, lastNarrationFromPreviousPage, previousPageSummaries]);
  
  const mainGameLoopActions = useMainGameLoop({
      ...props,
      setIsLoadingApi,
      logSentPromptCallback,
      handleNonCombatDefeat,
  });

  const auctionActions = useAuctionActions({
      ...props,
      isLoadingApi,
      setIsLoadingApi,
  });

  const cultivationActions = useCultivationActions({
    ...props
  });
  
  const handlePrisonerAction = useCallback(async (prisoner: Prisoner, action: string) => {
    if (isLoadingApi) return;
    setIsLoadingApi(true);
    props.resetApiError();
    try {
        const { response, rawText } = await handlePrisonerInteraction(
            knowledgeBase, 
            prisoner, 
            action,
            currentPageMessagesLog,
            previousPageSummaries,
            lastNarrationFromPreviousPage,
            (prompt) => props.setSentPrisonerPromptsLog(prev => [prompt, ...prev].slice(0, 20))
        );
        props.setReceivedPrisonerResponsesLog(prev => [rawText, ...prev].slice(0, 20));

        const { newKb } = await performTagProcessing(knowledgeBase, response.tags, knowledgeBase.playerStats.turn, setKnowledgeBase, props.logNpcAvatarPromptCallback);
        setKnowledgeBase(newKb);
        props.setPrisonerInteractionLog(prev => [...prev, response.narration]);
    } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Lỗi khi tương tác với tù nhân.";
        props.setApiErrorWithTimeout(errorMsg);
    } finally {
        setIsLoadingApi(false);
    }
  }, [knowledgeBase, setIsLoadingApi, props, currentPageMessagesLog, previousPageSummaries, lastNarrationFromPreviousPage]);

  const handleCompanionAction = useCallback(async (companion: Wife | Slave, action: string) => {
    if (isLoadingApi) return;
    setIsLoadingApi(true);
    props.resetApiError();
    try {
        const { response, rawText } = await handleCompanionInteraction(
            knowledgeBase, 
            companion, 
            action,
            currentPageMessagesLog,
            previousPageSummaries,
            lastNarrationFromPreviousPage,
            (prompt) => props.setSentCompanionPromptsLog(prev => [prompt, ...prev].slice(0, 20))
        );
        props.setReceivedCompanionResponsesLog(prev => [rawText, ...prev].slice(0, 20));

        const { newKb } = await performTagProcessing(knowledgeBase, response.tags, knowledgeBase.playerStats.turn, setKnowledgeBase, props.logNpcAvatarPromptCallback);
        setKnowledgeBase(newKb);
        props.setCompanionInteractionLog(prev => [...prev, response.narration]);
    } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Lỗi khi tương tác với bạn đồng hành.";
        props.setApiErrorWithTimeout(errorMsg);
    } finally {
        setIsLoadingApi(false);
    }
  }, [knowledgeBase, setIsLoadingApi, props, currentPageMessagesLog, previousPageSummaries, lastNarrationFromPreviousPage]);

  const handleExitPrisonerScreen = useCallback(async (log: string[]) => {
      if (log.length > 0) {
          try {
            const summary = await summarizePrisonerInteraction(log);
            const summaryMessage: GameMessage = {
                id: 'prisoner-summary-' + Date.now(),
                type: 'event_summary',
                content: summary,
                timestamp: Date.now(),
                turnNumber: knowledgeBase.playerStats.turn,
            };
            addMessageAndUpdateState([summaryMessage], knowledgeBase);
          } catch(err) {
              console.error("Failed to summarize prisoner interactions:", err);
              showNotification("Lỗi tóm tắt tương tác với tù nhân.", 'error');
          }
      }
      props.setPrisonerInteractionLog([]);
      props.setSentPrisonerPromptsLog([]);
      props.setReceivedPrisonerResponsesLog([]);
      setCurrentScreen(GameScreen.Gameplay);
  }, [knowledgeBase, addMessageAndUpdateState, showNotification, setCurrentScreen, props]);

  const handleExitCompanionScreen = useCallback(async (log: string[]) => {
    if (log.length > 0) {
        try {
          const summary = await summarizeCompanionInteraction(log);
          const summaryMessage: GameMessage = {
              id: 'companion-summary-' + Date.now(),
              type: 'event_summary',
              content: summary,
              timestamp: Date.now(),
              turnNumber: knowledgeBase.playerStats.turn,
          };
          addMessageAndUpdateState([summaryMessage], knowledgeBase);
        } catch(err) {
            console.error("Failed to summarize companion interactions:", err);
            showNotification("Lỗi tóm tắt tương tác với bạn đồng hành.", 'error');
        }
    }
    props.setCompanionInteractionLog([]);
    props.setSentCompanionPromptsLog([]);
    props.setReceivedCompanionResponsesLog([]);
    setCurrentScreen(GameScreen.Gameplay);
}, [knowledgeBase, addMessageAndUpdateState, showNotification, setCurrentScreen, props]);

const handleCombatEnd = useCallback(async (result: CombatEndPayload) => {
    setIsLoadingApi(true);
    resetApiError();
    // Clear pendingCombat from KB now that combat is fully resolved.
    const kbAfterCombat = { ...knowledgeBase, playerStats: result.finalPlayerState, pendingCombat: null, postCombatState: null };
    setKnowledgeBase(kbAfterCombat); // Update state immediately

    try {
        const summary = await summarizeCombat(
            result.summary.split('\n'),
            result.outcome,
            (prompt) => setSentCombatSummaryPromptsLog(prev => [prompt, ...prev].slice(0, 10))
        );
        setReceivedCombatSummaryResponsesLog(prev => [summary, ...prev].slice(0, 10));

        const updatedResultWithSummary = { ...result, summary };
        
        const summaryMessage: GameMessage = {
            id: 'combat-summary-' + Date.now(),
            type: 'event_summary',
            content: `Tóm tắt trận chiến: ${summary}`,
            timestamp: Date.now(),
            turnNumber: kbAfterCombat.playerStats.turn
        };
        addMessageAndUpdateState([summaryMessage], kbAfterCombat);

        // Now, generate consequences based on the final outcome
        if (result.outcome === 'victory' || result.outcome === 'surrendered') {
            const { response: consequenceResponse, rawText } = await generateVictoryConsequence(
                kbAfterCombat, updatedResultWithSummary, currentPageMessagesLog, previousPageSummaries, lastNarrationFromPreviousPage,
                (prompt) => setSentVictoryConsequencePromptsLog(prev => [prompt, ...prev].slice(0, 10))
            );
            setReceivedVictoryConsequenceResponsesLog(prev => [rawText, ...prev].slice(0, 10));
            const { newKb: kbAfterTags, systemMessagesFromTags } = await performTagProcessing(
                kbAfterCombat, consequenceResponse.tags, kbAfterCombat.playerStats.turn + 1, setKnowledgeBase, logNpcAvatarPromptCallback
            );
            const finalMessages: GameMessage[] = [ ...systemMessagesFromTags, {
                id: 'victory-consequence-' + Date.now(), type: 'narration', content: consequenceResponse.narration,
                timestamp: Date.now(), choices: consequenceResponse.choices, turnNumber: kbAfterTags.playerStats.turn
            }];
            addMessageAndUpdateState(finalMessages, kbAfterTags);
        } else if (result.outcome === 'defeat') {
            const { response: consequenceResponse, rawText } = await generateDefeatConsequence(
                kbAfterCombat, updatedResultWithSummary, currentPageMessagesLog, previousPageSummaries, lastNarrationFromPreviousPage,
                (prompt) => setSentVictoryConsequencePromptsLog(prev => [prompt, ...prev].slice(0, 10))
            );
            setReceivedVictoryConsequenceResponsesLog(prev => [rawText, ...prev].slice(0, 10));
            const { newKb: kbAfterTags, systemMessagesFromTags } = await performTagProcessing(
                kbAfterCombat, consequenceResponse.tags, kbAfterCombat.playerStats.turn + 1, setKnowledgeBase, logNpcAvatarPromptCallback
            );
            const finalMessages: GameMessage[] = [ ...systemMessagesFromTags, {
                id: 'defeat-consequence-' + Date.now(), type: 'narration', content: consequenceResponse.narration,
                timestamp: Date.now(), choices: consequenceResponse.choices, turnNumber: kbAfterTags.playerStats.turn
            }];
            addMessageAndUpdateState(finalMessages, kbAfterTags);
        }
        
        setCurrentScreen(GameScreen.Gameplay);

    } catch (error) {
        console.error("Error generating post-combat consequence:", error);
        const errorMsg = `Lỗi tạo hậu quả sau trận chiến: ${error instanceof Error ? error.message : String(error)}`;
        setApiErrorWithTimeout(errorMsg);
        setCurrentScreen(GameScreen.Gameplay); // Still return to gameplay on error
    } finally {
        setIsLoadingApi(false);
    }
}, [
    knowledgeBase, currentPageMessagesLog, previousPageSummaries, lastNarrationFromPreviousPage,
    addMessageAndUpdateState, setIsLoadingApi, resetApiError,
    setSentCombatSummaryPromptsLog, setReceivedCombatSummaryResponsesLog,
    setSentVictoryConsequencePromptsLog, setReceivedVictoryConsequenceResponsesLog,
    setKnowledgeBase, logNpcAvatarPromptCallback, setCurrentScreen, setApiErrorWithTimeout
]);


    const handleBuySlave = useCallback((slave: Slave, vendorId: string) => {
        setKnowledgeBase(prevKb => {
            const newKb = JSON.parse(JSON.stringify(prevKb)) as KnowledgeBase;
            const vendor = newKb.discoveredNPCs.find((n: NPC) => n.id === vendorId);
            if (!vendor) return prevKb;

            const price = slave.value || 0;
            if (newKb.playerStats.currency < price) {
                showNotification(VIETNAMESE.notEnoughMoney, 'error');
                return prevKb;
            }

            // Deduct currency
            newKb.playerStats.currency -= price;

            // Add slave to player's collection
            const { value, ...newSlaveForCollection } = slave;
            newKb.slaves.push(newSlaveForCollection as Slave);

            // Remove slave from vendor's for-sale list
            if (vendor.slavesForSale) {
                vendor.slavesForSale = vendor.slavesForSale.filter((s: Slave) => s.id !== slave.id);
            }
            
            showNotification(`Bạn đã mua nô lệ ${slave.name} với giá ${price.toLocaleString()}.`, 'success');
            return newKb;
        });
    }, [setKnowledgeBase, showNotification]);
    
    const handleSellSlave = useCallback((slaveId: string, vendorId: string) => {
        setKnowledgeBase(prevKb => {
            const newKb = JSON.parse(JSON.stringify(prevKb)) as KnowledgeBase;
            
            const slaveIndex = newKb.slaves.findIndex(s => s.id === slaveId);
            if (slaveIndex === -1) {
                showNotification("Không tìm thấy nô lệ để bán.", "error");
                return prevKb;
            }

            const slaveToSell = newKb.slaves[slaveIndex];
            const slaveRaceSystem = newKb.worldConfig?.raceCultivationSystems.find(rs => rs.raceName === slaveToSell.race)?.realmSystem || newKb.realmProgressionList.join(' - ');
            const slaveRealmProgression = slaveRaceSystem.split(' - ').map(s => s.trim());
            const calculatedValue = calculateSlaveValue(slaveToSell, slaveRealmProgression);
            const sellPrice = Math.floor(calculatedValue * 0.8);

            const vendor = newKb.discoveredNPCs.find(n => n.id === vendorId);
            if (!vendor) {
                showNotification(`Không tìm thấy thương nhân với ID ${vendorId}.`, "error");
                return prevKb;
            }

            // Remove from player's slaves
            newKb.slaves.splice(slaveIndex, 1);
            // Add currency to player
            newKb.playerStats.currency += sellPrice;

            // Optional: Add to vendor's for-sale list.
            if (!vendor.slavesForSale) {
                vendor.slavesForSale = [];
            }
            const slaveForResale = {...slaveToSell, value: calculatedValue};
            vendor.slavesForSale.push(slaveForResale);

            showNotification(`Bạn đã bán nô lệ ${slaveToSell.name} với giá ${sellPrice.toLocaleString()}.`, 'success');
            return newKb;
        });
    }, [setKnowledgeBase, showNotification]);

    const handleStartSlaveAuction = useCallback(async (locationId: string, playerSlaveIds: string[] = []) => {
        setIsLoadingApi(true);
        resetApiError();
        showNotification("Đang chuẩn bị phiên đấu giá nô lệ...", 'info');
        
        let workingKb = JSON.parse(JSON.stringify(knowledgeBase));

        const playerAuctionSlaves: AuctionSlave[] = [];
        if (playerSlaveIds.length > 0) {
            playerSlaveIds.forEach(slaveId => {
                const slaveIndex = workingKb.slaves.findIndex((s: Slave) => s.id === slaveId);
                if (slaveIndex > -1) {
                    const slave = workingKb.slaves[slaveIndex];
                    const slaveRaceSystem = workingKb.worldConfig?.raceCultivationSystems.find((rs: { raceName: any; }) => rs.raceName === slave.race)?.realmSystem || workingKb.realmProgressionList.join(' - ');
                    const slaveRealmProgression = slaveRaceSystem.split(' - ').map((s: string) => s.trim());
                    const slaveValue = calculateSlaveValue(slave, slaveRealmProgression);
                    
                    const playerAuctionSlave: AuctionSlave = {
                        ...slave,
                        ownerId: 'player', 
                        value: slaveValue,
                        startingPrice: Math.floor(slaveValue * 0.5),
                        currentBid: Math.floor(slaveValue * 0.5),
                        buyoutPrice: Math.floor(slaveValue * 2.5),
                        highestBidderId: undefined,
                    };
                    playerAuctionSlaves.push(playerAuctionSlave);
                    // Remove slave from player's list to prevent them being sold twice
                    workingKb.slaves.splice(slaveIndex, 1);
                }
            });
        }
        
        workingKb.slaveAuctionState = {
            isOpen: true,
            items: [],
            auctionNPCs: [],
            currentItemIndex: 0,
            auctioneerCommentary: [],
            lastBidTime: Date.now(),
            auctioneerCallCount: 0,
            locationId: locationId,
        };
    
        try {
            const { response, rawText } = await generateSlaveAuctionData(
                workingKb,
                (prompt) => setSentEconomyPromptsLog(prev => [prompt, ...prev].slice(0, 10))
            );
            setReceivedEconomyResponsesLog(prev => [rawText, ...prev].slice(0, 10));
    
            const { newKb, systemMessagesFromTags } = await performTagProcessing(
                workingKb, 
                response.tags, 
                workingKb.playerStats.turn, 
                setKnowledgeBase, 
                logNpcAvatarPromptCallback
            );
            
            workingKb = newKb;
    
            if (workingKb.slaveAuctionState) {
                workingKb.slaveAuctionState.items.push(...playerAuctionSlaves);
                workingKb.slaveAuctionState.items.sort(() => Math.random() - 0.5); // Shuffle all items
            }

            if (response.systemMessage) {
                 workingKb.slaveAuctionState!.auctioneerCommentary.push({ id: Date.now().toString(), text: response.systemMessage, timestamp: Date.now() });
            }
            
            setKnowledgeBase(workingKb);
            setCurrentScreen(GameScreen.SlaveAuction);
    
        } catch (error) {
            const errorMsg = `Lỗi chuẩn bị đấu giá nô lệ: ${error instanceof Error ? error.message : String(error)}`;
            setApiErrorWithTimeout(errorMsg);
            setKnowledgeBase(prev => ({...prev, slaveAuctionState: null}));
        } finally {
            setIsLoadingApi(false);
        }
    }, [knowledgeBase, setIsLoadingApi, resetApiError, showNotification, setSentEconomyPromptsLog, setReceivedEconomyResponsesLog, setKnowledgeBase, logNpcAvatarPromptCallback, setCurrentScreen, setApiErrorWithTimeout]);
    
    const handlePlayerSlaveAuctionAction = useCallback(async (slaveId: string, bidAmount: number) => {
        setIsLoadingApi(true);
        resetApiError();
    
        const item = knowledgeBase.slaveAuctionState?.items.find(i => i.id === slaveId);
        if (!item) {
            showNotification("Lỗi: Nô lệ đấu giá không tồn tại.", 'error');
            setIsLoadingApi(false);
            return;
        }
        
        let workingKb = JSON.parse(JSON.stringify(knowledgeBase));
        
        if (workingKb.slaveAuctionState) {
            const itemIndex = workingKb.slaveAuctionState.items.findIndex((i: any) => i.id === slaveId);
            if (itemIndex > -1) {
                workingKb.slaveAuctionState.items[itemIndex].currentBid = bidAmount;
                workingKb.slaveAuctionState.items[itemIndex].highestBidderId = 'player';
            }
            workingKb.slaveAuctionState.lastBidTime = Date.now();
            workingKb.slaveAuctionState.auctioneerCallCount = 0;
            const newCommentary: AuctionCommentaryEntry = {id: Date.now().toString(), text: `Bạn đã ra giá ${bidAmount.toLocaleString()}... Chờ phản hồi...`, timestamp: Date.now()};
            workingKb.slaveAuctionState.auctioneerCommentary.push(newCommentary);
        }
        setKnowledgeBase(workingKb);
    
        try {
            const { response, rawText } = await runSlaveAuctionTurn(workingKb, item, bidAmount,
                (prompt) => setSentEconomyPromptsLog(prev => [prompt, ...prev].slice(0, 10))
            );
            setReceivedEconomyResponsesLog(prev => [rawText, ...prev].slice(0, 10));
    
            const { newKb } = await performTagProcessing(
                workingKb, response.tags, workingKb.playerStats.turn, setKnowledgeBase, logNpcAvatarPromptCallback
            );
            workingKb = newKb;
    
            if (response.systemMessage) {
                workingKb.slaveAuctionState!.auctioneerCommentary.push({id: Date.now().toString(), text: response.systemMessage, timestamp: Date.now()});
            }
            
            if (response.tags.some(t => t.toUpperCase().startsWith('[NPC_BID'))) {
                workingKb.slaveAuctionState.lastBidTime = Date.now();
                workingKb.slaveAuctionState.auctioneerCallCount = 0;
            }
            
            setKnowledgeBase(workingKb);
    
        } catch (error) {
             const errorMsg = `Lỗi trong lượt đấu giá nô lệ: ${error instanceof Error ? error.message : String(error)}`;
             setApiErrorWithTimeout(errorMsg);
        } finally {
            setIsLoadingApi(false);
        }
    
    }, [knowledgeBase, setKnowledgeBase, showNotification, setApiErrorWithTimeout, setIsLoadingApi, setSentEconomyPromptsLog, setReceivedEconomyResponsesLog, logNpcAvatarPromptCallback, resetApiError]);
    
    const handleSlaveAuctioneerCall = useCallback(async () => {
        if (isLoadingApi || !knowledgeBase.slaveAuctionState || !knowledgeBase.slaveAuctionState.isOpen) return;
    
        setIsLoadingApi(true);
        const { items, currentItemIndex, auctioneerCallCount } = knowledgeBase.slaveAuctionState;
        const currentItem = items[currentItemIndex];
        let workingKb = JSON.parse(JSON.stringify(knowledgeBase));
    
        const newCallCount = auctioneerCallCount + 1;
    
        if (newCallCount > 3) {
            const winnerId = currentItem.highestBidderId;
            const finalPrice = currentItem.currentBid;
            let systemMessageContent = "";
            const isPlayerOwner = currentItem.ownerId === 'player';
            const currencyName = workingKb.worldConfig?.currencyName || "Tiền";
    
            if (winnerId === 'player') {
                if (isPlayerOwner) {
                    const fee = Math.floor(finalPrice * 0.15);
                    if (workingKb.playerStats.currency >= fee) {
                        workingKb.playerStats.currency -= fee;
                        const { startingPrice, currentBid, buyoutPrice, highestBidderId, ownerId, ...baseSlave } = currentItem;
                        workingKb.slaves.push(baseSlave);
                        systemMessageContent = `Bạn đã mua lại nô lệ của chính mình "${currentItem.name}" với giá ${finalPrice.toLocaleString()} ${currencyName}. Bạn đã trả một khoản phí 15% là ${fee.toLocaleString()} ${currencyName}.`;
                        showNotification(systemMessageContent, 'warning');
                    } else {
                        systemMessageContent = `Bạn đã thắng đấu giá nô lệ của mình nhưng không đủ tiền trả phí! Nhà đấu giá đã tịch thu nô lệ "${currentItem.name}".`;
                        showNotification(systemMessageContent, 'error');
                    }
                } else {
                    if (workingKb.playerStats.currency >= finalPrice) {
                        workingKb.playerStats.currency -= finalPrice;
                        const { startingPrice, currentBid, buyoutPrice, highestBidderId, ownerId, ...baseSlave } = currentItem;
                        const newSlaveForPlayer: Slave = { ...baseSlave, id: `slave-${baseSlave.name.replace(/\s/g, '-')}-${Date.now()}`};
                        workingKb.slaves.push(newSlaveForPlayer);
                        systemMessageContent = `Chúc mừng! Bạn đã thắng đấu giá nô lệ ${currentItem.name} với giá ${finalPrice.toLocaleString()} ${currencyName}.`;
                        showNotification(systemMessageContent, 'success');
                    } else {
                         systemMessageContent = `Bạn không đủ tiền để mua ${currentItem.name}.`;
                         showNotification(systemMessageContent, 'error');
                    }
                }
            } else if (winnerId) {
                const winnerName = workingKb.slaveAuctionState?.auctionNPCs.find((n: any) => n.id === winnerId)?.name || 'một người mua bí ẩn';
                if (isPlayerOwner) {
                    const profit = Math.floor(finalPrice * 0.85);
                    workingKb.playerStats.currency += profit;
                    systemMessageContent = `Nô lệ của bạn, "${currentItem.name}", đã được bán cho ${winnerName} với giá ${finalPrice.toLocaleString()} ${currencyName}. Sau khi trừ phí, bạn nhận được ${profit.toLocaleString()} ${currencyName}.`;
                    showNotification(systemMessageContent, 'success');
                } else {
                    systemMessageContent = `Nô lệ ${currentItem.name} đã được bán cho ${winnerName} với giá ${finalPrice.toLocaleString()} ${currencyName}.`;
                    showNotification(systemMessageContent, 'info');
                }
            } else {
                if (isPlayerOwner) {
                    const { startingPrice, currentBid, buyoutPrice, highestBidderId, ownerId, ...baseSlave } = currentItem;
                    workingKb.slaves.push(baseSlave);
                    systemMessageContent = `Không ai trả giá cho nô lệ "${currentItem.name}" của bạn. Nô lệ được trả lại cho bạn.`;
                } else {
                    systemMessageContent = `Không ai trả giá cho ${currentItem.name}. Vật phẩm bị thu hồi.`
                }
                showNotification(systemMessageContent, 'info');
            }
            
            const nextItemIndex = currentItemIndex + 1;
            if (nextItemIndex >= items.length) {
                workingKb.slaveAuctionState.isOpen = false;
                workingKb.slaveAuctionState.auctioneerCommentary.push({id: Date.now().toString(), text: "Phiên đấu giá đã kết thúc! Cảm ơn quý vị đã tham gia.", timestamp: Date.now()});
            } else {
                workingKb.slaveAuctionState.currentItemIndex = nextItemIndex;
                workingKb.slaveAuctionState.auctioneerCallCount = 0;
                workingKb.slaveAuctionState.lastBidTime = Date.now();
                workingKb.slaveAuctionState.auctioneerCommentary.push({id: Date.now().toString(), text: `Tiếp theo là: ${items[nextItemIndex].name}!`, timestamp: Date.now()});
            }
            
            setKnowledgeBase(workingKb); 
            addMessageAndUpdateState([{
                id: `auction-sold-${currentItem.id}`,
                type: 'event_summary',
                content: systemMessageContent,
                timestamp: Date.now(),
                turnNumber: workingKb.playerStats.turn
            }], workingKb);
    
            setIsLoadingApi(false);
            return;
        }
    
        workingKb.slaveAuctionState.auctioneerCallCount = newCallCount;
        setKnowledgeBase(workingKb);
    
        try {
            const { response } = await runSlaveAuctioneerCall(workingKb, currentItem, newCallCount, (prompt) => setSentEconomyPromptsLog(prev => [prompt, ...prev].slice(0, 10)));
            const { newKb: kbAfterTags, systemMessagesFromTags } = await performTagProcessing(workingKb, response.tags, workingKb.playerStats.turn, setKnowledgeBase, logNpcAvatarPromptCallback);
            workingKb = kbAfterTags;
            
            if (response.tags.some(t => t.toUpperCase().startsWith('[NPC_BID'))) {
                workingKb.slaveAuctionState.lastBidTime = Date.now();
                workingKb.slaveAuctionState.auctioneerCallCount = 0;
            }
    
            if (response.systemMessage) {
                workingKb.slaveAuctionState.auctioneerCommentary.push({id: Date.now().toString(), text: response.systemMessage, timestamp: Date.now()});
            }
            
            addMessageAndUpdateState(systemMessagesFromTags, workingKb);
        } catch (error) {
             const errorMsg = `Lỗi trong lượt gọi giá nô lệ: ${error instanceof Error ? error.message : String(error)}`;
             setApiErrorWithTimeout(errorMsg);
        } finally {
            setIsLoadingApi(false);
        }
    }, [knowledgeBase, addMessageAndUpdateState, setKnowledgeBase, showNotification, setApiErrorWithTimeout, setIsLoadingApi, setReceivedEconomyResponsesLog, logNpcAvatarPromptCallback, setSentEconomyPromptsLog, isLoadingApi]);
    
    const handleSkipSlaveAuctionItem = useCallback(async () => {
        if (isLoadingApi || !knowledgeBase.slaveAuctionState || !knowledgeBase.slaveAuctionState.isOpen) return;
        setIsLoadingApi(true);
        let workingKb = JSON.parse(JSON.stringify(knowledgeBase)) as KnowledgeBase;
        const { items, currentItemIndex } = workingKb.slaveAuctionState!;
        const nextItemIndex = currentItemIndex + 1;
        let systemMessageContent = `Bạn đã bỏ qua nô lệ "${items[currentItemIndex].name}".`;
    
        if (nextItemIndex >= items.length) {
            workingKb.slaveAuctionState!.isOpen = false;
            workingKb.slaveAuctionState!.auctioneerCommentary.push({ id: Date.now().toString(), text: "Phiên đấu giá đã kết thúc! Cảm ơn quý vị.", timestamp: Date.now() });
        } else {
            workingKb.slaveAuctionState!.currentItemIndex = nextItemIndex;
            workingKb.slaveAuctionState!.auctioneerCallCount = 0;
            workingKb.slaveAuctionState!.lastBidTime = Date.now();
            const nextItem = items[nextItemIndex];
            workingKb.slaveAuctionState!.auctioneerCommentary.push({ id: Date.now().toString(), text: `Tiếp theo là: ${nextItem.name}!`, timestamp: Date.now() });
        }
        setKnowledgeBase(workingKb); 
        addMessageAndUpdateState([], workingKb);
        setIsLoadingApi(false);
    }, [knowledgeBase, setKnowledgeBase, addMessageAndUpdateState, setIsLoadingApi, isLoadingApi]);

  return {
    isSummarizingNextPageTransition: mainGameLoopActions.isSummarizingNextPageTransition,
    handleSetupComplete,
    handlePlayerAction: mainGameLoopActions.handlePlayerAction,
    handleFindLocation: mainGameLoopActions.handleFindLocation,
    handleNonCombatDefeat,
    handleCombatEnd,
    handlePrisonerAction,
    handleCompanionAction,
    handleExitPrisonerScreen,
    handleExitCompanionScreen,
    ...auctionActions,
    ...cultivationActions,
    handleBuySlave,
    handleSellSlave,
    handleStartSlaveAuction,
    handlePlayerSlaveAuctionAction,
    handleSlaveAuctioneerCall,
    handleSkipSlaveAuctionItem,
    resetApiError: props.resetApiError,
    handleCheckTokenCount,
  };
};
