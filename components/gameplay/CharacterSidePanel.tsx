
import React, { useMemo } from 'react';
import { KnowledgeBase, Item, Skill } from '../../types'; 
import PlayerStatsWithEquipment from './equipment/PlayerStatsWithEquipment'; 
import InventoryPanel from './InventoryPanel';
import * as GameTemplates from '../../templates';
import MasterPanel from './MasterPanel';

interface CharacterSidePanelProps {
  knowledgeBase: KnowledgeBase;
  onItemClick: (item: Item) => void;
  onSkillClick: (skill: Skill) => void;
  onPlayerAvatarUploadRequest: (base64Data: string) => void;
  isUploadingPlayerAvatar: boolean;
}

const SkillList: React.FC<{ title: string; skills: Skill[]; onSkillClick: (skill: Skill) => void }> = React.memo(({ title, skills, onSkillClick }) => {
    if (skills.length === 0) return null;
    return (
        <div className="bg-gray-800 p-3 sm:p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-indigo-400 mb-3 border-b border-gray-700 pb-2">{title}</h3>
            <ul className="space-y-1 max-h-48 sm:max-h-60 overflow-y-auto custom-scrollbar">
                {skills.map(skill => (
                    <li
                        key={skill.id}
                        className="text-sm text-gray-300 hover:bg-gray-700 p-2 rounded cursor-pointer transition-colors"
                        onClick={() => onSkillClick(skill)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && onSkillClick(skill)}
                        aria-label={`Details for ${skill.name}`}
                        title={skill.name}
                    >
                        <span className="truncate block">
                            <strong className="text-indigo-300">{skill.name}</strong>
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
});


const CharacterSidePanel: React.FC<CharacterSidePanelProps> = React.memo(({
  knowledgeBase,
  onItemClick,
  onSkillClick,
  onPlayerAvatarUploadRequest,
  isUploadingPlayerAvatar,
}) => {
  const currentLocation = knowledgeBase.discoveredLocations.find(l => l.id === knowledgeBase.currentLocationId);
  const isPlayerRestricted = !!knowledgeBase.playerStats.playerSpecialStatus;
  const master = knowledgeBase.master;
  
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
      // Show only items that are not equipped by anyone
      return knowledgeBase.inventory.filter(item => !allEquippedItemIds.has(item.id));
  }, [knowledgeBase.inventory, allEquippedItemIds]);

  const congPhapSkills = knowledgeBase.playerSkills.filter(s => s.skillType === GameTemplates.SkillType.CONG_PHAP_TU_LUYEN);
  const linhKiSkills = knowledgeBase.playerSkills.filter(s => s.skillType === GameTemplates.SkillType.LINH_KI);
  const ngheNghiepSkills = knowledgeBase.playerSkills.filter(s => s.skillType === GameTemplates.SkillType.NGHE_NGHIEP);
  const thanThongSkills = knowledgeBase.playerSkills.filter(s => s.skillType === GameTemplates.SkillType.THAN_THONG);
  const camThuatSkills = knowledgeBase.playerSkills.filter(s => s.skillType === GameTemplates.SkillType.CAM_THUAT);
  const otherSkills = knowledgeBase.playerSkills.filter(s => 
    s.skillType !== GameTemplates.SkillType.CONG_PHAP_TU_LUYEN &&
    s.skillType !== GameTemplates.SkillType.LINH_KI &&
    s.skillType !== GameTemplates.SkillType.NGHE_NGHIEP &&
    s.skillType !== GameTemplates.SkillType.THAN_THONG &&
    s.skillType !== GameTemplates.SkillType.CAM_THUAT
  );

  return (
    <div className="flex flex-col h-full space-y-4"> 
      {isPlayerRestricted && master && <MasterPanel master={master} />}
      {knowledgeBase.playerStats && (
        <PlayerStatsWithEquipment 
          personId={'player'}
          playerStats={knowledgeBase.playerStats}
          equippedItems={knowledgeBase.equippedItems}
          inventory={knowledgeBase.inventory}
          currencyName={knowledgeBase.worldConfig?.currencyName}
          playerName={knowledgeBase.worldConfig?.playerName}
          playerGender={knowledgeBase.worldConfig?.playerGender}
          playerRace={knowledgeBase.worldConfig?.playerRace}
          playerAvatarUrl={knowledgeBase.worldConfig?.playerAvatarUrl} 
          playerAvatarData={knowledgeBase.playerAvatarData} 
          worldConfig={knowledgeBase.worldConfig} 
          worldDate={knowledgeBase.worldDate}
          isPlayerContext={true}
          onPlayerAvatarUploadRequest={onPlayerAvatarUploadRequest}
          isUploadingPlayerAvatar={isUploadingPlayerAvatar}
          currentLocationName={currentLocation?.name}
        />
      )}
      <InventoryPanel items={displayableInventory} onItemClick={onItemClick} />
      
      <SkillList title="Công Pháp Tu Luyện" skills={congPhapSkills} onSkillClick={onSkillClick} />
      <SkillList title="Linh Kĩ" skills={linhKiSkills} onSkillClick={onSkillClick} />
      <SkillList title="Thần Thông" skills={thanThongSkills} onSkillClick={onSkillClick} />
      <SkillList title="Cấm Thuật" skills={camThuatSkills} onSkillClick={onSkillClick} />
      <SkillList title="Kỹ Năng Nghề Nghiệp" skills={ngheNghiepSkills} onSkillClick={onSkillClick} />
      <SkillList title="Kỹ Năng Khác" skills={otherSkills} onSkillClick={onSkillClick} />

    </div>
  );
});

export default CharacterSidePanel;