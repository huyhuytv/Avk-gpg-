import { WorldSettings, StartingSkill, StartingItem, StartingNPC, StartingLore, StartingLocation, StartingFaction, GenreType, ViolenceLevel, StoryTone, NsfwDescriptionStyle, TuChatTier, StartingYeuThu } from '../types';
import { SUB_REALM_NAMES, ALL_FACTION_ALIGNMENTS, AVAILABLE_GENRES, VIETNAMESE, CUSTOM_GENRE_VALUE, DEFAULT_VIOLENCE_LEVEL, DEFAULT_STORY_TONE, VIOLENCE_LEVELS, STORY_TONES, DEFAULT_NSFW_DESCRIPTION_STYLE, NSFW_DESCRIPTION_STYLES, WEAPON_TYPES_FOR_VO_Y, STAT_POINT_VALUES, SPECIAL_EFFECT_KEYWORDS, TU_CHAT_TIERS } from '../constants';
import * as GameTemplates from '../templates';
import { CONG_PHAP_GRADES, LINH_KI_CATEGORIES, LINH_KI_ACTIVATION_TYPES, PROFESSION_GRADES } from '../templates';

// Helper to determine if a field is empty or at its default state.
// We are hardcoding default values to avoid circular dependencies with constants.ts.
const isFieldEmptyForCompletion = (fieldName: keyof WorldSettings, value: any): boolean => {
    if (value === undefined || value === null) return true;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'string') return value.trim() === '';

    // Specific default value checks for numbers that have non-zero defaults
    // These values are from `constants/world.ts`
    switch(fieldName) {
        case 'startingCurrency':
            return value === 10;
        case 'playerThoNguyen':
            return value === 100;
        case 'playerMaxThoNguyen':
            return value === 100;
        default:
            // For other numbers, consider 0 as potentially empty unless it's a valid setting.
            // For booleans (like nsfwMode), !value works correctly (false is considered "empty"/default).
            return !value; 
    }
};

// Helper to generate the description for each field, now taking the fieldName
const describeField = (label: string, fieldName: keyof WorldSettings, value: any): string => {
    if (!isFieldEmptyForCompletion(fieldName, value)) {
        return `  - ${label}: ĐÃ CÓ (Giá trị hiện tại: ${JSON.stringify(value)}) - **KHÔNG ĐƯỢC THAY ĐỔI**`;
    }
    return `  - ${label}: **CẦN TẠO**`;
};


export const generateCompletionPrompt = (
    settings: WorldSettings,
    isNsfwIdea: boolean,
    genre: GenreType,
    isCultivationEnabled: boolean,
    violenceLevel: ViolenceLevel, 
    storyTone: StoryTone,       
    customGenreName?: string,
    nsfwStyle?: NsfwDescriptionStyle 
): string => {

    const effectiveGenreDisplay = (genre === CUSTOM_GENRE_VALUE && customGenreName) ? customGenreName : genre;
    const currentViolenceLevel = violenceLevel || DEFAULT_VIOLENCE_LEVEL;
    const currentStoryTone = storyTone || DEFAULT_STORY_TONE;
    const currentNsfwStyle = nsfwStyle || DEFAULT_NSFW_DESCRIPTION_STYLE;

    const cultivationSystemInstructions = isCultivationEnabled ? `
    *   **Tạo Hệ Thống Cảnh Giới Theo Chủng Tộc (CỰC KỲ QUAN TRỌNG):**
        *   **Yêu cầu:** Dựa trên các thông tin đã có, hãy tạo ra các hệ thống cảnh giới/cấp bậc **RIÊNG BIỆT** cho các chủng tộc khác nhau. Tên gọi phải phản ánh văn hóa và bản chất của từng chủng tộc.
        *   **Định dạng:**
            *   Sử dụng tag **[GENERATED_RACE_SYSTEM: race="Tên Chủng Tộc", system="Hệ thống cảnh giới, phân cách bằng ' - '"]** cho mỗi chủng tộc bạn tạo ra. **BẮT BUỘC SỐ LƯỢNG CẢNH GIỚI PHẢI BẰNG NHAU GIỮA CÁC CHỦNG TỘC:** ví dụ nhân tộc có 15 cảnh giới thì ma tộc và yêu tộc cũng phải có 15 cảnh giới.
            *   **Ví dụ:**
                [GENERATED_RACE_SYSTEM: race="Nhân Tộc", system="Luyện Khí - Trúc Cơ - Kim Đan"]
    *   **Tạo Hệ Thống Cảnh Giới Yêu Thú:**
        *   Tạo một hệ thống riêng cho Yêu Thú.
        *   **Định dạng:** [GENERATED_YEUTHU_SYSTEM: system="Hệ thống cảnh giới của Yêu Thú, phân cách bằng ' - '"] **BẮT BUỘC SỐ LƯỢNG CẢNH GIỚI PHẢI BẰNG NHAU GIỮA CÁC CHỦNG TỘC:** ví dụ nhân tộc và ma tộc có 15 cảnh giới thì yêu thú cũng phải có 15 cảnh giới.
    *   **Tạo Cảnh Giới Khởi Đầu:**
        *   Phải là một cấp độ cụ thể trong hệ thống trên, theo định dạng "[Tên Cảnh Giới Lớn] [Tên Cảnh Giới Nhỏ]", ví dụ: "Phàm Nhân Nhất Trọng".
        *   **Định dạng:** [GENERATED_CANH_GIOI_KHOI_DAU: text="Cảnh giới/cấp độ khởi đầu do AI tạo"]
` : ``;
    
    const lifespanInstruction = isCultivationEnabled ? `
**HƯỚN DẪN VỀ THỌ NGUYÊN (TUỔI THỌ):**
Tuổi thọ tối đa (\`maxThoNguyen\`) tăng mạnh theo từng đại cảnh giới. Đây là quy tắc BẮT BUỘC bạn phải tuân theo khi tạo người chơi và NPC.
*   **Công thức tính:**
    1.  **Thọ nguyên gốc (Phàm Nhân):** 120 năm.
    2.  **Thọ nguyên cộng thêm mỗi đại cảnh giới:** \`Thọ nguyên cộng thêm = 100 * (1.8 ^ (Thứ tự đại cảnh giới - 1))\`.
*   **Cách áp dụng:**
    *   **\`maxThoNguyen\`:** PHẢI được tính theo công thức trên dựa vào cảnh giới của nhân vật.
    *   **\`thoNguyen\` (số năm còn lại):** PHẢI nhỏ hơn \`maxThoNguyen\`.
` : '';

    const npcRealmInstruction = isCultivationEnabled
    ? `, realm="Cảnh giới NPC (BẮT BUỘC nếu có tu luyện). Hãy tạo ra sự đa dạng về cảnh giới (PHẢI ĐÚNG VỚI CHỦNG TỘC) cho các NPC để thế giới trở nên sống động. Ví dụ: một số NPC có thể là người thường không tu luyện (dùng cảnh giới '${VIETNAMESE.mortalRealmName}'), một số là tu sĩ cấp thấp ('Phàm Nhân Cửu Trọng', 'Luyện Khí Tam Trọng'), và một số khác là các cao thủ, trưởng lão, hoặc quái vật có cảnh giới cao hơn đáng kể ('Kim Đan Kỳ', 'Nguyên Anh Viên Mãn', v.v.). Cảnh giới PHẢI là một cấp độ hợp lệ từ Hệ Thống Cảnh Giới đã tạo ở trên (Không được phép ghi là không rõ)." tuChat="CHỌN MỘT TRONG: ${TU_CHAT_TIERS.join(' | ')}" (BẮT BUỘC nếu có tu luyện. Tư chất quyết định tốc độ tu luyện của NPC)" spiritualRoot="Linh căn của NPC (BẮT BUỘC, nếu không có thì ghi là 'Không có')", specialPhysique="Thể chất của NPC (BẮT BUỘC, nếu không có thì ghi là 'Không có')", thoNguyen=X, maxThoNguyen=Y (BẮT BUỘC. Áp dụng **HƯỚN DẪN VỀ THỌ NGUYÊN** đã cung cấp để tính toán.)`
    : `, thoNguyen=X, maxThoNguyen=Y (TÙY CHỌN. Logic: maxThoNguyen dựa trên loài người (~80). thoNguyen = maxThoNguyen - tuổi ước tính)`;

    const tagGenerationInstructions = `
**HƯỚN DẪN VỀ ĐỊNH DẠNG TAG (Sử dụng các tag này để trả về dữ liệu):**

*   **Thông Tin Thế Giới:**
    *   Chủ Đề: [GENERATED_WORLD_THEME: text="Chủ đề..."]
    *   Bối Cảnh: [GENERATED_WORLD_SETTING_DESCRIPTION: text="Bối cảnh chi tiết..."]
    *   Văn Phong: [GENERATED_WORLD_WRITING_STYLE: text="Văn phong..."]
    *   Tiền Tệ: [GENERATED_CURRENCY_NAME: name="Tên tiền tệ"]
    *   Số Tiền Khởi Đầu: [GENERATED_STARTING_CURRENCY: value=X]
    *   Ngày Bắt Đầu: [GENERATED_STARTING_DATE: day=15, month=3, year=1024, buoi="Buổi Sáng"]
*   **Thông Tin Nhân Vật:**
    *   Tên: [GENERATED_PLAYER_NAME: name="Tên"]
    *   Giới Tính: [GENERATED_PLAYER_GENDER: gender="Nam/Nữ/Khác"]
    *   Chủng Tộc: [GENERATED_PLAYER_RACE: text="Tên chủng tộc"]
    *   Tính Cách: [GENERATED_PLAYER_PERSONALITY: text="Tính cách..."]
    *   Tiểu Sử: [GENERATED_PLAYER_BACKSTORY: text="Tiểu sử..."]
    *   Mục Tiêu: [GENERATED_PLAYER_GOAL: text="Mục tiêu..."]
    *   Đặc Điểm: [GENERATED_PLAYER_STARTING_TRAITS: text="Đặc điểm..."]
    *   Linh Căn: [GENERATED_PLAYER_SPIRITUAL_ROOT: text="Tên linh căn"]
    *   Thể Chất: [GENERATED_PLAYER_SPECIAL_PHYSIQUE: text="Tên thể chất"]
    *   Thọ Nguyên: [GENERATED_PLAYER_THO_NGUYEN: value=100]
    *   Thọ Nguyên Tối Đa: [GENERATED_PLAYER_MAX_THO_NGUYEN: value=120]
*   **Hệ Thống Tu Luyện:**
    *   Hệ Thống Theo Chủng Tộc: [GENERATED_RACE_SYSTEM: race="Tên Chủng Tộc", system="Hệ thống cảnh giới..."]
    *   Hệ Thống Yêu Thú: [GENERATED_YEUTHU_SYSTEM: system="Hệ thống cảnh giới..."]
    *   Cảnh Giới Khởi Đầu: [GENERATED_CANH_GIOI_KHOI_DAU: text="Cảnh giới cụ thể..."]
*   **Yếu Tố Khởi Đầu (Chi tiết bên dưới):**
    *   **Tạo Kỹ Năng:**
        - **HƯỚN DẪN CHI TIẾT CHO TAG \`[GENERATED_SKILL: ...]\`:**
        - **Thuộc tính chung (BẮT BUỘC cho mọi loại):** \`name\`, \`description\`, \`skillType="CHỌN MỘT TRONG: ${Object.values(GameTemplates.SkillType).join(' | ')}"\`, \`otherEffects="Hiệu ứng đặc biệt của kĩ năng, bắt buộc phải có"\`.
        - **Thuộc tính cho Công Pháp Tu Luyện (\`skillType="${GameTemplates.SkillType.CONG_PHAP_TU_LUYEN}"\`):**
            - \`congPhapType="CHỌN MỘT TRONG: ${Object.values(GameTemplates.CongPhapType).join(' | ')}"\`
            - \`congPhapGrade="CHỌN MỘT TRONG: ${[...CONG_PHAP_GRADES].join(' | ')}"\`
            - Nếu \`congPhapType="${GameTemplates.CongPhapType.VO_Y}"\`, thêm \`weaponFocus="CHỌN MỘT TRONG: ${[...WEAPON_TYPES_FOR_VO_Y].join(' | ')}"\`.
        - **Thuộc tính cho Linh Kĩ (\`skillType="${GameTemplates.SkillType.LINH_KI}"\`):**
            - \`linhKiCategory="CHỌN MỘT TRONG: ${[...LINH_KI_CATEGORIES].join(' | ')}"\`
            - \`linhKiActivation="CHỌN MỘT TRONG: ${[...LINH_KI_ACTIVATION_TYPES].join(' | ')}"\`
            - Nếu \`linhKiActivation="Chủ động"\`, thêm các thuộc tính chiến đấu chung. Nếu \`linhKiCategory="Tấn công"\`, thêm \`baseDamage\`, \`damageMultiplier\`. Nếu \`linhKiCategory="Hồi phục"\`, thêm \`baseHealing\`, \`healingMultiplier\`.
            - Nếu \`linhKiActivation="Bị động"\`, chỉ cần có \`otherEffects\`.
        - **Thuộc tính cho Thần Thông (\`skillType="${GameTemplates.SkillType.THAN_THONG}"\`):** (Chỉ dùng thuộc tính chiến đấu chung).
        - **Thuộc tính cho Cấm Thuật (\`skillType="${GameTemplates.SkillType.CAM_THUAT}"\`):**
            - \`sideEffects="Mô tả tác dụng phụ, ví dụ: giảm tuổi thọ, mất tu vi..."\`
        - **Thuộc tính cho Nghề Nghiệp (\`skillType="${GameTemplates.SkillType.NGHE_NGHIEP}"\`):** (Bắt buộc phải chọn 1 trong những nghề nghiệp vừa dược đề ra, phải dựa vào tính chất nghề nghiệp để đưa ra các kĩ năng phù hợp)
            - \`professionType="CHỌN MỘT TRONG: ${Object.values(GameTemplates.ProfessionType).join(' | ')}"\`
            - \`skillDescription="Mô tả kỹ năng nghề đó làm được gì cụ thể."\`
            - \`professionGrade="CHỌN MỘT TRONG: ${[...PROFESSION_GRADES].join(' | ')}"\`
        - **THUỘC TÍNH CHIẾN ĐẤU CHUNG (Dùng cho Linh Kĩ (Chủ động), Thần Thông, Cấm Thuật):**
            - \`manaCost=SỐ\`, \`cooldown=SỐ LƯỢT\`, \`otherEffects="Hiệu ứng 1;Hiệu ứng 2"\`.
            - **CHỈ DÙNG CHO CÁC KỸ NĂNG GÂY SÁT THƯƠNG/HỒI PHỤC (ví dụ Linh Kĩ Tấn Công/Hồi Phục):**
                - \`baseDamage=SỐ\` (sát thương cơ bản), \`damageMultiplier=SỐ THẬP PHÂN\` (hệ số % ATK, vd: 0.5 cho 50%).
                - \`baseHealing=SỐ\` (hồi phục cơ bản), \`healingMultiplier=SỐ THẬP PHÂN\` (hệ số % ATK, vd: 0.2 cho 20%).
    *   **Tạo Vật Phẩm:**
        - **HƯỚN DẪN CHI TIẾT CHO TAG \`[GENERATED_ITEM: ...]\`:**
        - **QUAN TRỌNG VỀ KINH TẾ:** Giá trị của vật phẩm trong game được TÍNH TOÁN DỰA TRÊN các thuộc tính của nó. Vì vậy, việc cung cấp đầy đủ và chính xác các thông tin sau là CỰC KỲ QUAN TRỌNG.
        - **CHI TIẾT THUỘC TÍNH:**
            - \`category\`: BẮT BUỘC. Phải là một trong: \`${Object.values(GameTemplates.ItemCategory).join(' | ')}\`.
            - \`rarity\`: BẮT BUỘC. Phải là một trong: \`${Object.values(GameTemplates.ItemRarity).join(' | ')}\`.
            - **\`itemRealm\`: BẮT BUỘC. Đây là cảnh giới/cấp độ của vật phẩm, quyết định sức mạnh và giá trị cơ bản của nó. **PHẢI** là một trong các cảnh giới lớn trong tag \`[GENERATED_RACE_SYSTEM: race="Nhân Tộc", ...]\` mà bạn đã tạo ở trên. KHÔNG được sử dụng cảnh giới từ hệ thống của các chủng tộc khác hoặc các cảnh giới không có trong danh sách. Ví dụ, nếu bạn tạo \`system="Luyện Khí - Trúc Cơ"\`, thì \`itemRealm\` chỉ có thể là "Luyện Khí" hoặc "Trúc Cơ".**
        - **THUỘC TÍNH BỔ SUNG TÙY THEO \`category\`:**
            - Nếu \`category="${GameTemplates.ItemCategory.EQUIPMENT}"\`:
                - \`equipmentType\`: BẮT BUỘC. Phải là một trong: \`${Object.values(GameTemplates.EquipmentType).join(' | ')}\`.
                - \`slot\`: TÙY CHỌN. Vị trí trang bị, ví dụ: "Vũ Khí Chính", "Giáp Thân".
                - \`statBonusesJSON\`: BẮT BUỘC. Một chuỗi JSON hợp lệ chứa các chỉ số cộng thêm. Các khóa hợp lệ là: \`${Object.keys(STAT_POINT_VALUES).join(', ')}\`. Nếu không có, dùng \`statBonusesJSON='{}'\`. Ví dụ: \`statBonusesJSON='{"sucTanCong": 15, "maxSinhLuc": 100}'\`.
                - \`uniqueEffectsList\`: BẮT BUỘC. Danh sách hiệu ứng đặc biệt, cách nhau bởi dấu ';'. Nếu không có, dùng \`uniqueEffectsList="Không có gì đặc biệt"\`. Cố gắng sử dụng các từ khóa sau để hệ thống tính giá trị chính xác hơn: \`${Object.keys(SPECIAL_EFFECT_KEYWORDS).join(', ')}\`. Ví dụ: \`uniqueEffectsList="hút máu 5%;tăng 10% chí mạng"\`.
            - Nếu \`category="${GameTemplates.ItemCategory.POTION}"\`:
                - \`potionType\`: BẮT BUỘC. Phải là một trong: \`${Object.values(GameTemplates.PotionType).join(' | ')}\`.
                - \`effectsList\`: BẮT BUỘC. Danh sách hiệu ứng, cách nhau bởi ';'. Ví dụ: "Hồi 50 HP;Tăng 10 công trong 3 lượt".
            - (Các loại khác giữ nguyên hướng dẫn cũ)
    *   **Tạo NPC:** [GENERATED_NPC: name="Tên NPC (BẮT BUỘC)", gender="Nam/Nữ/Khác/Không rõ (BẮT BUỘC)", race="Chủng tộc (BẮT BUỘC, CHỈ ĐƯỢC TẠO RA NHỮNG CHỦNG TỘC CÓ HỆ THỐNG CẢNH GIỚI Ở TRÊN, TUYỆT ĐỐI KHÔNG CHỌN CHỦNG TỘC YÊU THÚ, ví dụ: Nhân Tộc, Yêu Tộc)", personality="Tính cách nổi bật (BẮT BUỘC)", initialAffinity=0 (SỐ NGUYÊN từ -100 đến 100), details="Vai trò, tiểu sử ngắn hoặc mối liên hệ với người chơi (BẮT BUỘC), phù hợp với thể loại '${effectiveGenreDisplay}'"${npcRealmInstruction}, relationshipToPlayer="Mối quan hệ (ví dụ: 'Mẹ Con', 'Sư phụ', 'Bằng hữu', 'Chủ nhân - nô lệ', 'Vợ chồng', 'Đạo lữ', 'Đối thủ', 'Bạn thời thơ ấu', 'Người bảo hộ', 'Chủ nợ'...)" (BẮT BUỘC nhưng khi npc và người chơi không có quan hệ gì thì để là 'Người xa lạ')].
    *   **Tạo Yêu Thú:** [GENERATED_YEUTHU: name="Tên", species="Loài", description="Mô tả", isHostile=true/false, realm="Cảnh giới (nếu có)"]
    *   **Tạo Tri Thức:** [GENERATED_LORE: title="Tiêu đề", content="Nội dung"]
    *   **Tạo Địa Điểm:** [GENERATED_LOCATION: name="Tên", description="Mô tả", locationType="Loại", isSafeZone=true, mapX=100, mapY=100]
    *   **Tạo Phe Phái:** [GENERATED_FACTION: name="Tên", description="Mô tả", alignment="Chính Nghĩa", initialPlayerReputation=0]
`;

    let nsfwGuidanceForWorldGen = "";
    if (isNsfwIdea) {
        const violenceGuidanceText = VIETNAMESE[`violenceLevelGuidance${currentViolenceLevel.replace(/\s+/g, '')}` as keyof typeof VIETNAMESE] || VIETNAMESE.violenceLevelGuidanceThucTe;
        const storyToneGuidanceText = VIETNAMESE[`storyToneGuidance${currentStoryTone.replace(/\s+/g, '')}` as keyof typeof VIETNAMESE] || VIETNAMESE.storyToneGuidanceTrungTinh;
        let nsfwStyleSpecificGuidance = "";
        switch(currentNsfwStyle) {
            case 'Hoa Mỹ': nsfwStyleSpecificGuidance = VIETNAMESE.nsfwGuidanceHoaMy; break;
            case 'Trần Tục': nsfwStyleSpecificGuidance = VIETNAMESE.nsfwGuidanceTranTuc; break;
            case 'Gợi Cảm': nsfwStyleSpecificGuidance = VIETNAMESE.nsfwGuidanceGoiCam; break;
            case 'Mạnh Bạo (BDSM)': nsfwStyleSpecificGuidance = VIETNAMESE.nsfwGuidanceManhBaoBDSM; break;
            default: nsfwStyleSpecificGuidance = VIETNAMESE.nsfwGuidanceHoaMy;
        }


        nsfwGuidanceForWorldGen = `
- **Yêu cầu nội dung 18+:** BẬT. Hãy chủ động, ưu tiên và tích cực tạo ra các tên gọi, mô tả, tính cách, chi tiết NPC, kỹ năng, vật phẩm, và tri thức thế giới mang tính chất người lớn, nhạy cảm, và tình dục.
- **Phong Cách Miêu Tả Tình Dục (Người dùng chọn):** ${currentNsfwStyle}.
  ${nsfwStyleSpecificGuidance}
- **Mức Độ Bạo Lực (Người dùng chọn):** ${currentViolenceLevel}.
  ${violenceGuidanceText}
- **Tông Màu Câu Chuyện (Người dùng chọn):** ${currentStoryTone}.
  ${storyToneGuidanceText}
[GENERATED_NSFW_DESCRIPTION_STYLE: text="${currentNsfwStyle}"]
[GENERATED_VIOLENCE_LEVEL: text="${currentViolenceLevel}"]
[GENERATED_STORY_TONE: text="${currentStoryTone}"]`;
    } else {
        nsfwGuidanceForWorldGen = "- **Yêu cầu nội dung 18+:** TẮT. Vui lòng tạo các yếu tố phù hợp với mọi lứa tuổi, tập trung vào phiêu lưu và phát triển nhân vật.";
    }

return `
Bạn là một AI hỗ trợ viết lách và sáng tạo thế giới game nhập vai thể loại "${effectiveGenreDisplay}".
Người dùng đã điền một vài thông tin cho thế giới của họ và cần bạn giúp đỡ để hoàn thiện những phần còn trống.

**NHIỆM VỤ:**
1.  **Đọc kỹ** các thông tin đã có trong phần "THÔNG TIN HIỆN TẠI". Các thông tin này là bối cảnh chính và **KHÔNG THỂ THAY ĐỔI**.
2.  Dựa vào các thông tin đó, hãy **sáng tạo** và điền vào các mục được đánh dấu là "**CẦN TẠO**".
3.  **QUY TẮC TỐI THƯỢNG:** Chỉ trả về các tag [GENERATED_...] cho những mục được đánh dấu là '**CẦN TẠO**'. **TUYỆT ĐỐI KHÔNG** tạo lại tag cho những mục đã được đánh dấu là "ĐÃ CÓ".

---
**THÔNG TIN HIỆN TẠI (LÀM BỐI CẢNH ĐỂ SÁNG TẠO):**

**Thiết Lập Thế Giới:**
${describeField("Chủ Đề Thế Giới", 'theme', settings.theme)}
${describeField("Bối Cảnh Chi Tiết", 'settingDescription', settings.settingDescription)}
${describeField("Văn Phong AI", 'writingStyle', settings.writingStyle)}
${describeField("Tên Tiền Tệ", 'currencyName', settings.currencyName)}
${describeField("Tên Tùy Chỉnh Cho Thể Loại", 'customGenreName', settings.customGenreName)}
${isCultivationEnabled ? describeField("Hệ Thống Cảnh Giới Chủng Tộc", 'raceCultivationSystems', settings.raceCultivationSystems) : "  - Hệ Thống Tu Luyện: ĐÃ TẮT"}
${isCultivationEnabled ? describeField("Hệ Thống Cảnh Giới Yêu Thú", 'yeuThuRealmSystem', settings.yeuThuRealmSystem) : ""}
${isCultivationEnabled ? describeField("Cảnh Giới Khởi Đầu", 'canhGioiKhoiDau', settings.canhGioiKhoiDau) : ""}

**Nhân Vật Chính:**
${describeField("Tên Nhân Vật", 'playerName', settings.playerName)}
${describeField("Giới Tính", 'playerGender', settings.playerGender)}
${describeField("Chủng Tộc", 'playerRace', settings.playerRace)}
${describeField("Tính Cách", 'playerPersonality', settings.playerPersonality)}
${describeField("Tiểu Sử", 'playerBackstory', settings.playerBackstory)}
${describeField("Mục Tiêu", 'playerGoal', settings.playerGoal)}
${describeField("Đặc Điểm Khởi Đầu Chung", 'playerStartingTraits', settings.playerStartingTraits)}
${isCultivationEnabled ? describeField("Linh Căn", 'playerSpiritualRoot', settings.playerSpiritualRoot) : ""}
${isCultivationEnabled ? describeField("Thể Chất Đặc Biệt", 'playerSpecialPhysique', settings.playerSpecialPhysique) : ""}
${isCultivationEnabled ? describeField("Thọ Nguyên Còn Lại", 'playerThoNguyen', settings.playerThoNguyen) : ""}
${isCultivationEnabled ? describeField("Thọ Nguyên Tối Đa", 'playerMaxThoNguyen', settings.playerMaxThoNguyen) : ""}
${describeField("Số Tiền Khởi Đầu", 'startingCurrency', settings.startingCurrency)}

**Yếu Tố Khởi Đầu:**
${describeField("Kỹ Năng Khởi Đầu", 'startingSkills', settings.startingSkills)}
${describeField("Vật Phẩm Khởi Đầu", 'startingItems', settings.startingItems)}
${describeField("NPC Khởi Đầu", 'startingNPCs', settings.startingNPCs)}
${describeField("Yêu Thú Khởi Đầu", 'startingYeuThu', settings.startingYeuThu)}
${describeField("Tri Thức Khởi Đầu", 'startingLore', settings.startingLore)}
${describeField("Địa Điểm Khởi Đầu", 'startingLocations', settings.startingLocations)}
${describeField("Phe Phái Khởi Đầu", 'startingFactions', settings.startingFactions)}

---
**CHẾ ĐỘ NỘI DUNG:**
${nsfwGuidanceForWorldGen}
- Thể loại game: ${effectiveGenreDisplay}
- Hệ Thống Tu Luyện/Sức Mạnh Đặc Thù: ${isCultivationEnabled ? "BẬT" : "TẮT"}

---
${lifespanInstruction}
---
${tagGenerationInstructions}
---
**LỜI NHẮC CUỐI CÙNG:** Hãy dùng sự sáng tạo của bạn để làm cho các yếu tố mới này khớp một cách liền mạch với những gì người chơi đã cung cấp. Chỉ tạo tag cho các mục **CẦN TẠO**. Không thêm bất kỳ lời dẫn, giải thích, hay văn bản nào khác ngoài các tag được yêu cầu.
`;
};