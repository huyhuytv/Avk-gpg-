


import { useCallback } from 'react';
import { KnowledgeBase, GameMessage, GameScreen, Skill, NPC, Wife, Slave } from '../../types';
import { generateCultivationSession, summarizeCultivationSession } from '../../services/geminiService';
import { performTagProcessing, handleLevelUps } from '../../utils/gameLogicUtils';
import { VIETNAMESE } from '../../constants';

interface UseCultivationActionsProps {
  knowledgeBase: KnowledgeBase;
  setKnowledgeBase: React.Dispatch<React.SetStateAction<KnowledgeBase>>;
  addMessageAndUpdateState: (newMessages: GameMessage[], newKnowledgeBase: KnowledgeBase, callback?: () => void) => void;
  setIsCultivating: React.Dispatch<React.SetStateAction<boolean>>;
  setApiErrorWithTimeout: (message: string | null) => void;
  resetApiError: () => void;
  showNotification: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  setCurrentScreen: (screen: GameScreen) => void;
  logNpcAvatarPromptCallback?: (prompt: string) => void; 
  setSentCultivationPromptsLog: React.Dispatch<React.SetStateAction<string[]>>;
  setReceivedCultivationResponsesLog: React.Dispatch<React.SetStateAction<string[]>>;
  // New props for context
  currentPageMessagesLog: string;
  previousPageSummaries: string[];
  lastNarrationFromPreviousPage?: string;
}

export const useCultivationActions = ({
  knowledgeBase,
  setKnowledgeBase,
  addMessageAndUpdateState,
  setIsCultivating,
  setApiErrorWithTimeout,
  resetApiError,
  showNotification,
  setCurrentScreen,
  logNpcAvatarPromptCallback,
  setSentCultivationPromptsLog,
  setReceivedCultivationResponsesLog,
  currentPageMessagesLog,
  previousPageSummaries,
  lastNarrationFromPreviousPage,
}: UseCultivationActionsProps) => {

  const handleStartCultivation = useCallback(async (
    type: 'skill' | 'method',
    durationInTurns: number,
    targetId?: string,
    partnerId?: string
  ): Promise<string[]> => {
    setIsCultivating(true);
    resetApiError();
    const log: string[] = [];

    try {
      const skill = type === 'skill' ? knowledgeBase.playerSkills.find(s => s.id === targetId) : undefined;
      const method = type === 'method' ? knowledgeBase.playerSkills.find(s => s.id === targetId) : undefined;
      const partner: NPC | Wife | Slave | undefined = partnerId 
          ? [...knowledgeBase.wives, ...knowledgeBase.slaves].find(p => p.id === partnerId) 
          : undefined;

      const { response, rawText } = await generateCultivationSession(
          knowledgeBase, 
          type, 
          durationInTurns,
          currentPageMessagesLog,
          previousPageSummaries,
          lastNarrationFromPreviousPage,
          skill, 
          method,
          partner,
          (prompt) => setSentCultivationPromptsLog(prev => [prompt, ...prev].slice(0, 10))
      );
      setReceivedCultivationResponsesLog(prev => [rawText, ...prev].slice(0, 10));
      
      const { newKb: kbAfterTags, systemMessagesFromTags } = await performTagProcessing(
        knowledgeBase,
        response.tags,
        knowledgeBase.playerStats.turn, // Cultivation doesn't advance turn, but messages need a turn number
        setKnowledgeBase,
        logNpcAvatarPromptCallback
      );
      
      const { updatedKb: kbAfterLevelUp, systemMessages: levelUpMessages } = handleLevelUps(kbAfterTags);

      const allMessages = [...systemMessagesFromTags, ...levelUpMessages];
      addMessageAndUpdateState(allMessages, kbAfterLevelUp);

      if(response.narration) log.push(response.narration);
      allMessages.forEach(msg => log.push(`[${msg.content}]`));

      return log;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Lỗi không xác định khi tu luyện.";
      setApiErrorWithTimeout(errorMsg);
      throw error;
    } finally {
      setIsCultivating(false);
    }
  }, [
      knowledgeBase, 
      setIsCultivating, 
      resetApiError, 
      setApiErrorWithTimeout, 
      addMessageAndUpdateState, 
      logNpcAvatarPromptCallback, 
      setSentCultivationPromptsLog, 
      setReceivedCultivationResponsesLog, 
      setKnowledgeBase, 
      currentPageMessagesLog, 
      previousPageSummaries, 
      lastNarrationFromPreviousPage
    ]);
  
  const handleExitCultivation = useCallback(async (
    cultivationLog: string[],
    totalDuration: { days: number; months: number; years: number; }
  ) => {
      setIsCultivating(true);
      try {
        let summaryMessage: GameMessage | null = null;
        if (cultivationLog && cultivationLog.length > 0) {
            try {
                // We only summarize the narration, not the system messages we pushed to the log
                const narrationsOnly = cultivationLog.filter(log => !log.startsWith('['));
                const summary = await summarizeCultivationSession(narrationsOnly);
                summaryMessage = {
                    id: 'cultivation-summary-' + Date.now(),
                    type: 'event_summary',
                    content: summary,
                    timestamp: Date.now(),
                    turnNumber: knowledgeBase.playerStats.turn
                };
            } catch (error) {
                console.error("Failed to summarize cultivation session:", error);
                showNotification("Lỗi khi tóm tắt quá trình tu luyện.", 'error');
            }
        }

        // The knowledge base has already been updated incrementally by handleStartCultivation.
        // We just need to add the final summary message and switch screens.
        const finalMessages: GameMessage[] = [];
        if (summaryMessage) {
            finalMessages.push(summaryMessage);
        }

        // The knowledgeBase state from the hook is already up-to-date.
        // We pass it to addMessageAndUpdateState to add the new summary message.
        addMessageAndUpdateState(finalMessages, knowledgeBase, () => {
            setCurrentScreen(GameScreen.Gameplay);
        });
      } finally {
          setIsCultivating(false);
      }
  }, [knowledgeBase, addMessageAndUpdateState, showNotification, setCurrentScreen, setIsCultivating]);


  return { handleStartCultivation, handleExitCultivation };
};