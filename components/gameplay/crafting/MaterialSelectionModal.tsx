
import React, { useState, useMemo } from 'react';
import { Item as ItemType } from './../../../types';
import Modal from './../../ui/Modal';
import InputField from './../../ui/InputField';
import * as GameTemplates from './../../../templates';
import { VIETNAMESE } from '../../../../constants';

interface MaterialSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: ItemType[];
  onSelectMaterial: (itemId: string) => void;
}

const MaterialSelectionModal: React.FC<MaterialSelectionModalProps> = ({ isOpen, onClose, inventory, onSelectMaterial }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const availableMaterials = useMemo(() => {
    return inventory
      .filter(item => item.category === GameTemplates.ItemCategory.MATERIAL)
      .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [inventory, searchTerm]);

  const handleSelect = (itemId: string) => {
    onSelectMaterial(itemId);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chọn Nguyên Liệu">
      <div className="flex flex-col h-[60vh]">
        <div className="mb-3 flex-shrink-0">
          <InputField
            label=""
            id="material-search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm nguyên liệu..."
            className="!mb-0"
          />
        </div>
        <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 -mr-2">
          {availableMaterials.length > 0 ? (
            <ul className="space-y-2">
              {availableMaterials.map(item => (
                <li key={item.id}>
                  <button
                    onClick={() => handleSelect(item.id)}
                    className="w-full text-left p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors flex justify-between items-center"
                  >
                    <div>
                      <p className="font-semibold text-indigo-300">{item.name} (x{item.quantity})</p>
                      <p className="text-xs text-gray-400">{item.rarity} - {item.itemRealm}</p>
                    </div>
                    <span className="text-xs px-2 py-1 bg-indigo-600 rounded-full">Chọn</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-gray-400 italic">Không tìm thấy nguyên liệu phù hợp.</p>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default MaterialSelectionModal;
