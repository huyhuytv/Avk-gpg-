


import React from 'react';

import { GameProvider } from './contexts/GameContext';
import { useGame } from './hooks/useGame';
import AppRouter from './components/AppRouter';
import Spinner from './components/ui/Spinner';
import { VIETNAMESE } from './constants';
import { GameScreen } from './types';

// New imports for modals
import EntityDetailModal from './components/gameplay/modals/EntityDetailModal';
import MarketplaceModal from './components/gameplay/economy/MarketplaceModal';
import ShoppingCenterModal from './components/gameplay/economy/ShoppingCenterModal';
import StyleSettingsModal from './components/StyleSettingsModal';
import SlaveMarketModal from './components/gameplay/economy/SlaveMarketModal'; // NEW IMPORT
import AIContextScreen from './components/AIContextScreen';


// A new inner component to access the context provided by GameProvider
const AppContent: React.FC = () => {
  const game = useGame(); // useGame hook provides access to all game state and actions

  if (game.isInitialLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-900"><Spinner text="Đang tải và khởi tạo..." /></div>;
  }
  
  if (game.storageInitError && game.currentScreen !== GameScreen.StorageSettings) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-6 text-center">
        <h1 className="text-3xl font-bold text-red-500 mb-4">{VIETNAMESE.errorInitializingStorage}</h1>
        <p className="text-lg text-gray-300 mb-6">{game.storageInitError}</p>
        <button 
          onClick={() => game.setCurrentScreen(GameScreen.StorageSettings)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
        >
          {VIETNAMESE.storageSettings}
        </button>
      </div>
    );
  }

  return (
    <>
      <AppRouter />
      {/* Global UI elements that can be displayed over any screen */}
      {game.notification && (
        <div 
          role="alert"
          className={`fixed bottom-5 right-5 p-4 rounded-lg shadow-lg text-white text-sm z-[100]
                      ${game.notification.type === 'success' ? 'bg-green-600' : ''}
                      ${game.notification.type === 'error' ? 'bg-red-600' : ''}
                      ${game.notification.type === 'info' ? 'bg-blue-600' : ''}
                      ${game.notification.type === 'warning' ? 'bg-yellow-500 text-gray-800' : ''}`}
        >
          {game.notification.message}
        </div>
      )}
      {game.apiError && game.currentScreen === GameScreen.Gameplay && ( 
         <div className="fixed top-5 left-1/2 -translate-x-1/2 p-3 bg-red-700 text-white rounded-md shadow-lg z-[100] text-xs max-w-md">
            Lỗi API: {game.apiError}
         </div>
      )}
      {(game.isCraftingItem) && ( 
         <div className="fixed top-5 left-1/2 -translate-x-1/2 p-3 bg-blue-600 text-white rounded-md shadow-lg z-[100] text-sm flex items-center gap-2">
            <Spinner size="sm" />
            <span>{VIETNAMESE.craftingInProgress}</span>
         </div>
      )}

      {/* Global Modals - Rendered on top of any screen */}
      {game.activeEconomyModal?.type === 'marketplace' && <MarketplaceModal locationId={game.activeEconomyModal.locationId} knowledgeBase={game.knowledgeBase} onClose={game.closeEconomyModal} onBuyItem={game.handleBuyItem} onSellItem={game.handleSellItem} />}
      {game.activeEconomyModal?.type === 'shopping_center' && <ShoppingCenterModal locationId={game.activeEconomyModal.locationId} knowledgeBase={game.knowledgeBase} onClose={game.closeEconomyModal} onBuyItem={game.handleBuyItem} onSellItem={game.handleSellItem} />}
      {game.activeSlaveMarketModal && <SlaveMarketModal locationId={game.activeSlaveMarketModal.locationId} knowledgeBase={game.knowledgeBase} onClose={game.closeSlaveMarketModal} onBuySlave={game.handleBuySlave} />}
      {game.isStyleSettingsModalOpen && <StyleSettingsModal initialSettings={game.styleSettings} onSave={(s) => { game.setStyleSettings(s); game.setIsStyleSettingsModalOpen(false); }} onClose={() => game.setIsStyleSettingsModalOpen(false)} />}
      {game.isAiContextModalOpen && <AIContextScreen onClose={() => game.setIsAiContextModalOpen(false)} />}
      
      {/* EntityDetailModal is last to ensure it's on top of other modals */}
      <EntityDetailModal selectedEntity={game.selectedEntity} isOpen={!!game.selectedEntity} onClose={game.closeModal} knowledgeBase={game.knowledgeBase} onUpdateNpcAvatar={game.onUpdateNpcAvatar} isUploadingAvatar={game.isUploadingAvatar} />
    </>
  );
};

// The main App component is now just the provider wrapper
export const App: React.FC = () => {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
};