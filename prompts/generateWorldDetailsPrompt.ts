import { SUB_REALM_NAMES, ALL_FACTION_ALIGNMENTS, AVAILABLE_GENRES, VIETNAMESE, CUSTOM_GENRE_VALUE, DEFAULT_VIOLENCE_LEVEL, DEFAULT_STORY_TONE, VIOLENCE_LEVELS, STORY_TONES, DEFAULT_NSFW_DESCRIPTION_STYLE, NSFW_DESCRIPTION_STYLES, WEAPON_TYPES_FOR_VO_Y, STAT_POINT_VALUES, SPECIAL_EFFECT_KEYWORDS } from '../constants';
import * as GameTemplates from '../templates';
import { GenreType, ViolenceLevel, StoryTone, NsfwDescriptionStyle, TuChatTier, TU_CHAT_TIERS } from '../types';
import { CONG_PHAP_GRADES, LINH_KI_CATEGORIES, LINH_KI_ACTIVATION_TYPES, PROFESSION_GRADES } from '../templates';

export const generateWorldDetailsPrompt = (
    storyIdea: string,
    isNsfwIdea: boolean,
    genre: GenreType,
    isCultivationEnabled: boolean,
    violenceLevel: ViolenceLevel, 
    storyTone: StoryTone,       
    customGenreName?: string,
    nsfwStyle?: NsfwDescriptionStyle 
): string => {
  const effectiveGenreDisplay = (genre === CUSTOM_GENRE_VALUE && customGenreName) ? customGenreName : genre;
  const genreForTag = (genre === CUSTOM_GENRE_VALUE && customGenreName) ? CUSTOM_GENRE_VALUE : genre;
  const customGenreNameForTag = (genre === CUSTOM_GENRE_VALUE && customGenreName) ? customGenreName : "";
  const currentViolenceLevel = violenceLevel || DEFAULT_VIOLENCE_LEVEL;
  const currentStoryTone = storyTone || DEFAULT_STORY_TONE;
  const currentNsfwStyle = nsfwStyle || DEFAULT_NSFW_DESCRIPTION_STYLE;


  const cultivationSystemInstructions = isCultivationEnabled ? `
    *   **Tạo Hệ Thống Cảnh Giới Theo Chủng Tộc (CỰC KỲ QUAN TRỌNG):**
        *   **Yêu cầu:** Dựa trên **Ý Tưởng Cốt Truyện** ("${storyIdea}"), thể loại ("${effectiveGenreDisplay}"), và các cài đặt 18+ đã chọn, hãy tạo ra các hệ thống cảnh giới/cấp bậc **RIÊNG BIỆT** cho các chủng tộc khác nhau. Tên gọi phải phản ánh văn hóa và bản chất của từng chủng tộc.
        *   **Nhân Tộc:** Hệ thống quen thuộc, tập trung vào tu luyện linh khí, đan điền.
        *   **Yêu Tộc:** Hệ thống dựa trên huyết mạch, khai mở sức mạnh tổ tiên, hóa hình. Ví dụ: Yêu Binh - Yêu Tướng - Yêu Vương...
        *   **Ma Tộc:** Hệ thống tà đạo, tu luyện ma công, thôn phệ. Ví dụ: Ma Binh - Ma Tướng - Ma Vương...
        *   **Các chủng tộc khác (Tùy bạn sáng tạo hoặc do người chơi miêu tả và yêu cầu):** Nếu có các chủng tộc như Cổ Tộc, Linh Tộc, v.v., hãy tạo hệ thống riêng cho họ.
        *   **Định dạng:**
            *   Sử dụng tag **[GENERATED_RACE_SYSTEM: race="Tên Chủng Tộc", system="Hệ thống cảnh giới, phân cách bằng ' - '"]** cho mỗi chủng tộc bạn tạo ra (tối thiểu là Nhân Tộc và Yêu Tộc). **BẮT BUỘC SỐ LƯỢNG CẢNH GIỚI PHẢI BẰNG NHAU GIỮA CÁC CHỦNG TỘC:** ví dụ nhân tộc có 15 cảnh giới thì ma tộc và yêu tộc cũng phải có 15 cảnh giới.
            *   **Ví dụ:**
                [GENERATED_RACE_SYSTEM: race="Nhân Tộc", system="Luyện Khí - Trúc Cơ - Kim Đan"]
                [GENERATED_RACE_SYSTEM: race="Ma Tộc", system="Ma Binh - Ma Tướng - Ma Vương"]
    *   **Tạo Hệ Thống Cảnh Giới Yêu Thú:**
        *   Tạo một hệ thống riêng cho Yêu Thú (không phải Yêu Tộc có thể hóa hình).
        *   **Định dạng:** [GENERATED_YEUTHU_SYSTEM: system="Hệ thống cảnh giới của Yêu Thú, phân cách bằng ' - '"] **BẮT BUỘC SỐ LƯỢNG CẢNH GIỚI PHẢI BẰNG NHAU GIỮA CÁC CHỦNG TỘC:** ví dụ nhân tộc và ma tộc có 15 cảnh giới thì yêu thú cũng phải có 15 cảnh giới.
    *   **Tạo Cảnh Giới Khởi Đầu:**
        *   Phải là một cấp độ cụ thể trong hệ thống trên, theo định dạng "[Tên Cảnh Giới Lớn] [Tên Cảnh Giới Nhỏ]", ví dụ: "Phàm Nhân Nhất Trọng", "Phàm Nhân Đỉnh Phong". KHÔNG được rút gọn tên cảnh giới lớn.
        *   Cảnh giới khởi đầu cho nhân vật chính nên đa dạng, có thể cao thấp tùy theo yêu cầu của người chơi hoặc dựa vào cốt truyện bạn tạo ra.
        *   **Định dạng:** [GENERATED_CANH_GIOI_KHOI_DAU: text="Cảnh giới/cấp độ khởi đầu do AI tạo, Cảnh giới khởi đầu cho nhân vật chính đa dạng, có thể cao thấp tùy theo yêu cầu của người chơi hoặc dựa vào cốt truyện tạo ra."]
` : `
    *   **Hệ Thống Cảnh Giới/Cấp Độ:** ĐÃ TẮT. Nhân vật sẽ là người thường.
        [GENERATED_RACE_SYSTEM: race="Nhân Tộc", system="${VIETNAMESE.noCultivationSystem}"]
        [GENERATED_YEUTHU_SYSTEM: system="${VIETNAMESE.noCultivationSystem}"]
        [GENERATED_CANH_GIOI_KHOI_DAU: text="${VIETNAMESE.mortalRealmName}"]
`;
    
  const lifespanInstruction = isCultivationEnabled ? `
**HƯỚN DẪN VỀ THỌ NGUYÊN (TUỔI THỌ):**
Tuổi thọ tối đa (\`maxThoNguyen\`) tăng mạnh theo từng đại cảnh giới. Đây là quy tắc BẮT BUỘC bạn phải tuân theo khi tạo người chơi và NPC.

*   **Công thức tính:**
    1.  **Thọ nguyên gốc (Phàm Nhân):** 120 năm.
    2.  **Thọ nguyên cộng thêm mỗi đại cảnh giới:** \`Thọ nguyên cộng thêm = 100 * (1.8 ^ (Thứ tự đại cảnh giới - 1))\`.
        *   Cảnh giới 1 (ví dụ: Luyện Khí): \`maxThoNguyen\` = 120 + 100 * (1.8^0) = 220 năm.
        *   Cảnh giới 2 (ví dụ: Trúc Cơ): \`maxThoNguyen\` = 220 + 100 * (1.8^1) = 220 + 180 = 400 năm.
        *   Cảnh giới 3 (ví dụ: Kim Đan): \`maxThoNguyen\` = 400 + 100 * (1.8^2) = 400 + 324 = 724 năm.
        *   Cảnh giới 4 (ví dụ: Nguyên Anh): \`maxThoNguyen\` = 724 + 100 * (1.8^3) = 724 + 583 = 1307 năm.
        *   ... và cứ thế tiếp tục cho các cảnh giới cao hơn.

*   **Cách áp dụng:**
    *   **\`maxThoNguyen\`:** PHẢI được tính theo công thức trên dựa vào cảnh giới của nhân vật.
    *   **\`thoNguyen\` (số năm còn lại):** PHẢI nhỏ hơn \`maxThoNguyen\`.
        *   **Với người chơi mới:** Ước tính một độ tuổi trẻ (ví dụ: 18-25 tuổi), sau đó tính: \`thoNguyen = maxThoNguyen - tuổi\`.
        *   **Với NPC:** Ước tính tuổi của họ dựa trên vai trò (trưởng lão, thiếu nữ, trung niên...) rồi tính tương tự. Ví dụ: một trưởng lão Kim Đan có \`maxThoNguyen\`=724, tuổi ước tính 500, vậy \`thoNguyen\`=224.` : '';

  const npcRealmInstruction = isCultivationEnabled
    ? `, realm="Cảnh giới NPC (BẮT BUỘC nếu có tu luyện). Hãy tạo ra sự đa dạng về cảnh giới (PHẢI ĐÚNG VỚI CHỦNG TỘC) cho các NPC để thế giới trở nên sống động. Ví dụ: một số NPC có thể là người thường không tu luyện (dùng cảnh giới '${VIETNAMESE.mortalRealmName}'), một số là tu sĩ cấp thấp ('Phàm Nhân Cửu Trọng', 'Luyện Khí Tam Trọng'), và một số khác là các cao thủ, trưởng lão, hoặc quái vật có cảnh giới cao hơn đáng kể ('Kim Đan Kỳ', 'Nguyên Anh Viên Mãn', v.v.). Cảnh giới PHẢI là một cấp độ hợp lệ từ Hệ Thống Cảnh Giới đã tạo ở trên (Không được phép ghi là không rõ)." tuChat="CHỌN MỘT TRONG: ${TU_CHAT_TIERS.join(' | ')}" (BẮT BUỘC nếu có tu luyện. Tư chất quyết định tốc độ tu luyện của NPC)" spiritualRoot="Linh căn của NPC (BẮT BUỘC, nếu không có thì ghi là 'Không có')", specialPhysique="Thể chất của NPC (BẮT BUỘC, nếu không có thì ghi là 'Không có')", thoNguyen=X, maxThoNguyen=Y (BẮT BUỘC. Áp dụng **HƯỚN DẪN VỀ THỌ NGUYÊN** đã cung cấp để tính toán.)`
    : `, thoNguyen=X, maxThoNguyen=Y (TÙY CHỌN. Logic: maxThoNguyen dựa trên loài người (~80). thoNguyen = maxThoNguyen - tuổi ước tính)`;

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
Khi tạo các yếu tố thế giới (NPC, kỹ năng, vật phẩm, địa điểm, tri thức), hãy đảm bảo chúng phản ánh sự kết hợp của các lựa chọn 18+, phong cách miêu tả, mức độ bạo lực, và tông màu câu chuyện này.
Ví dụ, nếu chọn phong cách "Mạnh Bạo (BDSM)", bạo lực "Cực Đoan" và tông "Đen Tối", các NPC có thể tàn bạo hơn, kỹ năng có thể ghê rợn hơn, vật phẩm có thể mang tính hủy diệt, và tri thức thế giới có thể u ám hơn. Ngược lại, nếu chọn phong cách "Hoa Mỹ", bạo lực "Nhẹ Nhàng" và "Tích Cực", các yếu tố nên tươi sáng hơn, dù vẫn có thể mang yếu tố 18+ tinh tế nếu được yêu cầu.
[GENERATED_NSFW_DESCRIPTION_STYLE: text="${currentNsfwStyle}"]
[GENERATED_VIOLENCE_LEVEL: text="${currentViolenceLevel}"]
[GENERATED_STORY_TONE: text="${currentStoryTone}"]`;
  } else {
    nsfwGuidanceForWorldGen = "- **Yêu cầu nội dung 18+:** TẮT. Vui lòng tạo các yếu tố phù hợp với mọi lứa tuổi. Tránh các chủ đề nhạy cảm, bạo lực quá mức hoặc tình dục khi tạo các yếu tố này.";
  }

  return `Bạn là một chuyên gia sáng tạo thế giới game nhập vai thể loại "${effectiveGenreDisplay}" bằng tiếng Việt.
Nhiệm vụ của bạn là tạo ra các yếu tố khởi đầu cho một thế giới game dựa trên ý tưởng của người chơi.
${isCultivationEnabled ? `Mỗi cảnh giới lớn (bao gồm cả "Phàm Nhân" nếu có) sẽ có 10 cấp độ phụ: ${SUB_REALM_NAMES.join(', ')}.` : ''}

**Ý TƯỞNG CỐT TRUYỆN TỪ NGƯỜI CHƠI:**
"""
${storyIdea}
"""

**CHẾ ĐỘ NỘI DUNG:**
${nsfwGuidanceForWorldGen}
- Thể loại game: ${effectiveGenreDisplay}
- Hệ Thống Tu Luyện/Sức Mạnh Đặc Thù: ${isCultivationEnabled ? "BẬT" : "TẮT"}

${lifespanInstruction}

**YÊU CẦU SÁNG TẠO (Dựa trên ý tưởng trên):**
1.  **Hãy tạo ra:**
    *   **Thông Tin Nhân Vật Chính:**
        *   Tên Nhân Vật: [GENERATED_PLAYER_NAME: name="Tên Nhân Vật Được Tạo"]
        *   Giới Tính Nhân Vật: [GENERATED_PLAYER_GENDER: gender="Nam/Nữ/Khác"]
        *   Chủng Tộc Nhân Vật: [GENERATED_PLAYER_RACE: text="Tên Chủng Tộc Được Tạo"]
        *   Tính Cách: [GENERATED_PLAYER_PERSONALITY: text="Tính cách được tạo..."]
        *   Tiểu Sử: [GENERATED_PLAYER_BACKSTORY: text="Tiểu sử được tạo..."]
        *   Mục Tiêu: [GENERATED_PLAYER_GOAL: text="Mục tiêu được tạo..."]
        *   Đặc Điểm Khởi Đầu Chung: [GENERATED_PLAYER_STARTING_TRAITS: text="Đặc điểm chung được tạo..."]
        *   ${isCultivationEnabled ? `Tạo Linh Căn cho nhân vật: [GENERATED_PLAYER_SPIRITUAL_ROOT: text="Tên Linh Căn"]` : ''}
        *   ${isCultivationEnabled ? `Tạo Thể Chất Đặc Biệt cho nhân vật (nếu có): [GENERATED_PLAYER_SPECIAL_PHYSIQUE: text="Tên Thể Chất"]` : ''}
        *   ${isCultivationEnabled ? `Tạo Thọ Nguyên ban đầu cho nhân vật (Logic: Thọ nguyên còn lại = Thọ nguyên tối đa - Tuổi. Nhân vật bắt đầu thường là người trẻ tuổi). [GENERATED_PLAYER_THO_NGUYEN: value=100] [GENERATED_PLAYER_MAX_THO_NGUYEN: value=120]` : ''}
    *   **Thiết Lập Thế Giới:**
        *   Chủ Đề Thế Giới (phù hợp với "${effectiveGenreDisplay}"): [GENERATED_WORLD_THEME: text="Chủ đề thế giới được tạo..."]
        *   Bối Cảnh Chi Tiết (phù hợp với "${effectiveGenreDisplay}"): [GENERATED_WORLD_SETTING_DESCRIPTION: text="Bối cảnh chi tiết được tạo..."]
        *   Văn Phong AI: [GENERATED_WORLD_WRITING_STYLE: text="Văn phong được tạo..."]
        *   Tên Tiền Tệ: [GENERATED_CURRENCY_NAME: name="Tên Tiền Tệ Được Tạo"]
        *   Số Tiền Khởi Đầu: [GENERATED_STARTING_CURRENCY: value=X] (Với X là một số tiền hợp lý cho người mới bắt đầu trong thế giới này)
        *   **Tạo Ngày Bắt Đầu:** Dựa vào bối cảnh, hãy chọn một ngày, tháng, năm, và buổi khởi đầu hợp lý. [GENERATED_STARTING_DATE: day=1, month=1, year=1, buoi="Buổi Sáng"]
        *   Cung cấp thông tin về thể loại và hệ thống tu luyện đã chọn:
            [GENERATED_GENRE: text="${genreForTag}"]
            ${customGenreNameForTag ? `[GENERATED_CUSTOM_GENRE_NAME: text="${customGenreNameForTag}"]` : ''}
            [GENERATED_IS_CULTIVATION_ENABLED: value=${isCultivationEnabled}]
        ${cultivationSystemInstructions}
    *   **Yếu Tố Khởi Đầu Khác (Đảm bảo cung cấp đầy đủ các tham số được yêu cầu cho mỗi tag):**
        *   **Kỹ Năng Khởi Đầu (5-6 kỹ năng):** Phù hợp với nhân vật, thế giới và thể loại "${effectiveGenreDisplay}".
            **HƯỚN DẪN CHI TIẾT CHO TAG \`[GENERATED_SKILL: ...]\`:**
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
            - **Thuộc tính cho Nghề Nghiệp (\`skillType="${GameTemplates.SkillType.NGHE_NGHIEP}"\`):**
                - \`professionType="CHỌN MỘT TRONG: ${Object.values(GameTemplates.ProfessionType).join(' | ')}"\`
                - \`skillDescription="Mô tả kỹ năng nghề đó làm được gì cụ thể."\`
                - \`professionGrade="CHỌN MỘT TRONG: ${[...PROFESSION_GRADES].join(' | ')}"\`
            - **THUỘC TÍNH CHIẾN ĐẤU CHUNG (Dùng cho Linh Kĩ (Chủ động), Thần Thông, Cấm Thuật):**
                - \`manaCost=SỐ\`, \`cooldown=SỐ LƯỢT\`, \`otherEffects="Hiệu ứng 1;Hiệu ứng 2"\`.
                - **CHỈ DÙNG CHO CÁC KỸ NĂNG GÂY SÁT THƯƠNG/HỒI PHỤC (ví dụ Linh Kĩ Tấn Công/Hồi Phục):**
                    - \`baseDamage=SỐ\` (sát thương cơ bản), \`damageMultiplier=SỐ THẬP PHÂN\` (hệ số % ATK, vd: 0.5 cho 50%).
                    - \`baseHealing=SỐ\` (hồi phục cơ bản), \`healingMultiplier=SỐ THẬP PHÂN\` (hệ số % ATK, vd: 0.2 cho 20%).
            **CHÚ Ý:** Hạn chế tạo ra thần thông hoặc cấm thuật vì đây là những kĩ năng có sát thương cao và hiệu ứng mạnh nhưng bù lại là tiêu hao và hồi chiêu dài, khi tạo cấm thuật thì tác dụng phụ phải cao vì đây là kĩ năng rất rất mạnh có thể thay đổi quy luật trời đất.
            **VÍ DỤ:**
            [GENERATED_SKILL: name="Hỏa Cầu Thuật", description="Tạo ra một quả cầu lửa nhỏ.", skillType="${GameTemplates.SkillType.LINH_KI}", linhKiCategory="Tấn công", linhKiActivation="Chủ động", manaCost=10, cooldown=1, baseDamage=20, otherEffects="Gây hiệu ứng Bỏng trong 2 lượt"]
            [GENERATED_SKILL: name="Thiên Lý Nhãn", description="Tăng cường thị lực, nhìn xa vạn dặm.", skillType="${GameTemplates.SkillType.THAN_THONG}", manaCost=50, cooldown=10, otherEffects="Phát hiện kẻ địch ẩn thân trong phạm vi 1km"]
            [GENERATED_SKILL: name="Huyết Tế Đại Pháp", description="Hi sinh máu tươi để nhận sức mạnh.", skillType="${GameTemplates.SkillType.CAM_THUAT}", sideEffects="Mất 20% sinh lực tối đa vĩnh viễn sau mỗi lần sử dụng.", manaCost=0, cooldown=100, otherEffects="Tăng 100% Sức Tấn Công trong 5 lượt"]
            [GENERATED_SKILL: name="Kim Cang Quyết", description="Một công pháp luyện thể sơ cấp.", skillType="${GameTemplates.SkillType.CONG_PHAP_TU_LUYEN}", congPhapType="Thể Tu", congPhapGrade="Hoàng Phẩm"]
        *   **Vật Phẩm Khởi Đầu (5-6 vật phẩm):** Phù hợp với nhân vật, thế giới và thể loại "${effectiveGenreDisplay}". **LƯU Ý: KHÔNG tạo ra vật phẩm tiền tệ (như Linh Thạch, Vàng) ở đây.**
            **HƯỚN DẪN CHI TIẾT CHO TAG \`[GENERATED_ITEM: ...]\`:**
            - **QUAN TRỌNG VỀ KINH TẾ:** Giá trị của vật phẩm trong game được TÍNH TOÁN DỰA TRÊN các thuộc tính của nó. Vì vậy, việc cung cấp đầy đủ và chính xác các thông tin sau là CỰC KỲ QUAN TRỌNG.
            - **CHI TIẾT THUỘC TÍNH:**
                - \`category\`: BẮT BUỘC. Phải là một trong: \`${Object.values(GameTemplates.ItemCategory).join(' | ')}\`.
                - \`rarity\`: BẮT BUỘC. Phải là một trong: \`${Object.values(GameTemplates.ItemRarity).join(' | ')}\`.
                - **\`itemRealm\`: BẮT BUỘC. Đây là cảnh giới/cấp độ của vật phẩm, quyết định sức mạnh và giá trị cơ bản của nó. **PHẢI** là một trong các cảnh giới lớn trong tag \`[GENERATED_RACE_SYSTEM: race="Nhân Tộc", ...]\` mà bạn đã tạo cho chủng tộc của người chơi. KHÔNG được sử dụng cảnh giới từ hệ thống của các chủng tộc khác hoặc các cảnh giới không có trong danh sách. Ví dụ, nếu bạn tạo \`system="Luyện Khí - Trúc Cơ"\`, thì \`itemRealm\` chỉ có thể là "Luyện Khí" hoặc "Trúc Cơ".**
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
            - **VÍ DỤ (Trang bị):** \`[GENERATED_ITEM: name="Hỏa Vân Kiếm", description="Thanh kiếm được rèn trong địa hỏa, ẩn chứa sức mạnh của lửa.", quantity=1, category="${GameTemplates.ItemCategory.EQUIPMENT}", rarity="${GameTemplates.ItemRarity.QUY_BAU}", itemRealm="Đấu Sư", equipmentType="${GameTemplates.EquipmentType.VU_KHI}", statBonusesJSON='{"sucTanCong": 50}', uniqueEffectsList="Sát thương gây hiệu ứng bỏng 10 dmg/s trong 3 giây"]\`
            - **VÍ DỤ (Đan dược):** \`[GENERATED_ITEM: name="Hồi Khí Tán", description="Đan dược giúp phục hồi đấu khí nhanh chóng.", quantity=5, category="${GameTemplates.ItemCategory.POTION}", rarity="${GameTemplates.ItemRarity.HIEM}", itemRealm="Đấu Giả", potionType="${GameTemplates.PotionType.HOI_PHUC}", effectsList="Hồi phục 200 đấu khí"]\`
        *   **NPC Khởi Đầu (9-10 NPC):** Phù hợp với thế giới và thể loại "${effectiveGenreDisplay}". Cung cấp thông tin chi tiết.
            [GENERATED_NPC: name="Tên NPC (BẮT BUỘC)", gender="Nam/Nữ/Khác/Không rõ (BẮT BUỘC)", race="Chủng tộc (BẮT BUỘC, CHỈ ĐƯỢC TẠO RA NHỮNG CHỦNG TỘC CÓ HỆ THỐNG CẢNH GIỚI Ở TRÊN, TUYỆT ĐỐI KHÔNG CHỌN CHỦNG TỘC YÊU THÚ, ví dụ: Nhân Tộc, Yêu Tộc)", personality="Tính cách nổi bật (BẮT BUỘC)", initialAffinity=0 (SỐ NGUYÊN từ -100 đến 100), details="Vai trò, tiểu sử ngắn hoặc mối liên hệ với người chơi (BẮT BUỘC), phù hợp với thể loại '${effectiveGenreDisplay}'"${npcRealmInstruction}, relationshipToPlayer="Mối quan hệ (ví dụ: 'Mẹ Con', 'Sư phụ', 'Bằng hữu', 'Chủ nhân - nô lệ', 'Vợ chồng', 'Đạo lữ', 'Đối thủ', 'Bạn thời thơ ấu', 'Người bảo hộ', 'Chủ nợ'...)" (BẮT BUỘC nhưng khi npc và người chơi không có quan hệ gì thì để là 'Người xa lạ')]. NPC chỉ áp dụng cho người hoặc những loài có hình dạng tương tự người như tiên tộc, yêu tộc đã hóa hình,...
        *   **Yêu Thú Khởi Đầu (5-6 Yêu thú):**
            [GENERATED_YEUTHU: name="Tên Yêu Thú (BẮT BUỘC)", species="Loài (BẮT BUỘC)", description="Mô tả (BẮT BUỘC, CHỈ ĐƯỢC TẠO RA NHỮNG CHỦNG TỘC CÓ HỆ THỐNG CẢNH GIỚI Ở TRÊN)", realm="Cảnh giới Yêu Thú (BẮT BUỘC nếu có tu luyện)", isHostile=true (true/false)]
        *   **Tri Thức Thế Giới Khởi Đầu (7-8 tri thức):** Phù hợp với thế giới và thể loại "${effectiveGenreDisplay}".
            [GENERATED_LORE: title="Tiêu đề Tri Thức (BẮT BUỘC)", content="Nội dung chi tiết (BẮT BUỘC)"]
        *   **Địa Điểm Khởi Đầu (7-8 địa điểm):** **Địa điểm đầu tiên trong danh sách sẽ là vị trí khởi đầu của người chơi.**
            **Định dạng:** [GENERATED_LOCATION: name="Tên (BẮT BUỘC)", description="Mô tả (BẮT BUỘC)", locationType="CHỌN MỘT TRONG: ${Object.values(GameTemplates.LocationType).join(' | ')}" (BẮT BUỘC), isSafeZone=false (true/false), regionId="Tên Vùng", mapX=100 (BẮT BUỘC, 0-800), mapY=100 (BẮT BUỘC, 0-600)]
            **LƯU Ý QUAN TRỌNG:** Tất cả các địa điểm được tạo ở đây phải là các địa điểm chính, độc lập (ví dụ: làng, thành phố, tông môn). **KHÔNG** tạo ra các địa điểm phụ nằm bên trong một địa điểm khác (ví dụ: một "Dược Phòng" bên trong "Thất Huyền Môn").
        *   **Phe Phái Khởi Đầu (9-10 phe phái, nếu phù hợp):**
            [GENERATED_FACTION: name="Tên Phe Phái (BẮT BUỘC)", description="Mô tả phe phái (BẮT BUỘC)", alignment="CHỌN MỘT TRONG: ${ALL_FACTION_ALIGNMENTS.join(' | ')}" (BẮT BUỘC), initialPlayerReputation=0 (SỐ NGUYÊN)]

2.  **Chỉ sử dụng các tag ĐÚNG ĐỊNH DẠNG đã cho ở trên.** Mỗi tag trên một dòng riêng.
3.  Giá trị của các thuộc tính trong tag (name, description, text, ...) phải được đặt trong dấu ngoặc kép.
4.  Cung cấp thông tin bằng tiếng Việt.
5.  Đảm bảo các yếu tố này phù hợp và nhất quán với ý tưởng cốt truyện.
6.  Không thêm bất kỳ lời dẫn, giải thích, hay văn bản nào khác ngoài các tag được yêu cầu.
`;
};
