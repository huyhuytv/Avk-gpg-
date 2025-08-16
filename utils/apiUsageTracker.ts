

export const API_CALL_CATEGORIES = {
  STORY_GENERATION: 'Diễn Biến Cốt Truyện',
  WORLD_GENERATION: 'Tạo Thế Giới (AI Hỗ Trợ)',
  FANFIC_GENERATION: 'Tạo Đồng Nhân (AI Hỗ Trợ)',
  WORLD_COMPLETION: 'Hoàn Thiện Thế Giới (AI Hỗ Trợ)',
  STYLE_ANALYSIS: 'Phân Tích Văn Phong', // NEW
  PAGE_SUMMARY: 'Tóm Tắt Trang Tự Động',
  COMBAT_TURN: 'Diễn Biến Chiến Đấu',
  COMBAT_SUMMARY: 'Tóm Tắt & Hậu Quả Chiến Đấu',
  CRAFTING: 'Luyện Chế Vật Phẩm',
  CULTIVATION: 'Tu Luyện',
  CHARACTER_INTERACTION: 'Tương Tác Nhân Vật',
  ECONOMY_LOCATION: 'Kinh Tế & Địa Điểm',
  IMAGE_GENERATION: 'Tạo Ảnh Đại Diện',
  TOKEN_COUNT: 'Tính Toán Token',
  EMBEDDING_GENERATION: 'Tạo Vector Ngữ Cảnh (RAG)',
} as const;

export type ApiCallCategory = keyof typeof API_CALL_CATEGORIES;
export type ApiCallStats = Partial<Record<ApiCallCategory, number>>;

const API_STATS_KEY = 'daoDoAiApiCallStats_v1';

let apiCallStats: ApiCallStats = {};

// Load initial stats from local storage
try {
    const storedStats = localStorage.getItem(API_STATS_KEY);
    const initialStats = storedStats ? JSON.parse(storedStats) : {};
    apiCallStats = initialStats;
} catch (e) {
    console.error("Could not read API call stats from localStorage.", e);
}

export function incrementApiCallCount(category: ApiCallCategory): void {
    apiCallStats[category] = (apiCallStats[category] || 0) + 1;
    try {
        localStorage.setItem(API_STATS_KEY, JSON.stringify(apiCallStats));
    } catch (e) {
        console.error("Could not save API call stats to localStorage.", e);
    }
}

export const getApiCallStats = (): ApiCallStats => {
    try {
        const storedStats = localStorage.getItem(API_STATS_KEY);
        return storedStats ? JSON.parse(storedStats) : {};
    } catch {
        return apiCallStats; // Fallback to in-memory if storage is corrupted
    }
};

export const resetApiCallStats = (): void => {
    apiCallStats = {};
    try {
        localStorage.setItem(API_STATS_KEY, JSON.stringify({}));
    } catch (e) {
        console.error("Could not reset API call stats in localStorage.", e);
    }
};