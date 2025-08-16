import React, { useRef, useEffect, useCallback, useMemo, useLayoutEffect } from 'react';
import { GameScreen, GameMessage, StyleSettings, StyleSettingProperty } from './../types';
import { VIETNAMESE } from './../constants';
import * as GameTemplates from '../templates'; // Import GameTemplates

// Import Layout Components
import GameHeader from './gameplay/layout/GameHeader';
import StoryLog from './gameplay/layout/StoryLog';
import PlayerInputArea from './gameplay/layout/PlayerInputArea';

// Import Panels & Modals
import OffCanvasPanel from './ui/OffCanvasPanel';
import CharacterSidePanel from './gameplay/CharacterSidePanel';
import QuestsSidePanel from './gameplay/QuestsSidePanel';
import WorldSidePanel from './gameplay/WorldSidePanel';
import DebugPanelDisplay from './gameplay/DebugPanelDisplay';
import MiniInfoPopover from './ui/MiniInfoPopover';
import { MainMenuPanel } from './gameplay/layout/MainMenuPanel';

// Import Custom Hooks
import { useGameplayPanels } from '../hooks/useGameplayPanels';
import { usePlayerInput } from '../hooks/usePlayerInput';
import { usePopover } from '../hooks/usePopover';

// Import Utilities
import { parseAndHighlightText as parseAndHighlightTextUtil } from '../utils/textHighlighting';
import { useGame } from '../hooks/useGame'; // Using useGame to get context
import Button from './ui/Button'; // Import Button

const GameplayScreen: React.FC = () => {
    const game = useGame(); // Get all props from context
    const storyLogRef = useRef<HTMLDivElement>(null);

    // Use custom hooks for UI state not needed globally
    const { isReaderMode, setIsReaderMode, isCharPanelOpen, setIsCharPanelOpen, isQuestsPanelOpen, setIsQuestsPanelOpen, isWorldPanelOpen, setIsWorldPanelOpen, showDebugPanel, setShowDebugPanel, isMainMenuOpen, setIsMainMenuOpen } = useGameplayPanels();
    const { popover, handleKeywordClick, closePopover } = usePopover();
    
    const {
        playerInput, setPlayerInput, currentActionType, setCurrentActionType,
        selectedResponseLength, setSelectedResponseLength,
        isResponseLengthDropdownOpen, setIsResponseLengthDropdownOpen, showAiSuggestions, setShowAiSuggestions,
        responseLengthDropdownRef, handleChoiceClick, handleSubmit
    } = usePlayerInput({
        onPlayerAction: game.handlePlayerAction,
        isLoading: game.isLoadingApi || game.isSummarizingNextPageTransition,
        isSummarizing: game.isSummarizingOnLoad || game.isSummarizingNextPageTransition,
        isCurrentlyActivePage: game.isCurrentlyActivePage,
        messageIdBeingEdited: game.messageIdBeingEdited,
    });

    const isLoadingUi = game.isLoadingApi || game.isUploadingAvatar;
    const isSummarizingUi = game.isSummarizingNextPageTransition || game.isSummarizingOnLoad;

    // Scroll management
    useLayoutEffect(() => {
        const storyLog = storyLogRef.current;
        if (storyLog && game.justLoadedGame.current) {
            storyLog.scrollTop = storyLog.scrollHeight;
            game.gameplayScrollPosition.current = storyLog.scrollTop;
            game.justLoadedGame.current = false;
        }
    }, [game.getMessagesForPage(game.currentPageDisplay), game.justLoadedGame, game.gameplayScrollPosition]);

    useLayoutEffect(() => {
        const storyLog = storyLogRef.current;
        if (storyLog && !game.justLoadedGame.current) {
            storyLog.scrollTop = game.gameplayScrollPosition.current;
        }
        return () => {
            if (storyLog) {
                game.gameplayScrollPosition.current = storyLog.scrollTop;
            }
        };
    }, []); // Empty dependency array runs this on mount and its cleanup on unmount.

    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                closePopover();
                game.setIsStyleSettingsModalOpen(false);
                game.closeModal();
                game.closeEconomyModal();
                game.closeSlaveMarketModal();
                if (game.messageIdBeingEdited) game.onCancelEditMessage();
            }
        };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [closePopover, game]);
    
    // Correctly implemented style function for story messages
    const getDynamicMessageStyles = useCallback((msgType: GameMessage['type']): React.CSSProperties => {
        const styles: React.CSSProperties = {};
        let settingsToApply: StyleSettingProperty | undefined;

        switch (msgType) {
            case 'narration':
                settingsToApply = game.styleSettings.narration;
                break;
            case 'player_action':
                settingsToApply = game.styleSettings.playerAction;
                break;
            default:
                return {}; // No custom styles for system, error, etc.
        }

        if (settingsToApply) {
            if (settingsToApply.fontFamily && settingsToApply.fontFamily !== 'inherit') {
                styles.fontFamily = settingsToApply.fontFamily;
            }
            if (settingsToApply.fontSize && settingsToApply.fontSize !== 'inherit') {
                styles.fontSize = settingsToApply.fontSize;
            }
            if (settingsToApply.textColor) {
                styles.color = settingsToApply.textColor;
            }
            if (settingsToApply.backgroundColor) {
                styles.backgroundColor = settingsToApply.backgroundColor;
            }
        }

        return styles;
    }, [game.styleSettings]);
    
    // Correctly implemented style function for choice buttons
    const getChoiceButtonStyles = useCallback((): React.CSSProperties => {
        const styles: React.CSSProperties = {};
        const settingsToApply = game.styleSettings.choiceButton;
    
        if (settingsToApply) {
            if (settingsToApply.fontFamily && settingsToApply.fontFamily !== 'inherit') {
                styles.fontFamily = settingsToApply.fontFamily;
            }
            if (settingsToApply.fontSize && settingsToApply.fontSize !== 'inherit') {
                styles.fontSize = settingsToApply.fontSize;
            }
            if (settingsToApply.textColor) {
                styles.color = settingsToApply.textColor;
            }
            if (settingsToApply.backgroundColor && settingsToApply.backgroundColor !== 'transparent') {
                styles.backgroundColor = settingsToApply.backgroundColor;
            }
        }
        return styles;
    }, [game.styleSettings]);


    const isSaveDisabled = game.isSavingGame || isLoadingUi || isSummarizingUi;
    const isStopButtonDisabled = isSummarizingUi || (!isLoadingUi && !(game.knowledgeBase.turnHistory && game.knowledgeBase.turnHistory.length > 1));

    const gameTitleDisplay = game.knowledgeBase.manualSaveName || game.knowledgeBase.worldConfig?.saveGameName || game.knowledgeBase.worldConfig?.theme || "Phiêu lưu cùng AI";

    const currentLocation = game.knowledgeBase.discoveredLocations.find(l => l.id === game.knowledgeBase.currentLocationId);
    const economySubLocations = useMemo(() => {
        if (!currentLocation) return [];
        return game.knowledgeBase.discoveredLocations.filter(loc =>
            loc.parentLocationId === currentLocation.id &&
            (Object.values(GameTemplates.EconomyLocationType).includes(loc.locationType as any))
        );
    }, [currentLocation, game.knowledgeBase.discoveredLocations]);

    const parseAndHighlightText = useCallback((text: string) => {
        return parseAndHighlightTextUtil(text, game.knowledgeBase, game.styleSettings, handleKeywordClick);
    }, [game.knowledgeBase, game.styleSettings, handleKeywordClick]);

    return (
        <div className="h-screen flex flex-col bg-gray-900 text-gray-100 p-2 sm:p-4">
             {!isReaderMode && (
                <GameHeader
                    gameTitleDisplay={gameTitleDisplay}
                    knowledgeBase={game.knowledgeBase}
                    setIsMainMenuOpen={setIsMainMenuOpen}
                    onRollbackTurn={game.onRollbackTurn}
                    isStopButtonDisabled={isStopButtonDisabled || !!game.knowledgeBase.pendingCombat}
                    isLoading={isLoadingUi}
                    onSaveGame={game.onSaveGame}
                    isSaveDisabled={isSaveDisabled}
                    isSavingGame={game.isSavingGame}
                    onQuit={game.onQuit}
                    isSummarizing={isSummarizingUi}
                />
            )}
            
            <div className="flex-grow flex flex-col bg-gray-850 shadow-xl rounded-lg overflow-hidden relative min-h-0">
                <StoryLog 
                    storyLogRef={storyLogRef}
                    displayedMessages={game.getMessagesForPage(game.currentPageDisplay)}
                    isLoadingUi={isLoadingUi}
                    isSummarizingUi={isSummarizingUi}
                    isCurrentlyActivePage={game.isCurrentlyActivePage}
                    knowledgeBase={game.knowledgeBase}
                    styleSettings={game.styleSettings}
                    messageIdBeingEdited={game.messageIdBeingEdited}
                    currentEditText={""} // The parent context will handle the actual edit text state
                    setCurrentEditText={() => {}} // Parent handles
                    onStartEditMessage={game.onStartEditMessage}
                    onSaveEditedMessage={game.onSaveEditedMessage}
                    onCancelEditMessage={game.onCancelEditMessage}
                    parseAndHighlightText={parseAndHighlightText}
                    getDynamicMessageStyles={getDynamicMessageStyles}
                    onClick={() => setIsReaderMode(prev => !prev)}
                />
                 {!isReaderMode && (
                    <div className="flex-shrink-0">
                       {economySubLocations.length > 0 && game.isCurrentlyActivePage && !game.knowledgeBase.pendingCombat && !game.knowledgeBase.postCombatState && (
                            <div className="p-2 border-t border-gray-700 bg-gray-800 flex flex-wrap gap-2 justify-center">
                                {economySubLocations.map(loc => {
                                    let buttonLabel = loc.name;
                                    let action = () => {};
                                    if (loc.locationType === GameTemplates.EconomyLocationType.MARKETPLACE) {
                                        buttonLabel = VIETNAMESE.openMarketplaceButton || loc.name;
                                        action = () => game.setActiveEconomyModal({ type: 'marketplace', locationId: loc.id });
                                    } else if (loc.locationType === GameTemplates.EconomyLocationType.SHOPPING_CENTER) {
                                        buttonLabel = VIETNAMESE.openShoppingCenterButton || loc.name;
                                        action = () => game.setActiveEconomyModal({ type: 'shopping_center', locationId: loc.id });
                                    } else if (loc.locationType === GameTemplates.EconomyLocationType.AUCTION_HOUSE) {
                                        buttonLabel = VIETNAMESE.openAuctionHouseButton || loc.name;
                                        action = () => game.handleStartAuction(loc.id);
                                    } else if (loc.locationType === GameTemplates.EconomyLocationType.SLAVE_MARKET) {
                                        buttonLabel = VIETNAMESE.openSlaveMarketButton || loc.name;
                                        action = () => game.setActiveSlaveMarketModal({ locationId: loc.id });
                                    } else if (loc.locationType === GameTemplates.EconomyLocationType.SLAVE_AUCTION) {
                                        buttonLabel = VIETNAMESE.openSlaveAuctionButton || loc.name;
                                        action = () => game.handleStartSlaveAuction(loc.id);
                                    }
                                    
                                    return (
                                        <Button
                                            key={loc.id}
                                            variant="secondary"
                                            size="sm"
                                            className="text-xs border-amber-500 text-amber-300 hover:bg-amber-700 hover:text-white"
                                            onClick={action}
                                            disabled={isLoadingUi || isSummarizingUi || !!game.messageIdBeingEdited}
                                        >
                                            {buttonLabel}
                                        </Button>
                                    );
                                })}
                            </div>
                        )}
                        {game.knowledgeBase.pendingCombat ? (
                            <div className="p-4 bg-red-900/50 border-t-2 border-red-500 flex flex-col items-center justify-center gap-4">
                                <p className="text-lg font-bold text-red-300 animate-pulse">Một trận chiến sắp bắt đầu!</p>
                                <Button 
                                    variant="danger" 
                                    size="lg"
                                    onClick={() => game.setCurrentScreen(GameScreen.Combat)}
                                >
                                    {VIETNAMESE.startCombatButton || "Bắt Đầu Chiến Đấu"}
                                </Button>
                            </div>
                        ) : (
                            <>
                                <PlayerInputArea 
                                    latestMessageWithChoices={[...game.getMessagesForPage(game.currentPageDisplay)].reverse().find(msg => msg.type === 'narration' && msg.choices && msg.choices.length > 0)}
                                    showAiSuggestions={showAiSuggestions} setShowAiSuggestions={setShowAiSuggestions}
                                    playerInput={playerInput} setPlayerInput={setPlayerInput}
                                    currentActionType={currentActionType} setCurrentActionType={setCurrentActionType}
                                    selectedResponseLength={selectedResponseLength} setSelectedResponseLength={setSelectedResponseLength}
                                    isResponseLengthDropdownOpen={isResponseLengthDropdownOpen} setIsResponseLengthDropdownOpen={setIsResponseLengthDropdownOpen}
                                    responseLengthDropdownRef={responseLengthDropdownRef}
                                    isLoadingUi={isLoadingUi}
                                    isSummarizingUi={isSummarizingUi}
                                    isCurrentlyActivePage={game.isCurrentlyActivePage}
                                    messageIdBeingEdited={game.messageIdBeingEdited}
                                    handleChoiceClick={handleChoiceClick}
                                    handleSubmit={handleSubmit}
                                    choiceButtonStyles={getChoiceButtonStyles()}
                                    currentPage={game.currentPageDisplay}
                                    totalPages={game.totalPages}
                                    onPrev={game.onGoToPrevPage}
                                    onNext={game.onGoToNextPage}
                                    onJump={game.onJumpToPage}
                                />
                            </>
                        )}
                    </div>
                 )}
            </div>

            {/* Main Menu Panel */}
            <OffCanvasPanel isOpen={isMainMenuOpen} onClose={() => setIsMainMenuOpen(false)} title="Menu Trò Chơi" position="right">
                <MainMenuPanel
                    onClose={() => setIsMainMenuOpen(false)}
                    setIsCharPanelOpen={setIsCharPanelOpen}
                    setIsQuestsPanelOpen={setIsQuestsPanelOpen}
                    setIsWorldPanelOpen={setIsWorldPanelOpen}
                    showDebugPanel={showDebugPanel}
                    setShowDebugPanel={setShowDebugPanel}
                />
            </OffCanvasPanel>

            {/* Side Panels */}
            <OffCanvasPanel isOpen={isCharPanelOpen} onClose={() => setIsCharPanelOpen(false)} title={VIETNAMESE.characterPanelTitle} position="right">
                <CharacterSidePanel knowledgeBase={game.knowledgeBase} onItemClick={(item) => game.openEntityModal('item', item)} onSkillClick={(skill) => game.openEntityModal('skill', skill)} onPlayerAvatarUploadRequest={game.onUpdatePlayerAvatar} isUploadingPlayerAvatar={game.isUploadingAvatar} />
            </OffCanvasPanel>
             <OffCanvasPanel isOpen={isQuestsPanelOpen} onClose={() => setIsQuestsPanelOpen(false)} title={VIETNAMESE.questsPanelTitle} position="right">
                <QuestsSidePanel quests={game.knowledgeBase.allQuests} onQuestClick={(quest) => game.openEntityModal('quest', quest)} />
            </OffCanvasPanel>
             <OffCanvasPanel isOpen={isWorldPanelOpen} onClose={() => setIsWorldPanelOpen(false)} title={VIETNAMESE.worldPanelTitle} position="right">
                <WorldSidePanel 
                    knowledgeBase={game.knowledgeBase} 
                    onNpcClick={(npc) => game.openEntityModal('npc', npc)} 
                    onYeuThuClick={(yt) => game.openEntityModal('yeuThu', yt)}
                    onLocationClick={(loc) => game.openEntityModal('location', loc)} 
                    onLoreClick={(lore) => game.openEntityModal('lore', lore)} 
                    onFactionClick={(fac) => game.openEntityModal('faction', fac)}
                    onCompanionClick={(comp) => game.openEntityModal('companion', comp)}
                />
            </OffCanvasPanel>
            
            {/* Popover & Debug */}
            <MiniInfoPopover isOpen={popover.isOpen} targetRect={popover.targetRect} entity={popover.entity} entityType={popover.entityType} onClose={closePopover} knowledgeBase={game.knowledgeBase} />
            {!isReaderMode && showDebugPanel && <DebugPanelDisplay 
                kb={game.knowledgeBase} 
                sentPromptsLog={game.sentPromptsLog} 
                rawAiResponsesLog={game.rawAiResponsesLog} 
                sentEconomyPromptsLog={game.sentEconomyPromptsLog} 
                receivedEconomyResponsesLog={game.receivedEconomyResponsesLog} 
                sentGeneralSubLocationPromptsLog={game.sentGeneralSubLocationPromptsLog} 
                receivedGeneralSubLocationResponsesLog={game.receivedGeneralSubLocationResponsesLog} 
                latestPromptTokenCount={game.latestPromptTokenCount} 
                summarizationResponsesLog={game.summarizationResponsesLog} 
                sentCraftingPromptsLog={game.sentCraftingPromptsLog} 
                receivedCraftingResponsesLog={game.receivedCraftingResponsesLog} 
                sentNpcAvatarPromptsLog={game.sentNpcAvatarPromptsLog} 
                retrievedRagContextLog={game.retrievedRagContextLog}
                currentPageDisplay={game.currentPageDisplay} 
                totalPages={game.totalPages} 
                isAutoPlaying={game.isAutoPlaying} 
                onToggleAutoPlay={game.onToggleAutoPlay} 
                onStartDebugCombat={()=>{}} 
                onProcessDebugTags={game.handleProcessDebugTags} 
                isLoading={isLoadingUi} 
                onCheckTokenCount={game.handleCheckTokenCount} // Pass the new function
                sentCombatSummaryPromptsLog={game.sentCombatSummaryPromptsLog}
                receivedCombatSummaryResponsesLog={game.receivedCombatSummaryResponsesLog}
                sentVictoryConsequencePromptsLog={game.sentVictoryConsequencePromptsLog}
                receivedVictoryConsequenceResponsesLog={game.receivedVictoryConsequenceResponsesLog}
            />}
        </div>
    );
};

export default GameplayScreen;