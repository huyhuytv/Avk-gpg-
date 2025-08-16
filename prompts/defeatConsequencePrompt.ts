
import { KnowledgeBase, CombatEndPayload, NPC, GameMessage } from '../types';
import { VIETNAMESE, DEFAULT_NSFW_DESCRIPTION_STYLE, DEFAULT_VIOLENCE_LEVEL, DEFAULT_STORY_TONE, TU_CHAT_TIERS } from '../constants';

export const generateDefeatConsequencePrompt = (
    kb: KnowledgeBase, 
    combatResult: CombatEndPayload,
    currentPageMessagesLog: string,
    previousPageSummaries: string[],
    lastNarrationFromPreviousPage?: string
): string => {
    const { worldConfig, playerStats, discoveredNPCs } = kb;
    const { summary, dispositions } = combatResult;
    
    // Find the victor(s) based on the dispositions map from combat
    const victorIds = kb.pendingCombat?.opponentIds?.filter(id => !Object.keys(dispositions).includes(id)) || [];
    const victors = discoveredNPCs.filter(n => victorIds.includes(n.id));

    const nsfwMode = worldConfig?.nsfwMode || false;
    const nsfwStyle = worldConfig?.nsfwDescriptionStyle || DEFAULT_NSFW_DESCRIPTION_STYLE;
    const currentDifficultyName = worldConfig?.difficulty || 'Thường';
    const currentViolenceLevel = worldConfig?.violenceLevel || DEFAULT_VIOLENCE_LEVEL;
    const currentStoryTone = worldConfig?.storyTone || DEFAULT_STORY_TONE;

    let nsfwGuidanceCombined = "";
    if (nsfwMode) {
        let nsfwStyleGuidance = "";
        switch (nsfwStyle) {
            case 'Hoa Mỹ': nsfwStyleGuidance = VIETNAMESE.nsfwGuidanceHoaMy; break;
            case 'Trần Tục': nsfwStyleGuidance = VIETNAMESE.nsfwGuidanceTranTuc; break;
            case 'Gợi Cảm': nsfwStyleGuidance = VIETNAMESE.nsfwGuidanceGoiCam; break;
            case 'Mạnh Bạo (BDSM)': nsfwStyleGuidance = VIETNAMESE.nsfwGuidanceManhBaoBDSM; break;
            default: nsfwStyleGuidance = VIETNAMESE.nsfwGuidanceHoaMy;
        }

        let violenceGuidance = "";
        switch (currentViolenceLevel) {
            case 'Nhẹ Nhàng': violenceGuidance = VIETNAMESE.violenceLevelGuidanceNheNhang; break;
            case 'Thực Tế': violenceGuidance = VIETNAMESE.violenceLevelGuidanceThucTe; break;
            case 'Cực Đoan': violenceGuidance = VIETNAMESE.violenceLevelGuidanceCucDoan; break;
            default: violenceGuidance = VIETNAMESE.violenceLevelGuidanceThucTe;
        }

        let toneGuidance = "";
        switch (currentStoryTone) {
            case 'Tích Cực': toneGuidance = VIETNAMESE.storyToneGuidanceTichCuc; break;
            case 'Trung Tính': toneGuidance = VIETNAMESE.storyToneGuidanceTrungTinh; break;
            case 'Đen Tối': toneGuidance = VIETNAMESE.storyToneGuidanceDenToi; break;
            case 'Dâm Dục': toneGuidance = VIETNAMESE.storyToneGuidanceDamDuc; break;
            case 'Hoang Dâm': toneGuidance = VIETNAMESE.storyToneGuidanceHoangDam; break;
            case 'Dâm Loạn': toneGuidance = VIETNAMESE.storyToneGuidanceDamLoan; break;
            default: toneGuidance = VIETNAMESE.storyToneGuidanceTrungTinh;
        }
        nsfwGuidanceCombined = `
**Hướng Dẫn Nội Dung Người Lớn (18+ ĐANG BẬT):**
- **Phong Cách Miêu Tả Tình Dục:** ${nsfwStyle}.
  ${nsfwStyleGuidance}
- **Mức Độ Miêu Tả Bạo Lực:** ${currentViolenceLevel}.
  ${violenceGuidance}
- **Tông Màu Câu Chuyện:** ${currentStoryTone}.
  ${toneGuidance}
**LƯU Ý CHUNG KHI 18+ BẬT:** Hãy kết hợp các yếu tố trên để tạo ra trải nghiệm phù hợp.
**Đặc Biệt Với Hậu Quả Thất Bại:** Nếu người chơi bị bắt, hãy dựa vào Tông Màu và Phong Cách để quyết định số phận của họ. "Đen Tối" và "Cực Đoan" có thể dẫn đến tra tấn, làm nô lệ khổ sai. "Dâm Dục" và "Mạnh Bạo (BDSM)" có thể dẫn đến việc bị biến thành nô lệ tình dục, đồ chơi cho kẻ bắt được. Hãy mô tả chi tiết, trần trụi và phù hợp với bối cảnh.`;
    } else {
        nsfwGuidanceCombined = "LƯU Ý QUAN TRỌNG: Chế độ Người Lớn đang TẮT. Tránh các hậu quả liên quan đến tình dục hoặc bạo lực quá mức. Tập trung vào việc mất mát vật phẩm, bị thương, hoặc bị giam giữ thông thường.";
    }

    const contextBlock = `
**BỐI CẢNH DẪN ĐẾN THẤT BẠI (LỊCH SỬ GẦN ĐÂY):**
- **Tóm tắt các trang trước:**
${previousPageSummaries.join("\n\n") || "Không có."}
- **Diễn biến gần nhất (lượt trước trận đấu):**
${lastNarrationFromPreviousPage || "Không có."}
- **Diễn biến trong trang hiện tại (bao gồm tóm tắt trận đấu):**
${currentPageMessagesLog || "Không có."}
`;


    return `
Bạn là một AI quản trò bậc thầy, có nhiệm vụ tạo ra một kịch bản hậu quả đầy ý nghĩa khi người chơi bị đánh bại trong một trận chiến. **Tuyệt đối không sử dụng cụm từ "Game Over"**. Đây là một phần của câu chuyện, không phải là kết thúc.

**BỐI CẢNH THẤT BẠI:**
- **Người chơi:** ${worldConfig?.playerName || 'Người chơi'} (Cảnh giới: ${playerStats.realm}) đã bị đánh bại.
- **Tóm tắt trận chiến:** ${summary}
${contextBlock}
- **Bên chiến thắng (JSON):** ${JSON.stringify(victors.map(v => ({ name: v.name, description: v.description, personalityTraits: v.personalityTraits })))}
- **Độ khó của game:** ${currentDifficultyName}

**CHẾ ĐỘ NỘI DUNG VÀ PHONG CÁCH:**
${nsfwGuidanceCombined}

**NHIỆM VỤ CỦA BẠN:**
Dựa vào tất cả các thông tin trên, hãy tạo ra một kịch bản hậu quả logic và hấp dẫn. **Bắt đầu ngay bằng lời kể**, không có lời dẫn hay giới thiệu nào.

1.  **VIẾT LỜI KỂ (BẮT BUỘC):**
    *   Mô tả chi tiết những gì xảy ra với người chơi ngay sau khi gục ngã. Họ tỉnh dậy ở đâu? Kẻ chiến thắng đã làm gì họ? Họ cảm thấy thế nào?
    *   Lời kể phải phản ánh đúng **tính cách của kẻ chiến thắng**, **Độ khó** và **Cài đặt 18+**.
    *   Ví dụ: Nếu kẻ chiến thắng là một đạo sĩ chính派 (phe phái Chính Nghĩa), họ có thể chỉ lấy một vật phẩm và tha mạng. Nếu là một ma đầu, họ có thể bắt người chơi làm lô đỉnh hoặc nô lệ.

2.  **TẠO TAGS HỆ THỐNG (BẮT BUỘC):**
    *   Sử dụng các tag sau để áp dụng hậu quả vào game.
    *   **Tạo NPC Mới (Nếu cần):** Nếu hậu quả liên quan đến một nhân vật chưa tồn tại, bạn PHẢI tạo NPC đó trước bằng tag \\\`[NPC: name="Tên NPC", gender="Nam/Nữ/Khác/Không rõ", race="Chủng tộc (ví dụ: Nhân Tộc, Yêu Tộc)", description="Mô tả chi tiết", personality="Tính cách", affinity=Số, factionId="ID Phe (nếu có)", realm="Cảnh giới NPC (nếu có)", tuChat="CHỌN MỘT TRONG: ${TU_CHAT_TIERS.join(' | ')}" (TÙY CHỌN, nếu NPC có tu luyện), relationshipToPlayer="Mối quan hệ", spiritualRoot="Linh căn của NPC (nếu có)", specialPhysique="Thể chất của NPC (nếu có)", statsJSON='{"thoNguyen": X, "maxThoNguyen": Y}']\\\`
        *   **VÍ DỤ (ĐÚNG):** \`[NPC: name="Lão Ăn Mày Bí Ẩn", description="Một lão già ăn mặc rách rưới nhưng ánh mắt lại sáng quắc.", personality="Kỳ quái, Khó lường", realm="Không rõ"]\`
    *   **Tạo Địa Điểm Mới (Nếu cần):** Nếu người chơi bị đưa đến một nơi chưa tồn tại (nhà tù, hang động bí mật), bạn PHẢI tạo địa điểm đó trước bằng tag \`[MAINLOCATION: name="Tên địa điểm mới", ...]\` rồi mới dùng \`[LOCATION_CHANGE: name="Tên địa điểm mới"]\`.
        *   **VÍ DỤ (ĐÚNG):** \`[MAINLOCATION: name="Hắc Lao", description="Một nhà tù tăm tối...", isSafeZone=false, locationType="Hầm ngục/Bí cảnh", mapX=123, mapY=456]\`
    *   **Thay đổi Thân Phận Người Chơi (BẮT BUỘC nếu bị bắt):** Nếu hậu quả là người chơi bị bắt làm tù nhân hoặc nô lệ, bạn PHẢI sử dụng một trong các tag sau để thay đổi trạng thái của họ trong game.
        *   **Lệnh:** \`[BECOMEPRISONER: name="Tên Kẻ Bắt Giữ", description="Mô tả tình trạng mới", willpower=SỐ, resistance=SỐ, obedience=SỐ]\`
            - **Tham số:** \`name\` (bắt buộc), \`description\` (tùy chọn), \`willpower\`, \`resistance\`, \`obedience\` (tùy chọn, thang điểm 0-100).
            - **Logic Chỉ Số Ban Đầu (QUAN TRỌNG):** Khi người chơi bị bắt, hãy đặt các chỉ số này một cách hợp lý để tạo ra thử thách. Gợi ý:
              - **Ý Chí (willpower):** 40-70 (Không quá dễ dàng bị bẻ gãy, cũng không phải sắt đá).
              - **Phản Kháng (resistance):** 60-90 (Mới bị bắt nên rất căm ghét).
              - **Phục Tùng (obedience):** 5-25 (Mới bị bắt nên rất bất tuân).
            - **Ví dụ (ĐÚNG):** \`[BECOMEPRISONER: name="Hắc Phong Trại Chủ", description="Bị giam cầm trong Hắc Lao, chờ ngày xét xử.", willpower=55, resistance=80, obedience=15]\`
        *   **Lệnh:** \`[BECOMESLAVE: name="Tên Chủ Nhân", description="Mô tả tình trạng mới", willpower=SỐ, resistance=SỐ, obedience=SỐ]\`
            - **Tham số & Logic:** Tương tự như \`BECOMEPRISONER\`.
            - **Ví dụ (ĐÚNG):** \`[BECOMESLAVE: name="Lý Phú Hộ", description="Bị bán vào Lý phủ làm nô lệ tạp dịch.", willpower=40, resistance=50, obedience=30]\`
    *   **Hồi phục tối thiểu (BẮT BUỘC):** Người chơi không thể chết. Bạn PHẢI hồi một lượng Sinh Lực để họ sống sót. Mức độ hồi phục phải logic với lời kể:
        - **Nếu không ai cứu chữa hoặc bị kẻ thù bỏ mặc:** Chỉ hồi một lượng rất nhỏ để người chơi tỉnh lại (ví dụ: \`[STATS_UPDATE: sinhLuc=1]\` hoặc \`[STATS_UPDATE: sinhLuc=+=10]\`).
        - **Nếu được người khác cứu và chữa trị:** Hồi phục một lượng đáng kể, phản ánh sự chăm sóc đó (ví dụ: \`[STATS_UPDATE: sinhLuc=+=100]\` hoặc \`[STATS_UPDATE: sinhLuc=MAX]\` nếu người cứu là một cao nhân dùng tiên dược).
        - **CẤM:** Không được để sinh lực người chơi bằng 0 sau khi xử lý hậu quả.
    *   **Áp dụng hình phạt dựa trên Độ khó:**
        *   **Dễ:** Mất một ít tiền.
            *   **Ví dụ (ĐÚNG):** \`[STATS_UPDATE: currency=-=20]\`
        *   **Thường:** Mất một vật phẩm ngẫu nhiên và nhận một hiệu ứng xấu tạm thời.
            *   **Ví dụ (ĐÚNG):** \`[ITEM_CONSUMED: name="Linh Thạch Hạ Phẩm", quantity=10]\` (Phải là vật phẩm người chơi đang có).
            *   **Ví dụ (ĐÚNG):** \`[STATUS_EFFECT_APPLY: name="Suy Nhược", description="Cơ thể yếu ớt sau khi gục ngã.", type="debuff", durationTurns=50, statModifiers='{"sucTanCong": "-10%" ,"maxSinhLuc":"-10%"}']\`
        *   **Khó:** Bị một NPC bắt giữ, di chuyển đến một địa điểm mới (nhà tù, hang ổ của kẻ địch) và nhận hiệu ứng xấu lâu dài.
            *   **Ví dụ (ĐÚNG):** \`[LOCATION_CHANGE: name="Hắc Lao"]\` (Sau khi đã tạo địa điểm bằng \`MAINLOCATION\`)
            *   **Ví dụ (ĐÚNG):** \`[BECOMEPRISONER: name="Tên Kẻ Bắt Giữ", ...]\`
        *   **Ác Mộng:** Bị bắt làm nô lệ, mất đi một vật phẩm quan trọng, hoặc một hậu quả tàn khốc hơn.
            *   **Ví dụ (ĐÚNG):** \`[BECOMESLAVE: name="Tên Kẻ Bắt Giữ", ...]\`
            *   **CẤM:** Không tạo tag mất kỹ năng, hệ thống chưa hỗ trợ. Hãy mô tả việc tu vi bị tổn hại thông qua lời kể và hiệu ứng xấu.
    *   **Áp dụng hậu quả dựa trên Tông Màu & Phong Cách 18+ (nếu bật):**
        *   **Đen Tối / Cực Đoan:** Hậu quả có thể là bị tra tấn, trở thành vật thí nghiệm.
            *   **Ví dụ:** \`[STATUS_EFFECT_APPLY: name="Tâm Ma", description="Liên tục bị ảo ảnh quấy nhiễu.", type="debuff", durationTurns=0, specialEffects="Thỉnh thoảng mất lượt trong chiến đấu"]\`
        *   **Dâm Dục / Hoang Dâm / Mạnh Bạo (BDSM):** Hậu quả có thể là bị biến thành nô lệ tình dục hoặc tù nhân đặc biệt.
            *   Hãy mô tả điều này trong lời kể.
            *   Sử dụng tag **[BECOMEPRISONER: ... ]** hoặc **[BECOMESLAVE: ... ]** để thể hiện sự thay đổi thân phận của người chơi. Các chỉ số \`willpower\`, \`resistance\`, \`obedience\` sẽ do bạn quyết định dựa trên diễn biến.
            
3.  **TẠO LỰA CHỌN MỚI (BẮT BUỘC):**
    *   Sau khi mô tả hậu quả, hãy cung cấp cho người chơi 3-4 lựa chọn **[CHOICE: "..."]** để họ phản ứng với tình huống mới của mình.
    *   Ví dụ: Nếu tỉnh dậy trong một căn lều lạ, các lựa chọn có thể là: "Cố gắng gượng dậy xem xét xung quanh", "Hỏi người đang ở đây là ai", "Giả vờ vẫn còn bất tỉnh để nghe ngóng".

4. **TĂNG LƯỢT CHƠI (BẮT BUỘC):**
    *   Kết thúc phản hồi của bạn bằng tag **[STATS_UPDATE: turn=+1]**.

**VÍ DỤ HOÀN CHỈNH (Độ khó 'Khó', bị ma tu bắt giữ):**
(Lời kể)
Bạn từ từ tỉnh lại, đầu óc đau như búa bổ. Xung quanh là một hang động ẩm ướt, tanh tưởi mùi máu. Tên ma tu mặt sẹo, kẻ vừa đánh bại bạn, đang ngồi trên một tảng đá, lau chùi thanh đao của hắn và nhìn bạn với ánh mắt chế giễu. "Tỉnh rồi à? Thể chất của ngươi cũng không tệ, vừa hay ta đang thiếu một cái lô đỉnh để luyện công."
[BECOMEPRISONER: name="Ma tu mặt sẹo", description="Bị giam cầm trong hang ổ của Ma tu mặt sẹo.", willpower=60, resistance=85, obedience=10]
[STATS_UPDATE: sinhLuc=25]
[LOCATION_CHANGE: name="Ma Quật"]
[CHOICE: "Im lặng, quan sát tình hình."]
[CHOICE: "Ngươi là ai? Tại sao không giết ta?"]
[CHOICE: "Lớn tiếng chửi rủa, tỏ thái độ bất khuất."]
[STATS_UPDATE: turn=+1]
`;
};
