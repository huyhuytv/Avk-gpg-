
import React from 'react';
import { StartingLore } from '../../../../types';
import { VIETNAMESE } from '../../../../constants';
import InputField from '../../../ui/InputField';
import Button from '../../../ui/Button';

interface LoreSectionProps {
  startingLore: StartingLore[];
  handleStartingLoreChange: (index: number, field: keyof StartingLore, value: string) => void;
  addStartingLore: () => void;
  removeStartingLore: (index: number) => void;
}

const LoreSection: React.FC<LoreSectionProps> = ({ startingLore, handleStartingLoreChange, addStartingLore, removeStartingLore }) => {
  return (
    <>
      {(startingLore || []).map((lore, index) => (
        <div key={index} className="space-y-2 border-b border-gray-800 py-3">
          <InputField label={`${VIETNAMESE.loreTitleLabel} ${index + 1}`} id={`loreTitle-${index}`} value={lore.title} onChange={(e) => handleStartingLoreChange(index, 'title', e.target.value)} />
          <InputField label={VIETNAMESE.loreContentLabel} id={`loreContent-${index}`} value={lore.content} onChange={(e) => handleStartingLoreChange(index, 'content', e.target.value)} textarea rows={3} />
          <div className="text-right mt-2">
            <Button variant="danger" size="sm" onClick={() => removeStartingLore(index)}>{VIETNAMESE.removeLore}</Button>
          </div>
        </div>
      ))}
      <Button onClick={addStartingLore} variant="secondary" size="sm" className="mt-3">{VIETNAMESE.addStartingLore}</Button>
    </>
  );
};

export default LoreSection;
