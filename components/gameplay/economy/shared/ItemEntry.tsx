
import React from 'react';
import { Item as ItemType } from '../../../../types';
import Button from '../../../ui/Button';

interface ItemEntryProps {
  item: ItemType;
  price: number;
  currencyName: string;
  actionLabel: string;
  onAction: (item: ItemType, price: number) => void;
  onItemClick: (item: ItemType) => void; // For showing details
  disabled?: boolean;
}

const ItemEntry: React.FC<ItemEntryProps> = ({ item, price, currencyName, actionLabel, onAction, onItemClick, disabled = false }) => {
  return (
    <div className="flex items-center justify-between p-2 bg-gray-700/50 rounded-lg hover:bg-gray-700/80 transition-colors duration-150">
      <div 
        className="flex-grow cursor-pointer"
        onClick={() => onItemClick(item)}
        title={`Xem chi tiết ${item.name}`}
      >
        <p className="font-semibold text-indigo-300">{item.name} (x{item.quantity})</p>
        <p className="text-xs text-gray-400">{item.rarity}</p>
      </div>
      <div className="flex items-center space-x-3 flex-shrink-0">
        <p className="text-sm font-semibold text-amber-400">{price.toLocaleString()} {currencyName}</p>
        <Button 
            size="sm" 
            variant="primary" 
            onClick={() => onAction(item, price)} 
            className="text-xs"
            disabled={disabled}
        >
          {actionLabel}
        </Button>
      </div>
    </div>
  );
};

export default ItemEntry;
