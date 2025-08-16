
import React from 'react';
import { useGame } from '../../../hooks/useGame';
import { GameScreen } from '../../../types';
import Button from '../../ui/Button';
import { VIETNAMESE } from '../../../constants';

interface MainMenuPanelProps {
  onClose: () => void;
  setIsCharPanelOpen: (isOpen: boolean) => void;
  setIsQuestsPanelOpen: (isOpen: boolean) => void;
  setIsWorldPanelOpen: (isOpen: boolean) => void;
  showDebugPanel: boolean;
  setShowDebugPanel: (show: boolean) => void;
}

const MenuButton: React.FC<{label: string, icon: string, onClick: () => void, disabled?: boolean, title?: string}> = ({ label, icon, onClick, disabled, title }) => (
    <Button
        variant="ghost"
        className="w-full text-left justify-start py-3 px-4 text-base"
        onClick={onClick}
        disabled={disabled}
        title={title || label}
    >
        <span className="mr-3 text-lg" role="img" aria-hidden="true">{icon}</span>
        {label}
    </Button>
);

const MenuGroup: React.FC<{title: string, children: React.ReactNode}> = ({ title, children }) => (
    <div className="border-t border-gray-700 pt-3 mt-3 first:mt-0 first:pt-0 first:border-none">
        <h4 className="px-4 py-2 text-sm font-semibold text-gray-400 uppercase tracking-wider">{title}</h4>
        <div className="space-y-1">
            {children}
        </div>
    </div>
);

export const MainMenuPanel: React.FC<MainMenuPanelProps> = ({ onClose, setIsCharPanelOpen, setIsQuestsPanelOpen, setIsWorldPanelOpen, showDebugPanel, setShowDebugPanel }) => {
    const { setCurrentScreen, knowledgeBase, setIsStyleSettingsModalOpen, setIsAiContextModalOpen } = useGame();

    const isRestricted = !!knowledgeBase.playerStats.playerSpecialStatus;
    const isLocationSafe = !!knowledgeBase.discoveredLocations.find(l => l.id === knowledgeBase.currentLocationId)?.isSafeZone;
    
    const handleScreenNavigation = (screen: GameScreen) => {
        setCurrentScreen(screen);
        onClose();
    };

    const handlePanelNavigation = (panelSetter: (isOpen: boolean) => void) => {
        panelSetter(true);
        onClose();
    };
    
    const handleAction = (action: () => void) => {
        action();
        onClose();
    };

    const handleToggleDebug = () => {
        setShowDebugPanel(!showDebugPanel);
        onClose();
    };

    return (
        <div className="flex flex-col h-full text-gray-200">
            <MenuGroup title="Nhân Vật">
                <MenuButton label={VIETNAMESE.characterButton} icon="🧑" onClick={() => handlePanelNavigation(setIsCharPanelOpen)} />
                <MenuButton label={VIETNAMESE.equipmentButton} icon="⚔️" onClick={() => handleScreenNavigation(GameScreen.Equipment)} />
                <MenuButton label={VIETNAMESE.companionManagementButton} icon="❤️" onClick={() => handleScreenNavigation(GameScreen.CompanionManagement)} disabled={isRestricted} />
                <MenuButton label={"Trang Bị Hậu Cung"} icon="❤️‍🩹" onClick={() => handleScreenNavigation(GameScreen.CompanionEquipment)} disabled={isRestricted} />
                <MenuButton label={VIETNAMESE.prisonerManagementButton} icon="🔗" onClick={() => handleScreenNavigation(GameScreen.PrisonerManagement)} disabled={isRestricted} />
            </MenuGroup>

            <MenuGroup title="Thế Giới">
                <MenuButton label={VIETNAMESE.worldButton} icon="🌍" onClick={() => handlePanelNavigation(setIsWorldPanelOpen)} />
                <MenuButton label={VIETNAMESE.questsButton} icon="📜" onClick={() => handlePanelNavigation(setIsQuestsPanelOpen)} />
                <MenuButton label={VIETNAMESE.eventsButton} icon="🗓️" onClick={() => handleScreenNavigation(GameScreen.Events)} />
                <MenuButton label={VIETNAMESE.mapButton} icon="🗺️" onClick={() => handleScreenNavigation(GameScreen.Map)} />
            </MenuGroup>

            <MenuGroup title="Hành Động">
                 <MenuButton label={VIETNAMESE.craftingButton} icon="⚗️" onClick={() => handleScreenNavigation(GameScreen.Crafting)} disabled={isRestricted} />
                 <MenuButton label={VIETNAMESE.cultivationButton} icon="🧘" onClick={() => handleScreenNavigation(GameScreen.Cultivation)} disabled={isRestricted || !isLocationSafe} title={!isLocationSafe ? "Chỉ có thể tu luyện ở nơi an toàn" : VIETNAMESE.cultivationButton} />
            </MenuGroup>

            <MenuGroup title="Hệ Thống">
                <MenuButton label="Lời Nhắc" icon="📝" onClick={() => handleScreenNavigation(GameScreen.Prompts)} title="Lời nhắc cho AI" />
                <MenuButton label="Cấu Hình AI" icon="🧠" onClick={() => handleAction(() => setIsAiContextModalOpen(true))} />
                <MenuButton label={VIETNAMESE.gameplaySettingsButtonShort || "Hiển thị"} icon="⚙️" onClick={() => handleAction(() => setIsStyleSettingsModalOpen(true))} />
                <Button
                    variant={showDebugPanel ? "primary" : "ghost"}
                    className="w-full text-left justify-start py-3 px-4 text-base border-yellow-500 text-yellow-300 hover:bg-yellow-700 hover:text-white"
                    onClick={handleToggleDebug}
                    title="Mở/Đóng Bảng Điều Khiển Debug"
                >
                    <span className="mr-3 text-lg" role="img" aria-hidden="true">🐞</span>
                    Debug Panel
                </Button>
            </MenuGroup>
        </div>
    );
};
