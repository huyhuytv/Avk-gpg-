import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { GameScreen, KnowledgeBase, Item, EquipmentSlotId, EquipmentSlotConfig, Wife, Slave, ComplexCompanionBase, PlayerStats } from '../../../types';
import Button from '../../ui/Button';
import { VIETNAMESE, EQUIPMENT_SLOTS_CONFIG, DEFAULT_PLAYER_STATS } from '../../../constants';
import * as GameTemplates from '../../../templates';
import EquipmentSlotUI from './EquipmentSlotUI';
import EquipmentInventoryList from './EquipmentInventoryList';
import PlayerStatsWithEquipment from './PlayerStatsWithEquipment';
import EquippableItemsPopover from './EquippableItemsPopover';
import { useGame } from '../../../hooks/useGame';
import InputField from '../../ui/InputField';
import { calculateEffectiveStats, calculateRealmBaseStats } from '../../../utils/statsCalculationUtils';

export const CompanionEquipmentScreen: React.FC = () => {
    const { knowledgeBase, setKnowledgeBase, setCurrentScreen } = useGame();
    
    const allCompanions: (Wife | Slave)[] = [...knowledgeBase.wives, ...knowledgeBase.slaves];

    const [selectedCompanionId, setSelectedCompanionId] = useState<string | null>(allCompanions[0]?.id || null);
    
    const [draggedItemInfo, setDraggedItemInfo] = useState<{ id: string; category: GameTemplates.ItemCategoryValues; equipmentType: GameTemplates.EquipmentTypeValues; fromSlotId?: EquipmentSlotId; } | null>(null);
    const [draggingOverSlot, setDraggingOverSlot] = useState<EquipmentSlotId | null>(null);
    const [activePopover, setActivePopover] = useState<{ slotId: EquipmentSlotId; targetRect: DOMRect | null; } | null>(null);
    const [draggedItemTypeForHighlight, setDraggedItemTypeForHighlight] = useState<GameTemplates.EquipmentTypeValues | null>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    const selectedCompanion = allCompanions.find(c => c.id === selectedCompanionId);
    
    const allEquippedItemIds = useMemo(() => {
        const ids = new Set<string>();
        // Player's equipment
        Object.values(knowledgeBase.equippedItems).forEach(id => { if (id) ids.add(id); });
        // All companions' equipment
        knowledgeBase.wives.forEach(c => Object.values(c.equippedItems).forEach(id => { if (id) ids.add(id); }));
        knowledgeBase.slaves.forEach(c => Object.values(c.equippedItems).forEach(id => { if (id) ids.add(id); }));
        return ids;
    }, [knowledgeBase.equippedItems, knowledgeBase.wives, knowledgeBase.slaves]);

    const displayableInventory = useMemo(() => {
        // Show only equipment items that are not equipped by anyone
        return knowledgeBase.inventory.filter(item => 
          item.category === GameTemplates.ItemCategory.EQUIPMENT && !allEquippedItemIds.has(item.id)
        );
    }, [knowledgeBase.inventory, allEquippedItemIds]);


    const handleUpdateCompanionEquipment = useCallback((companionId: string, slotId: EquipmentSlotId, itemIdToEquip: string | null, previousItemIdInSlot: string | null) => {
        setKnowledgeBase(prevKb => {
            const newKb = JSON.parse(JSON.stringify(prevKb));
            const companionList: (Wife[] | Slave[]) = newKb.wives.some((w: Wife) => w.id === companionId) ? newKb.wives : newKb.slaves;
            const companionIndex = companionList.findIndex((c: ComplexCompanionBase) => c.id === companionId);
            
            if (companionIndex > -1) {
                const companion = companionList[companionIndex];
                if (!companion.equippedItems) { // Initialize if not present
                    companion.equippedItems = { mainWeapon: null, offHandWeapon: null, head: null, body: null, hands: null, legs: null, artifact: null, pet: null, accessory1: null, accessory2: null };
                }
                companion.equippedItems[slotId] = itemIdToEquip;
            }
            return newKb;
        });
    }, [setKnowledgeBase]);

    const handleDragStartFromInventory = useCallback((event: React.DragEvent<HTMLDivElement>, item: Item) => {
        if (item.category === GameTemplates.ItemCategory.EQUIPMENT) {
          const equipment = item as GameTemplates.EquipmentTemplate;
          event.dataTransfer.setData('application/json-item-id', String(item.id));
          event.dataTransfer.setData('application/json-item-category', String(item.category));
          event.dataTransfer.setData('application/json-equipment-type', String(equipment.equipmentType || ''));
          event.dataTransfer.effectAllowed = 'move';
          setDraggedItemInfo({ id: item.id, category: item.category, equipmentType: equipment.equipmentType });
          setDraggedItemTypeForHighlight(equipment.equipmentType);
          setActivePopover(null);
        }
    }, []);

    const handleDragStartFromSlot = useCallback((event: React.DragEvent<HTMLDivElement>, itemId: string, fromSlotId: EquipmentSlotId) => {
        if (!selectedCompanion) return;
        const item = knowledgeBase.inventory.find(i => i.id === itemId);
        if (item && item.category === GameTemplates.ItemCategory.EQUIPMENT) {
            const equipment = item as GameTemplates.EquipmentTemplate;
            event.dataTransfer.setData('application/json-item-id', String(item.id));
            event.dataTransfer.setData('application/json-item-category', String(item.category));
            event.dataTransfer.setData('application/json-equipment-type', String(equipment.equipmentType || ''));
            event.dataTransfer.setData('application/json-from-slot-id', String(fromSlotId));
            event.dataTransfer.effectAllowed = 'move';
            setDraggedItemInfo({ id: item.id, category: item.category, equipmentType: equipment.equipmentType, fromSlotId: fromSlotId });
            setDraggedItemTypeForHighlight(equipment.equipmentType);
            setActivePopover(null);
        }
      }, [knowledgeBase.inventory, selectedCompanion]);

    const handleDropOnSlot = useCallback((slotId: EquipmentSlotId, droppedItemId: string) => {
        if (!selectedCompanion) return;
        const previousItemIdInSlot = selectedCompanion.equippedItems[slotId];
        handleUpdateCompanionEquipment(selectedCompanion.id, slotId, droppedItemId, previousItemIdInSlot);
    }, [selectedCompanion, handleUpdateCompanionEquipment]);

    const handleDropOnInventory = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        if (!selectedCompanion) return;
        const fromSlotId = event.dataTransfer.getData('application/json-from-slot-id') as EquipmentSlotId | undefined;
        const itemId = event.dataTransfer.getData('application/json-item-id');
        if (fromSlotId && itemId) { 
            handleUpdateCompanionEquipment(selectedCompanion.id, fromSlotId, null, itemId); 
        }
    };
    
    const handleSlotClick = useCallback((slotId: EquipmentSlotId, targetElement: HTMLDivElement) => {
        setActivePopover(prev => prev?.slotId === slotId ? null : { slotId, targetRect: targetElement.getBoundingClientRect() });
    }, []);

    const handleClosePopover = useCallback(() => setActivePopover(null), []);
    
    const handleEquipFromPopover = useCallback((itemIdToEquip: string, slotId: EquipmentSlotId) => {
        if (!selectedCompanion) return;
        const previousItemIdInSlot = selectedCompanion.equippedItems[slotId];
        handleUpdateCompanionEquipment(selectedCompanion.id, slotId, itemIdToEquip, previousItemIdInSlot);
        handleClosePopover();
    }, [selectedCompanion, handleUpdateCompanionEquipment, handleClosePopover]);

    const handleUnequipFromPopover = useCallback((slotId: EquipmentSlotId) => {
        if (!selectedCompanion) return;
        const previousItemIdInSlot = selectedCompanion.equippedItems[slotId];
        if (previousItemIdInSlot) {
            handleUpdateCompanionEquipment(selectedCompanion.id, slotId, null, previousItemIdInSlot);
        }
        handleClosePopover();
    }, [selectedCompanion, handleUpdateCompanionEquipment, handleClosePopover]);

    const getCompatibleItemsForPopover = (): Item[] => {
        if (!activePopover || !selectedCompanion) return [];
        const slotConfig = EQUIPMENT_SLOTS_CONFIG.find(s => s.id === activePopover.slotId);
        if (!slotConfig) return [];

        const currentItemInSlotId = selectedCompanion.equippedItems[activePopover.slotId];

        return knowledgeBase.inventory.filter(item => {
            if (item.category !== GameTemplates.ItemCategory.EQUIPMENT) return false;
            
            const equipmentItem = item as GameTemplates.EquipmentTemplate;
            if (!slotConfig.accepts.includes(equipmentItem.equipmentType)) return false;
    
            if (allEquippedItemIds.has(item.id)) {
                return item.id === currentItemInSlotId;
            }
            
            return true;
        });
    };
    
    const currentItemInActivePopoverSlot = (activePopover && selectedCompanion) ? 
      knowledgeBase.inventory.find(i => i.id === selectedCompanion.equippedItems[activePopover.slotId]) || null : null;


    const getFullCompanionStats = (companion: ComplexCompanionBase): PlayerStats | null => {
      if (!companion.stats || !companion.realm) return null;

      const baseStats = calculateRealmBaseStats(
          companion.realm,
          knowledgeBase.realmProgressionList,
          knowledgeBase.currentRealmBaseStats
      );
      
      const fullStats: PlayerStats = {
          ...DEFAULT_PLAYER_STATS,
          ...baseStats,
          ...companion.stats,
          realm: companion.realm,
          sinhLuc: companion.stats.sinhLuc ?? baseStats.baseMaxSinhLuc,
          maxSinhLuc: companion.stats.maxSinhLuc ?? baseStats.baseMaxSinhLuc,
          linhLuc: companion.stats.linhLuc ?? baseStats.baseMaxLinhLuc,
          maxLinhLuc: companion.stats.maxLinhLuc ?? baseStats.baseMaxLinhLuc,
          sucTanCong: companion.stats.sucTanCong ?? baseStats.baseSucTanCong,
          currency: 0,
          isInCombat: false,
          turn: knowledgeBase.playerStats.turn,
          hieuUngBinhCanh: false,
          activeStatusEffects: [],
          professions: [],
          thoNguyen: companion.stats.thoNguyen ?? 100,
          maxThoNguyen: companion.stats.maxThoNguyen ?? 100,
          spiritualRoot: companion.spiritualRoot || "Không rõ",
          specialPhysique: companion.specialPhysique || "Không rõ",
          tuChat: companion.tuChat, // Pass aptitude
      };
      
      return calculateEffectiveStats(fullStats, companion.equippedItems, knowledgeBase.inventory);
    };

    const companionFullStats = selectedCompanion ? getFullCompanionStats(selectedCompanion) : null;


    return (
        <div className="min-h-screen flex flex-col bg-gray-800 p-3 sm:p-4 text-gray-100">
            <header className="mb-4 flex justify-between items-center">
                <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-500 to-indigo-600">
                    Trang Bị Hậu Cung
                </h1>
                <Button variant="secondary" onClick={() => setCurrentScreen(GameScreen.Gameplay)}>
                    {VIETNAMESE.goBackButton}
                </Button>
            </header>

            <div className="mb-4">
                <InputField
                    label="Chọn người để trang bị"
                    id="select-companion-equip"
                    type="select"
                    options={allCompanions.map(c => c.name)}
                    value={selectedCompanion?.name || ''}
                    onChange={(e) => setSelectedCompanionId(allCompanions.find(c => c.name === e.target.value)?.id || null)}
                    disabled={allCompanions.length === 0}
                />
                 {allCompanions.length === 0 && <p className="text-sm italic text-gray-400">Không có ai trong hậu cung để trang bị.</p>}
            </div>

            {selectedCompanion && (
                <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-4 relative">
                    <div className="lg:col-span-2 flex flex-col gap-4">
                        <div className="bg-gray-900 p-3 sm:p-4 rounded-lg shadow-xl border border-gray-700">
                            <h2 className="text-xl font-semibold text-indigo-300 mb-4 border-b border-gray-600 pb-2">
                                Trang bị của {selectedCompanion.name}
                            </h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 place-items-center">
                                {EQUIPMENT_SLOTS_CONFIG.map(slotConfig => {
                                    const equippedItemId = selectedCompanion.equippedItems[slotConfig.id];
                                    const equippedItem = equippedItemId ? knowledgeBase.inventory.find(i => i.id === equippedItemId) : null;
                                    const isSlotHighlighted = !!draggedItemTypeForHighlight && slotConfig.accepts.includes(draggedItemTypeForHighlight);
                                    return (
                                        <EquipmentSlotUI
                                            key={slotConfig.id}
                                            slotConfig={slotConfig}
                                            equippedItem={equippedItem || null}
                                            onDropItem={handleDropOnSlot}
                                            onDragStartFromSlot={handleDragStartFromSlot}
                                            isDraggingOver={draggingOverSlot === slotConfig.id}
                                            onDragEnterSlot={setDraggingOverSlot}
                                            onDragLeaveSlot={() => setDraggingOverSlot(null)}
                                            onClick={handleSlotClick}
                                            isHighlighted={isSlotHighlighted}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                        {companionFullStats && (
                             <PlayerStatsWithEquipment
                                personId={selectedCompanion.id}
                                playerStats={companionFullStats}
                                equippedItems={selectedCompanion.equippedItems}
                                inventory={knowledgeBase.inventory}
                                currencyName={knowledgeBase.worldConfig?.currencyName}
                                playerName={selectedCompanion.name}
                                playerGender={selectedCompanion.gender}
                                playerRace={selectedCompanion.race}
                                playerAvatarUrl={selectedCompanion.avatarUrl}
                                isPlayerContext={false}
                                worldDate={knowledgeBase.worldDate}
                            />
                        )}
                    </div>

                    <div 
                        className="lg:col-span-1"
                        onDrop={handleDropOnInventory}
                        onDragOver={(e) => e.preventDefault()}
                    >
                        <EquipmentInventoryList
                            inventory={displayableInventory}
                            onDragStartItem={handleDragStartFromInventory}
                        />
                    </div>
                     {activePopover && (
                        <div ref={popoverRef}>
                            <EquippableItemsPopover
                            slotId={activePopover.slotId}
                            items={getCompatibleItemsForPopover()}
                            currentItemInSlot={currentItemInActivePopoverSlot as Item | null}
                            onSelectItem={(itemId) => handleEquipFromPopover(itemId, activePopover.slotId)}
                            onUnequip={() => handleUnequipFromPopover(activePopover.slotId)}
                            onClose={handleClosePopover}
                            targetRect={activePopover.targetRect}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
