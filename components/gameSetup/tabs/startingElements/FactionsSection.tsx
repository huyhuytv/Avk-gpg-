
import React from 'react';
import { StartingFaction } from '../../../../types';
import * as GameTemplates from '../../../../templates';
import { VIETNAMESE, ALL_FACTION_ALIGNMENTS } from '../../../../constants';
import InputField from '../../../ui/InputField';
import Button from '../../../ui/Button';

interface FactionsSectionProps {
  startingFactions: StartingFaction[];
  handleStartingFactionChange: (index: number, field: keyof StartingFaction, value: string | number) => void;
  addStartingFaction: () => void;
  removeStartingFaction: (index: number) => void;
}

const FactionsSection: React.FC<FactionsSectionProps> = ({ startingFactions, handleStartingFactionChange, addStartingFaction, removeStartingFaction }) => {
  return (
    <>
      {(startingFactions || []).map((faction, index) => (
        <div key={index} className="space-y-2 border-b border-gray-800 py-3">
          <InputField label={`${VIETNAMESE.factionNameLabel} ${index + 1}`} id={`factionName-${index}`} value={faction.name} onChange={(e) => handleStartingFactionChange(index, 'name', e.target.value)} />
          <InputField label={VIETNAMESE.factionDescriptionLabel} id={`factionDesc-${index}`} value={faction.description} onChange={(e) => handleStartingFactionChange(index, 'description', e.target.value)} textarea rows={2}/>
          <InputField label={VIETNAMESE.factionAlignmentLabel} id={`factionAlign-${index}`} type="select" options={ALL_FACTION_ALIGNMENTS} value={faction.alignment} onChange={(e) => handleStartingFactionChange(index, 'alignment', e.target.value as GameTemplates.FactionAlignmentValues)} />
          <InputField label={VIETNAMESE.factionReputationLabel} id={`factionRep-${index}`} type="number" value={faction.initialPlayerReputation} onChange={(e) => handleStartingFactionChange(index, 'initialPlayerReputation', parseInt(e.target.value, 10))} min={-100} max={100} />
          <div className="text-right mt-2">
            <Button variant="danger" size="sm" onClick={() => removeStartingFaction(index)}>{VIETNAMESE.removeFaction}</Button>
          </div>
        </div>
      ))}
      <Button onClick={addStartingFaction} variant="secondary" size="sm" className="mt-3">{VIETNAMESE.addStartingFaction}</Button>
    </>
  );
};

export default FactionsSection;
