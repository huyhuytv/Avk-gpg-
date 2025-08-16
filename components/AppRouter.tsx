import React from 'react';
import { GameScreen } from '../types';
import { useGame } from '../hooks/useGame';

// Import all screen components
import InitialScreen from './InitialScreen';
import GameSetupScreen from './GameSetupScreen';
import GameplayScreen from './GameplayScreen';
import EquipmentScreen from './gameplay/equipment/EquipmentScreen';
import { CraftingScreen } from './gameplay/crafting/CraftingScreen';
import ApiSettingsScreen from './ApiSettingsScreen';
import LoadGameScreen from './LoadGameScreen';
import StorageSettingsScreen from './StorageSettingsScreen';
import ImportExportScreen from './ImportExportScreen';
import MapPanel from './gameplay/map/MapPanel';
import CombatScreen from './CombatScreen';
import AuctionScreen from './AuctionScreen';
import CultivationScreen from './CultivationScreen';
import CompanionManagementScreen from './CompanionManagementScreen';
import PrisonerManagementScreen from './PrisonerManagementScreen';
import { CompanionEquipmentScreen } from './gameplay/equipment/CompanionEquipmentScreen';
import SlaveAuctionScreen from './SlaveAuctionScreen';
import PromptsScreen from './PromptsScreen';
import EventsScreen from './EventsScreen';
import { VIETNAMESE } from '../constants';

const AppRouter: React.FC = () => {
    const game = useGame();

    switch (game.currentScreen) {
        case GameScreen.Initial:
            return <InitialScreen 
                setCurrentScreen={game.setCurrentScreen} 
                onSignOut={() => {}} // Firebase removed
                isFirebaseLoading={false} // Firebase removed
            />;
        case GameScreen.GameSetup:
            return <GameSetupScreen 
                setCurrentScreen={game.setCurrentScreen} 
                onSetupComplete={game.handleSetupComplete} 
            />;
        case GameScreen.Gameplay:
            return <GameplayScreen />;
        case GameScreen.Events:
            return <EventsScreen />;
        case GameScreen.Equipment: 
            return <EquipmentScreen
                knowledgeBase={game.knowledgeBase}
                setCurrentScreen={game.setCurrentScreen}
                onUpdateEquipment={game.handleUpdateEquipment}
            />;
        case GameScreen.CompanionEquipment:
            return <CompanionEquipmentScreen />;
        case GameScreen.Crafting:
            return <CraftingScreen
                knowledgeBase={game.knowledgeBase}
                setCurrentScreen={game.setCurrentScreen}
                onCraftItem={game.handleCraftItem}
                isCrafting={game.isCraftingItem}
            />;
        case GameScreen.Map:
            return <MapPanel
                knowledgeBase={game.knowledgeBase}
                setCurrentScreen={game.setCurrentScreen}
            />;
        case GameScreen.Auction:
            return <AuctionScreen
                knowledgeBase={game.knowledgeBase}
                onPlaceBid={game.handlePlayerAuctionAction}
                onAuctioneerCall={game.handleAuctioneerCall}
                onSkipItem={game.handleSkipAuctionItem}
                onLeave={() => {
                    game.setKnowledgeBase(prev => ({ ...prev, auctionState: null }));
                    game.setCurrentScreen(GameScreen.Gameplay);
                }}
                isLoading={game.isLoadingApi}
                sentEconomyPromptsLog={game.sentEconomyPromptsLog}
                receivedEconomyResponsesLog={game.receivedEconomyResponsesLog}
            />;
         case GameScreen.SlaveAuction:
            return <SlaveAuctionScreen
                knowledgeBase={game.knowledgeBase}
                onPlaceBid={game.handlePlayerSlaveAuctionAction}
                onAuctioneerCall={game.handleSlaveAuctioneerCall}
                onSkipItem={game.handleSkipSlaveAuctionItem}
                onLeave={() => {
                    game.setKnowledgeBase(prev => ({ ...prev, slaveAuctionState: null }));
                    game.setCurrentScreen(GameScreen.Gameplay);
                }}
                isLoading={game.isLoadingApi}
                sentEconomyPromptsLog={game.sentEconomyPromptsLog}
                receivedEconomyResponsesLog={game.receivedEconomyResponsesLog}
            />;
        case GameScreen.Combat:
            return <CombatScreen
                knowledgeBase={game.knowledgeBase}
                onCombatEnd={game.handleCombatEnd}
                currentPageMessagesLog={game.currentPageMessagesLog}
                previousPageSummaries={game.previousPageSummaries}
                lastNarrationFromPreviousPage={game.lastNarrationFromPreviousPage}
            />;
        case GameScreen.Cultivation:
            return <CultivationScreen
                knowledgeBase={game.knowledgeBase}
                onStartCultivation={game.handleStartCultivation}
                onExit={game.handleExitCultivation}
                isLoading={game.isCultivating}
                setCurrentScreen={game.setCurrentScreen}
            />;
        case GameScreen.CompanionManagement:
            return <CompanionManagementScreen />;
        case GameScreen.PrisonerManagement:
            return <PrisonerManagementScreen />;
        case GameScreen.ApiSettings:
            return <ApiSettingsScreen 
                setCurrentScreen={game.setCurrentScreen}
                onSettingsSavedNotification={() => game.showNotification(VIETNAMESE.settingsSavedMessage, 'success')}
            />;
        case GameScreen.LoadGameSelection:
            return <LoadGameScreen 
                setCurrentScreen={game.setCurrentScreen}
                onLoadGame={game.onLoadGame}
                notify={game.showNotification}
                storageType={game.storageSettings.storageType}
            />;
        case GameScreen.StorageSettings:
            return <StorageSettingsScreen 
                setCurrentScreen={game.setCurrentScreen}
                onSettingsSaved={game.onSettingsSaved}
            />;
        case GameScreen.ImportExport:
            return <ImportExportScreen 
                setCurrentScreen={game.setCurrentScreen}
                storageType={game.storageSettings.storageType}
                notify={game.showNotification}
                fetchSaveGames={game.fetchSaveGamesForImportExport}
                loadSpecificGameData={game.loadSpecificGameDataForExport}
                importGameData={game.handleImportGameData}
            />;
        case GameScreen.Prompts:
            return <PromptsScreen />;
        default:
            return <InitialScreen 
                setCurrentScreen={game.setCurrentScreen}
                onSignOut={() => {}}
                isFirebaseLoading={false}
            />;
    }
};

export default AppRouter;