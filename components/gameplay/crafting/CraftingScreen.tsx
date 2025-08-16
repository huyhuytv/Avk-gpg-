import React, { useState, useCallback, ChangeEvent } from 'react';
import { GameScreen, KnowledgeBase, Item as ItemType } from '../../../types';
import Button from '../../ui/Button';
import InputField from '../../ui/InputField';
import { VIETNAMESE } from '../../../constants';
import * as GameTemplates from '../../../templates';
import CraftingMaterialSlotUI from './CraftingMaterialSlotUI';
import MaterialInventoryListUI from './MaterialInventoryListUI';
import MaterialSelectionModal from './MaterialSelectionModal'; // Import the new modal

interface CraftingScreenProps {
  knowledgeBase: KnowledgeBase;
  setCurrentScreen: (screen: GameScreen) => void;
  onCraftItem: (
    desiredCategory: GameTemplates.ItemCategoryValues,
    requirements: string,
    materialIds: string[]
  ) => void;
  isCrafting: boolean; 
}

export const CraftingScreen: React.FC<CraftingScreenProps> = ({
  knowledgeBase,
  setCurrentScreen,
  onCraftItem,
  isCrafting,
}) => {
  const [desiredCategory, setDesiredCategory] = useState<GameTemplates.ItemCategoryValues | ''>('');
  const [itemRequirements, setItemRequirements] = useState('');
  const [materialSlots, setMaterialSlots] = useState<Array<{ id: string; itemId: string | null }>>([
    { id: `slot-${Date.now()}-1`, itemId: null },
    { id: `slot-${Date.now()}-2`, itemId: null },
    { id: `slot-${Date.now()}-3`, itemId: null },
  ]);
  const [draggingOverSlotId, setDraggingOverSlotId] = useState<string | null>(null);

  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [activeSlotIdForSelection, setActiveSlotIdForSelection] = useState<string | null>(null);

  const handleAddMaterialSlot = useCallback(() => {
    if (materialSlots.length < 10) {
      setMaterialSlots(prev => [...prev, { id: `slot-${Date.now()}-${prev.length}`, itemId: null }]);
    }
  }, [materialSlots.length]);

  const handleRemoveMaterialSlot = useCallback((slotIdToRemove: string) => {
    setMaterialSlots(prev => prev.filter(slot => slot.id !== slotIdToRemove));
  }, []);
  
  const handleDropOnMaterialSlot = useCallback((slotId: string, droppedItemId: string) => {
    setMaterialSlots(prevSlots =>
      prevSlots.map(slot =>
        slot.id === slotId ? { ...slot, itemId: droppedItemId } : slot
      )
    );
    setDraggingOverSlotId(null);
  }, []);

  const handleRemoveMaterialFromSlot = useCallback((slotIdToRemoveMaterialFrom: string) => {
     setMaterialSlots(prevSlots =>
      prevSlots.map(slot =>
        slot.id === slotIdToRemoveMaterialFrom ? { ...slot, itemId: null } : slot
      )
    );
  }, []);

  const handleDragStartFromInventory = useCallback((event: React.DragEvent<HTMLDivElement>, item: ItemType) => {
    if (item.category === GameTemplates.ItemCategory.MATERIAL) {
      event.dataTransfer.setData('application/json-item-id', String(item.id));
      event.dataTransfer.setData('application/json-item-category', String(item.category));
      event.dataTransfer.effectAllowed = 'copyMove';
    } else {
      event.preventDefault();
    }
  }, []);

  const handleCraft = useCallback(() => {
    if (!desiredCategory) {
      alert(VIETNAMESE.selectItemCategory);
      return;
    }
    const materialItemIds = materialSlots.map(slot => slot.itemId).filter(id => id !== null) as string[];
    if (materialItemIds.length === 0) {
        alert(VIETNAMESE.noMaterialsForCrafting);
        return;
    }
    onCraftItem(desiredCategory, itemRequirements, materialItemIds);
  }, [desiredCategory, itemRequirements, materialSlots, onCraftItem]);
  
  const handleMaterialSlotClick = useCallback((slotId: string) => {
    setActiveSlotIdForSelection(slotId);
    setIsMaterialModalOpen(true);
  }, []);

  const handleSelectMaterialFromModal = useCallback((itemId: string) => {
    if (activeSlotIdForSelection) {
        handleDropOnMaterialSlot(activeSlotIdForSelection, itemId);
    }
    setIsMaterialModalOpen(false);
    setActiveSlotIdForSelection(null);
  }, [activeSlotIdForSelection, handleDropOnMaterialSlot]);

  const itemCategoriesForDropdown = Object.values(GameTemplates.ItemCategory).map(category => {
    const labelValue = VIETNAMESE[`itemCategory_${category}` as keyof typeof VIETNAMESE] || category;
    if (typeof labelValue !== 'string') {
        // This case should not happen based on constants/translations.ts, but it satisfies TypeScript
        return { value: category, label: category };
    }
    return { value: category, label: labelValue };
  });

  return (
    <>
    <div className="min-h-screen flex flex-col bg-gray-800 p-3 sm:p-4 text-gray-100">
      <header className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-500 to-yellow-600">
          {VIETNAMESE.craftingScreenTitle}
        </h1>
        <Button variant="secondary" onClick={() => setCurrentScreen(GameScreen.Gameplay)} disabled={isCrafting}>
          {VIETNAMESE.goBackButton}
        </Button>
      </header>

      <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-gray-900 p-3 sm:p-4 rounded-lg shadow-xl border border-gray-700">
            <h2 className="text-xl font-semibold text-amber-300 mb-3 border-b border-gray-600 pb-2">
              {VIETNAMESE.desiredItemSection}
            </h2>
            <div className="space-y-3">
              <InputField
                label={VIETNAMESE.desiredItemCategoryLabel}
                id="desiredItemCategory"
                type="select"
                options={itemCategoriesForDropdown.map(opt => opt.label)}
                value={itemCategoriesForDropdown.find(opt => opt.value === desiredCategory)?.label || ''}
                onChange={(e) => {
                  const selectedLabel = (e.target as HTMLSelectElement).value;
                  const selectedValue = itemCategoriesForDropdown.find(opt => opt.label === selectedLabel)?.value || '';
                  setDesiredCategory(selectedValue);
                }}
              />
              <InputField
                label={VIETNAMESE.desiredItemRequirementsLabel}
                id="desiredItemRequirements"
                name="itemRequirements"
                value={itemRequirements}
                onChange={(e) => setItemRequirements(e.target.value)}
                textarea
                rows={3}
                placeholder={VIETNAMESE.desiredItemRequirementsPlaceholder}
              />
            </div>
          </div>
          <div className="bg-gray-900 p-3 sm:p-4 rounded-lg shadow-xl border border-gray-700">
            <h2 className="text-xl font-semibold text-amber-300 mb-3 border-b border-gray-600 pb-2">
              {VIETNAMESE.craftingMaterialsSection}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {materialSlots.map(slot => (
                <CraftingMaterialSlotUI
                  key={slot.id}
                  slotId={slot.id}
                  material={knowledgeBase.inventory.find(i => i.id === slot.itemId) || null}
                  onDropMaterial={handleDropOnMaterialSlot}
                  onRemoveMaterial={handleRemoveMaterialFromSlot}
                  isDraggingOver={draggingOverSlotId === slot.id}
                  onDragEnterSlot={setDraggingOverSlotId}
                  onDragLeaveSlot={() => setDraggingOverSlotId(null)}
                  onClick={handleMaterialSlotClick}
                />
              ))}
            </div>
            <div className="flex gap-2 mt-4">
                <Button onClick={handleAddMaterialSlot} variant="ghost" size="sm" className="border-dashed flex-1" disabled={materialSlots.length >= 10}>
                    {VIETNAMESE.addMaterialSlotButton}
                </Button>
                {materialSlots.length > 3 && 
                    <Button onClick={() => handleRemoveMaterialSlot(materialSlots[materialSlots.length - 1].id)} variant="danger" size="sm" className="flex-1">
                        Xóa Ô Cuối
                    </Button>
                }
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-1 flex flex-col gap-4">
            <MaterialInventoryListUI
                inventory={knowledgeBase.inventory}
                onDragStartItem={handleDragStartFromInventory}
            />
            <Button
                variant="primary"
                size="lg"
                onClick={handleCraft}
                isLoading={isCrafting}
                loadingText={VIETNAMESE.craftingInProgress}
                disabled={isCrafting || !desiredCategory || materialSlots.every(s => s.itemId === null)}
                className="w-full mt-auto"
            >
                {VIETNAMESE.craftItemButton}
            </Button>
        </div>
      </div>
    </div>
    {isMaterialModalOpen && (
        <MaterialSelectionModal
            isOpen={isMaterialModalOpen}
            onClose={() => {
                setIsMaterialModalOpen(false);
                setActiveSlotIdForSelection(null);
            }}
            inventory={knowledgeBase.inventory}
            onSelectMaterial={handleSelectMaterialFromModal}
        />
    )}
    </>
  );
};
