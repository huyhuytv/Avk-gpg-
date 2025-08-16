

import { KnowledgeBase, Skill, NPC, Wife, Slave } from '../types';
import * as GameTemplates from '../templates';
import { VIETNAMESE, DEFAULT_NSFW_DESCRIPTION_STYLE, DEFAULT_VIOLENCE_LEVEL, DEFAULT_STORY_TONE } from '../constants';

export const generateCultivationSessionPrompt = (
    kb: KnowledgeBase,
    cultivationType: 'skill' | 'method',
    duration: number, // in turns
    currentPageMessagesLog: string,
    previousPageSummaries: string[],
    lastNarrationFromPreviousPage?: string,
    skill?: Skill, // for skill cultivation
    method?: Skill, // for method cultivation. It's also of type Skill
    partner?: NPC | Wife | Slave // for dual cultivation
): string => {
    const { playerStats, worldConfig } = kb;
    const isNsfw = worldConfig?.nsfwMode || false;
    const nsfwStyle = worldConfig?.nsfwDescriptionStyle || DEFAULT_NSFW_DESCRIPTION_STYLE;
    const currentDifficultyName = worldConfig?.difficulty || 'Thường';
    const currentViolenceLevel = worldConfig?.violenceLevel || DEFAULT_VIOLENCE_LEVEL;
    const currentStoryTone = worldConfig?.storyTone || DEFAULT_STORY_TONE;
    const currentLocation = kb.discoveredLocations.find(l => l.id === kb.currentLocationId);

    let difficultyGuidanceText = "";
    switch (currentDifficultyName) {
        case 'Dễ': difficultyGuidanceText = VIETNAMESE.difficultyGuidanceEasy; break;
        case 'Thường': difficultyGuidanceText = VIETNAMESE.difficultyGuidanceNormal; break;
        case 'Khó': difficultyGuidanceText = VIETNAMESE.difficultyGuidanceHard; break;
        case 'Ác Mộng': difficultyGuidanceText = VIETNAMESE.difficultyGuidanceNightmare; break;
        default: difficultyGuidanceText = VIETNAMESE.difficultyGuidanceNormal;
    }

    let nsfwGuidanceCombined = "";
    if (isNsfw) {
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
**YÊU CẦU ĐẶC BIỆT VỀ CẢNH TÌNH DỤC (QUAN TRỌNG):** Khi miêu tả các cảnh quan hệ tình dục, hãy viết một cách **CHI TIẾT, DÀI và MẠNH BẠO** hơn. Đừng ngần ngại đi sâu vào các hành vi thể xác, mô tả cường độ, sự thô bạo (nếu phù hợp với bối cảnh và tông màu), và những cảm xúc mãnh liệt của nhân vật. Tập trung vào sự tương tác vật lý, những âm thanh, và sức mạnh trong từng hành động. Hãy để các cảnh này kéo dài và có sự leo thang về cường độ.`;
    } else {
        nsfwGuidanceCombined = "LƯU Ý QUAN TRỌNG: Chế độ Người Lớn đang TẮT. Tiếp tục duy trì nội dung phù hợp với mọi lứa tuổi, tập trung vào phiêu lưu và phát triển nhân vật. Tránh các chủ đề nhạy cảm, bạo lực quá mức hoặc tình dục.";
    }


    let header = `Bạn là một AI kể chuyện, chuyên mô tả lại quá trình tu luyện của nhân vật trong một thế giới tu tiên.`;
    let mainRequest = '';
    let successFactors = `- Cảnh giới của người chơi (${playerStats.realm})\n- Linh căn của người chơi (${playerStats.spiritualRoot})\n- Thể chất của người chơi (${playerStats.specialPhysique})\n- May mắn`;
    let failureFactors = `- Tâm ma quấy nhiễu\n- Vận rủi`;
    let partnerUpdateTag = '';

    if (cultivationType === 'skill') {
        header += ` Người chơi đang cố gắng tu luyện để tăng độ thuần thục của một Linh Kĩ.`;
        mainRequest = `**YÊU CẦU:**
- **Mục tiêu:** Tăng độ thuần thục cho Linh Kĩ: **${skill?.name || 'Không rõ'}**.
- **Mô tả kỹ năng:** ${skill?.description || 'Không rõ'}.
- **Độ thuần thục hiện tại:** ${skill?.proficiencyTier || 'Sơ Nhập'} (${skill?.proficiency || 0} / ${skill?.maxProficiency || 100}).
- **Thời gian tu luyện:** ${duration} ngày. Thời gian trong game được tính theo lịch: 1 năm có 12 tháng, 1 tháng có 30 ngày. Khi ngày vượt quá 30, nó sẽ quay về 1 và tháng tăng lên. Khi tháng vượt quá 12, nó sẽ quay về 1 và năm tăng lên.
`;
        successFactors += `\n- Ngộ tính của nhân vật\n- Sự phù hợp của kỹ năng với thuộc tính của nhân vật`;
        failureFactors += `\n- Kỹ năng quá cao thâm, khó lĩnh ngộ`;
    } else { // 'method'
        if (partner && method?.congPhapDetails?.type === GameTemplates.CongPhapType.SONG_TU) {
            header += ` Người chơi đang tiến hành Song Tu với một đạo hữu để cùng nhau nâng cao tu vi.`;
            mainRequest = `**YÊU CẦU:**
- **Mục tiêu:** Tăng tiến tu vi (Kinh nghiệm) thông qua Song Tu.
- **Công pháp sử dụng:** ${method.name} (Phẩm chất: ${method.congPhapDetails?.grade || 'Không rõ'}).
- **Thời gian song tu:** ${duration} ngày.
- **Bạn đồng tu:**
  - Tên: ${partner.name}
  - Thân phận: ${('entityType' in partner && partner.entityType) ? (partner.entityType === 'wife' ? 'Đạo lữ' : 'Nô lệ') : 'NPC'}
  - Cảnh giới: ${partner.realm}
  - Tư chất: ${partner.tuChat || 'Không rõ'}
  - Thiện cảm: ${partner.affinity}
  - Ý chí: ${('willpower' in partner) ? partner.willpower : 'Không rõ'}
  - Phục tùng: ${('obedience' in partner) ? partner.obedience : 'Không rõ'}
  - Mô tả: ${partner.description}
`;
            successFactors += `\n- Phẩm chất công pháp (${method.congPhapDetails?.grade || 'Không rõ'})\n- Mức độ thiện cảm với bạn đồng tu (${partner.affinity})\n- Sự tương hợp trong công pháp và cảnh giới giữa hai người\n- Tư chất của bạn đồng tu (${partner.tuChat || 'Không rõ'})`;
            failureFactors += `\n- Mâu thuẫn, thiếu tin tưởng với bạn đồng tu.\n- Công pháp vận hành sai lệch.`;
            
            if ('entityType' in partner && partner.entityType) {
                if (partner.entityType === 'wife') {
                    partnerUpdateTag = 'WIFE_UPDATE';
                } else if (partner.entityType === 'slave') {
                    partnerUpdateTag = 'SLAVE_UPDATE';
                }
            } else {
                partnerUpdateTag = 'NPC_UPDATE';
            }
        } else {
            header += ` Người chơi đang bế quan để đột phá cảnh giới.`;
            mainRequest = `**YÊU CẦU:**
- **Mục tiêu:** Tăng tiến tu vi (Kinh nghiệm) thông qua Bế Quan Tu Luyện.
- **Công pháp sử dụng:** ${method?.name || 'Không có công pháp chính'} (Phẩm chất: ${method?.congPhapDetails?.grade || 'Không rõ'}).
- **Thời gian bế quan:** ${duration} ngày.
`;
            successFactors += `\n- Phẩm chất của công pháp tu luyện (${method?.congPhapDetails?.grade || 'Không rõ'})\n- Nơi bế quan có linh khí dồi dào`;
            failureFactors += `\n- Nơi bế quan linh khí mỏng manh, bị quấy nhiễu`;
        }
    }
    
    const contextBlock = `
**BỐI CẢNH HỘI THOẠI (LỊCH SỬ GẦN ĐÂY):**
- **Tóm tắt các trang trước:**
${previousPageSummaries.length > 0 ? previousPageSummaries.join("\n\n") : "Không có."}
- **Diễn biến gần nhất (lượt trước):**
${lastNarrationFromPreviousPage || "Không có."}
- **Diễn biến chi tiết trang hiện tại:**
${currentPageMessagesLog || "Không có."}
`;


    return `
${header}

**BỐI CẢNH TOÀN DIỆN:**
- **Thế Giới:** Chủ đề "${worldConfig?.theme}", thể loại "${worldConfig?.genre}".
- **Người chơi:**
    - Tên: ${worldConfig?.playerName || 'Người chơi'}
    - Cảnh giới: ${playerStats.realm}
    - Chỉ số: Sinh lực ${playerStats.sinhLuc}/${playerStats.maxSinhLuc}, Linh lực ${playerStats.linhLuc}/${playerStats.maxLinhLuc}.
    - Thiên Phú: Linh căn "${playerStats.spiritualRoot}", Thể chất "${playerStats.specialPhysique}".
    - Trạng thái: ${playerStats.activeStatusEffects.map(e => e.name).join(', ') || 'Không có hiệu ứng đặc biệt.'}
- **Hoàn cảnh:**
    - Địa điểm tu luyện: "${currentLocation?.name || 'Không rõ'}" (Đặc tính an toàn: ${currentLocation?.isSafeZone}). Mô tả: ${currentLocation?.description || ''}
    - Nhiệm vụ đang làm: ${kb.allQuests.filter(q => q.status === 'active').map(q => q.title).join(', ') || 'Không có.'}
- **Các yếu tố ảnh hưởng đến thành công:**
${successFactors}
- **Các yếu tố ảnh hưởng đến thất bại:**
${failureFactors}

${contextBlock}
${mainRequest}

**HƯỚN DẪN VỀ ĐỘ KHÓ (Rất quan trọng để AI tuân theo):**
- **Dễ:** ${VIETNAMESE.difficultyGuidanceEasy}
- **Thường:** ${VIETNAMESE.difficultyGuidanceNormal}
- **Khó:** ${VIETNAMESE.difficultyGuidanceHard}
- **Ác Mộng:** ${VIETNAMESE.difficultyGuidanceNightmare}
Hiện tại người chơi đang ở độ khó: **${currentDifficultyName}**. Hãy điều chỉnh kết quả tu luyện (lượng kinh nghiệm, độ thuần thục nhận được) và khả năng gặp tâm ma/trở ngại dựa trên độ khó này.

**CHẾ ĐỘ NỘI DUNG VÀ PHONG CÁCH:**
${nsfwGuidanceCombined}

**NHIỆM VỤ CỦA BẠN (AI):**

1.  **VIẾT LỜI KỂ CHI TIẾT:**
    *   Mô tả lại quá trình tu luyện trong ${duration} ngày một cách sống động.
    *   Kể về những khó khăn, những cảm ngộ, những đột phá nhỏ (hoặc lớn) mà nhân vật trải qua.
    *   Nếu là Song Tu và chế độ 18+ đang bật (${isNsfw}): Hãy mô tả cảnh song tu một cách chi tiết, nóng bỏng, phù hợp với phong cách "${nsfwStyle}" đã chọn. Tập trung vào sự giao hòa âm dương, linh lực chảy trong cơ thể, và cảm xúc của hai nhân vật.
    *   Ngược lại, nếu là Song Tu và chế độ 18+ đang TẮT: Hãy mô tả quá trình một cách trong sáng và tinh tế. Tập trung vào sự giao hòa linh lực, tâm ý tương thông, và sự cộng hưởng đại đạo. Ví dụ: hai người ngồi đối diện, tay chạm tay, linh lực của họ tạo thành một vòng tuần hoàn ánh sáng huyền ảo. Tuyệt đối không miêu tả các hành vi tình dục hay khỏa thân.
    *   Nếu là bế quan, hãy tả sự tĩnh lặng, sự vận hành của chu thiên, những ảo cảnh do tâm ma, hoặc những tia linh quang lóe lên trong đầu.
    *   Nếu là tu luyện linh kĩ, hãy tả cách nhân vật thi triển, thất bại, rồi dần dần nắm bắt được yếu quyết của kỹ năng.

2.  **QUYẾT ĐỊNH KẾT QUẢ & TẠO TAG:**
    *   Dựa trên tất cả các yếu tố thành công/thất bại đã liệt kê, hãy quyết định kết quả của đợt tu luyện này.
    *   **Nếu tu luyện Linh Kĩ:**
        *   Tạo tag **[SKILL_UPDATE: name="${skill?.name}", proficiency=+=X]** với X là lượng điểm thuần thục nhận được. Lượng điểm này nên tương xứng với thời gian và độ khó. Một phiên tu luyện thành công trong ${duration} ngày có thể nhận được từ ${duration * 5} đến ${duration * 20} điểm thuần thục.
    *   **Nếu tu luyện Công Pháp (Bế Quan):**
        *   Tạo tag **[STATS_UPDATE: kinhNghiem=+Y]** với Y là lượng kinh nghiệm nhận được. Lượng kinh nghiệm phải phản ánh tất cả các yếu tố: cảnh giới, linh căn, thể chất, phẩm chất công pháp.
    *   **Nếu tu luyện Công Pháp (Song Tu):**
        *   Tạo tag **[STATS_UPDATE: kinhNghiem=+Z]**. Lượng kinh nghiệm Z nhận được từ Song Tu nên **cao hơn đáng kể** (ví dụ: 1.5x đến 3x) so với Bế Quan trong cùng khoảng thời gian và phải phản ánh thêm cả tư chất và thiện cảm của bạn đồng tu.
        *   Tạo tag **[${partnerUpdateTag}: name="${partner?.name}", affinity=+=W]** để tăng độ thiện cảm với bạn đồng tu.
    *   Tạo tag **[CHANGE_TIME: ngay=${duration}]** để thể hiện thời gian đã trôi qua.
    
    **QUAN TRỌNG:** Chỉ trả về **duy nhất** các tag liên quan và lời kể. Không thêm bất kỳ lời dẫn hay giải thích nào khác.

**VÍ DỤ (Tu Luyện Linh Kĩ thành công):**
Bạn ngồi xếp bằng, tâm trí hoàn toàn tập trung vào "Hỏa Cầu Thuật". Từng dòng linh lực được vận chuyển theo một lộ trình phức tạp, ngưng tụ nơi đầu ngón tay. Lần đầu tiên, quả cầu lửa phập phù rồi tắt ngấm. Không nản lòng, bạn thử lại lần nữa, rồi lần nữa. Sau ${duration} ngày đêm không nghỉ, cuối cùng bạn cũng cảm nhận được sự lưu chuyển của hỏa linh lực. Một quả cầu lửa to bằng nắm tay, rực sáng và ổn định, hiện ra trong lòng bàn tay bạn.
[SKILL_UPDATE: name="Hỏa Cầu Thuật", proficiency=+=50]
[CHANGE_TIME: ngay=${duration}]

**VÍ DỤ (Song Tu thành công, NSFW Bật):**
(Đoạn văn mô tả chi tiết cảnh giao hợp, tập trung vào sự hòa quyện linh lực, theo phong cách "${nsfwStyle}") ... Khi cơn khoái lạc đỉnh điểm qua đi, cả hai cùng thở dốc. Một luồng linh lực thuần khiết và mạnh mẽ chưa từng có chảy trong kinh mạch của bạn, tu vi tăng vọt.
[STATS_UPDATE: kinhNghiem=+500]
[${partnerUpdateTag}: name="${partner?.name}", affinity=+=20]
[CHANGE_TIME: ngay=${duration}]
`
};
