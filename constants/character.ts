import { PlayerStats, RealmBaseStatDefinition, ProficiencyTier, PROFICIENCY_TIERS, TuChatTier } from '../types';

export const SUB_REALM_NAMES = ["Nhất Trọng", "Nhị Trọng", "Tam Trọng", "Tứ Trọng", "Ngũ Trọng", "Lục Trọng", "Thất Trọng", "Bát Trọng", "Cửu Trọng", "Đỉnh Phong"];

export const DEFAULT_MORTAL_STATS: Pick<PlayerStats, 'baseMaxSinhLuc' | 'baseMaxLinhLuc' | 'baseSucTanCong' | 'baseMaxKinhNghiem' | 'realm' | 'linhLuc' | 'maxLinhLuc' | 'kinhNghiem' | 'maxKinhNghiem' | 'hieuUngBinhCanh' | 'activeStatusEffects' | 'spiritualRoot' | 'specialPhysique' | 'professions' | 'thoNguyen' | 'maxThoNguyen'> = {
  baseMaxSinhLuc: 100,
  baseMaxLinhLuc: 0,
  baseSucTanCong: 10,
  baseMaxKinhNghiem: 100,
  realm: "Người Thường",
  linhLuc: 0,
  maxLinhLuc: 0,
  kinhNghiem: 0,
  maxKinhNghiem: 100,
  hieuUngBinhCanh: false,
  activeStatusEffects: [],
  spiritualRoot: "Phàm Căn",
  specialPhysique: "Phàm Thể",
  professions: [],
  thoNguyen: 80,
  maxThoNguyen: 80,
};

const generateTieredStats = (): RealmBaseStatDefinition[] => {
  const tiers: RealmBaseStatDefinition[] = [];
  tiers.push({
    hpBase: 100, hpInc: 20,
    mpBase: 50, mpInc: 10,
    atkBase: 10, atkInc: 2,
    expBase: 100, expInc: 20,
  });
  tiers.push({
    hpBase: 1000, hpInc: 200,
    mpBase: 500, mpInc: 100,
    atkBase: 100, atkInc: 20,
    expBase: 1000, expInc: 200,
  });
  const baseMultiplier = 5.0;
  const incMultiplier = 2.0;
  for (let i = 2; i < 30; i++) {
    const prevTier = tiers[i - 1];
    tiers.push({
      hpBase: Math.floor(prevTier.hpBase * baseMultiplier),
      hpInc: Math.floor(prevTier.hpInc * incMultiplier),
      mpBase: Math.floor(prevTier.mpBase * baseMultiplier),
      mpInc: Math.floor(prevTier.mpInc * incMultiplier),
      atkBase: Math.floor(prevTier.atkBase * baseMultiplier),
      atkInc: Math.floor(prevTier.atkInc * incMultiplier),
      expBase: Math.floor(prevTier.expBase * baseMultiplier),
      expInc: Math.floor(prevTier.expInc * incMultiplier),
    });
  }
  return tiers;
};

export const DEFAULT_TIERED_STATS: RealmBaseStatDefinition[] = generateTieredStats();

export const DEFAULT_PLAYER_STATS: PlayerStats = {
  baseMaxSinhLuc: 100,
  baseMaxLinhLuc: 50,
  baseSucTanCong: 10,
  baseMaxKinhNghiem: 100,
  sinhLuc: 100,
  maxSinhLuc: 100,
  linhLuc: 50,
  maxLinhLuc: 50,
  sucTanCong: 10,
  kinhNghiem: 0,
  maxKinhNghiem: 100,
  realm: "Phàm Nhân Nhất Trọng",
  currency: 0,
  isInCombat: false,
  turn: 0,
  hieuUngBinhCanh: false,
  activeStatusEffects: [],
  spiritualRoot: "Chưa rõ", // New
  specialPhysique: "Chưa rõ", // New
  professions: [], // New
  thoNguyen: 120, // New
  maxThoNguyen: 120, //New
  playerSpecialStatus: null, // NEW
};

export const PROFICIENCY_EXP_THRESHOLDS: Record<ProficiencyTier, number | null> = {
    "Sơ Nhập": 100,
    "Tiểu Thành": 200,
    "Đại Thành": 400,
    "Viên Mãn": 800,
    "Xuất Thần Nhập Hóa": null, // Max level
};

export const PROFICIENCY_DMG_HEAL_MULTIPLIERS: Record<ProficiencyTier, number> = {
    "Sơ Nhập": 1.0,
    "Tiểu Thành": 2.0,
    "Đại Thành": 3.0,
    "Viên Mãn": 4.0,
    "Xuất Thần Nhập Hóa": 5.0,
};

export const PROFICIENCY_COST_COOLDOWN_MULTIPLIERS: Record<ProficiencyTier, number> = {
    "Sơ Nhập": 1.0,
    "Tiểu Thành": 0.8,
    "Đại Thành": 0.6,
    "Viên Mãn": 0.4,
    "Xuất Thần Nhập Hóa": 0.2,
};

export const TU_CHAT_VALUE_MULTIPLIERS: Record<TuChatTier, number> = {
    "Phế Phẩm": 0.5,
    "Hạ Đẳng": 0.8,
    "Trung Đẳng": 1.0,
    "Thượng Đẳng": 1.5,
    "Cực Phẩm": 2.5,
    "Tiên Phẩm": 5.0,
    "Thần Phẩm": 10.0,
};


export const WEAPON_TYPES_FOR_VO_Y = ["Quyền", "Kiếm", "Đao", "Thương", "Côn", "Cung", "Trượng", "Phủ", "Chỉ", "Trảo", "Chưởng"] as const;