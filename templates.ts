
import type { PlayerStats, TuChatTier, ProficiencyTier, Slave } from './types'; // PlayerStats will be defined in types.ts

export const ItemRarity = {
    PHO_THONG: "Phổ Thông", HIEM: "Hiếm", QUY_BAU: "Quý Báu", CUC_PHAM: "Cực Phẩm", THAN_THOAI: "Thần Thoại", CHI_TON: "Chí Tôn"
} as const;
export type EquipmentRarity = typeof ItemRarity[keyof typeof ItemRarity];

export const ItemCategory = {
    EQUIPMENT: "Equipment", POTION: "Potion", MATERIAL: "Material", QUEST_ITEM: "QuestItem", MISCELLANEOUS: "Miscellaneous",
    CONG_PHAP: "CongPhap", // New: Cultivation Method book/slip
    LINH_KI: "LinhKi", // New: Spirit Skill manual
    PROFESSION_SKILL_BOOK: "ProfessionSkillBook", // New: Book to learn a profession
    PROFESSION_TOOL: "ProfessionTool", // New: Tool required for a profession
} as const;
export type ItemCategoryValues = typeof ItemCategory[keyof typeof ItemCategory];

export const EquipmentType = { VU_KHI: "Vũ Khí", GIAP_DAU: "Giáp Đầu", GIAP_THAN: "Giáp Thân", GIAP_TAY: "Giáp Tay", GIAP_CHAN: "Giáp Chân", TRANG_SUC: "Trang Sức", PHAP_BAO: "Pháp Bảo", THU_CUNG: "Thú Cưng" } as const;
export type EquipmentTypeValues = typeof EquipmentType[keyof typeof EquipmentType];

export const PotionType = { HOI_PHUC: "Hồi Phục", TANG_CUONG: "Tăng Cường", GIAI_DOC: "Giải Độc", DAC_BIET: "Đặc Biệt" } as const;
export type PotionTypeValues = typeof PotionType[keyof typeof PotionType];

export const MaterialType = { LINH_THAO: "Linh Thảo", KHOANG_THACH: "Khoáng Thạch", YEU_DAN: "Yêu Đan", DA_XUONG_YEU_THU: "Da/Xương Yêu Thú", LINH_HON: "Linh Hồn", VAT_LIEU_CHE_TAO_CHUNG: "Vật Liệu Chế Tạo Chung", KHAC: "Khác" } as const;
export type MaterialTypeValues = typeof MaterialType[keyof typeof MaterialType];

// New: Profession types
export const ProfessionType = {
    LUYEN_DAN_SU: "Luyện Đan Sư", LUYEN_KHI_SU: "Luyện Khí Sư", LUYEN_PHU_SU: "Luyện Phù Sư",
    TRAN_PHAP_SU: "Trận Pháp Sư", KHOI_LOI_SU: "Khôi Lỗi Sư", NGU_THU_SU: "Ngự Thú Sư",
    LINH_THAO_SU: "Linh Thảo Sư", THIEN_CO_SU: "Thiên Cơ Sư", DOC_SU: "Độc Sư", LINH_TRU: "Linh Trù",
    HOA_SU:"Họa Sư",
} as const;
export type ProfessionType = typeof ProfessionType[keyof typeof ProfessionType];

// New: CongPhap types
export const CongPhapType = {
    KHI_TU: "Khí Tu", // Absorbing Qi
    THE_TU: "Thể Tu", // Body Cultivation
    VO_Y: "Võ Ý", // Martial Intent
    HON_TU: "Hồn Tu", // Soul Cultivation
    THON_PHE: "Thôn Phệ", // Devouring
    SONG_TU: "Song Tu", // Dual Cultivation
    CO_TU: "Cổ Tu", // Ancient (Insect) Cultivation
    AM_LUAT_TU: "Âm Tu", // Musical Cultivation
} as const;
export type CongPhapType = typeof CongPhapType[keyof typeof CongPhapType];

export const CONG_PHAP_GRADES = ['Phàm Phẩm', 'Hoàng Phẩm', 'Huyền Phẩm', 'Địa Phẩm', 'Thiên Phẩm'] as const;
export type CongPhapGrade = typeof CONG_PHAP_GRADES[number];

export const LINH_KI_CATEGORIES = ['Tấn công', 'Phòng thủ', 'Hồi phục', 'Thân pháp', 'Khác'] as const;
export type LinhKiCategory = typeof LINH_KI_CATEGORIES[number];

export const LINH_KI_ACTIVATION_TYPES = ['Chủ động', 'Bị động'] as const;
export type LinhKiActivationType = typeof LINH_KI_ACTIVATION_TYPES[number];

export const PROFESSION_GRADES = ['Nhất phẩm', 'Nhị phẩm', 'Tam phẩm', 'Tứ phẩm', 'Ngũ phẩm', 'Lục phẩm', 'Thất phẩm', 'Bát phẩm', 'Cửu phẩm'] as const;
export type ProfessionGrade = typeof PROFESSION_GRADES[number];

export const SkillType = {
    CONG_PHAP_TU_LUYEN: "Công Pháp Tu Luyện",
    LINH_KI: "Linh Kĩ",
    NGHE_NGHIEP: "Nghề Nghiệp",
    THAN_THONG: "Thần Thông",
    CAM_THUAT: "Cấm Thuật",
    KHAC: "Khác",
} as const;
export type SkillTypeValues = typeof SkillType[keyof typeof SkillType];

export type SkillTargetType = 'Tự Thân' | 'Đồng Minh Đơn Lẻ' | 'Đồng Minh Toàn Bộ' | 'Kẻ Địch Đơn Lẻ' | 'Kẻ Địch Toàn Bộ' | 'Khu Vực';

export const FactionAlignment = { CHINH_NGHIA: 'Chính Nghĩa', TRUNG_LAP: 'Trung Lập', TA_AC: 'Tà Ác', HON_LOAN: 'Hỗn Loạn' } as const;
export type FactionAlignmentValues = typeof FactionAlignment[keyof typeof FactionAlignment];

export const LocationType = { VILLAGE: 'Làng mạc', TOWN: 'Thị trấn', CITY: 'Thành thị', CAPITAL: 'Thủ đô', SECT_CLAN: 'Tông môn/Gia tộc', FOREST: 'Rừng rậm', MOUNTAIN: 'Núi non', CAVE: 'Hang động', DUNGEON: 'Hầm ngục/Bí cảnh', RUIN: 'Tàn tích', RIVER_LAKE: 'Sông/Hồ', LANDMARK: 'Địa danh Đặc biệt (Độc lập)', DEFAULT: 'Mặc định', } as const;
export type LocationTypeValues = typeof LocationType[keyof typeof LocationType];

export const SubLocationType = { PLAZA: 'Quảng trường', GOVERNMENT_BUILDING: 'Công trình công cộng (Phủ Chúa, Toà thị chính)', TOWER: 'Tháp (Canh gác, Phép thuật)', BARRACKS: 'Doanh trại', TRAINING_GROUND: 'Luyện võ trường', LIBRARY: 'Thư viện/Tàng Kinh Các', TEMPLE: 'Đền/Miếu/Nhà thờ', GARDEN: 'Công viên/Khu vườn', GATE: 'Cổng thành', WALL: 'Tường thành', INN: 'Quán trọ/Tửu điếm', HARBOR: 'Bến cảng', THEATER: 'Nhà hát/Sân khấu', ACADEMY: 'Học viện', ALTAR: 'Bàn thờ/Tế đàn', HALL: 'Sảnh chính/Đại điện', DUNGEON_ROOM: 'Phòng trong Bí cảnh', RESIDENTIAL_AREA: 'Khu dân cư', PRISON: 'Nhà tù/Ngục tối', BRIDGE: 'Cầu', FARM: 'Nông trại', MONUMENT: 'Đài tưởng niệm/Địa danh nhỏ', OTHER: 'Khác', } as const;
export type SubLocationTypeValues = typeof SubLocationType[keyof typeof SubLocationType];

export const EconomyLocationType = { 
    SHOP: 'Cửa hàng', 
    MARKETPLACE: 'Phường Thị', 
    SHOPPING_CENTER: 'Thương Thành', 
    AUCTION_HOUSE: 'Đấu Giá Hội',
    SLAVE_MARKET: 'Chợ Nô Lệ',
    SLAVE_AUCTION: 'Đấu Giá Nô Lệ',
} as const;
export type EconomyLocationTypeValues = typeof EconomyLocationType[keyof typeof EconomyLocationType];

export type AnyLocationType = LocationTypeValues | EconomyLocationTypeValues | SubLocationTypeValues;

export interface BaseItemTemplate { id: string; name: string; description: string; category: ItemCategoryValues; rarity: EquipmentRarity; value?: number; icon?: string; stackable?: boolean; maxStack?: number; quantity: number; itemRealm?: string; }
export interface EquipmentTemplate extends BaseItemTemplate { category: typeof ItemCategory.EQUIPMENT; equipmentType: EquipmentTypeValues; slot?: string; statBonuses: Partial<Omit<PlayerStats, 'realm' | 'currency' | 'isInCombat' | 'turn' | 'hieuUngBinhCanh' | 'baseMaxKinhNghiem' | 'baseMaxLinhLuc' | 'baseMaxSinhLuc' | 'baseSucTanCong' | 'activeStatusEffects' | 'sinhLuc' | 'linhLuc' | 'kinhNghiem' | 'spiritualRoot' | 'specialPhysique' | 'professions'>>; uniqueEffects: string[]; durability?: number; maxDurability?: number; levelRequirement?: number; usable?: boolean; consumable?: boolean; }
export interface PotionTemplate extends BaseItemTemplate { category: typeof ItemCategory.POTION; potionType: PotionTypeValues; effects: string[]; durationTurns?: number; isConsumedOnUse: true; cooldownTurns?: number; usable: true; consumable: true; }
export interface MaterialTemplate extends BaseItemTemplate { category: typeof ItemCategory.MATERIAL; materialType: MaterialTypeValues; usable: false; consumable: false; }
export interface QuestItemTemplate extends BaseItemTemplate { category: typeof ItemCategory.QUEST_ITEM; questIdAssociated: string; isConsumedOnQuestCompletion?: boolean; usable: false; consumable: false; }
export interface MiscellaneousItemTemplate extends BaseItemTemplate { category: typeof ItemCategory.MISCELLANEOUS; usable: boolean; consumable: boolean; }

// --- New Item Templates ---
export interface CongPhapTemplate extends BaseItemTemplate { category: typeof ItemCategory.CONG_PHAP; congPhapType: CongPhapType; expBonusPercentage: number; }
export interface LinhKiTemplate extends BaseItemTemplate { category: typeof ItemCategory.LINH_KI; skillToLearnJSON: string; } // JSON string of a skill to be parsed
export interface ProfessionSkillBookTemplate extends BaseItemTemplate { category: typeof ItemCategory.PROFESSION_SKILL_BOOK; professionToLearn: ProfessionType; }
export interface ProfessionToolTemplate extends BaseItemTemplate { category: typeof ItemCategory.PROFESSION_TOOL; professionRequired: ProfessionType; }
// --- End New Item Templates ---

export type InventoryItem = EquipmentTemplate | PotionTemplate | MaterialTemplate | QuestItemTemplate | MiscellaneousItemTemplate | CongPhapTemplate | LinhKiTemplate | ProfessionSkillBookTemplate | ProfessionToolTemplate;

export interface NPCTemplate {
    id: string; name: string; title?: string; gender?: 'Nam' | 'Nữ' | 'Khác' | 'Không rõ'; race?: string; description: string; personalityTraits: string[]; affinity: number; factionId?: string; avatarUrl?: string; relationshipToPlayer?: string; realm?: string; tuChat?: TuChatTier;
    spiritualRoot?: string; // New
    specialPhysique?: string; // New
    isBinhCanh?: boolean; binhCanhCounter?: number; baseStatOverrides?: Partial<Pick<PlayerStats, 'baseMaxSinhLuc' | 'baseMaxLinhLuc' | 'baseSucTanCong' | 'baseMaxKinhNghiem'>>; stats?: Partial<PlayerStats>; skills?: string[]; inventoryIds?: string[];
    vendorType?: 'MarketStall' | 'SpecializedShop' | 'Auctioneer' | 'SlaveTrader'; vendorSlogan?: string; vendorBuysCategories?: ItemCategoryValues[]; 
    shopInventory?: InventoryItem[];
    slavesForSale?: Slave[]; // New
    lastRestockYear?: number;
    isEssential?: boolean; locationId?: string; level?: number;
}

// New YeuThuTemplate
export interface YeuThuTemplate {
    id: string;
    name: string;
    species: string; // e.g., Hỏa Lang, Băng Giao Long
    description: string;
    isHostile: boolean;
    avatarUrl?: string;
    realm?: string;
    stats?: Partial<PlayerStats>;
    skills?: string[]; // skill IDs
    lootTable?: Array<{ itemId: string, dropChance: number, minQuantity: number, maxQuantity: number }>; // For drops after combat
    locationId?: string; // Where it can be found
}

export interface SkillTemplate {
    id: string; name: string; description: string; skillType: SkillTypeValues; detailedEffect: string; icon?: string; manaCost: number; damageMultiplier: number; baseDamage: number; healingAmount: number; healingMultiplier: number;
    buffsApplied?: Array<{ stat: keyof PlayerStats | string; amount: number | string; durationTurns: number; chance?: number }>;
    debuffsApplied?: Array<{ stat: keyof PlayerStats | string; amount: number | string; durationTurns: number; chance?: number }>;
    otherEffects?: string[]; targetType?: SkillTargetType; cooldown?: number; currentCooldown?: number; levelRequirement?: number;
    requiredRealm?: string; prerequisiteSkillId?: string; isUltimate?: boolean; xpGainOnUse?: number;
    proficiency?: number; // New: Current proficiency EXP
    maxProficiency?: number; // New: EXP needed for next tier
    proficiencyTier?: ProficiencyTier; // New: The current proficiency tier
    // Add details from StartingSkill
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

export interface LocationTemplate { id: string; name: string; description: string; mapIcon?: string; regionId?: string; parentLocationId?: string; travelConnections?: Record<string, { locationId: string; travelTimeTurns?: number; requirements?: string }>; discoverableNPCIds?: string[]; discoverableItemIds?: string[]; resourceNodes?: Array<{ materialId: string; quantityRange: [number, number]; respawnTimeTurns?: number; toolRequired?: string }>; isSafeZone?: boolean; environmentalEffects?: string[]; ambientSound?: string; requiredLevel?: number; requiredQuestIdForEntry?: string; visited?: boolean; locationType?: AnyLocationType; }
export interface FactionTemplate { id: string; name: string; description: string; bannerIcon?: string; leaderNPCId?: string; keyNPCIds?: string[]; baseLocationId?: string; alliedFactionIds?: string[]; enemyFactionIds?: string[]; alignment: FactionAlignmentValues; playerReputation: number; reputationTiers?: Record<string, { threshold: number; title: string; benefits?: string[] }>; ranks?: Array<{ rankName: string; reputationRequired: number; benefits?: string[] }>; }
