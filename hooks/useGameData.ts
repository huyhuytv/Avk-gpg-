
import { useState, useCallback } from 'react';
import { KnowledgeBase, GameMessage, CombatEndPayload } from '../types';
import { INITIAL_KNOWLEDGE_BASE } from '../constants';
import { calculateTotalPages, getMessagesForPage } from '../utils/gameLogicUtils';


export const useGameData = () => {
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBase>(
    JSON.parse(JSON.stringify(INITIAL_KNOWLEDGE_BASE))
  );
  const [gameMessages, setGameMessages] = useState<GameMessage[]>([]);
  const [rawAiResponsesLog, setRawAiResponsesLog] = useState<string[]>([]);
  const [sentPromptsLog, setSentPromptsLog] = useState<string[]>([]);
  const [sentEconomyPromptsLog, setSentEconomyPromptsLog] = useState<string[]>([]);
  const [receivedEconomyResponsesLog, setReceivedEconomyResponsesLog] = useState<string[]>([]);
  const [sentGeneralSubLocationPromptsLog, setSentGeneralSubLocationPromptsLog] = useState<string[]>([]);
  const [receivedGeneralSubLocationResponsesLog, setReceivedGeneralSubLocationResponsesLog] = useState<string[]>([]);
  const [latestPromptTokenCount, setLatestPromptTokenCount] = useState<number | null | string>(null);
  const [summarizationResponsesLog, setSummarizationResponsesLog] = useState<string[]>([]);
  const [sentCraftingPromptsLog, setSentCraftingPromptsLog] = useState<string[]>([]);
  const [receivedCraftingResponsesLog, setReceivedCraftingResponsesLog] = useState<string[]>([]);
  const [sentCultivationPromptsLog, setSentCultivationPromptsLog] = useState<string[]>([]);
  const [receivedCultivationResponsesLog, setReceivedCultivationResponsesLog] = useState<string[]>([]);
  const [companionInteractionLog, setCompanionInteractionLog] = useState<string[]>([]);
  const [prisonerInteractionLog, setPrisonerInteractionLog] = useState<string[]>([]);
  const [sentPrisonerPromptsLog, setSentPrisonerPromptsLog] = useState<string[]>([]);
  const [receivedPrisonerResponsesLog, setReceivedPrisonerResponsesLog] = useState<string[]>([]);
  const [sentCompanionPromptsLog, setSentCompanionPromptsLog] = useState<string[]>([]);
  const [receivedCompanionResponsesLog, setReceivedCompanionResponsesLog] = useState<string[]>([]);
  const [retrievedRagContextLog, setRetrievedRagContextLog] = useState<string[]>([]); // NEW
  
  // New logs for post-combat AI interactions
  const [sentCombatSummaryPromptsLog, setSentCombatSummaryPromptsLog] = useState<string[]>([]);
  const [receivedCombatSummaryResponsesLog, setReceivedCombatSummaryResponsesLog] = useState<string[]>([]);
  const [sentVictoryConsequencePromptsLog, setSentVictoryConsequencePromptsLog] = useState<string[]>([]);
  const [receivedVictoryConsequenceResponsesLog, setReceivedVictoryConsequenceResponsesLog] = useState<string[]>([]);
  
  const [currentPageDisplay, setCurrentPageDisplay] = useState<number>(1);
  const [messageIdBeingEdited, setMessageIdBeingEdited] = useState<string | null>(null);

  const totalPages = calculateTotalPages(knowledgeBase);
  
  const getMessagesForPageCallback = useCallback((pageNumber: number) => {
    return getMessagesForPage(pageNumber, knowledgeBase, gameMessages);
  }, [knowledgeBase, gameMessages]);

  const addMessageAndUpdateState = useCallback((
    newMessages: GameMessage[],
    newKnowledgeBase: KnowledgeBase,
    callback?: () => void
  ) => {
    setGameMessages(prev => [...prev, ...newMessages]);
    setKnowledgeBase(newKnowledgeBase);
    if (callback) callback();
  }, [setGameMessages, setKnowledgeBase]);
  
  const resetGameData = useCallback(() => {
    setKnowledgeBase(JSON.parse(JSON.stringify(INITIAL_KNOWLEDGE_BASE)));
    setGameMessages([]);
    setRawAiResponsesLog([]);
    setSentPromptsLog([]);
    setSentEconomyPromptsLog([]);
    setReceivedEconomyResponsesLog([]);
    setSentGeneralSubLocationPromptsLog([]);
    setReceivedGeneralSubLocationResponsesLog([]);
    setLatestPromptTokenCount(null);
    setSummarizationResponsesLog([]);
    setSentCraftingPromptsLog([]);
    setReceivedCraftingResponsesLog([]);
    setSentCultivationPromptsLog([]);
    setReceivedCultivationResponsesLog([]);
    setCompanionInteractionLog([]);
    setPrisonerInteractionLog([]);
    setSentPrisonerPromptsLog([]);
    setReceivedPrisonerResponsesLog([]);
    setSentCompanionPromptsLog([]);
    setReceivedCompanionResponsesLog([]);
    setRetrievedRagContextLog([]); // NEW
    // Reset new logs
    setSentCombatSummaryPromptsLog([]);
    setReceivedCombatSummaryResponsesLog([]);
    setSentVictoryConsequencePromptsLog([]);
    setReceivedVictoryConsequenceResponsesLog([]);
    setCurrentPageDisplay(1);
    setMessageIdBeingEdited(null);
  }, [setKnowledgeBase, setGameMessages, setRawAiResponsesLog, setSentPromptsLog, setSentEconomyPromptsLog, setReceivedEconomyResponsesLog, setSentGeneralSubLocationPromptsLog, setReceivedGeneralSubLocationResponsesLog, setLatestPromptTokenCount, setSummarizationResponsesLog, setSentCraftingPromptsLog, setReceivedCraftingResponsesLog, setCurrentPageDisplay, setMessageIdBeingEdited, setRetrievedRagContextLog]);


  return {
    knowledgeBase,
    setKnowledgeBase,
    gameMessages,
    setGameMessages,
    rawAiResponsesLog,
    setRawAiResponsesLog,
    sentPromptsLog,
    setSentPromptsLog,
    sentEconomyPromptsLog,
    setSentEconomyPromptsLog,
    receivedEconomyResponsesLog,
    setReceivedEconomyResponsesLog,
    sentGeneralSubLocationPromptsLog,
    setSentGeneralSubLocationPromptsLog,
    receivedGeneralSubLocationResponsesLog,
    setReceivedGeneralSubLocationResponsesLog,
    latestPromptTokenCount,
    setLatestPromptTokenCount,
    summarizationResponsesLog,
    setSummarizationResponsesLog,
    sentCraftingPromptsLog,
    setSentCraftingPromptsLog,
    receivedCraftingResponsesLog,
    setReceivedCraftingResponsesLog,
    sentCultivationPromptsLog,
    setSentCultivationPromptsLog,
    receivedCultivationResponsesLog,
    setReceivedCultivationResponsesLog,
    companionInteractionLog,
    setCompanionInteractionLog,
    prisonerInteractionLog,
    setPrisonerInteractionLog,
    sentPrisonerPromptsLog,
    setSentPrisonerPromptsLog,
    receivedPrisonerResponsesLog,
    setReceivedPrisonerResponsesLog,
    sentCompanionPromptsLog,
    setSentCompanionPromptsLog,
    receivedCompanionResponsesLog,
    setReceivedCompanionResponsesLog,
    retrievedRagContextLog, // NEW
    setRetrievedRagContextLog, // NEW
    // New states for post-combat logs
    sentCombatSummaryPromptsLog,
    setSentCombatSummaryPromptsLog,
    receivedCombatSummaryResponsesLog,
    setReceivedCombatSummaryResponsesLog,
    sentVictoryConsequencePromptsLog,
    setSentVictoryConsequencePromptsLog,
    receivedVictoryConsequenceResponsesLog,
    setReceivedVictoryConsequenceResponsesLog,
    currentPageDisplay,
    setCurrentPageDisplay,
    totalPages,
    messageIdBeingEdited,
    setMessageIdBeingEdited,
    getMessagesForPage: getMessagesForPageCallback,
    addMessageAndUpdateState,
    resetGameData
  };
};
