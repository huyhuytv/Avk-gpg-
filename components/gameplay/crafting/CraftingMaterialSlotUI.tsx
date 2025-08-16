
import React from 'react';
import { Item as ItemType } from '../../../types';
import { VIETNAMESE } from '../../../constants';
import Button from '../../ui/Button';

interface CraftingMaterialSlotUIProps {
  slotId: string; // Unique ID for this slot instance
  material: ItemType | null;
  onDropMaterial: (slotId: string, itemId: string) => void;
  onRemoveMaterial: (slotId: string) => void;
  isDraggingOver: boolean;
  onDragEnterSlot: (slotId: string) => void;
  onDragLeaveSlot: () => void;
  onClick: (slotId: string) => void; // New prop for click interaction
}

const CraftingMaterialSlotUI: React.FC<CraftingMaterialSlotUIProps> = ({
  slotId,
  material,
  onDropMaterial,
  onRemoveMaterial,
  isDraggingOver,
  onDragEnterSlot,
  onDragLeaveSlot,
  onClick,
}) => {
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const itemId = event.dataTransfer.getData('application/json-item-id');
    const itemCategory = event.dataTransfer.getData('application/json-item-category');
    if (itemId && itemCategory === 'Material') {
      onDropMaterial(slotId, itemId);
    }
    onDragLeaveSlot();
  };

  return (
    <div
      className={`w-full h-20 border-2 rounded-lg flex items-center justify-center p-2 text-center relative transition-all cursor-pointer
                  ${isDraggingOver ? 'border-green-500 bg-green-700/30 ring-2 ring-green-400' : 'border-gray-600 bg-gray-700/50 hover:border-indigo-500'}`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnter={() => onDragEnterSlot(slotId)}
      onDragLeave={onDragLeaveSlot}
      onClick={() => onClick(slotId)}
      aria-label={material ? `Nguyên liệu: ${material.name}` : VIETNAMESE.dropMaterialHere}
    >
      {material ? (
        <div className="flex flex-col items-center w-full">
          <span className="text-xs font-semibold text-indigo-300 truncate w-full px-1">{material.name}</span>
          <span className="text-[10px] text-gray-400 truncate w-full px-1">({material.rarity})</span>
          <Button
            variant="danger"
            size="sm"
            onClick={(e) => {
                e.stopPropagation(); // Prevent the main div's onClick from firing
                onRemoveMaterial(slotId);
            }}
            className="!p-1 !text-[10px] absolute top-0.5 right-0.5 leading-none rounded-full"
            title={`${VIETNAMESE.removeMaterialButton} ${material.name}`}
          >
            &#x2715;
          </Button>
        </div>
      ) : (
        <span className="text-xs text-gray-500 italic">{VIETNAMESE.dropMaterialHere}</span>
      )}
    </div>
  );
};

export default CraftingMaterialSlotUI;
