// src/constants/world.ts
import { WorldSettings, GenreType, GENRE_VALUES_FOR_TYPE, CustomGenreType, WorldDate } from '../types';
import * as GameTemplates from '../templates';

export const CUSTOM_GENRE_VALUE: CustomGenreType = "Khác (Tự định nghĩa)";
export const AVAILABLE_GENRES: typeof GENRE_VALUES_FOR_TYPE = GENRE_VALUES_FOR_TYPE;

// Runtime checks for genre consistency (important for type safety and logic)
if (!AVAILABLE_GENRES.includes(CUSTOM_GENRE_VALUE)) {
  console.error(
    "CRITICAL CONSTANT MISMATCH: AVAILABLE_GENRES (derived from types.ts) does not include CUSTOM_GENRE_VALUE from constants/world.ts. Review definitions in both files."
  );
}
if (GENRE_VALUES_FOR_TYPE[GENRE_VALUES_FOR_TYPE.length -1] !== CUSTOM_GENRE_VALUE) {
    console.error(
    "CRITICAL CONSTANT MISMATCH: The last element of GENRE_VALUES_FOR_TYPE in types.ts must be 'Khác (Tự định nghĩa)' to match CUSTOM_GENRE_VALUE."
  );
}

// NSFW, Violence, and Story Tone constants are now in nsfw.ts
// For example:
// import { DEFAULT_NSFW_DESCRIPTION_STYLE, DEFAULT_VIOLENCE_LEVEL, DEFAULT_STORY_TONE } from './nsfw';
// These are imported and re-exported via the main constants.ts

export const DEFAULT_WORLD_SETTINGS: WorldSettings = {
    saveGameName: "",
    theme: "",
    settingDescription: "",
    writingStyle: "",
    difficulty: "Thường", // Default difficulty still makes sense here or in a 'gameDefaults.ts'
    currencyName: "Linh Thạch",
    playerName: "",
    playerGender: "Nam",
    playerRace: "Nhân Tộc",
    playerPersonality: "",
    playerBackstory: "",
    playerGoal: "",
    playerStartingTraits: "",
    playerSpiritualRoot: "",
    playerSpecialPhysique: "",
    playerThoNguyen: 100,
    playerMaxThoNguyen: 100,
    startingCurrency: 10,
    startingSkills: [],
    startingItems: [],
    startingNPCs: [],
    startingYeuThu: [], // New
    startingLore: [],
    startingLocations: [],
    startingFactions: [],
    nsfwMode: false, // This can remain here as a toggle for the world
    // Default styles for NSFW, violence, tone will be picked up from nsfw.ts via constants.ts
    // So no need to reference them directly here if they are re-exported correctly.
    // If needed, they would be:
    // nsfwDescriptionStyle: DEFAULT_NSFW_DESCRIPTION_STYLE_VALUE, (from nsfw.ts)
    // violenceLevel: DEFAULT_VIOLENCE_LEVEL_VALUE, (from nsfw.ts)
    // storyTone: DEFAULT_STORY_TONE_VALUE, (from nsfw.ts)
    // However, these specific defaults are handled when AI Assist Tab populates settings.
    originalStorySummary: "",
    genre: AVAILABLE_GENRES[0],
    customGenreName: "",
    isCultivationEnabled: true,
    raceCultivationSystems: [ // NEW
      { id: 'default-human-1', raceName: 'Nhân Tộc', realmSystem: 'Phàm Nhân - Luyện Khí - Trúc Cơ - Kim Đan - Nguyên Anh - Hóa Thần - Luyện Hư - Hợp Thể - Đại Thừa - Độ Kiếp' }
    ],
    yeuThuRealmSystem: 'Khai Trí - Yêu Binh - Yêu Tướng - Yêu Soái - Yêu Vương - Yêu Hoàng - Yêu Đế - Yêu Tôn - Yêu Tổ - Yêu Thần', // NEW
    canhGioiKhoiDau: "Phàm Nhân Nhất Trọng",
    startingDate: { day: 1, month: 1, year: 1, hour: 8, minute: 0 },
    playerAvatarUrl: undefined,
};

export const ALL_FACTION_ALIGNMENTS = Object.values(GameTemplates.FactionAlignment);