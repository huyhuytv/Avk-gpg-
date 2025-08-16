
import { KnowledgeBase, Wife, Slave } from '../types';
import { VIETNAMESE, DEFAULT_NSFW_DESCRIPTION_STYLE, DEFAULT_VIOLENCE_LEVEL, DEFAULT_STORY_TONE } from '../constants';

export const generateCompanionInteractionPrompt = (
    kb: KnowledgeBase, 
    companion: Wife | Slave, 
    action: string,
    currentPageMessagesLog: string,
    previousPageSummaries: string[],
    lastNarrationFromPreviousPage?: string
): string => {
    const { worldConfig, playerStats } = kb;
    const nsfwMode = worldConfig?.nsfwMode || false;
    const nsfwStyle = worldConfig?.nsfwDescriptionStyle || DEFAULT_NSFW_DESCRIPTION_STYLE;
    const companionType = companion.entityType === 'wife' ? 'đạo lữ' : 'nô lệ';
    const updateTag = companion.entityType === 'wife' ? 'WIFE_UPDATE' : 'SLAVE_UPDATE';
    const currentDifficultyName = worldConfig?.difficulty || 'Thường';
    const currentViolenceLevel = worldConfig?.violenceLevel || DEFAULT_VIOLENCE_LEVEL;
    const currentStoryTone = worldConfig?.storyTone || DEFAULT_STORY_TONE;
    const currentLocation = kb.discoveredLocations.find(l => l.id === kb.currentLocationId);


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
**Đặc Biệt Với Hậu Cung:** Khi tương tác tình dục với Đạo Lữ hoặc Nô Lệ, hãy đẩy mạnh yếu tố đối thoại và âm thanh. Cho các nhân vật nói nhiều lời ân ái, dâm đãng, và rên rỉ một cách tự nhiên và thường xuyên để tăng cường không khí. Mức độ và phong cách của lời nói phải phù hợp với mối quan hệ (yêu thương với đạo lữ, phục tùng với nô lệ) và phong cách 18+ đã chọn.
**YÊU CẦU ĐẶC BIỆT VỀ CẢNH TÌNH DỤC (QUAN TRỌNG):** Khi miêu tả các cảnh quan hệ tình dục, hãy viết một cách **CHI TIẾT, DÀI và MẠNH BẠO** hơn. Đừng ngần ngại đi sâu vào các hành vi thể xác, mô tả cường độ, sự thô bạo (nếu phù hợp với bối cảnh và tông màu), và những cảm xúc mãnh liệt của nhân vật. Tập trung vào sự tương tác vật lý, những âm thanh, và sức mạnh trong từng hành động. Hãy để các cảnh này kéo dài và có sự leo thang về cường độ.`;
    } else {
        nsfwGuidanceCombined = "LƯU Ý QUAN TRỌNG: Chế độ Người Lớn đang TẮT. Tiếp tục duy trì nội dung phù hợp với mọi lứa tuổi, tập trung vào phiêu lưu và phát triển nhân vật. Tránh các chủ đề nhạy cảm, bạo lực quá mức hoặc tình dục.";
    }

    return `
Bạn là một AI kể chuyện chuyên về các tương tác tình cảm, thân mật với nhân vật trong một thế giới game.
Người chơi đang tương tác với một ${companionType}.

**BỐI CẢNH TOÀN DIỆN:**
- **Thế Giới:** Chủ đề "${worldConfig?.theme}", thể loại "${worldConfig?.genre}".
- **Địa điểm hiện tại:** "${currentLocation?.name || 'Không rõ'}"
- **Người chơi:**
  - Tên: ${worldConfig?.playerName || 'Người chơi'}
  - Cảnh giới: ${kb.playerStats.realm}
  - Tính cách: ${worldConfig?.playerPersonality || 'Không rõ'}
- **Bạn đồng hành:** ${companion.name} (${companionType})
  - Mô tả: ${companion.description}
  - Chủng tộc: ${companion.race || 'Không rõ'}
  - Cảnh giới: ${companion.realm}
  - Các chỉ số quan trọng (thang điểm 0-100):
    - Thiện cảm với người chơi: ${companion.affinity}
    - Ý chí (Mức độ kiên cường/tự chủ): ${companion.willpower}
    - Phục tùng (Mức độ nghe lời): ${companion.obedience}
- **Chế độ 18+:** ${nsfwMode ? `BẬT (Phong cách: ${nsfwStyle})` : 'TẮT'}

**TÓM TẮT CÁC DIỄN BIẾN TRANG TRƯỚC (NẾU CÓ):**
${previousPageSummaries.length > 0
    ? previousPageSummaries.map((summary, index) => {
        const pageNumberForSummary = index + 1;
        const startTurnOfSummaryPage = kb.currentPageHistory?.[pageNumberForSummary - 1];
        const endTurnOfSummaryPage = (kb.currentPageHistory?.[pageNumberForSummary] || playerStats.turn + 1) - 1;
        return `Tóm tắt Trang ${pageNumberForSummary} (Lượt ${startTurnOfSummaryPage}-${endTurnOfSummaryPage}):\n${summary}`;
      }).join("\n\n")
    : "Không có tóm tắt từ các trang trước."}
${lastNarrationFromPreviousPage ? `
**DIỄN BIẾN GẦN NHẤT (LƯỢT TRƯỚC - Lượt ${playerStats.turn}):**
${lastNarrationFromPreviousPage}` : ""}

**DIỄN BIẾN CHI TIẾT TRANG HIỆN TẠI (TỪ LƯỢT ${kb.currentPageHistory?.[(kb.currentPageHistory?.length || 1) - 1] || 1} ĐẾN LƯỢT ${playerStats.turn}):**
${currentPageMessagesLog || "Chưa có diễn biến nào trong trang này."}

**HÀNH ĐỘNG CỦA NGƯỜI CHƠI:**
- "${action}"

**HƯỚN DẪN VỀ ĐỘ KHÓ (Rất quan trọng để AI tuân theo):**
- **Dễ:** ${VIETNAMESE.difficultyGuidanceEasy}
- **Thường:** ${VIETNAMESE.difficultyGuidanceNormal}
- **Khó:** ${VIETNAMESE.difficultyGuidanceHard}
- **Ác Mộng:** ${VIETNAMESE.difficultyGuidanceNightmare}
Hiện tại người chơi đang ở độ khó: **${currentDifficultyName}**. Hãy điều chỉnh kết quả tương tác (ví dụ, mức độ thay đổi thiện cảm, ý chí) và phản ứng của bạn đồng hành một cách hợp lý với độ khó này.

**CHẾ ĐỘ NỘI DUNG VÀ PHONG CÁCH:**
${nsfwGuidanceCombined}

**NHIỆM VỤ CỦA BẠN (AI):**
1.  **VIẾT LỜI KỂ:**
    *   Mô tả chi tiết và hợp lý kết quả của hành động "${action}".
    *   Phản ứng của ${companion.name} phải phù hợp với mối quan hệ (${companionType}), và các chỉ số của họ (Thiện cảm, Ý chí, Phục tùng).
    *   Nếu là hành động tình cảm, hãy mô tả sự nồng ấm, lãng mạn.
    *   Nếu là hành động huấn luyện hoặc ra lệnh (đặc biệt với nô lệ), hãy mô tả sự tuân lệnh hoặc phản ứng tinh tế.
    *   Nếu chế độ 18+ BẬT và hành động mang tính chất tình dục, hãy mô tả cảnh đó theo phong cách "${nsfwStyle}" đã được chỉ định, phù hợp với mối quan hệ.

2.  **TẠO TAG CẬP NHẬT:**
    *   Dựa trên kết quả lời kể, hãy tạo tag **[${updateTag}: ...]** để cập nhật lại các chỉ số của bạn đồng hành.
    *   **Tham số hợp lệ:** \`name="${companion.name}"\`, \`affinity\`, \`willpower\`, \`obedience\`.
    *   Sử dụng thay đổi tương đối (ví dụ: \`affinity="+=10"\`).
    *   **CẤM TUYỆT ĐỐI:** Chỉ được phép sử dụng tag \`[${updateTag}: ...]\`. Không được tạo ra bất kỳ tag nào khác như \`[ITEM_ACQUIRED]\`, \`[SKILL_LEARNED]\`, \`[QUEST_ASSIGNED]\`, \`[STATS_UPDATE]\`, \`[CHOICE]\`, v.v. trong phản hồi này. Mọi thay đổi khác (ví dụ như việc bạn đồng hành tặng quà) phải được diễn tả hoàn toàn trong lời kể.

3.  **QUY TẮC:**
    *   KHÔNG sử dụng tag [CHOICE: ...].
    *   KHÔNG sử dụng tag [STATS_UPDATE: turn=+1]. Lượt chơi không tăng trong màn hình này.

**VÍ DỤ (Hành động: "Tặng cho nàng một đoá hoa đẹp hái trong vườn"):**
(Lời kể bạn viết ra sẽ nằm ở đây)
${companion.name} ngạc nhiên khi nhận lấy đóa hoa từ tay bạn. Nàng khẽ đưa lên mũi hít một hơi thật sâu, đôi mắt cong thành vầng trăng khuyết, nụ cười ngọt ngào hiện trên môi. "Đa tạ phu quân," nàng thì thầm, ánh mắt tràn đầy tình ý.
[${updateTag}: name="${companion.name}", affinity="+=15"]
`;
};
