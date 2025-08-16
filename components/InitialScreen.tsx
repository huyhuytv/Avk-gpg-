
import React, { useCallback } from 'react';
import { GameScreen } from '../types'; 
import Button from './ui/Button';
import { VIETNAMESE, GAME_TITLE, APP_VERSION } from '../constants';

interface InitialScreenProps {
  setCurrentScreen: (screen: GameScreen) => void;
  onSignOut: () => void; 
  isFirebaseLoading: boolean; 
}

const InitialScreen: React.FC<InitialScreenProps> = ({ setCurrentScreen }) => {
  const handleLoadGameClick = useCallback(() => {
    setCurrentScreen(GameScreen.LoadGameSelection);
  }, [setCurrentScreen]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-6 text-center">
      <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 mb-6">
        {GAME_TITLE}
      </h1>
      <p className="text-xl text-gray-300 mb-12 max-w-2xl">{VIETNAMESE.welcomeMessage(GAME_TITLE)}</p>
      
      <div className="space-y-4 w-full max-w-sm">
        <Button 
          variant="primary" 
          size="lg" 
          className="w-full"
          onClick={() => setCurrentScreen(GameScreen.GameSetup)}
        >
          {VIETNAMESE.newGame}
        </Button>
        <Button 
          variant="secondary" 
          size="lg" 
          className="w-full" 
          onClick={handleLoadGameClick}
        >
          {VIETNAMESE.loadGame}
        </Button>
         <Button 
            variant="ghost" 
            size="md" 
            className="w-full" 
            onClick={() => setCurrentScreen(GameScreen.ImportExport)}
          >
          {VIETNAMESE.importExportData}
        </Button>
         <Button 
            variant="ghost" 
            size="md" 
            className="w-full" 
            onClick={() => setCurrentScreen(GameScreen.ApiSettings)}
          >
          {VIETNAMESE.apiSettings}
        </Button>
        <Button 
            variant="ghost" 
            size="md" 
            className="w-full" 
            onClick={() => setCurrentScreen(GameScreen.StorageSettings)}
          >
          {VIETNAMESE.storageSettings} 
        </Button>
        <Button 
            variant="ghost" 
            size="md" 
            className="w-full" 
            onClick={() => setCurrentScreen(GameScreen.Prompts)}
          >
          Xem Lời Nhắc
        </Button>
      </div>
      <p className="mt-12 text-sm text-gray-500">Phiên bản {APP_VERSION}</p>
    </div>
  );
};

export default InitialScreen;