

import { SUB_REALM_NAMES, ALL_FACTION_ALIGNMENTS, AVAILABLE_GENRES, VIETNAMESE, CUSTOM_GENRE_VALUE, DEFAULT_VIOLENCE_LEVEL, DEFAULT_STORY_TONE, VIOLENCE_LEVELS, STORY_TONES, DEFAULT_NSFW_DESCRIPTION_STYLE, NSFW_DESCRIPTION_STYLES, TU_CHAT_TIERS, WEAPON_TYPES_FOR_VO_Y, STAT_POINT_VALUES, SPECIAL_EFFECT_KEYWORDS } from '../constants';
import * as GameTemplates from '../templates';
import { GenreType, ViolenceLevel, StoryTone, NsfwDescriptionStyle, TuChatTier } from '../types';
import { CONG_PHAP_GRADES, LINH_KI_CATEGORIES, LINH_KI_ACTIVATION_TYPES, PROFESSION_GRADES } from '../templates';

export const generateFanfictionWorldDetailsPrompt = (
    sourceMaterial: string,
    isSourceContent: boolean,
    playerInputDescription?: string,
    isNsfwIdea?: boolean,
    genre?: GenreType,
    isCultivationEnabled?: boolean,
    violenceLevel?: ViolenceLevel, 
    storyTone?: StoryTone,       
    customGenreName?: string,
    nsfwStyle?: NsfwDescriptionStyle 
): string => {
  const selectedGenre = genre || AVAILABLE_GENRES[0];
  const effectiveGenreDisplay = (selectedGenre === CUSTOM_GENRE_VALUE && customGenreName) ? customGenreName : selectedGenre;
  const genreForTag = (selectedGenre === CUSTOM_GENRE_VALUE && customGenreName) ? CUSTOM_GENRE_VALUE : selectedGenre;
  const customGenreNameForTag = (selectedGenre === CUSTOM_GENRE_VALUE && customGenreName) ? customGenreName : "";
  const cultivationActuallyEnabled = isCultivationEnabled === undefined ? true : isCultivationEnabled;
  const currentViolenceLevel = violenceLevel || DEFAULT_VIOLENCE_LEVEL;
  const currentStoryTone = storyTone || DEFAULT_STORY_TONE;
  const currentNsfwStyle = nsfwStyle || DEFAULT_NSFW_DESCRIPTION_STYLE;


  const cultivationSystemInstructions = cultivationActuallyEnabled ? `
        *   **Hệ Thống Cảnh Giới Theo Chủng Tộc (CỰC KỲ QUAN TRỌNG):** Dựa vào Nguồn Cảm Hứng Đồng Nhân, hãy tái tạo lại Hệ Thống Cảnh Giới/Cấp Bậc Sức Mạnh từ truyện gốc một cách **CHÍNH XÁC NHẤT** cho từng chủng tộc.
            - **Nếu truyện gốc có hệ thống cảnh giới rõ ràng (ví dụ: Phàm Nhân Tu Tiên, Đấu Phá Thương Khung), bạn PHẢI liệt kê các cảnh giới lớn theo đúng thứ tự của nguyên tác cho từng chủng tộc có trong truyện.**
            - **Nếu truyện gốc không có hệ thống cảnh giới (ví dụ: truyện kiếm hiệp Kim Dung, Harry Potter), hãy tạo ra một hệ thống cấp bậc/danh hiệu hợp lý, phản ánh đúng sức mạnh trong thế giới đó cho từng chủng tộc.**
            - **Định dạng:**
                *   Sử dụng tag **[GENERATED_RACE_SYSTEM: race="Tên Chủng Tộc", system="Hệ thống cảnh giới, phân cách bằng ' - '"]** cho mỗi chủng tộc. **BẮT BUỘC SỐ LƯỢNG CẢNH GIỚI PHẢI BẰNG NHAU GIỮA CÁC CHỦNG TỘC:** ví dụ nhân tộc có 15 cảnh giới thì ma tộc và yêu tộc cũng phải có 15 cảnh giới.
                *   Sử dụng tag **[GENERATED_YEUTHU_SYSTEM: system="Hệ thống cảnh giới của Yêu Thú, phân cách bằng ' - '"]**. **BẮT BUỘC SỐ LƯỢNG CẢNH GIỚI PHẢI BẰNG NHAU GIỮA CÁC CHỦNG TỘC:** ví dụ nhân tộc và ma tộc có 15 cảnh giới thì yêu thú cũng phải có 15 cảnh giới.
        *   **Cảnh Giới Khởi Đầu cho Nhân Vật Đồng Nhân:** Dựa trên bối cảnh đồng nhân được cung cấp, hãy chọn một cảnh giới khởi đầu **HỢP LÝ** cho nhân vật chính. Cảnh giới này tùy theo yêu cầu của người chơi, nếu không có yêu cần thì để cảnh giới vừa đủ mà thôi.. Cảnh giới phải theo định dạng "[Tên Cảnh Giới Lớn] [Tên Cảnh Giới Nhỏ]" (nếu có tiểu cảnh giới) hoặc chỉ tên cảnh giới/cấp bậc.
            [GENERATED_CANH_GIOI_KHOI_DAU: text="Cảnh giới/cấp độ khởi đầu hợp lý cho nhân vật đồng nhân"]
` : `
        *   **Hệ Thống Cảnh Giới/Cấp Độ:** ĐÃ TẮT. Nhân vật sẽ là người thường.
            [GENERATED_RACE_SYSTEM: race="Nhân Tộc", system="${VIETNAMESE.noCultivationSystem}"]
            [GENERATED_YEUTHU_SYSTEM: system="${VIETNAMESE.noCultivationSystem}"]
            [GENERATED_CANH_GIOI_KHOI_DAU: text="${VIETNAMESE.mortalRealmName}"]
`;

  const npcRealmInstructionFanfic = cultivationActuallyEnabled
    ? `, realm="Cảnh giới NPC (BẮT BUỘC nếu có tu luyện/cấp bậc) (PHẢI ĐÚNG VỚI CHỦNG TỘC). **HƯỚN DẪN XÁC ĐỊNH CẢNH GIỚI NPC:**
    1. **Xác định Nhân Vật Gốc:** Đầu tiên, xác định xem NPC này có phải là một nhân vật đã tồn tại trong truyện gốc hay không.
    2. **Gán Cảnh Giới Cho Nhân Vật Gốc:** Nếu là nhân vật gốc, hãy gán cho họ một cảnh giới **CHÍNH XÁC** với sức mạnh của họ trong nguyên tác, dựa trên hệ thống cảnh giới bạn đã tạo ở trên (Không được phép ghi là không rõ). Ví dụ, nếu tạo NPC "Tiêu Viêm" từ Đấu Phá Thương Khung, hãy xác định giai đoạn của câu chuyện và gán cảnh giới phù hợp (ví dụ: "Đấu Giả Cửu Tinh" hoặc "Đại Đấu Sư").
    3. **Gán Cảnh Giới Cho Nhân Vật Mới (OC):** Nếu là nhân vật mới do bạn tạo ra, hãy gán cho họ một cảnh giới hợp lý với vai trò của họ trong thế giới.
    **YÊU CẦU CHUNG:** Cảnh giới PHẢI là một cấp độ hợp lệ từ Hệ Thống Cảnh Giới đã tạo ở trên . Hãy tạo ra sự đa dạng về cảnh giới để thế giới sống động."
    , tuChat="CHỌN MỘT TRONG: ${TU_CHAT_TIERS.join(' | ')}" (BẮT BUỘC nếu có tu luyện. Tư chất quyết định tốc độ tu luyện của NPC)" spiritualRoot="Linh căn của NPC (BẮT BUỘC, nếu không có thì ghi là 'Không có')", specialPhysique="Thể chất của NPC (BẮT BUỘC, nếu không có thì ghi là 'Không có')", thoNguyen=X, maxThoNguyen=Y (BẮT BUỘC. \`maxThoNguyen\` là tuổi thọ tối đa dựa trên cảnh giới/loài. \`thoNguyen\` là số năm **CÒN LẠI** để sống, sẽ thấp hơn \`maxThoNguyen\` tùy vào tuổi ước tính của NPC)`
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
- **Yêu cầu nội dung 18+:** BẬT. Hãy chủ động, ưu tiên và tích cực tạo ra các tên gọi, mô tả, tính cách, chi tiết NPC, kỹ năng, vật phẩm, tri thức thế giới và tóm tắt cốt truyện nguyên tác mang tính chất người lớn, nhạy cảm, và tình dục.
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


return `
Bạn là một chuyên gia sáng tạo thế giới cho game nhập vai đồng nhân / fanfiction thể loại "${effectiveGenreDisplay}" bằng tiếng Việt.
Nhiệm vụ của bạn là tạo ra các yếu tố khởi đầu cho một thế giới game đồng nhân dựa trên thông tin được cung cấp.
${cultivationActuallyEnabled ? `Mỗi cảnh giới lớn (bao gồm cả "Phàm Nhân" nếu có) sẽ có 10 cấp độ phụ: ${SUB_REALM_NAMES.join(', ')}.` : ''}

**NGUỒN CẢM HỨNG ĐỒNG NHÂN:**
${isSourceContent
    ? `Nội dung truyện gốc (một phần hoặc toàn bộ) được cung cấp bởi người dùng:\n"""\n${sourceMaterial}\n"""`
    : `Tên truyện gốc được cung cấp bởi người dùng: "${sourceMaterial}"`}

${playerInputDescription
    ? `**Mô tả/Ý tưởng thêm từ người chơi về đồng nhân:**\n"${playerInputDescription}"`
    : ""}

**CHẾ ĐỘ NỘI DUNG CHO VIỆC TẠO YẾU TỐ ĐỒNG NHÂN:**
${nsfwGuidanceForWorldGen}
- Thể loại game: ${effectiveGenreDisplay}
- Hệ Thống Tu Luyện/Sức Mạnh Đặc Thù: ${cultivationActuallyEnabled ? "BẬT" : "TẮT"}

**YÊU CẦU SÁNG TẠO:**
1.  **Dựa vào Nguồn Cảm Hứng Đồng Nhân (và mô tả thêm nếu có), hãy tạo ra:**
    *   **Thông Tin Nhân Vật Chính (Đồng Nhân):**
        *   Tên Nhân Vật: [GENERATED_PLAYER_NAME: name="Tên Nhân Vật Được Tạo"]
        *   Giới Tính Nhân Vật: [GENERATED_PLAYER_GENDER: gender="Nam/Nữ/Khác"]
        *   Chủng Tộc Nhân Vật: [GENERATED_PLAYER_RACE: text="Tên Chủng Tộc Được Tạo"]
        *   Tính Cách: [GENERATED_PLAYER_PERSONALITY: text="Tính cách được tạo..."]
        *   Tiểu Sử (trong bối cảnh đồng nhân): [GENERATED_PLAYER_BACKSTORY: text="Tiểu sử được tạo..."]
        *   Mục Tiêu (trong câu chuyện đồng nhân): [GENERATED_PLAYER_GOAL: text="Mục tiêu được tạo..."]
        *   Đặc Điểm Khởi Đầu Chung: [GENERATED_PLAYER_STARTING_TRAITS: text="Đặc điểm chung được tạo..."]
        *   ${cultivationActuallyEnabled ? `Tạo Linh Căn cho nhân vật: [GENERATED_PLAYER_SPIRITUAL_ROOT: text="Tên Linh Căn"]` : ''}
        *   ${cultivationActuallyEnabled ? `Tạo Thể Chất Đặc Biệt cho nhân vật (nếu có): [GENERATED_PLAYER_SPECIAL_PHYSIQUE: text="Tên Thể Chất"]` : ''}
        *   ${isCultivationEnabled ? `Tạo Thọ Nguyên ban đầu cho nhân vật (Logic: Thọ nguyên còn lại = Thọ nguyên tối đa - Tuổi. Nhân vật bắt đầu thường là người trẻ tuổi). [GENERATED_PLAYER_THO_NGUYEN: value=100] [GENERATED_PLAYER_MAX_THO_NGUYEN: value=120]` : ''}
    *   **Thiết Lập Thế Giới (Đồng Nhân):**
        *   Chủ Đề Thế Giới (có thể giữ nguyên từ truyện gốc hoặc biến tấu cho phù hợp "${effectiveGenreDisplay}"): [GENERATED_WORLD_THEME: text="Chủ đề thế giới được tạo..."]
        *   Bối Cảnh Chi Tiết (mô tả rõ nhánh truyện đồng nhân này diễn ra ở đâu, khi nào so với truyện gốc, và phù hợp với "${effectiveGenreDisplay}"): [GENERATED_WORLD_SETTING_DESCRIPTION: text="Bối cảnh chi tiết được tạo..."]
        *   Văn Phong AI (phù hợp với truyện gốc hoặc yêu cầu): [GENERATED_WORLD_WRITING_STYLE: text="Văn phong được tạo..."]
        *   Tên Tiền Tệ (có thể giữ nguyên từ truyện gốc): [GENERATED_CURRENCY_NAME: name="Tên Tiền Tệ Được Tạo"]
        *   Số Tiền Khởi Đầu: [GENERATED_STARTING_CURRENCY: value=X] (Với X là một số tiền hợp lý cho người mới bắt đầu trong thế giới này)
        *   **Tạo Ngày Bắt Đầu:** Dựa vào lịch sử và bối cảnh của truyện gốc, hãy chọn một ngày, tháng, năm, và buổi khởi đầu hợp lý (ví dụ: nếu truyện bắt đầu vào mùa đông, hãy chọn một tháng mùa đông, vào Buổi Sáng). [GENERATED_STARTING_DATE: day=10, month=11, year=543, buoi="Buổi Sáng"]
        *   Cung cấp thông tin về thể loại và hệ thống tu luyện đã chọn:
            [GENERATED_GENRE: text="${genreForTag}"]
            ${customGenreNameForTag ? `[GENERATED_CUSTOM_GENRE_NAME: text="${customGenreNameForTag}"]` : ''}
            [GENERATED_IS_CULTIVATION_ENABLED: value=${cultivationActuallyEnabled}]
        ${cultivationSystemInstructions}
    *   **Tóm Tắt Cốt Truyện Nguyên Tác (QUAN TRỌNG):** Dựa trên Nguồn Cảm Hứng Đồng Nhân, hãy **tóm tắt cốt truyện của truyện gốc (nguyên tác)**, dài khoảng 1000-1500 từ. Phần tóm tắt này nên được chia thành các giai đoạn hoặc các chương chính, mô tả các sự kiện quan trọng, xung đột và hướng phát triển của các nhân vật chính trong nguyên tác. Sử dụng tag: \\\`[GENERATED_ORIGINAL_STORY_SUMMARY: text="Giai đoạn 1 của nguyên tác: Mô tả chi tiết giai đoạn 1 của nguyên tác...\n\nGiai đoạn 2 của nguyên tác: Mô tả chi tiết giai đoạn 2 của nguyên tác...\n\n... (Tiếp tục cho đến khi đủ 1000-1500 từ và bao quát cốt truyện nguyên tác)"]\\\`
    *   **Yếu Tố Khởi Đầu Khác (Đồng Nhân - Đảm bảo cung cấp đầy đủ các tham số được yêu cầu cho mỗi tag):**
        *   **Kỹ Năng Khởi Đầu (5-6 kỹ năng):** Phù hợp với nhân vật, thế giới đồng nhân và thể loại "${effectiveGenreDisplay}". **HƯỚN DẪN CHI TIẾT CHO TAG \`[GENERATED_SKILL: ...]\`:**
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
        *   **Vật Phẩm Khởi Đầu (5-6 vật phẩm):** Phù hợp với nhân vật, thế giới đồng nhân và thể loại "${effectiveGenreDisplay}". **LƯU Ý: KHÔNG tạo ra vật phẩm tiền tệ (như Linh Thạch, Vàng) ở đây.**
            **HƯỚN DẪN CHI TIẾT CHO TAG \`[GENERATED_ITEM: ...]\`:**
            - **QUAN TRỌNG VỀ KINH TẾ:** Giá trị của vật phẩm trong game được TÍNH TOÁN DỰA TRÊN các thuộc tính của nó. Vì vậy, việc cung cấp đầy đủ và chính xác các thông tin sau là CỰC KỲ QUAN TRỌNG.
            - **CHI TIẾT THUỘC TÍNH:**
                - \`category\`: BẮT BUỘC. Phải là một trong: \`${Object.values(GameTemplates.ItemCategory).join(' | ')}\`.
                - \`rarity\`: BẮT BUỘC. Phải là một trong: \`${Object.values(GameTemplates.ItemRarity).join(' | ')}\`.
                - **\`itemRealm\`: BẮT BUỘC. Đây là cảnh giới/cấp độ của vật phẩm, quyết định sức mạnh và giá trị cơ bản của nó. **PHẢI** là một trong các cảnh giới lớn trong tag \`[GENERATED_RACE_SYSTEM: ...]\` mà bạn đã tạo cho chủng tộc của người chơi. KHÔNG được sử dụng cảnh giới từ hệ thống của các chủng tộc khác hoặc các cảnh giới không có trong danh sách. Ví dụ, nếu bạn tạo hệ thống cho Nhân Tộc là \`system="Luyện Khí - Trúc Cơ"\`, thì \`itemRealm\` chỉ có thể là "Luyện Khí" hoặc "Trúc Cơ".**
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

        *   **NPC Khởi Đầu (KHÔNG GIỚI HẠN SỐ LƯỢNG):** Tạo ra BẤT KỲ NPC quan trọng nào (từ truyện gốc hoặc NPC mới) mà bạn thấy phù hợp để làm phong phú câu chuyện đồng nhân. Hãy ưu tiên cung cấp thật nhiều NPC là nhân vật gốc truyện (Tầm 10 NPC trở lên). Cung cấp thông tin chi tiết cho mỗi NPC, phù hợp với thể loại "${effectiveGenreDisplay}".
            [GENERATED_NPC: name="Tên NPC (BẮT BUỘC)", gender="Nam/Nữ/Khác/Không rõ (BẮT BUỘC)", race="Chủng tộc (BẮT BUỘC, CHỈ ĐƯỢC TẠO RA NHỮNG CHỦNG TỘC CÓ HỆ THỐNG CẢNH GIỚI Ở TRÊN, TUYỆT ĐỐI KHÔNG CHỌN CHỦNG TỘC YÊU THÚ)", personality="Tính cách (BẮT BUỘC)", initialAffinity=0 (SỐ NGUYÊN), details="Chi tiết (BẮT BUỘC)"${npcRealmInstructionFanfic}, relationshipToPlayer="Mối quan hệ (suy luận từ truyện gốc hoặc tạo mới, ví dụ: 'Đồng Môn', 'Kẻ Thù không đội trời chung', 'Người Yêu Tiền Kiếp'...)" (BẮT BUỘC nhưng khi npc và người chơi không có quan hệ gì thì để là 'Người xa lạ')]. NPC chỉ áp dụng cho người hoặc những loài có hình dạng tương tự người như tiên tộc, yêu tộc đã hóa hình,...
        *   **Yêu Thú Khởi Đầu (KHÔNG GIỚI HẠN SỐ LƯỢNG):** Tạo ra các Yêu Thú từ truyện gốc hoặc mới, phù hợp với bối cảnh.
            [GENERATED_YEUTHU: name="Tên Yêu Thú (BẮT BUỘC)", species="Loài (BẮT BUỘC)", description="Mô tả (BẮT BUỘC, CHỈ ĐƯỢC TẠO RA NHỮNG CHỦNG TỘC CÓ HỆ THỐNG CẢNH GIỚI Ở TRÊN)", realm="Cảnh giới Yêu Thú (BẮT BUỘC nếu có tu luyện)", isHostile=true (true/false)]
        *   **Tri Thức Thế Giới Khởi Đầu (KHÔNG GIỚI HẠN SỐ LƯỢNG):** Tạo ra BẤT KỲ khái niệm, lịch sử, địa danh, hoặc quy tắc nào (từ truyện gốc hoặc mới) để làm rõ bối cảnh đồng nhân (Tầm 10 Tri Thức Thế Giới Khởi Đầu trở lên), phù hợp với thể loại "${effectiveGenreDisplay}".
            [GENERATED_LORE: title="Tiêu đề Tri Thức (BẮT BUỘC)", content="Nội dung chi tiết (BẮT BUỘC)"]
        *   **Địa Điểm Khởi Đầu (KHÔNG GIỚI HẠN SỐ LƯỢNG):** Tạo ra các Địa Điểm Khởi Đầu **chính** (từ truyện gốc hoặc mới) phù hợp với bối cảnh đồng nhân và thể loại "${effectiveGenreDisplay}". **Địa điểm đầu tiên trong danh sách sẽ được coi là vị trí khởi đầu của người chơi.** Hãy đảm bảo địa điểm này có tên phù hợp với bối cảnh truyện gốc (ví dụ: 'Thôn Thảo Miếu', 'Thất Huyền Môn').
            **Định dạng:** [GENERATED_LOCATION: name="Tên (BẮT BUỘC)", description="Mô tả (BẮT BUỘC)", locationType="CHỌN MỘT TRONG: ${Object.values(GameTemplates.LocationType).join(' | ')}" (BẮT BUỘC), isSafeZone=false (true/false), regionId="Tên Vùng", mapX=100 (BẮT BUỘC, 0-800), mapY=100 (BẮT BUỘC, 0-600)]
            **LƯU Ý QUAN TRỌNG:** Tất cả các địa điểm được tạo ở đây phải là các địa điểm chính, độc lập (ví dụ: làng, thành phố, tông môn). **KHÔNG** tạo ra các địa điểm phụ nằm bên trong một địa điểm khác (ví dụ: một "Dược Phòng" bên trong "Thất Huyền Môn"). Các địa điểm phụ sẽ được tạo ra sau trong game.
            **Ví dụ:** [GENERATED_LOCATION: name="Thất Huyền Môn", description="Một trong những tông môn lớn của Việt Quốc.", locationType="${GameTemplates.LocationType.SECT_CLAN}", isSafeZone=true, mapX=400, mapY=150]
        *   **Phe Phái Khởi Đầu (9-10 phe phái, nếu phù hợp):**
            [GENERATED_FACTION: name="Tên Phe Phái (BẮT BUỘC)", description="Mô tả phe phái (BẮT BUỘC)", alignment="CHỌN MỘT TRONG: ${ALL_FACTION_ALIGNMENTS.join(' | ')}" (BẮT BUỘC), initialPlayerReputation=0 (SỐ NGUYÊN)]

2.  **Nếu truyện gốc là truyện 18+ thì các yếu tố được tạo ra sẽ ưu tiên mang hướng 18+ nhiều hơn, bao gồm cả tóm tắt cốt truyện nguyên tác. Nếu tùy chọn "Yêu cầu nội dung 18+" ở trên được BẬT, hãy áp dụng mức độ 18+ cao hơn nữa.**

**QUAN TRỌNG:**
- **Tóm Tắt Cốt Truyện Nguyên Tác phải chi tiết và có cấu trúc giai đoạn rõ ràng.**
- **Không giới hạn số lượng NPC, Tri Thức Thế Giới (Lore) và Địa Điểm Khởi Đầu được tạo ra.** Hãy sáng tạo thật nhiều để làm giàu thế giới đồng nhân!
- Chỉ sử dụng các tag ĐÚNG ĐỊNH DẠNG đã cho ở trên. Mỗi tag trên một dòng riêng.
- Giá trị của các thuộc tính trong tag (name, description, text, ...) phải được đặt trong dấu ngoặc kép.
- Cung cấp thông tin bằng tiếng Việt.
- Đảm bảo các yếu tố này phù hợp và nhất quán với nguồn cảm hứng đồng nhân được cung cấp và thể loại "${effectiveGenreDisplay}".
- Không thêm bất kỳ lời dẫn, giải thích, hay văn bản nào khác ngoài các tag được yêu cầu.
`;
};
