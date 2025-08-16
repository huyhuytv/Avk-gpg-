

import React from 'react';
import { WorldSettings, StartingNPC, StartingLore, StartingLocation, StartingFaction, StartingYeuThu } from './../../../types';
import * as GameTemplates from './../../../templates';

// Import the new section components
import CollapsibleSection from '../../ui/CollapsibleSection';
import SkillsSection from './startingElements/SkillsSection';
import ItemsSection from './startingElements/ItemsSection';
import NpcsSection from './startingElements/NpcsSection';
import YeuThuSection from './startingElements/YeuThuSection'; // New
import LoreSection from './startingElements/LoreSection';
import LocationsSection from './startingElements/LocationsSection';
import FactionsSection from './startingElements/FactionsSection';
import { VIETNAMESE } from './../../../constants';

interface StartingElementsTabProps {
  settings: WorldSettings;
  isSkillsSectionOpen: boolean;
  setIsSkillsSectionOpen: (isOpen: boolean) => void;
  handleStartingSkillChange: (index: number, field: string, value: any) => void;
  addStartingSkill: (type: GameTemplates.SkillTypeValues) => void;
  removeStartingSkill: (index: number) => void;
  isItemsSectionOpen: boolean;
  setIsItemsSectionOpen: (isOpen: boolean) => void;
  handleStartingItemChange: (index: number, field: any, value: any) => void;
  addStartingItem: () => void;
  removeStartingItem: (index: number) => void;
  isNpcsSectionOpen: boolean;
  setIsNpcsSectionOpen: (isOpen: boolean) => void;
  handleStartingNPCChange: (index: number, field: keyof StartingNPC, value: string | number | undefined) => void;
  addStartingNPC: () => void;
  removeStartingNPC: (index: number) => void;
  isYeuThuSectionOpen: boolean; // New
  setIsYeuThuSectionOpen: (isOpen: boolean) => void; // New
  handleStartingYeuThuChange: (index: number, field: keyof StartingYeuThu, value: string | boolean) => void; // New
  addStartingYeuThu: () => void; // New
  removeStartingYeuThu: (index: number) => void; // New
  isLoreSectionOpen: boolean;
  setIsLoreSectionOpen: (isOpen: boolean) => void;
  handleStartingLoreChange: (index: number, field: keyof StartingLore, value: string) => void;
  addStartingLore: () => void;
  removeStartingLore: (index: number) => void;
  isLocationsSectionOpen: boolean;
  setIsLocationsSectionOpen: (isOpen: boolean) => void;
  handleStartingLocationChange: (index: number, field: keyof StartingLocation, value: string | boolean) => void;
  addStartingLocation: () => void;
  removeStartingLocation: (index: number) => void;
  isFactionsSectionOpen: boolean;
  setIsFactionsSectionOpen: (isOpen: boolean) => void;
  handleStartingFactionChange: (index: number, field: keyof StartingFaction, value: string | number) => void;
  addStartingFaction: () => void;
  removeStartingFaction: (index: number) => void;
}

const StartingElementsTab: React.FC<StartingElementsTabProps> = ({
  settings,
  isSkillsSectionOpen, setIsSkillsSectionOpen, handleStartingSkillChange, addStartingSkill, removeStartingSkill,
  isItemsSectionOpen, setIsItemsSectionOpen, handleStartingItemChange, addStartingItem, removeStartingItem,
  isNpcsSectionOpen, setIsNpcsSectionOpen, handleStartingNPCChange, addStartingNPC, removeStartingNPC,
  isYeuThuSectionOpen, setIsYeuThuSectionOpen, handleStartingYeuThuChange, addStartingYeuThu, removeStartingYeuThu,
  isLoreSectionOpen, setIsLoreSectionOpen, handleStartingLoreChange, addStartingLore, removeStartingLore,
  isLocationsSectionOpen, setIsLocationsSectionOpen, handleStartingLocationChange, addStartingLocation, removeStartingLocation,
  isFactionsSectionOpen, setIsFactionsSectionOpen, handleStartingFactionChange, addStartingFaction, removeStartingFaction
}) => {
  return (
    <div className="space-y-2">
      <CollapsibleSection
        title={VIETNAMESE.startingSkillsSection}
        isOpen={isSkillsSectionOpen}
        onToggle={() => setIsSkillsSectionOpen(!isSkillsSectionOpen)}
        itemCount={(settings.startingSkills || []).length}
      >
        <SkillsSection 
          settings={settings}
          handleStartingSkillChange={handleStartingSkillChange}
          addStartingSkill={addStartingSkill}
          removeStartingSkill={removeStartingSkill}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title={VIETNAMESE.startingItemsSection}
        isOpen={isItemsSectionOpen}
        onToggle={() => setIsItemsSectionOpen(!isItemsSectionOpen)}
        itemCount={(settings.startingItems || []).length}
      >
        <ItemsSection 
          settings={settings}
          handleStartingItemChange={handleStartingItemChange}
          addStartingItem={addStartingItem}
          removeStartingItem={removeStartingItem}
        />
      </CollapsibleSection>
      
      <CollapsibleSection
        title={VIETNAMESE.startingNPCsSection}
        isOpen={isNpcsSectionOpen}
        onToggle={() => setIsNpcsSectionOpen(!isNpcsSectionOpen)}
        itemCount={(settings.startingNPCs || []).length}
      >
        <NpcsSection 
          settings={settings}
          handleStartingNPCChange={handleStartingNPCChange}
          addStartingNPC={addStartingNPC}
          removeStartingNPC={removeStartingNPC}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title={"Yêu Thú Khởi Đầu"}
        isOpen={isYeuThuSectionOpen}
        onToggle={() => setIsYeuThuSectionOpen(!isYeuThuSectionOpen)}
        itemCount={(settings.startingYeuThu || []).length}
      >
        <YeuThuSection 
          settings={settings}
          handleStartingYeuThuChange={handleStartingYeuThuChange}
          addStartingYeuThu={addStartingYeuThu}
          removeStartingYeuThu={removeStartingYeuThu}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title={VIETNAMESE.startingLoreSection}
        isOpen={isLoreSectionOpen}
        onToggle={() => setIsLoreSectionOpen(!isLoreSectionOpen)}
        itemCount={(settings.startingLore || []).length}
      >
        <LoreSection
          startingLore={settings.startingLore}
          handleStartingLoreChange={handleStartingLoreChange}
          addStartingLore={addStartingLore}
          removeStartingLore={removeStartingLore}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title={VIETNAMESE.startingLocationsSection}
        isOpen={isLocationsSectionOpen}
        onToggle={() => setIsLocationsSectionOpen(!isLocationsSectionOpen)}
        itemCount={(settings.startingLocations || []).length}
      >
        <LocationsSection
          startingLocations={settings.startingLocations}
          handleStartingLocationChange={handleStartingLocationChange}
          addStartingLocation={addStartingLocation}
          removeStartingLocation={removeStartingLocation}
        />
      </CollapsibleSection>
      
      <CollapsibleSection
        title={VIETNAMESE.startingFactionsSection}
        isOpen={isFactionsSectionOpen}
        onToggle={() => setIsFactionsSectionOpen(!isFactionsSectionOpen)}
        itemCount={(settings.startingFactions || []).length}
      >
        <FactionsSection
          startingFactions={settings.startingFactions}
          handleStartingFactionChange={handleStartingFactionChange}
          addStartingFaction={addStartingFaction}
          removeStartingFaction={removeStartingFaction}
        />
      </CollapsibleSection>
    </div>
  );
};

export default StartingElementsTab;