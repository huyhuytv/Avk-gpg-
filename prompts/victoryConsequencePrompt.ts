
import { KnowledgeBase, CombatEndPayload, NPC, YeuThu, ItemCategoryValues, TU_CHAT_TIERS, GameMessage } from '../types';
import * as GameTemplates from '../templates';
import { STAT_POINT_VALUES, SPECIAL_EFFECT_KEYWORDS, WEAPON_TYPES_FOR_VO_Y } from '../constants';
import { CONG_PHAP_GRADES, LINH_KI_CATEGORIES, LINH_KI_ACTIVATION_TYPES, PROFESSION_GRADES } from '../templates';

// A local type to safely add entityType
type DefeatedEntity = (NPC | YeuThu) & { entityType: 'npc' | 'yeuThu' };

export const generateVictoryConsequencePrompt = (
    kb: KnowledgeBase, 
    combatResult: CombatEndPayload,
    currentPageMessagesLog: string,
    previousPageSummaries: string[],
    lastNarrationFromPreviousPage?: string
): string => {
    const { summary, dispositions, opponentIds } = combatResult;

    const allDefeatedEntities: DefeatedEntity[] = opponentIds
        .map(id => 
            (kb.discoveredNPCs.find(n => n.id === id) as NPC | undefined) || 
            (kb.discoveredYeuThu.find(y => y.id === id) as YeuThu | undefined)
        )
        .filter((e): e is NPC | YeuThu => e !== undefined)
        .map((e): DefeatedEntity => ({ ...e, entityType: 'species' in e ? 'yeuThu' : 'npc' })); // Add entityType and assert the new type


    const killedNpcs = allDefeatedEntities.filter(e => e.entityType === 'npc' && dispositions[e.id] === 'kill') as NPC[];
    const capturedNpcs = allDefeatedEntities.filter(e => e.entityType === 'npc' && dispositions[e.id] === 'capture') as NPC[];
    const releasedNpcs = allDefeatedEntities.filter(e => e.entityType === 'npc' && dispositions[e.id] === 'release') as NPC[];
    const defeatedBeasts = allDefeatedEntities.filter(e => e.entityType === 'yeuThu') as YeuThu[]; // Beasts are always "defeated"

    const itemTagInstructions = `
*   **Tag Vật Phẩm Nhận Được \`[ITEM_ACQUIRED: ...]\`:**
    *   **Tham số Bắt Buộc:** \`name\`, \`type\`, \`description\`, \`quantity\`, \`rarity\`, \`itemRealm\`.
    *   \`type\`: Phải bao gồm **Loại Chính** và **Loại Phụ** (nếu có).
        *   **Loại Chính Hợp Lệ:** ${Object.values(GameTemplates.ItemCategory).join(' | ')}.
        *   Nếu Loại Chính là \`${GameTemplates.ItemCategory.EQUIPMENT}\`, Loại Phụ (\`equipmentType\`) PHẢI là một trong: ${Object.values(GameTemplates.EquipmentType).join(' | ')}.
            *   **Tham số RIÊNG \`equipmentType\` cũng BẮT BUỘC**.
            *   **Tham số RIÊNG \`statBonusesJSON\` BẮT BUỘC** (nếu không có, dùng \`statBonusesJSON='{}'\`).
            *   **Tham số RIÊNG \`uniqueEffectsList\` BẮT BUỘC** (nếu không có, dùng \`uniqueEffectsList="Không có gì đặc biệt"\`).
        *   Nếu Loại Chính là \`${GameTemplates.ItemCategory.POTION}\`, Loại Phụ (\`potionType\`) PHẢI là một trong: ${Object.values(GameTemplates.PotionType).join(' | ')}.
            *   **Tham số RIÊNG \`potionType\` cũng BẮT BUỘC**.
            *   **Tham số RIÊNG \`effectsList\` BẮT BUỘC**.
        *   Nếu Loại Chính là \`${GameTemplates.ItemCategory.MATERIAL}\`, Loại Phụ (\`materialType\`) PHẢI là một trong: ${Object.values(GameTemplates.MaterialType).join(' | ')}.
            *   **Tham số RIÊNG \`materialType\` cũng BẮT BUỘC**.
    *   \`itemRealm\`: BẮT BUỘC. Cảnh giới của vật phẩm. PHẢI là một trong các cảnh giới lớn của thế giới: \`${kb.realmProgressionList.join(' | ')}\`.
    `;

    const contextBlock = `
**BỐI CẢNH DẪN ĐẾN TRẬN ĐẤU (LỊCH SỬ GẦN ĐÂY):**
- **Tóm tắt các trang trước:**
${previousPageSummaries.join("\n\n") || "Không có."}
- **Diễn biến gần nhất (lượt trước trận đấu):**
${lastNarrationFromPreviousPage || "Không có."}
- **Diễn biến trong trang hiện tại (bao gồm tóm tắt trận đấu):**
${currentPageMessagesLog || "Không có."}
`;


    const promptText = `
Bạn là một AI quản trò, có nhiệm vụ kể lại hậu quả sau một trận chiến mà người chơi đã chiến thắng.

**TÓM TẮT TRẬN CHIẾN:**
${summary}

${contextBlock}

**QUYẾT ĐỊNH CỦA NGƯỜI CHƠI SAU TRẬN ĐẤU:**
- **Kết liễu:** ${killedNpcs.length > 0 ? killedNpcs.map(n => `${n.name} (${n.realm})`).join(', ') : 'Không có ai.'}
- **Bắt giữ:** ${capturedNpcs.length > 0 ? capturedNpcs.map(n => `${n.name} (${n.realm})`).join(', ') : 'Không có ai.'}
- **Thả đi:** ${releasedNpcs.length > 0 ? releasedNpcs.map(n => n.name).join(', ') : 'Không có ai.'}
- **Yêu thú đã bị đánh bại:** ${defeatedBeasts.length > 0 ? defeatedBeasts.map(b => `${b.name} (${b.species}, ${b.realm})`).join(', ') : 'Không có.'}

**YÊU CẦU DÀNH CHO BẠN (AI):**
Hãy viết một đoạn văn kể lại chi tiết những gì xảy ra tiếp theo, và sử dụng các tag hệ thống sau để cập nhật trạng thái game.

1.  **VIẾT LỜI KỂ (BẮT BUỘC):**
    *   Mô tả cảnh người chơi xử lý các đối thủ theo quyết định của họ.
    *   Mô tả việc thu thập chiến lợi phẩm từ những kẻ bị giết.
    *   Kể về cảm xúc của người chơi hoặc bất kỳ diễn biến nào sau trận chiến (ví dụ: một người qua đường chứng kiến, hoặc tìm thấy một vật phẩm lạ trên người kẻ địch).

2.  **TẠO TAGS HỆ THỐNG (BẮT BUỘC):**
    *   **Với mỗi NPC bị giết:** Sử dụng tag \`[NPC_REMOVE: name="Tên NPC"]\` VÀ tạo ra các tag \`[ITEM_ACQUIRED: ...]\` cho chiến lợi phẩm. **Chất lượng và số lượng vật phẩm phải tỉ lệ thuận với cảnh giới của NPC**, có một xác suất nhỏ rơi ra đồ hiếm.
    *   **Với mỗi NPC bị bắt giữ:** Sử dụng tag \`[PRISONER_ADD: ...]\`. Hãy điền các chỉ số \`willpower\`, \`resistance\`, \`obedience\` một cách hợp lý.
    *   **Với mỗi Yêu Thú bị giết:** Sử dụng tag \`[YEUTHU_REMOVE: name="Tên Yêu Thú"]\` VÀ tạo ra các tag \`[ITEM_ACQUIRED: ...]\` cho nguyên liệu (như yêu đan, da, xương).
    *   **KHÔNG tạo tag** cho những NPC được thả đi.

3.  **HƯỚN DẪN TAG VẬT PHẨM:**
    ${itemTagInstructions}

4.  **TẠO LỰA CHỌN MỚI (BẮT BUỘC):**
    *   Sau khi mô tả xong hậu quả, cung cấp 3-4 lựa chọn \`[CHOICE: "..."]\` để người chơi tiếp tục cuộc phiêu lưu.

5.  **TĂNG LƯỢT CHƠI (BẮT BUỘC):**
    *   Kết thúc phản hồi của bạn bằng tag **[STATS_UPDATE: turn=+1]**.

**VÍ DỤ (Người chơi giết 1 tên cướp, bắt giữ tên còn lại):**
(Lời kể bạn viết ra sẽ nằm ở đây)
Bạn lạnh lùng kết liễu tên cướp đã gục ngã, thu lại túi tiền và một tấm bản đồ cũ kỹ từ trên người hắn. Tên còn lại run rẩy xin tha, bạn quyết định trói hắn lại và áp giải về.
[NPC_REMOVE: name="Tên Cướp Bị Giết"]
[ITEM_ACQUIRED: name="Túi Tiền Nặng Trịch", type="Miscellaneous", description="Một túi tiền chứa đầy đồng bạc.", quantity=1, rarity="Phổ Thông", value=150, itemRealm="Phàm Nhân"]
[ITEM_ACQUIRED: name="Bản Đồ Da Dê Cũ", type="QuestItem", description="Một tấm bản đồ vẽ một địa điểm bí ẩn.", quantity=1, rarity="Hiếm", value=50, itemRealm="Phàm Nhân"]
[PRISONER_ADD: name="Tên Cướp Sống Sót", description="Một tên cướp nhát gan bị bắt giữ.", willpower=30, resistance=50, obedience=40, affinity=-50]
[CHOICE: "Kiểm tra tấm bản đồ vừa nhặt được."]
[CHOICE: "Tra hỏi tên tù binh về địa điểm trên bản đồ."]
[CHOICE: "Rời khỏi nơi này và tìm một chỗ nghỉ ngơi."]
[STATS_UPDATE: turn=+1]
`;
    return promptText;
};
