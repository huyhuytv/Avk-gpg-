
import { useState, useCallback } from 'react';
import { Item, Skill, Quest, NPC, GameLocation, WorldLoreEntry, Faction, Companion, YeuThu as YeuThuTemplate, Wife, Slave, Prisoner } from '../types';
import { GameEntity, GameEntityType } from './types';

export const useGameplayModals = () => {
    const [selectedEntity, setSelectedEntity] = useState<{ type: GameEntityType; entity: GameEntity } | null>(null);
    const [isStyleSettingsModalOpen, setIsStyleSettingsModalOpen] = useState(false);
    const [isAiContextModalOpen, setIsAiContextModalOpen] = useState(false); // NEW
    const [activeEconomyModal, setActiveEconomyModal] = useState<{type: 'marketplace' | 'shopping_center', locationId: string} | null>(null);
    const [activeSlaveMarketModal, setActiveSlaveMarketModal] = useState<{locationId: string} | null>(null);

    const openEntityModal = useCallback((type: GameEntityType, entity: GameEntity) => {
        setSelectedEntity({ type, entity });
    }, []);
    
    const closeModal = useCallback(() => {
        setSelectedEntity(null);
    }, []);

    const closeEconomyModal = useCallback(() => {
        setActiveEconomyModal(null);
    }, []);

    const closeSlaveMarketModal = useCallback(() => {
        setActiveSlaveMarketModal(null);
    }, []);


    const closeAllModals = useCallback(() => {
        setSelectedEntity(null);
        setActiveEconomyModal(null);
        setIsStyleSettingsModalOpen(false);
        setIsAiContextModalOpen(false); // NEW
        setActiveSlaveMarketModal(null);
    }, []);

    return {
        selectedEntity,
        isStyleSettingsModalOpen,
        isAiContextModalOpen, // NEW
        activeEconomyModal,
        activeSlaveMarketModal,
        openEntityModal,
        closeModal,
        closeEconomyModal,
        closeSlaveMarketModal,
        setIsStyleSettingsModalOpen,
        setIsAiContextModalOpen, // NEW
        setActiveEconomyModal,
        setActiveSlaveMarketModal,
        closeAllModals
    };
};
