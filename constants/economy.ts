// src/constants/economy.ts
import { EquipmentRarity } from '../templates';
import * as GameTemplates from '../templates';

/**
 * Constants for the formula-based item valuation system.
 * This system allows for dynamic value calculation based on realm progression.
 */

// The base value for items found in the mortal realm (non-cultivators).
export const MORTAL_REALM_BASE_VALUE = 50;

// The base value for items of the very first cultivation realm. This is now significantly lower.
export const FIRST_CULTIVATION_REALM_BASE_VALUE = 100;

/**
 * The core of the realm value formula: V(i) = V(i-1) * Multiplier(i)
 * Multiplier(i) = max(REALM_MULTIPLIER_MIN, REALM_MULTIPLIER_BASE - (REALM_MULTIPLIER_DECAY * (i-2)))
 * These parameters have been aligned with the NPC wealth formula for parallel growth.
 */
// The starting multiplier for realm-to-realm value increase.
export const REALM_MULTIPLIER_BASE = 5.0; // Was 10.0
// How much the multiplier decreases for each subsequent tier.
export const REALM_MULTIPLIER_DECAY = 0.3; // Was 0.6
// The minimum multiplier, preventing it from becoming too low for high-end realms.
export const REALM_MULTIPLIER_MIN = 3.0; // Was 4.0


// Based on user example: +1 Sức Tấn Công = 50 Linh Thạch, +10 Sinh Lực Tối Đa = 10 Linh Thạch.
export const STAT_POINT_VALUES: Record<string, number> = {
    sucTanCong: 50,
    maxSinhLuc: 1, // Value per 1 point, so 10 points = 10 currency
    maxLinhLuc: 2, // Value per 1 point
};

// Rarity multipliers remain crucial for valuation.
export const RARITY_MULTIPLIERS: Record<EquipmentRarity, number> = {
    [GameTemplates.ItemRarity.PHO_THONG]: 1.0,
    [GameTemplates.ItemRarity.HIEM]: 2.5,
    [GameTemplates.ItemRarity.QUY_BAU]: 7.5,
    [GameTemplates.ItemRarity.CUC_PHAM]: 20.0,
    [GameTemplates.ItemRarity.THAN_THOAI]: 50.0,
    [GameTemplates.ItemRarity.CHI_TON]: 150.0,
};


// Category multipliers to adjust value based on item type.
export const CATEGORY_MULTIPLIERS: Partial<Record<GameTemplates.ItemCategoryValues, number>> = {
    [GameTemplates.ItemCategory.POTION]: 1.2,
    [GameTemplates.ItemCategory.MATERIAL]: 0.8,
    [GameTemplates.ItemCategory.CONG_PHAP]: 3.0,
    [GameTemplates.ItemCategory.LINH_KI]: 3.0,
    [GameTemplates.ItemCategory.PROFESSION_SKILL_BOOK]: 2.5,
    [GameTemplates.ItemCategory.PROFESSION_TOOL]: 1.5,
};

// NEW: Multipliers for special effects on equipment.
// The final value is calculated as: BaseValue * (1 + SUM_OF_EFFECT_MULTIPLIERS)
// Each effect's multiplier is: effectData.baseMultiplier * (numeric value from effect string)
export const SPECIAL_EFFECT_KEYWORDS: Record<string, { baseMultiplier: number }> = {
    "hút máu": { baseMultiplier: 0.08 }, // hút máu 5% -> 0.08 * 5 = 0.4 multiplier
    "chí mạng": { baseMultiplier: 0.07 }, // tăng 10% tỉ lệ chí mạng -> 0.07 * 10 = 0.7
    "sát thương chí mạng": { baseMultiplier: 0.015 }, // tăng 50% sát thương chí mạng -> 0.015 * 50 = 0.75
    "xuyên giáp": { baseMultiplier: 0.1 }, // xuyên giáp 15% -> 0.1 * 15 = 1.5
    "bỏ qua phòng thủ": { baseMultiplier: 0.1 }, // Same as xuyên giáp
    "phản sát thương": { baseMultiplier: 0.06 }, // phản 10% sát thương -> 0.06 * 10 = 0.6
    "phản đòn": { baseMultiplier: 0.06 }, // Same as phản sát thương
    "tăng tốc": { baseMultiplier: 0.15 }, // tăng 5 tốc độ -> 0.15 * 5 = 0.75
    "né tránh": { baseMultiplier: 0.09 }, // tăng 5% né tránh -> 0.09 * 5 = 0.45
    "chính xác": { baseMultiplier: 0.08 }, // tăng 5% chính xác -> 0.08 * 5 = 0.4
    "kháng tất cả": { baseMultiplier: 0.12 }, // kháng tất cả 5% -> 0.12 * 5 = 0.6
    "giảm hồi chiêu": { baseMultiplier: 0.05 }, // giảm 10% hồi chiêu -> 0.05 * 10 = 0.5
    "gây choáng": { baseMultiplier: 0.25 }, // có 5% tỉ lệ gây choáng -> 0.25 * 5 = 1.25
    "gây tê liệt": { baseMultiplier: 0.25 }, // same as choáng
    "gây câm lặng": { baseMultiplier: 0.20 },
    "gây mù": { baseMultiplier: 0.18 },
    "gây độc": { baseMultiplier: 0.04 }, // gây độc 10 dmg/s -> 0.04 * 10 = 0.4
    "gây bỏng": { baseMultiplier: 0.04 },
    "hồi phục sinh lực": { baseMultiplier: 0.005 }, // hồi 20 HP/s -> 0.005 * 20 = 0.1
    "hồi phục linh lực": { baseMultiplier: 0.01 }, // hồi 10 MP/s -> 0.01 * 10 = 0.1
    "tăng kinh nghiệm": { baseMultiplier: 0.1 }, // tăng 10% exp nhận được -> 0.1 * 10 = 1.0
    "tăng vàng": { baseMultiplier: 0.08 }, // tăng 10% vàng rơi ra -> 0.08 * 10 = 0.8
    "miễn nhiễm": { baseMultiplier: 0.8 }, // Miễn nhiễm choáng (no number) -> 0.8
    "giảm tiêu hao linh lực": { baseMultiplier: 0.04 }, // giảm 10% mana cost -> 0.04 * 10 = 0.4
    "hấp thụ sát thương": { baseMultiplier: 0.11 }, // hấp thụ 5% sát thương -> 0.11 * 5 = 0.55
};

// A flat multiplier bonus for each unique effect string that isn't found in the keyword dictionary.
// This ensures that any unique, AI-generated effect still adds some value.
export const UNKNOWN_EFFECT_MULTIPLIER = 0.15; // +15% value for each unknown effect.