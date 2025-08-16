import { TuChatTier } from '../types';

// Exported for use in UI dropdowns and logic
export const TU_CHAT_TIERS: readonly TuChatTier[] = ["Phế Phẩm", "Hạ Đẳng", "Trung Đẳng", "Thượng Đẳng", "Cực Phẩm", "Tiên Phẩm", "Thần Phẩm"];

// Used by the system to calculate EXP gain. Not shown to user.
export const TU_CHAT_MULTIPLIERS: Record<TuChatTier, number> = {
    "Phế Phẩm": 0.2,
    "Hạ Đẳng": 0.5,
    "Trung Đẳng": 1.0,
    "Thượng Đẳng": 1.5,
    "Cực Phẩm": 2.5,
    "Tiên Phẩm": 4.0,
    "Thần Phẩm": 7.0,
};

// Base EXP gained per turn, as a percentage of the NPC's max experience for their current realm.
// An NPC with Trung Đẳng aptitude will gain 5% of their max EXP per turn.
export const NPC_BASE_EXP_PERCENTAGE = 0.06;

// Turns an NPC stays in bottleneck before breaking through.
export const NPC_BOTTLENECK_DURATION_TURNS = 3;