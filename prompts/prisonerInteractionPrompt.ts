
import { KnowledgeBase, Prisoner } from '../types';
import { VIETNAMESE, DEFAULT_NSFW_DESCRIPTION_STYLE, DEFAULT_VIOLENCE_LEVEL, DEFAULT_STORY_TONE } from '../constants';

export const generatePrisonerInteractionPrompt = (
    kb: KnowledgeBase, 
    prisoner: Prisoner, 
    action: string,
    currentPageMessagesLog: string,
    previousPageSummaries: string[],
    lastNarrationFromPreviousPage?: string
): string => {
    const { worldConfig, playerStats } = kb;
    const nsfwMode = worldConfig?.nsfwMode || false;
    const nsfwStyle = worldConfig?.nsfwDescriptionStyle || DEFAULT_NSFW_DESCRIPTION_STYLE;
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
**Đặc Biệt Với Tù Nhân:** Khi tương tác tình dục với tù nhân, hãy để họ và người chơi sử dụng nhiều lời nói dâm đãng, tục tĩu, và tiếng rên rỉ hơn. Thể hiện sự thống trị của người chơi và sự phục tùng (hoặc miễn cưỡng) của tù nhân qua lời nói. Mức độ tục tĩu phải phù hợp với phong cách đã chọn.
**YÊU CẦU ĐẶC BIỆT VỀ CẢNH TÌNH DỤC (QUAN TRỌNG):** Khi miêu tả các cảnh quan hệ tình dục, hãy viết một cách **CHI TIẾT, DÀI và MẠNH BẠO** hơn. Đừng ngần ngại đi sâu vào các hành vi thể xác, mô tả cường độ, sự thô bạo (nếu phù hợp với bối cảnh và tông màu), và những cảm xúc mãnh liệt của nhân vật. Tập trung vào sự tương tác vật lý, những âm thanh, và sức mạnh trong từng hành động. Hãy để các cảnh này kéo dài và có sự leo thang về cường độ.`;
    } else {
        nsfwGuidanceCombined = "LƯU Ý QUAN TRỌNG: Chế độ Người Lớn đang TẮT. Tiếp tục duy trì nội dung phù hợp với mọi lứa tuổi, tập trung vào phiêu lưu và phát triển nhân vật. Tránh các chủ đề nhạy cảm, bạo lực quá mức hoặc tình dục.";
    }
    
    return `
Bạn là một AI kể chuyện chuyên về các tương tác phức tạp với nhân vật trong một thế giới game.
Người chơi đang tương tác với một tù nhân.

**BỐI CẢNH TOÀN DIỆN:**
- **Thế Giới:** Chủ đề "${worldConfig?.theme}", thể loại "${worldConfig?.genre}".
- **Địa điểm:** "${currentLocation?.name || 'Ngục tối'}"
- **Người chơi:**
  - Tên: ${worldConfig?.playerName || 'Người chơi'}
  - Cảnh giới: ${kb.playerStats.realm}
  - Tính cách: ${worldConfig?.playerPersonality || 'Không rõ'}
  - Mục tiêu: ${worldConfig?.playerGoal || 'Không rõ'}
- **Tù nhân:** ${prisoner.name}
  - Mô tả: ${prisoner.description}
  - Chủng tộc: ${prisoner.race || 'Không rõ'}
  - Cảnh giới: ${prisoner.realm}
  - Các chỉ số quan trọng (thang điểm 0-100):
    - Thiện cảm với người chơi: ${prisoner.affinity}
    - Ý chí (Mức độ kiên cường): ${prisoner.willpower}
    - Phản kháng (Mức độ thù địch): ${prisoner.resistance}
    - Phục tùng (Mức độ nghe lời): ${prisoner.obedience}
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
Hiện tại người chơi đang ở độ khó: **${currentDifficultyName}**. Hãy điều chỉnh kết quả tương tác (ví dụ, mức độ thay đổi ý chí, phản kháng, phục tùng) và phản ứng của tù nhân một cách hợp lý với độ khó này.

**CHẾ ĐỘ NỘI DUNG VÀ PHONG CÁCH:**
${nsfwGuidanceCombined}

**NHIỆM VỤ CỦA BẠN (AI):**
1.  **VIẾT LỜI KỂ:**
    *   Mô tả chi tiết và hợp lý kết quả của hành động "${action}".
    *   Phản ứng của tù nhân (${prisoner.name}) phải dựa trên các chỉ số của họ (Thiện cảm, Ý chí, Phản kháng, Phục tùng).
    *   Nếu hành động thành công (ví dụ: tra hỏi được thông tin, thuyết phục thành công), hãy mô tả điều đó.
    *   Nếu hành động thất bại (ví dụ: bị chống đối, bị lừa), hãy mô tả hậu quả.
    *   Nếu chế độ 18+ BẬT và hành động mang tính chất tình dục, hãy mô tả cảnh đó theo phong cách "${nsfwStyle}" đã được chỉ định.

2.  **TẠO TAG CẬP NHẬT (QUAN TRỌNG):**
    *   Dựa trên kết quả lời kể, hãy tạo tag **[PRISONER_UPDATE: ...]** để cập nhật lại các chỉ số của tù nhân.
    *   **Tham số hợp lệ:** \`name="${prisoner.name}"\`, \`affinity\`, \`willpower\`, \`resistance\`, \`obedience\`.
    *   Sử dụng thay đổi tương đối (ví dụ: \`affinity="+=5"\`, \`resistance="-=10"\`).
    *   **HƯỚN DẪN THAY ĐỔI CHỈ SỐ:**
       *   **Thiện Cảm (affinity):** Tăng khi người chơi có hành động tử tế (cho ăn, chữa trị, trò chuyện ôn hòa, tặng quà). Giảm mạnh khi bị tra tấn, sỉ nhục.
       *   **Phục Tùng (obedience):** Tăng khi người chơi thể hiện quyền lực một cách hiệu quả (trừng phạt nhẹ nhàng, huấn luyện có thưởng phạt rõ ràng). Giảm nếu tù nhân thấy người chơi yếu đuối hoặc nếu sự phản kháng của họ tăng cao.
       *   **Phản Kháng (resistance):** CHỈ tăng lên đáng kể khi người chơi có hành động tàn bạo, thô bạo quá mức. Sẽ giảm dần khi được đối xử tốt hoặc khi ý chí bị bẻ gãy.
       *   **Ý Chí (willpower):** CHỈ giảm khi người chơi thực hiện các hành động tra tấn tâm lý hoặc thể xác một cách tàn nhẫn, kéo dài, khiến tù nhân mất đi hy vọng hoặc nhân phẩm. Các hành động tử tế hoặc trừng phạt thông thường KHÔNG nên ảnh hưởng nhiều đến ý chí.
    *   **CẤM TUYỆT ĐỐI:** Chỉ được phép sử dụng tag \`[PRISONER_UPDATE: ...]\`. Không được tạo ra bất kỳ tag nào khác như \`[ITEM_ACQUIRED]\`, \`[SKILL_LEARNED]\`, \`[QUEST_ASSIGNED]\`, \`[STATS_UPDATE]\`, \`[CHOICE]\`, v.v. trong phản hồi này. Mọi thay đổi khác phải được diễn tả trong lời kể.

3.  **QUY TẮC:**
    *   KHÔNG sử dụng tag [CHOICE: ...].
    *   KHÔNG sử dụng tag [STATS_UPDATE: turn=+1]. Lượt chơi không tăng trong màn hình này.

**VÍ DỤ (Hành động: "Đưa cho hắn một ít thức ăn và nước uống sạch"):**
(Lời kể bạn viết ra sẽ nằm ở đây)
${prisoner.name} cảnh giác nhìn bát cháo nóng và bình nước trong bạn đưa tới. Sau một hồi do dự, cơn đói đã chiến thắng. Hắn ngấu nghiến ăn sạch, ánh mắt nhìn bạn bớt đi vài phần thù địch, dù vẫn không nói một lời.
[PRISONER_UPDATE: name="${prisoner.name}", affinity="+=5", resistance="-=2"]
`;
};
