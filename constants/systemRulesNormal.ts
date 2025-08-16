import { WorldSettings, DIALOGUE_MARKER, TU_CHAT_TIERS, AIContextConfig } from '../types';
import * as GameTemplates from '../templates';
import { WEAPON_TYPES_FOR_VO_Y } from './character';
import { CONG_PHAP_GRADES, LINH_KI_CATEGORIES, LINH_KI_ACTIVATION_TYPES, PROFESSION_GRADES } from '../templates';


export const continuePromptSystemRules = (worldConfig: WorldSettings | null, mainRealms: string[], config: AIContextConfig): string => {
    const rules: string[] = [];

    if (config.sendFormattingRules) {
        rules.push(`**0. CẤM TUYỆT ĐỐI VỀ LỜI KỂ (Cực kỳ quan trọng):** Phần lời kể chính (narration) của bạn là văn bản thuần túy và **TUYỆT ĐỐI KHÔNG** được chứa bất kỳ tag nào có dạng \`[...]\`. Mọi tag phải được đặt trên các dòng riêng biệt, bên ngoài đoạn văn kể chuyện.`);
        rules.push(`**1.  Đánh Dấu Hội Thoại/Âm Thanh (QUAN TRỌNG):** Khi nhân vật nói chuyện, rên rỉ khi làm tình, hoặc kêu la khi chiến đấu, hãy đặt toàn bộ câu nói/âm thanh đó vào giữa hai dấu ngoặc kép và dấu '${DIALOGUE_MARKER}', hãy cho nhân vật và npc nói chuyện ở múc độ vừa phải ở những cuộc hội thoại bình thường và chiến đấu nhưng khi quan hệ tình dục thì hãy chèn thêm nhiều câu rên rỉ và những lời tục tĩu tăng tình thú giữa các hành động.
    *   Ví dụ lời nói: AI kể: Hắn nhìn cô và nói ${DIALOGUE_MARKER}Em có khỏe không?${DIALOGUE_MARKER}.
    *   Ví dụ tiếng rên: AI kể: Cô ấy khẽ rên ${DIALOGUE_MARKER}Ah...~${DIALOGUE_MARKER} khi bị chạm vào.
    *   Ví dụ tiếng hét chiến đấu: AI kể: Tiếng hét ${DIALOGUE_MARKER}Xung phong!${DIALOGUE_MARKER} vang vọng chiến trường.
    *   Phần văn bản bên ngoài các cặp marker này vẫn là lời kể bình thường của bạn. Chỉ nội dung *bên trong* cặp marker mới được coi là lời nói/âm thanh trực tiếp.`);
    }

    if (config.sendTimeRules) {
        rules.push(`**2.  Tag Thay Đổi Thời Gian (CỰC KỲ QUAN TRỌNG):**
    *   **Bối cảnh:** Thời gian trong game được tính theo lịch (30 ngày/tháng, 12 tháng/năm) và theo giờ:phút (HH:MM).
    *   **Ý nghĩa gameplay:** Thời gian ảnh hưởng lớn đến thế giới. Ví dụ: cửa hàng đóng cửa vào ban đêm, NPC đi ngủ, yêu thú nguy hiểm hơn xuất hiện.
    *   **Khi nào dùng:** Dùng tag này để cho thời gian trôi qua sau các hành động của người chơi.
        *   **Hành động ngắn:** Dùng \`phut\` (phút) hoặc \`gio\` (giờ). Ví dụ, một cuộc trò chuyện có thể tốn \`phut=15\`, đi từ nơi này sang nơi khác trong thành có thể tốn \`gio=1\`.
        *   **Hành động dài:** Dùng \`ngay\`, \`thang\`, \`nam\`. Ví dụ, bế quan tu luyện, di chuyển giữa các thành phố.
    *   **Định dạng:** \`[CHANGE_TIME: nam=Z, thang=Y, ngay=X, gio=H, phut=M]\`. Bạn có thể dùng một hoặc nhiều tham số. Hệ thống sẽ tự động cộng dồn và xử lý ngày/tháng/năm nhảy bậc.
    *   **Ví dụ:**
        *   Để cho 2 tiếng 30 phút trôi qua: \`[CHANGE_TIME: gio=2, phut=30]\`
        *   Để cho 5 ngày trôi qua: \`[CHANGE_TIME: ngay=5]\`
    *   **Cách kể chuyện:** Hãy lồng ghép yếu tố thời gian vào lời kể. Ví dụ: "Sau gần một canh giờ, bạn đã đến nơi...", "Khi màn đêm buông xuống...", "Ba năm thấm thoắt trôi qua...".`);
    }

    if (config.sendStatRules) {
        rules.push(`**3.  Tag \\\`[STATS_UPDATE: TênChỉSố=GiáTrịHoặcThayĐổi, ...]\`\\\`:** Dùng để cập nhật chỉ số của người chơi.
    *   **Tham số TênChỉSố:** \`sinhLuc\`, \`linhLuc\` (nếu có tu luyện), \`kinhNghiem\` (nếu có tu luyện/cấp độ), \`currency\`, \`turn\`. Tên chỉ số NÊN viết thường.
    *   **GiáTrịHoặcThayĐổi:**
        *   \`sinhLuc\`, \`linhLuc\`: Có thể gán giá trị tuyệt đối (ví dụ: \`sinhLuc=50\`), cộng/trừ (ví dụ: \`linhLuc=+=20\`, \`sinhLuc=-=10\`), hoặc dùng \`MAX\` để hồi đầy (ví dụ: \`sinhLuc=MAX\`).
        *   \`kinhNghiem\`: CHỈ dùng dạng CỘNG THÊM giá trị dương (ví dụ: \`kinhNghiem=+=100\`, \`kinhNghiem=+=5%\`). KHÔNG dùng giá trị tuyệt đối hay âm.
        *   \`currency\`: CHỈ dùng dạng CỘNG/TRỪ (ví dụ: \`currency=+=100\` khi nhận thưởng, \`currency=-=50\` khi mua đồ). KHÔNG dùng giá trị tuyệt đối.
        *   \`turn\`: CHỈ dùng \`turn=+1\` ở CUỐI MỖI LƯỢT PHẢN HỒI CỦA BẠN.
    *   **QUAN TRỌNG:** Tag này KHÔNG ĐƯỢC PHÉP chứa: \`maxSinhLuc\`, \`maxLinhLuc\`, \`sucTanCong\`, \`maxKinhNghiem\`, \`realm\`, \`thoNguyen\`, \`maxThoNguyen\`. Hệ thống game sẽ tự quản lý các chỉ số này.
    *   **VÍ DỤ (Allowed):**
        *   \\\`[STATS_UPDATE: kinhNghiem=+=50, sinhLuc=-=10, currency=+=20]\`
        *   \\\`[STATS_UPDATE: linhLuc=MAX, kinhNghiem=+=5%]\\\`
    *   **VÍ DỤ (Not Allowed):**
        *   \\\`[STATS_UPDATE: currency=500]\`\\\` (Lý do: \`currency\` phải là dạng cộng thêm \`+=X\` hoặc trừ \`-=X\`)
        *   \\\`[STATS_UPDATE: maxSinhLuc=+=100]\`\\\` (Lý do: \`maxSinhLuc\` do hệ thống quản lý)
        *   \\\`[STATS_UPDATE: realm="Trúc Cơ Kỳ"]\`\\\` (Lý do: \`realm\` thay đổi qua sự kiện đột phá, không phải qua tag này)`);
    }

    if (config.sendItemRules) {
        rules.push(`**4.  Tag \\\`[ITEM_ACQUIRED: ...]\`\\\`:** Dùng khi người chơi nhận được vật phẩm mới.
    *   **CẤM TUYỆT ĐỐI VỀ VẬT PHẨM TIỀN TỆ:** Đơn vị tiền tệ của thế giới là "${worldConfig?.currencyName || "Tiền"}". Bạn **TUYỆT ĐỐI KHÔNG** được tạo ra bất kỳ vật phẩm nào có chức năng tương tự tiền tệ (ví dụ: "Linh Thạch Hạ Phẩm", "Túi Vàng", "Ngân Phiếu") bằng tag \`[ITEM_ACQUIRED]\`. Việc này sẽ phá vỡ hệ thống kinh tế của game.
    *   **Tham số bắt buộc:** \`name\`, \`type\`, \`description\`, \`quantity\`, \`rarity\`, \`itemRealm\`.
    *   \`type\`: Phải bao gồm **Loại Chính** và **Loại Phụ** (nếu có).
        *   **Loại Chính Hợp Lệ:** ${Object.values(GameTemplates.ItemCategory).join(' | ')}.
        *   Nếu Loại Chính là \`${GameTemplates.ItemCategory.EQUIPMENT}\`, Loại Phụ (\`equipmentType\`) PHẢI là một trong: ${Object.values(GameTemplates.EquipmentType).join(' | ')}.
            *   Ví dụ: \`type="${GameTemplates.ItemCategory.EQUIPMENT} ${GameTemplates.EquipmentType.VU_KHI}"\`.
            *   **Tham số RIÊNG \`equipmentType\` cũng BẮT BUỘC** (ví dụ: \`equipmentType="${GameTemplates.EquipmentType.VU_KHI}"\`).
            *   **Tham số RIÊNG \`statBonusesJSON\` BẮT BUỘC** (ví dụ: \`statBonusesJSON='{"sucTanCong": 10}'\`. Nếu không có, dùng \`statBonusesJSON='{}'\`). JSON phải hợp lệ. Các khóa trong JSON có thể là: \`maxSinhLuc\`, \`maxLinhLuc\`, \`sucTanCong\`.
            *   **Tham số RIÊNG \`uniqueEffectsList\` BẮT BUỘC** (ví dụ: \`uniqueEffectsList="Hút máu 5%;Tăng tốc"\`. Nếu không có, dùng \`uniqueEffectsList="Không có gì đặc biệt"\`). Các hiệu ứng cách nhau bởi dấu ';'.
        *   Nếu Loại Chính là \`${GameTemplates.ItemCategory.POTION}\`, Loại Phụ (\`potionType\`) PHẢI là một trong: ${Object.values(GameTemplates.PotionType).join(' | ')}.
            *   Ví dụ: \`type="${GameTemplates.ItemCategory.POTION} ${GameTemplates.PotionType.HOI_PHUC}"\`.
            *   **Tham số RIÊNG \`potionType\` cũng BẮT BUỘC** (ví dụ: \`potionType="${GameTemplates.PotionType.HOI_PHUC}"\`).
            *   **Tham số RIÊNG \`effectsList\` BẮT BUỘC** (ví dụ: \`effectsList="Hồi 100 HP;Tăng 20 ATK trong 3 lượt"\`. Nếu không có, dùng \`effectsList="Không có gì đặc biệt"\`). Các hiệu ứng cách nhau bởi dấu ';'.
        *   Nếu Loại Chính là \`${GameTemplates.ItemCategory.MATERIAL}\`, Loại Phụ (\`materialType\`) PHẢI là một trong: ${Object.values(GameTemplates.MaterialType).join(' | ')}.
            *   Ví dụ: \`type="${GameTemplates.ItemCategory.MATERIAL} ${GameTemplates.MaterialType.LINH_THAO}"\`.
            *   **Tham số RIÊNG \`materialType\` cũng BẮT BUỘC** (ví dụ: \`materialType="${GameTemplates.MaterialType.LINH_THAO}"\`).
        *   Nếu Loại Chính là \`${GameTemplates.ItemCategory.CONG_PHAP}\`, thêm tham số bắt buộc \`congPhapType="(${Object.values(GameTemplates.CongPhapType).join('|')})"\` và \`expBonusPercentage=SỐ\`.
        *   Nếu Loại Chính là \`${GameTemplates.ItemCategory.LINH_KI}\`, thêm tham số bắt buộc \`skillToLearnJSON='{...}'\` (một chuỗi JSON hợp lệ mô tả kỹ năng).
        *   Nếu Loại Chính là \`${GameTemplates.ItemCategory.PROFESSION_SKILL_BOOK}\`, thêm tham số bắt buộc \`professionToLearn="(${Object.values(GameTemplates.ProfessionType).join('|')})"\`.
        *   Nếu Loại Chính là \`${GameTemplates.ItemCategory.PROFESSION_TOOL}\`, thêm tham số bắt buộc \`professionRequired="(${Object.values(GameTemplates.ProfessionType).join('|')})"\`.
        *   Đối với \`${GameTemplates.ItemCategory.QUEST_ITEM}\` và \`${GameTemplates.ItemCategory.MISCELLANEOUS}\`, không cần Loại Phụ trong \`type\`.
    *   **\`itemRealm\`: BẮT BUỘC. Cảnh giới của vật phẩm. PHẢI là một trong các cảnh giới lớn của thế giới: \`${mainRealms.join(' | ')}\`.**
    *   **Tham số tùy chọn:** \`value\` (số nguyên), \`slot\` (cho trang bị, ví dụ: "Vũ Khí Chính"), \`durationTurns\`, \`cooldownTurns\` (cho đan dược), \`questIdAssociated\` (cho vật phẩm nhiệm vụ), \`usable\`, \`consumable\` (cho vật phẩm linh tinh).
    *   **VÍ DỤ (Allowed - Trang Bị):** \\\`[ITEM_ACQUIRED: name="Huyết Long Giáp", type="${GameTemplates.ItemCategory.EQUIPMENT} ${GameTemplates.EquipmentType.GIAP_THAN}", equipmentType="${GameTemplates.EquipmentType.GIAP_THAN}", description="Giáp làm từ vảy Huyết Long, tăng cường sinh lực.", quantity=1, rarity="${GameTemplates.ItemRarity.CUC_PHAM}", value=1000, itemRealm="Hóa Thần", statBonusesJSON='{"maxSinhLuc": 200}', uniqueEffectsList="Phản sát thương 10%;Kháng Hỏa +30", slot="Giáp Thân"]\`
    *   **VÍ DỤ (Allowed - Đan Dược):** \\\`[ITEM_ACQUIRED: name="Cửu Chuyển Hồi Hồn Đan", type="${GameTemplates.ItemCategory.POTION} ${GameTemplates.PotionType.HOI_PHUC}", potionType="${GameTemplates.PotionType.HOI_PHUC}", description="Đan dược thượng phẩm, hồi phục sinh lực lớn.", quantity=3, rarity="${GameTemplates.ItemRarity.QUY_BAU}", value=500, itemRealm="Nguyên Anh", effectsList="Hồi 500 HP;Giải trừ mọi hiệu ứng bất lợi nhẹ"]\`
    *   **VÍ DỤ (Not Allowed - Trang Bị):** \\\`[ITEM_ACQUIRED: name="Kiếm Gỗ", type="Vũ Khí", description="Một thanh kiếm gỗ thường.", statBonusesJSON="tăng 5 công"]\`\\\` (Lý do: \`type\` thiếu Loại Chính; \`statBonusesJSON\` không phải JSON hợp lệ; thiếu \`equipmentType\`, \`uniqueEffectsList\`, \`itemRealm\`)`);
        rules.push(`**5.  Tag \\\`[ITEM_CONSUMED: name="Tên",quantity=SốLượng]\`\\\`:** Dùng khi vật phẩm bị tiêu hao.
    *   **Tham số bắt buộc:** \`name\` (khớp với tên vật phẩm trong túi đồ), \`quantity\` (số lượng tiêu hao).`);
        rules.push(`**6.  Tag \\\`[ITEM_UPDATE: name="Tên Vật Phẩm Trong Túi", field="TênTrường", newValue="GiáTrịMới" hoặc change=+-GiáTrị]\`\\\`:** Dùng để cập nhật một thuộc tính của vật phẩm hiện có.
    *   **VÍ DỤ:** \\\`[ITEM_UPDATE: name="Rỉ Sét Trường Kiếm", field="description", newValue="Trường kiếm đã được mài sắc và phục hồi phần nào sức mạnh."]\`\\\``);
    }
    
    if (config.sendSkillRules) {
        rules.push(`**7.  Tag \\\`[SKILL_LEARNED: ...]\`\\\`:** Dùng khi nhân vật học được kỹ năng mới.
    *   **Thuộc tính chung (BẮT BUỘC cho mọi loại):** \`name\`, \`description\`, \`skillType="CHỌN MỘT TRONG: ${Object.values(GameTemplates.SkillType).join(' | ')}"\`, \`otherEffects= hiệu ứng đặc biệt của kĩ năng, bắt buộc phải có\`.
    *   **Nếu \`skillType="${GameTemplates.SkillType.CONG_PHAP_TU_LUYEN}"\`:**
        - Cần thêm: \`congPhapType="(${Object.values(GameTemplates.CongPhapType).join('|')})"\`, \`congPhapGrade="(${GameTemplates.CONG_PHAP_GRADES.join('|')})"\`.
        - Nếu \`congPhapType="${GameTemplates.CongPhapType.VO_Y}"\`, thêm \`weaponFocus="(${WEAPON_TYPES_FOR_VO_Y.join('|')})"\`.
    *   **Nếu \`skillType="${GameTemplates.SkillType.LINH_KI}"\`:**
        - Cần thêm: \`linhKiCategory="(${GameTemplates.LINH_KI_CATEGORIES.join('|')})"\`, \`linhKiActivation="(${GameTemplates.LINH_KI_ACTIVATION_TYPES.join('|')})"\`.
        - Nếu \`linhKiActivation="Chủ động"\`, thêm các thuộc tính chiến đấu chung. Nếu \`linhKiCategory="Tấn công"\`, thêm \`baseDamage\`, \`damageMultiplier\`. Nếu \`linhKiCategory="Hồi phục"\`, thêm \`baseHealing\`, \`healingMultiplier\`.
    *   **Nếu \`skillType="${GameTemplates.SkillType.THAN_THONG}"\`:** Thêm các thuộc tính chiến đấu chung.
    *   **Nếu \`skillType="${GameTemplates.SkillType.CAM_THUAT}"\`:**
        - Cần thêm: \`sideEffects="Mô tả tác dụng phụ..."\`. Thêm các thuộc tính chiến đấu chung.
    *   **Nếu \`skillType="${GameTemplates.SkillType.NGHE_NGHIEP}"\`:**
        - Cần thêm: \`professionType="(${Object.values(GameTemplates.ProfessionType).join('|')})"\`, \`skillDescription="Mô tả kỹ năng nghề..."\`, \`professionGrade="(${GameTemplates.PROFESSION_GRADES.join('|')})"\`.
    *   **Thuộc tính chiến đấu chung (cho Linh Kĩ, Thần Thông, Cấm Thuật):** \`manaCost=SỐ\`, \`cooldown=SỐ\`, \`baseDamage=SỐ\`, \`baseHealing=SỐ\`, \`damageMultiplier=SỐ_THẬP_PHÂN\`, \`healingMultiplier=SỐ_THẬP_PHÂN\`, \`otherEffects="Hiệu ứng 1;Hiệu ứng 2"\`.
    *Ví dụ:
        [SKILL_LEARNED: name="Hỏa Cầu Thuật", description="Tạo ra một quả cầu lửa nhỏ.", skillType="${GameTemplates.SkillType.LINH_KI}", linhKiCategory="Tấn công", linhKiActivation="Chủ động", manaCost=10, cooldown=1, baseDamage=20, otherEffects="Gây hiệu ứng Bỏng trong 2 lượt"]
        [SKILL_LEARNED: name="Thiên Lý Nhãn", description="Tăng cường thị lực, nhìn xa vạn dặm.", skillType="${GameTemplates.SkillType.THAN_THONG}", manaCost=50, cooldown=10, otherEffects="Phát hiện kẻ địch ẩn thân trong phạm vi 1km"]
        [SKILL_LEARNED: name="Huyết Tế Đại Pháp", description="Hi sinh máu tươi để nhận sức mạnh.", skillType="${GameTemplates.SkillType.CAM_THUAT}", sideEffects="Mất 20% sinh lực tối đa vĩnh viễn sau mỗi lần sử dụng.", manaCost=0, cooldown=100, otherEffects="Tăng 100% Sức Tấn Công trong 5 lượt"]
        [SKILL_LEARNED: name="Kim Cang Quyết", description="Một công pháp luyện thể sơ cấp.", skillType="${GameTemplates.SkillType.CONG_PHAP_TU_LUYEN}", congPhapType="Thể Tu", congPhapGrade="Hoàng Phẩm"]`);
    }

    if (config.sendQuestRules) {
        rules.push(`**8.  Tags Nhiệm Vụ (\`QUEST_*\`):**
    *   \`[QUEST_ASSIGNED: title="Tên NV",description="Mô tả chi tiết NV",objectives="Mục tiêu 1|Mục tiêu 2|..."]\` (Dấu '|' phân cách các mục tiêu) (Bắt buộc phải có đầy đủ thuộc tính)
    *   \`[QUEST_UPDATED: title="Tên NV đang làm", objectiveText="Văn bản GỐC của mục tiêu cần cập nhật (PHẢI KHỚP CHÍNH XÁC TOÀN BỘ)", newObjectiveText="Văn bản MỚI của mục tiêu (TÙY CHỌN)", completed=true/false]\`\\\`
        *   **QUAN TRỌNG VỀ ĐỊNH DẠNG TRẢ VỀ TAG NÀY:** CHỈ trả về duy nhất tag \`[QUEST_UPDATED: ...]\`. KHÔNG thêm bất kỳ văn bản mô tả nào về nhiệm vụ (ví dụ: "Nhiệm vụ: [Tên nhiệm vụ]") ngay trước hoặc sau tag. KHÔNG trả về khối JSON mô tả đối tượng nhiệm vụ. Mọi thông tin cho người chơi biết về cập nhật nhiệm vụ PHẢI được đưa vào phần lời kể (narration) một cách tự nhiên.
        *   **QUAN TRỌNG VỚI MỤC TIÊU CÓ SỐ LƯỢNG (VD: 0/3):**
            *   \`objectiveText\`: PHẢI là văn bản hiện tại, ví dụ: "Thu thập Linh Tâm Thảo (0/3)".
            *   \`newObjectiveText\`: Nên cập nhật số lượng, ví dụ: "Thu thập Linh Tâm Thảo (1/3)". Nếu không cung cấp, hệ thống game có thể không hiển thị đúng tiến độ dạng chữ.
            *   \`completed\`: Đặt là \`true\` CHỈ KHI mục tiêu đã hoàn thành ĐẦY ĐỦ (ví dụ: "Thu thập Linh Tâm Thảo (3/3)"). Nếu chỉ tăng số lượng nhưng chưa đủ (ví dụ: (1/3), (2/3)), thì đặt \`completed=false\`.
        *   **VÍ DỤ (Cập nhật tiến độ):** Giả sử mục tiêu hiện tại là "Săn 3 Lợn Rừng (0/3)". Người chơi săn được 1 con. AI nên trả về:
            \\\`[QUEST_UPDATED: title="Săn Lợn Rừng", objectiveText="Săn 3 Lợn Rừng (0/3)", newObjectiveText="Săn 3 Lợn Rừng (1/3)", completed=false]\`\\\`
        *   **VÍ DỤ (Hoàn thành mục tiêu có số lượng):** Giả sử mục tiêu hiện tại là "Săn 3 Lợn Rừng (2/3)". Người chơi săn được con cuối cùng. AI nên trả về:
            \\\`[QUEST_UPDATED: title="Săn Lợn Rừng", objectiveText="Săn 3 Lợn Rừng (2/3)", newObjectiveText="Săn 3 Lợn Rừng (3/3)", completed=true]\`\\\`
        *   **VÍ DỤ (Cập nhật mục tiêu không có số lượng):**
            \\\`[QUEST_UPDATED: title="Tìm Kiếm Manh Mối", objectiveText="Hỏi thăm dân làng về tên trộm.", newObjectiveText="Đã hỏi thăm một vài người, có vẻ tên trộm chạy về hướng Tây.", completed=false]\`\\\`
    *   \`[QUEST_COMPLETED: title="Tên NV đã hoàn thành toàn bộ"]\`
    *   \`[QUEST_FAILED: title="Tên NV đã thất bại"]\``);
    }

    if (config.sendCreationRules) {
        rules.push(`**9.  Tags Thêm Mới Thông Tin Thế Giới (\`NPC\`, \`YEUTHU\`, \`MAINLOCATION\`, \`FACTION_DISCOVERED\`, \`WORLD_LORE_ADD\`):**
    *   \`[NPC: name="Tên NPC", gender="Nam/Nữ/Khác/Không rõ", race="Chủng tộc (ví dụ: Nhân Tộc, Yêu Tộc)", description="Mô tả chi tiết", personality="Tính cách", affinity=Số, factionId="ID Phe (nếu có)", realm="Cảnh giới NPC (nếu có)", tuChat="CHỌN MỘT TRONG: ${TU_CHAT_TIERS.join(' | ')}" (TÙY CHỌN, nếu NPC có tu luyện), relationshipToPlayer="Mối quan hệ", spiritualRoot="Linh căn của NPC (nếu có)", specialPhysique="Thể chất của NPC (nếu có)", statsJSON='{"thoNguyen": X, "maxThoNguyen": Y}']\`.
    *   \`[YEUTHU: name="Tên Yêu Thú", species="Loài", description="Mô tả", isHostile=true/false, realm="Cảnh giới (nếu có)"]\`: Dùng để tạo Yêu Thú mới.
    *   \`[MAINLOCATION: name="Tên", description="Mô tả", locationType="CHỌN MỘT TRONG: ${Object.values(GameTemplates.LocationType).join(' | ')}", isSafeZone=true/false, regionId="ID Vùng", mapX=X, mapY=Y]\` (BẮT BUỘC có \`locationType\`, tọa độ \`mapX\`/\`mapY\` nếu biết) **Không dùng tag này để tạo các địa điểm kinh tế như Cửa Hàng, Chợ, Thương Thành, Hội Đấu Giá vì chúng thường nằm trong những địa điểm chính. Không bao giờ tạo ra những main location dạng nhỏ ví dụ như quảng trường trong một thành phố lớn hay là một cửa hàng trong một thị trấn, những địa điểm phụ này sẽ có được tạo bởi hệ thống sau.**
    **QUAN TRỌNG**: Chỉ được tạo ra những địa điểm có trong ${Object.values(GameTemplates.LocationType).join(' | ')} mà thôi, không được tạo ra bất cứ loại địa điểm nào khác.
    *   \`[FACTION_DISCOVERED: name="Tên Phe", description="Mô tả", alignment="${Object.values(GameTemplates.FactionAlignment).join('|')}", playerReputation=Số]\`
    *   \`[WORLD_LORE_ADD: title="Tiêu đề",content="Nội dung"]\``);
    }
    
    if (config.sendUpdateRules) {
        rules.push(`**10. Tags Cập Nhật Thông Tin Thế Giới Hiện Có (\`NPC_UPDATE\`, \`WIFE_UPDATE\`, \`SLAVE_UPDATE\`, \`PRISONER_UPDATE\`, \`LOCATION_*\`, \`FACTION_UPDATE\`, \`WORLD_LORE_UPDATE\`):** Tên/Tiêu đề phải khớp chính xác với thực thể cần cập nhật.
    *   **QUAN TRỌNG VỀ CẬP NHẬT NHÂN VẬT:** Bạn PHẢI sử dụng tag chính xác dựa trên loại nhân vật. Kiểm tra các danh sách \`Đạo Lữ (JSON)\`, \`Nô Lệ (JSON)\`, \`Tù Nhân (JSON)\`, và \`Các NPC đã gặp (JSON)\` để xác định loại nhân vật trước khi tạo tag.
        *   **Với NPC thông thường:** Dùng \`[NPC_UPDATE: name="Tên NPC Hiện Tại", newName="Tên Mới (Tùy chọn)", affinity="=+X hoặc -=Y", description="Mô tả mới", realm="Cảnh giới mới", tuChat="Tư chất mới (TÙY CHỌN)", relationshipToPlayer="Mối quan hệ mới", statsJSON='{...}', ...]\`. Nên thường xuyên thay đổi \`relationshipToPlayer\` theo đúng với diễn biến và độ thiện cảm.
        *   **Với Đạo Lữ (Vợ):** Dùng \`[WIFE_UPDATE: name="Tên Đạo Lữ", affinity=+=X, willpower=+=X, obedience=+=X]\`.
        *   **Với Nô Lệ:** Dùng \`[SLAVE_UPDATE: name="Tên Nô Lệ", affinity=+=X, willpower=+=X, obedience=+=X]\`.
        *   **Với Tù Nhân:** Dùng \`[PRISONER_UPDATE: name="Tên Tù Nhân", affinity=+=X, willpower=-=X, resistance=-=X, obedience=+=X]\`.
    *   \`[LOCATION_UPDATE: name="Tên Địa Điểm Hiện Tại", newName="Tên Mới (Tùy chọn)", description="Mô tả mới", isSafeZone=true/false, mapX=X, mapY=Y, locationType="CHỌN MỘT TRONG: ${Object.values(GameTemplates.LocationType).join(' | ')}", ...]\`
    *   \`[LOCATION_CHANGE: name="Tên Địa Điểm Mới"]\`: BẮT BUỘC SỬ DỤNG: Dùng để di chuyển người chơi đến một địa điểm đã biết. Hệ thống sẽ tự động cập nhật vị trí hiện tại của người chơi. Kể cả khi không đi đâu thì cũng phải để tên địa điểm mới là tên địa điểm hiện tại.
    *   \`[FACTION_UPDATE: name="Tên Phe Phái Hiện Tại", newName="Tên Mới (Tùy chọn)", description="Mô tả mới", alignment="Chính/Tà...", playerReputation="=X hoặc +=X hoặc -=X"]\`
    *   \`[WORLD_LORE_UPDATE: title="Tiêu Đề Lore Hiện Tại", newTitle="Tiêu Đề Mới (Tùy chọn)", content="Nội dung lore mới."]\``);
    }

    if (config.sendDeletionRules) {
        rules.push(`**11. Tags Xóa Thông Tin Thế Giới (\`NPC_REMOVE\`, \`WIFE_REMOVE\`, \`SLAVE_REMOVE\`, \`PRISONER_REMOVE\`, \`FACTION_REMOVE\`, \`YEUTHU_REMOVE\`):**
    *   \`[NPC_REMOVE: name="Tên NPC Cần Xóa"]\`
    *   \`[WIFE_REMOVE: name="Tên Đạo Lữ Cần Xóa"]\`
    *   \`[SLAVE_REMOVE: name="Tên Nô Lệ Cần Xóa"]\`
    *   \`[PRISONER_REMOVE: name="Tên Tù Nhân Cần Xóa"]\`
    *   \`[YEUTHU_REMOVE: name="Tên Yêu Thú Cần Xóa"]\`
    *   \`[FACTION_REMOVE: name="Tên Phe Phái Cần Xóa"]\`
        *   **Lưu ý:** Dùng khi một thực thể đã chết hoặc biến mất vĩnh viễn khỏi câu chuyện.`);
    }

    rules.push(`**12. Tag \`[MESSAGE: "Thông báo tùy chỉnh cho người chơi"]\`:** Dùng cho các thông báo hệ thống đặc biệt. **KHÔNG dùng để thông báo về việc lên cấp/đột phá cảnh giới.**`);
    
    if (config.sendSimpleCompanionRules) {
        rules.push(`**13. Tags Đồng Hành (\`COMPANION_*\` - Dành cho các bạn đồng hành đơn giản như thú cưng):**
    *   \`[COMPANION_JOIN: name="Tên",description="Mô tả",hp=X,maxHp=X,mana=Y,maxMana=Y,atk=Z, realm="Cảnh giới (nếu có)"]\`
    *   \`[COMPANION_LEAVE: name="Tên"]\`
    *   \`[COMPANION_STATS_UPDATE: name="Tên",hp=ThayĐổi,mana=ThayĐổi,atk=ThayĐổi]\``);
    }

    if (config.sendStatusEffectRules) {
        rules.push(`**14. Tags Hiệu Ứng Trạng Thái (\`STATUS_EFFECT_*\`):**
    *   \`[STATUS_EFFECT_APPLY: name="Tên Hiệu Ứng", description="Mô tả hiệu ứng", type="buff|debuff|neutral", durationTurns=X (0 là vĩnh viễn/cho đến khi gỡ bỏ), statModifiers='{"statName1": value1, "statName2": "±Y%"}', specialEffects="Hiệu ứng đặc biệt 1;Hiệu ứng đặc biệt 2"]\`
    *   \`[STATUS_EFFECT_REMOVE: name="Tên Hiệu Ứng Cần Gỡ Bỏ"]\`
    *   **LƯU Ý QUAN TRỌNG KHI SỬ DỤNG VẬT PHẨM (VÍ DỤ: ĐAN DƯỢC):**
        Khi một vật phẩm (ví dụ: đan dược như "Bình Khí Huyết") được sử dụng và mang lại các hiệu ứng TẠM THỜI (tăng chỉ số, hiệu ứng đặc biệt), bạn PHẢI sử dụng tag \\\`[STATUS_EFFECT_APPLY: ...]\`\\\` để biểu thị các hiệu ứng này, thay vì dùng \\\`[STATS_UPDATE: ...]\`\\\` cho các chỉ số bị ảnh hưởng tạm thời.
        *   **Thứ tự:** Luôn đặt tag \`[ITEM_CONSUMED: ...]\` TRƯỚC tag \`[STATUS_EFFECT_APPLY: ...]\`.
        *   **Ví dụ:** Nếu vật phẩm "Bình Khí Huyết" (mô tả: "Một loại dược dịch có tác dụng bồi bổ khí huyết, tăng cường sinh lực. Uống vào sẽ cảm thấy cơ thể nóng rực, dục hỏa bừng bừng." và có tác dụng: "Tăng cường 20 sức tấn công, 30 sinh lực tối đa trong 30 phút. Tăng 10 điểm mị lực, 10 điểm dục vọng.") được sử dụng, bạn NÊN trả về:
            \`[ITEM_CONSUMED: name="Bình Khí Huyết", quantity=1]\`
            \`[STATUS_EFFECT_APPLY: name="Khí Huyết Sôi Trào", description="Cơ thể nóng rực, khí huyết cuộn trào, tăng cường sức mạnh và dục vọng.", type="buff", durationTurns=30, statModifiers='{"sucTanCong": 20, "maxSinhLuc": 30}', specialEffects="Tăng 10 điểm mị lực;Tăng 10 điểm dục vọng;Dục hỏa bùng cháy dữ dội"]\`
        *   Các thay đổi vĩnh viễn hoặc hồi phục trực tiếp (ví dụ: hồi máu từ đan dược hồi phục không tăng maxSinhLuc) vẫn có thể dùng \`[STATS_UPDATE: sinhLuc=+=Y]\`.
        *   Nếu vật phẩm có cả hiệu ứng hồi phục tức thời VÀ hiệu ứng buff tạm thời, hãy dùng CẢ HAI tag: \`[STATS_UPDATE: sinhLuc=+=Y]\` cho phần hồi phục và \\\`[STATUS_EFFECT_APPLY: ...]\`\\\` cho phần buff.
        *   Đối với các chỉ số không có trong hệ thống người chơi (ví dụ: "mị lực", "dục vọng" từ ví dụ trên), hãy mô tả chúng trong thuộc tính \`specialEffects\` của tag \\\`STATUS_EFFECT_APPLY\\\`.`);
    }
    
    rules.push(`**15. Tag \`[REMOVE_BINH_CANH_EFFECT: kinhNghiemGain=X]\` (Chỉ khi \`isCultivationEnabled=true\`):** Dùng khi nhân vật có cơ duyên đột phá khỏi bình cảnh. \`X\` là lượng kinh nghiệm nhỏ (ví dụ 1 hoặc 10) được cộng thêm để vượt qua giới hạn cũ. Tag này sẽ tự động đặt \`hieuUngBinhCanh=false\`.
    *   **VÍ DỤ (Allowed):** \`[REMOVE_BINH_CANH_EFFECT: kinhNghiemGain=10]\``);
    
    if (config.sendCombatStartRules) {
        rules.push(`**16. Tag Chiến Đấu \`[BEGIN_COMBAT: opponentIds="id_npc1,id_npc2,..."]\` (Mới):**
    *   Khi một cuộc chiến bắt đầu, hãy sử dụng tag này để bắt đầu giao diện chiến đấu.
    *   Cung cấp ID của tất cả các NPC đối thủ, cách nhau bởi dấu phẩy. Hệ thống game sẽ tìm NPC theo ID hoặc tên.
    *   Ví dụ: Nếu người chơi gây sự với "Lưu manh Giáp" và "Lưu manh Ất", bạn sẽ trả về \`[BEGIN_COMBAT: opponentIds="Lưu manh Giáp,Lưu manh Ất"]\`
    *   Sau tag này, bạn KHÔNG cần cung cấp các lựa chọn [CHOICE] nữa. Hệ thống sẽ chuyển sang màn hình chiến đấu.`);
    }

    if (config.sendChoiceRules) {
        rules.push(`**17. LỰA CHỌN HÀNH ĐỘNG MỚI (QUAN TRỌNG):**
    *   Luôn cung cấp 3 đến 4 lựa chọn hành động mới.
    *   **ĐỊNH DẠNG BẮT BUỘC CHO MỖI LỰA CHỌN:** \\\`[CHOICE: "Nội dung lựa chọn (Thành công: X% - Độ khó '${worldConfig?.difficulty || 'Thường'}', Lợi ích: Mô tả lợi ích khi thành công. Rủi ro: Mô tả rủi ro khi thất bại)"]\`\\\`.
    *   \`X%\`: Tỉ lệ thành công ước tính. PHẢI phản ánh Độ Khó của game (xem hướng dẫn ở trên).
    *   \`Lợi ích\`: Mô tả rõ ràng những gì người chơi có thể nhận được nếu hành động thành công (ví dụ: vật phẩm, kinh nghiệm, thông tin, thay đổi thiện cảm NPC, tiến triển nhiệm vụ).
    *   \`Rủi ro\`: Mô tả rõ ràng những hậu quả tiêu cực nếu hành động thất bại (ví dụ: mất máu, bị phát hiện, nhiệm vụ thất bại, giảm thiện cảm).
    *   **Ví dụ (Độ khó 'Thường'):** \`[CHOICE: "Thử thuyết phục lão nông (Thành công: 65% - Độ khó 'Thường', Lợi ích: Biết được lối vào bí mật, +10 thiện cảm. Rủi ro: Bị nghi ngờ, -5 thiện cảm, lão nông báo quan)"]\`
    *   **Ví dụ (Độ khó 'Ác Mộng'):** \`[CHOICE: "Một mình đối đầu Hắc Long (Thành công: 20% - Độ khó 'Ác Mộng', Lợi ích: Nếu thắng, nhận danh hiệu 'Diệt Long Giả', vô số bảo vật. Rủi ro: Gần như chắc chắn tử vong, mất toàn bộ vật phẩm không khóa)"]\``);
    }
    
    if (config.sendTurnRules) {
        rules.push(`**18. Tăng lượt chơi:** Kết thúc phản hồi bằng tag **[STATS_UPDATE: turn=+1]**. **KHÔNG được quên tag này.**`);
    }

    if (config.sendWorldProgressionRules) {
        rules.push(`**19. Quy Tắc Thế Giới Vận Động (World Progression Rule):**
*   **Diễn Biến Phe Phái:** Cứ sau khoảng 5-10 lượt chơi, hãy xem xét các phe phái (\`discoveredFactions\`) trong game. Dựa trên bản chất (Chính/Tà/Trung Lập) và mục tiêu của họ, hãy tạo ra một sự kiện nhỏ mà họ thực hiện "off-screen" và tạo ra sự kiện đó bằng tag [EVENT_TRIGGERED: title="Tên sự kiện", description="Mô tả", type="Chiến Tranh", timeToStart="X ngày", duration="Y ngày", locationName="Tên Địa Điểm Chính Liên Quan"]. Ví dụ: [EVENT_TRIGGERED: title="Hắc Phong Trại Mở Rộng", description="Hắc Phong Trại đang mở rộng địa bàn về phía nam, gây xung đột với các thương hội.", type="Chiến Tranh", timeToStart="5 ngày", duration="10 ngày", locationName="Thành Phía Nam"]. Điều này tạo ra các mối đe dọa hoặc cơ hội mới.
*   **Sự Kiện Môi Trường:** Thỉnh thoảng (khoảng 10-15 lượt một lần hoặc khi người chơi di chuyển đến một địa điểm mới), hãy tạo ra một sự kiện môi trường ngẫu nhiên để làm thế giới sống động hơn. Ví dụ: một cơn bão bất chợt, một thương nhân quý hiếm xuất hiện, hoặc một hiện tượng thiên văn kỳ lạ. Hãy mô tả nó trong lời kể hoặc dùng tag [EVENT_TRIGGERED: ...] nếu đó là một sự kiện có cấu trúc. Ví dụ: [EVENT_TRIGGERED: title="Bão Lớn Sắp Tới", description="Một cơn bão lớn đang hình thành ngoài biển, dự kiến sẽ đổ bộ trong 3 ngày tới.", type="Thiên Tai", timeToStart="3 ngày", duration="2 ngày", locationName="Vùng Biển Phía Đông"].
*   **SỰ KIỆN Ở XA (QUAN TRỌNG):** Khi tạo sự kiện động, bạn được phép và được khuyến khích đặt sự kiện ở những địa điểm mà người chơi **chưa khám phá**. Điều này tạo ra mục tiêu và lý do để người chơi đi thám hiểm thế giới. Hệ thống sẽ tự động tạo ra một địa điểm placeholder nếu nó không tồn tại.`);
        rules.push(`**20. QUY TẮC MỚI VỀ SỰ KIỆN ĐỘNG:**
*   **[EVENT_TRIGGERED: title="Tên sự kiện", description="Mô tả", type="Loại", timeToStart="X ngày/tháng", duration="Y ngày", locationName="Tên Địa Điểm Chính"]**: Dùng để tạo một sự kiện mới. \`locationName\` phải là một địa điểm lớn đã tồn tại.
*   **[EVENT_UPDATE: eventTitle="Tên sự kiện cần tìm", newTitle="Tên mới", newDescription="Mô tả mới", newStartDate="X ngày/tháng", newDuration="Y ngày/tháng", newLocationName="Địa điểm CỤ THỂ mới", createLocationIfNeeded=true]**: Dùng để cập nhật một sự kiện đã có. \`eventTitle\` là tên để tìm. Nếu bạn muốn chỉ định một địa điểm CỤ THỂ bên trong địa điểm chính (ví dụ: "Vạn Bảo Lâu" trong "Thần Thành"), hãy dùng \`newLocationName\`. Nếu bạn thêm \`createLocationIfNeeded=true\`, hệ thống sẽ tự tạo địa điểm đó nếu nó chưa tồn tại.
*   **[EVENT_DETAIL_REVEALED: eventTitle="Tên sự kiện cần tìm", detail="Nội dung thông tin mới"]**: Dùng để hé lộ một mẩu thông tin mới về sự kiện.
*   **VÍ DỤ LUỒNG SỰ KIỆN:**
    1.  Người chơi nghe tin đồn -> Bạn tạo: \`[EVENT_TRIGGERED: title="Đại Hội Luyện Đan", ..., locationName="Dược Vương Cốc", timeToStart="7 ngày", duration="3 ngày"]\`
    2.  Có diễn biến bất ngờ -> Lời kể của bạn: "...đại hội được đẩy lên sớm hơn!" -> Bạn tạo tag: \`[EVENT_UPDATE: eventTitle="Đại Hội Luyện Đan", newStartDate="3 ngày"]\`
    3.  Người chơi hỏi thăm -> Lời kể: "...bạn biết được đại hội sẽ diễn ra tại Đan Lôi Đài." -> Bạn tạo tag: \`[EVENT_UPDATE: eventTitle="Đại Hội Luyện Đan", newLocationName="Đan Lôi Đài", createLocationIfNeeded=true]\`
    4.  Người chơi tiếp tục hỏi thăm -> Lời kể: "...nghe nói phần thưởng cuối cùng là một viên Thượng Cổ Thần Đan." -> Bạn tạo tag: \`[EVENT_DETAIL_REVEALED: eventTitle="Đại Hội Luyện Đan", detail="Phần thưởng cuối cùng là Thượng Cổ Thần Đan."]\``);
    }
    
    return rules.join('\n\n');
};