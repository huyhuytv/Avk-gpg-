
import { useContext } from 'react';
import { GameContext, GameContextType } from '../contexts/GameContext';

/**
 * Custom hook to access the game context.
 * Provides a clean interface for components to get game state and actions.
 * Throws an error if used outside of a GameProvider.
 */
export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (context === null) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
