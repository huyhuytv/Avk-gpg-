import React from 'react';
import Button from '../../ui/Button';
import { VIETNAMESE } from '../../../constants';
import { KnowledgeBase } from '../../../types';
import { formatWorldDateToString } from '../../../utils/dateUtils';

interface GameHeaderProps {
  gameTitleDisplay: string;
  knowledgeBase: KnowledgeBase;
  setIsMainMenuOpen: (isOpen: boolean) => void;
  onRollbackTurn: () => void;
  isStopButtonDisabled: boolean;
  isLoading: boolean;
  onSaveGame: () => Promise<void>;
  isSaveDisabled: boolean;
  isSavingGame: boolean;
  onQuit: () => void;
  isSummarizing: boolean;
}

const GameHeader: React.FC<GameHeaderProps> = ({
  gameTitleDisplay,
  knowledgeBase,
  setIsMainMenuOpen,
  onRollbackTurn,
  isStopButtonDisabled,
  isLoading,
  onSaveGame,
  isSaveDisabled,
  isSavingGame,
  onQuit,
  isSummarizing,
}) => {
  const { worldDate, playerStats } = knowledgeBase;
  const turn = playerStats.turn;
  const formattedDate = formatWorldDateToString(worldDate);

  return (
    <header className="mb-2 sm:mb-4 flex flex-wrap justify-between items-center flex-shrink-0 gap-y-2 gap-x-4">
      <h1
        className="text-xl sm:text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-cyan-500 to-blue-600 truncate max-w-xs sm:max-w-sm md:max-w-md"
        title={gameTitleDisplay}
      >
        {gameTitleDisplay}
      </h1>
      <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-end">
        {/* Time/Turn Info Group */}
        <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-300">
          <div className="flex items-center gap-1.5" title="Thời gian trong game">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-sky-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="whitespace-nowrap">{formattedDate}</span>
          </div>
          <span className="text-gray-600 hidden sm:inline">|</span>
          <div className="flex items-center gap-1.5" title="Lượt chơi hiện tại">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-sky-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5m7 0v5h5m-9-1V4a2 2 0 012-2h4a2 2 0 012 2v5m-6 9v-5a2 2 0 00-2-2H5a2 2 0 00-2 2v5a2 2 0 002 2h4a2 2 0 002-2z" transform="rotate(45 12 12)" />
              </svg>
              <span className="whitespace-nowrap">Lượt: {turn}</span>
          </div>
        </div>
      
        {/* Button Group */}
        <div className="flex space-x-1 sm:space-x-2">
          <Button onClick={() => setIsMainMenuOpen(true)} variant="secondary" size="sm" aria-label="Mở Menu" title="Mở Menu" className="px-2 sm:px-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
            <span className="hidden sm:inline ml-2">Menu</span>
          </Button>
          
          <Button
            onClick={onRollbackTurn}
            variant="secondary"
            size="sm"
            disabled={isStopButtonDisabled}
            title={isLoading ? "Dừng nhận phản hồi và lùi lượt" : VIETNAMESE.rollbackTurn}
            aria-label={isLoading ? "Dừng nhận phản hồi và lùi lượt" : VIETNAMESE.rollbackTurn}
            className="border-amber-500 text-amber-300 hover:bg-amber-700 hover:text-white px-2 sm:px-3"
          >
            <span className="sm:hidden">⏪</span><span className="hidden sm:inline">{VIETNAMESE.stopButtonShort || VIETNAMESE.stopButton}</span>
          </Button>

          <Button
            onClick={onSaveGame}
            variant="primary"
            size="sm"
            disabled={isSaveDisabled}
            isLoading={isSavingGame}
            loadingText="Đang lưu..."
            title={VIETNAMESE.saveGameButton}
            aria-label={VIETNAMESE.saveGameButton}
            className="px-2 sm:px-3"
          >
            <span className="sm:hidden">💾</span><span className="hidden sm:inline">{VIETNAMESE.saveGameButtonShort || VIETNAMESE.saveGameButton}</span>
          </Button>
          
          <Button onClick={onQuit} variant="danger" size="sm" disabled={isSummarizing} className="px-2 sm:px-3" title={VIETNAMESE.quitGameButtonTitle} aria-label={VIETNAMESE.quitGameButtonTitle}>
            <span className="sm:hidden">🚪</span><span className="hidden sm:inline">{VIETNAMESE.quitGameButtonShort || VIETNAMESE.quitGameButton}</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default GameHeader;
