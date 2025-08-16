

import { useState, useCallback } from 'react';
import { KnowledgeBase, GameMessage, PlayerActionInputType, ResponseLength, GameScreen, FindLocationParams } from '../../types';
import { VIETNAMESE, TURNS_PER_PAGE, AUTO_SAVE_INTERVAL_TURNS, MAX_AUTO_SAVE_SLOTS } from '../../constants';
import { generateNextTurn, summarizeTurnHistory, generateCityEconomy, generateGeneralSubLocations, findLocationWithAI, getApiSettings } from '../../services/geminiService';
import { generateEmbeddings } from '../../services/embeddingService';
import { performTagProcessing, addTurnHistoryEntryRaw, getMessagesForPage, calculateRealmBaseStats, calculateEffectiveStats, progressNpcCultivation, handleLevelUps, searchVectors, extractEntityContextsFromString, updateGameEventsStatus } from '../../utils/gameLogicUtils';
import * as GameTemplates from '../../templates';

interface UseMainGameLoopProps {
  knowledgeBase: KnowledgeBase;
  setKnowledgeBase: React.Dispatch<React.SetStateAction<KnowledgeBase>>;
  gameMessages: GameMessage[];
  addMessageAndUpdateState: (newMessages: GameMessage[], newKnowledgeBase: KnowledgeBase, callback?: () => void) => void;
  setRawAiResponsesLog: React.Dispatch<React.SetStateAction<string[]>>;
  logSentPromptCallback: (prompt: string) => void;
  setSummarizationResponsesLog: React.Dispatch<React.SetStateAction<string[]>>;
  showNotification: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  currentPageDisplay: number;
  setCurrentPageDisplay: React.Dispatch<React.SetStateAction<number>>;
  isAutoPlaying: boolean;
  setIsAutoPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  executeSaveGame: (kbToSave: KnowledgeBase, messagesToSave: GameMessage[], saveName: string, existingId: string | null, isAuto: boolean) => Promise<string | null>;
  logNpcAvatarPromptCallback: (prompt: string) => void;
  setIsLoadingApi: React.Dispatch<React.SetStateAction<boolean>>;
  setApiErrorWithTimeout: (message: string | null) => void;
  resetApiError: () => void;
  setSentEconomyPromptsLog: React.Dispatch<React.SetStateAction<string[]>>;
  setReceivedEconomyResponsesLog: React.Dispatch<React.SetStateAction<string[]>>;
  setSentGeneralSubLocationPromptsLog: React.Dispatch<React.SetStateAction<string[]>>;
  setReceivedGeneralSubLocationResponsesLog: React.Dispatch<React.SetStateAction<string[]>>;
  handleNonCombatDefeat: (kbStateAtDefeat: KnowledgeBase, fatalNarration: string) => Promise<void>;
  setRetrievedRagContextLog: React.Dispatch<React.SetStateAction<string[]>>;
  // Added from props
  currentPageMessagesLog: string;
  previousPageSummaries: string[];
  lastNarrationFromPreviousPage?: string;
}

export const useMainGameLoop = ({
  knowledgeBase,
  setKnowledgeBase, 
  gameMessages,
  addMessageAndUpdateState,
  setRawAiResponsesLog,
  logSentPromptCallback,
  setSummarizationResponsesLog,
  showNotification,
  currentPageDisplay,
  setCurrentPageDisplay,
  isAutoPlaying,
  setIsAutoPlaying,
  executeSaveGame,
  logNpcAvatarPromptCallback,
  setIsLoadingApi,
  setApiErrorWithTimeout,
  resetApiError,
  setSentEconomyPromptsLog,
  setReceivedEconomyResponsesLog,
  setSentGeneralSubLocationPromptsLog,
  setReceivedGeneralSubLocationResponsesLog,
  handleNonCombatDefeat,
  setRetrievedRagContextLog,
  currentPageMessagesLog, // Destructure new prop
  previousPageSummaries, // Destructure new prop
  lastNarrationFromPreviousPage, // Destructure new prop
}: UseMainGameLoopProps) => {

    const [isSummarizingNextPageTransition, setIsSummarizingNextPageTransition] = useState<boolean>(false);

    const logSummarizationResponseCallback = useCallback((response: string) => {
        setSummarizationResponsesLog(prev => [response, ...prev].slice(0, 10));
    }, [setSummarizationResponsesLog]);

    const handlePlayerAction = useCallback(async (
        action: string, 
        isChoice: boolean,
        inputType: PlayerActionInputType,
        responseLength: ResponseLength
    ) => {
        setIsLoadingApi(true);
        resetApiError();
        
        // State AT THE START of this turn's processing cycle
        const knowledgeBaseAtActionStart = JSON.parse(JSON.stringify(knowledgeBase));
        const gameMessagesAtActionStart = [...gameMessages];
        const turnOfPlayerAction = knowledgeBase.playerStats.turn + 1;

        const playerActionMessage: GameMessage = {
        id: Date.now().toString() + Math.random(),
        type: 'player_action',
        content: action,
        timestamp: Date.now(),
        isPlayerInput: true,
        turnNumber: turnOfPlayerAction 
        };
        
        const messagesForCurrentPagePrompt = getMessagesForPage(currentPageDisplay, knowledgeBase, [...gameMessages, playerActionMessage]);
        let currentPageMessagesLog = messagesForCurrentPagePrompt
            .map(msg => {
                let prefix = "";
                if (msg.type === 'player_action') prefix = `${knowledgeBase.worldConfig?.playerName || 'Người chơi'} ${msg.isPlayerInput ? 'đã làm' : 'đã chọn'}: `;
                else if (msg.type === 'narration') prefix = "AI kể: ";
                else if (msg.type === 'system' && !msg.content.includes("Tóm tắt") && !msg.content.includes("trang")) prefix = "Hệ thống: ";
                return prefix + msg.content;
            })
            .join("\n---\n");

        const previousPageNumbers = knowledgeBase.currentPageHistory?.slice(0, -1) || [];
        const previousPageSummariesContent: string[] = previousPageNumbers
            .map((_, index) => knowledgeBase.pageSummaries?.[index + 1])
            .filter((summary): summary is string => !!summary);
        
        const lastPageNumberForPrompt = (knowledgeBase.currentPageHistory?.length || 1) -1;
        let lastNarrationFromPreviousPage: string | undefined = undefined;
        if (lastPageNumberForPrompt > 0 && currentPageDisplay > lastPageNumberForPrompt) { 
            const messagesOfLastSummarizedPagePrompt = getMessagesForPage(lastPageNumberForPrompt, knowledgeBase, gameMessages);
            lastNarrationFromPreviousPage = [...messagesOfLastSummarizedPagePrompt].reverse().find(msg => msg.type === 'narration')?.content;
        }

        // --- RAG CONTEXT RETRIEVAL (HYBRID STRATEGY) ---
        let retrievedContext: string | undefined = undefined;
        const contextChunks = new Set<string>();
        const apiSettings = getApiSettings();
        const ragTopK = apiSettings.ragTopK ?? 10;

        if (knowledgeBase.ragVectorStore && knowledgeBase.ragVectorStore.vectors.length > 0 && ragTopK > 0) {
            try {
                // Step 1 & 2: Explicitly extract and add context for mentioned entities
                const explicitContexts = extractEntityContextsFromString(action, knowledgeBase);
                explicitContexts.forEach(ctx => contextChunks.add(ctx));
                
                // Step 3: Perform semantic search for broader context
                const queryEmbedding = await generateEmbeddings([action]);
                if (queryEmbedding && queryEmbedding.length > 0) {
                    const searchResults = searchVectors(queryEmbedding[0], knowledgeBase.ragVectorStore, ragTopK);
                    searchResults.forEach(ctx => contextChunks.add(ctx));
                }
            } catch (e) {
                console.error("Failed to generate embeddings or search for RAG context:", e);
                showNotification("Lỗi khi truy xuất ký ức (RAG).", 'error');
            }
        }
        
        if (contextChunks.size > 0) {
            retrievedContext = Array.from(contextChunks).join('\n---\n');
            setRetrievedRagContextLog(prev => [retrievedContext!, ...prev].slice(0, 10));
        }
        // --- END RAG ---

        try {
            const { response, rawText } = await generateNextTurn(
                knowledgeBase, 
                action,
                inputType,
                responseLength,
                currentPageMessagesLog,
                previousPageSummariesContent,
                lastNarrationFromPreviousPage,
                retrievedContext, // Pass combined context to generateNextTurn
                logSentPromptCallback
            );
            setRawAiResponsesLog(prev => [rawText, ...prev].slice(0,50));
            
            let currentTurnKb = JSON.parse(JSON.stringify(knowledgeBaseAtActionStart));

            const { 
                newKb: kbAfterTags, 
                systemMessagesFromTags, 
                turnIncrementedByTag,
                realmChangedByTag, 
            } = await performTagProcessing(currentTurnKb, response.tags, turnOfPlayerAction, setKnowledgeBase, logNpcAvatarPromptCallback); 
            
            let finalKbForThisTurn = kbAfterTags;
            let systemMessagesForThisTurn = [...systemMessagesFromTags];
            
            const locationBefore = knowledgeBaseAtActionStart.currentLocationId;
            const locationAfter = finalKbForThisTurn.currentLocationId;

            // Check for first visit to a major location to generate its sub-locations
            if (locationAfter && locationAfter !== locationBefore) {
                const targetLocationIndex = finalKbForThisTurn.discoveredLocations.findIndex(l => l.id === locationAfter);
                if (targetLocationIndex > -1) {
                    const targetLocation = finalKbForThisTurn.discoveredLocations[targetLocationIndex];
                    const isFirstVisit = !targetLocation.visited && !targetLocation.parentLocationId;

                    if (isFirstVisit) {
                        finalKbForThisTurn.discoveredLocations[targetLocationIndex].visited = true;
                        systemMessagesForThisTurn.push({ id: `gen-details-notice-${Date.now()}`, type: 'system', content: `Đang tạo chi tiết cho ${targetLocation.name}...`, timestamp: Date.now(), turnNumber: turnOfPlayerAction });

                        const generationPromises = [];

                        // Always generate general sub-locations on first visit to a main location
                        generationPromises.push(
                            generateGeneralSubLocations(
                                targetLocation,
                                finalKbForThisTurn,
                                (prompt) => setSentGeneralSubLocationPromptsLog(prev => [prompt, ...prev].slice(0, 10)),
                                (rawText) => setReceivedGeneralSubLocationResponsesLog(prev => [rawText, ...prev].slice(0, 10))
                            )
                        );
                        
                        // Generate economy only for specific location types
                         const eligibleForEconomy = [
                            GameTemplates.LocationType.TOWN,
                            GameTemplates.LocationType.CITY,
                            GameTemplates.LocationType.CAPITAL
                         ].includes(targetLocation.locationType as any);

                        if (eligibleForEconomy) {
                            generationPromises.push(
                                generateCityEconomy(
                                    targetLocation,
                                    finalKbForThisTurn,
                                    (prompt) => setSentEconomyPromptsLog(prev => [prompt, ...prev].slice(0, 10)),
                                    (rawText) => setReceivedEconomyResponsesLog(prev => [rawText, ...prev].slice(0, 10))
                                )
                            );
                        }
                        
                        // Await all generations and process their tags
                        const allResponses = await Promise.all(generationPromises);
                        for (const parsedResponse of allResponses) {
                             const { newKb: kbAfterSubGenTags, systemMessagesFromTags: subGenSystemMessages } = await performTagProcessing(
                                finalKbForThisTurn, 
                                parsedResponse.tags, 
                                finalKbForThisTurn.playerStats.turn, 
                                setKnowledgeBase, 
                                logNpcAvatarPromptCallback
                            );
                            finalKbForThisTurn = kbAfterSubGenTags;
                            systemMessagesForThisTurn.push(...subGenSystemMessages);
                        }
                    }
                }
            }
            
            let manualTurnIncrementMessage: GameMessage | null = null;
            
            if (turnIncrementedByTag) {
                if (finalKbForThisTurn.playerStats.turn < turnOfPlayerAction) {
                    finalKbForThisTurn.playerStats.turn = turnOfPlayerAction;
                    manualTurnIncrementMessage = {
                        id: 'manual-fix-turn-' + Date.now(), type: 'system', 
                        content: `Hệ thống: Lượt chơi đã được điều chỉnh thành ${finalKbForThisTurn.playerStats.turn} (do AI tag không hợp lệ).`, 
                        timestamp: Date.now(), turnNumber: turnOfPlayerAction 
                    };
                }
            } else {
                finalKbForThisTurn.playerStats.turn = turnOfPlayerAction;
            }
            
            // NEW: Run game event status updates
            const eventUpdateResult = updateGameEventsStatus(finalKbForThisTurn);
            finalKbForThisTurn = eventUpdateResult.updatedKb;
            systemMessagesForThisTurn.push(...eventUpdateResult.systemMessages);
            
            const npcProgressionResult = progressNpcCultivation(finalKbForThisTurn);
            finalKbForThisTurn = npcProgressionResult.updatedKb;
            systemMessagesForThisTurn.push(...npcProgressionResult.systemMessages);

            const effectsToExpire: string[] = [];
            if (finalKbForThisTurn.playerStats.activeStatusEffects) {
                finalKbForThisTurn.playerStats.activeStatusEffects = finalKbForThisTurn.playerStats.activeStatusEffects
                    .map(effect => {
                        if (effect.durationTurns > 0) {
                            effect.durationTurns -= 1;
                            if (effect.durationTurns === 0) {
                                effectsToExpire.push(effect.name);
                            }
                        }
                        return effect;
                    })
                    .filter(effect => effect.durationTurns !== 0); 
                
                effectsToExpire.forEach(effectName => {
                    systemMessagesForThisTurn.push({
                        id: `status-effect-expired-${effectName}-${Date.now()}`, type: 'system',
                        content: VIETNAMESE.statusEffectRemoved(effectName),
                        timestamp: Date.now(), turnNumber: finalKbForThisTurn.playerStats.turn 
                    });
                });
            }

            // Centralized Level Up Check
            const levelUpResult = handleLevelUps(finalKbForThisTurn);
            finalKbForThisTurn = levelUpResult.updatedKb;
            systemMessagesForThisTurn.push(...levelUpResult.systemMessages);

            // Final effective stats calculation after all changes
            finalKbForThisTurn.playerStats = calculateEffectiveStats(finalKbForThisTurn.playerStats, finalKbForThisTurn.equippedItems, finalKbForThisTurn.inventory);

            finalKbForThisTurn.turnHistory = addTurnHistoryEntryRaw(
                knowledgeBaseAtActionStart.turnHistory || [],
                knowledgeBaseAtActionStart,
                gameMessagesAtActionStart
            );
            
            // Defeat Check
            if (finalKbForThisTurn.playerStats.sinhLuc <= 0) {
                // Construct and display the messages that led to the defeat first.
                const defeatMessages: GameMessage[] = [playerActionMessage];
                defeatMessages.push({
                    id: 'defeat-narration-' + Date.now(),
                    type: 'narration',
                    content: response.narration, 
                    timestamp: Date.now(), 
                    choices: [], // No choices, this turn ends in defeat.
                    turnNumber: finalKbForThisTurn.playerStats.turn
                });
                if (response.systemMessage) {
                    defeatMessages.push({
                        id: 'defeat-sysmsg-' + Date.now(),
                        type: 'system',
                        content: response.systemMessage, 
                        timestamp: Date.now(), 
                        turnNumber: finalKbForThisTurn.playerStats.turn
                    });
                }
                defeatMessages.push(...systemMessagesForThisTurn.map(m => ({...m, turnNumber: finalKbForThisTurn.playerStats.turn })));
                
                addMessageAndUpdateState(defeatMessages, finalKbForThisTurn);
                
                // Now, call the consequence handler. It will run and append its own messages.
                await handleNonCombatDefeat(finalKbForThisTurn, response.narration);
                return; // Stop here. handleNonCombatDefeat will set loading state.
            }


            finalKbForThisTurn.autoSaveTurnCounter = (finalKbForThisTurn.autoSaveTurnCounter + 1);
            if (finalKbForThisTurn.autoSaveTurnCounter >= AUTO_SAVE_INTERVAL_TURNS) {
                finalKbForThisTurn.autoSaveTurnCounter = 0;
                const autoSaveSlot = finalKbForThisTurn.currentAutoSaveSlotIndex;
                const autoSaveName = `Auto Save Slot ${autoSaveSlot + 1}`;
                const existingAutoSaveId = finalKbForThisTurn.autoSaveSlotIds[autoSaveSlot];
                
                const messagesForAutoSave = [...gameMessagesAtActionStart, playerActionMessage, ...systemMessagesForThisTurn];
                 if (response.narration) {
                    messagesForAutoSave.push({
                        id: `narration-autosave-${Date.now()}`, type: 'narration', content: response.narration,
                        timestamp: Date.now(), choices: response.choices, turnNumber: finalKbForThisTurn.playerStats.turn
                    });
                }
                if (response.systemMessage) {
                    messagesForAutoSave.push({
                        id: `sysmsg-autosave-${Date.now()}`, type: 'system', content: response.systemMessage,
                        timestamp: Date.now(), turnNumber: finalKbForThisTurn.playerStats.turn
                    });
                }


                executeSaveGame(finalKbForThisTurn, messagesForAutoSave, autoSaveName, existingAutoSaveId, true)
                    .then(savedId => {
                        if (savedId) {
                            setKnowledgeBase(prevKb => { 
                                const newKbWithAutoSaveId = JSON.parse(JSON.stringify(prevKb));
                                newKbWithAutoSaveId.autoSaveSlotIds[autoSaveSlot] = savedId;
                                newKbWithAutoSaveId.currentAutoSaveSlotIndex = (autoSaveSlot + 1) % MAX_AUTO_SAVE_SLOTS;
                                return newKbWithAutoSaveId;
                            });
                        }
                    });
            }

            const newMessagesForThisCycle: GameMessage[] = [playerActionMessage];
            newMessagesForThisCycle.push({
                id: Date.now().toString() + Math.random(), type: 'narration', content: response.narration,
                timestamp: Date.now(), choices: response.choices, turnNumber: finalKbForThisTurn.playerStats.turn 
            });
            if (response.systemMessage) {
              newMessagesForThisCycle.push({
                id: Date.now().toString() + Math.random(), type: 'system', content: response.systemMessage,
                timestamp: Date.now(), turnNumber: finalKbForThisTurn.playerStats.turn
              });
            }
            systemMessagesForThisTurn.forEach(msg => msg.turnNumber = finalKbForThisTurn.playerStats.turn);
            newMessagesForThisCycle.push(...systemMessagesForThisTurn); 

            if (manualTurnIncrementMessage) { 
                manualTurnIncrementMessage.turnNumber = finalKbForThisTurn.playerStats.turn;
                newMessagesForThisCycle.push(manualTurnIncrementMessage);
            }
            
            const turnCompleted = finalKbForThisTurn.playerStats.turn; 
            const shouldSummarizeAndPaginateNow = 
                turnCompleted > 0 &&
                turnCompleted % TURNS_PER_PAGE === 0 &&
                turnCompleted > (finalKbForThisTurn.lastSummarizedTurn || 0);

            if (shouldSummarizeAndPaginateNow) {
                const pageToSummarize = turnCompleted / TURNS_PER_PAGE;
                if (!finalKbForThisTurn.pageSummaries?.[pageToSummarize]) { 
                    setIsSummarizingNextPageTransition(true);
                    newMessagesForThisCycle.push({
                         id: 'summarizing-notice-' + Date.now(), type: 'system', 
                         content: VIETNAMESE.summarizingAndPreparingNextPage, 
                         timestamp: Date.now(), turnNumber: turnCompleted
                    });
                    const startTurnOfSummaryPageActual = (pageToSummarize - 1) * TURNS_PER_PAGE + 1;
                    const endTurnOfSummaryPageActual = turnCompleted;
                    const allMessagesForSummaryCalc = [...gameMessagesAtActionStart, ...newMessagesForThisCycle];
                    const actualMessagesToSummarize = allMessagesForSummaryCalc.filter(
                        msg => msg.turnNumber >= startTurnOfSummaryPageActual && msg.turnNumber <= endTurnOfSummaryPageActual
                    );
                    
                    if (actualMessagesToSummarize.length > 0) {
                        try {
                            const summaryResult = await summarizeTurnHistory(
                                actualMessagesToSummarize,
                                finalKbForThisTurn.worldConfig?.theme || "Không rõ",
                                finalKbForThisTurn.worldConfig?.playerName || "Người chơi",
                                finalKbForThisTurn.worldConfig?.genre,
                                finalKbForThisTurn.worldConfig?.customGenreName,
                                logSentPromptCallback,
                                logSummarizationResponseCallback
                            );
                            
                            const summary = summaryResult.processedSummary;
                            if (!finalKbForThisTurn.pageSummaries) finalKbForThisTurn.pageSummaries = {};
                            finalKbForThisTurn.pageSummaries[pageToSummarize] = summary;
                            finalKbForThisTurn.lastSummarizedTurn = turnCompleted;
                            const nextPageStartTurn = turnCompleted + 1;
                            if (!finalKbForThisTurn.currentPageHistory) finalKbForThisTurn.currentPageHistory = [1];
                            if (!finalKbForThisTurn.currentPageHistory.includes(nextPageStartTurn)) {
                                finalKbForThisTurn.currentPageHistory.push(nextPageStartTurn);
                            }
                            newMessagesForThisCycle.push({
                                id: 'page-summary-' + Date.now(), type: 'page_summary',
                                content: `${VIETNAMESE.pageSummaryTitle(pageToSummarize)}: ${summary}`,
                                timestamp: Date.now(), turnNumber: turnCompleted
                            });
                            addMessageAndUpdateState(newMessagesForThisCycle, finalKbForThisTurn, () => {
                                setCurrentPageDisplay(pageToSummarize + 1);
                                setIsSummarizingNextPageTransition(false);
                                setIsLoadingApi(false);
                            });
                            return; 
                        } catch (summaryError) {
                            console.error("Error summarizing page:", summaryError);
                             newMessagesForThisCycle.push({
                                id: 'summary-error-' + Date.now(), type: 'error',
                                content: `Lỗi tóm tắt trang ${pageToSummarize}. Tiếp tục không có tóm tắt.`,
                                timestamp: Date.now(), turnNumber: turnCompleted
                            });
                            const nextPageStartTurn = turnCompleted + 1;
                            if (!finalKbForThisTurn.currentPageHistory) finalKbForThisTurn.currentPageHistory = [1];
                            if (!finalKbForThisTurn.currentPageHistory.includes(nextPageStartTurn)) {
                                finalKbForThisTurn.currentPageHistory.push(nextPageStartTurn);
                            }
                            addMessageAndUpdateState(newMessagesForThisCycle, finalKbForThisTurn, () => {
                                setCurrentPageDisplay(pageToSummarize + 1);
                                 setIsSummarizingNextPageTransition(false);
                                 setIsLoadingApi(false);
                            });
                            return;
                        }
                    } else { 
                        if (!finalKbForThisTurn.pageSummaries) finalKbForThisTurn.pageSummaries = {};
                        finalKbForThisTurn.pageSummaries[pageToSummarize] = VIETNAMESE.noContentToSummarize;
                        finalKbForThisTurn.lastSummarizedTurn = turnCompleted;
                        const nextPageStartTurn = turnCompleted + 1;
                        if (!finalKbForThisTurn.currentPageHistory) finalKbForThisTurn.currentPageHistory = [1];
                        if (!finalKbForThisTurn.currentPageHistory.includes(nextPageStartTurn)) {
                            finalKbForThisTurn.currentPageHistory.push(nextPageStartTurn);
                        }
                         newMessagesForThisCycle.push({
                            id: 'page-summary-empty-' + Date.now(), type: 'page_summary',
                            content: `${VIETNAMESE.pageSummaryTitle(pageToSummarize)}: ${VIETNAMESE.noContentToSummarize}`,
                            timestamp: Date.now(), turnNumber: turnCompleted
                        });
                        addMessageAndUpdateState(newMessagesForThisCycle, finalKbForThisTurn, () => {
                            setCurrentPageDisplay(pageToSummarize + 1);
                            setIsSummarizingNextPageTransition(false);
                            setIsLoadingApi(false);
                        });
                        return;
                    }
                }
            }

            addMessageAndUpdateState(newMessagesForThisCycle, finalKbForThisTurn);

        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            setApiErrorWithTimeout(errorMsg);
            console.error(err);
            
            if (isAutoPlaying) {
                setIsAutoPlaying(false); 
                showNotification(VIETNAMESE.autoPlayStoppedOnError, 'warning');
            }
        } finally {
            setIsLoadingApi(false);
        }
    }, [
        knowledgeBase, gameMessages, currentPageDisplay, addMessageAndUpdateState, setKnowledgeBase,
        logSentPromptCallback, setRawAiResponsesLog, setApiErrorWithTimeout, showNotification,
        setCurrentPageDisplay, isAutoPlaying, setIsAutoPlaying, executeSaveGame,
        setSummarizationResponsesLog, setIsLoadingApi, logNpcAvatarPromptCallback, setSentEconomyPromptsLog, 
        setReceivedEconomyResponsesLog, setSentGeneralSubLocationPromptsLog, setReceivedGeneralSubLocationResponsesLog,
        resetApiError, logSummarizationResponseCallback, handleNonCombatDefeat, setRetrievedRagContextLog
        ]);

        const handleFindLocation = useCallback(async (params: FindLocationParams) => {
            setIsLoadingApi(true);
            resetApiError();
            showNotification(VIETNAMESE.findingLocationMessage, 'info');
    
            try {
                const { response: { narration, tags } } = await findLocationWithAI(
                    knowledgeBase, 
                    params,
                    currentPageMessagesLog,
                    previousPageSummaries,
                    lastNarrationFromPreviousPage,
                    (prompt) => setSentGeneralSubLocationPromptsLog(prev => [prompt, ...prev].slice(0, 10))
                );
    
                const { newKb: kbAfterTags, systemMessagesFromTags } = await performTagProcessing(
                    knowledgeBase,
                    tags,
                    knowledgeBase.playerStats.turn, // This action doesn't advance the turn
                    setKnowledgeBase,
                    logNpcAvatarPromptCallback
                );
    
                const narrationMessage: GameMessage = {
                    id: 'find-location-narration-' + Date.now(),
                    type: 'system',
                    content: narration,
                    timestamp: Date.now(),
                    turnNumber: knowledgeBase.playerStats.turn
                };
    
                addMessageAndUpdateState([narrationMessage, ...systemMessagesFromTags], kbAfterTags);
    
            } catch (err) {
                const errorMsg = err instanceof Error ? err.message : String(err);
                setApiErrorWithTimeout(errorMsg);
                showNotification(VIETNAMESE.errorFindingLocation + `: ${errorMsg}`, 'error');
            } finally {
                setIsLoadingApi(false);
            }
    
        }, [
            knowledgeBase, 
            setIsLoadingApi, 
            resetApiError, 
            showNotification, 
            addMessageAndUpdateState, 
            setKnowledgeBase, 
            logNpcAvatarPromptCallback, 
            setSentGeneralSubLocationPromptsLog, 
            setApiErrorWithTimeout,
            currentPageMessagesLog, 
            previousPageSummaries, 
            lastNarrationFromPreviousPage
        ]);

    return {
        handlePlayerAction,
        isSummarizingNextPageTransition,
        handleFindLocation,
    };
};