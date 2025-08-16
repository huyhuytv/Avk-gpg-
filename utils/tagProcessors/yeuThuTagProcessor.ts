


import { KnowledgeBase, GameMessage, YeuThu, PlayerStats, VectorMetadata } from '../../types';
import { YeuThuTemplate } from '../../templates';
import { DEFAULT_MORTAL_STATS, MALE_AVATAR_PLACEHOLDER_URL } from '../../constants';
import { calculateRealmBaseStats } from '../statsCalculationUtils';
import { getApiSettings, generateImageUnified } from '../../services/geminiService';
import { uploadImageToCloudinary } from '../../services/cloudinaryService';
import { diceCoefficient, normalizeStringForComparison } from '../questUtils';
import { formatYeuThuForEmbedding } from '../ragUtils'; // NEW: Import formatter

const SIMILARITY_THRESHOLD = 0.8;

export const processYeuThu = async (
    currentKb: KnowledgeBase,
    tagParams: Record<string, string>,
    turnForSystemMessages: number,
    setKnowledgeBaseDirectly: React.Dispatch<React.SetStateAction<KnowledgeBase>>,
    logNpcAvatarPromptCallback?: (prompt: string) => void
): Promise<{ updatedKb: KnowledgeBase; systemMessages: GameMessage[]; newVectorMetadata?: VectorMetadata; }> => {
    const newKb = JSON.parse(JSON.stringify(currentKb)) as KnowledgeBase;
    const systemMessages: GameMessage[] = [];
    let newVectorMetadata: VectorMetadata | undefined = undefined;

    const name = tagParams.name;
    const species = tagParams.species;
    const description = tagParams.description;
    const isHostile = tagParams.isHostile?.toLowerCase() === 'true';
    const realm = tagParams.realm;
    const aiSuggestedAvatarUrl = tagParams.avatarUrl;

    if (!name || !species || !description) {
        console.warn("YEUTHU: Missing required parameters (name, species, description).", tagParams);
        return { updatedKb: newKb, systemMessages };
    }

    if (newKb.discoveredYeuThu.find(yt => yt.name === name)) {
        console.warn(`YEUTHU: A beast with name "${name}" already exists. Skipping creation.`);
        return { updatedKb: newKb, systemMessages };
    }

    const newYeuThu: YeuThuTemplate = {
        id: `yeuthu-${name.replace(/\s+/g, '-')}-${Date.now()}`,
        name: name,
        species: species,
        description: description,
        isHostile: isHostile,
        realm: realm || (newKb.worldConfig?.isCultivationEnabled ? 'Không rõ' : 'Người Thường'),
        avatarUrl: aiSuggestedAvatarUrl,
        stats: {},
        skills: tagParams.skills ? tagParams.skills.split(',').map(s => s.trim()) : [],
        locationId: tagParams.locationId,
    };
    
    // Calculate stats based on realm
    let calculatedBaseStats: Partial<PlayerStats> = {};
    if (newYeuThu.realm && newKb.worldConfig?.isCultivationEnabled && newKb.worldConfig.yeuThuRealmSystem) {
        const yeuThuRealmProgression = newKb.worldConfig.yeuThuRealmSystem.split(' - ').map(s => s.trim()).filter(Boolean);
        calculatedBaseStats = calculateRealmBaseStats(
            newYeuThu.realm,
            yeuThuRealmProgression,
            newKb.currentRealmBaseStats
        );
    } else {
        calculatedBaseStats = { ...DEFAULT_MORTAL_STATS };
    }

    newYeuThu.stats = {
        ...calculatedBaseStats,
        sinhLuc: calculatedBaseStats.baseMaxSinhLuc,
        linhLuc: calculatedBaseStats.baseMaxLinhLuc,
        maxSinhLuc: calculatedBaseStats.baseMaxSinhLuc,
        maxLinhLuc: calculatedBaseStats.baseMaxLinhLuc,
        sucTanCong: calculatedBaseStats.baseSucTanCong,
    };
    
    newKb.discoveredYeuThu.push(newYeuThu);
    newVectorMetadata = { entityId: newYeuThu.id, entityType: 'yeuThu', text: formatYeuThuForEmbedding(newYeuThu) };

    systemMessages.push({
        id: `yeuthu-discovered-${newYeuThu.id}`,
        type: 'system',
        content: `Bạn đã phát hiện ra một yêu thú: ${name} (${species})!`,
        timestamp: Date.now(),
        turnNumber: turnForSystemMessages
    });

    const apiSettings = getApiSettings();
    const yeuThuIdToUpdate = newYeuThu.id; 

    if (apiSettings.autoGenerateNpcAvatars && !newYeuThu.avatarUrl) {
        systemMessages.push({
            id: `yeuthu-avatar-generating-${yeuThuIdToUpdate}`, type: 'system',
            content: `Đang tạo ảnh đại diện AI cho Yêu Thú ${newYeuThu.name}...`,
            timestamp: Date.now(), turnNumber: turnForSystemMessages
        });
        
        (async () => {
          let cloudinaryUrl: string | undefined;
          let avatarError: Error | undefined;
          let avatarPromptForGeneration = "";
          try {
            avatarPromptForGeneration = `Một bức ảnh chi tiết của một con yêu thú tên là ${newYeuThu.name}, loài ${newYeuThu.species}, trong thế giới ${newKb.worldConfig?.theme || 'fantasy'}. Mô tả: ${newYeuThu.description || ''} Phong cách: fantasy monster art, cinematic, high detail.`;
            
            if(logNpcAvatarPromptCallback) {
                logNpcAvatarPromptCallback(avatarPromptForGeneration);
            }
            const rawBase64ImageData = await generateImageUnified(avatarPromptForGeneration); 
            
            if (rawBase64ImageData) {
                cloudinaryUrl = await uploadImageToCloudinary(rawBase64ImageData, 'yeu_thu', `yeuthu_${yeuThuIdToUpdate}`);
            }
          } catch (err) {
            avatarError = err instanceof Error ? err : new Error(String(err));
            console.error(`Async avatar generation for YeuThu ${yeuThuIdToUpdate} failed:`, avatarError);
          } finally {
            setKnowledgeBaseDirectly(prevKb => {
                const newKbState = JSON.parse(JSON.stringify(prevKb));
                const targetYeuThu = newKbState.discoveredYeuThu.find((yt: YeuThu) => yt.id === yeuThuIdToUpdate);
                if (targetYeuThu) {
                    targetYeuThu.avatarUrl = cloudinaryUrl || MALE_AVATAR_PLACEHOLDER_URL;
                }
                return newKbState;
            });
          }
        })();
    } else if (!newYeuThu.avatarUrl) { 
         newYeuThu.avatarUrl = MALE_AVATAR_PLACEHOLDER_URL;
    }


    return { updatedKb: newKb, systemMessages, newVectorMetadata };
};

export const processYeuThuRemove = (
    currentKb: KnowledgeBase,
    tagParams: Record<string, string>,
    turnForSystemMessages: number
): { updatedKb: KnowledgeBase; systemMessages: GameMessage[] } => {
    const newKb = JSON.parse(JSON.stringify(currentKb)) as KnowledgeBase;
    const systemMessages: GameMessage[] = [];
    const name = tagParams.name;

    if (!name) {
        console.warn("YEUTHU_REMOVE: Missing name.", tagParams);
        return { updatedKb: newKb, systemMessages };
    }

    // Fuzzy matching logic
    let bestMatch = { yeuThu: null as YeuThu | null, index: -1, score: 0 };
    const normalizedName = normalizeStringForComparison(name);

    newKb.discoveredYeuThu.forEach((yt, index) => {
        const score = diceCoefficient(normalizedName, normalizeStringForComparison(yt.name));
        if (score > bestMatch.score) {
            bestMatch = { yeuThu: yt, index, score };
        }
    });

    if (bestMatch.yeuThu && bestMatch.score >= SIMILARITY_THRESHOLD) {
        newKb.discoveredYeuThu.splice(bestMatch.index, 1);
        systemMessages.push({
            id: `yeuthu-removed-${bestMatch.yeuThu.name.replace(/\s+/g, '-')}`,
            type: 'system',
            content: `Yêu thú ${bestMatch.yeuThu.name} đã bị tiêu diệt hoặc biến mất.`,
            timestamp: Date.now(),
            turnNumber: turnForSystemMessages
        });
    } else {
        console.warn(`YEUTHU_REMOVE: YeuThu "${name}" not found.`);
        // Optionally add a debug message for the user if it's helpful
        systemMessages.push({
            id: `yeuthu-remove-error-${Date.now()}`,
            type: 'system',
            content: `[DEBUG] Lỗi xóa Yêu Thú: Không tìm thấy Yêu Thú tên "${name}".`,
            timestamp: Date.now(),
            turnNumber: turnForSystemMessages
        });
    }

    return { updatedKb: newKb, systemMessages };
};