import React from 'react';
import { KnowledgeBase, NPC, GameLocation, WorldLoreEntry, Faction, Companion, YeuThu } from '../../types';
import { VIETNAMESE, MALE_AVATAR_PLACEHOLDER_URL, FEMALE_AVATAR_BASE_URL, MAX_FEMALE_AVATAR_INDEX } from '../../constants';
import WorldInfoList from '../ui/WorldInfoList';
import { getDeterministicAvatarSrc } from '../../utils/avatarUtils';

interface WorldSidePanelProps {
  knowledgeBase: KnowledgeBase;
  onNpcClick: (npc: NPC) => void;
  onYeuThuClick: (yeuThu: YeuThu) => void; // New
  onLocationClick: (location: GameLocation) => void;
  onLoreClick: (lore: WorldLoreEntry) => void;
  onFactionClick: (faction: Faction) => void; 
  onCompanionClick: (companion: Companion) => void;
}

const WorldSidePanel: React.FC<WorldSidePanelProps> = ({
  knowledgeBase,
  onNpcClick,
  onYeuThuClick, // New
  onLocationClick,
  onLoreClick,
  onFactionClick, 
  onCompanionClick,
}) => {
  return (
    <div className="flex flex-col h-full space-y-3 sm:space-y-4">
        <div>
            <h4 className="text-md sm:text-lg font-semibold text-indigo-300 mb-1 sm:mb-2 border-b border-gray-700 pb-1">{VIETNAMESE.discoveredNPCsSection}</h4>
            <WorldInfoList
                items={knowledgeBase.discoveredNPCs}
                onItemClick={onNpcClick}
                emptyMessage={VIETNAMESE.noNPCsDiscovered}
                getItemDisplay={(npc: NPC) => (
                    <div className="flex items-center w-full">
                        <img 
                            src={getDeterministicAvatarSrc(npc)} 
                            alt={npc.name} 
                            className="w-8 h-8 rounded-full mr-2 object-cover flex-shrink-0 border border-gray-600" 
                        />
                        <span className="truncate">
                            {npc.name}
                            {npc.race && npc.race !== 'Nhân Tộc' ? ` (${npc.race})` : ''}
                            {npc.title ? ` - ${npc.title}` : ''}
                            {npc.realm ? ` [${npc.realm}]` : ''}
                        </span>
                    </div>
                )}
                getItemTitleString={(npc: NPC) => `${npc.name}${npc.race && npc.race !== 'Nhân Tộc' ? ` (${npc.race})` : ''}${npc.title ? ` - ${npc.title}` : ''}${npc.realm ? ` [${npc.realm}]` : ''}`}
            />
        </div>
        <div>
            <h4 className="text-md sm:text-lg font-semibold text-indigo-300 mb-1 sm:mb-2 border-b border-gray-700 pb-1">Yêu Thú Đã Gặp</h4>
            <WorldInfoList
                items={knowledgeBase.discoveredYeuThu}
                onItemClick={onYeuThuClick}
                emptyMessage={"Chưa gặp yêu thú nào."}
                getItemDisplay={(yt: YeuThu) => (
                     <div className="flex items-center w-full">
                        <img 
                            src={getDeterministicAvatarSrc(yt)} 
                            alt={yt.name} 
                            className="w-8 h-8 rounded-full mr-2 object-cover flex-shrink-0 border border-gray-600" 
                        />
                        <span className="truncate">
                            {yt.name} ({yt.species}) {yt.realm ? `[${yt.realm}]` : ''}
                        </span>
                    </div>
                )}
                getItemTitleString={(yt: YeuThu) => `${yt.name} (${yt.species}) ${yt.realm ? `[${yt.realm}]` : ''}`}
            />
        </div>
        <div>
            <h4 className="text-md sm:text-lg font-semibold text-indigo-300 mb-1 sm:mb-2 border-b border-gray-700 pb-1">{VIETNAMESE.companionsSection}</h4>
            <WorldInfoList
                items={knowledgeBase.companions}
                onItemClick={onCompanionClick}
                emptyMessage={VIETNAMESE.noCompanions}
                getItemDisplay={(comp: Companion) => `${comp.name} (HP: ${comp.hp}/${comp.maxHp})`}
                getItemTitleString={(comp: Companion) => `${comp.name}`}
            />
        </div>
        <div>
            <h4 className="text-md sm:text-lg font-semibold text-indigo-300 mb-1 sm:mb-2 border-b border-gray-700 pb-1">{VIETNAMESE.discoveredLocationsSection}</h4>
            <WorldInfoList
                items={knowledgeBase.discoveredLocations}
                onItemClick={onLocationClick}
                emptyMessage={VIETNAMESE.noLocationsDiscovered}
                getItemDisplay={(loc: GameLocation) => `${loc.name}${loc.regionId ? ` (${loc.regionId})` : ''}`}
                getItemTitleString={(loc: GameLocation) => `${loc.name}${loc.regionId ? ` (${loc.regionId})` : ''}`}
            />
        </div>
         <div>
            <h4 className="text-md sm:text-lg font-semibold text-indigo-300 mb-1 sm:mb-2 border-b border-gray-700 pb-1">Phe Phái Đã Biết</h4>
            <WorldInfoList
                items={knowledgeBase.discoveredFactions}
                onItemClick={onFactionClick}
                emptyMessage={"Chưa khám phá phe phái nào."}
                getItemDisplay={(faction: Faction) => `${faction.name} (${faction.alignment}, Uy tín: ${faction.playerReputation})`}
                getItemTitleString={(faction: Faction) => `${faction.name} (${faction.alignment}, Uy tín: ${faction.playerReputation})`}
            />
        </div>
        <div>
            <h4 className="text-md sm:text-lg font-semibold text-indigo-300 mb-1 sm:mb-2 border-b border-gray-700 pb-1">{VIETNAMESE.worldLoreSection}</h4>
            <WorldInfoList
                items={knowledgeBase.worldLore}
                onItemClick={onLoreClick}
                emptyMessage={VIETNAMESE.noWorldLore}
                getItemDisplay={(lore: WorldLoreEntry) => lore.title}
                getItemTitleString={(lore: WorldLoreEntry) => lore.title}
            />
        </div>
    </div>
  );
};

export default WorldSidePanel;