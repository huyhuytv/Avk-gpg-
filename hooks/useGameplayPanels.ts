
import { useState } from 'react';

export const useGameplayPanels = () => {
  const [isReaderMode, setIsReaderMode] = useState(false);
  const [isCharPanelOpen, setIsCharPanelOpen] = useState(false);
  const [isQuestsPanelOpen, setIsQuestsPanelOpen] = useState(false);
  const [isWorldPanelOpen, setIsWorldPanelOpen] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [isMainMenuOpen, setIsMainMenuOpen] = useState(false);

  return {
    isReaderMode,
    setIsReaderMode,
    isCharPanelOpen,
    setIsCharPanelOpen,
    isQuestsPanelOpen,
    setIsQuestsPanelOpen,
    isWorldPanelOpen,
    setIsWorldPanelOpen,
    showDebugPanel,
    setShowDebugPanel,
    isMainMenuOpen,
    setIsMainMenuOpen,
  };
};
