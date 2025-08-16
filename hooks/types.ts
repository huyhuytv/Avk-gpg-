
import { Item, Skill, Quest, NPC, GameLocation, WorldLoreEntry, Faction, Companion, YeuThu as YeuThuTemplate, Wife, Slave, Prisoner } from '../types';

export type GameEntity = Item | Skill | Quest | NPC | GameLocation | WorldLoreEntry | Faction | Companion | YeuThuTemplate | Wife | Slave | Prisoner;
export type GameEntityType = 'item' | 'skill' | 'quest' | 'npc' | 'location' | 'lore' | 'faction' | 'companion' | 'yeuThu' | 'wife' | 'slave' | 'prisoner';
