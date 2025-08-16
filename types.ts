import { HarmCategory, HarmBlockThreshold } from "@google/genai";
import * as GameTemplates from './templates'; // Import all templates
import { Operation as JsonPatchOperation } from 'fast-json-patch'; // Import Operation from fast-json-patch

// Re-export necessary types from GameTemplates
export type EquipmentTypeValues = GameTemplates.EquipmentTypeValues;
export type EconomyLocationTypeValues = GameTemplates.EconomyLocationTypeValues;
export type AnyLocationType = GameTemplates.AnyLocationType;
export type ItemCategoryValues = GameTemplates.ItemCategoryValues;
export type ProfessionType = GameTemplates.ProfessionType; // New
export type CongPhapType = GameTemplates.CongPhapType; // New
export type SkillTypeValues = GameTemplates.SkillTypeValues; // New
export type CongPhapGrade = GameTemplates.CongPhapGrade;
export type LinhKiCategory = GameTemplates.LinhKiCategory;
export type LinhKiActivationType = GameTemplates.LinhKiActivationType;
export type ProfessionGrade = GameTemplates.ProfessionGrade;
export type EquipmentRarity = GameTemplates.EquipmentRarity;

// Define genre values here to break circular dependency with constants.ts
export const GENRE_VALUES_FOR_TYPE = [
  "Tu Tiên (Mặc định)", "Võ Hiệp", "Tiên Hiệp", "Huyền Huyễn", "Cung Đấu", "Linh Dị", "Khoa Huyễn", "Tây Phương Fantasy", "Ngôn Tình", "Đô Thị", "Mạt Thế", "Võng Du", "Thể Thao", "Kinh Dị", "Khác (Tự định nghĩa)"
] as const;
export type GenreType = typeof GENRE_VALUES_FOR_TYPE[number];
export type CustomGenreType = "Khác (Tự định nghĩa)";

export const TU_CHAT_TIERS = ["Phế Phẩm", "Hạ Đẳng", "Trung Đẳng", "Thượng Đẳng", "Cực Phẩm", "Tiên Phẩm", "Thần Phẩm"] as const;
export type TuChatTier = typeof TU_CHAT_TIERS[number];

export const PROFICIENCY_TIERS = ["Sơ Nhập", "Tiểu Thành", "Đại Thành", "Viên Mãn", "Xuất Thần Nhập Hóa"] as const;
export type ProficiencyTier = typeof PROFICIENCY_TIERS[number];

export enum GameScreen {
  Initial = 'Initial', GameSetup = 'GameSetup', Gameplay = 'Gameplay', Combat = 'Combat', ApiSettings = 'ApiSettings',
  LoadGameSelection = 'LoadGameSelection', StorageSettings = 'StorageSettings', ImportExport = 'ImportExport', Equipment = 'Equipment', 
  Crafting = 'Crafting', Map = 'Map', Auction = 'Auction', Cultivation = 'Cultivation',
  // New Screens for Companions and Prisoners
  CompanionManagement = 'CompanionManagement',
  PrisonerManagement = 'PrisonerManagement',
  CompanionEquipment = 'CompanionEquipment',
  // New Screen for Slave Auction
  SlaveAuction = 'SlaveAuction',
  Prompts = 'Prompts', // NEW
  Events = 'Events', // NEW: Event Screen
}

// NEW: For AI Context Settings screen
export interface AIContextConfig {
    // Context
    sendRagContext: boolean;
    sendCoreContext: boolean;
    sendConversationalContext: boolean;
    // Guidance
    sendWritingStyle: boolean;
    sendUserPrompts: boolean;
    sendEventGuidance: boolean;
    sendDifficultyGuidance: boolean;
    sendNsfwGuidance: boolean;
    // Rules
    sendFormattingRules: boolean; // NEW: Replaces part of core narration
    sendShowDontTellRule: boolean; // NEW: Part of core narration
    sendLivingWorldRule: boolean; // NEW: Part of core narration
    sendProactiveNpcRule: boolean; // NEW: Part of core narration
    sendRumorMillRule: boolean; // NEW: Part of core narration
    sendWorldProgressionRules: boolean;
    sendTimeRules: boolean;
    sendStatRules: boolean;
    sendItemRules: boolean;
    sendSkillRules: boolean;
    sendQuestRules: boolean;
    sendCreationRules: boolean;
    sendUpdateRules: boolean;
    sendDeletionRules: boolean;
    sendSpecialStatusRules: boolean;
    sendChoiceRules: boolean;
    sendTurnRules: boolean;
    // New rules from inspection
    sendStatusEffectRules: boolean;
    sendCombatStartRules: boolean;
    sendSpecialEventRules: boolean;
    sendSimpleCompanionRules: boolean;
}

export type StorageType = 'local';

export interface StorageSettings {
  storageType: StorageType;
}

export type StatusEffectType = 'buff' | 'debuff' | 'neutral';

export interface StatusEffect {
  id: string; name: string; description: string; type: StatusEffectType; durationTurns: number;
  statModifiers: Partial<Record<keyof Omit<PlayerStats, 'realm' | 'currency' | 'isInCombat' | 'turn' | 'hieuUngBinhCanh' | 'activeStatusEffects' | 'sinhLuc' | 'linhLuc' | 'kinhNghiem' | 'baseMaxKinhNghiem' | 'baseMaxLinhLuc' | 'baseMaxSinhLuc' | 'baseSucTanCong' | 'spiritualRoot' | 'specialPhysique' | 'professions' | 'tuChat' | 'playerSpecialStatus'>, string | number>>;
  specialEffects: string[]; icon?: string; source?: string;
}

export interface Profession {
  type: ProfessionType;
  level: number;
  exp: number;
  maxExp: number;
}

export interface PlayerSpecialStatus {
    type: 'prisoner' | 'slave';
    ownerName: string;
    willpower: number; // Mental fortitude
    resistance: number; // Hostility
    obedience: number; // Willingness to obey
    fear?: number; // Fear towards the owner
    trust?: number; // Trust in the owner;
}

export interface PlayerStats {
  baseMaxSinhLuc: number; baseMaxLinhLuc: number; baseSucTanCong: number; baseMaxKinhNghiem: number;
  sinhLuc: number; maxSinhLuc: number; linhLuc: number; maxLinhLuc: number; sucTanCong: number; kinhNghiem: number; maxKinhNghiem: number;
  realm: string; currency: number; isInCombat: boolean; turn: number; hieuUngBinhCanh: boolean;
  activeStatusEffects: StatusEffect[];
  spiritualRoot: string; // New: Linh Căn
  specialPhysique: string; // New: Thể Chất Đặc Biệt
  tuChat?: TuChatTier; // Aptitude
  professions: Profession[]; // New: Nghề Nghiệp
  thoNguyen: number; // New: Lifespan remaining
  maxThoNguyen: number; // New: Max lifespan
  playerSpecialStatus?: PlayerSpecialStatus | null; // NEW
}

export type Item = GameTemplates.InventoryItem;
export type Skill = GameTemplates.SkillTemplate;
export type NPC = GameTemplates.NPCTemplate;
export type YeuThu = GameTemplates.YeuThuTemplate; // New
export type Faction = GameTemplates.FactionTemplate;

export interface QuestObjective {
  id: string; text: string; completed: boolean;
}

export interface Quest {
  id: string; title: string; description: string; status: 'active' | 'completed' | 'failed'; objectives: QuestObjective[];
}

export interface Companion {
  id: string; name: string; description: string; hp: number; maxHp: number; mana: number; maxMana: number; atk: number;
}

// Base interface for all complex characters (NPCs, Prisoners, Wives, Slaves)
export interface PersonBase {
    id: string;
    name: string;
    title?: string;
    gender?: 'Nam' | 'Nữ' | 'Khác' | 'Không rõ';
    race?: string; // NEW
    description: string;
    affinity: number;
    avatarUrl?: string;
    realm?: string;
    tuChat?: TuChatTier;
    spiritualRoot?: string;
    specialPhysique?: string;
    stats?: Partial<PlayerStats>;
}

// Prisoner Entity
export interface Prisoner extends PersonBase {
    entityType: 'prisoner';
    willpower: number;      // 0-100: Mental fortitude
    resistance: number;     // 0-100: Hostility towards player
    obedience: number;      // 0-100: Willingness to obey
}

// Base for complex companions like Wives and Slaves
export interface ComplexCompanionBase extends PersonBase {
    willpower: number;      // 0-100
    obedience: number;      // 0-100
    skills: Skill[];
    equippedItems: Record<EquipmentSlotId, Item['id'] | null>;
    isBinhCanh?: boolean; // NEW
    binhCanhCounter?: number; // NEW
}

// Wife/Daolu Entity
export interface Wife extends ComplexCompanionBase {
    entityType: 'wife';
}

// Slave Entity
export interface Slave extends ComplexCompanionBase {
    entityType: 'slave';
    value?: number;
}


export interface WorldLoreEntry {
  id: string; title: string; content: string;
}

export interface StartingSkill {
  name: string;
  description: string;
  skillType?: SkillTypeValues;

  // Common combat properties for Linh Ki, Than Thong, Cam Thuat
  baseDamage?: number;
  baseHealing?: number;
  damageMultiplier?: number; // % of attack power, e.g., 0.5 for 50%
  healingMultiplier?: number; // % of attack power for healing
  manaCost?: number;
  cooldown?: number;
  specialEffects?: string; // Semicolon-separated string

  congPhapDetails?: {
      type?: CongPhapType;
      grade?: CongPhapGrade;
      weaponFocus?: string;
  };
  linhKiDetails?: {
      category?: LinhKiCategory;
      activation?: LinhKiActivationType;
  };
  professionDetails?: {
      type?: ProfessionType;
      grade?: ProfessionGrade;
      skillDescription?: string;
  };
  camThuatDetails?: { 
      sideEffects?: string;
  };
  thanThongDetails?: {
      // Future properties can go here
  };
}

export interface StartingItem {
  name: string; description: string; quantity: number; category: GameTemplates.ItemCategoryValues;
  rarity?: GameTemplates.EquipmentRarity; value?: number; itemRealm?: string; // NEW: Item Realm
  equipmentDetails?: { type?: GameTemplates.EquipmentTypeValues; slot?: string; statBonuses?: Partial<Omit<PlayerStats, 'realm' | 'currency' | 'isInCombat' | 'turn' | 'hieuUngBinhCanh' | 'baseMaxKinhNghiem' | 'baseMaxLinhLuc' | 'baseMaxSinhLuc' | 'baseSucTanCong' | 'activeStatusEffects'| 'spiritualRoot' | 'specialPhysique' | 'professions' | 'tuChat' | 'playerSpecialStatus'>>; statBonusesString?: string; uniqueEffects?: string[]; uniqueEffectsString?: string; };
  potionDetails?: { type?: GameTemplates.PotionTypeValues; effects?: string[]; effectsString?: string; durationTurns?: number; cooldownTurns?: number; };
  materialDetails?: { type?: GameTemplates.MaterialTypeValues; };
  questItemDetails?: { questIdAssociated?: string; };
  miscDetails?: { usable?: boolean; consumable?: boolean; };
  congPhapDetails?: { congPhapType?: GameTemplates.CongPhapType; expBonusPercentage?: number; }; // New
  linhKiDetails?: { skillToLearnJSON?: string; }; // New: JSON string of a SkillTemplate
  professionSkillBookDetails?: { professionToLearn?: ProfessionType; }; // New
  professionToolDetails?: { professionRequired?: ProfessionType; }; // New
  aiPreliminaryType?: string;
}

export interface StartingNPC {
  name: string; personality: string; initialAffinity: number; details: string; gender?: 'Nam' | 'Nữ' | 'Khác' | 'Không rõ';
  race?: string; // NEW
  realm?: string; avatarUrl?: string; tuChat?: TuChatTier; relationshipToPlayer?: string;
  spiritualRoot?: string; // New
  specialPhysique?: string; // New
  thoNguyen?: number;
  maxThoNguyen?: number;
}

export interface StartingYeuThu {
    name: string;
    species: string;
    description: string;
    realm?: string;
    isHostile: boolean;
}

export interface StartingLore { title: string; content: string; }
export interface StartingLocation { name: string; description: string; isSafeZone?: boolean; regionId?: string; mapX?: number; mapY?: number; locationType?: GameTemplates.LocationTypeValues; }
export interface StartingFaction { name: string; description: string; alignment: GameTemplates.FactionAlignmentValues; initialPlayerReputation: number; }

export type NsfwDescriptionStyle = 'Hoa Mỹ' | 'Trần Tục' | 'Gợi Cảm' | 'Mạnh Bạo (BDSM)';
export type ViolenceLevel = 'Nhẹ Nhàng' | 'Thực Tế' | 'Cực Đoan';
export type StoryTone = 'Tích Cực' | 'Trung Tính' | 'Đen Tối' | 'Dâm Dục' | 'Hoang Dâm' | 'Dâm Loạn';

export interface WorldDate {
  day: number;
  month: number;
  year: number;
  hour: number;
  minute: number;
}

// NEW: Interface for race-specific cultivation systems
export interface RaceCultivationSystem {
  id: string; // For React keys
  raceName: string;
  realmSystem: string; // e.g., "Luyện Khí - Trúc Cơ - ..."
}

export interface WorldSettings {
  saveGameName: string; theme: string; settingDescription: string; writingStyle: string; difficulty: 'Dễ' | 'Thường' | 'Khó' | 'Ác Mộng';
  currencyName: string; playerName: string; playerGender: 'Nam' | 'Nữ' | 'Khác'; playerRace: string; playerPersonality: string; playerBackstory: string;
  playerGoal: string; playerStartingTraits: string;
  playerSpiritualRoot?: string; // New
  playerSpecialPhysique?: string; // New
  playerThoNguyen?: number;
  playerMaxThoNguyen?: number;
  startingCurrency: number;
  startingSkills: StartingSkill[]; startingItems: StartingItem[]; startingNPCs: StartingNPC[]; startingLore: StartingLore[];
  startingYeuThu: StartingYeuThu[]; // New
  startingLocations: StartingLocation[]; startingFactions: StartingFaction[]; nsfwMode?: boolean; nsfwDescriptionStyle?: NsfwDescriptionStyle;
  violenceLevel?: ViolenceLevel; storyTone?: StoryTone; originalStorySummary?: string; genre: GenreType; customGenreName?: string;
  isCultivationEnabled: boolean;
  raceCultivationSystems: RaceCultivationSystem[]; // REPLACES heThongCanhGioi
  yeuThuRealmSystem: string; // NEW: Separate system for beasts
  canhGioiKhoiDau: string; startingDate: WorldDate; playerAvatarUrl?: string;
  writingStyleGuide?: string; // NEW: For AI style training
}

export interface TurnHistoryEntry {
  turnNumber: number; type: 'keyframe' | 'delta'; knowledgeBaseSnapshot: KnowledgeBase;
  knowledgeBaseDelta?: JsonPatchOperation[]; gameMessagesSnapshot: GameMessage[]; gameMessagesDelta?: JsonPatchOperation[];
}

export interface RealmBaseStatDefinition {
  hpBase: number; hpInc: number; mpBase: number; mpInc: number; atkBase: number; atkInc: number; expBase: number; expInc: number;
}

export type EquipmentSlotId = | 'mainWeapon' | 'offHandWeapon' | 'head' | 'body' | 'hands' | 'legs' | 'artifact' | 'pet' | 'accessory1' | 'accessory2';
export interface EquipmentSlotConfig {
  id: EquipmentSlotId; labelKey: keyof typeof import('./constants/translations').VIETNAMESE_TRANSLATIONS; accepts: GameTemplates.EquipmentTypeValues[]; icon?: string;
}

export interface Region { id: string; name: string; description?: string; mapColor?: string; }
export interface LocationConnection { targetLocationId: string; isDiscovered: boolean; travelTimeTurns?: number; description?: string; }
export interface GameLocation extends GameTemplates.LocationTemplate { 
    mapX?: number; 
    mapY?: number; 
    connections?: LocationConnection[];
    lastAuctionYear?: number;
}

export type AuctionItem = Item & { 
    startingPrice: number; 
    currentBid: number; 
    buyoutPrice?: number; 
    highestBidderId?: string;
    ownerId?: 'player' | 'system'; 
};
export interface AuctionNPC { id: string; name: string; realm: string; currency: number; }
export interface AuctionCommentaryEntry { id: string; text: string; timestamp: number; }
export interface AuctionState { 
    items: AuctionItem[]; 
    auctionNPCs: AuctionNPC[]; 
    currentItemIndex: number; 
    isOpen: boolean; 
    auctioneerCommentary: AuctionCommentaryEntry[]; 
    lastBidTime: number; 
    auctioneerCallCount: number;
    locationId: string; // ID of the Auction House location
}

// New types for Slave Auction
export type AuctionSlave = Slave & {
    startingPrice: number; 
    currentBid: number; 
    buyoutPrice?: number; 
    highestBidderId?: string;
    ownerId?: 'player' | 'system'; 
};

export interface SlaveAuctionState { 
    items: AuctionSlave[]; 
    auctionNPCs: AuctionNPC[]; 
    currentItemIndex: number; 
    isOpen: boolean; 
    auctioneerCommentary: AuctionCommentaryEntry[]; 
    lastBidTime: number; 
    auctioneerCallCount: number;
    locationId: string; // ID of the Slave Auction location
}


// New: Dynamic Master System
export interface Master extends PersonBase {
    // Dynamic stats
    mood: 'Vui Vẻ' | 'Hài Lòng' | 'Bình Thường' | 'Bực Bội' | 'Giận Dữ' | 'Nghi Ngờ';
    needs: Partial<Record<'Tham Vọng' | 'Dục Vọng' | 'An Toàn' | 'Giải Trí', number>>; // 0-100 scale for each need
    currentGoal: string;
    // For 18+ mode
    favor?: number; // 0-100, Sủng Ái
}

// NEW: Event System Types - Updated based on our discussion
export type GameEventType = 'Khám Phá / Thám Hiểm' | 'Thi Đấu / Cạnh Tranh' | 'Tuyển Chọn / Chiêu Mộ' | 'Xã Hội / Lễ Hội' | 'Chiến Tranh' | 'Đấu Giá' | 'Thiên Tai' | 'Tin Đồn';
export type GameEventStatus = 'Sắp diễn ra' | 'Đang diễn ra' | 'Đã kết thúc';

export interface EventDetail {
  id: string;
  text: string;
  turnDiscovered: number;
}

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  type: GameEventType;
  status: GameEventStatus;
  startDate: WorldDate;
  endDate: WorldDate;
  locationId: string; // The ID of the general location (e.g., Thần Thành)
  specificLocationId?: string; // The ID of the specific sub-location (e.g., Vạn Bảo Lâu)
  isDiscovered: boolean;
  details: EventDetail[]; // A list of discovered details about the event
  isCancelled?: boolean; // Flag if the event gets cancelled by AI
}


// NEW: RAG System Types
export type VectorEntityType = 'item' | 'skill' | 'quest' | 'npc' | 'yeuThu' | 'faction' | 'lore' | 'wife' | 'slave' | 'prisoner' | 'location' | 'master';

export interface VectorMetadata {
  entityId: string;
  entityType: VectorEntityType;
  text: string; // The original text that was vectorized
}

export interface VectorStore {
  vectors: number[][]; // Array of 768-dimension vectors
  metadata: VectorMetadata[]; // REPLACES the 'texts' array for better entity tracking
}

export interface KnowledgeBase {
  playerStats: PlayerStats; inventory: Item[]; equippedItems: Record<EquipmentSlotId, Item['id'] | null>;
  playerSkills: Skill[]; allQuests: Quest[]; discoveredNPCs: NPC[]; discoveredLocations: GameLocation[];
  discoveredYeuThu: YeuThu[]; // New
  discoveredFactions: Faction[]; realmProgressionList: string[]; currentRealmBaseStats: Record<string, RealmBaseStatDefinition>;
  worldConfig: WorldSettings | null; companions: Companion[]; worldLore: WorldLoreEntry[]; worldDate: WorldDate; appVersion?: string;
  pageSummaries?: Record<number, string>; currentPageHistory?: number[]; lastSummarizedTurn?: number; turnHistory?: TurnHistoryEntry[];
  autoSaveTurnCounter: number; currentAutoSaveSlotIndex: number; autoSaveSlotIds: (string | null)[]; manualSaveId: string | null; manualSaveName: string | null;
  playerAvatarData?: string; discoveredRegions: Region[]; currentMapId?: string; currentLocationId?: string;
  auctionState?: AuctionState | null; 
  slaveAuctionState?: SlaveAuctionState | null; // New
  pendingCombat?: { opponentIds: string[]; surrenderedNpcIds?: string[] } | null;
  postCombatState?: CombatEndPayload | null; // NEW
  userPrompts?: string[]; // NEW
  // New Entities
  prisoners: Prisoner[];
  wives: Wife[];
  slaves: Slave[];
  master?: Master | null; // New: The current Master object
  gameEvents: GameEvent[]; // NEW: For event system
  ragVectorStore?: VectorStore; // NEW: For RAG
  aiContextConfig: AIContextConfig; // NEW
}

export interface AiChoice { text: string; actionTag?: string; }
export interface GameMessage { id: string; type: 'narration' | 'choice' | 'system' | 'player_action' | 'error' | 'page_summary' | 'event_summary'; content: string; timestamp: number; choices?: AiChoice[]; isPlayerInput?: boolean; turnNumber: number; }
export interface ParsedAiResponse { narration: string; choices: AiChoice[]; tags: string[]; systemMessage?: string; }
export interface SafetySetting { category: HarmCategory; threshold: HarmBlockThreshold; }

// New Type for selecting avatar generation engine
export type AvatarGenerationEngine = 'imagen-3.0';

export interface ApiConfig {
  apiKeySource: 'system' | 'user';
  userApiKeys: string[];
  model: string;
  economyModel?: string;
  safetySettings?: SafetySetting[];
  autoGenerateNpcAvatars: boolean;
  avatarGenerationEngine?: AvatarGenerationEngine;
  ragTopK?: number;
}
export interface SaveGameData { id?: string; name: string; timestamp: any; knowledgeBase: KnowledgeBase; gameMessages: GameMessage[]; appVersion?: string; }
export interface SaveGameMeta { id: string; name: string; timestamp: Date; size?: number; }
export type PlayerActionInputType = 'action' | 'story';
export type ResponseLength = 'default' | 'short' | 'medium' | 'long';
export interface StyleSettingProperty { fontFamily?: string; fontSize?: string; textColor: string; backgroundColor?: string; }
export interface StyleSettings { narration: StyleSettingProperty; playerAction: StyleSettingProperty; choiceButton: StyleSettingProperty; keywordHighlight: StyleSettingProperty; dialogueHighlight: StyleSettingProperty; }

export interface GeneratedWorldElements {
  startingSkills: StartingSkill[]; startingItems: StartingItem[]; startingNPCs: StartingNPC[]; startingLore: StartingLore[];
  startingYeuThu?: StartingYeuThu[]; // New
  startingLocations?: StartingLocation[]; startingFactions?: StartingFaction[]; playerName?: string; playerGender?: 'Nam' | 'Nữ' | 'Khác';
  playerRace?: string; // New
  playerPersonality?: string; playerBackstory?: string; playerGoal?: string; playerStartingTraits?: string;
  playerSpiritualRoot?: string; // New
  playerSpecialPhysique?: string; // New
  playerThoNguyen?: number; // New
  playerMaxThoNguyen?: number; // New
  playerAvatarUrl?: string; worldTheme?: string; worldSettingDescription?: string; worldWritingStyle?: string; currencyName?: string;
  originalStorySummary?: string;
  raceCultivationSystems?: RaceCultivationSystem[]; // REPLACES heThongCanhGioi
  yeuThuRealmSystem?: string; // NEW
  canhGioiKhoiDau?: string; saveGameName?: string; genre?: GenreType;
  customGenreName?: string; isCultivationEnabled?: boolean; nsfwDescriptionStyle?: NsfwDescriptionStyle;
  violenceLevel?: ViolenceLevel; storyTone?: StoryTone; startingDate?: WorldDate;
  startingCurrency?: number;
}

export interface AvatarUploadHandlers {
  onPlayerAvatarUploadRequest: (base64Data: string) => Promise<void>;
  onNpcAvatarUploadRequest: (npcId: string, base64Data: string, gender: NPC['gender']) => Promise<void>;
}

// Types for new "Find Location" feature
export type SearchMethod = 'Hỏi Thăm Dân Địa Phương' | 'Tra Cứu Cổ Tịch / Bản Đồ Cũ' | 'Dùng Thần Thức / Linh Cảm' | 'Đi Lang Thang Vô Định';
export const SEARCH_METHODS: SearchMethod[] = ['Hỏi Thăm Dân Địa Phương', 'Tra Cứu Cổ Tịch / Bản Đồ Cũ', 'Dùng Thần Thức / Linh Cảm', 'Đi Lang Thang Vô Định'];

export interface FindLocationParams {
  locationTypes: GameTemplates.LocationTypeValues[];
  isSafeZone: boolean | null; // null means 'any'
  keywords: string;
  searchMethod: SearchMethod;
}

export type CombatDisposition = 'capture' | 'kill' | 'release';
export interface CombatDispositionMap {
  [npcId: string]: CombatDisposition;
}

export interface CombatEndPayload {
    finalPlayerState: PlayerStats;
    dispositions: CombatDispositionMap;
    summary: string;
    outcome: 'victory' | 'defeat' | 'escaped' | 'surrendered';
    opponentIds: string[]; // NEW
}


export const DIALOGUE_MARKER = '"';