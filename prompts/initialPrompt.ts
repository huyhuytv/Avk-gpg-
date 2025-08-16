import { WorldSettings, StartingItem, GenreType, ViolenceLevel, StoryTone, DIALOGUE_MARKER, TuChatTier, StartingSkill, AIContextConfig } from '../types';
import { SUB_REALM_NAMES, VIETNAMESE, AVAILABLE_GENRES, CUSTOM_GENRE_VALUE, DEFAULT_NSFW_DESCRIPTION_STYLE, NSFW_DESCRIPTION_STYLES, DEFAULT_VIOLENCE_LEVEL, DEFAULT_STORY_TONE, TU_CHAT_TIERS, WEAPON_TYPES_FOR_VO_Y } from '../constants';
import * as GameTemplates from '../templates';
import { continuePromptSystemRules } from '../constants/systemRulesNormal';

const buildSkillTag = (skill: StartingSkill): string => {
    let tag = `[SKILL_LEARNED: name="${skill.name.replace(/"/g, '\\"')}" description="${skill.description.replace(/"/g, '\\"')}" skillType="${skill.skillType || GameTemplates.SkillType.KHAC}"`;

    const otherEffects = skill.specialEffects || skill.description;
    tag += ` otherEffects="${otherEffects.replace(/"/g, '\\"')}"`;

    // Combat stats only if they are relevant and defined
    if (skill.baseDamage) tag += ` baseDamage=${skill.baseDamage}`;
    if (skill.baseHealing) tag += ` baseHealing=${skill.baseHealing}`;
    if (skill.damageMultiplier) tag += ` damageMultiplier=${skill.damageMultiplier}`;
    if (skill.healingMultiplier) tag += ` healingMultiplier=${skill.healingMultiplier}`;
    if (skill.manaCost) tag += ` manaCost=${skill.manaCost}`;
    if (skill.cooldown) tag += ` cooldown=${skill.cooldown}`;

    // Skill-type specific details
    if (skill.congPhapDetails) {
        if (skill.congPhapDetails.type) tag += ` congPhapType="${skill.congPhapDetails.type}"`;
        if (skill.congPhapDetails.grade) tag += ` congPhapGrade="${skill.congPhapDetails.grade}"`;
        if (skill.congPhapDetails.weaponFocus) tag += ` weaponFocus="${skill.congPhapDetails.weaponFocus}"`;
    }
    if (skill.linhKiDetails) {
        if (skill.linhKiDetails.category) tag += ` linhKiCategory="${skill.linhKiDetails.category}"`;
        if (skill.linhKiDetails.activation) tag += ` linhKiActivation="${skill.linhKiDetails.activation}"`;
    }
    if (skill.professionDetails) {
        if (skill.professionDetails.type) tag += ` professionType="${skill.professionDetails.type}"`;
        if (skill.professionDetails.grade) tag += ` professionGrade="${skill.professionDetails.grade}"`;
        if (skill.professionDetails.skillDescription) tag += ` skillDescription="${skill.professionDetails.skillDescription.replace(/"/g, '\\"')}"`;
    }
    if (skill.camThuatDetails?.sideEffects) {
        tag += ` sideEffects="${skill.camThuatDetails.sideEffects.replace(/"/g, '\\"')}"`;
    }

    tag += ']';
    return tag;
};

export const generateInitialPrompt = (worldConfig: WorldSettings, aiContextConfig: AIContextConfig): string => {
  const { genre, customGenreName, isCultivationEnabled, raceCultivationSystems, yeuThuRealmSystem, canhGioiKhoiDau, nsfwMode, nsfwDescriptionStyle, violenceLevel, storyTone, writingStyleGuide } = worldConfig;

  const getMainRealms = (realmSystem: string): string[] => {
    return realmSystem.split(' - ').map(s => s.trim()).filter(s => s.length > 0);
  };
  
  let effectiveStartingRealm = VIETNAMESE.mortalRealmName;
  let realmSystemDescription = VIETNAMESE.noCultivationSystem;
  let subRealmNamesInstruction = "";
  const effectiveGenre = (genre === CUSTOM_GENRE_VALUE && customGenreName) ? customGenreName : genre;
  const currentNsfwStyle = nsfwDescriptionStyle || DEFAULT_NSFW_DESCRIPTION_STYLE;
  const currentViolenceLevel = violenceLevel || DEFAULT_VIOLENCE_LEVEL;
  const currentStoryTone = storyTone || DEFAULT_STORY_TONE;
  const mainRealms = getMainRealms(raceCultivationSystems[0]?.realmSystem || '');

  if (isCultivationEnabled) {
    const firstMainRealm = mainRealms.length > 0 ? mainRealms[0] : "Phàm Nhân";
    const defaultStartingRealmCultivation = `${firstMainRealm} ${SUB_REALM_NAMES[0]}`;
    effectiveStartingRealm = canhGioiKhoiDau || defaultStartingRealmCultivation;
    realmSystemDescription = `"${raceCultivationSystems.map(s => `${s.raceName}: ${s.realmSystem}`).join('; ')}" (Ví dụ: "Phàm Nhân - Luyện Khí - Trúc Cơ - Kim Đan - Nguyên Anh - Hóa Thần - Luyện Hư - Hợp Thể - Đại Thừa - Độ Kiếp")`;
    subRealmNamesInstruction = `Mỗi cảnh giới lớn (nếu có trong thể loại này) sẽ có 10 cấp độ phụ: ${SUB_REALM_NAMES.join(', ')}.`;
  }

  let difficultyGuidanceText = ""; 
  if (aiContextConfig.sendDifficultyGuidance) {
      switch (worldConfig.difficulty) {
        case 'Dễ':
          difficultyGuidanceText = VIETNAMESE.difficultyGuidanceEasy;
          break;
        case 'Thường':
          difficultyGuidanceText = VIETNAMESE.difficultyGuidanceNormal;
          break;
        case 'Khó':
          difficultyGuidanceText = VIETNAMESE.difficultyGuidanceHard;
          break;
        case 'Ác Mộng':
          difficultyGuidanceText = VIETNAMESE.difficultyGuidanceNightmare;
          break;
        default:
          difficultyGuidanceText = VIETNAMESE.difficultyGuidanceNormal;
      }
  }

  let nsfwGuidanceCombined = "";
  if (aiContextConfig.sendNsfwGuidance) {
      if (nsfwMode) {
        let nsfwStyleGuidance = "";
        switch (currentNsfwStyle) {
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
    - **Phong Cách Miêu Tả Tình Dục:** ${currentNsfwStyle}.
      ${nsfwStyleGuidance}
    - **Mức Độ Miêu Tả Bạo Lực:** ${currentViolenceLevel}.
      ${violenceGuidance}
    - **Tông Màu Câu Chuyện:** ${currentStoryTone}.
      ${toneGuidance}
    **LƯU Ý CHUNG KHI 18+ BẬT:** Hãy kết hợp các yếu tố trên để tạo ra trải nghiệm phù hợp. Ví dụ, một câu chuyện "Đen Tối" với bạo lực "Cực Đoan" và miêu tả "Mạnh Bạo (BDSM)" sẽ rất khác với một câu chuyện "Tích Cực" với bạo lực "Nhẹ Nhàng" và miêu tả "Hoa Mỹ", dù cả hai đều có thể có yếu tố 18+.`;

      } else {
        nsfwGuidanceCombined = "LƯU Ý QUAN TRỌNG: Chế độ Người Lớn đã được TẮT. Vui lòng duy trì nội dung phù hợp với mọi lứa tuổi, tập trung vào phiêu lưu và phát triển nhân vật. Tránh các chủ đề nhạy cảm, bạo lực quá mức hoặc tình dục.";
      }
  }
  
  const writingStyleGuideSection = (aiContextConfig.sendWritingStyle && writingStyleGuide) ? `
**HƯỚNG DẪN BẮT CHƯỚC VĂN PHONG NGƯỜI DÙNG (CỰC KỲ QUAN TRỌNG):**
Mục tiêu hàng đầu của bạn là tái hiện một cách trung thực nhất văn phong của người dùng dựa vào đoạn văn mẫu sau. Đừng chỉ sao chép từ ngữ, mà hãy nắm bắt và áp dụng đúng **nhịp điệu**, **cách lựa chọn từ vựng**, và **thái độ/cảm xúc** đặc trưng của họ. Lời kể của bạn phải khiến người đọc tin rằng nó do chính người dùng viết ra. TUYỆT ĐỐI không pha trộn giọng văn AI hoặc làm "mềm hóa" văn phong gốc.

**VĂN BẢN MẪU CỦA NGƯỜI DÙNG ĐỂ BẠN BẮT CHƯỚC:**
"""
${writingStyleGuide}
"""
` : '';

const narrationAndVividnessRules = aiContextConfig.sendShowDontTellRule ? `
**MỆNH LỆNH TỐI THƯỢNG: PHONG CÁCH KỂ CHUYỆN ("Tả, đừng kể" - CỰC KỲ QUAN TRỌNG)**
Nhiệm vụ của bạn là vẽ nên những bức tranh sống động trong tâm trí người chơi. Hãy tuân thủ nghiêm ngặt các quy tắc sau trong MỌI lời kể:
*   **Sử dụng Ngũ quan:** Mô tả những gì nhân vật chính **nhìn thấy** (ánh sáng, màu sắc, bóng tối), **nghe thấy** (tiếng gió, tiếng xì xào, sự im lặng), **ngửi thấy** (mùi ẩm mốc, mùi hoa cỏ), **cảm nhận** (cái lạnh của sương, hơi nóng của lửa), và **nếm** (vị gỉ sét của máu).
*   **"Tả", không "Kể":** Thay vì dùng những từ ngữ chung chung, hãy mô tả chi tiết để người chơi tự cảm nhận.
    *   **SAI (Kể):** "Cô gái đó rất xinh đẹp."
    *   **ĐÚNG (Tả):** "Nàng có làn da trắng như tuyết, đôi mắt phượng cong cong ẩn chứa một làn sương mờ ảo, và đôi môi đỏ mọng như quả anh đào chín. Mỗi khi nàng khẽ cười, hai lúm đồng tiền nhỏ xinh lại hiện lên bên má, khiến người đối diện bất giác ngẩn ngơ."
    *   **SAI (Kể):** "Hắn ta rất tức giận."
    *   **ĐÚNG (Tả):** "Hai tay hắn siết chặt thành nắm đấm, những đường gân xanh nổi rõ trên mu bàn tay. Hắn nghiến chặt răng, quai hàm bạnh ra, và đôi mắt đỏ ngầu nhìn chằm chằm vào kẻ thù như muốn ăn tươi nuốt sống."
*   **Nội tâm nhân vật:** Mô tả những suy nghĩ, cảm xúc, ký ức thoáng qua của nhân vật chính để làm cho họ trở nên sống động và có chiều sâu.
*   **BẮT ĐẦU CÂU CHUYỆN:** Hãy bắt đầu câu chuyện bằng một đoạn văn miêu tả chi tiết, sâu sắc từ góc nhìn của nhân vật chính, áp dụng ngay lập tức các quy tắc trên.
` : '';

  return `**YÊU CẦU CỐT LÕI:** Bắt đầu một câu chuyện game nhập vai thể loại "${effectiveGenre}" bằng tiếng Việt. Tạo ra một thế giới sống động và một cốt truyện mở đầu hấp dẫn dựa trên thông tin do người chơi cung cấp. Bắt đầu lời kể ngay lập tức, không có lời dẫn hay tự xưng là người kể chuyện.

${writingStyleGuideSection}

${narrationAndVividnessRules}

${isCultivationEnabled ? subRealmNamesInstruction : ''}

**THÔNG TIN THẾ GIỚI VÀ NHÂN VẬT:**
Thể loại: ${effectiveGenre} ${(genre === CUSTOM_GENRE_VALUE && customGenreName) ? `(Người chơi tự định nghĩa)` : `(Từ danh sách)`}
Hệ Thống Tu Luyện/Sức Mạnh Đặc Thù: ${isCultivationEnabled ? "BẬT" : "TẮT"}
Thế giới:
- Chủ đề: ${worldConfig.theme}
- Bối cảnh: ${worldConfig.settingDescription}
- Văn phong: ${worldConfig.writingStyle}
- Độ khó: ${worldConfig.difficulty}
- Tiền tệ: ${worldConfig.currencyName}
${isCultivationEnabled ? `- Hệ Thống Cảnh Giới (do người chơi hoặc AI thiết lập): ${realmSystemDescription}` : ''}
${isCultivationEnabled ? `- Hệ Thống Cảnh Giới Yêu Thú: "${yeuThuRealmSystem}"` : ''}
${isCultivationEnabled ? `- Cảnh Giới Khởi Đầu (do người chơi hoặc AI thiết lập): "${effectiveStartingRealm}" (LƯU Ý: PHẢI LÀ MỘT CẢNH GIỚI HỢP LỆ TỪ HỆ THỐNG CẢNH GIỚI VÀ ${SUB_REALM_NAMES.join('/')})` : `- Cấp Độ/Trạng Thái Khởi Đầu: "${effectiveStartingRealm}" (Người thường)`}
${worldConfig.originalStorySummary ? `- TÓM TẮT CỐT TRUYỆN NGUYÊN TÁC (ĐỒNG NHÂN): """${worldConfig.originalStorySummary}"""` : ''}

Nhân vật:
- Tên: ${worldConfig.playerName}
- Giới tính: ${worldConfig.playerGender}
- Tính cách: ${worldConfig.playerPersonality}
- Tiểu sử: ${worldConfig.playerBackstory}
- Mục tiêu: ${worldConfig.playerGoal}
- Đặc điểm khởi đầu chung (nếu có): ${worldConfig.playerStartingTraits}
- Linh Căn: ${worldConfig.playerSpiritualRoot || 'AI sẽ quyết định'}
- Thể Chất Đặc Biệt: ${worldConfig.playerSpecialPhysique || 'AI sẽ quyết định'}
- Kỹ năng khởi đầu cụ thể:
${worldConfig.startingSkills && worldConfig.startingSkills.length > 0 ? worldConfig.startingSkills.map(buildSkillTag).join('\n') : "  Không có kỹ năng khởi đầu cụ thể."}
- Vật phẩm khởi đầu cụ thể:
${worldConfig.startingItems && worldConfig.startingItems.length > 0 ? worldConfig.startingItems.map(item => `  - ${item.name} (x${item.quantity}, Loại: ${item.category}${item.equipmentDetails?.type ? ' - ' + item.equipmentDetails.type : item.potionDetails?.type ? ' - ' + item.potionDetails.type : item.materialDetails?.type ? ' - ' + item.materialDetails.type : ''}): ${item.description}`).join('\n') : "  Không có vật phẩm khởi đầu cụ thể."}
- NPC khởi đầu cụ thể:
${worldConfig.startingNPCs && worldConfig.startingNPCs.length > 0 ? worldConfig.startingNPCs.map(npc => `  - Tên: ${npc.name}, Giới tính: ${npc.gender || 'Không rõ'}, Chủng tộc: ${npc.race || 'Không rõ'}, Tính cách: ${npc.personality}, Độ thiện cảm ban đầu: ${npc.initialAffinity}, Chi tiết: ${npc.details}${isCultivationEnabled && npc.realm ? `, Cảnh giới: ${npc.realm}` : ''}${isCultivationEnabled && npc.tuChat ? `, Tư chất: ${npc.tuChat}` : ''}${npc.relationshipToPlayer ? `, Mối quan hệ: ${npc.relationshipToPlayer}` : ''}${isCultivationEnabled && npc.thoNguyen && npc.maxThoNguyen ? `, Thọ nguyên: ${npc.thoNguyen}/${npc.maxThoNguyen}` : ''}`).join('\n') : "  Không có NPC khởi đầu cụ thể."}
- Yêu Thú khởi đầu cụ thể:
${worldConfig.startingYeuThu && worldConfig.startingYeuThu.length > 0 ? worldConfig.startingYeuThu.map(yt => `  - Tên: ${yt.name}, Loài: ${yt.species}, Mô tả: ${yt.description}, Cảnh giới: ${yt.realm}, Thù địch: ${yt.isHostile}`).join('\n') : "  Không có Yêu Thú khởi đầu cụ thể."}
- Tri thức thế giới khởi đầu cụ thể:
${worldConfig.startingLore && worldConfig.startingLore.length > 0 ? worldConfig.startingLore.map(lore => `  - Tiêu đề: ${lore.title}, Nội dung: ${lore.content}`).join('\n') : "  Không có tri thức thế giới khởi đầu cụ thể."}
- Địa điểm khởi đầu cụ thể:
${worldConfig.startingLocations && worldConfig.startingLocations.length > 0 ? worldConfig.startingLocations.map(loc => `  - Tên: ${loc.name}, Mô tả: ${loc.description}, Loại: ${loc.locationType || 'Mặc định'}${loc.isSafeZone ? ' (Khu An Toàn)' : ''}${loc.regionId ? `, Vùng: ${loc.regionId}` : ''}${loc.mapX !== undefined ? `, mapX: ${loc.mapX}` : ''}${loc.mapY !== undefined ? `, mapY: ${loc.mapY}` : ''}`).join('\n') : "  Không có địa điểm khởi đầu cụ thể."}
- Phe phái khởi đầu cụ thể:
${worldConfig.startingFactions && worldConfig.startingFactions.length > 0 ? worldConfig.startingFactions.map(fac => `  - Tên: ${fac.name}, Mô tả: ${fac.description}, Chính/Tà: ${fac.alignment}, Uy tín ban đầu: ${fac.initialPlayerReputation}`).join('\n') : "  Không có phe phái khởi đầu cụ thể."}

${aiContextConfig.sendDifficultyGuidance ? `**HƯỚNG DẪN VỀ ĐỘ KHÓ (Rất quan trọng để AI tuân theo):**
- **Dễ:** ${VIETNAMESE.difficultyGuidanceEasy} Tỉ lệ thành công cho lựa chọn thường CAO (ví dụ: 70-95%). Rủi ro thấp, phần thưởng dễ đạt.
- **Thường:** ${VIETNAMESE.difficultyGuidanceNormal} Tỉ lệ thành công cho lựa chọn TRUNG BÌNH (ví dụ: 50-80%). Rủi ro và phần thưởng cân bằng.
- **Khó:** ${VIETNAMESE.difficultyGuidanceHard} Tỉ lệ thành công cho lựa chọn THẤP (ví dụ: 30-65%). Rủi ro cao, phần thưởng lớn nhưng khó kiếm.
- **Ác Mộng:** ${VIETNAMESE.difficultyGuidanceNightmare} Tỉ lệ thành công cho lựa chọn CỰC KỲ THẤP (ví dụ: 15-50%). Rủi ro rất lớn, phần thưởng cực kỳ hiếm hoi.
Hiện tại người chơi đã chọn độ khó: **${worldConfig.difficulty}**. Hãy điều chỉnh tỉ lệ thành công, lợi ích và rủi ro trong các lựa chọn [CHOICE: "..."] của bạn cho phù hợp với hướng dẫn độ khó này.` : ''}

**CHẾ ĐỘ NỘI DUNG VÀ PHONG CÁCH:**
${nsfwGuidanceCombined}

**QUY TẮC HỆ THỐNG (CHO VIỆC KHỞI TẠO BAN ĐẦU):**
1.  **Khởi tạo Chỉ số Nhân Vật:** Dựa vào thông tin trên, hãy quyết định các chỉ số ban đầu cho nhân vật. Trả về dưới dạng tag \\\`[PLAYER_STATS_INIT: sinhLuc=X,${isCultivationEnabled ? 'linhLuc=Y,thoNguyen=A,maxThoNguyen=B,' : ''}kinhNghiem=0,realm="${effectiveStartingRealm}",currency=${worldConfig.startingCurrency},turn=1${isCultivationEnabled ? `,hieuUngBinhCanh=false,spiritualRoot="${worldConfig.playerSpiritualRoot || 'Phàm Căn'}",specialPhysique="${worldConfig.playerSpecialPhysique || 'Phàm Thể'}"` : ''}]\`\\\`.
    **QUAN TRỌNG:**
    *   \\\`realm\\\` PHẢI LÀ "${effectiveStartingRealm}". ĐÂY LÀ GIÁ TRỊ CHÍNH XÁC, KHÔNG ĐƯỢC THAY ĐỔI HAY RÚT GỌN (ví dụ: không dùng "Phàm" thay vì "Phàm Nhân Nhất Trọng").
    *   Lượt chơi (turn) phải bắt đầu từ 1.
    *   ${isCultivationEnabled ? '`thoNguyen` (thọ nguyên còn lại) và `maxThoNguyen` (thọ nguyên tối đa) nên có giá trị khởi đầu hợp lý (ví dụ, tu sĩ cấp thấp có thể sống 120-150 năm).' : ''}
    *   **AI KHÔNG cần cung cấp \\\`maxSinhLuc\\\`${isCultivationEnabled ? ', \\\`maxLinhLuc\\\`, \\\`maxKinhNghiem\\\`' : ''}, \\\`sucTanCong\\\`. Hệ thống game sẽ tự động tính toán các chỉ số này dựa trên \\\`realm\\\` bạn cung cấp${isCultivationEnabled ? '' : ' (hoặc mặc định cho người thường)'}.**
    *   \\\`sinhLuc\\\` ${isCultivationEnabled ? 'và \\\`linhLuc\\\` ' : ''}nên được đặt bằng giá trị tối đa tương ứng với cảnh giới/cấp độ khởi đầu, hoặc một giá trị hợp lý nếu bạn muốn nhân vật khởi đầu không đầy. Nếu muốn hồi đầy, dùng \\\`sinhLuc=MAX\\\` ${isCultivationEnabled ? 'và \\\`linhLuc=MAX\\\`' : ''}.
    *   \\\`kinhNghiem\\\` thường là 0 (nếu có). \\\`currency\\\` là số tiền ban đầu. Giá trị đã được người chơi thiết lập là **${worldConfig.startingCurrency}**. AI phải sử dụng chính xác con số này.
    *   Ví dụ (nếu có tu luyện): \\\`[PLAYER_STATS_INIT: sinhLuc=MAX,linhLuc=MAX,thoNguyen=120,maxThoNguyen=120,kinhNghiem=0,realm="${effectiveStartingRealm}",currency=${worldConfig.startingCurrency},turn=1,hieuUngBinhCanh=false,spiritualRoot="Ngũ Hành Tạp Linh Căn",specialPhysique="Bình Thường Phàm Thể"]\`\\\`.
    *   Ví dụ (nếu KHÔNG có tu luyện): \\\`[PLAYER_STATS_INIT: sinhLuc=MAX,thoNguyen=80,maxThoNguyen=80,kinhNghiem=0,realm="${VIETNAMESE.mortalRealmName}",currency=${worldConfig.startingCurrency},turn=1]\`\\\`.
${isCultivationEnabled ? `2.  **Xác nhận Hệ thống Cảnh giới:** Hệ thống cảnh giới người chơi đã định nghĩa là: "${realmSystemDescription}". Hãy sử dụng hệ thống này. Nếu bạn muốn thay đổi hoặc đề xuất một danh sách hoàn toàn mới dựa trên chủ đề, hãy dùng tag \\\`[GENERATED_RACE_SYSTEM: race="Tên Chủng Tộc", system="Hệ thống mới..."]\\\`. Nếu không, không cần tag này.` : '2.  **Hệ Thống Cảnh Giới:** Đã TẮT. Nhân vật là người thường.'}
3.  **Vật phẩm, Kỹ năng, NPC, Địa Điểm, Phe Phái và Tri Thức Khởi đầu:** Dựa trên thông tin do người chơi cung cấp, hãy tạo các tag tương ứng. **Cố gắng cung cấp đầy đủ thông tin để hệ thống game có thể tạo ra các thực thể đầy đủ theo định nghĩa cấu trúc dữ liệu của game.**
    **CẤM TUYỆT ĐỐI VỀ VẬT PHẨM TIỀN TỆ:** Đơn vị tiền tệ của thế giới là "${worldConfig.currencyName}". Bạn **TUYỆT ĐỐI KHÔNG** được tạo ra bất kỳ vật phẩm nào có chức năng tương tự tiền tệ (ví dụ: "Linh Thạch Hạ Phẩm", "Túi Vàng", "Ngân Phiếu") bằng tag \`[ITEM_ACQUIRED]\`. Việc này sẽ phá vỡ hệ thống kinh tế của game. Số dư tiền tệ của người chơi đã được quản lý riêng và đã được thiết lập trong tag \`[PLAYER_STATS_INIT]\`.
    *   **Vật phẩm:** Sử dụng tag \\\`[ITEM_ACQUIRED: name="Tên", type="LOẠI CHÍNH + LOẠI PHỤ (NẾU CÓ)", description="Mô tả", quantity=SốLượng, rarity="Độ hiếm", value=GiáTrị, itemRealm="Tên Đại Cảnh Giới Chỉ được là đại cảnh giới của nhân tộc thôi)", ... (các thuộc tính khác tùy loại)]\`\\\`.
        *   \`type\`: Phải bao gồm **Loại Chính** và **Loại Phụ** (nếu có).
            *   **Các Loại Chính Hợp Lệ:** ${Object.values(GameTemplates.ItemCategory).join(' | ')}.
            *   Nếu Loại Chính là \`${GameTemplates.ItemCategory.EQUIPMENT}\`, thì Loại Phụ (\`equipmentType\`) PHẢI LÀ MỘT TRONG CÁC LOẠI TRANG BỊ SAU: ${Object.values(GameTemplates.EquipmentType).join(' | ')}. Ví dụ: \`type="${GameTemplates.ItemCategory.EQUIPMENT} ${GameTemplates.EquipmentType.VU_KHI}"\`. LƯU Ý: "Loại Phụ" cho trang bị (\`equipmentType\`) này KHÁC với "Vị trí trang bị" (\`slot\`). Ví dụ, một vật phẩm có \`equipmentType="${GameTemplates.EquipmentType.VU_KHI}"\` có thể được trang bị vào \`slot="Vũ Khí Chính"\` hoặc \`slot="Vũ Khí Phụ/Khiên"\`. Đừng nhầm lẫn tên vị trí với \`equipmentType\` hợp lệ. Tham số \`equipmentType\` (riêng biệt) CŨNG LÀ BẮT BUỘC cho trang bị. Thuộc tính \`statBonusesJSON\` LÀ BẮT BUỘC (nếu không có, dùng \`statBonusesJSON='{}'\`). Thuộc tính \`uniqueEffectsList\` LÀ BẮT BUỘC (nếu không có, dùng \`uniqueEffectsList="Không có gì đặc biệt"\`).
            *   Nếu Loại Chính là \`${GameTemplates.ItemCategory.POTION}\`, thì Loại Phụ (\`potionType\`) PHẢI LÀ MỘT TRONG CÁC LOẠI ĐAN DƯỢC SAU: ${Object.values(GameTemplates.PotionType).join(' | ')}. Ví dụ: \`type="${GameTemplates.ItemCategory.POTION} ${GameTemplates.PotionType.HOI_PHUC}"\`. **Nếu là đan dược hỗ trợ, tăng cường chỉ số tạm thời, hoặc gây hiệu ứng đặc biệt không phải hồi phục hay giải độc, hãy dùng loại \`${GameTemplates.PotionType.DAC_BIET}\` và mô tả rõ hiệu ứng trong \`effectsList\`**. Tham số \`potionType\` (riêng biệt) CŨNG LÀ BẮT BUỘC cho đan dược.
            *   Nếu Loại Chính là \`${GameTemplates.ItemCategory.MATERIAL}\`, thì Loại Phụ PHẢI LÀ MỘT TRONG CÁC LOẠI NGUYÊN LIỆU SAU: ${Object.values(GameTemplates.MaterialType).join(' | ')}. Ví dụ: \`type="${GameTemplates.ItemCategory.MATERIAL} ${GameTemplates.MaterialType.LINH_THAO}"\`. Tham số \`materialType\` (riêng biệt) CŨNG LÀ BẮT BUỘC cho nguyên liệu.
            *   **Loại mới:** \`${GameTemplates.ItemCategory.CONG_PHAP}\` (Dùng để học Công Pháp), \`${GameTemplates.ItemCategory.LINH_KI}\` (Dùng để học Linh Kĩ), \`${GameTemplates.ItemCategory.PROFESSION_SKILL_BOOK}\` (Học nghề), \`${GameTemplates.ItemCategory.PROFESSION_TOOL}\` (Dụng cụ nghề).
        *   \`itemRealm\`: BẮT BUỘC. Đây là cảnh giới/cấp độ của vật phẩm, quyết định sức mạnh và giá trị của nó. **PHẢI** là một trong các cảnh giới lớn bạn đã tạo trong hệ thống cảnh giới: \`${mainRealms.join(' | ')}\`.
        *   **QUAN TRỌNG về \`statBonusesJSON\` (cho Trang Bị):** LÀ BẮT BUỘC. Phải là một chuỗi JSON hợp lệ. Các khóa trong JSON phải là các thuộc tính của người chơi như: \`maxSinhLuc\`, \`maxLinhLuc\`, \`sucTanCong\`. Ví dụ: \`statBonusesJSON='{"sucTanCong": 10, "maxSinhLuc": 50}'\`. **Nếu không có chỉ số cộng thêm, PHẢI ĐỂ LÀ \`statBonusesJSON='{}'\`.**
        *   **QUAN TRỌNG về \`uniqueEffectsList\` (cho Trang Bị):** LÀ BẮT BUỘC. Danh sách hiệu ứng đặc biệt, cách nhau bởi dấu ';'. Ví dụ: \`uniqueEffectsList="Hút máu 5%;Tăng tốc"\`. **Nếu không có hiệu ứng đặc biệt, PHẢI ĐỂ LÀ \`uniqueEffectsList="Không có gì đặc biệt"\`.**
        *   **Tham số cho Loại Mới:**
            *   Đối với \`${GameTemplates.ItemCategory.CONG_PHAP}\`, thêm \`congPhapType="${Object.values(GameTemplates.CongPhapType).join('|')}"\` và \`expBonusPercentage=X\` (số nguyên, % kinh nghiệm tu luyện được cộng thêm).
            *   Đối với \`${GameTemplates.ItemCategory.LINH_KI}\`, thêm \`skillToLearnJSON='{"name":"Tên Skill", "description":"Mô tả", "skillType":"Linh Kĩ", "detailedEffect":"Hiệu ứng chi tiết", ...}'\`. JSON phải hợp lệ.
            *   Đối với \`${GameTemplates.ItemCategory.PROFESSION_SKILL_BOOK}\`, thêm \`professionToLearn="${Object.values(GameTemplates.ProfessionType).join('|')}"\`.
            *   Đối với \`${GameTemplates.ItemCategory.PROFESSION_TOOL}\`, thêm \`professionRequired="${Object.values(GameTemplates.ProfessionType).join('|')}"\`.
        *   Ví dụ hoàn chỉnh cho trang bị: \\\`[ITEM_ACQUIRED: name="Trường Kiếm Sắt", type="${GameTemplates.ItemCategory.EQUIPMENT} ${GameTemplates.EquipmentType.VU_KHI}", equipmentType="${GameTemplates.EquipmentType.VU_KHI}", description="Một thanh trường kiếm bằng sắt rèn.", statBonusesJSON='{"sucTanCong": 5}', uniqueEffectsList="Không có gì đặc biệt", quantity=1, rarity="Phổ Thông", value=10, itemRealm="Phàm Nhân", slot="Vũ Khí Chính"]\`\\\`.
        ${worldConfig.startingItems && worldConfig.startingItems.map(item => `[ITEM_ACQUIRED: name="${item.name.replace(/"/g, '\\"')}",type="${item.aiPreliminaryType || (item.category + (item.equipmentDetails?.type ? ' ' + item.equipmentDetails.type : item.potionDetails?.type ? ' ' + item.potionDetails.type : item.materialDetails?.type ? ' ' + item.materialDetails.type : ''))}",description="${item.description.replace(/"/g, '\\"')}",quantity=${item.quantity}, rarity="${item.rarity || 'Phổ Thông'}", value=${item.value || 0}, itemRealm="${item.itemRealm || 'Phàm Nhân'}"${item.equipmentDetails?.type ? `, equipmentType="${item.equipmentDetails.type}"` : ''}${item.equipmentDetails?.statBonusesString ? `, statBonusesJSON='${item.equipmentDetails.statBonusesString.replace(/'/g, '"')}'` : (item.category === GameTemplates.ItemCategory.EQUIPMENT ? `, statBonusesJSON='{}'` : '')}${item.equipmentDetails?.uniqueEffectsString ? `, uniqueEffectsList="${item.equipmentDetails.uniqueEffectsString.replace(/"/g, '\\"')}"` : (item.category === GameTemplates.ItemCategory.EQUIPMENT ? `, uniqueEffectsList="Không có gì đặc biệt"` : '')}${item.equipmentDetails?.slot ? `, slot="${item.equipmentDetails.slot.replace(/"/g, '\\"')}"` : ''}${item.potionDetails?.type ? `, potionType="${item.potionDetails.type}"` : ''}${item.potionDetails?.effectsString ? `, effectsList="${item.potionDetails.effectsString.replace(/"/g, '\\"')}"` : ''}${item.materialDetails?.type ? `, materialType="${item.materialDetails.type}"` : ''}]`).join('\n')}
    *   **Kỹ năng:** Sử dụng tag \\\`[SKILL_LEARNED: ...]\`\\\`. Cung cấp đầy đủ các thuộc tính dựa trên \`skillType\`.
        - **Thuộc tính chung (BẮT BUỘC cho mọi loại):** \`name\`, \`description\`, \`skillType="CHỌN MỘT TRONG: ${Object.values(GameTemplates.SkillType).join(' | ')}"\`.
        - **Nếu \`skillType="${GameTemplates.SkillType.CONG_PHAP_TU_LUYEN}"\`:**
            - Cần thêm: \`congPhapType="(${Object.values(GameTemplates.CongPhapType).join('|')})"\`, \`congPhapGrade="(${GameTemplates.CONG_PHAP_GRADES.join('|')})"\`.
            - Nếu \`congPhapType="${GameTemplates.CongPhapType.VO_Y}"\`, thêm \`weaponFocus="(${WEAPON_TYPES_FOR_VO_Y.join('|')})"\`.
            - Ví dụ: \\\`[SKILL_LEARNED: name="Kim Cang Quyết", description="Một công pháp luyện thể sơ cấp.", skillType="${GameTemplates.SkillType.CONG_PHAP_TU_LUYEN}", congPhapType="Thể Tu", congPhapGrade="Hoàng Phẩm"]\`\\\`
        - **Nếu \`skillType="${GameTemplates.SkillType.LINH_KI}"\`:**
            - Cần thêm: \`linhKiCategory="(${GameTemplates.LINH_KI_CATEGORIES.join('|')})"\`, \`linhKiActivation="(${GameTemplates.LINH_KI_ACTIVATION_TYPES.join('|')})"\`.
            - Nếu \`linhKiActivation="Chủ động"\`, thêm các thuộc tính chiến đấu.
            - Ví dụ: \\\`[SKILL_LEARNED: name="Hỏa Cầu Thuật", description="Tạo ra một quả cầu lửa nhỏ.", skillType="${GameTemplates.SkillType.LINH_KI}", linhKiCategory="Tấn công", linhKiActivation="Chủ động", manaCost=10, cooldown=1, baseDamage=20, otherEffects="Gây hiệu ứng Bỏng trong 2 lượt"]\`\\\`
        - **Nếu \`skillType="${GameTemplates.SkillType.THAN_THONG}"\`:**
            - Thêm các thuộc tính chiến đấu. Thần Thông thường rất mạnh, hiếm có, hồi chiêu dài.
            - Ví dụ: \\\`[SKILL_LEARNED: name="Thiên Lý Nhãn", description="Tăng cường thị lực, nhìn xa vạn dặm.", skillType="${GameTemplates.SkillType.THAN_THONG}", manaCost=50, cooldown=10, otherEffects="Phát hiện kẻ địch ẩn thân trong phạm vi 1km"]\`\\\`
        - **Nếu \`skillType="${GameTemplates.SkillType.CAM_THUAT}"\`:**
            - Cần thêm: \`sideEffects="Mô tả tác dụng phụ, ví dụ: giảm 20% sinh lực tối đa vĩnh viễn..."\`.
            - Thêm các thuộc tính chiến đấu. Cấm Thuật phải có cái giá rất đắt.
            - Ví dụ: \\\`[SKILL_LEARNED: name="Huyết Tế Đại Pháp", description="Hi sinh máu tươi để nhận sức mạnh.", skillType="${GameTemplates.SkillType.CAM_THUAT}", sideEffects="Mất 20% sinh lực tối đa vĩnh viễn sau mỗi lần sử dụng.", manaCost=0, cooldown=100, otherEffects="Tăng 100% Sức Tấn Công trong 5 lượt"]\`\\\`
        - **Nếu \`skillType="${GameTemplates.SkillType.NGHE_NGHIEP}"\`:**
            - Cần thêm: \`professionType="(${Object.values(GameTemplates.ProfessionType).join('|')})"\`, \`skillDescription="Mô tả kỹ năng nghề đó làm được gì cụ thể."\`, \`professionGrade="(${GameTemplates.PROFESSION_GRADES.join('|')})"\`.
            - Ví dụ: \\\`[SKILL_LEARNED: name="Sơ Cấp Luyện Đan", description="Kiến thức cơ bản về luyện đan.", skillType="${GameTemplates.SkillType.NGHE_NGHIEP}", professionType="Luyện Đan Sư", skillDescription="Có thể luyện chế các loại đan dược phẩm cấp thấp.", professionGrade="Nhất phẩm"]\`\\\`
        - **Thuộc tính chiến đấu chung (cho Linh Kĩ, Thần Thông, Cấm Thuật):** \`manaCost=SỐ\`, \`cooldown=SỐ\`, \`baseDamage=SỐ\`, \`baseHealing=SỐ\`, \`damageMultiplier=SỐ_THẬP_PHÂN\`, \`healingMultiplier=SỐ_THẬP_PHÂN\`, \`otherEffects="Hiệu ứng 1;Hiệu ứng 2"\`.
        - **Lưu ý:** Thuộc tính \`effect\` cũ giờ được thay thế bằng \`otherEffects\` và các thuộc tính chi tiết hơn.
    *   **NPC:** Sử dụng tag \\\`[NPC: name="Tên NPC", gender="Nam/Nữ/Khác/Không rõ", race="Chủng tộc (ví dụ: Nhân Tộc, Yêu Tộc)", description="Mô tả chi tiết", personality="Tính cách", affinity=Số, factionId="ID Phe (nếu có)", realm="Cảnh giới NPC (nếu có)", tuChat="CHỌN MỘT TRONG: ${TU_CHAT_TIERS.join(' | ')}" (TÙY CHỌN, nếu NPC có tu luyện), relationshipToPlayer="Mối quan hệ", spiritualRoot="Linh căn của NPC (nếu có)", specialPhysique="Thể chất của NPC (nếu có)", statsJSON='{"thoNguyen": X, "maxThoNguyen": Y}']\`\\\`.
        ${worldConfig.startingNPCs && worldConfig.startingNPCs.map(npc => `[NPC: name="${npc.name.replace(/"/g, '\\"')}", gender="${npc.gender || 'Không rõ'}", race="${npc.race || 'Nhân Tộc'}", description="Chi tiết: ${npc.details.replace(/"/g, '\\"')}", personality="${npc.personality.replace(/"/g, '\\"')}", affinity=${npc.initialAffinity}${isCultivationEnabled && npc.realm ? `, realm="${npc.realm}"` : ''}${isCultivationEnabled && npc.tuChat ? `, tuChat="${npc.tuChat}"` : ''}${npc.relationshipToPlayer ? `, relationshipToPlayer="${npc.relationshipToPlayer.replace(/"/g, '\\"')}"` : ''}${isCultivationEnabled && npc.spiritualRoot ? `, spiritualRoot="${npc.spiritualRoot}"` : ''}${isCultivationEnabled && npc.specialPhysique ? `, specialPhysique="${npc.specialPhysique}"` : ''}${isCultivationEnabled && npc.thoNguyen && npc.maxThoNguyen ? `, statsJSON='{"thoNguyen":${npc.thoNguyen}, "maxThoNguyen":${npc.maxThoNguyen}}'` : ''}]`).join('\n')}
    *   **Yêu Thú:** Sử dụng tag \\\`[YEUTHU: name="Tên", species="Loài", description="Mô tả", isHostile=true/false, realm="Cảnh giới (nếu có)"]\`\\\`.
        ${worldConfig.startingYeuThu && worldConfig.startingYeuThu.map(yt => `[YEUTHU: name="${yt.name.replace(/"/g, '\\"')}", species="${yt.species.replace(/"/g, '\\"')}", description="${yt.description.replace(/"/g, '\\"')}", isHostile=${yt.isHostile}${yt.realm ? `, realm="${yt.realm}"` : ''}]`).join('\n')}
    *   **Địa Điểm Chính (Top-level):** Sử dụng tag \\\`[MAINLOCATION: name="Tên Địa Điểm", description="Mô tả chi tiết về địa điểm.", locationType="CHỌN MỘT TRONG: ${Object.values(GameTemplates.LocationType).join(' | ')}", isSafeZone=true/false, regionId="ID Vùng (nếu có)", mapX=X (số, 0-1000, tùy chọn), mapY=Y (số, 0-1000, tùy chọn)]\`\\\`. **CẤM SỬ DỤNG TAG** \\\`[SUBLOCATION]\`\\\` **TRONG PHẢN HỒI NÀY.**
        ${worldConfig.startingLocations && worldConfig.startingLocations.map(loc => `[MAINLOCATION: name="${loc.name.replace(/"/g, '\\"')}", description="${loc.description.replace(/"/g, '\\"')}", locationType="${loc.locationType || GameTemplates.LocationType.DEFAULT}", isSafeZone=${loc.isSafeZone || false}${loc.regionId ? `, regionId="${loc.regionId.replace(/"/g, '\\"')}"` : ''}${loc.mapX !== undefined ? `, mapX=${loc.mapX}`:''}${loc.mapY !== undefined ? `, mapY=${loc.mapY}`:''}]`).join('\n')}
    *   **Phe phái:** Nếu có phe phái khởi đầu, sử dụng tag \\\`[FACTION_DISCOVERED: name="Tên Phe Phái", description="Mô tả", alignment="Chính Nghĩa/Trung Lập/Tà Ác/Hỗn Loạn", playerReputation=Số]\\\`.
        ${worldConfig.startingFactions && worldConfig.startingFactions.map(fac => `[FACTION_DISCOVERED: name="${fac.name.replace(/"/g, '\\"')}", description="${fac.description.replace(/"/g, '\\"')}", alignment="${fac.alignment}", playerReputation=${fac.initialPlayerReputation}]`).join('\n')}
    *   **Tri Thức Thế Giới:** Sử dụng tag \\\`[WORLD_LORE_ADD: title="Tiêu đề Lore",content="Nội dung chi tiết của Lore"]\`\\\`.
        ${worldConfig.startingLore && worldConfig.startingLore.map(lore => `[WORLD_LORE_ADD: title="${lore.title.replace(/"/g, '\\"')}",content="${lore.content.replace(/"/g, '\\"')}"]`).join('\n')}
    LƯU Ý: Với kỹ năng, \\\`effect\\\` phải mô tả rõ hiệu ứng để game xử lý. Với NPC, \\\`description\\\` nên bao gồm thông tin về tính cách, vai trò. \\\`affinity\\\` là một số từ -100 đến 100.
    **QUAN TRỌNG:** Bất cứ khi nào nhân vật học được một kỹ năng mới, BẮT BUỘC phải sử dụng tag \\\`[SKILL_LEARNED]\`\\\` với đầy đủ thông tin nhất có thể.

**QUY TẮC SỬ DỤNG TAGS (CHUNG CHO MỌI LƯỢT KỂ TIẾP THEO, BAO GỒM CẢ LƯỢT ĐẦU TIÊN NÀY SAU KHI KHỞI TẠO):**
${continuePromptSystemRules(worldConfig, mainRealms, aiContextConfig)}

**BỐI CẢNH KHỞI ĐẦU:**
Người chơi sẽ bắt đầu cuộc phiêu lưu tại địa điểm: "${worldConfig.startingLocations?.[0]?.name || 'một nơi vô định'}".
Hãy bắt đầu lời kể của bạn bằng cách mô tả cảnh vật và tình huống của nhân vật tại địa điểm khởi đầu này, tuân thủ **MỆNH LỆNH TỐI THƯỢNG: PHONG CÁCH KỂ CHUYỆN**.

**TIẾP TỤC CÂU CHUYỆN:** Dựa trên **HƯỚNG DẪN TỪ NGƯỜI CHƠI**, **ĐỘ DÀI PHẢN HỒI MONG MUỐN** và **TOÀN BỘ BỐI CẢNH GAME**, hãy tiếp tục câu chuyện cho thể loại "${effectiveGenre}". Mô tả kết quả, cập nhật trạng thái game bằng tags, và cung cấp các lựa chọn hành động mới (theo định dạng đã hướng dẫn ở mục 17). Và đưa ra ít nhất một nhiệm vụ khởi đầu dựa trên mục tiêu của nhân vật.
`;
};