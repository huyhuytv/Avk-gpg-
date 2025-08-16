
import { KnowledgeBase, GameMessage } from '../types';
import { VIETNAMESE, DEFAULT_NSFW_DESCRIPTION_STYLE, DEFAULT_VIOLENCE_LEVEL, DEFAULT_STORY_TONE } from '../constants';

export const generateCombatTurnPrompt = (
    knowledgeBase: KnowledgeBase,
    playerAction: string,
    combatLog: string[],
    currentPageMessagesLog: string,
    previousPageSummaries: string[],
    lastNarrationFromPreviousPage?: string
): string => {
    const { playerStats, worldConfig, inventory, playerSkills } = knowledgeBase;

    // We get the full combatant objects (with current stats) from the CombatScreen's state
    // For the prompt, we serialize this state.
    // @ts-ignore - combatants is a temporary property added for the prompt
    const combatants = knowledgeBase.combatants || [];
    
    const player = combatants.find(c => c.id === 'player');
    const opponents = combatants.filter(c => c.id !== 'player');
    const currentDifficultyName = worldConfig?.difficulty || 'Thường';
    const currentViolenceLevel = worldConfig?.violenceLevel || DEFAULT_VIOLENCE_LEVEL;
    const currentStoryTone = worldConfig?.storyTone || DEFAULT_STORY_TONE;
    const nsfwMode = worldConfig?.nsfwMode || false;
    const nsfwStyle = worldConfig?.nsfwDescriptionStyle || DEFAULT_NSFW_DESCRIPTION_STYLE;
    
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
**YÊU CẦU ĐẶC BIỆT VỀ CẢNH TÌNH DỤC (QUAN TRỌNG):** Khi miêu tả các cảnh quan hệ tình dục, hãy viết một cách **CHI TIẾT, DÀI và MẠNH BẠO** hơn. Đừng ngần ngại đi sâu vào các hành vi thể xác, mô tả cường độ, sự thô bạo (nếu phù hợp với bối cảnh và tông màu), và những cảm xúc mãnh liệt của nhân vật. Tập trung vào sự tương tác vật lý, những âm thanh, và sức mạnh trong từng hành động. Hãy để các cảnh này kéo dài và có sự leo thang về cường độ.
**Hướng Dẫn Tình Dục Trong Chiến Đấu:**
*   Khi Chế Độ 18+ Bật, các hành vi tình dục có thể xảy ra ngay trong trận chiến như một hình thức tấn công, kỹ năng đặc biệt, hoặc một lựa chọn chiến thuật.
*   **Ví dụ về các tình huống:**
    *   **Kỹ năng quyến rũ:** Một nhân vật (người chơi hoặc NPC) có thể sử dụng một kỹ năng quyến rũ. Thay vì gây sát thương trực tiếp, nó có thể gây ra hiệu ứng xấu như "Mê Hoặc" (khiến đối phương mất lượt), "Giảm Ý Chí Chiến Đấu", hoặc thậm chí là khiến đối phương tấn công đồng đội của mình.
    *   **Tấn công mang tính chất tình dục:** Một số kẻ địch (ví dụ: ma nữ, dâm ma) có thể tấn công bằng cách hút tinh khí, gây sát thương linh lực thay vì sinh lực.
    *   **Đòn kết liễu tình dục (Sexual Finishers):** Khi một đối thủ bị đánh bại (HP về 0), thay vì chỉ có lựa chọn "Kết liễu", người chơi có thể có thêm các lựa chọn mang tính 18+. Ví dụ: "[CHOICE: "Cưỡng hiếp kẻ bại trận"]". Nếu người chơi chọn hành động này, hãy mô tả cảnh đó một cách chi tiết theo phong cách đã chọn. Hành động này có thể có những hậu quả riêng, ví dụ như nhận được một debuff "Dâm tâm" nhưng hồi phục lại một phần linh lực, hoặc ảnh hưởng đến danh tiếng.
*   **Cập nhật trạng thái:** Các hành động tình dục trong chiến đấu nên được thể hiện qua tag [COMBAT_STAT_UPDATE]. Ví dụ, một đòn hút tinh khí có thể là \`[COMBAT_STAT_UPDATE: targetId="player", stat="linhLuc", change=-50]\` và \`[COMBAT_STAT_UPDATE: targetId="id_ma_nu", stat="linhLuc", change=50]\`.
`;
    } else {
        nsfwGuidanceCombined = "LƯU Ý QUAN TRỌNG: Chế độ Người Lớn đang TẮT. Tiếp tục duy trì nội dung phù hợp với mọi lứa tuổi, tập trung vào phiêu lưu và phát triển nhân vật. Tránh các chủ đề nhạy cảm, bạo lực quá mức hoặc tình dục.";
    }
    
    const combatHistory = combatLog.length > 1 ? combatLog.slice(1).join('\n---\n') : "Đây là lượt đầu tiên của trận đấu.";
    
    const isFirstTurn = playerAction === "Bắt đầu chiến đấu";

    let aiInstructions = '';

    if (isFirstTurn) {
        aiInstructions = `
**YÊU CẦU DÀNH CHO BẠN (AI) - LƯỢT ĐẦU TIÊN (Lượt Thiết Lập):**

1.  **VIẾT LỜI KỂ (BẮT BUỘC):**
    *   Hành động của người chơi là "Bắt đầu chiến đấu". Đây là lượt để thiết lập không khí.
    *   Hãy viết một đoạn văn mô tả cảnh tượng hai bên đối mặt nhau, vào thế, không khí căng thẳng.
    *   **QUAN TRỌNG NHẤT: KHÔNG để bất kỳ ai (cả người chơi và đối thủ) thực hiện hành động tấn công hay gây sát thương trong lượt này.**

2.  **TẠO PHẢN HỒI THEO ĐỊNH DẠNG TAG (RẤT QUAN TRỌNG):**
    *   **[COMBAT_NARRATION: text="..."]**: Lời kể bạn vừa viết ở trên.
    *   **[CHOICE: "Nội dung lựa chọn"]**: Cung cấp 3-4 lựa chọn hành động cho lượt tiếp theo của người chơi.
    *   **CẤM:** Không tạo bất kỳ tag \`[COMBAT_STAT_UPDATE]\` hay \`[COMBAT_END]\` nào trong lượt đầu tiên này.
`;
    } else {
        aiInstructions = `
**YÊU CẦU DÀNH CHO BẠN (AI):**

1.  **Xử lý Hành Động Của Người Chơi:**
    *   Dựa vào hành động ("${playerAction}"), chỉ số, kỹ năng và trang bị của người chơi, hãy xác định kết quả.
    *   **LƯU Ý ĐẶC BIỆT:** Nếu hành động của người chơi là một câu chung chung như "Quan sát", hãy hiểu rằng đây là lượt người chơi đang do dự. Trong trường hợp này, hãy mô tả người chơi và đối thủ vào thế, và sau đó để các đối thủ hành động trước. Đừng để người chơi tấn công ngay lập tức trừ khi hành động của họ nói rõ như vậy.
    *   **Tuân thủ nghiêm ngặt QUY TẮC TÍNH SÁT THƯƠNG ở trên.**
    *   Mô tả kết quả này trong lời kể chiến đấu.

2.  **Quyết Định và Xử lý Hành Động Của TỪNG Đối Thủ:**
    *   Sau khi xử lý lượt của người chơi, lần lượt quyết định hành động cho **TỪNG** NPC đối thủ còn sống.
    *   Tính toán kết quả hành động của NPC (sát thương lên người chơi, hiệu ứng, v.v.) theo **QUY TẮC TÍNH SÁT THƯƠNG**.
    *   Mô tả kết quả này trong lời kể chiến đấu.
    
3.  **Ngoại Lực Can Thiệp (QUAN TRỌNG):**
    *   Hãy nhớ rằng trận chiến không diễn ra trong chân không. Một nhân vật thứ ba có thể xuất hiện và giúp đỡ hoặc cản trở một trong hai bên. Môi trường có thể thay đổi (ví dụ: hang động sụp đổ, mưa bão). Những yếu tố này có thể thay đổi cục diện hoặc thậm chí kết thúc trận chiến một cách bất ngờ. Hãy mô tả chúng trong lời kể nếu hợp lý.

4.  **Tạo Phản Hồi Theo Định Dạng Tag (RẤT QUAN TRỌNG):**
    *   **Phản hồi của bạn PHẢI bao gồm CÁC TAG sau:**

    *   **[COMBAT_NARRATION: text="..."]**:
        *   Viết một đoạn văn duy nhất, liền mạch, mô tả **TOÀN BỘ** diễn biến trong lượt này: hành động của người chơi và kết quả, theo sau là hành động của TẤT CẢ các đối thủ và kết quả của chúng.
        *   **Nếu trận đấu kết thúc**, đoạn văn này PHẢI bao gồm một đoạn tóm tắt ngắn gọn về toàn bộ trận chiến.
        *   **Ví dụ:** '[COMBAT_NARRATION: text="Bạn vung kiếm chém một nhát chí mạng, để lại một vết thương sâu trên người Goblin. Tức giận, con Goblin còn lại vung chùy tấn công, gây cho bạn 15 sát thương."]'

    *   **[COMBAT_STAT_UPDATE: targetId="ID", stat="TênChỉSố", change=SỐ]**:
        *   Sử dụng tag này cho **MỖI** sự thay đổi chỉ số của **BẤT KỲ** ai trong trận đấu (cả người chơi và NPC).
        *   \`targetId\`: ID của người bị ảnh hưởng. Dùng \`"player"\` cho người chơi, hoặc ID của NPC (ví dụ: "npc-goblin-123").
        *   \`stat\`: Chỉ số bị thay đổi (\`sinhLuc\`, \`linhLuc\`).
        *   \`change\`: Lượng thay đổi (số âm cho sát thương/tiêu hao, số dương cho hồi phục).
        *   **Ví dụ:**
            '[COMBAT_STAT_UPDATE: targetId="npc-goblin-A", stat="sinhLuc", change=-50]'
            '[COMBAT_STAT_UPDATE: targetId="player", stat="sinhLuc", change=-15]'
            '[COMBAT_STAT_UPDATE: targetId="player", stat="linhLuc", change=-10]'

    *   **[CHOICE: "Nội dung lựa chọn"]**:
        *   Sau khi mô tả xong lượt này, hãy cung cấp 3-4 lựa chọn hành động **MỚI** cho lượt tiếp theo của người chơi.
        *   Các lựa chọn nên đa dạng: tấn công thường, sử dụng kỹ năng, dùng vật phẩm, phòng thủ, v.v.
        *   **Ví dụ:**
            '[CHOICE: "Tấn công Goblin bằng kiếm."]'
            '[CHOICE: "Dùng kỹ năng 'Trị Thương Thuật' để hồi phục."]'
            '[CHOICE: "Thử ném một quả bom khói để tẩu thoát."]'

    *   **[COMBAT_END: outcome="...", surrenderedNpcIds="..."]** (CHỈ SỬ DỤNG KHI TRẬN ĐẤU KẾT THÚC):
        *   \`outcome\`: Có thể là một trong các giá trị sau:
            *   \`"victory"\`: Nếu **TẤT CẢ** đối thủ đã bị đánh bại.
            *   \`"defeat"\`: Nếu HP người chơi <= 0 hoặc khi người chơi đầu hàng.
            *   \`"escaped"\`: Nếu người chơi bỏ chạy thành công.
            *   \`"surrendered"\`: Nếu một trong hai bên đầu hàng.
        *   \`surrenderedNpcIds\` (TÙY CHỌN): Nếu \`outcome="surrendered"\` và có NPC đầu hàng, liệt kê ID của chúng ở đây, cách nhau bởi dấu phẩy.
        *   **Ví dụ (Chiến thắng):** '[COMBAT_NARRATION: text="Bạn tung đòn kết liễu, hạ gục tên Goblin cuối cùng! **Tóm tắt trận chiến:** Bạn đã dũng cảm đối đầu và đánh bại hai tên Goblin hung hãn, chỉ bị một vài vết thương nhỏ."] [COMBAT_END: outcome="victory"]'
        *   **Ví dụ (Đầu hàng):** '[COMBAT_NARRATION: text="Thấy không còn hy vọng, tên thủ lĩnh Goblin quăng vũ khí xuống và quỳ gối. **Tóm tắt trận chiến:** Sau khi đánh bại tay sai, bạn đã uy hiếp thành công thủ lĩnh Goblin khiến nó phải đầu hàng."] [COMBAT_END: outcome="surrendered", surrenderedNpcIds="npc-goblin-boss-456"]'
`;
    }

    return `Bạn là một AI "Combat Master" trong một game nhập vai thể loại ${worldConfig?.genre || 'Tu Tiên'}. Nhiệm vụ của bạn là điều khiển một lượt chiến đấu một cách công bằng, logic và hấp dẫn.

**BỐI CẢNH TOÀN DIỆN:**
- **Thế Giới:** Chủ đề "${worldConfig?.theme}", thể loại "${worldConfig?.genre}".
- **Địa Điểm:** Trận chiến đang diễn ra tại "${knowledgeBase.discoveredLocations.find(l => l.id === knowledgeBase.currentLocationId)?.name || 'một nơi không xác định'}". Mô tả: ${knowledgeBase.discoveredLocations.find(l => l.id === knowledgeBase.currentLocationId)?.description || ''}
- **Nhiệm vụ liên quan (nếu có):**
  ${knowledgeBase.allQuests.filter(q => q.status === 'active' && opponents.some(opp => q.description.toLowerCase().includes(opp.name.toLowerCase()))).map(q => `- ${q.title}: ${q.description}`).join('\n  ') || 'Không có nhiệm vụ nào trực tiếp liên quan.'}
- **Tri thức thế giới liên quan (nếu có):**
  ${knowledgeBase.worldLore.filter(l => opponents.some(opp => l.content.toLowerCase().includes(opp.name.toLowerCase()))).map(l => `- ${l.title}: ${l.content.substring(0, 100)}...`).join('\n  ') || 'Không có tri thức nào trực tiếp liên quan.'}

**BỐI CẢNH DẪN ĐẾN TRẬN ĐẤU (LỊCH SỬ GẦN ĐÂY):**
- **Tóm tắt các trang trước:**
${previousPageSummaries.join("\n\n") || "Không có."}
- **Diễn biến gần nhất (lượt trước trận đấu):**
${lastNarrationFromPreviousPage || "Không có."}
- **Diễn biến trong trang hiện tại (dẫn đến trận chiến):**
${currentPageMessagesLog || "Không có."}

**DIỄN BIẾN TRẬN ĐẤU CHO ĐẾN NAY:**
${combatHistory}

**TÌNH HÌNH CHIẾN TRƯỜNG HIỆN TẠI:**
- **Người Chơi:** ${worldConfig?.playerName || 'Người Chơi'}
  - Chỉ số (JSON): ${JSON.stringify(player, null, 2)}
  - Kỹ năng (JSON): ${JSON.stringify(playerSkills, null, 2)}
  - Vật phẩm trong túi (chỉ đan dược) (JSON): ${JSON.stringify(inventory.filter(i => i.category === 'Potion'), null, 2)}
- **Đối Thủ:**
  - (JSON): ${JSON.stringify(opponents, null, 2)}

**HÀNH ĐỘNG CỦA NGƯỜI CHƠI TRONG LƯỢT NÀY:**
- "${playerAction}"

**HƯỚN DẪN VỀ ĐỘ KHÓ (Rất quan trọng để AI tuân theo):**
- **Dễ:** ${VIETNAMESE.difficultyGuidanceEasy} Kẻ địch sẽ hành động kém thông minh hơn, ít dùng kỹ năng mạnh, và sát thương gây ra có thể thấp hơn một chút.
- **Thường:** ${VIETNAMESE.difficultyGuidanceNormal} Kẻ địch có hành vi chiến đấu tiêu chuẩn, sử dụng kỹ năng và chiến thuật hợp lý.
- **Khó:** ${VIETNAMESE.difficultyGuidanceHard} Kẻ địch hành động rất thông minh, biết tập trung tấn công mục tiêu yếu, sử dụng kỹ năng phối hợp và có thể có chỉ số cao hơn một chút.
- **Ác Mộng:** ${VIETNAMESE.difficultyGuidanceNightmare} Kẻ địch cực kỳ thông minh, tàn nhẫn, luôn nhắm vào điểm yếu của người chơi, sử dụng chiến thuật khó lường và có thể có những kỹ năng đặc biệt nguy hiểm.
Hiện tại người chơi đang ở độ khó: **${currentDifficultyName}**. Hãy điều chỉnh hành vi và hiệu quả chiến đấu của NPC cho phù hợp.

**QUY TẮC TÍNH SÁT THƯƠNG (BẮT BUỘC TUÂN THỦ NGHIÊM NGẶT):**
Khi một nhân vật (người chơi hoặc NPC) tấn công, bạn PHẢI tuân theo công thức sau để tính toán sát thương và cập nhật chỉ số.

1.  **Sát Thương Cơ Bản:**
    *   Lấy chỉ số \`sucTanCong\` của bên tấn công.
    *   Nhân với một hệ số ngẫu nhiên từ 0.8 đến 1.2 (ví dụ: \`sát thương = sucTanCong * 0.95\`).
    *   Đây là sát thương cuối cùng.

2.  **Cập Nhật Chỉ Số:**
    *   Tạo tag \`[COMBAT_STAT_UPDATE: targetId="ID_bên_phòng_thủ", stat="sinhLuc", change=-SÁT_THƯƠNG_VỪA_TÍNH]\`. Giá trị \`change\` PHẢI LÀ KẾT QUẢ TÍNH TOÁN, LÀM TRÒN ĐẾN SỐ NGUYÊN.

3.  **QUY TẮC "ONE-SHOT" (CỰC KỲ QUAN TRỌNG):**
    *   Nếu \`sucTanCong\` của bên tấn công **LỚN HƠN RẤT NHIỀU** (ví dụ: gấp 5 lần trở lên) so với \`maxSinhLuc\` của bên phòng thủ, bên phòng thủ PHẢI bị đánh bại ngay lập tức trong một đòn (one-shot).
    *   Trong trường hợp này, hãy mô tả một đòn đánh kết liễu ngoạn mục và sau đó kết thúc trận đấu bằng tag \`[COMBAT_END: outcome="victory"]\`.
    *   **Ví dụ:** Người chơi có \`sucTanCong=1,000,000\` tấn công Yêu Tinh có \`maxSinhLuc=500\`. Bạn phải mô tả người chơi tiêu diệt Yêu Tinh ngay lập tức. ĐỪNG mô tả Yêu Tinh chỉ mất vài chục máu.

**Ví dụ Áp Dụng:**
- Người chơi (\`sucTanCong=150\`) tấn công Goblin (\`maxSinhLuc=200\`).
- Bạn tính: \`sát thương = 150 * 1.1 = 165\`.
- Bạn viết lời kể: "Bạn vung kiếm chém một nhát chí mạng, để lại một vết thương sâu trên người Goblin."
- Bạn tạo tag: \`[COMBAT_STAT_UPDATE: targetId="id_goblin", stat="sinhLuc", change=-165]\`

**CHẾ ĐỘ NỘI DUNG VÀ PHONG CÁCH:**
${nsfwGuidanceCombined}

${aiInstructions}

**QUY TẮC VỀ ĐỘ THUẦN THỤC KỸ NĂNG (CỰC KỲ QUAN TRỌNG):**
*   Mỗi kỹ năng có một cấp độ thuần thục (\`proficiencyTier\`). Bạn PHẢI sử dụng cấp độ này để điều chỉnh hiệu quả của kỹ năng khi tính toán kết quả.
*   **Sát Thương & Hồi Phục:** Nhân (\`baseDamage\`, \`healingAmount\`, \`damageMultiplier\`, \`healingMultiplier\`) với hệ số sau:
    *   Sơ Nhập: x1.0 (100%)
    *   Tiểu Thành: x2.0 (200%)
    *   Đại Thành: x3.0 (300%)
    *   Viên Mãn: x4.0 (400%)
    *   Xuất Thần Nhập Hóa: x5.0 (500%)
    *   Ví dụ: Kỹ năng có \`baseDamage=20\` và \`proficiencyTier="Tiểu Thành"\` sẽ gây 20 * 2.0 = 40 sát thương cơ bản.
*   **Linh Lực Tiêu Hao & Thời Gian Hồi Chiêu:** Nhân (\`manaCost\`, \`cooldown\`) với hệ số sau (LÀM TRÒN LÊN số nguyên gần nhất):
    *   Sơ Nhập: x1.0 (100%)
    *   Tiểu Thành: x0.8 (80%)
    *   Đại Thành: x0.6 (60%)
    *   Viên Mãn: x0.4 (40%)
    *   Xuất Thần Nhập Hóa: x0.2 (20%)
    *   Ví dụ: Kỹ năng có \`manaCost=25\` và \`proficiencyTier="Đại Thành"\` sẽ tiêu hao Math.ceil(25 * 0.6) = 15 Linh Lực.

**VÍ DỤ HOÀN CHỈNH CHO MỘT LƯỢT PHẢN HỒI (Trận đấu tiếp diễn):**
'''
[COMBAT_NARRATION: text="Bạn vung kiếm chém mạnh vào tên Yêu Tinh, vết thương sâu hoắm tóe máu khiến nó mất 45 HP. Tên Yêu Tinh còn lại thấy đồng bọn gặp nguy, liền gầm lên và ném một tảng đá về phía bạn, gây 20 sát thương."]
[COMBAT_STAT_UPDATE: targetId="npc-yeu-tinh-1", stat="sinhLuc", change=-45]
[COMBAT_STAT_UPDATE: targetId="player", stat="sinhLuc", change=-20]
[CHOICE: "Tiếp tục tấn công Yêu Tinh bị thương."]
[CHOICE: "Chuyển mục tiêu sang Yêu Tinh còn lại."]
[CHOICE: "Uống một bình thuốc hồi máu."]
'''

**BẮT ĐẦU!** Hãy xử lý hành động của người chơi và kể lại diễn biến của lượt này.
`;
};
