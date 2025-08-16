import { KnowledgeBase, AIContextConfig } from '../types';
import { DEFAULT_PLAYER_STATS } from './character';
import { MAX_AUTO_SAVE_SLOTS } from './game';

export const INITIAL_KNOWLEDGE_BASE: KnowledgeBase = {
  playerStats: { ...DEFAULT_PLAYER_STATS },
  inventory: [],
  equippedItems: {
    mainWeapon: null,
    offHandWeapon: null,
    head: null,
    body: null,
    hands: null,
    legs: null,
    artifact: null,
    pet: null,
    accessory1: null,
    accessory2: null,
  },
  playerSkills: [],
  allQuests: [],
  discoveredNPCs: [],
  discoveredYeuThu: [], // New
  discoveredLocations: [],
  discoveredFactions: [],
  realmProgressionList: [],
  currentRealmBaseStats: {},
  worldConfig: null,
  companions: [],
  worldLore: [],
  worldDate: { day: 1, month: 1, year: 1, hour: 8, minute: 0 }, 
  pageSummaries: {},
  currentPageHistory: [1],
  lastSummarizedTurn: 0,
  turnHistory: [],
  autoSaveTurnCounter: 0,
  currentAutoSaveSlotIndex: 0,
  autoSaveSlotIds: Array(MAX_AUTO_SAVE_SLOTS).fill(null),
  manualSaveId: null,
  manualSaveName: null,
  playerAvatarData: undefined,
  discoveredRegions: [],
  currentLocationId: undefined,
  auctionState: null,
  slaveAuctionState: null, // New
  pendingCombat: null,
  postCombatState: null, // NEW
  userPrompts: [], // NEW
  // New Entities
  prisoners: [],
  wives: [],
  slaves: [],
  master: null,
  gameEvents: [], // NEW: For event system
  ragVectorStore: { vectors: [], metadata: [] }, // UPDATED: Use metadata instead of texts
  aiContextConfig: {} as AIContextConfig, // NEW: Initialize to satisfy type, will be populated on new/load game.
};